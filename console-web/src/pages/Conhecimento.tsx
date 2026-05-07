import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Grid,
  Tooltip,
} from '@mui/material';
import { 
  Save, 
  Add, 
  Delete, 
  Edit, 
  MenuBook, 
  Search, 
  FilterList,
  LibraryBooks,
  QuestionAnswer,
  Business,
  LocalOffer
} from '@mui/icons-material';
import { 
  useKnowledge, 
  useCreateKnowledge, 
  useUpdateKnowledge, 
  useDeleteKnowledge 
} from '../hooks/useApi';

const categoryIcons: Record<string, any> = {
  'Produto': <LocalOffer />,
  'Empresa': <Business />,
  'Serviço': <LibraryBooks />,
  'FAQ': <QuestionAnswer />,
  'Dica': <Psychology />
};

import { Psychology } from '@mui/icons-material';

export default function Conhecimento() {
  const { data: knowledge, isLoading: isKnowledgeLoading } = useKnowledge();
  const createKnowledge = useCreateKnowledge();
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();

  const [searchTerm, setSearchTerm] = useState('');
  const [openKnowledgeDialog, setOpenKnowledgeDialog] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<any>(null);
  const [knowledgeForm, setKnowledgeForm] = useState({ title: '', content: '', category: 'Produto' });

  const handleKnowledgeSubmit = async () => {
    try {
      if (editingKnowledge) {
        await updateKnowledge.mutateAsync({ id: editingKnowledge.id, data: knowledgeForm });
      } else {
        await createKnowledge.mutateAsync(knowledgeForm);
      }
      setOpenKnowledgeDialog(false);
      setEditingKnowledge(null);
      setKnowledgeForm({ title: '', content: '', category: 'Produto' });
    } catch (err) {
      console.error('Failed to save knowledge:', err);
    }
  };

  const handleEditKnowledge = (k: any) => {
    setEditingKnowledge(k);
    setKnowledgeForm({ title: k.title, content: k.content, category: k.category });
    setOpenKnowledgeDialog(true);
  };

  const filteredKnowledge = knowledge?.filter(k => 
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#F9FAFB', letterSpacing: '-0.02em' }}>
            Base de Conhecimento (RAG)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie o cérebro do seu agente: produtos, FAQs e dicas técnicas.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => {
            setEditingKnowledge(null);
            setKnowledgeForm({ title: '', content: '', category: 'Produto' });
            setOpenKnowledgeDialog(true);
          }}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Novo Item
        </Button>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pesquisar na base de conhecimento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': { 
              bgcolor: 'rgba(255,255,255,0.02)', 
              borderRadius: 3,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
            } 
          }}
        />
        <Button variant="outlined" startIcon={<FilterList />} sx={{ borderRadius: 3 }}>Filtros</Button>
      </Box>

      {isKnowledgeLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {filteredKnowledge?.map((k) => (
            <Grid item xs={12} sm={6} md={4} key={k.id} className="stagger-entrance">
              <Card className="glass-panel hover-lift" sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      icon={categoryIcons[k.category] || <MenuBook />}
                      label={k.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                    />
                    <Box>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditKnowledge(k)} sx={{ color: 'rgba(255,255,255,0.4)' }}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => deleteKnowledge.mutate(k.id)} sx={{ opacity: 0.6 }}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.2 }}>
                    {k.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.6
                  }}>
                    {k.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {filteredKnowledge?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, width: '100%' }}>
              <Typography color="text.secondary">Nenhum item encontrado.</Typography>
            </Box>
          )}
        </Grid>
      )}

      <Dialog open={openKnowledgeDialog} onClose={() => setOpenKnowledgeDialog(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingKnowledge ? 'Editar Conhecimento' : 'Adicionar Novo Conhecimento'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField 
                label="Título do Assunto" 
                fullWidth 
                value={knowledgeForm.title} 
                onChange={(e) => setKnowledgeForm({...knowledgeForm, title: e.target.value})}
                placeholder="Ex: Diferença entre Drywall e Steel Frame"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField 
                label="Categoria" 
                select 
                SelectProps={{ native: true }}
                fullWidth 
                value={knowledgeForm.category} 
                onChange={(e) => setKnowledgeForm({...knowledgeForm, category: e.target.value})}
              >
                <option value="Produto">Produto</option>
                <option value="Empresa">Empresa</option>
                <option value="Serviço">Serviço</option>
                <option value="FAQ">FAQ</option>
                <option value="Dica">Dica</option>
              </TextField>
            </Grid>
          </Grid>
          <TextField 
            label="Conteúdo Técnico (Informação para a IA)" 
            fullWidth 
            multiline 
            rows={10} 
            value={knowledgeForm.content} 
            onChange={(e) => setKnowledgeForm({...knowledgeForm, content: e.target.value})}
            placeholder="Descreva detalhadamente a informação. A IA usará este texto como base para responder aos leads."
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenKnowledgeDialog(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleKnowledgeSubmit} sx={{ px: 4 }}>
            {editingKnowledge ? 'Atualizar Conhecimento' : 'Salvar na Base'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
