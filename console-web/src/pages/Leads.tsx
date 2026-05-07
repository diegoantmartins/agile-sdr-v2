import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, IconButton, TextField, InputAdornment, ToggleButton, ToggleButtonGroup, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Add, Search, ViewKanban, ViewList, MoreVert, Email, Phone, Close } from '@mui/icons-material';
import { useLeads, useCreateLead, useUpdateLead } from '../hooks/useApi';
import { Lead } from '../services/api';

const columns = [
  { status: 'TRIAGE', label: 'Novo', color: '#3B82F6' },
  { status: 'IN_PROGRESS', label: 'Em Conversa', color: '#F59E0B' },
  { status: 'HUMAN_REQUIRED', label: 'Aguardando Humano', color: '#EF4444' },
  { status: 'QUALIFIED', label: 'Qualificado', color: '#10B981' },
  { status: 'MEETING', label: 'Reunião', color: '#8B5CF6' },
  { status: 'LOST', label: 'Perdido', color: '#EF4444' },
];

const temperatureColors: Record<string, string> = { hot: '#EF4444', warm: '#F59E0B', cold: '#3B82F6' };

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <Card 
      className="hover-lift stagger-entrance"
      sx={{ 
        mb: 2, 
        cursor: 'pointer', 
      }} 
      onClick={onClick}
    >
      <CardContent sx={{ p: '16px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>{lead.name}</Typography>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.3)', mt: -0.5, mr: -0.5 }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{lead.company || 'Sem empresa'}</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
          <Box sx={{ 
            width: 20, 
            height: 20, 
            borderRadius: '50%', 
            bgcolor: `${temperatureColors[lead.temperature] || '#3B82F6'}20`, 
            color: temperatureColors[lead.temperature] || '#3B82F6',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.7rem',
            border: `1px solid ${temperatureColors[lead.temperature] || '#3B82F6'}40`
          }}>
            {lead.temperature === 'cold' ? '❄' : lead.temperature === 'warm' ? '🌡' : '🔥'}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: '"JetBrains Mono", monospace' }}>
            SCORE: <span style={{ color: '#F9FAFB', fontWeight: 700 }}>{lead.score}</span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.8, mt: 2 }}>
          <Chip label={lead.source} size="small" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" sx={{ color: 'primary.light', p: 0.5, bgcolor: 'rgba(59, 130, 246, 0.08)' }}><Email sx={{ fontSize: 16 }} /></IconButton>
          <IconButton size="small" sx={{ color: 'secondary.light', p: 0.5, bgcolor: 'rgba(16, 185, 129, 0.08)' }}><Phone sx={{ fontSize: 16 }} /></IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Leads() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', company: '', source: 'whatsapp' });

  const { data: leads, isLoading, error } = useLeads();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const filteredLeads = (leads || []).filter((lead: Lead) => 
    lead.name.toLowerCase().includes(search.toLowerCase()) || 
    lead.company?.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone.includes(search)
  );

  const getLeadsByStatus = (status: string) => filteredLeads.filter((l: Lead) => l.status === status);

  const handleCreateLead = async () => {
    try {
      await createLead.mutateAsync(newLead);
      setDialogOpen(false);
      setNewLead({ name: '', phone: '', email: '', company: '', source: 'whatsapp' });
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    }
  };

  const handleStatusChange = async (leadPhone: string, newStatus: string) => {
    try {
      await updateLead.mutateAsync({ phone: leadPhone, data: { status: newStatus } });
    } catch (err) {
      console.error('Erro ao atualizar lead:', err);
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar leads. Verifique a conexão com o servidor.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Gestão de Leads</Typography>
          <Typography variant="body2" color="text.secondary">Acompanhe e gerencie todos os seus leads</Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          alignItems: { xs: 'stretch', sm: 'center' },
          width: { xs: '100%', md: 'auto' }
        }}>
          <TextField 
            size="small" 
            placeholder="Buscar lead..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }} 
            sx={{ width: { xs: '100%', sm: 250 } }} 
          />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
              <ToggleButton value="kanban"><ViewKanban /></ToggleButton>
              <ToggleButton value="list"><ViewList /></ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)} fullWidth={false}>Novo</Button>
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 4, minHeight: 'calc(100vh - 250px)' }}>
          {columns.map((col) => {
            const stageLeads = getLeadsByStatus(col.status);
            return (
              <Box key={col.status} className="stagger-entrance" sx={{ minWidth: 280, flex: 1, bgcolor: 'rgba(255, 255, 255, 0.01)', borderRadius: 3, p: 1.5 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 3, 
                  pb: 1.5, 
                  borderBottom: `2px solid ${col.color}`,
                  px: 0.5
                }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: col.color, letterSpacing: '0.02em', textTransform: 'uppercase' }}>{col.label}</Typography>
                  <Chip 
                    label={stageLeads.length} 
                    size="small" 
                    sx={{ 
                      height: 22, 
                      fontSize: '0.7rem', 
                      fontWeight: 700,
                      bgcolor: `${col.color}20`,
                      color: col.color,
                      border: `1px solid ${col.color}30`
                    }} 
                  />
                </Box>
                <Box sx={{ minHeight: 400 }}>
                  {stageLeads.map((lead: Lead) => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => handleStatusChange(lead.phone, col.status)} />
                  ))}
                  {stageLeads.length === 0 && (
                    <Box sx={{ 
                      p: 4, 
                      textAlign: 'center', 
                      color: 'text.secondary', 
                      border: '1px dashed rgba(255, 255, 255, 0.05)', 
                      borderRadius: 2,
                      opacity: 0.5
                    }}>
                      <Typography variant="body2">Vazio</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Novo Lead
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Nome" fullWidth value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} required />
            <TextField label="Telefone" fullWidth value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} required placeholder="+5511999999999" />
            <TextField label="Email" fullWidth value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
            <TextField label="Empresa" fullWidth value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} />
            <TextField label="Source" fullWidth value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateLead} disabled={createLead.isPending}>
            {createLead.isPending ? <CircularProgress size={20} /> : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}