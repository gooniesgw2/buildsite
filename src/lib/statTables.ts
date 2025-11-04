import type { ArmorSlot, TrinketSlot, WeaponSlot } from '../types/gw2';

export interface SlotStatValues {
  major3: number;
  minor3: number;
  major4: number;
  minor4: number;
  major9: number;
}

export const ASCENDED_ARMOR_STATS: Record<ArmorSlot, SlotStatValues> = {
  Helm: { major3: 63, minor3: 45, major4: 54, minor4: 30, major9: 30 },
  Shoulders: { major3: 47, minor3: 34, major4: 40, minor4: 22, major9: 22 },
  Coat: { major3: 141, minor3: 101, major4: 121, minor4: 67, major9: 67 },
  Gloves: { major3: 47, minor3: 34, major4: 40, minor4: 22, major9: 22 },
  Leggings: { major3: 94, minor3: 67, major4: 81, minor4: 44, major9: 44 },
  Boots: { major3: 47, minor3: 34, major4: 40, minor4: 22, major9: 22 },
};

export const ASCENDED_TRINKET_STATS: Record<TrinketSlot, SlotStatValues> = {
  Amulet: { major3: 157, minor3: 108, major4: 133, minor4: 71, major9: 72 },
  Ring1: { major3: 126, minor3: 85, major4: 106, minor4: 56, major9: 57 },
  Ring2: { major3: 126, minor3: 85, major4: 106, minor4: 56, major9: 57 },
  Accessory1: { major3: 110, minor3: 74, major4: 92, minor4: 49, major9: 50 },
  Accessory2: { major3: 110, minor3: 74, major4: 92, minor4: 49, major9: 50 },
  Backpack: { major3: 63, minor3: 40, major4: 52, minor4: 27, major9: 28 },
};

export const ASCENDED_WEAPON_STATS: Record<'oneHanded' | 'twoHanded', SlotStatValues> = {
  oneHanded: { major3: 125, minor3: 90, major4: 108, minor4: 59, major9: 59 },
  twoHanded: { major3: 251, minor3: 179, major4: 215, minor4: 118, major9: 118 },
};

export const isWeaponSlot = (slot: string): slot is WeaponSlot =>
  slot === 'MainHand1' ||
  slot === 'MainHand2' ||
  slot === 'OffHand1' ||
  slot === 'OffHand2';
