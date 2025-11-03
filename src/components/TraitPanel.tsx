import { useState, useEffect } from 'react';
import { useBuildStore } from '../store/buildStore';
import { gw2Api } from '../lib/gw2api';
import type { GW2Specialization, GW2Trait } from '../types/gw2';

export default function TraitPanel() {
  const { profession, traits, setSpecialization, setTrait } = useBuildStore();
  const [specs, setSpecs] = useState<GW2Specialization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecializations();
  }, [profession]);

  const loadSpecializations = async () => {
    setLoading(true);
    try {
      const allSpecs = await gw2Api.getSpecializations(profession);
      setSpecs(allSpecs);
    } catch (error) {
      console.error('Failed to load specializations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Specializations & Traits</h2>
        <div className="text-gray-400">Loading specializations...</div>
      </div>
    );
  }

  const renderSpecSlot = (slotNum: 1 | 2 | 3) => {
    const specIdKey = `spec${slotNum}` as const;
    const choicesKey = `spec${slotNum}Choices` as const;
    const selectedSpecId = traits[specIdKey];
    const selectedChoices = traits[choicesKey] || [null, null, null];

    return (
      <div key={slotNum} className="bg-gray-700 rounded-lg p-4">
        <div className="mb-3">
          <label className="text-sm text-gray-300 mb-2 block">
            Specialization {slotNum}
          </label>
          <select
            value={selectedSpecId || ''}
            onChange={(e) => {
              const specId = e.target.value ? parseInt(e.target.value) : 0;
              if (specId) setSpecialization(slotNum, specId);
            }}
            className="w-full bg-gray-600 text-white rounded px-3 py-2"
          >
            <option value="">Select Specialization</option>
            {specs.map(spec => (
              <option key={spec.id} value={spec.id}>
                {spec.name} {spec.elite ? '(Elite)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedSpecId && (
          <TraitSelector
            specId={selectedSpecId}
            selectedChoices={selectedChoices}
            onTraitSelect={(tier, traitId) => setTrait(slotNum, tier, traitId)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Specializations & Traits</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderSpecSlot(1)}
        {renderSpecSlot(2)}
        {renderSpecSlot(3)}
      </div>
    </div>
  );
}

interface TraitSelectorProps {
  specId: number;
  selectedChoices: [number | null, number | null, number | null];
  onTraitSelect: (tier: 0 | 1 | 2, traitId: number | null) => void;
}

function TraitSelector({ specId, selectedChoices, onTraitSelect }: TraitSelectorProps) {
  const [traits, setTraits] = useState<GW2Trait[]>([]);
  const [spec, setSpec] = useState<GW2Specialization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraits();
  }, [specId]);

  const loadTraits = async () => {
    setLoading(true);
    try {
      const [specData, traitsData] = await Promise.all([
        gw2Api.getSpecialization(specId),
        gw2Api.getTraits(specId)
      ]);
      setSpec(specData);
      setTraits(traitsData);
    } catch (error) {
      console.error('Failed to load traits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-400">Loading traits...</div>;
  }

  if (!spec) return null;

  const majorTraits = traits.filter(t => spec.major_traits.includes(t.id));
  const traitsByTier = [
    majorTraits.filter(t => t.tier === 1),
    majorTraits.filter(t => t.tier === 2),
    majorTraits.filter(t => t.tier === 3),
  ];

  return (
    <div className="space-y-3">
      {traitsByTier.map((tierTraits, tierIndex) => (
        <div key={tierIndex} className="border-l-4 border-blue-500 pl-3">
          <div className="text-xs text-gray-400 mb-1">Tier {tierIndex + 1}</div>
          <div className="space-y-1">
            {tierTraits.map(trait => (
              <button
                key={trait.id}
                onClick={() => onTraitSelect(tierIndex as 0 | 1 | 2, trait.id)}
                className={`
                  w-full text-left px-3 py-2 rounded text-sm transition-colors
                  ${selectedChoices[tierIndex] === trait.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                  }
                `}
                title={trait.description}
              >
                {trait.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
