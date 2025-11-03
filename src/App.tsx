import { useState } from 'react'
import Sidebar from './components/Sidebar'
import BuildEditor from './components/BuildEditor'
import StatsPanel from './components/StatsPanel'

type SectionType = 'skills' | 'traits' | 'equipment';

function App() {
  const [activeSection, setActiveSection] = useState<SectionType>('skills');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-2 py-6">
        <header className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.45em] text-slate-500">Guild Wars 2</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Build Foundry
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Craft and share profession setups across game modes with live armory previews.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[320px,1fr,280px]">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          <BuildEditor activeSection={activeSection} />

          <StatsPanel />
        </div>
      </div>
    </div>
  )
}

export default App
