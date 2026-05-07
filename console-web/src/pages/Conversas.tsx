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
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700}>Central de Conversas</Typography>
        <Typography variant="body2" color="text.secondary">Gerencie todas as conversas do seu agente</Typography>
      </Box>

      <Card sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: 350, borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
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
              {filtered.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">Nenhuma conversa encontrada</Typography>
                </Box>
              )}
            </List>
          )}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{selected.lead.name.charAt(0)}</Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>{selected.lead.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.lead.phone}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" startIcon={<Person />}>Assumir</Button>
                </Box>
              </Box>

              <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#F8FAFC' }}>
                {selected.messages.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                    <Typography variant="body2">Nenhuma mensagem nesta conversa</Typography>
                  </Box>
                ) : (
                  selected.messages.map((msg, idx) => (
                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.direction === 'incoming' ? 'flex-start' : 'flex-end', mb: 2 }}>
                      <Box sx={{ maxWidth: '70%', p: 2, borderRadius: 2, bgcolor: msg.direction === 'incoming' ? 'white' : 'primary.main', color: msg.direction === 'incoming' ? 'text.primary' : 'white', boxShadow: 1 }}>
                        <Typography variant="body2">{msg.content}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {msg.isAiGenerated && <Chip size="small" icon={<SmartToy />} label="IA" sx={{ height: 18, fontSize: '0.65rem' }} />}
                        {msg.intentDetected && <Chip size="small" label={msg.intentDetected} sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#E0E7FF', color: '#4338CA' }} />}
                        <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Typography>
                      </Box>
                    </Box>
                  ))
                )}
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

        <Box sx={{ width: 280, borderLeft: '1px solid #E2E8F0', p: 2, overflow: 'auto' }}>
          <Typography variant="subtitle2" fontWeight={600} mb={2}>Informações do Lead</Typography>
          {selected && (
            <>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Nome</Typography><Typography variant="body2" fontWeight={600}>{selected.lead.name}</Typography></Box>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Telefone</Typography><Typography variant="body2">{selected.lead.phone}</Typography></Box>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Temperatura</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  {(['cold', 'warm', 'hot'] as const).map((t) => (
                    <Box key={t} sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: selected.lead.temperature === t ? temperatureColors[t] : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected.lead.temperature === t ? 'white' : 'text.secondary', fontSize: '0.7rem' }}>
                      {t === 'cold' ? '❄' : t === 'warm' ? '🌡' : '🔥'}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}><Typography variant="caption" color="text.secondary">Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {selected.lead.source && <Chip size="small" label={selected.lead.source} sx={{ fontSize: '0.7rem' }} />}
                  <Chip size="small" label="+ adicionar" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} mb={2}>Decisões da IA</Typography>
              {selected.messages.some(m => m.intentDetected) ? (
                selected.messages.filter(m => m.intentDetected).slice(0, 3).map((msg, idx) => (
                  <Box key={idx} sx={{ bgcolor: '#F0F9FF', borderRadius: 1, p: 1.5, mb: 1 }}>
                    <Typography variant="caption" color="#0369A1" fontWeight={600}>{msg.intentDetected}</Typography>
                    <Typography variant="body2" color="#075985" fontSize="0.8rem">{msg.content.substring(0, 50)}...</Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Nenhuma intenção detectada</Typography>
              )}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
}