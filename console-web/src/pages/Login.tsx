import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/synapsea_logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tenantId, setTenantId] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(adminToken, tenantId);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#0A0E17',
      backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0A0E17 100%)'
    }}>
      <Card sx={{ 
        width: 420, 
        p: 2, 
        bgcolor: '#1F2937', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box 
              component="img" 
              src={logo} 
              sx={{ width: 80, height: 80, mb: 2, filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))' }} 
            />
            <Typography variant="h4" fontWeight={800} sx={{ color: '#F9FAFB', mb: 0.5 }}>Synapsea</Typography>
            <Typography variant="body2" sx={{ color: '#3B82F6', fontWeight: 600, letterSpacing: 2 }}>CONNECT</Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1 }}>Console de Gestão de IA</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Usuário"
              placeholder="Ex: admin"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              margin="normal"
              required
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 4, 
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Acessar Terminal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}