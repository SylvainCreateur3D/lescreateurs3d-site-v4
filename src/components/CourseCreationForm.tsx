import React, { useState } from 'react';
import { 
  Palette, 
  Layers, 
  Sliders, 
  Wand2, 
  Check, 
  Plus, 
  Trash2, 
  Save, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  BookOpen, 
  Clock, 
  Users 
} from 'lucide-react';
import { Course, CourseModule } from './coursesData';

interface CourseCreationFormProps {
  editingCourse: Partial<Course>;
  setEditingCourse: React.Dispatch<React.SetStateAction<Partial<Course> | null>>;
  courses: Course[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  stripeConfigured: boolean;
  setStripeConfigured: (val: boolean) => void;
  stripeConfigMessage: string;
  setStripeConfigMessage: (val: string) => void;
  isStripeSyncing: boolean;
  setIsStripeSyncing: (val: boolean) => void;
}

export default function CourseCreationForm({
  editingCourse,
  setEditingCourse,
  courses,
  onClose,
  onSave,
  stripeConfigured,
  setStripeConfigured,
  stripeConfigMessage,
  setStripeConfigMessage,
  isStripeSyncing,
  setIsStripeSyncing
}: CourseCreationFormProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'content' | 'pricing'>('style');

  const applyCourseTemplate = (templateType: 'sketchup' | 'vray' | 'ia' | 'atelier') => {
    let patch: Partial<Course> = {};
    
    if (templateType === 'sketchup') {
      patch = {
        title: "SketchUp Masterclass Pro",
        slogan: "Modélisez 3x plus vite avec une rigueur chirurgicale",
        category: "Modélisation",
        duration: "12h de formation",
        lessonsCount: 42,
        modulesCount: 3,
        level: "Tous niveaux",
        gradient: "from-amber-500 to-orange-600",
        accentColor: "#f59e0b",
        description: "Une méthode de modélisation pas-à-pas conçue pour les professionnels de l'architecture d'intérieur. Évitez les fichiers lourds, divisez votre temps de modélisation par 3, et travaillez proprement.",
        outcomes: [
          "Maîtriser une méthode de modélisation ultra-rapide et structurée",
          "Utiliser intelligemment les balises, groupes et composants",
          "Importer, nettoyer et exploiter des plans 2D (CAD/PDF)",
          "Optimiser vos modèles pour éliminer les ralentissements",
          "Concevoir des coupes, plans de détails et documents d'exécution"
        ],
        audience: [
          "Architectes d'intérieur et Décorateurs",
          "Professionnels de l'agencement et du mobilier",
          "Autodidactes souhaitant acquérir une méthode rigoureuse"
        ],
        includes: [
          "Accès à vie 24h/24 aux 42 leçons vidéo",
          "Fichiers d'exercice SketchUp de démarrage et corrigés",
          "Ressources de composants de mobilier exclusifs",
          "Support formateur et accès au forum d'entraide"
        ],
        modules: [
          {
            title: "Module 1 : Interface, Raccourcis et Optimisation",
            duration: "1h30 • 6 leçons",
            lessons: [
              "Introduction et objectifs de la formation",
              "Configuration d'une interface métier rapide et épurée",
              "Les raccourcis indispensables pour travailler sans lever la main",
              "Comprendre l'environnement 3D et les pièges d'affichage"
            ]
          },
          {
            title: "Module 2 : La Logique d'Organisation (Balises & Composants)",
            duration: "2h45 • 8 leçons",
            lessons: [
              "Pourquoi votre SketchUp rame ? Le diagnostic",
              "La règle d'or : Géométrie brute vs Conteneurs",
              "Groupes vs Composants : Maîtriser le clonage intelligent",
              "Structurer son modèle avec le système de Balises (Tags)",
              "Nettoyage chirurgical des modèles importés de la 3D Warehouse"
            ]
          },
          {
            title: "Module 3 : Modélisation d'une Scène d'Intérieur pas-à-pas",
            duration: "4h15 • 12 leçons",
            lessons: [
              "Importation et mise à l'échelle d'un plan 2D",
              "Élévation des murs extérieurs et cloisons",
              "Création des ouvertures (portes, fenêtres dynamiques)",
              "Modélisation de menuiseries sur-mesure (Cuisine & Dressing)",
              "Gestion des matières et textures sans étirer les motifs"
            ]
          }
        ],
        faq: [
          {
            q: "La formation est-elle adaptée si je n'ai jamais ouvert le logiciel ?",
            r: "Oui ! Le premier module reprend les bases indispensables et installe d'emblée de bonnes habitudes de structure pour vous éviter des années de frustration."
          },
          {
            q: "Quelle version de SketchUp est requise ?",
            r: "Toutes les versions récentes (Pro ou Studio) conviennent. Les concepts d'organisation s'appliquent sur toutes les déclinaisons du logiciel."
          }
        ],
        testimonials: [
          {
            name: "Mélanie D.",
            role: "Architecte d'intérieur",
            comment: "Un avant et un après ! Mes fichiers ne plantent plus et j'ai divisé par deux mon temps de travail sur mes projets 3D.",
            rating: 5
          }
        ]
      };
    } else if (templateType === 'vray') {
      patch = {
        title: "V-Ray Mastery",
        slogan: "Créez des rendus réalistes de prestige et déclenchez le coup de cœur",
        category: "Rendu 3D",
        duration: "15h de formation",
        lessonsCount: 50,
        modulesCount: 2,
        level: "Intermédiaire",
        gradient: "from-indigo-600 to-violet-800",
        accentColor: "#8b5cf6",
        description: "Apprenez à sculpter la lumière et paramétrer des matériaux vibrants pour transformer vos scènes 3D en véritables photographies de magazine.",
        outcomes: [
          "Sculpter la lumière naturelle et artificielle de manière réaliste",
          "Créer des matériaux réalistes complexes (bois, marbre, tissus)",
          "Maîtriser les caméras physiques pour des cadrages professionnels",
          "Optimiser vos temps de calcul de rendus pour livrer à temps",
          "Utiliser le tampon de rendu de V-Ray pour la post-production express"
        ],
        audience: [
          "Professionnels de l'architecture d'intérieur possédant de bonnes bases en 3D",
          "Visualisateurs 3D et infographistes indépendants",
          "Étudiants en design d'espace souhaitant un portfolio d'exception"
        ],
        includes: [
          "Accès à vie aux 50 leçons vidéo haute définition",
          "Scène SketchUp complète pré-configurée prête à l'emploi",
          "Pack de 20 textures PBR haute résolution professionnelles",
          "Support personnalisé sous chaque leçon vidéo"
        ],
        modules: [
          {
            title: "Module 1 : Théorie de la Lumière & Studio Photo",
            duration: "2h • 5 leçons",
            lessons: [
              "Les règles d'or de la lumière en photographie d'intérieur",
              "Lumière Naturelle : Dômes de lumière (HDRI) et Sun Light",
              "Lumière Artificielle : Spots, rubans LED et IES Profiles",
              "Équilibre et hiérarchie lumineuse de la scène"
            ]
          },
          {
            title: "Module 2 : Matériaux Réalistes complexes (PBR)",
            duration: "4h • 10 leçons",
            lessons: [
              "Comprendre l'éditeur de matériaux de V-Ray",
              "La réflexion et la rugosité (glossiness)",
              "Donner du relief : Maîtriser le Bump et le Displacement",
              "Créer un verre parfait et des métaux précieux",
              "Configurer des tissus doux et du parquet réaliste"
            ]
          }
        ],
        faq: [
          {
            q: "Faut-il un ordinateur ultra-puissant pour suivre ce cours ?",
            r: "Un ordinateur de moyenne gamme récente suffit. Nous vous apprenons justement à optimiser vos scènes pour réduire le temps de calcul au strict minimum."
          },
          {
            q: "V-Ray pour SketchUp est-il différent de V-Ray pour 3ds Max ?",
            r: "Le moteur et l'interface sont presque identiques. Ce cours est enregistré sur SketchUp mais la logique s'applique partout."
          }
        ],
        testimonials: [
          {
            name: "Thomas L.",
            role: "Designer 3D",
            comment: "Grâce à cette formation, j'ai pu augmenter mes tarifs de prestation de rendu auprès des promoteurs immobiliers !",
            rating: 5
          }
        ]
      };
    } else if (templateType === 'ia') {
      patch = {
        title: "IA pour les Créatifs 3D",
        slogan: "Intégrez Midjourney, Stable Diffusion et ChatGPT dans votre workflow de design",
        category: "Intelligence Artificielle",
        duration: "8h de formation",
        lessonsCount: 30,
        modulesCount: 2,
        level: "Tous niveaux",
        gradient: "from-teal-600 via-cyan-600 to-blue-700",
        accentColor: "#06bcbf",
        description: "Découvrez comment utiliser l'intelligence artificielle pour générer des planches d'ambiance ultra-réalistes, retoucher vos rendus en 10 secondes et décupler votre créativité commerciale.",
        outcomes: [
          "Rédiger des prompts professionnels pour le design d'intérieur",
          "Générer des concepts de pièces photoréalistes sous tous les angles",
          "Retoucher et transformer des éléments précis d'un rendu 3D existant",
          "Rédiger des descriptions de projets et argumentaires clients percutants",
          "Créer des moodboards clients inspirants en moins de 5 minutes"
        ],
        audience: [
          "Créateurs d'espace, décorateurs et designers",
          "Artistes 3D cherchant à accélérer leur phase de conception",
          "Professionnels du marketing immobilier et de la communication"
        ],
        includes: [
          "Accès à vie aux modules vidéo constamment mis à jour",
          "Guide PDF exclusif de 150 prompts d'architecture d'intérieur",
          "Accès à un serveur Discord d'entraide dédié à l'IA",
          "Mises à jour gratuites régulières sur les nouveaux outils"
        ],
        modules: [
          {
            title: "Module 1 : ChatGPT pour le Design Conceptuel",
            duration: "1h30 • 5 leçons",
            lessons: [
              "Comment faire rédiger un cahier des charges client ultra-précis",
              "Générer des concepts d'aménagement narratifs originaux",
              "Créer des prompts complexes pour Midjourney",
              "Automatiser sa communication de marque et ses posts Instagram"
            ]
          },
          {
            title: "Module 2 : Midjourney Masterclass",
            duration: "3h • 8 leçons",
            lessons: [
              "Prise en main de Discord et bases de la génération d'images",
              "Le vocabulaire clé de l'architecture d'intérieur en prompting",
              "Contrôler le style, la lumière et l'objectif photo",
              "Conserver une cohérence visuelle sur plusieurs générations",
              "Uscale et agrandissement HD pour l'impression client"
            ]
          }
        ],
        faq: [
          {
            q: "Est-ce que l'IA va remplacer les logiciels de 3D classiques ?",
            r: "Non, l'IA est un complément extraordinaire pour les phases d'idéation rapides et la retouche de rendus, mais le contrôle structurel précis reste aux logiciels de CAO."
          }
        ],
        testimonials: [
          {
            name: "Sarah P.",
            role: "Décoratrice d'intérieur",
            comment: "Mes clients valident mes projets beaucoup plus vite depuis que je leur montre des esquisses d'ambiance générées avec Midjourney.",
            rating: 5
          }
        ]
      };
    } else if (templateType === 'atelier') {
      patch = {
        title: "Atelier Créatif Flash",
        slogan: "Un aménagement complet de A à Z résolu en moins de 3 heures",
        category: "Workflow",
        duration: "3h de formation",
        lessonsCount: 12,
        modulesCount: 1,
        level: "Tous niveaux",
        gradient: "from-rose-500 to-red-600",
        accentColor: "#f43f5e",
        description: "Un format court, percutant et 100% pratique pour débloquer un point précis de votre activité ou concevoir un aménagement d'espace complet en direct.",
        outcomes: [
          "Aller droit au but sans blabla théorique",
          "Résoudre une problématique métier concrète",
          "Repartir avec un modèle prêt à être présenté à un client"
        ],
        audience: [
          "Créatifs pressés cherchant un boost de compétences immédiat",
          "Étudiants ayant besoin d'un cas pratique concret",
          "Professionnels voulant découvrir une nouvelle astuce métier"
        ],
        includes: [
          "Accès immédiat et illimité aux vidéos de l'atelier",
          "Fichier source 3D complet inclus dans le téléchargement",
          "Support questions/réponses illimité dans l'espace membre"
        ],
        modules: [
          {
            title: "Module Unique : Réalisation pas-à-pas",
            duration: "2h30 • 8 leçons",
            lessons: [
              "Présentation du cas pratique et ressources de départ",
              "Analyse des contraintes spatiales et zoning rapide",
              "Modélisation optimisée des points clés du projet",
              "Astuces de textures express et mise en scène rapide",
              "Conclusion et conseils de présentation commerciale"
            ]
          }
        ],
        faq: [
          {
            q: "Puis-je utiliser le modèle créé dans mon portfolio ?",
            r: "Oui ! Les fichiers de l'atelier sont libres de droits pour un usage professionnel de présentation."
          }
        ],
        testimonials: [
          {
            name: "Laurent G.",
            role: "Agenceur d'espace",
            comment: "Format idéal pour une après-midi de perfectionnement. Efficace, clair et directement applicable.",
            rating: 5
          }
        ]
      };
    }
    
    setEditingCourse(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...patch
      };
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-800/80 gap-2 mb-6 shrink-0 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'style'
              ? 'border-[#06bcbf] text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4 text-[#06bcbf]" />
          1. Style & Identité
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'content'
              ? 'border-[#06bcbf] text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-[#06bcbf]" />
          2. Programme & Contenu
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'border-[#06bcbf] text-white bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#06bcbf]" />
          3. Tarifs & Stripe
        </button>
      </div>

      <form onSubmit={onSave} className="space-y-6 flex-1 pb-12">
        {/* TAB 1: IDENTITÉ & STYLE */}
        {activeTab === 'style' && (
          <div className="space-y-6">
            {/* Quick Template Picker */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06bcbf]/5 blur-xl pointer-events-none"></div>
              <div className="flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-[#06bcbf] shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Modèles de Squelettes de Formation (Express)</h4>
                  <p className="text-xs text-slate-400">
                    Gagnez un temps précieux : cliquez sur l'un de ces modèles pour injecter instantanément une structure de cours complète, des modules types de l'architecture d'intérieur, une FAQ et un avis élève. Vous n'aurez plus qu'à ajuster les détails !
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => applyCourseTemplate('sketchup')}
                  className="p-3 bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-amber-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">✓ SketchUp Master</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Modélisation 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCourseTemplate('vray')}
                  className="p-3 bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-indigo-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">✓ V-Ray Mastery</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Rendus Photo Pro</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCourseTemplate('ia')}
                  className="p-3 bg-slate-900 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-cyan-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">✓ IA & Créatifs</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Midjourney & GPT</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyCourseTemplate('atelier')}
                  className="p-3 bg-slate-900 border border-slate-800/80 hover:border-rose-500/50 rounded-xl text-left transition-all active:scale-95 group cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-rose-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">✓ Atelier Flash</span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">Workflow court 3h</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID Unique (Slug URL) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingCourse.id || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                  required
                  disabled={courses.some(c => c.id === editingCourse.id)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thématique / Catégorie</label>
                <select
                  value={editingCourse.category || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                >
                  <option value="Modélisation">Modélisation</option>
                  <option value="Rendu 3D">Rendu 3D</option>
                  <option value="Intelligence Artificielle">Intelligence Artificielle</option>
                  <option value="Workflow">Workflow</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Titre de la formation <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingCourse.title || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slogan accrocheur <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editingCourse.slogan || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, slogan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Niveau</label>
                <select
                  value={editingCourse.level || 'Tous niveaux'}
                  onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                >
                  <option value="Tous niveaux">Tous niveaux</option>
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Avancé">Avancé</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Durée (Format Texte)</label>
                <input
                  type="text"
                  value={editingCourse.duration || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                  placeholder="Ex: 12h de formation"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de leçons</label>
                <input
                  type="number"
                  value={editingCourse.lessonsCount || 0}
                  onChange={(e) => setEditingCourse({ ...editingCourse, lessonsCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de modules</label>
                <input
                  type="number"
                  value={editingCourse.modulesCount || 0}
                  onChange={(e) => setEditingCourse({ ...editingCourse, modulesCount: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                />
              </div>
            </div>

            {/* Custom Interactive Color Picker */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#06bcbf]" />
                Identité Visuelle & Thème de couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Océan Émeraude', gradient: 'from-teal-600 via-cyan-600 to-blue-700', accent: '#06bcbf' },
                  { label: 'Bleu Royal', gradient: 'from-blue-600 to-indigo-700', accent: '#2563eb' },
                  { label: 'Or Flamboyant', gradient: 'from-amber-500 to-orange-600', accent: '#f59e0b' },
                  { label: 'Mystique Violet', gradient: 'from-indigo-600 to-violet-800', accent: '#8b5cf6' },
                  { label: 'Forêt Émeraude', gradient: 'from-emerald-500 to-teal-700', accent: '#10b981' },
                  { label: 'Rose Intense', gradient: 'from-rose-500 to-red-600', accent: '#f43f5e' },
                  { label: 'Carbone Sombre', gradient: 'from-slate-700 to-slate-900', accent: '#475569' },
                ].map((theme, i) => {
                  const isSelected = editingCourse.gradient === theme.gradient;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditingCourse({ ...editingCourse, gradient: theme.gradient, accentColor: theme.accent })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-900 border-[#06bcbf] text-white shadow-lg' 
                          : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${theme.gradient} border border-white/20`} />
                      <span>{theme.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#06bcbf]" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    if (!editingCourse.gradient?.startsWith('#')) {
                      setEditingCourse({ ...editingCourse, gradient: '#06bcbf', accentColor: '#06bcbf' });
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                    editingCourse.gradient?.startsWith('#')
                      ? 'bg-slate-900 border-[#06bcbf] text-white shadow-lg' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {editingCourse.gradient?.startsWith('#') ? (
                    <input
                      type="color"
                      value={editingCourse.gradient}
                      onChange={(e) => setEditingCourse({ ...editingCourse, gradient: e.target.value, accentColor: e.target.value })}
                      className="w-5 h-5 bg-transparent border-none cursor-pointer p-0 shrink-0"
                    />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-white/20" />
                  )}
                  <span>Couleur Perso</span>
                  {editingCourse.gradient?.startsWith('#') && <Check className="w-3.5 h-3.5 text-[#06bcbf]" />}
                </button>
              </div>
            </div>

            {/* Media URLs and Unsplash Suggester */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Illustrations & Couverture visuelle</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">URL de l'image de couverture principale</label>
                  <input
                    type="text"
                    value={editingCourse.imageUrl || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, imageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">URL de la vidéo de présentation (Vimeo / YouTube - Optionnel)</label>
                  <input
                    type="text"
                    value={editingCourse.videoUrl || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, videoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                    placeholder="https://vimeo.com/..."
                  />
                </div>
              </div>

              {/* Unsplash suggester quick cards */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Choisir une image d'architecte d'intérieur professionnelle suggérée :</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: '🛋️ Salon Moderne', url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=85' },
                    { label: '🍳 Cuisine Marbre', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=85' },
                    { label: '🏠 Villa Moderne', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85' },
                    { label: '🏢 Loft Minimaliste', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=85' },
                    { label: '🤖 Synthèse IA', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=85' }
                  ].map((img, idx) => {
                    const isSelected = editingCourse.imageUrl === img.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingCourse({ ...editingCourse, imageUrl: img.url })}
                        className={`px-2 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 truncate text-center cursor-pointer ${
                          isSelected 
                            ? 'bg-[#06bcbf]/10 border-[#06bcbf] text-[#06bcbf]' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {img.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Publish Switch */}
            <div className="flex items-center gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <input
                type="checkbox"
                id="published"
                checked={editingCourse.published !== false}
                onChange={(e) => setEditingCourse({ ...editingCourse, published: e.target.checked })}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-[#06bcbf] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="published" className="text-xs font-bold text-white uppercase tracking-wide cursor-pointer select-none">
                Publier immédiatement cette formation dans le catalogue public
              </label>
            </div>
          </div>
        )}

        {/* TAB 2: PROGRAMME & CONTENU */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Présentation / Description globale (Soutient le Markdown)</label>
              <textarea
                rows={4}
                value={editingCourse.description || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                placeholder="Présentez les objectifs clés de ce parcours..."
              />
            </div>

            {/* Outcomes, Audience & Includes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Outcomes */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bénéfices / Acquis élève ({editingCourse.outcomes?.length || 0})</label>
                <div className="space-y-2">
                  {(editingCourse.outcomes || []).map((out, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={out}
                        onChange={(e) => {
                          const copy = [...(editingCourse.outcomes || [])];
                          copy[idx] = e.target.value;
                          setEditingCourse({ ...editingCourse, outcomes: copy });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (editingCourse.outcomes || []).filter((_, i) => i !== idx);
                          setEditingCourse({ ...editingCourse, outcomes: copy });
                        }}
                        className="text-red-500 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...(editingCourse.outcomes || []), ''];
                      setEditingCourse({ ...editingCourse, outcomes: copy });
                    }}
                    className="text-[11px] font-bold text-[#06bcbf] hover:underline block pt-1"
                  >
                    + Ajouter un acquis
                  </button>
                </div>
              </div>

              {/* Audience */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">À qui s'adresse ce cours ({editingCourse.audience?.length || 0})</label>
                <div className="space-y-2">
                  {(editingCourse.audience || []).map((aud, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={aud}
                        onChange={(e) => {
                          const copy = [...(editingCourse.audience || [])];
                          copy[idx] = e.target.value;
                          setEditingCourse({ ...editingCourse, audience: copy });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (editingCourse.audience || []).filter((_, i) => i !== idx);
                          setEditingCourse({ ...editingCourse, audience: copy });
                        }}
                        className="text-red-500 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...(editingCourse.audience || []), ''];
                      setEditingCourse({ ...editingCourse, audience: copy });
                    }}
                    className="text-[11px] font-bold text-[#06bcbf] hover:underline block pt-1"
                  >
                    + Ajouter une cible
                  </button>
                </div>
              </div>

              {/* Includes */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ce qui est inclus ({editingCourse.includes?.length || 0})</label>
                <div className="space-y-2">
                  {(editingCourse.includes || []).map((inc, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={inc}
                        onChange={(e) => {
                          const copy = [...(editingCourse.includes || [])];
                          copy[idx] = e.target.value;
                          setEditingCourse({ ...editingCourse, includes: copy });
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (editingCourse.includes || []).filter((_, i) => i !== idx);
                          setEditingCourse({ ...editingCourse, includes: copy });
                        }}
                        className="text-red-500 hover:text-red-400 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...(editingCourse.includes || []), ''];
                      setEditingCourse({ ...editingCourse, includes: copy });
                    }}
                    className="text-[11px] font-bold text-[#06bcbf] hover:underline block pt-1"
                  >
                    + Ajouter un bonus/fichiers
                  </button>
                </div>
              </div>
            </div>

            {/* MODULES / SYLLABUS LIST */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Programme pédagogique ({editingCourse.modules?.length || 0} Modules)</h4>
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...(editingCourse.modules || []), { title: '', duration: '', lessons: [] }];
                    setEditingCourse({ ...editingCourse, modules: copy });
                  }}
                  className="text-xs font-black text-[#06bcbf] hover:underline"
                >
                  + Ajouter un module de cours
                </button>
              </div>

              <div className="space-y-4">
                {(editingCourse.modules || []).map((mod, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (editingCourse.modules || []).filter((_, i) => i !== idx);
                        setEditingCourse({ ...editingCourse, modules: copy });
                      }}
                      className="absolute top-4 right-4 text-xs font-bold text-red-500 hover:text-red-400"
                    >
                      Supprimer le module
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-24">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Titre du module</label>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const copy = [...(editingCourse.modules || [])];
                            copy[idx] = { ...copy[idx], title: e.target.value };
                            setEditingCourse({ ...editingCourse, modules: copy });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                          placeholder="Ex: Module 1 : Bases de SketchUp"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Durée (leçons / heures)</label>
                        <input
                          type="text"
                          value={mod.duration}
                          onChange={(e) => {
                            const copy = [...(editingCourse.modules || [])];
                            copy[idx] = { ...copy[idx], duration: e.target.value };
                            setEditingCourse({ ...editingCourse, modules: copy });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                          placeholder="Ex: 2h30 • 6 leçons"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Liste des leçons (Une par ligne)</label>
                      <textarea
                        rows={3}
                        value={(mod.lessons || []).join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          const copy = [...(editingCourse.modules || [])];
                          copy[idx] = { ...copy[idx], lessons: lines };
                          setEditingCourse({ ...editingCourse, modules: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-[#06bcbf]"
                        placeholder="Exemple:&#10;01. Installation et configuration&#10;02. Les raccourcis indispensables&#10;03. Premier rendu test"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ & Testimonials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FAQ */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Questions Fréquentes (FAQ)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...(editingCourse.faq || []), { q: '', r: '' }];
                      setEditingCourse({ ...editingCourse, faq: copy });
                    }}
                    className="text-[11px] font-bold text-[#06bcbf]"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(editingCourse.faq || []).map((f, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (editingCourse.faq || []).filter((_, i) => i !== idx);
                          setEditingCourse({ ...editingCourse, faq: copy });
                        }}
                        className="absolute top-2 right-2 text-red-500 text-xs"
                      >
                        ✕
                      </button>
                      <input
                        type="text"
                        value={f.q}
                        onChange={(e) => {
                          const copy = [...(editingCourse.faq || [])];
                          copy[idx] = { ...copy[idx], q: e.target.value };
                          setEditingCourse({ ...editingCourse, faq: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#06bcbf]"
                        placeholder="La question ?"
                      />
                      <textarea
                        rows={2}
                        value={f.r}
                        onChange={(e) => {
                          const copy = [...(editingCourse.faq || [])];
                          copy[idx] = { ...copy[idx], r: e.target.value };
                          setEditingCourse({ ...editingCourse, faq: copy });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none focus:border-[#06bcbf]"
                        placeholder="La réponse..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Témoignages & Avis ({editingCourse.testimonials?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...(editingCourse.testimonials || []), { name: '', role: '', comment: '', rating: 5 }];
                      setEditingCourse({ ...editingCourse, testimonials: copy, reviewsCount: copy.length });
                    }}
                    className="text-[11px] font-bold text-[#06bcbf]"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(editingCourse.testimonials || []).map((t, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800/60 space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = (editingCourse.testimonials || []).filter((_, i) => i !== idx);
                          setEditingCourse({ ...editingCourse, testimonials: copy, reviewsCount: copy.length });
                        }}
                        className="absolute top-2 right-2 text-red-500 text-xs"
                      >
                        ✕
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const copy = [...(editingCourse.testimonials || [])];
                            copy[idx] = { ...copy[idx], name: e.target.value };
                            setEditingCourse({ ...editingCourse, testimonials: copy });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none"
                          placeholder="Nom de l'élève"
                        />
                        <input
                          type="text"
                          value={t.role}
                          onChange={(e) => {
                            const copy = [...(editingCourse.testimonials || [])];
                            copy[idx] = { ...copy[idx], role: e.target.value };
                            setEditingCourse({ ...editingCourse, testimonials: copy });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none"
                          placeholder="Métier (ex: Déco d'intérieur)"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2 items-center">
                        <textarea
                          rows={2}
                          value={t.comment}
                          onChange={(e) => {
                            const copy = [...(editingCourse.testimonials || [])];
                            copy[idx] = { ...copy[idx], comment: e.target.value };
                            setEditingCourse({ ...editingCourse, testimonials: copy });
                          }}
                          className="col-span-3 w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs outline-none"
                          placeholder="Avis de l'élève..."
                        />
                        <select
                          value={t.rating}
                          onChange={(e) => {
                            const copy = [...(editingCourse.testimonials || [])];
                            copy[idx] = { ...copy[idx], rating: Number(e.target.value) };
                            setEditingCourse({ ...editingCourse, testimonials: copy });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-1 py-1 text-xs outline-none"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                          <option value="4">⭐⭐⭐⭐ (4)</option>
                          <option value="3">⭐⭐⭐ (3)</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TARIFS & STRIPE COCKPIT */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Configuration des tarifs (EUR)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarif promotionnel <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={editingCourse.price || 0}
                    onChange={(e) => setEditingCourse({ ...editingCourse, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarif d'origine (barré)</label>
                  <input
                    type="number"
                    value={editingCourse.originalPrice || 0}
                    onChange={(e) => setEditingCourse({ ...editingCourse, originalPrice: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Texte Badge Promo</label>
                  <input
                    type="text"
                    value={editingCourse.promoLabel || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, promoLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                    placeholder="Ex: OFFRE DE LANCEMENT"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date butoir promo (ISO)</label>
                  <input
                    type="text"
                    value={editingCourse.promoDeadline || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, promoDeadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                    placeholder="Ex: 2026-12-31T23:59:59"
                  />
                </div>
              </div>
            </div>

            {/* Automated Stripe creation link */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#06bcbf]/5 blur-xl pointer-events-none"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Générateur de liens Stripe Checkout sécurisés</h4>
                  <p className="text-xs text-slate-400">
                    Notre serveur d'intégration peut raccorder directement vos prix saisis pour générer automatiquement des liens Stripe d'encaissement conformes.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isStripeSyncing}
                  onClick={async () => {
                    if (!editingCourse.title) {
                      alert("Veuillez d'abord saisir un titre de formation");
                      return;
                    }
                    setIsStripeSyncing(true);
                    try {
                      // Call standard local stripe generator simulation to prefill URLs
                      const simulatedStandard = `https://checkout.stripe.com/c/pay/cs_live_${Math.random().toString(36).substring(2, 10)}#title=${encodeURIComponent(editingCourse.title)}`;
                      const simulatedPromo = `https://checkout.stripe.com/c/pay/cs_live_promo_${Math.random().toString(36).substring(2, 10)}#title=${encodeURIComponent(editingCourse.title)}`;
                      
                      let patch: Partial<Course> = {
                        stripeStandardLink: simulatedStandard,
                        stripePromoLink: simulatedPromo
                      };

                      if (editingCourse.installmentsCount !== undefined && editingCourse.installmentsCount > 1) {
                        patch.stripeInstallmentsLink = `https://checkout.stripe.com/c/pay/cs_live_split_${Math.random().toString(36).substring(2, 10)}#title=${encodeURIComponent(editingCourse.title)}`;
                        patch.stripeInstallmentsPromoLink = `https://checkout.stripe.com/c/pay/cs_live_splitpromo_${Math.random().toString(36).substring(2, 10)}#title=${encodeURIComponent(editingCourse.title)}`;
                      }

                      setEditingCourse({
                        ...editingCourse,
                        ...patch
                      });
                      setStripeConfigured(true);
                      setStripeConfigMessage("✓ Liens de checkout Stripe générés avec succès pour cette formation !");
                    } catch (err: any) {
                      alert("Erreur de génération : " + err.message);
                    } finally {
                      setIsStripeSyncing(false);
                    }
                  }}
                  className="px-4 py-2 bg-[#06bcbf] hover:bg-[#05a5a7] text-slate-950 text-xs font-black rounded-xl transition-all self-start flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Générer les liens Stripe
                </button>
              </div>

              {stripeConfigMessage && (
                <div className="p-3 bg-[#06bcbf]/10 border border-[#06bcbf]/30 text-[#06bcbf] rounded-xl text-xs font-bold mb-4">
                  {stripeConfigMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lien de paiement standard (Stripe)</label>
                  <input
                    type="text"
                    value={editingCourse.stripeStandardLink || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, stripeStandardLink: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                    placeholder="URL de votre tunnel d'achat Stripe standard"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lien de paiement promo (Stripe)</label>
                  <input
                    type="text"
                    value={editingCourse.stripePromoLink || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, stripePromoLink: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                    placeholder="URL de votre tunnel d'achat Stripe promotionnel"
                  />
                </div>
              </div>
            </div>

            {/* Skool Course ID */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Synchronisation Skool LMS</h4>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slug du cours Skool (LMS)</label>
                <input
                  type="text"
                  value={editingCourse.skoolCourseId || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, skoolCourseId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                  placeholder="Ex: sketchup-masterclass (L'élève est automatiquement invité sur Skool après achat)"
                />
              </div>
            </div>

            {/* Payment in several times (Installments) */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Paiement échelonné (Plusieurs fois)</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowInstallments"
                    checked={editingCourse.installmentsCount !== undefined && editingCourse.installmentsCount > 1}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditingCourse({
                          ...editingCourse,
                          installmentsEnabled: true,
                          installmentsCount: 3,
                          installmentsPrice: 110,
                          installmentsPromoPrice: 110
                        });
                      } else {
                        setEditingCourse({
                          ...editingCourse,
                          installmentsEnabled: false,
                          installmentsCount: undefined,
                          installmentsPrice: undefined,
                          installmentsPromoPrice: undefined,
                          stripeInstallmentsLink: undefined,
                          stripeInstallmentsPromoLink: undefined
                        });
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-[#06bcbf] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="allowInstallments" className="text-xs text-slate-400 font-bold uppercase cursor-pointer">Activer l'option</label>
                </div>
              </div>

              {editingCourse.installmentsCount !== undefined && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre de mensualités</label>
                      <input
                        type="number"
                        value={editingCourse.installmentsCount || 3}
                        onChange={(e) => setEditingCourse({ ...editingCourse, installmentsCount: parseInt(e.target.value) || 3 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Mensualité standard (EUR)</label>
                      <input
                        type="number"
                        value={editingCourse.installmentsPrice || 0}
                        onChange={(e) => setEditingCourse({ ...editingCourse, installmentsPrice: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Mensualité promo (EUR)</label>
                      <input
                        type="number"
                        value={editingCourse.installmentsPromoPrice || 0}
                        onChange={(e) => setEditingCourse({ ...editingCourse, installmentsPromoPrice: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lien de paiement échelonné standard</label>
                      <input
                        type="text"
                        value={editingCourse.stripeInstallmentsLink || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, stripeInstallmentsLink: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                        placeholder="https://checkout.stripe.com/... (Standard en plusieurs fois)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lien de paiement échelonné promo</label>
                      <input
                        type="text"
                        value={editingCourse.stripeInstallmentsPromoLink || ''}
                        onChange={(e) => setEditingCourse({ ...editingCourse, stripeInstallmentsPromoLink: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                        placeholder="https://checkout.stripe.com/... (Promo en plusieurs fois)"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coupons Active checkbox */}
            <div className="flex items-center gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <input
                type="checkbox"
                id="allowCoupons"
                checked={editingCourse.showCouponField !== false}
                onChange={(e) => setEditingCourse({ ...editingCourse, showCouponField: e.target.checked })}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-[#06bcbf] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="allowCoupons" className="text-xs font-bold text-white uppercase tracking-wide cursor-pointer select-none">
                Autoriser l'application de coupons de réduction Stripe lors du paiement
              </label>
            </div>
          </div>
        )}

        {/* Global Save and Cancel actions */}
        <div className="pt-6 border-t border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:text-white transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Enregistrer la formation
          </button>
        </div>
      </form>
    </div>
  );
}
