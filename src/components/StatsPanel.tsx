import { useMemo, useState, useEffect } from 'react';
import { useBuildStore } from '../store/buildStore';
import { gw2Api } from '../lib/gw2api';
import type { StatCombo, InfusionType, GW2Item } from '../types/gw2';
import { BASE_HEALTH, PROFESSION_WEIGHT_CLASS, BASE_ARMOR, TWO_HANDED_WEAPONS } from '../types/gw2';
import { ASCENDED_ARMOR_STATS, ASCENDED_TRINKET_STATS, ASCENDED_WEAPON_STATS, type SlotStatValues } from '../lib/statTables';

type AttributeKey =
  | 'Power'
  | 'Toughness'
  | 'Vitality'
  | 'Precision'
  | 'Ferocity'
  | 'ConditionDamage'
  | 'HealingPower'
  | 'Expertise'
  | 'BoonDuration';

const BASE_ATTRIBUTES: Record<AttributeKey, number> = {
  Power: 1000,
  Toughness: 1000,
  Vitality: 1000,
  Precision: 1000,
  Ferocity: 0,
  ConditionDamage: 0,
  HealingPower: 0,
  Expertise: 0,
  BoonDuration: 0,
};

// Infusions give +5 to a stat
const INFUSION_BONUSES: Record<InfusionType, Partial<Record<AttributeKey, number>>> = {
  Mighty: { Power: 5 },
  Precise: { Precision: 5 },
  Malign: { ConditionDamage: 5 },
  Expertise: { Expertise: 5 },
  Resilient: { Toughness: 5 },
  Vital: { Vitality: 5 },
  Healing: { HealingPower: 5 },
  Concentration: { BoonDuration: 5 },
};

// Stat distribution for each stat combo (in order of priority)
// Format: [major stat, minor stat 1, minor stat 2, minor stat 3 (if 4-stat)]
const STAT_COMBOS: Record<StatCombo, AttributeKey[]> = {
  Berserker: ['Power', 'Precision', 'Ferocity'],
  Assassin: ['Precision', 'Power', 'Ferocity'],
  Marauder: ['Power', 'Precision', 'Vitality', 'Ferocity'],
  Viper: ['Power', 'ConditionDamage', 'Precision', 'Expertise'],
  Sinister: ['ConditionDamage', 'Power', 'Precision'],
  Celestial: ['Power', 'Precision', 'Toughness', 'Vitality', 'ConditionDamage', 'HealingPower', 'Expertise', 'BoonDuration', 'Ferocity'],
  Diviner: ['Power', 'BoonDuration', 'Precision', 'Ferocity'],
  Harrier: ['Power', 'HealingPower', 'BoonDuration'],
  Minstrel: ['Toughness', 'HealingPower', 'Vitality', 'BoonDuration'],
  Magi: ['HealingPower', 'Precision', 'Vitality'],
  Soldier: ['Power', 'Toughness', 'Vitality'],
  Cavalier: ['Toughness', 'Power', 'Ferocity'],
  Nomad: ['Toughness', 'Vitality', 'HealingPower'],
  Trailblazer: ['Toughness', 'ConditionDamage', 'Vitality', 'Expertise'],
  Seraph: ['Precision', 'ConditionDamage', 'BoonDuration', 'HealingPower'],
  Commander: ['Power', 'Precision', 'Toughness', 'BoonDuration'],
  Vigilant: ['Power', 'Toughness', 'BoonDuration', 'Expertise'],
  Crusader: ['Power', 'Toughness', 'Ferocity', 'HealingPower'],
  Marshal: ['Power', 'HealingPower', 'Precision', 'ConditionDamage'],
  Grieving: ['Power', 'ConditionDamage', 'Precision', 'Ferocity'],
  Plaguedoctor: ['Vitality', 'ConditionDamage', 'HealingPower', 'BoonDuration'],
  Giver: ['Toughness', 'BoonDuration', 'HealingPower'],
  Dragon: ['Power', 'Ferocity', 'Precision', 'Vitality'],
  Ritualist: ['Vitality', 'ConditionDamage', 'BoonDuration', 'Expertise'],
  Demolisher: ['Power', 'Precision', 'Toughness', 'Ferocity'],
  Zealot: ['Power', 'Precision', 'HealingPower'],
  Valkyrie: ['Power', 'Vitality', 'Ferocity'],
  Rampager: ['Precision', 'Power', 'ConditionDamage'],
  Knight: ['Toughness', 'Power', 'Precision'],
  Sentinel: ['Vitality', 'Power', 'Toughness'],
  Shaman: ['Vitality', 'ConditionDamage', 'HealingPower'],
  Carrion: ['ConditionDamage', 'Power', 'Vitality'],
  Rabid: ['ConditionDamage', 'Precision', 'Toughness'],
  Dire: ['ConditionDamage', 'Toughness', 'Vitality'],
  Cleric: ['HealingPower', 'Power', 'Toughness'],
  Apothecary: ['HealingPower', 'Toughness', 'ConditionDamage'],
  Wanderer: ['Power', 'Vitality', 'Toughness', 'BoonDuration'],
};

