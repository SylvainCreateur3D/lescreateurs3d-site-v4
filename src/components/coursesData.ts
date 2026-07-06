import React from 'react';

export interface CourseModule {
  title: string;
  duration: string;
  lessons: string[];
}

export interface Course {
  id: string;
  title: string;
  slogan: string;
  category: 'Modélisation' | 'Rendu 3D' | 'Intelligence Artificielle' | 'Workflow';
  duration: string;
  lessonsCount: number;
  modulesCount: number;
  level: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  badge?: string;
  gradient: string;
  accentColor: string;
  description: string;
  outcomes: string[];
  audience: string[];
  includes: string[];
  modules: CourseModule[];
  testimonials: {
    name: string;
    role: string;
    comment: string;
    rating: number;
  }[];
  faq: {
    q: string;
    r: string;
  }[];
  published: boolean;
  featured: boolean;
  order: number;
  promoDeadline?: string;
  promoLabel?: string;
  stripeStandardLink?: string;
  stripePromoLink?: string;
  skoolCourseId?: string;
  videoUrl?: string;
  imageUrl?: string;
  vimeoEmbedCode?: string;
  showCouponField?: boolean;
}

export const defaultCourses: Course[] = [
  {
    id: 'ia-creatives',
    title: 'Vidéos créatives par IA : Le Guide Complet',
    slogan: 'Domptez l\'intelligence artificielle pour générer des animations immersives, des visites 3D et des histoires captivantes qui convertissent.',
    category: 'Intelligence Artificielle',
    duration: '4h de formation vidéo',
    lessonsCount: 24,
    modulesCount: 5,
    level: 'Tous niveaux',
    rating: 4.9,
    reviewsCount: 148,
    price: 299,
    originalPrice: 449,
    badge: 'Nouveau',
    gradient: 'from-teal-600 via-cyan-600 to-blue-700',
    accentColor: '#06bcbf',
    stripeStandardLink: 'https://buy.stripe.com/mock-standard-ia',
    stripePromoLink: 'https://buy.stripe.com/mock-promo-ia',
    skoolCourseId: 'ia-creatives-skool',
    description: 'Cette formation pratique vous enseigne de A à Z comment concevoir de formidables vidéos d\'architecture et d\'aménagement intérieur à fort impact émotionnel grâce à l\'IA. Idéal pour les créateurs d\'espace indépendants cherchant à attirer des clients en continu.',
    outcomes: [
      'Se rendre hautement désirable auprès des clients potentiels avant le tout premier rendez-vous',
      'Se différencier radicalement des concurrents figés sur des plans 2D en racontant une histoire vivante',
      'Créer des animations complexes impossibles à tourner (effet chantier accéléré, visites intérieures sur-mesure)',
      'Maîtriser un workflow pas-à-pas précis pour éviter le hasard et maximiser votre efficacité créative',
      'Transformer de simples vidéos de projet en actifs d\'acquisition client automatisés et permanents'
    ],
    audience: [
      'Architectes et décorateurs d\'intérieur souhaitant dynamiser leur communication',
      'Créateurs d\'espaces, menuisiers, agenceurs, paysagistes et cuisinistes',
      'Agents immobiliers et marchands de biens voulant sublimer des projets d\'exception'
    ],
    includes: [
      'Accès à la formation à vie 24h/24',
      'Pack de prompts professionnels d\'architecture prêts à copier-coller',
      'Accès exclusif à la communauté privée d\'entraide des Créateurs 3D',
      'Accès aux futurs LIVES et replays consacrés aux vidéos IA'
    ],
    modules: [
      {
        title: 'Module 1 : Principes et Phases de la création',
        duration: '45 min • 4 leçons',
        lessons: [
          'Comment créer une vidéo créative par IA',
          'Bien connaitre et bien choisir les outils IA video',
          'La recette d\'une vidéo créative impactante',
          'Et le marketing vous y pensez ?'
        ]
      },
      {
        title: 'Module 2 : Générer des Visuels Réalistes et Parfaitement Cohérents',
        duration: '1h00 • 5 leçons',
        lessons: [
          'Pourquoi et comment créer des images de différentes manières',
          'Créer des images à partir de vos projets 3D',
          'Créer des images cohérentes sans projet 3D',
          'Enhancer IA et photo montage pour une qualité maximale'
        ]
      },
      {
        title: 'Module 3 : Création de Clips Vidéo par IA et Animation de la 3D',
        duration: '1h15 • 6 leçons',
        lessons: [
          'Animations simples : travellings, panoramiques, zoom.',
          'Transitions créatives : plonger dans un plan, timelpase de chantier, apparition de meubles...',
          'Insertion et gestion de personnages',
          'Corriger les erreurs et les incohérences'
        ]
      },
      {
        title: 'Module 4 : Montage Express, Voix Off & Effets Sonores',
        duration: '1h00 • 5 leçons',
        lessons: [
          'Assembler et dynamiser la séquence finale sur un logiciel de montage gratuit',
          'Ajouter texte, effets et ajuster la vidéo finale',
          'Intégrer l\'habillage sonore (bruits de chantier, pas, musique immersive)',
          'Ajouter si nécessaire un voix off IA et des sous titres animés'
        ]
      },
      {
        title: 'Module 5 : Stratégie de Diffusion & Marketing Vidéo',
        duration: '30 min • 4 leçons',
        lessons: [
          'Créez vos vidéos pour cibler directement vos prospects',
          'Comment utiliser les émotions dans vos vidéos',
          'Utiliser la vidéo en prospection directe (email et messages ciblés)',
          'Analyser les retours pour optimiser en continu vos futurs projets'
        ]
      }
    ],
    testimonials: [
      {
        name: 'Mathieu C.',
        role: 'Architecte d\'Intérieur',
        comment: 'J\'ai suivi la formation V-Ray et Sketchup avec Sylvain. C\'est de loin la meilleure formation que j\'ai pu suivre. Pédagogie excellente, vidéos claires et un résultat pro dès les premiers jours. Merci Les Créateurs 3D !',
        rating: 5
      },
      {
        name: 'Julie Dubois',
        role: 'Décoratrice d\'intérieur',
        comment: 'Une méthode de travail redoutable. Les rendus sont incroyables et le suivi est top. J\'ai pu rentabiliser la formation dès mon premier projet client. Je recommande à 100%.',
        rating: 5
      },
      {
        name: 'Thomas R.',
        role: 'Designer 3D',
        comment: 'Excellente formation ! Sylvain est un super formateur, très à l\'écoute. Les astuces pour optimiser le temps de rendu m\'ont changé la vie.',
        rating: 5
      }
    ],
    faq: [
      {
        q: 'Quel niveau technique ou matériel faut-il pour suivre la formation ?',
        r: 'Aucun prérequis technique ou artistique n\'est demandé ! Les outils d\'IA s\'utilisent directement sur internet depuis n\'importe quel ordinateur (PC ou Mac) via des interfaces simples.'
      },
      {
        q: 'Quels sont les outils d\'IA présentés et sont-ils payants ?',
        r: 'Nous présentons les standards du marché (générateurs d\'images, d\'animations vidéo et de voix off). Les versions de démonstration gratuites vous permettront de tester les différents outils pour vous faire la main. Cependant, pour un usage professionnel ou si vous souhaitez exploiter pleinement leurs capacités, il est vivement conseillé et préférable d\'utiliser les versions payantes. De plus, rassurez-vous : les tarifs et les sommes nécessaires pour s\'abonner restent très peu élevés.'
      },
      {
        q: 'La formation est-elle disponible immédiatement ?',
        r: 'Oui ! Dès votre inscription, vous recevez vos identifiants d\'accès e-learning par email. Vous pouvez visionner les modules et appliquer la méthode pas-à-pas à votre propre rythme.'
      }
    ],
    published: true,
    featured: true,
    order: 1,
    promoDeadline: '2026-07-05T23:59:00'
  },
  {
    id: 'sketchup-masterclass',
    title: 'SketchUp Masterclass : Initiation à l\'Expertise',
    slogan: 'La méthode complète pour concevoir, structurer et présenter tous vos projets 3D avec une rapidité professionnelle.',
    category: 'Modélisation',
    duration: '18h de formation vidéo',
    lessonsCount: 84,
    modulesCount: 12,
    level: 'Débutant à Avancé',
    rating: 4.9,
    reviewsCount: 182,
    price: 297,
    originalPrice: 497,
    badge: 'Best-seller',
    gradient: 'from-amber-500 to-orange-600',
    accentColor: '#f59e0b',
    stripeStandardLink: 'https://buy.stripe.com/mock-standard-sketchup',
    stripePromoLink: 'https://buy.stripe.com/mock-promo-sketchup',
    description: 'Le guide de référence pour maîtriser SketchUp Pro de A à Z. Conçu spécialement pour les architectes, décorateurs d\'intérieur et designers pour structurer proprement vos fichiers et diviser votre temps de travail par trois.',
    outcomes: [
      'Maîtriser tous les outils de dessin et modification 3D professionnels',
      'Structurer vos modèles proprement grâce aux groupes, composants et balises',
      'Éviter les ralentissements système en optimisant le poids de vos scènes',
      'Dessiner précisément à partir de relevés papier ou de plans d\'architectes'
    ],
    audience: ['Architectes d\'intérieur', 'Décorateurs d\'espace', 'Menuisiers et artisans'],
    includes: [
      'Accès à vie illimité 24h/24',
      'Mises à jour gratuites pour les futures versions de SketchUp',
      '15 modèles 3D d\'étude prêts à l\'emploi'
    ],
    modules: [
      {
        title: 'Module 1 : Prise en main & Environnement de travail',
        duration: '1h15 • 6 leçons',
        lessons: [
          'Configurer une interface de travail optimisée pour l\'architecture',
          'Naviguer avec aisance et maîtriser les raccourcis clés professionnels'
        ]
      },
      {
        title: 'Module 2 : Outils de dessin 2D & Logique de précision',
        duration: '1h45 • 8 leçons',
        lessons: [
          'Le moteur d\'inférence : la clé d\'un dessin irréprochable au millimètre',
          'Construire des bases géométriques parfaites pour le passage en 3D'
        ]
      }
    ],
    testimonials: [
      {
        name: 'Sophie Laurent',
        role: 'Architecte d\'intérieur',
        comment: 'Une méthode rigoureuse qui m\'a évité de nombreux plantages sur de gros fichiers. On sent l\'expertise de Sylvain à chaque vidéo.',
        rating: 5
      },
      {
        name: 'Nicolas V.',
        role: 'Architecte',
        comment: 'Très pro. La modélisation devient beaucoup plus fluide et on gagne un temps fou. Un investissement indispensable.',
        rating: 5
      }
    ],
    faq: [
      {
        q: 'Faut-il avoir la licence payante de SketchUp ?',
        r: 'Les concepts fondamentaux s\'appliquent aussi bien sur la version gratuite que professionnelle.'
      }
    ],
    published: true,
    featured: false,
    order: 2,
    promoDeadline: '2026-07-08T18:00:00'
  },
  {
    id: 'vray-mastery',
    title: 'Rendu Photoréaliste avec V-Ray',
    slogan: 'Domptez les lumières artificielles, créez des matériaux réalistes et produisez des perspectives 3D saisissantes.',
    category: 'Rendu 3D',
    duration: '12h de formation vidéo',
    lessonsCount: 52,
    modulesCount: 8,
    level: 'Intermédiaire à Avancé',
    rating: 4.8,
    reviewsCount: 94,
    price: 349,
    originalPrice: 599,
    badge: 'Recommandé',
    gradient: 'from-indigo-600 to-violet-800',
    accentColor: '#4f46e5',
    stripeStandardLink: 'https://buy.stripe.com/mock-standard-vray',
    stripePromoLink: 'https://buy.stripe.com/mock-promo-vray',
    description: 'Savoir modéliser ne suffit plus. Pour remporter des contrats et séduire vos clients de prestige, vous devez présenter des images de synthèse immersives au réalisme saisissant grâce à la puissance de V-Ray.',
    outcomes: [
      'Comprendre l\'exposition photographique et l\'éclairage d\'intérieur',
      'Configurer des matières physiques réalistes (bois veiné, métaux, verre dépoli)',
      'Utiliser les dômes de lumière HDRI pour des ciels et ombres ultra-réalistes',
      'Optimiser vos temps de calcul pour un rendu rapide et de haute qualité'
    ],
    audience: ['Concepteurs 3D', 'Architectes d\'intérieur', 'Créateurs d\'images de synthèse'],
    includes: [
      'Accès à vie à la formation en ligne',
      '10 scènes complètes SketchUp + V-Ray configurées',
      'Bibliothèque de plus de 150 textures pré-paramétrées'
    ],
    modules: [
      {
        title: 'Module 1 : L\'Asset Editor & Moteurs de calcul',
        duration: '1h00 • 5 leçons',
        lessons: [
          'Comprendre le panneau central de contrôle des ressources V-Ray',
          'L\'Interactive Render : configurer ses scènes avec un retour visuel direct'
        ]
      }
    ],
    testimonials: [
      {
        name: 'Camille P.',
        role: 'Étudiante en Architecture',
        comment: 'Mes rendus de projets d\'appartement ressemblent maintenant à de vrais clichés de magazines ! Les explications sur l\'éclairage sont géniales.',
        rating: 5
      },
      {
        name: 'Laurent D.',
        role: 'Infographiste 3D',
        comment: 'Formation claire, précise et très bien construite. Les Créateurs 3D c\'est la référence pour V-Ray francophone. Merci !',
        rating: 5
      }
    ],
    faq: [
      {
        q: 'V-Ray est-il gourmand en ressources ?',
        r: 'Nous vous enseignons d\'excellentes techniques pour optimiser les scènes et travailler de façon fluide.'
      }
    ],
    published: true,
    featured: false,
    order: 3,
    promoDeadline: '2026-07-12T20:30:00'
  }
];
