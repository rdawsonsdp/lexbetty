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
        // Lexington Betty Smokehouse Brand Colors
        cream: '#EDE3D0',
        'primary-brown': '#1A1A1A',
        'accent-gold': '#E8621A',
        'light-brown': '#9B9189',
        charcoal: '#1A1A1A',
        'smokehouse-orange': '#E8621A',
        'smoke-gray': '#9B9189',
        'warm-white': '#F5EDE0',
        'success-green': '#4CAF50',
        'error-red': '#E53935',
        'muted': '#9B9189',
        'dark': '#1A1A1A',
      },
      fontFamily: {
        oswald: ['var(--font-oswald)', 'Oswald', 'sans-serif'],
        display: ['var(--font-oswald)', 'Oswald', 'sans-serif'],
        body: ['var(--font-roboto-condensed)', 'Roboto Condensed', 'sans-serif'],
        'roboto-condensed': ['var(--font-roboto-condensed)', 'Roboto Condensed', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        'float': 'float 5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
