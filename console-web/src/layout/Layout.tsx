import { ReactNode, useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const drawerWidth = 280;

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
          <Sidebar />
        </Box>
      )}

      {/* Sidebar - Mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#0A0E17',
              border: 'none'
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
      )}

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: { md: `calc(100% - ${drawerWidth}px)` },
        minWidth: 0
      }}>
        <Header onMenuClick={handleDrawerToggle} isMobile={isMobile} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            mt: '80px', 
            bgcolor: 'background.default',
            overflowX: 'hidden'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}