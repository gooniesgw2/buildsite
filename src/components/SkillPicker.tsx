import { useState, useEffect, useRef } from 'react';
import type { GameMode, GW2SkillWithModes } from '../types/gw2';
import { resolveSkillMode } from '../lib/modeUtils';
import Tooltip from './Tooltip';

interface SkillPickerProps {
  skills: GW2SkillWithModes[];
  selectedSkillId: number | undefined;
  onSelect: (skillId: number) => void;
  slotLabel: string;
  selectedSkill: GW2SkillWithModes | undefined;
  gameMode?: GameMode;
}

export default function SkillPicker({ skills, selectedSkillId, onSelect, slotLabel, selectedSkill, gameMode }: SkillPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (skillId: number) => {
    onSelect(skillId);
    setIsOpen(false);
  };

  const selectedDetails = selectedSkill ? resolveSkillMode(selectedSkill, gameMode) : undefined;

  return (
    <div className="relative flex-1 min-w-0">
      {/* Skill Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-16 w-16 items-center justify-center rounded-xl border cursor-pointer transition ${
          selectedSkill
            ? 'border-yellow-400 bg-slate-900 hover:border-yellow-300'
            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
        }`}
      >
        {selectedSkill ? (
          <Tooltip
            title={selectedSkill.name}
            content={selectedDetails?.description || ''}
            icon={selectedSkill.icon}
          >
            <img src={selectedSkill.icon} alt={selectedSkill.name} className="h-14 w-14 rounded-lg object-cover" />
          </Tooltip>
        ) : (
          <span className="text-[10px] text-slate-500">Empty</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-[400px] max-h-[500px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Select {slotLabel}</h3>
          </div>

          {/* Skills Grid */}
          <div className="overflow-y-auto p-3" style={{ maxHeight: '440px' }}>
            <div className="grid grid-cols-5 gap-2">
              {Array.from(new Map(skills.map(s => [s.id, s])).values()).map((skill) => {
                const isSelected = skill.id === selectedSkillId;
                const modeDetails = resolveSkillMode(skill, gameMode);
                return (
                  <Tooltip key={skill.id} title={skill.name} content={modeDetails?.description || ''} icon={skill.icon}>
                    <button
                      onClick={() => handleSelect(skill.id)}
                      className={`group relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400/15'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <div className="relative">
                        <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                          <img src={skill.icon} alt={skill.name} className="h-full w-full object-cover" />
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-bold text-slate-900">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className={`w-full overflow-hidden text-ellipsis text-center text-[9px] font-medium leading-tight ${
                        isSelected ? 'text-yellow-200' : 'text-slate-300'
                      }`}>
                        {skill.name}
                      </div>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
