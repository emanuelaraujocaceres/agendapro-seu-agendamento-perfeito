import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Check, ArrowLeft, ArrowRight, Loader2, MapPin, Phone } from 'lucide-react';
import { format, addMinutes, parse, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  advance_payment_enabled: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
}

interface Professional {
  id: string;
  name: string;
}

interface BusinessHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface Appointment {
  appointment_date: string;
  start_time: string;
  end_time: string;
}

const Booking = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);

  useEffect(() => {
    if (slug) fetchCompanyData();
  }, [slug]);

  const fetchCompanyData = async () => {
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!companyData) {
      setLoading(false);
      return;
    }

    setCompany(companyData);

    const [servicesRes, professionalsRes, hoursRes] = await Promise.all([
      supabase.from('services').select('*').eq('company_id', companyData.id).eq('is_active', true).order('name'),
      supabase.from('professionals').select('*').eq('company_id', companyData.id).eq('is_active', true).order('name'),
      supabase.from('business_hours').select('*').eq('company_id', companyData.id).order('day_of_week'),
    ]);

    if (servicesRes.data) setServices(servicesRes.data);
    if (professionalsRes.data) setProfessionals(professionalsRes.data);
    if (hoursRes.data) setBusinessHours(hoursRes.data);
    
    setLoading(false);
  };

  const fetchAppointmentsForDate = async (date: Date) => {
    if (!company) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time')
      .eq('company_id', company.id)
      .eq('appointment_date', dateStr)
      .neq('status', 'cancelled');
    
    if (data) setExistingAppointments(data);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsForDate(selectedDate);
    }
  }, [selectedDate]);

  const getAvailableSlots = () => {
    if (!selectedDate || !selectedService || businessHours.length === 0) return [];

    const dayOfWeek = selectedDate.getDay();
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    if (!dayHours || dayHours.is_closed) return [];

    const slots: string[] = [];
    const startTime = parse(dayHours.start_time, 'HH:mm:ss', selectedDate);
    const endTime = parse(dayHours.end_time, 'HH:mm:ss', selectedDate);
    const now = new Date();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

    let currentSlot = startTime;

    while (isBefore(addMinutes(currentSlot, selectedService.duration_minutes), endTime) || 
           format(addMinutes(currentSlot, selectedService.duration_minutes), 'HH:mm') === format(endTime, 'HH:mm')) {
      const slotTime = format(currentSlot, 'HH:mm');
      const slotEnd = format(addMinutes(currentSlot, selectedService.duration_minutes), 'HH:mm');
      
      // Skip past times if today
      if (isToday && isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, 30);
        continue;
      }

      // Check for conflicts with existing appointments
      const hasConflict = existingAppointments.some(apt => {
        const aptStart = apt.start_time.slice(0, 5);
        const aptEnd = apt.end_time.slice(0, 5);
        return (slotTime < aptEnd && slotEnd > aptStart);
      });

      if (!hasConflict) {
        slots.push(slotTime);
      }

      currentSlot = addMinutes(currentSlot, 30);
    }

    return slots;
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (isAfter(date, addDays(new Date(), 60))) return true;
    
    const dayOfWeek = date.getDay();
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
    
    return !dayHours || dayHours.is_closed;
  };

  const handleSubmit = async () => {
    if (!company || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    const endTime = format(
      addMinutes(parse(selectedTime, 'HH:mm', new Date()), selectedService.duration_minutes),
      'HH:mm'
    );

    const { error } = await supabase.from('appointments').insert({
      company_id: company.id,
      service_id: selectedService.id,
      professional_id: selectedProfessional?.id || null,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime,
      end_time: endTime,
      price: selectedService.price,
      status: 'pending'
    });

    if (error) {
      toast({ title: 'Erro ao agendar', description: error.message, variant: 'destructive' });
    } else {
      setBookingComplete(true);
    }
    setSubmitting(false);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
            <p className="text-muted-foreground">Verifique se o link está correto.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Agendamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Você receberá uma confirmação no email {clientEmail}
            </p>
            <div className="p-4 rounded-lg bg-muted text-left space-y-2">
              <p><strong>Serviço:</strong> {selectedService?.name}</p>
              <p><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {selectedTime}</p>
              {selectedProfessional && <p><strong>Profissional:</strong> {selectedProfessional.name}</p>}
              <p><strong>Valor:</strong> {selectedService && formatPrice(selectedService.price)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          {company.address && (
            <p className="text-muted-foreground flex items-center justify-center gap-1 mt-2">
              <MapPin className="w-4 h-4" />
              {company.address}
            </p>
          )}
          {company.phone && (
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              <Phone className="w-4 h-4" />
              {company.phone}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                ${step >= s ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <Card className="glass-card animate-fade-in">
            <CardHeader>
              <CardTitle>Escolha o Serviço</CardTitle>
              <CardDescription>Selecione o serviço que deseja agendar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(professionals.length > 0 ? 2 : 3); }}
                    className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-accent/50
                      ${selectedService?.id === service.id ? 'border-primary bg-accent/50' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {service.duration_minutes} minutos
                        </p>
                      </div>
                      <span className="font-semibold text-primary">{formatPrice(service.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Professional Selection */}
        {step === 2 && professionals.length > 0 && (
          <Card className="glass-card animate-fade-in">
            <CardHeader>
              <CardTitle>Escolha o Profissional</CardTitle>
              <CardDescription>Selecione quem vai te atender (opcional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <button
                  onClick={() => { setSelectedProfessional(null); setStep(3); }}
                  className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-accent/50
                    ${selectedProfessional === null ? 'border-primary bg-accent/50' : 'border-border'}`}
                >
                  <p className="font-medium">Sem preferência</p>
                  <p className="text-sm text-muted-foreground">Qualquer profissional disponível</p>
                </button>
                {professionals.map((professional) => (
                  <button
                    key={professional.id}
                    onClick={() => { setSelectedProfessional(professional); setStep(3); }}
                    className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-accent/50
                      ${selectedProfessional?.id === professional.id ? 'border-primary bg-accent/50' : 'border-border'}`}
                  >
                    <p className="font-medium">{professional.name}</p>
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setStep(1)} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date & Time Selection */}
        {step === 3 && (
          <Card className="glass-card animate-fade-in">
            <CardHeader>
              <CardTitle>Escolha Data e Horário</CardTitle>
              <CardDescription>Selecione quando deseja ser atendido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                    disabled={isDateDisabled}
                    locale={ptBR}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">Horários Disponíveis</p>
                  {selectedDate ? (
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {getAvailableSlots().map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 rounded-lg border text-sm transition-all hover:border-primary hover:bg-accent/50
                            ${selectedTime === slot ? 'border-primary bg-accent/50 font-medium' : 'border-border'}`}
                        >
                          {slot}
                        </button>
                      ))}
                      {getAvailableSlots().length === 0 && (
                        <p className="col-span-3 text-sm text-muted-foreground text-center py-4">
                          Nenhum horário disponível nesta data
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecione uma data primeiro</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(professionals.length > 0 ? 2 : 1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  disabled={!selectedDate || !selectedTime}
                  className="gradient-primary"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Client Info */}
        {step === 4 && (
          <Card className="glass-card animate-fade-in">
            <CardHeader>
              <CardTitle>Seus Dados</CardTitle>
              <CardDescription>Preencha seus dados para finalizar o agendamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={clientEmail} 
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-muted space-y-2 mt-6">
                  <p className="font-medium mb-2">Resumo do Agendamento</p>
                  <p className="text-sm"><strong>Serviço:</strong> {selectedService?.name}</p>
                  <p className="text-sm"><strong>Data:</strong> {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
                  <p className="text-sm"><strong>Horário:</strong> {selectedTime}</p>
                  {selectedProfessional && <p className="text-sm"><strong>Profissional:</strong> {selectedProfessional.name}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
                    <span className="font-medium">Valor Total</span>
                    <span className="text-lg font-bold text-primary">{selectedService && formatPrice(selectedService.price)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!clientName || !clientEmail || !clientPhone || submitting}
                  className="gradient-primary"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Booking;
