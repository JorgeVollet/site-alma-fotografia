/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // =====================================================
        //  PALETA OFICIAL — MARCA ALMA FOTOGRAFIA
        //  Sálvia #686F67 · Off-white #E5E5E3 · Terracota #986E4D
        //  Taupe #B09B8A · Champagne #C9BEA8
        //  Mantemos os MESMOS nomes de tokens (cream/sand/clay/
        //  cocoa/terracotta) com os VALORES da marca real.
        // =====================================================

        // Off-white / cremes (fundos claros) — base #E5E5E3
        cream: {
          50: '#fbfbfa',
          100: '#f4f4f1',
          200: '#eaeae6',
          300: '#e0e0db',
        },
        // Champagne / areia — cor #C9BEA8 (logo circular)
        sand: {
          100: '#ece7da',
          200: '#ddd5c2',
          300: '#c9bea8',
          400: '#b8ab90',
        },
        // Taupe / rosa-amarronzado — #B09B8A (acento suave)
        clay: {
          400: '#c2b1a3',
          500: '#b09b8a',
          600: '#967f6e',
        },
        // Sálvia — #686F67 (cor PRINCIPAL da marca: texto + fundos escuros)
        cocoa: {
          600: '#7c8279',
          700: '#686f67',
          800: '#565c55',
          900: '#444944',
          950: '#33372f',
        },
        // Terracota — #986E4D (acento quente / destaque)
        terracotta: {
          400: '#bb9170',
          500: '#a67a55',
          600: '#986e4d',
        },
        // Sálvia clara auxiliar (detalhes botânicos)
        sage: {
          100: '#eef0ec',
          200: '#dde1d9',
          300: '#c3cabd',
          400: '#a3ad9c',
          500: '#828d7c',
        },
        // Champagne claro auxiliar (fundos quentes muito suaves)
        blush: {
          50: '#f8f6f0',
          100: '#f1ede2',
          200: '#e6dfcd',
          300: '#d6ccb3',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.3em',
      },
      maxWidth: {
        content: '1300px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1) translate(0,0)' },
          '100%': { transform: 'scale(1.12) translate(-1.5%, -1.5%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.9' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        kenburns: 'kenburns 18s ease-out infinite alternate',
        shimmer: 'shimmer 2s infinite',
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 5s ease-in-out infinite',
        'spin-slow': 'spin-slow 28s linear infinite',
      },
    },
  },
  plugins: [],
}