const ATTRIBUTES: Array<{
  key: AttributeKey;
  label: string;
  accent: string;
}> = [
  { key: 'Power', label: 'Power', accent: 'bg-sky-500' },
  { key: 'Toughness', label: 'Toughness', accent: 'bg-amber-500' },
  { key: 'Vitality', label: 'Vitality', accent: 'bg-emerald-500' },
  { key: 'Precision', label: 'Precision', accent: 'bg-fuchsia-500' },
  { key: 'Ferocity', label: 'Ferocity', accent: 'bg-orange-500' },
  { key: 'ConditionDamage', label: 'Condition Damage', accent: 'bg-red-500' },
  { key: 'HealingPower', label: 'Healing Power', accent: 'bg-teal-400' },
  { key: 'Expertise', label: 'Expertise', accent: 'bg-indigo-500' },
  { key: 'BoonDuration', label: 'Concentration', accent: 'bg-lime-400' },
];

const formatNumber = (value: number) => Math.round(value).toLocaleString();

// Map API stat names to AttributeKey
const STAT_NAME_MAP: Record<string, AttributeKey> = {
  'Power': 'Power',
  'Precision': 'Precision',
  'Toughness': 'Toughness',
  'Vitality': 'Vitality',
  'Ferocity': 'Ferocity',
  'Condition Damage': 'ConditionDamage',
  'Condition Duration': 'Expertise',
  'Healing Power': 'HealingPower',
  'Expertise': 'Expertise',
  'Concentration': 'BoonDuration',
  'Boon Duration': 'BoonDuration',
  'Critical Damage': 'Ferocity',
};

const PERCENT_TO_ATTRIBUTE: Partial<Record<AttributeKey, number>> = {
  Expertise: 15,
  BoonDuration: 15,
  Ferocity: 15,
};

// Parse rune bonus strings like "+25 Power", "+10% Boon Duration"
function parseRuneBonus(bonus: string): { attribute: AttributeKey; value: number; isPercent: boolean } | null {
  const match = bonus.match(/\+(\d+)(%?)\s+(.+)/);
  if (!match) return null;

  const [, valueStr, percentSign, statName] = match;
  const attribute = STAT_NAME_MAP[statName];
  if (!attribute) return null;

  return {
    attribute,
    value: parseInt(valueStr, 10),
    isPercent: percentSign === '%',
  };
}

