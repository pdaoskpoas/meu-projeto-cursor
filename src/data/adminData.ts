// Mock data for admin dashboard

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountType: "Simples" | "Haras" | "Fazenda" | "CTE";
  harasName?: string;
  planType: "Free" | "Basic" | "Pro" | "Ultra" | "VIP" | "Expirado";
  subscriptionDate?: string;
  expirationDate?: string;
  vipStartDate?: string; // Data que o usuário adquiriu o plano VIP (fornecido pelo admin)
  vipEndDate?: string; // Data que o plano VIP se encerra
  createdAt: string; // Data de criação da conta
  isActive: boolean;
  isVipGranted?: boolean; // Indica se o VIP foi concedido pelo administrador
  isSuspended?: boolean; // Indica se o usuário está suspenso
  suspensionDate?: string; // Data da suspensão
  suspensionReason?: string; // Motivo da suspensão
  cpf: string; // CPF para validação de bloqueio
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  paidUsers: number;
  freeUsers: number;
  recentSubscriptions: number;
  expiringSoon: number;
  pendingReports: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  category: string;
  publishDate: string;
  scheduledPublishDate?: string; // Data/hora programada para publicação
  isHighlighted: boolean;
  author: string;
  authorId: string;
  views: number;
  likes: number;
  shares: number;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  lastModified: string;
  tags: string[];
  excerpt: string;
  readingTime: number; // calculado automaticamente
}

export interface AnimalReport {
  id: string;
  animalId: string;
  animalName: string;
  reportReason: string;
  reportDescription: string;
  reporterEmail?: string;
  reporterName?: string;
  reportDate: string;
  status: "Pendente" | "Aprovada" | "Descartada";
  reportType: 'animal' | 'profile' | 'conversation' | 'message' | 'other';
  reportLocation: string; // URL ou localização da denúncia
  reportedUserId?: string; // ID do usuário denunciado
  reportedUserName?: string; // Nome do usuário denunciado
  conversationId?: string; // ID da conversa se for denúncia de chat
  messageId?: string; // ID da mensagem específica
  evidence?: string[]; // URLs de evidências (screenshots, etc.)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  adminId?: string; // ID do admin que analisou
  analyzedDate?: string;
  // Novos campos para ações administrativas
  animalBlocked?: boolean; // Se o animal foi bloqueado
  animalBlockDate?: string; // Data do bloqueio do animal
  animalBlockReason?: string; // Motivo do bloqueio do animal
  userSuspended?: boolean; // Se o usuário foi suspenso
  userSuspensionDate?: string; // Data da suspensão do usuário
  userSuspensionReason?: string; // Motivo da suspensão do usuário
  adminAction?: 'none' | 'block_animal' | 'suspend_user' | 'both'; // Ação tomada pelo admin
}

export interface PlanType {
  id: string;
  name: string;
  price: number;
  duration: number; // in months
  features: string[];
  isActive: boolean;
}

