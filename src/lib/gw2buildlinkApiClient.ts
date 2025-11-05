import type { Gw2ApiClient, ProfessionSummary, ProfessionDetails, SpecializationData, TraitSelectionInput, DecodedLegend, DecodedWeapon, SkillInput } from 'gw2buildlink';
import { gw2Api } from './gw2api';

/**
 * Custom API client for gw2buildlink that uses our local static data
 * instead of making external API calls (which fail due to CORS in browser)
 */
export class LocalGw2ApiClient implements Gw2ApiClient {
  private professionDetailsCache: Map<string, ProfessionDetails> = new Map();

  async resolveProfession(profession: number | string): Promise<ProfessionSummary> {
    // Map profession names/IDs to the format expected by gw2buildlink
    const professionMap: Record<string, { id: string; name: string; code: number }> = {
      'Guardian': { id: 'Guardian', name: 'Guardian', code: 1 },
      '1': { id: 'Guardian', name: 'Guardian', code: 1 },
      'Warrior': { id: 'Warrior', name: 'Warrior', code: 2 },
      '2': { id: 'Warrior', name: 'Warrior', code: 2 },
      'Engineer': { id: 'Engineer', name: 'Engineer', code: 3 },
      '3': { id: 'Engineer', name: 'Engineer', code: 3 },
      'Ranger': { id: 'Ranger', name: 'Ranger', code: 4 },
      '4': { id: 'Ranger', name: 'Ranger', code: 4 },
      'Thief': { id: 'Thief', name: 'Thief', code: 5 },
      '5': { id: 'Thief', name: 'Thief', code: 5 },
      'Elementalist': { id: 'Elementalist', name: 'Elementalist', code: 6 },
      '6': { id: 'Elementalist', name: 'Elementalist', code: 6 },
      'Mesmer': { id: 'Mesmer', name: 'Mesmer', code: 7 },
      '7': { id: 'Mesmer', name: 'Mesmer', code: 7 },
      'Necromancer': { id: 'Necromancer', name: 'Necromancer', code: 8 },
      '8': { id: 'Necromancer', name: 'Necromancer', code: 8 },
      'Revenant': { id: 'Revenant', name: 'Revenant', code: 9 },
      '9': { id: 'Revenant', name: 'Revenant', code: 9 },
    };

    const key = String(profession).toLowerCase();
    const result = professionMap[profession] || professionMap[key];
    if (!result) {
      throw new Error(`Unknown profession: ${profession}`);
    }
    return result;
  }

  async getProfessionDetails(id: string): Promise<ProfessionDetails> {
    console.log(`getProfessionDetails called for: ${id}`);
    const cached = this.professionDetailsCache.get(id);
    if (cached) {
      console.log(`Returning cached profession details for ${id}`);
      return cached;
    }

    // Fetch profession data from GW2 API to get palette mappings
    try {
      const response = await fetch(`https://api.guildwars2.com/v2/professions/${id}?v=latest`);
      if (!response.ok) {
        throw new Error(`Failed to fetch profession data: ${response.statusText}`);
      }

      const profData = await response.json();
      console.log(`Fetched profession data for ${id}, skills_by_palette length:`, profData.skills_by_palette?.length);

      const paletteById = new Map<number, { skillId: number; name?: string }>();
      const paletteBySkillId = new Map<number, number>();

      // skills_by_palette is an array of [paletteId, skillId] pairs
      if (profData.skills_by_palette && Array.isArray(profData.skills_by_palette)) {
        for (const [paletteId, skillId] of profData.skills_by_palette) {
          paletteById.set(paletteId, { skillId });
          paletteBySkillId.set(skillId, paletteId);
        }
        console.log(`Loaded ${paletteById.size} palette mappings for ${id}`);
      }

      const details: ProfessionDetails = {
        id,
        code: await this.resolveProfession(id).then(p => p.code),
        name: id,
        paletteById,
        paletteBySkillId,
      };

      this.professionDetailsCache.set(id, details);
      return details;
    } catch (error) {
      console.error(`Error loading profession details for ${id}:`, error);
      // Return empty palette maps as fallback
      const details: ProfessionDetails = {
        id,
        code: await this.resolveProfession(id).then(p => p.code),
        name: id,
        paletteById: new Map(),
        paletteBySkillId: new Map(),
      };
      return details;
    }
  }

  async resolveSpecialization(input: number | string): Promise<SpecializationData> {
    const specId = typeof input === 'string' ? parseInt(input, 10) : input;
    const spec = await gw2Api.getSpecialization(specId);

    return {
      id: spec.id,
      name: spec.name,
      profession: spec.profession,
      major_traits: spec.major_traits,
    };
  }

