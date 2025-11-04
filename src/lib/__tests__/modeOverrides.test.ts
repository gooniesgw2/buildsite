import { describe, expect, it } from 'vitest';

import type { GW2SkillWithModes } from '../../types/gw2';
import { mergeSkillModeOverrides } from '../modeMerging';
import { resolveSkillMode } from '../modeUtils';

describe('mergeSkillModeOverrides', () => {
  const buildSkill = (
    id: number,
    duration: number,
    overrides: Partial<GW2SkillWithModes> = {}
  ): GW2SkillWithModes => ({
    id,
    name: overrides.name ?? 'Well of Corruption',
    icon: overrides.icon ?? 'https://example.com/icon.png',
    type: overrides.type ?? 'Utility',
    weapon_type: overrides.weapon_type ?? 'None',
    professions: overrides.professions ?? ['Necromancer'],
    slot: overrides.slot ?? 'Utility',
    categories: overrides.categories ?? ['Well'],
    flags: overrides.flags,
    subskills: overrides.subskills,
    bundle_skill: overrides.bundle_skill,
    transform_skill: overrides.transform_skill,
    modes: {
      default: {
        description:
          overrides.modes?.default?.description ??
          'Well. Target area pulses, converting boons on foes into conditions.',
        facts:
          overrides.modes?.default?.facts ?? [
            {
              text: 'Duration',
              type: 'Time',
              icon: 'https://example.com/duration.png',
              duration,
            },
          ],
        traited_facts: overrides.modes?.default?.traited_facts,
      },
      pve: overrides.modes?.pve,
      pvp: overrides.modes?.pvp,
      wvw: overrides.modes?.wvw,
    },
  });

  const extractDuration = (skill: GW2SkillWithModes, mode: Parameters<typeof resolveSkillMode>[1]) =>
    resolveSkillMode(skill, mode).facts?.find(fact => fact.text === 'Duration')?.duration ?? null;

  it('merges multiple competitive overrides into PvP and WvW buckets', () => {
    const base = buildSkill(10545, 5);
    const pvp = buildSkill(10671, 6);
    const wvw = buildSkill(12000, 7);

    const { skills, overrideLookup } = mergeSkillModeOverrides([base, pvp, wvw]);

    expect(skills).toHaveLength(1);
    const skill = skills[0];

    expect(extractDuration(skill, 'PvE')).toBe(5);
    expect(extractDuration(skill, 'PvP')).toBe(6);
    expect(extractDuration(skill, 'WvW')).toBe(7);

    expect(overrideLookup.get(10671)).toEqual({ baseId: 10545, modes: ['pvp'] });
    expect(overrideLookup.get(12000)).toEqual({ baseId: 10545, modes: ['wvw'] });
  });

  it('applies a single override to both PvP and WvW when only one variant exists', () => {
    const base = buildSkill(2000, 4);
    const competitive = buildSkill(2001, 6);

    const { skills, overrideLookup } = mergeSkillModeOverrides([base, competitive]);

    expect(skills).toHaveLength(1);
    const skill = skills[0];

    expect(extractDuration(skill, 'PvE')).toBe(4);
    expect(extractDuration(skill, 'PvP')).toBe(6);
    expect(extractDuration(skill, 'WvW')).toBe(6);

    expect(overrideLookup.get(2001)).toEqual({ baseId: 2000, modes: ['pvp', 'wvw'] });
  });

  it('leaves bundled skills with subskill data untouched so glyph variants are preserved', () => {
    const glyphBase = buildSkill(3000, 2, {
      subskills: [{ id: 3001, attunement: 'Fire' }],
    });
    const glyphVariant = buildSkill(3002, 5, {
      subskills: [{ id: 3003, attunement: 'Water' }],
    });

    const { skills } = mergeSkillModeOverrides([glyphBase, glyphVariant]);

    expect(skills).toHaveLength(2);
    expect(skills.find(skill => skill.id === 3000)).toBeDefined();
    expect(skills.find(skill => skill.id === 3002)).toBeDefined();
  });
});
