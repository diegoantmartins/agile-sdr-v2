import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Button, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { AccountTree, Add } from '@mui/icons-material';

const flows = [
  { id: '1', name: 'Boas-vindas + Qualificação', status: 'active', nodes: 5 },
  { id: '2', name: 'Follow-up 24h', status: 'active', nodes: 3 },
  { id: '3', name: 'Objeções de Preço', status: 'inactive', nodes: 4 },
];

const nodeTypes = [
  { label: 'Mensagem', color: '#682EE4' },
  { label: 'Condição', color: '#F59E0B' },
  { label: 'Atraso', color: '#3B82F6' },
  { label: 'API', color: '#10B981' },
];

export default function Fluxos() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box><Typography variant="h4" fontWeight={700}>Fluxos Visuais</Typography><Typography variant="body2" color="text.secondary">Crie automações com builder visual</Typography></Box>
        <Button variant="contained" startIcon={<Add />}>Novo Fluxo</Button>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} className="stagger-entrance">
          <Card className="glass-panel">
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Meus Fluxos</Typography>
              <List>
                {flows.map((f) => (
                  <ListItem key={f.id} className="hover-lift" sx={{ bgcolor: selected === f.id ? 'rgba(59, 130, 246, 0.12)' : 'transparent', borderRadius: 1, mb: 1, cursor: 'pointer' }} onClick={() => setSelected(f.id)}>
                    <ListItemIcon><AccountTree color="primary" /></ListItemIcon>
                    <ListItemText primary={f.name} secondary={<Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}><Chip label={`${f.nodes} blocos`} size="small" sx={{ height: 20 }} /><Chip label={f.status === 'active' ? 'Ativo' : 'Inativo'} size="small" color={f.status === 'active' ? 'success' : 'default'} sx={{ height: 20 }} /></Box>} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          <Card className="glass-panel" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Blocos Disponíveis</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {nodeTypes.map(n => <Chip key={n.label} label={n.label} sx={{ bgcolor: `${n.color}20`, color: n.color }} variant="outlined" />)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8} className="stagger-entrance">
          <Card className="glass-panel" sx={{ minHeight: 400 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              {selected ? (
                <>
                  <Typography variant="h6" fontWeight={600} mb={4}>Editor de Fluxo</Typography>
                  <Box sx={{ p: 2, border: '2px dashed #682EE4', borderRadius: 2, bgcolor: 'rgba(104, 46, 228, 0.1)', mb: 2 }}><Typography fontWeight={600}>Mensagem - Boas-vindas</Typography></Box>
                  <Box sx={{ width: 2, height: 30, bgcolor: '#CBD5E1', mb: 2 }} />
                  <Box sx={{ p: 2, border: '2px solid #F59E0B', borderRadius: 2, bgcolor: 'rgba(245, 158, 11, 0.1)' }}><Typography fontWeight={600}>Condição - Verificar interesse</Typography></Box>
                  <Button variant="outlined" startIcon={<Add />} sx={{ mt: 4 }}>Adicionar Bloco</Button>
                </>
              ) : (
                <Box sx={{ textAlign: 'center' }}><AccountTree sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} /><Typography variant="h6" color="text.secondary">Selecione um fluxo para editar</Typography></Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}