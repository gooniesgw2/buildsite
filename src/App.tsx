import ProfessionSelector from './components/ProfessionSelector'
import EquipmentPanel from './components/EquipmentPanel'
import TraitPanel from './components/TraitPanel'
import SkillBar from './components/SkillBar'
import BuildExport from './components/BuildExport'

function App() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">GW2 Build Editor</h1>
        <p className="text-center text-gray-400">
          Open source build editor for Guild Wars 2
        </p>
      </header>

      <div className="space-y-6">
        <ProfessionSelector />
        <EquipmentPanel />
        <TraitPanel />
        <SkillBar />
        <BuildExport />
      </div>
    </div>
  )
}

export default App
