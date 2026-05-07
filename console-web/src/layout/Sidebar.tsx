import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  Chat,
  People,
  Analytics,
  Psychology,
  AccountTree,
  Science,
  Extension,
  Settings,
  Notifications,
  Terminal,
} from '@mui/icons-material';
import logo from '../assets/synapsea_logo.jpg';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/conversas', label: 'Conversas', icon: <Chat /> },
  { path: '/leads', label: 'Leads', icon: <People /> },
  { path: '/relatorios', label: 'Relatórios', icon: <Analytics /> },
  { path: '/agente', label: 'Agente IA', icon: <Psychology /> },
  { path: '/fluxos', label: 'Fluxos', icon: <AccountTree /> },
  { path: '/simulador', label: 'Simulador', icon: <Science /> },
  { path: '/integracoes', label: 'Integrações', icon: <Extension /> },
  { path: '/configuracoes', label: 'Configurações', icon: <Settings /> },
  { path: '/alertas', label: 'Alertas', icon: <Notifications /> },
  { path: '/logs', label: 'Logs de Sistema', icon: <Terminal /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: 280,
        height: '100vh',
        bgcolor: '#0A0E17',
        color: 'white',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Box sx={{ 
        p: 4, 
        pb: 3,
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        cursor: 'pointer'
      }} onClick={() => navigate('/')}>
        <Box 
          component="img" 
          src={logo} 
          sx={{ 
            width: 44, 
            height: 44, 
            borderRadius: 1.5,
            filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))'
          }} 
        />
        <Box>
          <Typography variant="h5" fontWeight={900} sx={{ color: '#F9FAFB', lineHeight: 1, letterSpacing: '-0.03em' }}>
            Synapsea
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 3, fontSize: '0.6rem' }}>
            CORE
          </Typography>
        </Box>
      </Box>

      <List sx={{ flex: 1, py: 1, px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(59, 130, 246, 0.12)',
                    color: 'primary.light',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.light',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.18)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.light' : 'rgba(255,255,255,0.4)', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: isActive ? '0.01em' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, mt: 'auto' }}>
        <Box sx={{ 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)', 
          border: '1px solid rgba(16, 185, 129, 0.2)', 
          borderRadius: 3, 
          p: 2.5,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Typography variant="caption" fontWeight={800} sx={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 1.2, letterSpacing: '0.05em' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
            MODO ATIVO
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1, lineHeight: 1.4 }}>
            Arquitetura Neural em processamento contínuo.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}