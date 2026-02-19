/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primario, rgb(94, 200, 242))',
          light: 'var(--color-primario-light, rgb(144, 220, 255))',
          dark: 'var(--color-primario-dark, rgb(69, 162, 154))',
        },
        secondary: {
          DEFAULT: 'var(--color-secundario, rgb(69, 162, 154))',
          light: 'var(--color-secundario-light, rgb(99, 192, 184))',
          dark: 'var(--color-secundario-dark, rgb(49, 132, 124))',
        },
        accent: {
          DEFAULT: 'var(--color-acento, rgb(218, 165, 32))',
        }
      },
    },
  },
  plugins: [],
}
