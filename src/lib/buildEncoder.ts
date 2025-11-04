import pako from 'pako';
import type { BuildData } from '../types/gw2';

// Profession enum (3 bits, 0-8)
const PROFESSIONS = ['Guardian', 'Warrior', 'Engineer', 'Ranger', 'Thief', 'Elementalist', 'Mesmer', 'Necromancer', 'Revenant'];
// Game mode enum (2 bits, 0-2)
const GAME_MODES = ['PvE', 'PvP', 'WvW'];
// Equipment slots (4 bits, 0-15)
const SLOTS = ['Helm', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots', 'Amulet', 'Ring1', 'Ring2', 'Accessory1', 'Accessory2', 'Backpack', 'MainHand1', 'OffHand1', 'MainHand2', 'OffHand2'];

/**
 * Convert Uint8Array to base64 string efficiently
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Write variable-length integer (uses fewer bytes for smaller numbers)
 */
function writeVarInt(arr: number[], value: number) {
  if (value === 0 || value === undefined || value === null) {
    arr.push(0);
    return;
  }
  while (value > 0) {
    let byte = value & 0x7F;
    value >>>= 7;
    if (value > 0) byte |= 0x80;
    arr.push(byte);
  }
}

/**
 * Read variable-length integer
 */
function readVarInt(bytes: Uint8Array, offset: { value: number }): number {
  let result = 0;
  let shift = 0;
  while (true) {
    const byte = bytes[offset.value++];
    result |= (byte & 0x7F) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return result;
}

/**
 * Write string as length-prefixed UTF-8
 */
function writeString(arr: number[], str: string) {
  if (!str) {
    arr.push(0);
    return;
  }
  const bytes = new TextEncoder().encode(str);
  writeVarInt(arr, bytes.length);
  arr.push(...bytes);
}

/**
 * Read length-prefixed UTF-8 string
 */
function readString(bytes: Uint8Array, offset: { value: number }): string {
  const len = readVarInt(bytes, offset);
  if (len === 0) return '';
  const str = new TextDecoder().decode(bytes.slice(offset.value, offset.value + len));
  offset.value += len;
  return str;
}

/**
 * Encode build data to a compact binary format
 */
export function encodeBuild(build: BuildData): string {
  try {
    const bytes: number[] = [];

    // Version byte for future compatibility
    bytes.push(2);

    // Profession (3 bits) + GameMode (2 bits) = 1 byte
    const profIdx = PROFESSIONS.indexOf(build.profession);
    const modeIdx = GAME_MODES.indexOf(build.gameMode);
    bytes.push((profIdx << 2) | modeIdx);

    // Equipment count
    bytes.push(build.equipment.length);
    for (const eq of build.equipment) {
      const slotIdx = SLOTS.indexOf(eq.slot);
      bytes.push(slotIdx);
      writeString(bytes, eq.stat);
      writeString(bytes, eq.weaponType || '');
      writeString(bytes, eq.upgrade || '');
      writeVarInt(bytes, eq.sigil1Id || 0);
      writeVarInt(bytes, eq.sigil2Id || 0);
      writeString(bytes, eq.infusion1 || '');
      writeString(bytes, eq.infusion2 || '');
      writeString(bytes, eq.infusion3 || '');
    }

    // Skills - write as array of IDs
    const skillSlots = ['heal', 'utility1', 'utility2', 'utility3', 'elite'] as const;
    for (const slot of skillSlots) {
      writeVarInt(bytes, build.skills[slot] || 0);
    }

    // Traits
    writeVarInt(bytes, build.traits.spec1 || 0);
    const spec1Choices = build.traits.spec1Choices || [null, null, null];
    for (const choice of spec1Choices) {
      writeVarInt(bytes, choice || 0);
    }

    writeVarInt(bytes, build.traits.spec2 || 0);
    const spec2Choices = build.traits.spec2Choices || [null, null, null];
    for (const choice of spec2Choices) {
      writeVarInt(bytes, choice || 0);
    }

    writeVarInt(bytes, build.traits.spec3 || 0);
    const spec3Choices = build.traits.spec3Choices || [null, null, null];
    for (const choice of spec3Choices) {
      writeVarInt(bytes, choice || 0);
    }

    // Rune and Relic
    writeVarInt(bytes, build.runeId || 0);
    writeVarInt(bytes, build.relicId || 0);

    const binary = new Uint8Array(bytes);
    const compressed = pako.deflate(binary, { level: 9 });
    const base64 = uint8ArrayToBase64(compressed);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (error) {
    console.error('Failed to encode build:', error);
    throw error;
  }
}

/**
 * Decode build data from a URL-safe base64 string
 */
export function decodeBuild(encoded: string): BuildData {
  try {
    // Restore standard base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const decompressed = pako.inflate(bytes);

    // Check version byte
    if (decompressed[0] === 2) {
      // New binary format (version 2)
      const offset = { value: 1 };

      // Read profession + game mode
      const packed = decompressed[offset.value++];
      const profIdx = (packed >> 2) & 0x07;
      const modeIdx = packed & 0x03;

      const build: BuildData = {
        profession: PROFESSIONS[profIdx] as any,
        gameMode: GAME_MODES[modeIdx] as any,
        equipment: [],
        skills: {},
        traits: {},
      };

      // Read equipment
      const eqCount = decompressed[offset.value++];
      for (let i = 0; i < eqCount; i++) {
        const slotIdx = decompressed[offset.value++];
        const stat = readString(decompressed, offset);
        const weaponType = readString(decompressed, offset);
        const upgrade = readString(decompressed, offset);
        const sigil1Id = readVarInt(decompressed, offset);
        const sigil2Id = readVarInt(decompressed, offset);
        const infusion1 = readString(decompressed, offset);
        const infusion2 = readString(decompressed, offset);
        const infusion3 = readString(decompressed, offset);

        build.equipment.push({
          slot: SLOTS[slotIdx] as any,
          stat: stat as any,
          ...(weaponType && { weaponType: weaponType as any }),
          ...(upgrade && { upgrade }),
          ...(sigil1Id && { sigil1Id }),
          ...(sigil2Id && { sigil2Id }),
          ...(infusion1 && { infusion1 }),
          ...(infusion2 && { infusion2 }),
          ...(infusion3 && { infusion3 }),
        } as any);
      }

      // Read skills
      const skillSlots = ['heal', 'utility1', 'utility2', 'utility3', 'elite'] as const;
      for (const slot of skillSlots) {
        const id = readVarInt(decompressed, offset);
        if (id) build.skills[slot] = id;
      }

      // Read traits
      build.traits.spec1 = readVarInt(decompressed, offset) || undefined;
      build.traits.spec1Choices = [
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
      ];

      build.traits.spec2 = readVarInt(decompressed, offset) || undefined;
      build.traits.spec2Choices = [
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
      ];

      build.traits.spec3 = readVarInt(decompressed, offset) || undefined;
      build.traits.spec3Choices = [
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
        readVarInt(decompressed, offset) || null,
      ];

      // Read rune and relic
      const runeId = readVarInt(decompressed, offset);
      const relicId = readVarInt(decompressed, offset);
      if (runeId) build.runeId = runeId;
      if (relicId) build.relicId = relicId;

      return build;
    } else {
      // Old JSON format (version 1 or legacy)
      const decompressedStr = pako.inflate(bytes, { to: 'string' });
      const parsed = JSON.parse(decompressedStr);

      // Check if it's the compact JSON format (version 1)
      if (parsed.p !== undefined) {
        return {
          profession: parsed.p,
          gameMode: parsed.g,
          equipment: parsed.e.map((eq: any) => ({
            slot: eq.s,
            stat: eq.st,
            ...(eq.w && { weaponType: eq.w }),
            ...(eq.u && { upgrade: eq.u }),
            ...(eq.s1 && { sigil1Id: eq.s1 }),
            ...(eq.s2 && { sigil2Id: eq.s2 }),
            ...(eq.i1 && { infusion1: eq.i1 }),
            ...(eq.i2 && { infusion2: eq.i2 }),
            ...(eq.i3 && { infusion3: eq.i3 }),
          })),
          skills: parsed.sk,
          traits: parsed.t,
          ...(parsed.r && { runeId: parsed.r }),
          ...(parsed.rl && { relicId: parsed.rl }),
        };
      }

      // Legacy full JSON format
      return parsed;
    }
  } catch (error) {
    console.error('Failed to decode build:', error);
    throw error;
  }
}

/**
 * Encode build as human-readable query params
 */
export async function encodeHumanReadable(build: BuildData): Promise<string> {
  // Gear: use binary encoding for compactness (FIRST param for readability)
  const gearData = {
    e: build.equipment,
    ...(build.runeId && { r: build.runeId }),
    ...(build.relicId && { rl: build.relicId }),
  };
  const gearJson = JSON.stringify(gearData);
  const gearCompressed = pako.deflate(gearJson, { level: 9 });
  const gearB64 = uint8ArrayToBase64(gearCompressed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const params = new URLSearchParams();
  params.set('g', gearB64);

  // Profession: 1-9
  const profIndex = PROFESSIONS.indexOf(build.profession) + 1;
  params.set('c', profIndex.toString());

  // Game mode: 0=PvE, 1=PvP, 2=WvW
  const modeIndex = GAME_MODES.indexOf(build.gameMode);
  params.set('m', modeIndex.toString());

  // Traits: encode as spec_tbm where t/m/b = top/mid/bot trait choice
  const traits: string[] = [];
  const { gw2Api } = await import('./gw2api');

  for (const specNum of [1, 2, 3] as const) {
    const specIdKey = `spec${specNum}` as const;
    const choicesKey = `spec${specNum}Choices` as const;
    const specId = build.traits[specIdKey];
    const choices = build.traits[choicesKey] || [null, null, null];

    if (specId) {
      traits.push(specId.toString());

      // Fetch spec data to get trait order
      const specTraits = await gw2Api.getTraits(specId);
      const spec = await gw2Api.getSpecialization(specId);
      const majorTraits = specTraits.filter(t => spec.major_traits.includes(t.id));

      // Get traits organized by tier and order
      const traitsByTier = [1, 2, 3].map(tier => {
        const tierTraits = majorTraits.filter(t => t.tier === tier);
        return tierTraits.sort((a, b) => a.order - b.order);
      });

      // Encode choices as t/m/b (top/mid/bot)
      const choiceLetters = choices.map((traitId, tierIndex) => {
        if (!traitId) return '-';
        const tierTraits = traitsByTier[tierIndex];
        const position = tierTraits.findIndex(t => t.id === traitId);
        return position === 0 ? 't' : position === 1 ? 'm' : position === 2 ? 'b' : '-';
      }).join('');

      traits.push(choiceLetters);
    }
  }
  if (traits.length) params.set('t', traits.join('_'));

  // Skills: heal_util1_util2_util3_elite
  const skills = [
    build.skills.heal,
    build.skills.utility1,
    build.skills.utility2,
    build.skills.utility3,
    build.skills.elite
  ].filter(Boolean).join('_');
  if (skills) params.set('s', skills);

  return params.toString();
}

/**
 * Decode human-readable query params
 */
export async function decodeHumanReadable(params: URLSearchParams): Promise<BuildData> {
  // Profession
  const profIndex = parseInt(params.get('c') || '1') - 1;
  const profession = PROFESSIONS[profIndex] as any;

  // Game mode
  const modeIndex = parseInt(params.get('m') || '0');
  const gameMode = GAME_MODES[modeIndex] as any;

  // Skills
  const skillsStr = params.get('s') || '';
  const skillIds = skillsStr.split('_').filter(Boolean).map(Number);
  const skills: any = {};
  if (skillIds[0]) skills.heal = skillIds[0];
  if (skillIds[1]) skills.utility1 = skillIds[1];
  if (skillIds[2]) skills.utility2 = skillIds[2];
  if (skillIds[3]) skills.utility3 = skillIds[3];
  if (skillIds[4]) skills.elite = skillIds[4];

  // Traits: decode from spec_tbm format
  const traitsStr = params.get('t') || '';
  const traitsParts = traitsStr.split('_').filter(Boolean);
  const traits: any = {};
  const { gw2Api } = await import('./gw2api');

  // Process traits in pairs: specId, choiceLetters
  for (let i = 0; i < traitsParts.length; i += 2) {
    const specId = parseInt(traitsParts[i]);
    const choiceLetters = traitsParts[i + 1];

    if (specId && choiceLetters) {
      // Fetch spec data to map positions to trait IDs
      const specTraits = await gw2Api.getTraits(specId);
      const spec = await gw2Api.getSpecialization(specId);
      const majorTraits = specTraits.filter(t => spec.major_traits.includes(t.id));

      // Get traits organized by tier and order
      const traitsByTier = [1, 2, 3].map(tier => {
        const tierTraits = majorTraits.filter(t => t.tier === tier);
        return tierTraits.sort((a, b) => a.order - b.order);
      });

      // Decode t/m/b letters to trait IDs
      const choices: (number | null)[] = choiceLetters.split('').map((letter, tierIndex) => {
        if (letter === '-') return null;
        const tierTraits = traitsByTier[tierIndex];
        const position = letter === 't' ? 0 : letter === 'm' ? 1 : letter === 'b' ? 2 : -1;
        return position >= 0 && tierTraits[position] ? tierTraits[position].id : null;
      });

      // Assign to appropriate spec slot
      const specNum = i / 2 + 1;
      if (specNum === 1) {
        traits.spec1 = specId;
        traits.spec1Choices = choices;
      } else if (specNum === 2) {
        traits.spec2 = specId;
        traits.spec2Choices = choices;
      } else if (specNum === 3) {
        traits.spec3 = specId;
        traits.spec3Choices = choices;
      }
    }
  }

  // Gear
  const gearB64 = (params.get('g') || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = gearB64 + '='.repeat((4 - (gearB64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: 'string' });
  const gearData = JSON.parse(decompressed);

  return {
    profession,
    gameMode,
    equipment: gearData.e || [],
    skills,
    traits,
    ...(gearData.r && { runeId: gearData.r }),
    ...(gearData.rl && { relicId: gearData.rl }),
  };
}

export type BuildUrlFormat = 'compressed' | 'readable';

/**
 * Get shareable URL for current build
 */
export async function getShareableUrl(build: BuildData, format: BuildUrlFormat = 'compressed'): Promise<string> {
  const url = new URL(window.location.href);

  if (format === 'readable') {
    // Clear old params and set new ones
    url.search = '';
    const encoded = await encodeHumanReadable(build);
    url.search = encoded;
  } else {
    // Compressed format
    const encoded = encodeBuild(build);
    url.searchParams.set('build', encoded);
  }

  return url.toString();
}

/**
 * Load build from URL if present
 */
export async function loadBuildFromUrl(): Promise<BuildData | null> {
  try {
    const params = new URLSearchParams(window.location.search);

    // Check for human-readable format (has 'c' param instead of 'build')
    if (params.has('c')) {
      return await decodeHumanReadable(params);
    }

    // Check for compressed format
    const buildParam = params.get('build');
    if (buildParam) {
      return decodeBuild(buildParam);
    }
  } catch (error) {
    console.error('Failed to load build from URL:', error);
  }
  return null;
}
