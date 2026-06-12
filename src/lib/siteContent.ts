export type WorkoutCard = {
  label: string;
  title: string;
  img: string;
};

export type FranchiseWhyCard = {
  title: string;
  desc: string;
  /** Nome do ícone (ver lib/cardIcons.ts). '' = ícone automático por posição (compat com cards antigos). */
  icon: string;
};

export type FranchiseSupportItem = {
  title: string;
  desc: string;
  /** Nome do ícone (ver lib/cardIcons.ts). '' = ícone automático por posição (compat com cards antigos). */
  icon: string;
};

export type HeroMediaType = 'video' | 'image' | 'carousel';

export type HomeHeroMedia = {
  type: HeroMediaType;
  /** Vídeo do hero. '' = usa media.homeHeroVideo (compat). */
  videoUrl: string;
  imageUrl: string;
  carouselImages: string[];
};

export type SecondHeroConfig = {
  textAlign: 'left' | 'center' | 'right';
  objectPosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
  objectFit: 'cover' | 'contain';
  overlayEnabled: boolean;
  /** 0–100. Intensidade da máscara escura sobre a imagem. */
  overlayOpacity: number;
  /** Cores em hex. '' = cor padrão do site (fallback). */
  eyebrowColor: string;
  titleColor: string;
  highlightColor: string;
  subtitleColor: string;
};

export type CapitalOption = {
  value: string;
  label: string;
};

export type BusinessNumber = {
  label: string;
  value: string;
};

export type SiteMedia = {
  /** Menu superior — logo principal */
  navLogo: string;
  /** Menu superior — águia */
  navEagle: string;
  /** Rodapé — logo */
  footerLogo: string;
  /** Home — vídeo do hero inicial */
  homeHeroVideo: string;
  /** Home — imagem de fundo do segundo hero (texto principal) */
  homeSecondHeroBg: string;
  /** Home — imagem da seção “experiência” */
  homeExperienceImage: string;
  /** Home — imagem do bloco franquia no final */
  homeFranchiseTeaserImage: string;
  /** Sobre — fundo do hero */
  aboutHeroBg: string;
  /** Sobre — ilustração ao lado da história */
  aboutStoryImage: string;
  /** Sobre — imagem dos pilares */
  aboutPillarsImage: string;
  /** Franquia — imagem de fundo lateral do hero */
  franchiseHeroBg: string;
  /** Franquia — vídeo do hero */
  franchiseHeroVideo: string;
};

export type SiteContent = {
  media: SiteMedia;
  nav: {
    home: string;
    about: string;
    franchise: string;
  };
  footer: {
    tagline: string;
    navTitle: string;
    franchiseColumnTitle: string;
    contactTitle: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    email: string;
    copyrightName: string;
    terms: string;
    privacy: string;
    linkHome: string;
    linkAbout: string;
    linkFranchise: string;
    franchiseLink1: string;
    franchiseLink2: string;
    franchiseLink3: string;
  };
  home: {
    heroMedia: HomeHeroMedia;
    hero: {
      eyebrow: string;
      titleLine1: string;
      titleHighlight: string;
      subtitle: string;
    };
    secondHero: SecondHeroConfig;
    experience: {
      titleLine1: string;
      titleLine2: string;
      body: string;
      bullets: string[];
    };
    carousel: {
      title: string;
      footnote: string;
    };
    workouts: WorkoutCard[];
    franchiseTeaser: {
      eyebrow: string;
      titlePart1: string;
      titleGradient: string;
      body: string;
      cta: string;
    };
  };
  about: {
    heroTitle: string;
    storyTitle: string;
    storyParagraphs: string[];
    /** Cor do título do hero. '' = padrão (branco). */
    heroTitleColor: string;
    pillarsTitle: string;
    pillarsIntro: string;
    pillarsHeadline: string;
    pillarsOutro: string;
    missionTitle: string;
    missionDesc: string;
    visionTitle: string;
    visionDesc: string;
    valuesTitle: string;
    valuesDesc: string;
  };
  franchise: {
    heroEyebrow: string;
    heroTitleBefore: string;
    heroTitleHighlight: string;
    heroBody: string;
    heroCta: string;
    whyTitle: string;
    whyBody: string;
    whyCards: FranchiseWhyCard[];
    supportTitle: string;
    supportBody: string;
    supportItems: FranchiseSupportItem[];
    numbersTitle: string;
    numbers: BusinessNumber[];
    numbersDisclaimer: string;
    formTitle: string;
    formSubtitle: string;
    labelName: string;
    labelEmail: string;
    labelPhone: string;
    labelCity: string;
    labelCapital: string;
    placeholderName: string;
    placeholderEmail: string;
    placeholderPhone: string;
    placeholderCity: string;
    selectCapitalPlaceholder: string;
    capitalOptions: CapitalOption[];
    submitButton: string;
    formSuccessMessage: string;
  };
};

