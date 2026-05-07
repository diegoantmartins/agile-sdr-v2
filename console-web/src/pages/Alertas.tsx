import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Chip, IconButton, Switch, FormControlLabel, Button } from '@mui/material';
import { Error, Warning, Info, Delete, CheckCircle, NotificationsActive, Settings } from '@mui/icons-material';

const alerts = [
  { id: '1', type: 'error', title: 'IA não respondeu', message: 'Lead ID 123 não recebeu resposta há 10 min', time: '14:40', read: false },
  { id: '2', type: 'warning', title: 'Queda de performance', message: 'Taxa de conversão caiu 18%', time: '13:00', read: false },
  { id: '3', type: 'warning', title: '5 conversas sem resposta', message: 'Mais de 1 hora sem resposta', time: '12:30', read: true },
  { id: '4', type: 'info', title: 'Follow-up enviado', message: 'Sequência iniciada para 12 leads', time: '11:00', read: true },
];

const colors = { error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
const icons = { error: <Error />, warning: <Warning />, info: <Info /> };

export default function Alertas() {
  const [list, setList] = useState(alerts);
  const unread = list.filter(a => !a.read).length;
  const errors = list.filter(a => a.type === 'error' && !a.read).length;

  const markRead = (id: string) => setList(list.map(a => a.id === id ? { ...a, read: true } : a));
  const remove = (id: string) => setList(list.filter(a => a.id !== id));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h4" fontWeight={700}>Alertas & Monitoramento</Typography><Typography variant="body2" color="text.secondary">Fique informado sobre problemas importantes</Typography></Box>
        <Button variant="outlined" startIcon={<Settings />}>Configurar</Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={6} sm={4}><Card><CardContent sx={{ textAlign: 'center' }}><NotificationsActive sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} /><Typography variant="h4" fontWeight={700}>{unread}</Typography><Typography variant="body2" color="text.secondary">Não Lidos</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={4}><Card><CardContent sx={{ textAlign: 'center' }}><Error sx={{ fontSize: 40, color: 'error.main', mb: 1 }} /><Typography variant="h4" fontWeight={700}>{errors}</Typography><Typography variant="body2" color="text.secondary">Críticos</Typography></CardContent></Card></Grid>
        <Grid item xs={6} sm={4}><Card><CardContent sx={{ textAlign: 'center' }}><Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} /><Typography variant="h4" fontWeight={700}>{list.filter(a => a.type === 'warning' && !a.read).length}</Typography><Typography variant="body2" color="text.secondary">Atenção</Typography></CardContent></Card></Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography variant="h6" fontWeight={600}>Lista de Alertas</Typography><Chip label={`${list.length} total`} size="small" /></Box>
              <List>{list.map(a => (
                <ListItem key={a.id} sx={{ bgcolor: a.read ? 'transparent' : '#F0F9FF', borderRadius: 1, mb: 1, borderLeft: `4px solid ${colors[a.type as keyof typeof colors]}` }}>
                  <ListItemIcon sx={{ color: colors[a.type as keyof typeof colors] }}>{icons[a.type as keyof typeof icons]}</ListItemIcon>
                  <ListItemText primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography fontWeight={a.read ? 400 : 600}>{a.title}</Typography>{!a.read && <Chip label="Novo" size="small" color="primary" sx={{ height: 20 }} />}</Box>} secondary={<><Typography variant="body2" color="text.secondary">{a.message}</Typography><Typography variant="caption" color="text.secondary">{a.time}</Typography></>} />
                  <ListItemSecondaryAction><IconButton onClick={() => markRead(a.id)}><CheckCircle /></IconButton><IconButton onClick={() => remove(a.id)} color="error"><Delete /></IconButton></ListItemSecondaryAction>
                </ListItem>
              ))}</List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card sx={{ bgcolor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <CardContent><Typography variant="h6" fontWeight={600} color="#0369A1" mb={2}>Configurações de Alertas</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}><FormControlLabel control={<Switch defaultChecked />} label="Alertas de erro" /><FormControlLabel control={<Switch defaultChecked />} label="Alertas de performance" /><FormControlLabel control={<Switch defaultChecked />} label="Notificações por email" /></Box></CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}