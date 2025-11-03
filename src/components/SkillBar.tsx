import { useState, useEffect } from 'react';
import { useBuildStore } from '../store/buildStore';
import { gw2Api } from '../lib/gw2api';
import type { GW2Skill } from '../types/gw2';

type SkillSlot = 'heal' | 'utility1' | 'utility2' | 'utility3' | 'elite';

const SLOT_LABELS: Record<SkillSlot, string> = {
  heal: 'Heal',
  utility1: 'Utility 1',
  utility2: 'Utility 2',
  utility3: 'Utility 3',
  elite: 'Elite',
};

export default function SkillBar() {
  const { profession, skills, setSkill } = useBuildStore();
  const [availableSkills, setAvailableSkills] = useState<GW2Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, [profession]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const allSkills = await gw2Api.getSkills(profession);
      setAvailableSkills(allSkills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillsForSlot = (slotType: string): GW2Skill[] => {
    return availableSkills.filter(skill =>
      skill.slot?.toLowerCase() === slotType.toLowerCase()
    );
  };

  const renderSkillSlot = (slot: SkillSlot) => {
    const slotType = slot === 'heal' ? 'Heal' :
                      slot === 'elite' ? 'Elite' : 'Utility';
    const skillsForSlot = getSkillsForSlot(slotType);
    const selectedSkillId = skills[slot];
    const selectedSkill = availableSkills.find(s => s.id === selectedSkillId);

    return (
      <div key={slot} className="bg-gray-700 rounded-lg p-4">
        <label className="text-sm text-gray-300 mb-2 block">
          {SLOT_LABELS[slot]}
        </label>
        <select
          value={selectedSkillId || ''}
          onChange={(e) => {
            const skillId = e.target.value ? parseInt(e.target.value) : 0;
            if (skillId) setSkill(slot, skillId);
          }}
          className="w-full bg-gray-600 text-white rounded px-3 py-2 mb-2"
        >
          <option value="">Select Skill</option>
          {skillsForSlot.map(skill => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>
        {selectedSkill && (
          <div className="text-xs text-gray-400 mt-2">
            {selectedSkill.description}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Skills</h2>
        <div className="text-gray-400">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Skills</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {renderSkillSlot('heal')}
        {renderSkillSlot('utility1')}
        {renderSkillSlot('utility2')}
        {renderSkillSlot('utility3')}
        {renderSkillSlot('elite')}
      </div>
    </div>
  );
}