export const SITE_CONTENT_STORAGE_KEY = 'eagle-site-content-v1';

export const defaultSiteContent: SiteContent = {
  media: {
    navLogo: '/logo.png',
    navEagle: '/eagle.png',
    footerLogo: '/logo.png',
    homeHeroVideo: '/video.mp4',
    homeSecondHeroBg:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
    homeExperienceImage:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop',
    homeFranchiseTeaserImage:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop',
    aboutHeroBg:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop',
    aboutStoryImage: '/logo_draw.png',
    aboutPillarsImage:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1445&auto=format&fit=crop',
    franchiseHeroBg:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop',
    franchiseHeroVideo: '/franquia.mp4',
  },
  nav: {
    home: 'Home',
    about: 'Sobre Nós',
    franchise: 'Seja um Franqueado',
  },
  footer: {
    tagline:
      'Uma experiência exclusiva focada em bem-estar, conforto e resultados.',
    navTitle: 'Navegação',
    franchiseColumnTitle: 'Franquia',
    contactTitle: 'Contato',
    addressLine1: 'Av. Faria Lima, 3000, 15º Andar',
    addressLine2: 'São Paulo, SP',
    phone: '(11) 99999-9999',
    email: 'franquias@eaglecenter.com.br',
    copyrightName: 'Eagle Center Fitness',
    terms: 'Termos de Uso',
    privacy: 'Política de Privacidade',
    linkHome: 'Home',
    linkAbout: 'Sobre Nós',
    linkFranchise: 'Seja um Franqueado',
    franchiseLink1: 'Modelo de Negócio',
    franchiseLink2: 'Suporte ao Franqueado',
    franchiseLink3: 'Investimento',
  },
  home: {
    heroMedia: {
      type: 'video',
      videoUrl: '',
      imageUrl: '',
      carouselImages: [],
    },
    hero: {
      eyebrow: 'A Nova Era do Fitness Premium',
      titleLine1: 'Exclusividade, Conforto e ',
      titleHighlight: 'Resultados Reais.',
      subtitle:
        'Descubra um ambiente projetado para quem não abre mão do melhor. Equipamentos de ponta, atendimento personalizado e uma atmosfera que inspira.',
    },
    secondHero: {
      textAlign: 'center',
      objectPosition: 'center',
      objectFit: 'cover',
      overlayEnabled: true,
      overlayOpacity: 60,
      eyebrowColor: '',
      titleColor: '',
      highlightColor: '',
      subtitleColor: '',
    },
    experience: {
      titleLine1: 'O Diferencial Não Está no Volume.',
      titleLine2: 'Está na Experiência.',
      body: 'Na Eagle Center Fitness, acreditamos que o treino perfeito exige o ambiente perfeito. Nossas unidades são desenhadas para oferecer respiro, tranquilidade e foco total. Sem superlotação, sem distrações. Apenas você e seus objetivos, com o suporte de profissionais de elite.',
      bullets: [
        'Ambiente climatizado com design biofílico e iluminação cênica.',
        'Equipamentos importados de última geração (Technogym/Life Fitness).',
        'Vestiários padrão hotelaria com amenities premium.',
        'Atendimento concierge e suporte próximo dos instrutores.',
      ],
    },
    carousel: {
      title: 'O treino que voce procura, aqui tem.',
      footnote: '*Verifique a disponibilidade na unidade de sua preferência.',
    },
    workouts: [
      {
        label: 'DANÇA E RITMO',
        title: 'FITDANCE, ZUMBA E RITBOX',
        img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2070&auto=format&fit=crop',
      },
      {
        label: 'CICLISMO INDOOR',
        title: 'SPINNING, RPM',
        img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop',
      },
      {
        label: 'LOCALIZADO',
        title: 'STEP, GAP EHR JUMP',
        img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=2070&auto=format&fit=crop',
      },
      {
        label: 'MUSCULAÇÃO',
        title: 'PREMIUM EXPERIENCE',
        img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop',
      },
      {
        label: 'RECOVERY',
        title: 'FISIOTERAPIA & RELAX',
        img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
      },
      {
        label: 'PERSONAL',
        title: 'TREINO EXCLUSIVO',
        img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop',
      },
    ],
    franchiseTeaser: {
      eyebrow: 'Oportunidade de Negócio',
      titlePart1: 'Invista em um Mercado de ',
      titleGradient: 'Alto Valor Percebido',
      body: 'O modelo Eagle Center Fitness foi desenhado para empreendedores que buscam rentabilidade através da qualidade, não da guerra de preços. Oferecemos um modelo de franquia sólido, com suporte integral e uma marca que atrai o público A e B.',
      cta: 'Seja um Franqueado',
    },
  },
  about: {
    heroTitle: 'UMA MARCA CRIADA COM SUOR, SONHO E RESULTADO.',
    heroTitleColor: '',
    storyTitle: 'Nossa Historia',
    storyParagraphs: [
      'A Eagle Center Fitness nasceu da insatisfação com o modelo tradicional de academias. Observamos um mercado saturado de espaços lotados, atendimento impessoal e foco exclusivo em volume de matrículas.',
      'Decidimos criar um refúgio. Um espaço onde o design, a tecnologia e o atendimento humano se encontram para proporcionar uma experiência de treino verdadeiramente premium. Não vendemos acesso a equipamentos; entregamos saúde, conforto e exclusividade.',
      'Hoje, somos mais do que uma rede de academias. Somos uma comunidade de pessoas apaixonadas por superar limites e viver com excelência todos os dias.',
    ],
    pillarsTitle: 'Pilares da Marca',
    pillarsIntro: 'o mercado fitness segue em plena evolução,',
    pillarsHeadline:
      'E VOCÊ PODE FAZER PARTE DESSE MOVIMENTO AO LADO DA EAGLE.',
    pillarsOutro:
      'se o seu perfil é de investidor e você busca uma marca forte para crescer junto, entre em contato com uma de nossas unidades.',
    missionTitle: 'Missão',
    missionDesc:
      'Transformar a vida das pessoas através de uma experiência de fitness premium, acessível e verdadeiramente acolhedora.',
    visionTitle: 'Visão',
    visionDesc:
      'Ser a maior e mais desejada rede de academias do Brasil, reconhecida pela excelência em infraestrutura e atendimento.',
    valuesTitle: 'Valores',
    valuesDesc:
      'Excelência inegociável, cuidado genuíno com cada aluno, inovação constante e foco absoluto em resultados reais.',
  },
  franchise: {
    heroEyebrow: 'Seja um Franqueado',
    heroTitleBefore: 'Um Negócio Sólido no Mercado ',
    heroTitleHighlight: 'Premium',
    heroBody:
      'A Eagle Center Fitness oferece um modelo de franquia testado e aprovado, focado em alta rentabilidade através de um ticket médio superior e fidelização de clientes que buscam exclusividade.',
    heroCta: 'Receber Apresentação',
    whyTitle: 'Por que investir na Eagle?',
    whyBody:
      'Nosso modelo foge da guerra de preços das academias low-cost. Entregamos valor real, o que nos permite praticar margens mais saudáveis.',
    whyCards: [
      {
        icon: '',
        title: 'Alta Rentabilidade',
        desc: 'Ticket médio elevado e estrutura de custos otimizada garantem margens atrativas.',
      },
      {
        icon: '',
        title: 'Projeto Arquitetônico',
        desc: 'Layout inteligente que maximiza o uso do espaço mantendo a sensação de amplitude.',
      },
      {
        icon: '',
        title: 'Retenção de Clientes',
        desc: 'Foco total na experiência do usuário, resultando em taxas de churn muito abaixo do mercado.',
      },
    ],
    supportTitle: 'Suporte Integral ao Franqueado',
    supportBody:
      'Não entregamos apenas uma marca, entregamos um sistema completo de gestão. Nossa equipe acompanha você desde a escolha do ponto até a operação diária.',
    supportItems: [
      {
        icon: '',
        title: 'Geomarketing e Ponto',
        desc: 'Análise detalhada para escolha do ponto comercial ideal.',
      },
      {
        icon: '',
        title: 'Treinamento Contínuo',
        desc: 'Capacitação da equipe técnica e comercial.',
      },
      {
        icon: '',
        title: 'Gestão e Marketing',
        desc: 'Sistemas integrados e campanhas de marketing centralizadas.',
      },
    ],
    numbersTitle: 'Números do Negócio',
    numbers: [
      { label: 'Investimento Inicial', value: 'A partir de R$ 1.5M' },
      { label: 'Faturamento Médio Mensal', value: 'R$ 350 mil' },
      { label: 'Lucratividade Estimada', value: '25% a 35%' },
      { label: 'Payback', value: '24 a 36 meses' },
    ],
    numbersDisclaimer:
      '* Os valores podem variar de acordo com a região e tamanho da unidade.',
    formTitle: 'Dê o Primeiro Passo',
    formSubtitle:
      'Preencha o formulário abaixo para receber nossa apresentação comercial completa e conversar com um de nossos consultores de expansão.',
    labelName: 'Nome Completo',
    labelEmail: 'E-mail',
    labelPhone: 'Telefone / WhatsApp',
    labelCity: 'Cidade/Estado de Interesse',
    labelCapital: 'Capital Disponível para Investimento',
    placeholderName: 'Seu nome',
    placeholderEmail: 'seu@email.com',
    placeholderPhone: '(00) 00000-0000',
    placeholderCity: 'Ex: São Paulo - SP',
    selectCapitalPlaceholder: 'Selecione uma opção',
    capitalOptions: [
      { value: '1.5m-2m', label: 'R$ 1.5M a R$ 2.0M' },
      { value: '2m-3m', label: 'R$ 2.0M a R$ 3.0M' },
      { value: '3m+', label: 'Acima de R$ 3.0M' },
    ],
    submitButton: 'Solicitar Contato',
    formSuccessMessage:
      'Obrigado pelo interesse! Nossa equipe entrará em contato em breve.',
  },
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function mergeSiteContent(
  defaults: SiteContent,
  stored: unknown,
): SiteContent {
  if (!isPlainObject(stored)) return defaults;
  const out = structuredClone(defaults);
  function deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
  ) {
    for (const key of Object.keys(source)) {
      const sk = source[key];
      const tk = target[key];
      if (sk === undefined) continue;
      if (Array.isArray(tk) && Array.isArray(sk)) {
        const template = tk[0];
        target[key] = sk.map((item) => {
          if (isPlainObject(template) && isPlainObject(item)) {
            const nested = structuredClone(template);
            deepMerge(nested as Record<string, unknown>, item);
            return nested;
          }
          return item;
        });
      } else if (isPlainObject(tk) && isPlainObject(sk)) {
        deepMerge(tk as Record<string, unknown>, sk);
      } else if (typeof sk === typeof tk) {
        target[key] = sk;
      }
    }
  }
  deepMerge(out as Record<string, unknown>, stored as Record<string, unknown>);

  // Migrate legacy flat franchise.number* fields → numbers[] (only if stored had legacy and no numbers).
  const storedFranchise = (stored as { franchise?: Record<string, unknown> }).franchise;
  if (storedFranchise && !Array.isArray(storedFranchise.numbers)) {
    const legacy: Array<[string, string]> = [
      ['numberInvestmentLabel', 'numberInvestmentValue'],
      ['numberRevenueLabel', 'numberRevenueValue'],
      ['numberProfitLabel', 'numberProfitValue'],
      ['numberPaybackLabel', 'numberPaybackValue'],
    ];
    const built = legacy
      .map(([lk, vk]) => ({
        label: typeof storedFranchise[lk] === 'string' ? (storedFranchise[lk] as string) : '',
        value: typeof storedFranchise[vk] === 'string' ? (storedFranchise[vk] as string) : '',
      }))
      .filter((n) => n.label || n.value);
    if (built.length > 0) out.franchise.numbers = built;
  }

  return out;
}

export function loadStoredSiteContent(): SiteContent {
  if (typeof window === 'undefined') return defaultSiteContent;
  try {
    const raw = localStorage.getItem(SITE_CONTENT_STORAGE_KEY);
    if (!raw) return defaultSiteContent;
    const parsed = JSON.parse(raw) as unknown;
    const merged = mergeSiteContent(defaultSiteContent, parsed);
    if (merged.media.franchiseHeroVideo.includes('XDJdgLY9aME')) {
      merged.media.franchiseHeroVideo =
        defaultSiteContent.media.franchiseHeroVideo;
    }
    return merged;
  } catch {
    return defaultSiteContent;
  }
}
