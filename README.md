# GW2 Build Editor

An open-source Guild Wars 2 build editor built with React, TypeScript, and Tailwind CSS. Create, customize, and share your builds with ease!

## Features

- 🎮 **All 9 Professions** - Full support for Guardian, Warrior, Engineer, Ranger, Thief, Elementalist, Mesmer, Necromancer, and Revenant
- ⚔️ **Complete Equipment System** - Armor, weapons, trinkets with stat selection, runes/sigils, and infusions
- 🔧 **Bulk Apply Tools** - Apply stats and infusions across multiple categories at once
- 🎯 **Trait Selection** - Clean, metabattle-style trait selector for all specializations
- 💫 **Skill Bar** - Full skill selection with tooltips
- 🔗 **Build Sharing** - Generate shareable URLs with compressed build data
- 💬 **Discord Integration** - Export builds as Discord-friendly markdown
- 💾 **Local Caching** - API responses cached in localStorage for fast loading
- 🌐 **Official GW2 API** - All data fetched from the official Guild Wars 2 API

## Getting Started

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Select a Profession** - Choose from the 9 available professions
2. **Configure Equipment** - Set stats, upgrades, and infusions for each piece
3. **Use Bulk Apply** - Quickly apply the same stat or infusion to multiple items
4. **Choose Specializations** - Select 3 specializations and pick traits
5. **Select Skills** - Choose heal, utilities, and elite skills
6. **Share Your Build** - Generate a shareable link or export to Discord

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Pako** - Build data compression
- **GW2 API** - Official Guild Wars 2 API

## Project Structure

```
src/
├── components/       # React components
│   ├── ProfessionSelector.tsx
│   ├── EquipmentPanel.tsx
│   ├── TraitPanel.tsx
│   ├── SkillBar.tsx
│   └── BuildExport.tsx
├── lib/             # Utilities and API clients
│   ├── gw2api.ts    # GW2 API client with caching
│   ├── buildEncoder.ts   # URL encoding/decoding
│   └── buildExport.ts    # Export utilities
├── store/           # Zustand stores
│   └── buildStore.ts
├── types/           # TypeScript type definitions
│   └── gw2.ts
└── styles/          # Global styles
    └── index.css
```

## Roadmap

- [ ] Add rune and sigil selection with actual item names
- [ ] Implement proper GW2 chat link generation
- [ ] Add build templates/presets
- [ ] Support for legendary armory
- [ ] Build comparison tool
- [ ] Import builds from chat codes
- [ ] Dark/light theme toggle
- [ ] Mobile-optimized interface

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your own projects!

## Acknowledgments

- Guild Wars 2 API by ArenaNet
- Inspired by GW2Skills and MetaBattle
- Built with love for the GW2 community

## Deployment

### Vercel

```bash
npm run build
# Deploy the 'dist' folder to Vercel
```

### Netlify

```bash
npm run build
# Deploy the 'dist' folder to Netlify
```

### GitHub Pages

Add to `vite.config.ts`:
```ts
export default defineConfig({
  base: '/your-repo-name/',
  plugins: [react()],
})
```

Then build and deploy the `dist` folder.

## API Rate Limiting

The GW2 API has rate limits. This app caches all responses in localStorage to minimize API calls. Cache duration is 24 hours by default.

## Support

For issues or questions, please open an issue on GitHub.
