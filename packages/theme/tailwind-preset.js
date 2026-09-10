/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#22c55e',
          500: '#166534',
          600: '#166534',
          700: '#14532d',
          800: '#166534',
          900: '#052e16',
          DEFAULT: '#166534',
        },
        emerald: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#22c55e',
          500: '#166534',
          600: '#166534',
          700: '#14532d',
          800: '#166534',
          900: '#052e16',
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
          accent: '#166534',
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
    primary: '#166534',
    primaryHover: '#14532d',
    primaryDark: '#0f3e21',
    primaryLight: '#dcfce7',
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
    success: '#166534',
    warning: '#D97706',
    error: '#DC2626',
    iconAccent: '#166534',
    iconOutline: '#2B2D42',
    iconOutlineLight: '#E5E7EB',
    iconSvg: '#333333',
  },
  radius: '8px',
  fontFamily: 'Inter, system-ui, sans-serif',
};
