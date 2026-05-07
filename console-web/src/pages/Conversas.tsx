import { useState } from 'react';
import { Box, Card, Typography, List, ListItem, ListItemButton, ListItemAvatar, ListItemText, Avatar, Chip, TextField, IconButton, Button, Divider, Badge, ToggleButton, ToggleButtonGroup, CircularProgress, Alert } from '@mui/material';
import { Send, Person, SmartToy } from '@mui/icons-material';
import { useLeads, useMessages } from '../hooks/useApi';
import { Lead, Message } from '../services/api';

const temperatureColors: Record<string, string> = { hot: '#EF4444', warm: '#F59E0B', cold: '#3B82F6' };

interface ConversationData {
  lead: Lead;
  messages: Message[];
}

export default function Conversas() {
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');

  const { data: leads, isLoading: leadsLoading, error: leadsError } = useLeads();
  const { data: messages, isLoading: messagesLoading } = useMessages();

  const conversations: ConversationData[] = (leads || []).map((lead: Lead) => {
    const leadMessages = (messages || []).filter((m: Message) => m.leadId === lead.id);
    return { lead, messages: leadMessages };
  }).filter((c) => c.messages.length > 0);

  const selected = conversations.find(c => c.lead.phone === selectedPhone);
  
  const filtered = filter === 'all' 
    ? conversations 
    : conversations.filter(c => c.messages.some(m => filter === 'ai' ? m.isAiGenerated : !m.isAiGenerated));

  if (leadsError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar conversas. Verifique a conexão com o servidor.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Central de Conversas</Typography>
        <Typography variant="body2" color="text.secondary">Gerencie todas as conversas do seu agente</Typography>
      </Box>

      <Card sx={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar contatos - oculta em mobile se houver conversa selecionada */}
        <Box sx={{ 
          width: { xs: '100%', md: 350 }, 
          display: { xs: selectedPhone ? 'none' : 'flex', md: 'flex' },
          borderRight: '1px solid #E2E8F0', 
          flexDirection: 'column' 
        }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}>
            <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" fullWidth>
              <ToggleButton value="all">Todas</ToggleButton>
              <ToggleButton value="ai">IA</ToggleButton>
              <ToggleButton value="human">Humano</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {leadsLoading || messagesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {filtered.map((conv) => (
                <ListItem key={conv.lead.phone} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton selected={selectedPhone === conv.lead.phone} onClick={() => setSelectedPhone(conv.lead.phone)} sx={{ borderRadius: 1 }}>
                    <ListItemAvatar>
                      <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<Box sx={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid white', bgcolor: temperatureColors[conv.lead.temperature] || '#3B82F6' }} />}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>{conv.lead.name.charAt(0)}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{conv.lead.name}</Typography>
                        <Chip size="small" icon={conv.messages[0]?.isAiGenerated ? <SmartToy /> : <Person />} label={conv.messages[0]?.isAiGenerated ? 'IA' : 'Humano'} sx={{ height: 20, fontSize: '0.7rem' }} color={conv.messages[0]?.isAiGenerated ? 'primary' : 'default'} />
                      </Box>}
                      secondary={<Typography variant="caption" noWrap>{conv.messages[conv.messages.length - 1]?.content}</Typography>}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Chat - oculta em mobile se não houver conversa selecionada */}
        <Box sx={{ 
          flex: 1, 
          display: { xs: selectedPhone ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column' 
        }}>
          {selected ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton sx={{ display: { md: 'none' }, ml: -1 }} onClick={() => setSelectedPhone('')}>
                    <Send sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>{selected.lead.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{selected.lead.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.lead.phone}</Typography>
                  </Box>
                </Box>
                <Button variant="outlined" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Assumir</Button>
              </Box>

              <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#F8FAFC' }}>
                {selected.messages.map((msg, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.direction === 'incoming' ? 'flex-start' : 'flex-end', mb: 2 }}>
                    <Box sx={{ maxWidth: '85%', p: 2, borderRadius: 2, bgcolor: msg.direction === 'incoming' ? 'white' : 'primary.main', color: msg.direction === 'incoming' ? 'text.primary' : 'white', boxShadow: 1 }}>
                      <Typography variant="body2">{msg.content}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth size="small" placeholder="Digite sua mensagem..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                  <IconButton color="primary" disabled={!newMessage.trim()}><Send /></IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
              <Typography variant="body2">Selecione uma conversa para ver os detalhes</Typography>
            </Box>
          )}
        </Box>

        {/* Info - apenas em Desktop */}
        <Box sx={{ 
          width: 280, 
          display: { xs: 'none', lg: 'block' },
          borderLeft: '1px solid #E2E8F0', 
          p: 2, 
          overflow: 'auto' 
        }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>Informações do Lead</Typography>
          {selected && (
            <>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Nome</Typography><Typography variant="body2" fontWeight={600}>{selected.lead.name}</Typography></Box>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Telefone</Typography><Typography variant="body2">{selected.lead.phone}</Typography></Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={2}>Decisões da IA</Typography>
              {selected.messages.filter(m => m.intentDetected).slice(0, 3).map((msg, idx) => (
                <Box key={idx} sx={{ bgcolor: '#F0F9FF', borderRadius: 1, p: 1.5, mb: 1 }}>
                  <Typography variant="caption" color="#0369A1" fontWeight={600}>{msg.intentDetected}</Typography>
                  <Typography variant="body2" color="#075985" fontSize="0.8rem">{msg.content.substring(0, 50)}...</Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
}