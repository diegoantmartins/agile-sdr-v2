import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, IconButton, Select, MenuItem, FormControl, Alert, Avatar, Divider, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { TrendingUp, TrendingDown, People, CalendarMonth, ArrowForward, Send, AutoAwesome, SmartToy } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboard, useHotLeads, useHealthCheck } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const mockDailyData = [
  { date: '01/04', conversations: 15, qualified: 8, meetings: 3 },
  { date: '02/04', conversations: 18, qualified: 10, meetings: 4 },
  { date: '03/04', conversations: 12, qualified: 6, meetings: 2 },
  { date: '04/04', conversations: 22, qualified: 12, meetings: 5 },
  { date: '05/04', conversations: 16, qualified: 8, meetings: 3 },
  { date: '06/04', conversations: 20, qualified: 11, meetings: 4 },
  { date: '07/04', conversations: 18, qualified: 9, meetings: 3 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6'];

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

function MetricCard({ title, value, subtitle, change, icon, color = 'rgba(59, 130, 246, 0.1)' }: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  
  return (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent sx={{ p: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ 
            bgcolor: color, 
            borderRadius: 2, 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'primary.light',
            boxShadow: 'inset 0 0 12px rgba(255,255,255,0.05)'
          }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Chip 
              size="small" 
              icon={isPositive ? <TrendingUp style={{ color: '#10B981' }} /> : <TrendingDown style={{ color: '#EF4444' }} />} 
              label={`${isPositive ? '+' : ''}${change}%`} 
              sx={{ 
                bgcolor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isPositive ? '#10B981' : '#EF4444',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.75rem'
              }} 
            />
          )}
        </Box>
        <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState('7d');
  const { user } = useAuth();
  const { data: stats, error: statsError } = useDashboard();
  const { data: hotLeads } = useHotLeads();
  const { data: health } = useHealthCheck();

  if (statsError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar dados do dashboard. Verifique a conexão com o servidor.
        </Alert>
      </Box>
    );
  }

  const intentDistribution = stats?.intentDistribution || [
    { intent: 'TRIAGE', count: 10 },
    { intent: 'SUPPORT', count: 5 },
    { intent: 'BUY_NOW', count: 3 }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Dashboard de Operações</Typography>
          <Typography variant="body2" color="text.secondary">
            Métricas em tempo real da Agile Steel • {user?.tenantId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {health && (
            <Chip 
              size="small" 
              label={health.services?.database === 'connected' ? 'Servidor Ativo' : 'Instabilidade'} 
              color={health.services?.database === 'connected' ? 'success' : 'error'}
              sx={{ fontWeight: 600 }}
            />
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="7d">Últimos 7 dias</MenuItem>
              <MenuItem value="30d">Últimos 30 dias</MenuItem>
              <MenuItem value="90d">Últimos 90 dias</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Row 1: Key Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Disparos Hoje" 
            value={stats?.metrics?.messagesToday || 0} 
            subtitle="Mensagens de saída enviadas"
            icon={<Send />} 
            color="rgba(16, 185, 129, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Ações do Agente" 
            value={stats?.metrics?.agentResponses || 0} 
            subtitle="Respostas geradas pela IA"
            icon={<AutoAwesome />} 
            color="rgba(139, 92, 246, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Transbordos Pendentes" 
            value={stats?.metrics?.pendingHandoffs || 0} 
            subtitle="Leads aguardando humano"
            icon={<People />} 
            color="rgba(239, 68, 68, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard 
            title="Leads Quentes" 
            value={hotLeads?.length || stats?.hotOpportunities || 0} 
            subtitle="Prontos para fechamento"
            icon={<CalendarMonth />} 
          />
        </Grid>

        {/* Row 2: Charts and Distribution */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3}>Performance de Engajamento</Typography>
              <Box sx={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockDailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111827', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="conversations" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} name="Conversas" />
                    <Line type="monotone" dataKey="qualified" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Qualificados" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={3}>Intenções do Público</Typography>
              <Box sx={{ height: 200, width: '100%', mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={intentDistribution} 
                      dataKey="count" 
                      nameKey="intent" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={85} 
                      stroke="none"
                      paddingAngle={5}
                    >
                      {intentDistribution.map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {intentDistribution.map((item: any, idx: number) => (
                  <Box key={item.intent} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{item.intent}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{item.count}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 3: Recent Activity and Insights */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>Atividade Recente do Agente</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>Últimas interações em tempo real</Typography>
              <List>
                {stats?.recentActivity?.map((activity: any, idx: number) => (
                  <Box key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.isAiGenerated ? 'primary.main' : 'secondary.main' }}>
                          {activity.isAiGenerated ? <AutoAwesome fontSize="small" /> : <People fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.leadName}
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.8rem'
                          }}>
                            {activity.content}
                          </Typography>
                        }
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </ListItem>
                    {idx < stats.recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                  </Box>
                )) || <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.5 }}>Nenhuma atividade recente.</Typography>}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                borderColor: 'rgba(59, 130, 246, 0.2)',
                position: 'relative'
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ 
                    bgcolor: 'rgba(59, 130, 246, 0.15)', 
                    borderRadius: 3, 
                    p: 2, 
                    fontSize: '2rem'
                  }}>🤖</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.light">Synapsea Insight</Typography>
                    <Typography variant="body1">
                      {stats && stats.metrics?.messagesToday > 10
                        ? `O agente está operando em alta performance hoje com ${stats.metrics.messagesToday} envios. Taxa de conversão subiu 5% nesta semana.`
                        : 'Hoje observamos uma oportunidade para novos disparos. Leads que receberam orçamentos há mais de 7 dias estão prontos para reativação.'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><People /></Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>Base Total de Leads</Typography>
                      <Typography variant="body2" color="text.secondary">{stats?.totalContacts || 0} contatos importados</Typography>
                    </Box>
                  </Box>
                  <IconButton size="small"><ArrowForward /></IconButton>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><SmartToy /></Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>Configurações da IA</Typography>
                      <Typography variant="body2" color="text.secondary">Playbook técnico ativo</Typography>
                    </Box>
                  </Box>
                  <IconButton size="small"><ArrowForward /></IconButton>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}