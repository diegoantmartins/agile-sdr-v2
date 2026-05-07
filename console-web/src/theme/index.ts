import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6', // Connect Blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Profit Green
      light: '#34D399',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
    background: {
      default: '#030712', // Ultra Deep Space
      paper: 'rgba(17, 24, 39, 0.4)', // Translucent Paper
    },
    text: {
      primary: '#F9FAFB', // Data White
      secondary: '#9CA3AF', // Subtle Gray
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Manrope", sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.04em' },
    h2: { fontWeight: 900, letterSpacing: '-0.03em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    subtitle1: { letterSpacing: '0.01em' },
    button: {
      fontWeight: 800,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      letterSpacing: '0.05em',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.4)',
          backdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 24,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '12px 24px',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)',
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 14,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 1,
              borderColor: '#3B82F6',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          margin: '4px 12px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#60A5FA',
            fontWeight: 700,
            '& .MuiListItemIcon-root': {
              color: '#60A5FA',
            },
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.18)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#030712',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

export default theme;