// Mock data
export const mockAdminStats: AdminStats = {
  totalUsers: 1247,
  activeUsers: 892,
  paidUsers: 234,
  freeUsers: 658,
  recentSubscriptions: 45,
  expiringSoon: 12,
  pendingReports: 8
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@harassilveira.com.br",
    phone: "(11) 99999-9999",
    accountType: "Haras",
    harasName: "Haras Silveira",
    planType: "VIP",
    subscriptionDate: "2024-01-15",
    expirationDate: "2024-12-15",
    vipStartDate: "2024-01-15",
    vipEndDate: "2024-12-15",
    createdAt: "2023-12-01",
    isActive: true,
    isVipGranted: true,
    isSuspended: false,
    cpf: "123.456.789-00"
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@fazendabela.com.br",
    phone: "(21) 88888-8888",
    accountType: "Fazenda",
    harasName: "Fazenda Bela Vista",
    planType: "Pro",
    subscriptionDate: "2024-02-10",
    expirationDate: "2024-08-10",
    createdAt: "2024-01-05",
    isActive: true,
    isSuspended: false,
    cpf: "987.654.321-00"
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    email: "carlos@email.com",
    phone: "(31) 77777-7777",
    accountType: "Simples",
    planType: "Free",
    createdAt: "2024-03-01",
    isActive: true,
    isSuspended: false,
    cpf: "456.789.123-00"
  },
  {
    id: "4",
    name: "Roberto Silva",
    email: "roberto@harasvaleverde.com.br",
    phone: "(11) 99999-9999",
    accountType: "Haras",
    harasName: "Haras Vale Verde",
    planType: "VIP",
    subscriptionDate: "2024-01-01",
    expirationDate: "2024-12-31",
    vipStartDate: "2024-01-01",
    vipEndDate: "2024-12-31",
    createdAt: "2023-11-15",
    isActive: true,
    isVipGranted: true,
    isSuspended: false,
    cpf: "789.123.456-00"
  },
  {
    id: "5",
    name: "Ana Costa",
    email: "ana@cteelite.com.br",
    phone: "(11) 88888-7777",
    accountType: "CTE",
    harasName: "CTE Elite Training",
    planType: "Ultra",
    subscriptionDate: "2024-02-01",
    expirationDate: "2024-08-01",
    createdAt: "2024-01-20",
    isActive: true,
    isSuspended: false,
    cpf: "321.654.987-00"
  },
  {
    id: "6",
    name: "Pedro Mendes",
    email: "pedro@email.com",
    phone: "(11) 77777-6666",
    accountType: "Simples",
    planType: "Basic",
    subscriptionDate: "2024-02-15",
    expirationDate: "2024-08-15",
    createdAt: "2024-02-15",
    isActive: true,
    isSuspended: false,
    cpf: "654.321.789-00"
  },
  {
    id: "7",
    name: "Fernanda Lima",
    email: "fernanda@fazendamontanha.com.br",
    phone: "(31) 66666-5555",
    accountType: "Fazenda",
    harasName: "Fazenda Montanha Dourada",
    planType: "VIP",
    subscriptionDate: "2024-03-01",
    expirationDate: "2025-03-01",
    vipStartDate: "2024-03-01",
    vipEndDate: "2025-03-01",
    createdAt: "2024-02-10",
    isActive: true,
    isVipGranted: true,
    isSuspended: false,
    cpf: "147.258.369-00"
  },
  {
    id: "8",
    name: "Lucas Pereira",
    email: "lucas@email.com",
    phone: "(11) 55555-4444",
    accountType: "Simples",
    planType: "Expirado",
    subscriptionDate: "2023-12-01",
    expirationDate: "2024-06-01",
    createdAt: "2023-11-01",
    isActive: false,
    isSuspended: true,
    suspensionDate: "2024-06-15",
    suspensionReason: "Violação das normas da plataforma - tentativa de golpe",
    cpf: "369.258.147-00"
  }
];