  async resolveTraitChoices(
    spec: SpecializationData,
    traits: [TraitSelectionInput?, TraitSelectionInput?, TraitSelectionInput?] | undefined
  ): Promise<[number, number, number]> {
    console.log(`resolveTraitChoices called for spec ${spec.id} (${spec.name}), traits:`, traits);

    if (!traits) return [0, 0, 0];

    const result: [number, number, number] = [0, 0, 0];

    // Get all traits for this spec to determine the order
    const allTraits = await gw2Api.getTraits(spec.id);
    const majorTraits = allTraits.filter(t => spec.major_traits.includes(t.id));

    // Organize by tier and order
    const traitsByTier = [1, 2, 3].map(tier => {
      const tierTraits = majorTraits.filter(t => t.tier === tier);
      return tierTraits.sort((a, b) => a.order - b.order);
    });

    console.log('Traits by tier:', traitsByTier.map((tier, i) =>
      `Tier ${i+1}: ${tier.map(t => `${t.id}(${t.name})`).join(', ')}`
    ));

    for (let i = 0; i < 3; i++) {
      const trait = traits[i];
      if (!trait) {
        result[i] = 0;
        continue;
      }

      if (typeof trait === 'number') {
        // This is a trait ID - find its position in the tier (1, 2, or 3)
        const tierTraits = traitsByTier[i];
        const position = tierTraits.findIndex(t => t.id === trait);

        if (position >= 0) {
          // Position is 0-indexed, but choices are 1-indexed
          result[i] = position + 1;
          console.log(`Trait ${trait} in tier ${i+1} is at position ${position + 1}`);
        } else {
          console.warn(`Trait ${trait} not found in tier ${i+1} for spec ${spec.id}`);
          result[i] = 0;
        }
      } else {
        // Try to resolve trait name to ID
        const found = majorTraits.find(t => t.name.toLowerCase() === String(trait).toLowerCase());
        if (found) {
          const tierTraits = traitsByTier[i];
          const position = tierTraits.findIndex(t => t.id === found.id);
          result[i] = position >= 0 ? position + 1 : 0;
          console.log(`Trait name "${trait}" resolved to ID ${found.id}, position ${result[i]}`);
        } else {
          console.warn(`Trait name "${trait}" not found in spec ${spec.id}`);
          result[i] = 0;
        }
      }
    }

    console.log(`resolveTraitChoices result:`, result);
    return result;
  }

  async resolveSkillPalette(professionId: string, value: SkillInput): Promise<{
    paletteId: number;
    skillId?: number;
    name?: string;
  }> {
    console.log(`resolveSkillPalette called with profession=${professionId}, value=${value}, type=${typeof value}`);

    if (!value) {
      return { paletteId: 0 };
    }

    // Get profession details to access palette mappings
    const profDetails = await this.getProfessionDetails(professionId);

    if (typeof value === 'number') {
      // The value could be either a skill ID (when encoding) or palette ID (when decoding)
      // Try to look up as skill ID first (for encoding)
      const paletteId = profDetails.paletteBySkillId.get(value);

      if (paletteId !== undefined) {
        // Found palette ID for this skill ID
        try {
          const skill = await gw2Api.getSkill(value);
          console.log(`Resolved skill ID ${value} to palette ${paletteId}:`, skill.name);
          return {
            paletteId,
            skillId: value,
            name: skill.name,
          };
        } catch (error) {
          console.warn(`Found palette ${paletteId} for skill ${value} but couldn't load skill data:`, error);
          return { paletteId, skillId: value };
        }
      }

      // Not found as skill ID, try as palette ID (for decoding)
      const paletteEntry = profDetails.paletteById.get(value);
      if (paletteEntry) {
        const skillId = paletteEntry.skillId;
        try {
          const skill = await gw2Api.getSkill(skillId);
          console.log(`Resolved palette ${value} to skill ${skillId}:`, skill.name);
          return {
            paletteId: value,
            skillId,
            name: skill.name,
          };
        } catch (error) {
          console.warn(`Found skill ${skillId} for palette ${value} but couldn't load skill data:`, error);
          return { paletteId: value, skillId };
        }
      }

      // Fallback: assume palette ID = skill ID
      console.warn(`No palette mapping found for ${value}, assuming palette ID = skill ID`);
      return { paletteId: value, skillId: value };
    }

    // Try to resolve skill name
    const skills = await gw2Api.getSkills(professionId);
    const found = skills.find(s => s.name.toLowerCase() === String(value).toLowerCase());

    if (found) {
      // Look up palette ID for this skill
      const paletteId = profDetails.paletteBySkillId.get(found.id) || found.id;
      console.log(`Resolved skill name "${value}" to skill ${found.id}, palette ${paletteId}`);
      return {
        paletteId,
        skillId: found.id,
        name: found.name,
      };
    }

    console.warn(`Could not resolve skill: ${value}`);
    return { paletteId: 0 };
  }

  async resolvePet(value: number | string | null | undefined): Promise<{ id: number; name?: string }> {
    if (!value) return { id: 0 };

    const id = typeof value === 'number' ? value : parseInt(String(value), 10);
    return { id };
  }

  async resolveLegend(value: number | string | null | undefined): Promise<DecodedLegend> {
    if (!value) return { code: 0 };

    const code = typeof value === 'number' ? value : parseInt(String(value), 10);
    return { code };
  }

  async resolveWeapon(value: number | string): Promise<DecodedWeapon> {
    const id = typeof value === 'number' ? value : parseInt(String(value), 10);
    return { id };
  }

  async resolveOverrideSkill(value: number | string): Promise<{ id: number; name?: string }> {
    const id = typeof value === 'number' ? value : parseInt(String(value), 10);
    return { id };
  }

  async getSpecializationById(id: number): Promise<SpecializationData> {
    return this.resolveSpecialization(id);
  }

  async getTraitData(ids: number[]): Promise<Map<number, { id: number; name?: string }>> {
    const result = new Map();

    for (const id of ids) {
      try {
        const trait = await gw2Api.getTrait(id);
        result.set(id, { id: trait.id, name: trait.name });
      } catch {
        result.set(id, { id });
      }
    }

    return result;
  }

  async getSkillData(ids: number[]): Promise<Map<number, { id: number; name?: string }>> {
    console.log(`getSkillData called with ${ids.length} skill IDs:`, ids);
    const result = new Map();

    for (const id of ids) {
      try {
        const skill = await gw2Api.getSkill(id);
        console.log(`Loaded skill ${id}:`, skill.name);
        result.set(id, { id: skill.id, name: skill.name });
      } catch (error) {
        console.warn(`Failed to load skill ${id}:`, error);
        result.set(id, { id });
      }
    }

    console.log(`getSkillData returning ${result.size} skills`);
    return result;
  }

  async getPetById(id: number): Promise<{ id: number; name?: string }> {
    return { id };
  }
}
