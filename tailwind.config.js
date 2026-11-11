/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Deep Obsidian Charcoal / Noir from the logo background
          plum: {
            50: '#f6f6fa',
            100: '#ececf3',
            200: '#d8d8e5',
            300: '#b0b0c6',
            400: '#82829d',
            500: '#5b5b75',
            600: '#3b3b4f',
            700: '#262633',
            800: '#1b1b23',
            900: '#121217', // Obsidian Black (Logo base)
            950: '#0a0a0e', // Deepest midnight
          },
          // Spun Gold from the hook, infinity loop, and serif lettering
          gold: {
            50: '#fffdf5',
            100: '#fef8e2',
            200: '#fcedba',
            300: '#f7de87',
            400: '#ecc952',
            500: '#dfb428', // Metallic Gold
            600: '#c6971b',
            700: '#9e7116',
            800: '#825919',
            900: '#6f4b1a',
            950: '#412809',
          },
          // Dusty Rose yarn fibers from the bottom wave
          rose: {
            50: '#fdf6f7',
            100: '#faeaed',
            200: '#f6d5db',
            300: '#edb3bd',
            400: '#e08696',
            500: '#d16a7c', // Dusty rose coral
            600: '#b94e62',
            700: '#9c3d4f',
            800: '#833644',
            900: '#6f313e',
          },
          // Pearlescent Cream from the blossom petals & white yarn ball
          cream: {
            50: '#fffefb',
            100: '#fdfbf6', // Pearlescent background
            200: '#f9f5ec',
            300: '#f2ebdd',
            400: '#e6dac4',
            500: '#d4c2a5',
          },
          // Heather Amethyst / Mauve yarn fibers from the bottom wave
          lavender: {
            50: '#fbf6fc',
            100: '#f4ecf7',
            200: '#ebd9f0',
            300: '#ddbee4',
            400: '#c89bd3',
            500: '#ad79bc', // Woven heather purple
            600: '#935da2',
            700: '#7c4a86',
            800: '#663f6e',
            900: '#55365a',
          },
          // Botanical Forest Emerald from the floral leaves
          sage: {
            50: '#f2f7f3',
            100: '#e1ece3',
            200: '#c4dac9',
            300: '#9ec0a7',
            400: '#74a180',
            500: '#4e845c', // Botanical leaf green
            600: '#3c6c49',
            700: '#31563b',
            800: '#2a4632',
            900: '#233a2a',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '14px',
      }
    },
  },
  plugins: [],
}
