import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Clock, TrendingUp, Settings, Plus, ExternalLink, LogOut, AlertTriangle } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  totalServices: number;
  totalProfessionals: number;
}

interface Appointment {
  id: string;
  client_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
  service: { name: string };
  professional: { name: string } | null;
}

const Dashboard = () => {
  const { user, company, subscription, isLoading, isSubscriptionActive, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ todayAppointments: 0, weekAppointments: 0, totalServices: 0, totalProfessionals: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (company) {
      fetchDashboardData();
    }
  }, [company]);

  const fetchDashboardData = async () => {
    if (!company) return;

    const today = new Date().toISOString().split('T')[0];
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const [appointmentsToday, appointmentsWeek, services, professionals, upcoming] = await Promise.all([
      supabase.from('appointments').select('id', { count: 'exact' }).eq('company_id', company.id).eq('appointment_date', today),
      supabase.from('appointments').select('id', { count: 'exact' }).eq('company_id', company.id).gte('appointment_date', today).lte('appointment_date', weekEndStr),
      supabase.from('services').select('id', { count: 'exact' }).eq('company_id', company.id).eq('is_active', true),
      supabase.from('professionals').select('id', { count: 'exact' }).eq('company_id', company.id).eq('is_active', true),
      supabase.from('appointments').select(`
        id, client_name, appointment_date, start_time, status,
        service:services(name),
        professional:professionals(name)
      `).eq('company_id', company.id).gte('appointment_date', today).order('appointment_date', { ascending: true }).order('start_time', { ascending: true }).limit(5)
    ]);

    setStats({
      todayAppointments: appointmentsToday.count || 0,
      weekAppointments: appointmentsWeek.count || 0,
      totalServices: services.count || 0,
      totalProfessionals: professionals.count || 0,
    });

    if (upcoming.data) {
      setUpcomingAppointments(upcoming.data as unknown as Appointment[]);
    }

    setLoadingData(false);
  };

  const handleCheckout = async () => {
    const { data, error } = await supabase.functions.invoke('create-checkout');
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const handleManageSubscription = async () => {
    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const formatAppointmentDate = (date: string) => {
    const parsed = parseISO(date);
    if (isToday(parsed)) return 'Hoje';
    if (isTomorrow(parsed)) return 'Amanhã';
    return format(parsed, "dd 'de' MMM", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
      completed: { label: 'Concluído', variant: 'outline' },
    };
    const { label, variant } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const daysLeft = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const showTrialWarning = subscription?.status === 'trialing' && daysLeft <= 3;
  const showSubscriptionBlock = !isSubscriptionActive;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">AgendaPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Subscription Block */}
        {showSubscriptionBlock && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Sua assinatura expirou</p>
                  <p className="text-sm text-muted-foreground">Assine agora para continuar usando o AgendaPro</p>
                </div>
              </div>
              <Button onClick={handleCheckout} className="gradient-primary">
                Assinar Agora — R$ 12,99/mês
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trial Warning */}
        {showTrialWarning && (
          <Card className="mb-6 border-warning bg-warning/10">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-warning" />
                <div>
                  <p className="font-semibold">Seu período de teste termina em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</p>
                  <p className="text-sm text-muted-foreground">Assine agora para não perder acesso</p>
                </div>
              </div>
              <Button onClick={handleCheckout} className="gradient-primary">
                Assinar — R$ 12,99/mês
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Olá, {company?.name || 'Empresa'} 👋</h1>
          <p className="text-muted-foreground">Aqui está o resumo da sua agenda</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Hoje</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              {loadingData ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats.todayAppointments}</p>
              )}
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Esta Semana</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              {loadingData ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats.weekAppointments}</p>
              )}
              <p className="text-xs text-muted-foreground">agendamentos</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Serviços</span>
                <Clock className="w-5 h-5 text-primary" />
              </div>
              {loadingData ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats.totalServices}</p>
              )}
              <p className="text-xs text-muted-foreground">cadastrados</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Profissionais</span>
                <Users className="w-5 h-5 text-primary" />
              </div>
              {loadingData ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{stats.totalProfessionals}</p>
              )}
              <p className="text-xs text-muted-foreground">ativos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Próximos Agendamentos</CardTitle>
                  <CardDescription>Seus próximos compromissos</CardDescription>
                </div>
                <Link to="/appointments">
                  <Button variant="outline" size="sm">Ver Todos</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento nos próximos dias</p>
                    <p className="text-sm text-muted-foreground">Compartilhe seu link para receber agendamentos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.client_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.service?.name}
                              {appointment.professional && ` • ${appointment.professional.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatAppointmentDate(appointment.appointment_date)}</p>
                          <p className="text-sm text-muted-foreground">{appointment.start_time.slice(0, 5)}</p>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Seu Link de Agendamento</CardTitle>
                <CardDescription>Compartilhe com seus clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-muted text-sm font-mono break-all mb-4">
                  {window.location.origin}/agendar/{company?.slug}
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendar/${company?.slug}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/services" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </Link>
                <Link to="/professionals" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Adicionar Profissional
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {subscription?.status === 'active' && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Assinatura</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="mb-4 bg-success text-success-foreground">Ativa</Badge>
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
                    Gerenciar Assinatura
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
