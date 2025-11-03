import ProfessionSelector from './components/ProfessionSelector'
import EquipmentPanel from './components/EquipmentPanel'
import TraitPanel from './components/TraitPanel'
import SkillBar from './components/SkillBar'
import BuildExport from './components/BuildExport'

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="mb-6 pb-4 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-center mb-1">GW2 Build Editor</h1>
          <p className="text-center text-gray-400 text-sm">
            Open source build editor for Guild Wars 2
          </p>
        </header>

        <div className="space-y-4">
          <ProfessionSelector />
          <SkillBar />
          <TraitPanel />
          <EquipmentPanel />
          <BuildExport />
        </div>
      </div>
    </div>
  )
}

export default App
