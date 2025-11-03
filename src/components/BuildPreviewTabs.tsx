import { useState } from 'react';
import BuildPreview from './BuildPreview';
import EquipmentPreview from './EquipmentPreview';

type TabType = 'build' | 'equipment';

export default function BuildPreviewTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('build');

  return (
    <div className="rounded-[32px] border border-slate-800/80 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950/90 p-6 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Build Overview</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'build'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
          }`}
        >
          Skills & Traits
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === 'equipment'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300'
          }`}
        >
          Equipment
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'build' ? <BuildPreview /> : <EquipmentPreview />}
      </div>
    </div>
  );
}
