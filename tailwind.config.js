module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      
    },
    extend: {
      colors: {
        bg: '#EDE6DB',
        txt: '#1A3C40',
        crt: '#6b9c8f',
        crt2: '#1D5C63'
      },
      animation: {
        fade: 'fadeOut 1.7s ease-in-out',
      },

      // that is actual animation
      keyframes: {
        fadeOut: {
          '0%': { opacity: '100%' },
          '70%': { opacity: '100%' },
          '100%': { opacity: '0%' },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
  ],
}
