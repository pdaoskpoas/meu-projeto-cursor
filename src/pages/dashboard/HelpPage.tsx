import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  Phone, 
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Book,
  FileText,
  Send,
  AlertCircle,
  Users,
  CreditCard,
  MessageSquare,
  Clock,
  CheckCircle,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ticketService, Ticket, TicketResponse } from '@/services/ticketService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FAQ {
  question: string;
  answer: string;
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  faqs: FAQ[];
}

const HelpPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isDashboardContext = location.pathname.startsWith('/dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState({
    subject: '',
    category: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<(Ticket & { responses: TicketResponse[] })[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showClosedTickets, setShowClosedTickets] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [showMyTickets, setShowMyTickets] = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Redirecionar para login se não estiver autenticado
    if (!user) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa fazer login para enviar um ticket de suporte.',
        variant: 'destructive'
      });
      
      // Salvar a intenção de enviar ticket no localStorage
      localStorage.setItem('pendingTicket', JSON.stringify(ticketData));
      localStorage.setItem('redirectAfterLogin', '/dashboard/help');
      
      navigate('/login');
      return;
    }

    // Validação
    if (!ticketData.subject || !ticketData.category || !ticketData.description) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos do ticket.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Salvar ticket no Supabase
      const ticket = await ticketService.createTicket({
        subject: ticketData.subject,
        category: ticketData.category,
        description: ticketData.description,
        userId: user.id
      });
      
      toast({
        title: 'Ticket enviado com sucesso!',
        description: `Ticket #${ticket.id.slice(0, 8)} criado. Nossa equipe responderá em breve. Você receberá um email com atualizações.`
      });
      
      // Limpar formulário
      setTicketData({ subject: '', category: '', description: '' });
      
    } catch (error) {
      console.error('Erro ao enviar ticket:', error);
      toast({
        title: 'Erro ao enviar ticket',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao enviar seu ticket. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketCategories = [
    { value: 'technical', label: 'Problema Técnico' },
    { value: 'billing', label: 'Planos e Pagamentos' },
    { value: 'account', label: 'Conta e Perfil' },
    { value: 'animals', label: 'Gestão de Animais' },
    { value: 'partnership', label: 'Sociedades' },
    { value: 'other', label: 'Outros' }
  ];

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Primeiros Passos',
      description: 'Como começar a usar a plataforma',
      icon: Book,
      faqs: [
        {
          question: 'Como criar minha conta?',
          answer: 'Para criar sua conta, clique em "Cadastre-se" no topo da página. Escolha entre conta pessoal ou institucional (para haras e fazendas). Preencha seus dados básicos como nome, CPF, e-mail e crie uma senha segura.'
        },
        {
          question: 'Como configurar meu perfil?',
          answer: 'Acesse o menu "Meu Perfil" no dashboard. Preencha informações importantes como foto de perfil, descrição do haras, localização, telefone e redes sociais. Para contas institucionais, adicione o logo do haras e informações sobre a propriedade.'
        },
        {
          question: 'Como adicionar meu primeiro animal?',
          answer: 'No dashboard, clique em "Adicionar Animal". Preencha as informações obrigatórias: nome, raça, sexo, data de nascimento e adicione pelo menos uma foto de qualidade. Você pode adicionar informações extras como genealogia, conquistas, características e vídeos. Após salvar, seu animal ficará visível em seu perfil e poderá ser encontrado nas buscas.'
        },
        {
          question: 'Quais são os planos disponíveis?',
          answer: 'Oferecemos planos com diferentes funcionalidades e recursos. Cada plano permite um número diferente de animais cadastrados. Consulte a página de planos para ver todas as opções e escolher a ideal para você. <a href="https://www.vitrinedocavalo.com.br/planos" class="text-blue-600 hover:text-blue-700 underline">Ver planos</a>'
        }
      ]
    },
    {
      id: 'animals',
      title: 'Gestão de Animais',
      description: 'Tudo sobre cadastro e gestão de animais',
      icon: HelpCircle,
      faqs: [
        {
          question: 'Como cadastrar um animal?',
          answer: 'Acesse "Meus Animais" no dashboard e clique em "Adicionar Animal". Preencha os dados obrigatórios: nome, raça, pelagem, sexo e data de nascimento. Adicione fotos de qualidade (recomendamos pelo menos 3 fotos). Você pode incluir informações sobre genealogia, registro, características físicas, temperamento e conquistas. Para animais à venda, informe o valor e condições.'
        },
        {
          question: 'Como editar informações do animal?',
          answer: 'Na lista de "Meus Animais", clique no animal que deseja editar. Você pode atualizar qualquer informação, adicionar ou remover fotos, incluir vídeos e modificar o status (disponível, vendido, reservado). As alterações são salvas automaticamente e ficam visíveis imediatamente no perfil público do animal.'
        },
        {
          question: 'O que é o sistema de turbinar?',
          answer: 'Turbinar destaca seu animal nos resultados de busca e na página inicial, aumentando significativamente a visibilidade. Cada turbinar dura 24 horas. O usuário pode aplicar vários turbinars para prolongar o tempo de destaque. 1 turbinar equivale a 24h de destaque. Animais turbinados aparecem no topo das listagens com um badge especial.'
        },
        {
          question: 'Quantas fotos posso adicionar?',
          answer: 'Independente do plano do usuário, cada animal pode ter no máximo 4 fotos. Recomendamos fotos de alta qualidade, bem iluminadas, mostrando diferentes ângulos do animal. A primeira foto será a capa do anúncio. Você pode reordenar as fotos arrastando-as na galeria.'
        }
      ]
    },
    {
      id: 'partnerships',
      title: 'Sociedades e Parcerias',
      description: 'Como funciona o sistema de sociedades',
      icon: Users,
      faqs: [
        {
          question: 'Como criar uma sociedade?',
          answer: 'Cada usuário possui um código único disponível no dashboard na área Sociedades. Esse código é utilizado para vincular um animal a outro usuário. Para convidar alguém para a sociedade de um animal, o outro usuário também precisa possuir um plano VIP ativo. O convidado deve informar seu código individual para quem está enviando o convite. Após o convite ser enviado, o usuário convidado precisa aceitar para que o animal passe a aparecer também no perfil dele.'
        },
        {
          question: 'O que são códigos públicos?',
          answer: 'Códigos públicos são identificadores únicos que facilitam o compartilhamento de sociedades. Quando você cria uma sociedade pública, geramos automaticamente um código que pode ser compartilhado. Outras pessoas podem usar esse código para solicitar participação na sociedade. É útil para parcerias em criações e propriedades compartilhadas.'
        },
        {
          question: 'Como funcionam os percentuais de participação?',
          answer: 'Ao criar uma sociedade, você define a porcentagem de participação de cada membro. Isso determina a proporção de propriedade sobre os animais cadastrados na sociedade. Os percentuais são úteis para organização e transparência em parcerias comerciais. A soma total deve ser 100%.'
        },
        {
          question: 'Como gerenciar convites e membros?',
          answer: 'No painel da sociedade, você pode convidar membros por e-mail, aceitar ou recusar solicitações de entrada (em sociedades públicas), remover membros e alterar permissões. Apenas o criador da sociedade tem permissões de administrador total. Você pode delegar funções como adicionar animais ou editar informações.'
        }
      ]
    },
    {
      id: 'billing',
      title: 'Planos e Pagamentos',
      description: 'Informações sobre planos e cobrança',
      icon: CreditCard,
      faqs: [
        {
          question: 'Quais são os tipos de planos disponíveis?',
          answer: 'Oferecemos os seguintes planos: Gratuito, Iniciante, Pro e Elite. <a href="https://www.vitrinedocavalo.com.br/planos" class="text-blue-600 hover:text-blue-700 underline">Ver planos</a>'
        },
        {
          question: 'Como fazer upgrade do meu plano?',
          answer: 'Acesse "Planos" no menu ou clique em "Fazer Upgrade" no seu dashboard. Escolha o plano desejado, selecione a forma de pagamento (cartão de crédito, boleto ou PIX) e confirme. O upgrade é imediato após confirmação do pagamento. Você terá acesso instantâneo a todos os recursos do novo plano.'
        },
        {
          question: 'Como cancelar meu plano?',
          answer: 'Acesse "Configurações" > "Planos e Assinaturas" e clique em "Cancelar Assinatura". Você pode cancelar a qualquer momento. O plano permanece ativo até o fim do período já pago. Após o cancelamento, você volta automaticamente para o plano gratuito e seus animais excedentes ficarão inativos até a remoção ou novo upgrade.'
        },
        {
          question: 'Qual é a política de reembolso?',
          answer: 'Após contratar um plano, você pode solicitar o cancelamento em até 7 dias, período em que a solicitação poderá ser analisada para reembolso. Após esse prazo, o valor já pago não é reembolsado. No entanto, ao cancelar sua assinatura, novas cobranças automáticas não serão realizadas, e o plano permanecerá ativo até o final do período já contratado. Essa regra se aplica tanto para planos mensais quanto anuais.'
        }
      ]
    }
  ];

  const contactOptions = [
    {
      type: 'email-suporte',
      title: 'Suporte técnico',
      description: 'suporte@vitrinedocavalo.com.br',
      icon: Mail,
      action: 'Enviar e-mail',
      available: true
    }
  ];

  const toggleFAQ = (categoryId: string, index: number) => {
    const faqId = `${categoryId}-${index}`;
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const renderFAQAnswer = (answer: string) => {
    // Processa links no formato <a href="..." class="...">texto</a>
    const linkRegex = /<a href="([^"]+)" class="([^"]+)">([^<]+)<\/a>/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = linkRegex.exec(answer)) !== null) {
      // Adiciona texto antes do link
      if (match.index > lastIndex) {
        parts.push(answer.substring(lastIndex, match.index));
      }
      // Verifica se é link externo (começa com http:// ou https://)
      const isExternalLink = match[1].startsWith('http://') || match[1].startsWith('https://');
      
      if (isExternalLink) {
        // Link externo - usa elemento <a> normal
        parts.push(
          <a 
            key={`link-${keyCounter++}`} 
            href={match[1]} 
            className={match[2]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {match[3]}
          </a>
        );
      } else {
        // Link interno - usa componente Link do React Router
        parts.push(
          <Link key={`link-${keyCounter++}`} to={match[1]} className={match[2]}>
            {match[3]}
          </Link>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    // Adiciona texto restante
    if (lastIndex < answer.length) {
      parts.push(answer.substring(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : answer;
  };

  const loadMyTickets = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingTickets(true);
    try {
      const tickets = await ticketService.getUserTicketsWithResponses(user.id);
      setMyTickets(tickets);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast({
        title: 'Erro ao carregar tickets',
        description: 'Não foi possível carregar seus tickets. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingTickets(false);
    }
  }, [toast, user?.id]);

  // Carregar tickets quando usuário logar
  useEffect(() => {
    if (user) {
      loadMyTickets();
    }
  }, [user, loadMyTickets]);

  // Links antigos (/contact) e rodapé apontam para #contato
  useEffect(() => {
    if (location.hash !== '#contato') return;
    const t = window.setTimeout(() => {
      document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash, location.pathname]);

  // Recarregar tickets após enviar novo ticket
  const handleTicketSubmitWithReload = async (e: React.FormEvent) => {
    await handleTicketSubmit(e);
    if (user) {
      await loadMyTickets();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-orange-100 text-orange-700 border-orange-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      closed: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[status] || colors.open;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      closed: 'Concluído'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      open: AlertCircle,
      in_progress: Clock,
      closed: CheckCircle
    };
    return icons[status] || AlertCircle;
  };

  const filteredMyTickets = myTickets.filter(ticket => 
    showClosedTickets || ticket.status !== 'closed'
  );

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Central de Ajuda
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Perguntas frequentes, suporte por ticket e contato com nosso time
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search */}
          <div className="mb-12">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Buscar artigos de ajuda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-lg shadow-sm border border-slate-200"
              />
            </div>
          </div>

          {/* Botões de Ação para Usuário Logado */}
          {user && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={() => setShowMyTickets(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg shadow-lg"
                size="lg"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Ver Meus Tickets
              </Button>
            </div>
          )}

          {/* ── Grid: FAQ (esquerda) + Ticket (direita) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Coluna esquerda — Perguntas Frequentes */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-3xl font-bold text-slate-900">Perguntas Frequentes</h2>

              <div className="space-y-6">
                {helpCategories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card key={category.id} className="bg-white border border-slate-200">
                      <div className="p-6">
                        <div className="flex items-start space-x-4 mb-6">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">
                              {category.title}
                            </h3>
                            <p className="text-slate-600 text-sm">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {category.faqs.map((faq, index) => {
                            const faqId = `${category.id}-${index}`;
                            const isExpanded = expandedFAQ === faqId;

                            return (
                              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleFAQ(category.id, index)}
                                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <span className="font-semibold text-slate-900 pr-4">
                                    {faq.question}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-200">
                                    <p className="text-slate-700 leading-relaxed">
                                      {renderFAQAnswer(faq.answer)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Coluna direita — Enviar ticket de suporte (sticky) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">Enviar ticket</h2>
                  {user && (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      Conectado
                    </Badge>
                  )}
                </div>

                {!user && (
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Login necessário:</strong> Você precisa estar logado para enviar um ticket.
                      Preencha o formulário e clique em "Enviar" para ser redirecionado ao login.
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="bg-white shadow-lg border border-slate-200">
                  <div className="p-6">
                    <form onSubmit={handleTicketSubmitWithReload} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                          Assunto *
                        </Label>
                        <Input
                          id="subject"
                          placeholder="Ex: Problema ao cadastrar animal"
                          value={ticketData.subject}
                          onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                          className="h-11"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                          Categoria *
                        </Label>
                        <select
                          id="category"
                          value={ticketData.category}
                          onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                          className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Selecione uma categoria</option>
                          {ticketCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                          Descrição *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Descreva detalhadamente seu problema ou dúvida..."
                          value={ticketData.description}
                          onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                          className="min-h-[130px] resize-none"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          Quanto mais detalhes, mais rápido poderemos ajudar.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            {user ? 'Enviar Ticket' : 'Fazer Login para Enviar'}
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* ── Seção Contato (abaixo do grid) ── */}
          <section id="contato" className="mt-16 space-y-8 scroll-mt-24 lg:scroll-mt-28">

            {/* Outros canais */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-900">Outros canais</h2>
              {contactOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card key={option.type} className="bg-white hover:shadow-md transition-shadow border border-slate-200">
                    <div className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 text-sm">{option.title}</h4>
                          <p className="text-sm text-slate-600 truncate">{option.description}</p>
                        </div>
                        <a
                          href={`mailto:${option.description}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex-shrink-0"
                        >
                          {option.action}
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Contato */}
            <Card className="bg-slate-50 border-slate-200 shadow-sm">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Contato</h3>
                <p className="text-slate-600 leading-relaxed">
                  Nosso time está pronto para ajudar. Responderemos o mais rápido possível.
                </p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 text-slate-700">
                  <a
                    href="mailto:contato@vitrinedocavalo.com.br"
                    className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    contato@vitrinedocavalo.com.br
                  </a>
                  <span className="hidden sm:inline text-slate-300" aria-hidden>
                    |
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                    São Paulo, SP — Brasil
                  </span>
                </div>
              </div>
            </Card>

            {/* Links Úteis */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Links Úteis</h3>
                <div className="space-y-3">
                  <Link to="/terms" className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-colors">
                    <span className="text-sm font-medium text-slate-700">Termos de Uso</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Link>
                  <Link to="/privacy" className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-colors">
                    <span className="text-sm font-medium text-slate-700">Política de Privacidade</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Link>
                  <Link to="/planos" className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-colors">
                    <span className="text-sm font-medium text-slate-700">Planos e Preços</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Link>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>

    {/* Modal: Meus Tickets */}
    {user && (
      <Dialog open={showMyTickets} onOpenChange={setShowMyTickets}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Meus Tickets de Suporte
            </DialogTitle>
            <DialogDescription>
              Acompanhe o status das suas solicitações e veja as respostas da nossa equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Filtro de tickets concluídos */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {filteredMyTickets.length} {filteredMyTickets.length === 1 ? 'ticket' : 'tickets'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClosedTickets(!showClosedTickets)}
              >
                {showClosedTickets ? 'Ocultar Concluídos' : 'Mostrar Concluídos'}
              </Button>
            </div>

            {/* Lista de tickets */}
            {loadingTickets ? (
              <div className="py-12 text-center">
                <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Carregando seus tickets...</p>
              </div>
            ) : filteredMyTickets.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  {showClosedTickets 
                    ? 'Você ainda não tem tickets.'
                    : 'Você não tem tickets abertos ou em andamento.'}
                </p>
                <p className="text-sm text-gray-400">
                  Envie um ticket usando o formulário ao lado
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMyTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const isExpanded = expandedTicket === ticket.id;

                  return (
                    <Card key={ticket.id} className="border-2 hover:border-blue-200 transition-all">
                      <div className="p-5">
                        {/* Header do Ticket */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900 mb-2">
                              {ticket.subject}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                              <Badge className={`${getStatusColor(ticket.status)} px-2 py-1`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusLabel(ticket.status)}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(ticket.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </span>
                              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                #{ticket.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Descrição */}
                        {isExpanded && (
                          <div className="mb-3 bg-gray-50 p-3 rounded border border-gray-200">
                            <p className="text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                              Sua mensagem:
                            </p>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                              {ticket.description}
                            </p>
                          </div>
                        )}

                        {/* Respostas */}
                        {ticket.responses.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.responses.length} {ticket.responses.length === 1 ? 'resposta' : 'respostas'} da equipe
                            </p>
                            {isExpanded && ticket.responses.map((response) => (
                              <div key={response.id} className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-3 rounded shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-blue-800">
                                    ✓ {response.admin_name || 'Administrador'}
                                  </span>
                                  <span className="text-xs text-gray-600">
                                    {formatDistanceToNow(new Date(response.created_at), {
                                      addSuffix: true,
                                      locale: ptBR
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                  {response.response}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botão Expandir/Recolher */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                          className="w-full hover:bg-blue-50"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Recolher
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Ver detalhes
                              {ticket.responses.length > 0 && ` • ${ticket.responses.length} ${ticket.responses.length === 1 ? 'resposta' : 'respostas'}`}
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
};

export default HelpPage;