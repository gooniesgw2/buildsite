import { useBuildStore } from '../store/buildStore';
import type { Profession } from '../types/gw2';

const PROFESSIONS: Profession[] = [
  'Guardian', 'Warrior', 'Engineer', 'Ranger', 'Thief',
  'Elementalist', 'Mesmer', 'Necromancer', 'Revenant'
];

const PROFESSION_COLORS: Record<Profession, string> = {
  Guardian: 'bg-gw2-guardian',
  Warrior: 'bg-gw2-warrior',
  Engineer: 'bg-gw2-engineer',
  Ranger: 'bg-gw2-ranger',
  Thief: 'bg-gw2-thief',
  Elementalist: 'bg-gw2-elementalist',
  Mesmer: 'bg-gw2-mesmer',
  Necromancer: 'bg-gw2-necromancer',
  Revenant: 'bg-gw2-revenant',
};

export default function ProfessionSelector() {
  const { profession, setProfession } = useBuildStore();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Profession</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {PROFESSIONS.map((prof) => (
          <button
            key={prof}
            onClick={() => setProfession(prof)}
            className={`
              px-3 py-2 rounded font-medium transition-all text-sm
              ${profession === prof
                ? `${PROFESSION_COLORS[prof]} text-white shadow-md scale-105`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
            `}
          >
            {prof}
          </button>
        ))}
      </div>
    </div>
  );
}
