/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        g: { blue: '#3F7BEA', red: '#E2493B', yellow: '#F2B01E', green: '#2F9A5B', ink: '#0F1B2D', mute: '#5B6B82' },
        paper: '#F7F9FC', mute: '#5B6B82', cream: '#EAF0F8', line: '#D5DEEB', ink: '#0F1B2D',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'] },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(12px)' }, '100%': { opacity: 1, transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: { 'fade-up': 'fadeUp .5s ease-out both', float: 'float 6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
