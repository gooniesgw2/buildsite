// Core profession types
export type Profession =
  | 'Guardian' | 'Warrior' | 'Engineer' | 'Ranger' | 'Thief'
  | 'Elementalist' | 'Mesmer' | 'Necromancer' | 'Revenant';

export type WeightClass = 'Heavy' | 'Medium' | 'Light';

// Game mode types
export type GameMode = 'PvE' | 'PvP' | 'WvW';

// Equipment slot types
export type ArmorSlot = 'Helm' | 'Shoulders' | 'Coat' | 'Gloves' | 'Leggings' | 'Boots';
export type WeaponSlot = 'MainHand1' | 'OffHand1' | 'MainHand2' | 'OffHand2';
export type TrinketSlot = 'Backpack' | 'Accessory1' | 'Accessory2' | 'Amulet' | 'Ring1' | 'Ring2';

// Stat combinations (common ones)
export const STAT_COMBOS = [
  'Berserker', 'Assassin', 'Marauder', 'Viper', 'Sinister',
  'Celestial', 'Diviner', 'Harrier', 'Minstrel', 'Magi',
  'Soldier', 'Cavalier', 'Nomad', 'Trailblazer', 'Seraph',
  'Commander', 'Vigilant', 'Crusader', 'Marshal', 'Grieving',
  'Plaguedoctor', 'Giver', 'Dragon', 'Ritualist', 'Demolisher'
] as const;

export type StatCombo = typeof STAT_COMBOS[number];

// Infusion types (+5 to stat)
export const INFUSIONS = [
  'Mighty', 'Precise', 'Malign', 'Expertise', 'Resilient', 'Vital', 'Healing', 'Concentration'
] as const;

export type InfusionType = typeof INFUSIONS[number];

// Popular rune item IDs (Superior versions)
export const RUNE_IDS = [
  24836, // Scholar
  24723, // Eagle
  67339, // Dragonhunter
  24818, // Strength
  24848, // Nightmare
  83338, // Trapper
  24800, // Durability
  24842, // Monk
  24762, // Water
  70600, // Leadership
  24765, // Elementalist
  24687, // Ranger
] as const;

// Popular relic item IDs
export const RELIC_IDS = [
  100916, // Thief
  100942, // Reaper
  100047, // Aristocracy
  100153, // Fractal
  100611, // Akeem
  101500, // Cerus
  100733, // Febe
  100611, // Dragonhunter
  100819, // Firebrand
  100713, // Fireworks
  100922, // Zojja
  100770, // Isgarren
] as const;

// API Response Types
export interface GW2Skill {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: string;
  weapon_type?: string;
  professions: string[];
  slot?: string;
  facts?: Array<{
    text?: string;
    type: string;
    value?: number;
    icon?: string;
  }>;
  categories?: string[];
  specialization?: number;
}

export interface GW2Trait {
  id: number;
  tier: number;
  order: number;
  name: string;
  description: string;
  icon: string;
  specialization: number;
  facts?: Array<{
    text?: string;
    type: string;
    value?: number;
    icon?: string;
  }>;
}

export interface GW2Specialization {
  id: number;
  name: string;
  profession: string;
  elite: boolean;
  icon: string;
  background: string;
  minor_traits: number[];
  major_traits: number[];
  weapon_trait?: string;
}

export interface GW2ItemStat {
  id: number;
  name: string;
  attributes: {
    Power?: number;
    Precision?: number;
    Toughness?: number;
    Vitality?: number;
    ConditionDamage?: number;
    ConditionDuration?: number;
    Healing?: number;
    BoonDuration?: number;
    CritDamage?: number;
    Ferocity?: number;
  };
}

export interface GW2Item {
  id: number;
  name: string;
  description?: string;
  type: string;
  level: number;
  rarity: string;
  vendor_value: number;
  icon: string;
  details?: {
    type?: string;
    bonuses?: string[];
    infix_upgrade?: {
      id: number;
      attributes: Array<{
        attribute: string;
        modifier: number;
      }>;
    };
  };
}

// Build data structure
export interface Equipment {
  slot: ArmorSlot | WeaponSlot | TrinketSlot;
  stat: StatCombo;
  upgrade?: string; // Rune or Sigil name
  infusion1?: InfusionType;
  infusion2?: InfusionType;
  infusion3?: InfusionType;
}

export interface SkillSelection {
  heal?: number;
  utility1?: number;
  utility2?: number;
  utility3?: number;
  elite?: number;
}

export interface TraitSelection {
  spec1?: number;
  spec1Choices?: [number | null, number | null, number | null];
  spec2?: number;
  spec2Choices?: [number | null, number | null, number | null];
  spec3?: number;
  spec3Choices?: [number | null, number | null, number | null];
}

export interface BuildData {
  profession: Profession;
  gameMode: GameMode;
  equipment: Equipment[];
  skills: SkillSelection;
  traits: TraitSelection;
  runeId?: number; // Item ID of the rune
  relicId?: number; // Item ID of the relic
}
