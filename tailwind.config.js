/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gw2: {
          guardian: '#72C1D9',
          warrior: '#FFD166',
          engineer: '#D09C59',
          ranger: '#8CDC82',
          thief: '#C08F95',
          elementalist: '#F68A87',
          mesmer: '#B679D5',
          necromancer: '#52A76F',
          revenant: '#D16E5A',
        }
      }
    },
  },
  plugins: [],
}
