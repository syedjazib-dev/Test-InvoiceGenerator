/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
    screens: {
      '2xs': '365px',
      'xs': '436px',
      'sm': '640px',
      'md': '800px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1650px'
    },
    colors: {
      'themegray': {
        900: '#262626',
      },
      'themeblue': {
        50: '#f5f8fa',
        100: '#f0f9ff',
        200: '#e7f2ff',
        250: '#88b0f2',
        300: '#606efc',
        400: '#3b82f6',
        600: '#2767f5',
        800: '#0012c9',
        900: '#0f1766',
        950: '#000752',
      },
      'gray': {
        50: '#f5f8fa',
        100: '#e7f2ff',
        200: '#E5E7EB',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      'golden' : {
        300 : '#fee1a7',
        900 : '#c79c65'
      },
      'black': '#000000',
      'white':'#FFFFFF',
      'backdrop': {
        800: '#00000084',
        900: '#0000003a',
      },
      'red': {
        100: '#ffebeb',
        200: '#fbe0e0'
      },
      'maroon':'#800000',
      'blue': '#0000FF',
      'item-level-1': '#795ff8',
      'item-level-2': '#ff982e',
      'item-level-3': '#00bf9a'
    },
    safelist: [
      'bg-success',
      'bg-danger',
      'bg-warn',
      'bg-primary',
      'bg-secondary',
      'border-success',
      'border-danger',
      'border-warn',
      'border-primary',
      'border-secondary',
      'text-success',
      'text-danger',
      'text-warn',
      'text-primary',
      'text-secondary',
    ],
  },
  plugins: [],
}

