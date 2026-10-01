/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B3B3C',    // Deep Teal from Raxon UI
          primary: '#0F4C4E', // Rich Teal
          light: '#4B8B8C',   // Medium Accent Teal
          soft: '#E8F2F2',    // Light Teal Tint
        },
        gain: '#10B981',      // Mint Green (+%)
        loss: '#EF4444',      // Soft Red (-%)
        card: '#FFFFFF',
        surface: '#F4F6F8',   // Light Gray background from screenshot
        borderMuted: '#E5E9EB',
        subtext: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
