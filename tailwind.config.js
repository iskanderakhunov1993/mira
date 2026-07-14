/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        blush: '#F7F4FC',
        rosewood: '#625B73',
        petal: '#7561D5',
        mint: '#4FAE9E',
        ink: '#272336',
        lilac: '#EDE7FF',
        coral: '#F08CA8',
        water: '#72C8DB',
        sunshine: '#F2C66D',
      },
      boxShadow: {
        soft: '0 14px 34px rgba(61, 49, 104, 0.09), 0 2px 8px rgba(61, 49, 104, 0.04)',
        float: '0 18px 48px rgba(61, 49, 104, 0.16)',
      },
    },
  },
  plugins: [],
};