export const mockNewsArticles: NewsArticle[] = [
  {
    id: "1",
    title: "Técnicas Modernas de Reprodução Equina",
    content: "Conteúdo completo do artigo sobre reprodução...",
    coverImage: "/api/placeholder/600/400",
    category: "Reprodução",
    publishDate: "2024-03-15",
    isHighlighted: true,
    author: "Dr. Pedro Santos - Veterinário",
    authorId: "admin",
    views: 1247,
    likes: 89,
    shares: 23,
    status: "published",
    lastModified: "2024-03-15T10:30:00Z",
    tags: ["reprodução", "veterinária", "técnicas"],
    excerpt: "Descubra as mais modernas técnicas de reprodução equina utilizadas pelos principais haras do país.",
    readingTime: 8
  },
  {
    id: "2",
    title: "Nutrição Adequada para Potros",
    content: "Guia completo sobre alimentação de potros...",
    coverImage: "/api/placeholder/600/400",
    category: "Nutrição",
    publishDate: "2024-03-10",
    isHighlighted: false,
    author: "Dra. Ana Costa - Zootecnista",
    authorId: "admin",
    views: 892,
    likes: 67,
    shares: 15,
    status: "published",
    lastModified: "2024-03-10T14:20:00Z",
    tags: ["nutrição", "potros", "alimentação"],
    excerpt: "Aprenda os fundamentos da nutrição adequada para potros em crescimento e desenvolvimento.",
    readingTime: 6
  },
  {
    id: "3",
    title: "Manejo Sanitário em Haras",
    content: "Conteúdo sobre manejo sanitário...",
    coverImage: "/api/placeholder/600/400",
    author: "Carlos Mendes - Especialista em Manejo",
    authorId: "admin",
    views: 1563,
    likes: 124,
    shares: 31,
    status: "published",
    lastModified: "2024-03-08T09:15:00Z",
    tags: ["manejo", "sanitário", "prevenção"],
    excerpt: "Protocolos essenciais para manter a saúde do plantel através de práticas sanitárias adequadas.",
    readingTime: 10
  },
  {
    id: "4",
    title: "Preparação para Competições",
    content: "Conteúdo sobre preparação para competições...",
    coverImage: "/api/placeholder/600/400",
    author: "Roberto Silva - Treinador Profissional",
    authorId: "admin",
    views: 743,
    likes: 45,
    shares: 12,
    status: "published",
    lastModified: "2024-03-05T16:45:00Z",
    tags: ["competições", "treinamento", "preparação"],
    excerpt: "Dicas essenciais para preparar seus cavalos para competições de alto nível.",
    readingTime: 7
  },
  {
    id: "5",
    title: "Rascunho: Genética Equina Moderna",
    content: "Conteúdo em desenvolvimento sobre genética...",
    coverImage: "/api/placeholder/600/400",
    author: "Dr. Marcos Oliveira - Geneticista",
    authorId: "admin",
    views: 0,
    likes: 0,
    shares: 0,
    status: "draft",
    lastModified: "2024-03-20T11:30:00Z",
    tags: ["genética", "melhoramento", "seleção"],
    excerpt: "Como a genética moderna está revolucionando a criação de cavalos.",
    readingTime: 12
  },
  {
    id: "6",
    title: "Novas Técnicas de Treinamento Equino",
    content: "Conteúdo completo sobre técnicas modernas de treinamento...",
    coverImage: "/api/placeholder/600/400",
    author: "Maria Santos - Especialista em Treinamento",
    authorId: "admin",
    views: 0,
    likes: 0,
    shares: 0,
    status: "scheduled",
    lastModified: "2024-03-20T15:45:00Z",
    tags: ["treinamento", "técnicas", "moderno"],
    excerpt: "Descubra as mais modernas técnicas de treinamento utilizadas pelos melhores profissionais.",
    readingTime: 8
  },
  {
    id: "7",
    title: "Sustentabilidade na Criação de Cavalos",
    content: "Guia completo sobre práticas sustentáveis...",
    coverImage: "/api/placeholder/600/400",
    author: "Fernanda Lima - Consultora Ambiental",
    authorId: "admin",
    views: 0,
    likes: 0,
    shares: 0,
    status: "scheduled",
    lastModified: "2024-03-20T16:20:00Z",
    tags: ["sustentabilidade", "meio ambiente", "práticas"],
    excerpt: "Como implementar práticas sustentáveis na criação profissional de cavalos.",
    readingTime: 10
  }
];

