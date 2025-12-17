import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Calendar, Clock, Users, Smartphone, TrendingUp, Bell, Check, ArrowRight, Star } from 'lucide-react';

const Landing = () => {
  const benefits = [
    { icon: Calendar, title: 'Agenda 24/7', description: 'Seus clientes podem agendar a qualquer hora, mesmo quando você não está disponível.' },
    { icon: Bell, title: 'Menos No-Shows', description: 'Lembretes automáticos reduzem faltas e cancelamentos de última hora.' },
    { icon: Smartphone, title: 'Fácil de Usar', description: 'Interface intuitiva que qualquer pessoa consegue usar sem treinamento.' },
    { icon: Users, title: 'Múltiplos Profissionais', description: 'Gerencie a agenda de toda a sua equipe em um só lugar.' },
    { icon: TrendingUp, title: 'Relatórios Completos', description: 'Acompanhe métricas importantes e tome decisões baseadas em dados.' },
    { icon: Clock, title: 'Economize Tempo', description: 'Pare de perder tempo com agendamentos por telefone ou WhatsApp.' },
  ];

  const steps = [
    { number: '1', title: 'Cadastre-se', description: 'Crie sua conta em menos de 2 minutos. Sem cartão de crédito.' },
    { number: '2', title: 'Configure', description: 'Adicione seus serviços, horários e profissionais.' },
    { number: '3', title: 'Receba Agendamentos', description: 'Compartilhe seu link e comece a receber agendamentos.' },
  ];

  const faqs = [
    { question: 'Preciso de cartão de crédito para começar?', answer: 'Não! Você tem 7 dias grátis para testar todas as funcionalidades. Só pedimos o cartão quando decidir continuar.' },
    { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, você pode cancelar sua assinatura quando quiser, sem multas ou taxas adicionais.' },
    { question: 'Meus clientes precisam criar conta?', answer: 'Não! Seus clientes agendam diretamente pelo link, sem precisar criar conta ou baixar aplicativo.' },
    { question: 'Funciona para qual tipo de negócio?', answer: 'Barbearias, salões de beleza, clínicas, consultórios, estúdios de tatuagem, personal trainers, e qualquer negócio que trabalhe com agendamentos.' },
    { question: 'Posso cobrar antecipado dos clientes?', answer: 'Sim! Você pode ativar o pagamento antecipado para evitar no-shows. O cliente paga ao agendar.' },
  ];

  const features = [
    'Agendamento online 24/7',
    'Link exclusivo para sua empresa',
    'Gestão de múltiplos profissionais',
    'Relatórios e métricas',
    'Pagamento antecipado (opcional)',
    'Suporte por chat',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">AgendaPro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gradient-primary">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
            <Star className="w-4 h-4 fill-current" />
            7 dias grátis para testar
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Agenda online que{' '}
            <span className="gradient-text">funciona sozinha</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Pare de perder clientes e tempo com agendamentos manuais. Deixe seus clientes agendarem direto pelo link, 24 horas por dia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/auth?mode=signup">
              <Button size="lg" className="gradient-primary text-lg px-8 py-6 w-full sm:w-auto">
                Começar Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/agendar/demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                Ver Demonstração
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Problems */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Cansado de perder tempo e clientes?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">😩</div>
                <h3 className="font-semibold mb-2">Agenda Bagunçada</h3>
                <p className="text-muted-foreground text-sm">Anotações em papel, WhatsApp lotado, horários perdidos.</p>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">😤</div>
                <h3 className="font-semibold mb-2">Clientes que Faltam</h3>
                <p className="text-muted-foreground text-sm">No-shows frequentes que prejudicam seu faturamento.</p>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="font-semibold mb-2">Tempo Perdido</h3>
                <p className="text-muted-foreground text-sm">Horas no telefone confirmando e reagendando horários.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Tudo que você precisa para{' '}
            <span className="gradient-text">crescer</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Funcionalidades pensadas para facilitar sua vida e melhorar a experiência dos seus clientes.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="glass-card hover-lift group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simples assim
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Em 3 passos você está pronto para receber agendamentos.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                  {step.number}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-lg">
          <h2 className="text-3xl font-bold text-center mb-4">
            Preço simples e{' '}
            <span className="gradient-text">justo</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Um único plano com tudo incluído. Sem surpresas.
          </p>
          
          <Card className="glass-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
                  7 dias grátis
                </div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold">12,99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/auth?mode=signup" className="block">
                <Button size="lg" className="w-full gradient-primary text-lg py-6">
                  Começar 7 Dias Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Sem compromisso • Cancele quando quiser
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="glass-card rounded-lg px-6 border-none">
                <AccordionTrigger className="hover:no-underline font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seu{' '}
            <span className="gradient-text">negócio</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de profissionais que já simplificaram sua rotina.
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg" className="gradient-primary text-lg px-12 py-6">
              Começar Agora — É Grátis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">AgendaPro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgendaPro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
