import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft, Phone, Mail, Clock, User, Check, X, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price: number;
  notes: string | null;
  service: { name: string; duration_minutes: number };
  professional: { name: string } | null;
}

const Appointments = () => {
  const { user, company, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (company) fetchAppointments();
  }, [company, statusFilter]);

  const fetchAppointments = async () => {
    if (!company) return;
    
    let query = supabase
      .from('appointments')
      .select(`
        id, client_name, client_email, client_phone, appointment_date, start_time, end_time, status, price, notes,
        service:services(name, duration_minutes),
        professional:professionals(name)
      `)
      .eq('company_id', company.id)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    if (data) setAppointments(data as unknown as Appointment[]);
    setLoadingData(false);
  };

  const updateStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado!' });
      fetchAppointments();
      setSelectedAppointment(null);
    }
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

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Agendamentos</span>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loadingData ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="p-6 h-24"></CardContent>
              </Card>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground">Compartilhe seu link para receber agendamentos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="glass-card hover-lift">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(appointment.appointment_date), 'MMM', { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {format(parseISO(appointment.appointment_date), 'dd')}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{appointment.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.service?.name}
                          {appointment.professional && ` • ${appointment.professional.name}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(appointment.status)}
                      <span className="font-semibold text-primary">{formatPrice(appointment.price)}</span>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedAppointment(appointment)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedAppointment.client_name}</p>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAppointment.client_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm truncate">{selectedAppointment.client_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {format(parseISO(selectedAppointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.start_time.slice(0, 5)} - {selectedAppointment.end_time.slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedAppointment.service?.name}</p>
                    {selectedAppointment.professional && (
                      <p className="text-sm text-muted-foreground">com {selectedAppointment.professional.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="font-medium">Valor</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(selectedAppointment.price)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status atual:</span>
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                {selectedAppointment.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-success hover:bg-success/90" 
                      onClick={() => updateStatus(selectedAppointment.id, 'confirmed')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}

                {selectedAppointment.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 gradient-primary"
                      onClick={() => updateStatus(selectedAppointment.id, 'completed')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Marcar como Concluído
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Appointments;
