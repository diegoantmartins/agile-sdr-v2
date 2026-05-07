import { Box, Grid, Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { WhatsApp, CalendarMonth, Webhook, Link, CheckCircle } from '@mui/icons-material';

const integrations = [
  { id: '1', name: 'WhatsApp', type: 'whatsapp', status: 'connected', icon: <WhatsApp /> },
  { id: '2', name: 'Google Calendar', type: 'calendar', status: 'connected', icon: <CalendarMonth /> },
  { id: '3', name: 'Chatwoot', type: 'chatwoot', status: 'connected', icon: <Webhook /> },
  { id: '4', name: 'n8n', type: 'n8n', status: 'connected', icon: <Webhook /> },
  { id: '5', name: 'CRM Salesforce', type: 'crm', status: 'disconnected', icon: <Link /> },
  { id: '6', name: 'Slack', type: 'slack', status: 'disconnected', icon: <Link /> },
  { id: '7', name: 'RD Station', type: 'rd_station', status: 'disconnected', icon: <Webhook /> },
];

export default function Integracoes() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography variant="h4" fontWeight={700}>Integrações</Typography><Typography variant="body2" color="text.secondary">Conecte ferramentas externas</Typography></Box>
      <Grid container spacing={3}>
        {integrations.map((int) => (
          <Grid item xs={12} sm={6} md={4} key={int.id} className="stagger-entrance">
            <Card className="glass-panel hover-lift">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: int.status === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: int.status === 'connected' ? '#10B981' : '#64748B', boxShadow: int.status === 'connected' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none' }}>{int.icon}</Box>
                  <Chip size="small" icon={int.status === 'connected' ? <CheckCircle /> : undefined} label={int.status === 'connected' ? 'Conectado' : 'Desconectado'} color={int.status === 'connected' ? 'success' : 'default'} />
                </Box>
                <Typography variant="h6" fontWeight={600} mb={0.5}>{int.name}</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>{int.status === 'connected' ? 'Configurado e ativo' : 'Clique para conectar'}</Typography>
                {int.status === 'connected' ? 
                  <Button size="small" variant="outlined" onClick={() => alert('Configurações ativas no .env')}>Configurar</Button> : 
                  <Button variant="contained" fullWidth onClick={() => alert(`Para conectar ${int.name}, adicione as chaves de API correspondentes no arquivo .env do servidor.`)}>Conectar</Button>
                }
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}