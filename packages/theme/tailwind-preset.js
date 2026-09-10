/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e5ffe9',
          100: '#b3ffd0',
          200: '#80ffb8',
          300: '#4dff9f',
          400: '#1aff87',
          500: '#00b33b',
          600: '#009932',
          700: '#00802a',
          800: '#166534',
          900: '#001a09',
          DEFAULT: '#00b33b',
        },
        emerald: {
          50: '#e5ffe9',
          100: '#b3ffd0',
          200: '#80ffb8',
          300: '#4dff9f',
          400: '#1aff87',
          500: '#00b33b',
          600: '#009932',
          700: '#00802a',
          800: '#166534',
          900: '#001a09',
        },
        surface: {
          DEFAULT: '#FAFAFA',
          pure: '#FFFFFF',
          muted: '#F3F4F6',
          border: '#E5E5E5',
          page: '#f8faf9',
          warm: '#f1f2f4',
          input: '#f1f3f5',
          category: '#f0f2f5',
          body: '#f5f5f4',
        },
        text: {
          primary: '#111111',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        icon: {
          accent: '#00a838',
          outline: '#2B2D42',
          'outline-light': '#E5E7EB',
          svg: '#333333',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        lg: '8px',
      }
    },
  },
  plugins: [],
};

module.exports.themeTokens = {
  colors: {
    primary: '#00b33b',
    primaryHover: '#009932',
    primaryDark: '#00802a',
    primaryLight: '#b3ffd0',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfacePage: '#f8faf9',
    surfaceWarm: '#f1f2f4',
    surfaceInput: '#f1f3f5',
    surfaceCategory: '#f0f2f5',
    surfaceBody: '#f5f5f4',
    border: '#E5E5E5',
    textPrimary: '#111111',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    success: '#00b33b',
    warning: '#D97706',
    error: '#DC2626',
    iconAccent: '#00a838',
    iconOutline: '#2B2D42',
    iconOutlineLight: '#E5E7EB',
    iconSvg: '#333333',
  },
  radius: '8px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

