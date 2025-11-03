import ProfessionSelector from './ProfessionSelector';
import GameModeSelector from './GameModeSelector';
import BuildExport from './BuildExport';

type SectionType = 'skills' | 'traits' | 'equipment';

interface SidebarProps {
  activeSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const isBuildActive = activeSection === 'skills' || activeSection === 'traits';

  return (
    <div className="space-y-4">
      {/* Profession & Game Mode */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.9)]">
        <div className="space-y-6">
          <ProfessionSelector />
          <GameModeSelector />
        </div>
      </div>

      {/* Navigation */}
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-[0_18px_50px_-28px_rgba(14,22,40,1)]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500 mb-4">Configure</p>
          <div className="space-y-2">
            <button
              onClick={() => onSectionChange('skills')}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                isBuildActive
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              }`}
            >
              Build
            </button>
            <button
              onClick={() => onSectionChange('equipment')}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                activeSection === 'equipment'
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
              }`}
            >
              Equipment
            </button>
          </div>
        </div>
      </div>

      {/* Export */}
      <BuildExport />
    </div>
  );
}