export const mockAnimalReports: AnimalReport[] = [
  {
    id: "1",
    animalId: "animal-1",
    animalName: "Garanhão das Estrelas",
    reportReason: "Informações incorretas",
    reportDescription: "Os dados de linhagem não conferem com o registro oficial. O animal possui pedigree falso.",
    reporterEmail: "joao.silva@email.com",
    reporterName: "João Silva",
    reportDate: "2024-03-18",
    status: "Pendente",
    reportType: "animal",
    reportLocation: "/animal/animal-1",
    reportedUserId: "user-123",
    reportedUserName: "Carlos Mendes",
    priority: "high",
    evidence: ["https://example.com/screenshot1.jpg", "https://example.com/pedigree-fake.jpg"]
  },
  {
    id: "2",
    animalId: "animal-2",
    animalName: "Égua Formosa",
    reportReason: "Animal não existe",
    reportDescription: "Este animal parece não existir na propriedade informada. Fotos parecem ser de outro local.",
    reporterEmail: "maria.santos@email.com",
    reporterName: "Maria Santos",
    reportDate: "2024-03-17",
    status: "Pendente",
    reportType: "animal",
    reportLocation: "/animal/animal-2",
    reportedUserId: "user-456",
    reportedUserName: "Roberto Silva",
    priority: "medium",
    evidence: ["https://example.com/evidence1.jpg"]
  },
  {
    id: "3",
    animalId: "",
    animalName: "",
    reportReason: "Comportamento inadequado",
    reportDescription: "Usuário enviou mensagens inadequadas e ofensivas durante conversa sobre compra de animal.",
    reporterEmail: "ana.costa@email.com",
    reporterName: "Ana Costa",
    reportDate: "2024-03-16",
    status: "Pendente",
    reportType: "conversation",
    reportLocation: "/dashboard/messages",
    reportedUserId: "user-789",
    reportedUserName: "Pedro Oliveira",
    conversationId: "conv-123",
    messageId: "msg-456",
    priority: "urgent",
    evidence: ["https://example.com/chat-screenshot.jpg"]
  },
  {
    id: "4",
    animalId: "",
    animalName: "",
    reportReason: "Perfil falso",
    reportDescription: "Perfil institucional com informações falsas sobre certificações e registros.",
    reporterEmail: "fernando.lima@email.com",
    reporterName: "Fernando Lima",
    reportDate: "2024-03-15",
    status: "Aprovada",
    reportType: "profile",
    reportLocation: "/haras/user-999",
    reportedUserId: "user-999",
    reportedUserName: "Haras Fictício",
    priority: "high",
    evidence: ["https://example.com/fake-certificate.jpg"],
    adminNotes: "Perfil removido após verificação. Certificações eram falsas.",
    adminId: "admin",
    analyzedDate: "2024-03-15T14:30:00Z"
  },
  {
    id: "5",
    animalId: "animal-3",
    animalName: "Potro Relâmpago",
    reportReason: "Preço abusivo",
    reportDescription: "Animal sendo vendido por preço muito acima do mercado, possivelmente tentativa de golpe.",
    reporterEmail: "lucas.pereira@email.com",
    reporterName: "Lucas Pereira",
    reportDate: "2024-03-14",
    status: "Descartada",
    reportType: "animal",
    reportLocation: "/animal/animal-3",
    reportedUserId: "user-111",
    reportedUserName: "Haras Premium",
    priority: "medium",
    evidence: ["https://example.com/price-comparison.jpg"],
    adminNotes: "Preço está dentro da faixa normal para animais da raça e qualidade apresentada.",
    adminId: "admin",
    analyzedDate: "2024-03-14T16:45:00Z"
  },
  {
    id: "6",
    animalId: "",
    animalName: "",
    reportReason: "Spam",
    reportDescription: "Usuário enviando mensagens repetitivas e não relacionadas à plataforma.",
    reporterEmail: "carla.mendes@email.com",
    reporterName: "Carla Mendes",
    reportDate: "2024-03-13",
    status: "Pendente",
    reportType: "message",
    reportLocation: "/dashboard/messages",
    reportedUserId: "user-222",
    reportedUserName: "Spammer User",
    conversationId: "conv-456",
    messageId: "msg-789",
    priority: "low",
    evidence: ["https://example.com/spam-messages.jpg"]
  },
  // Denúncias adicionais do mesmo usuário (Carlos Mendes - user-123)
  {
    id: "7",
    animalId: "animal-4",
    animalName: "Cavalo Veloz",
    reportReason: "Fotos falsas",
    reportDescription: "As fotos do animal são de outro cavalo, não correspondem ao animal anunciado.",
    reporterEmail: "pedro.santos@email.com",
    reporterName: "Pedro Santos",
    reportDate: "2024-03-12",
    status: "Pendente",
    reportType: "animal",
    reportLocation: "/animal/animal-4",
    reportedUserId: "user-123",
    reportedUserName: "Carlos Mendes",
    priority: "high",
    evidence: ["https://example.com/fake-photos.jpg"]
  },
  {
    id: "8",
    animalId: "animal-5",
    animalName: "Égua Rainha",
    reportReason: "Informações de saúde falsas",
    reportDescription: "Animal possui problemas de saúde não mencionados no anúncio.",
    reporterEmail: "lucia.ferreira@email.com",
    reporterName: "Lucia Ferreira",
    reportDate: "2024-03-11",
    status: "Aprovada",
    reportType: "animal",
    reportLocation: "/animal/animal-5",
    reportedUserId: "user-123",
    reportedUserName: "Carlos Mendes",
    priority: "high",
    evidence: ["https://example.com/health-certificate.jpg"],
    adminNotes: "Anúncio removido. Animal possui problemas de saúde não divulgados.",
    adminId: "admin",
    analyzedDate: "2024-03-11T10:15:00Z"
  },
  // Denúncias adicionais do mesmo animal (animal-1)
  {
    id: "9",
    animalId: "animal-1",
    animalName: "Garanhão das Estrelas",
    reportReason: "Preço suspeito",
    reportDescription: "Preço muito abaixo do mercado para um animal com essas características.",
    reporterEmail: "ricardo.alves@email.com",
    reporterName: "Ricardo Alves",
    reportDate: "2024-03-10",
    status: "Pendente",
    reportType: "animal",
    reportLocation: "/animal/animal-1",
    reportedUserId: "user-123",
    reportedUserName: "Carlos Mendes",
    priority: "medium",
    evidence: ["https://example.com/price-analysis.jpg"]
  },
  {
    id: "10",
    animalId: "animal-1",
    animalName: "Garanhão das Estrelas",
    reportReason: "Contato suspeito",
    reportDescription: "Proprietário não responde adequadamente às perguntas técnicas sobre o animal.",
    reporterEmail: "patricia.lima@email.com",
    reporterName: "Patricia Lima",
    reportDate: "2024-03-09",
    status: "Pendente",
    reportType: "animal",
    reportLocation: "/animal/animal-1",
    reportedUserId: "user-123",
    reportedUserName: "Carlos Mendes",
    priority: "medium",
    evidence: ["https://example.com/conversation-screenshot.jpg"]
  },
  // Denúncias adicionais da mesma conversa (conv-123)
  {
    id: "11",
    animalId: "",
    animalName: "",
    reportReason: "Linguagem inadequada",
    reportDescription: "Usuário usando linguagem ofensiva e inadequada na conversa.",
    reporterEmail: "marcos.oliveira@email.com",
    reporterName: "Marcos Oliveira",
    reportDate: "2024-03-08",
    status: "Pendente",
    reportType: "conversation",
    reportLocation: "/dashboard/messages",
    reportedUserId: "user-789",
    reportedUserName: "Pedro Oliveira",
    conversationId: "conv-123",
    messageId: "msg-789",
    priority: "high",
    evidence: ["https://example.com/offensive-language.jpg"]
  },
  {
    id: "12",
    animalId: "",
    animalName: "",
    reportReason: "Tentativa de golpe",
    reportDescription: "Usuário tentando aplicar golpe através de pagamento antecipado.",
    reporterEmail: "silvia.costa@email.com",
    reporterName: "Silvia Costa",
    reportDate: "2024-03-07",
    status: "Aprovada",
    reportType: "conversation",
    reportLocation: "/dashboard/messages",
    reportedUserId: "user-789",
    reportedUserName: "Pedro Oliveira",
    conversationId: "conv-123",
    messageId: "msg-101",
    priority: "urgent",
    evidence: ["https://example.com/scam-attempt.jpg"],
    adminNotes: "Usuário banido da plataforma por tentativa de golpe.",
    adminId: "admin",
    analyzedDate: "2024-03-07T15:30:00Z"
  }
];