export default function StatsPanel() {
  const { equipment, runeId, profession } = useBuildStore();
  const [runeItem, setRuneItem] = useState<GW2Item | null>(null);

  useEffect(() => {
    if (runeId) {
      gw2Api.getItem(runeId).then(setRuneItem).catch(console.error);
    } else {
      setRuneItem(null);
    }
  }, [runeId]);

  const totals = useMemo(() => {
    const armorStats = ASCENDED_ARMOR_STATS as Record<string, SlotStatValues>;
    const trinketStats = ASCENDED_TRINKET_STATS as Record<string, SlotStatValues>;
    const totals = { ...BASE_ATTRIBUTES } as Record<AttributeKey, number>;
    const equipmentBySlot = equipment.reduce<Record<string, typeof equipment[number]>>((acc, item) => {
      acc[item.slot] = item;
      return acc;
    }, {});

    equipment.forEach((item) => {
      if (item.slot === 'MainHand2' || item.slot === 'OffHand2') {
        return;
      }

      let slotValues: SlotStatValues | undefined;

      if (armorStats[item.slot]) {
        slotValues = armorStats[item.slot];
      } else if (trinketStats[item.slot]) {
        slotValues = trinketStats[item.slot];
      } else if (item.slot === 'MainHand1') {
        const isTwoHanded = item.weaponType ? TWO_HANDED_WEAPONS.includes(item.weaponType) : false;
        slotValues = isTwoHanded ? ASCENDED_WEAPON_STATS.twoHanded : ASCENDED_WEAPON_STATS.oneHanded;
      } else if (item.slot === 'OffHand1') {
        const mainHand = equipmentBySlot['MainHand1'];
        const mainIsTwoHanded = mainHand?.weaponType ? TWO_HANDED_WEAPONS.includes(mainHand.weaponType) : false;
        if (mainIsTwoHanded) {
          return;
        }
        slotValues = ASCENDED_WEAPON_STATS.oneHanded;
      } else {
        return;
      }

      const statCombo = STAT_COMBOS[item.stat as StatCombo];
      if (!slotValues || !statCombo) {
        return;
      }

      if (statCombo.length === 9) {
        statCombo.forEach((attribute) => {
          totals[attribute] += slotValues.major9;
        });
      } else if (statCombo.length === 4) {
        statCombo.forEach((attribute, index) => {
          totals[attribute] += index < 2 ? slotValues.major4 : slotValues.minor4;
        });
      } else {
        statCombo.forEach((attribute, index) => {
          totals[attribute] += index === 0 ? slotValues.major3 : slotValues.minor3;
        });
      }

      (['infusion1', 'infusion2', 'infusion3'] as const).forEach((key) => {
        const infusionType = item[key];
        if (!infusionType) return;
        const infusionBonus = INFUSION_BONUSES[infusionType];
        if (!infusionBonus) return;
        Object.entries(infusionBonus).forEach(([attribute, value]) => {
          totals[attribute as AttributeKey] += value ?? 0;
        });
      });
    });

    if (runeItem?.details?.bonuses) {
      runeItem.details.bonuses.forEach((bonus) => {
        const parsed = parseRuneBonus(bonus);
        if (!parsed) return;

        if (parsed.isPercent) {
          const conversion = PERCENT_TO_ATTRIBUTE[parsed.attribute];
          if (conversion) {
            totals[parsed.attribute] += parsed.value * conversion;
          }
        } else {
          totals[parsed.attribute] += parsed.value;
        }
      });
    }

    return totals;
  }, [equipment, runeItem]);

  const maxValue = useMemo(() => {
    return ATTRIBUTES.reduce((max, attribute) => Math.max(max, totals[attribute.key]), 0);
  }, [totals]);

  // Calculate derived stat for a given attribute
  const getDerivedStat = (attributeKey: AttributeKey, value: number): string | null => {
    if (!profession) return null;

    const weightClass = PROFESSION_WEIGHT_CLASS[profession];
    const baseHealth = BASE_HEALTH[profession];
    const baseArmor = BASE_ARMOR[weightClass];

    switch (attributeKey) {
      case 'Toughness':
        // Armor = Base Armor + Total Toughness
        const armor = baseArmor + value;
        return `Armor: ${formatNumber(armor)}`;
      case 'Vitality':
        // Base health already includes base vitality, so only add equipment bonus
        const health = baseHealth + (value - 1000) * 10;
        return `Health: ${formatNumber(health)}`;
      case 'Precision':
        const critChance = Math.min(100, Math.max(0, 4 + (value - 1000) / 21));
        return `Crit Chance: ${critChance.toFixed(1)}%`;
      case 'Ferocity':
        const critDamage = 150 + value / 15;
        return `Crit Damage: ${critDamage.toFixed(1)}%`;
      case 'Expertise':
        const conditionDuration = Math.min(100, value / 15);
        return `Condition Duration: +${conditionDuration.toFixed(1)}%`;
      case 'BoonDuration':
        const boonDuration = Math.min(100, value / 15);
        return `Boon Duration: +${boonDuration.toFixed(1)}%`;
      default:
        return null;
    }
  };

  return (
    <aside className="rounded-[28px] border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Attributes</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Stat Summary</h2>
        </div>
        <div className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-400">
          Ascended est.
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {ATTRIBUTES.map((attribute) => {
          const value = totals[attribute.key];
          const percent = maxValue ? Math.min(100, (value / maxValue) * 100) : 0;
          const derivedStat = getDerivedStat(attribute.key, value);

          return (
            <div key={attribute.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="font-medium text-slate-200">{attribute.label}</span>
                <span className="font-semibold text-white">{formatNumber(value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800/80">
                <div
                  className={`h-2.5 rounded-full ${attribute.accent}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {derivedStat && (
                <div className="text-[11px] text-slate-400 pl-0.5">
                  {derivedStat}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
