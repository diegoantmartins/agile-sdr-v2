import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Notifications,
  Search,
  Settings,
} from '@mui/icons-material';

export default function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: 'calc(100% - 280px)',
        ml: '280px',
        bgcolor: 'rgba(10, 14, 23, 0.7)',
        backdropFilter: 'blur(12px)',
        color: '#F9FAFB',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '80px !important' }}>
        <TextField
          size="small"
          placeholder="Pesquisar inteligência..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'primary.main', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: 400, 
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              },
              '&.Mui-focused': {
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'primary.main',
                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)',
              }
            },
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'primary.light', bgcolor: 'rgba(59, 130, 246, 0.08)' } }}>
              <Badge 
                variant="dot" 
                color="error" 
                overlap="circular"
                sx={{ '& .MuiBadge-badge': { width: 8, height: 8, border: '2px solid #0A0E17' } }}
              >
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'primary.light', bgcolor: 'rgba(59, 130, 246, 0.08)' } }}>
              <Settings />
            </IconButton>
          </Box>

          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer', 
              ml: 1,
              p: '6px',
              pr: 2.5,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            <Avatar 
              sx={{ 
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', 
                width: 36, 
                height: 36, 
                fontWeight: 800, 
                fontSize: '0.9rem',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
              }}
            >
              A
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={800} sx={{ color: '#F9FAFB', lineHeight: 1.2 }}>
                ADMIN
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                Synapsea Core
              </Typography>
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem>Perfil</MenuItem>
          <MenuItem>Configurações</MenuItem>
          <MenuItem>Sair</MenuItem>
        </Menu>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
        >
          <MenuItem>🔴 Queda de 18% na conversão</MenuItem>
          <MenuItem>🟡 Novo lead quente detectado</MenuItem>
          <MenuItem>🔵 Follow-up enviado com sucesso</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}