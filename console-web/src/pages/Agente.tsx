import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Save, History, Add, Delete, Edit, MenuBook } from '@mui/icons-material';
import { 
  useAgentConfig, 
  useUpdateAgentConfig, 
  useKnowledge, 
  useCreateKnowledge, 
  useUpdateKnowledge, 
  useDeleteKnowledge 
} from '../hooks/useApi';

export default function Agente() {
  const [tab, setTab] = useState(0);
  const { data: configData, isLoading: isConfigLoading } = useAgentConfig();
  const updateConfig = useUpdateAgentConfig();
  
  const { data: knowledge, isLoading: isKnowledgeLoading } = useKnowledge();
  const createKnowledge = useCreateKnowledge();
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();

  const [openKnowledgeDialog, setOpenKnowledgeDialog] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<any>(null);
  const [knowledgeForm, setKnowledgeForm] = useState({ title: '', content: '', category: 'Produto' });

  const [config, setConfig] = useState({
    companyName: 'Agile Steel',
    primaryCTA: 'Posso pedir para um dos nossos técnicos calcular o orçamento exato para sua obra?',
    tone: 'consultivo, rápido e técnico',
    customPrompt: '',
    systemPromptTemplate: '',
    businessNiche: 'Drywall, Steel Frame e Acabamentos',
    maxReplyChars: 420,
    autoReplyEnabled: true,
    qualificationQuestions: [
      'Onde fica a sua obra exatamente?',
      'Qual o tamanho aproximado da área?',
      'Em qual estágio a obra se encontra hoje?'
    ],
  });

  useEffect(() => {
    if (configData) {
      setConfig({
        companyName: configData.companyName as string || 'Agile Steel',
        primaryCTA: configData.primaryCTA as string || 'Posso pedir para um dos nossos técnicos calcular o orçamento exato para sua obra?',
        tone: configData.tone as string || 'consultivo, rápido e técnico',
        customPrompt: configData.customPrompt as string || '',
        systemPromptTemplate: configData.systemPromptTemplate as string || '',
        businessNiche: configData.businessNiche as string || 'Drywall, Steel Frame e Acabamentos',
        maxReplyChars: (configData.maxReplyChars as number) || 420,
        autoReplyEnabled: configData.autoReplyEnabled !== false,
        qualificationQuestions: (configData.qualificationQuestions as string[]) || [
          'Onde fica a sua obra exatamente?',
          'Qual o tamanho aproximado da área?',
          'Em qual estágio a obra se encontra hoje?'
        ],
      });
    }
  }, [configData]);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(config);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

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

  if (isConfigLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Agente IA</Typography>
          <Typography variant="body2" color="text.secondary">Configure o comportamento e conhecimento do seu agente</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<History />}>Versões</Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleSave}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </Box>
      </Box>

      {(updateConfig.isSuccess) && (
        <Alert severity="success" sx={{ mb: 2 }}>Configuração salva com sucesso!</Alert>
      )}

      <Card className="glass-panel stagger-entrance">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Prompt & Personalidade" />
          <Tab label="Comportamento" />
          <Tab label="Qualificação" />
        </Tabs>

        <CardContent sx={{ p: 4 }}>
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField 
                label="Nome da Empresa" 
                value={config.companyName} 
                onChange={(e) => setConfig({...config, companyName: e.target.value})}
                fullWidth 
              />
              <TextField 
                label="CTA Principal" 
                value={config.primaryCTA} 
                onChange={(e) => setConfig({...config, primaryCTA: e.target.value})}
                fullWidth 
                helperText="Call-to-action principal (ex: Agendar uma reunião)"
              />
              <TextField 
                label="Nichos de Atuação" 
                value={config.businessNiche} 
                onChange={(e) => setConfig({...config, businessNiche: e.target.value})}
                fullWidth 
                helperText="Ex: locação de andaimes, construção civil"
              />
              <TextField 
                label="Prompt Personalizado" 
                value={config.customPrompt} 
                onChange={(e) => setConfig({...config, customPrompt: e.target.value})}
                multiline 
                rows={4} 
                fullWidth 
                helperText="Instruções adicionais para o agente de IA"
              />
              <TextField 
                label="Template do System Prompt (Core)" 
                value={config.systemPromptTemplate} 
                onChange={(e) => setConfig({...config, systemPromptTemplate: e.target.value})}
                multiline 
                rows={12} 
                fullWidth 
                helperText="Template base do comportamento do agente (Avançado). Use {{knowledgeBase}} para inserir o conhecimento."
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={config.autoReplyEnabled} 
                    onChange={(e) => setConfig({...config, autoReplyEnabled: e.target.checked})} 
                  />
                } 
                label="Responder automaticamente" 
              />
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Tom de Voz: {config.tone}
                </Typography>
                <TextField 
                  select 
                  SelectProps={{ native: true }}
                  value={config.tone} 
                  onChange={(e) => setConfig({...config, tone: e.target.value})}
                  fullWidth
                >
                  <option value="formal">Formal</option>
                  <option value="consultivo">Consultivo</option>
                  <option value="amigavel">Amigável</option>
                  <option value="tecnico">Técnico</option>
                </TextField>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Limite de Caracteres: {config.maxReplyChars}
                </Typography>
                <Slider 
                  value={config.maxReplyChars} 
                  onChange={(_, v) => setConfig({...config, maxReplyChars: v as number})} 
                  min={100} 
                  max={1000} 
                  step={20}
                />
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>Perguntas de Qualificação</Typography>
                <Button 
                  startIcon={<Add />} 
                  size="small"
                  onClick={() => setConfig({...config, qualificationQuestions: [...config.qualificationQuestions, '']})}
                >
                  Adicionar
                </Button>
              </Box>
              <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {config.qualificationQuestions.map((q, idx) => (
                  <ListItem key={idx} className="hover-lift" sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.02)', 
                    borderRadius: 2, 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    px: 2,
                    py: 1.5,
                    mb: 1
                  }}>
                    <ListItemText 
                      primary={
                        <TextField 
                          value={q} 
                          onChange={(e) => {
                            const newQuestions = [...config.qualificationQuestions];
                            newQuestions[idx] = e.target.value;
                            setConfig({...config, qualificationQuestions: newQuestions});
                          }}
                          placeholder="Digite uma pergunta de qualificação..."
                          fullWidth
                          size="small"
                          variant="standard"
                          sx={{ '& .MuiInput-root': { color: 'text.primary', fontWeight: 500, '&:before, &:after': { display: 'none' } } }}
                        />
                      } 
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        size="small"
                        onClick={() => {
                          const newQuestions = config.qualificationQuestions.filter((_, i) => i !== idx);
                          setConfig({...config, qualificationQuestions: newQuestions});
                        }}
                        sx={{ color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'error.light' } }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={openKnowledgeDialog} onClose={() => setOpenKnowledgeDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingKnowledge ? 'Editar Conhecimento' : 'Novo Item de Conhecimento'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField 
            label="Título/Assunto" 
            fullWidth 
            value={knowledgeForm.title} 
            onChange={(e) => setKnowledgeForm({...knowledgeForm, title: e.target.value})}
          />
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
          </TextField>
          <TextField 
            label="Conteúdo/Descrição" 
            fullWidth 
            multiline 
            rows={6} 
            value={knowledgeForm.content} 
            onChange={(e) => setKnowledgeForm({...knowledgeForm, content: e.target.value})}
            helperText="Detalhes que o agente usará para responder."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKnowledgeDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleKnowledgeSubmit}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}