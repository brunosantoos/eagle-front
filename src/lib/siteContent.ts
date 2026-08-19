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

export type SocialLink = {
  /** Chave da plataforma (ver lib/socialIcons.ts). */
  platform: string;
  url: string;
};

export type CarouselConfig = {
  title: string;
  footnote: string;
  /** Cores em hex. '' = cor padrão do site. */
  titleColor: string;
  footnoteColor: string;
  cardTitleColor: string;
  cardLabelColor: string;
  /** Tamanho da fonte dos cards em px (desktop). */
  cardTitleFontSize: number;
  cardLabelFontSize: number;
  /** 0–100. Véu branco no topo do card — valores altos "lavam" a foto. */
  cardOverlayOpacity: number;
  /** 0–100. Intensidade do degradê branco nas laterais do carrossel. */
  sideFadeOpacity: number;
};

export type BusinessNumber = {
  label: string;
  value: string;
};

/**
 * Efeitos aplicados sobre uma imagem no site — máscara escura e desfoque.
 * Não alteram o arquivo: são camada/filtro no render, reversíveis a qualquer hora.
 */
export type MediaEffect = {
  maskEnabled: boolean;
  /** 0–100. Intensidade da máscara escura. */
  maskOpacity: number;
  /** 0–20 px de desfoque. 0 = sem blur. */
  blur: number;
};

export const DEFAULT_MEDIA_EFFECT: MediaEffect = {
  maskEnabled: false,
  maskOpacity: 40,
  blur: 0,
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
  /**
   * Efeitos por imagem, com a mesma chave de `media` (ex.: `aboutHeroBg`).
   * Chave ausente = sem efeito (ver DEFAULT_MEDIA_EFFECT).
   */
  mediaEffects: Record<string, MediaEffect>;
  nav: {
    home: string;
    about: string;
    franchise: string;
  };
  /** Página /privacidade — editada no Admin em "Menu e rodapé". */
  privacyPolicy: {
    title: string;
    /** HTML do editor rich text. */
    content: string;
  };
  /** Página /termos — editada no Admin em "Menu e rodapé". */
  termsOfUse: {
    title: string;
    /** HTML do editor rich text. */
    content: string;
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
    /** Título do bloco de redes sociais no rodapé. */
    socialTitle: string;
    /** Chamada acima dos ícones de rede social. '' = não exibe. */
    socialDescription: string;
    /** Link do mapa. '' = gera busca no Google Maps a partir do endereço. */
    mapsUrl: string;
    socialLinks: SocialLink[];
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
    carousel: CarouselConfig;
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
    /** Máscara escura sobre a foto do hero. */
    heroMaskEnabled: boolean;
    /** 0–100. Intensidade da máscara do hero. */
    heroMaskOpacity: number;
    /** Máscara escura sobre a foto dos pilares. */
    pillarsMaskEnabled: boolean;
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
  mediaEffects: {},
  nav: {
    home: 'Home',
    about: 'Sobre Nós',
    franchise: 'Seja um Franqueado',
  },
  privacyPolicy: {
    title: 'Política de Privacidade',
    content:
      '<p>A Eagle Center Fitness respeita a sua privacidade e protege os seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p><p>Os dados enviados pelos formulários deste site (nome, e-mail, telefone, cidade e capital disponível) são usados exclusivamente para contato comercial sobre franquias e atendimento, e não são compartilhados com terceiros.</p><p>Para solicitar acesso, correção ou exclusão dos seus dados, entre em contato pelos canais informados no rodapé do site.</p>',
  },
  termsOfUse: {
    title: 'Termos de Uso',
    content:
      '<p>Este site é mantido pela Eagle Center Fitness para apresentar a marca, as unidades e o modelo de franquia.</p><p>As informações de investimento, faturamento e retorno são estimativas médias e podem variar conforme região, tamanho da unidade e condições de mercado — não constituem promessa de resultado.</p><p>Os textos, imagens, marcas e vídeos deste site pertencem à Eagle Center Fitness e não podem ser reproduzidos sem autorização.</p><p>Ao enviar um formulário, você autoriza o contato da nossa equipe pelos dados informados, conforme a nossa Política de Privacidade.</p>',
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
    socialTitle: 'Nossas redes',
    socialDescription:
      'Acesse nossa rede social e acompanhe nossas atualizações.',
    mapsUrl: '',
    socialLinks: [
      { platform: 'instagram', url: '' },
      { platform: 'linkedin', url: '' },
    ],
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
      title: 'O treino que você procura, aqui tem.',
      footnote: '*Verifique a disponibilidade na unidade de sua preferência.',
      titleColor: '',
      footnoteColor: '',
      cardTitleColor: '',
      cardLabelColor: '',
      cardTitleFontSize: 36,
      cardLabelFontSize: 12,
      cardOverlayOpacity: 15,
      sideFadeOpacity: 45,
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
    heroMaskEnabled: true,
    heroMaskOpacity: 40,
    pillarsMaskEnabled: true,
    storyTitle: 'Nossa História',
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

  // `mediaEffects` é um mapa livre: o deepMerge só copia chave que já existe no
  // default (aqui, `{}`), então sem este passo os efeitos salvos sumiriam no
  // reload. Cada entrada é normalizada para não confiar no formato gravado.
  const storedEffects = (stored as { mediaEffects?: unknown }).mediaEffects;
  if (isPlainObject(storedEffects)) {
    const effects: Record<string, MediaEffect> = {};
    for (const [key, value] of Object.entries(storedEffects)) {
      if (!isPlainObject(value)) continue;
      effects[key] = {
        maskEnabled:
          typeof value.maskEnabled === 'boolean'
            ? value.maskEnabled
            : DEFAULT_MEDIA_EFFECT.maskEnabled,
        maskOpacity:
          typeof value.maskOpacity === 'number'
            ? value.maskOpacity
            : DEFAULT_MEDIA_EFFECT.maskOpacity,
        blur:
          typeof value.blur === 'number' ? value.blur : DEFAULT_MEDIA_EFFECT.blur,
      };
    }
    out.mediaEffects = effects;
  }

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