export const mockPlanTypes: PlanType[] = [
  {
    id: "1",
    name: "Free",
    price: 0,
    duration: 0,
    features: [
      "Perfil básico",
      "Visualização limitada",
      "Suporte por email"
    ],
    isActive: true
  },
  {
    id: "2",
    name: "Basic",
    price: 89.90,
    duration: 1,
    features: [
      "10 anúncios por mês",
      "Aparece no mapa",
      "Perfil básico completo",
      "Suporte por email"
    ],
    isActive: true
  },
  {
    id: "3",
    name: "Pro",
    price: 149.90,
    duration: 1,
    features: [
      "15 anúncios por mês",
      "Aparece no mapa",
      "3 turbinar grátis",
      "Perfil destacado",
      "Suporte prioritário",
      "Relatórios de visualização"
    ],
    isActive: true
  },
  {
    id: "4",
    name: "Ultra",
    price: 249.90,
    duration: 1,
    features: [
      "30 anúncios por mês",
      "Aparece no mapa",
      "5 turbinar grátis",
      "Perfil premium",
      "Suporte 24/7",
      "Relatórios avançados",
      "Badge de verificação",
      "Prioridade em buscas"
    ],
    isActive: true
  },
  {
    id: "5",
    name: "VIP",
    price: 0,
    duration: 0,
    features: [
      "Todos os recursos do Pro",
      "Concedido pelo administrador",
      "Sem custo para o usuário",
      "Benefícios especiais",
      "Suporte premium"
    ],
    isActive: true
  }
];