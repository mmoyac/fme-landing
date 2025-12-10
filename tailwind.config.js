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
          DEFAULT: 'rgb(94, 200, 242)', // Azul turquesa claro
          light: 'rgb(144, 220, 255)',
          dark: 'rgb(69, 162, 154)',
        },
        secondary: {
          DEFAULT: 'rgb(69, 162, 154)', // Verde azulado/teal
          light: 'rgb(99, 192, 184)',
          dark: 'rgb(49, 132, 124)',
        }
      },
    },
  },
  plugins: [],
}
