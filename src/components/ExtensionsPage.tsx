import { motion } from 'motion/react';
import {
  ArrowLeft,
  Puzzle,
  Zap,
  Package,
  Settings,
  Move,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ExtensionsPageProps {
  onGoBack: () => void;
}

const SUITES = [
  {
    id: 'configurateurs',
    name: 'Suite Configurateurs',
    tagline: 'Générez des fenêtres, escaliers et mobilier paramétrique en quelques clics.',
    icon: Settings,
    color: 'indigo',
    colorHex: '#4f46e5',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    textColor: 'text-indigo-700',
    tools: ['Configurateur de fenêtres', 'Configurateur d\'escaliers', 'Configurateur de mobilier'],
    price: '49',
    description: 'Créez des éléments paramétriques précis directement dans SketchUp, sans modélisation manuelle fastidieuse.',
  },
  {
    id: 'modelisateurs',
    name: 'Suite Modélisateurs',
    tagline: 'Arrondis, moulures, loft et push/pull sur formes complexes.',
    icon: Package,
    color: 'cyan',
    colorHex: '#06bcbf',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
    textColor: 'text-[#06bcbf]',
    tools: ['Arrondir les angles', 'Moulures et profils', 'Loft entre sections', 'Push/pull sur courbe'],
    price: '49',
    description: 'Des outils de modélisation avancée qui comblent les lacunes natives de SketchUp pour les formes complexes.',
  },
  {
    id: 'manipulateurs',
    name: 'Suite Manipulateurs',
    tagline: 'Gizmo de déplacement, placement précis et création de vidéo.',
    icon: Move,
    color: 'amber',
    colorHex: '#f59e0b',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-100',
    textColor: 'text-amber-600',
    tools: ['Gizmo de déplacement', 'Placement facilité', 'Création de vidéo'],
    price: '49',
    description: 'Manipulez, positionnez et animez vos objets avec une précision et une fluidité inégalées.',
  },
];

export default function ExtensionsPage({ onGoBack }: ExtensionsPageProps) {
  return (
    <div className="relative overflow-hidden bg-slate-50">

      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-amber-300 via-indigo-200 to-cyan-200 opacity-20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-amber-400/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">

        {/* Back Button */}
        <button
          onClick={onGoBack}
          className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white rounded-full border border-slate-200 shadow-sm transition-all hover:shadow-md mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-20 md:mb-28"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-extrabold mb-6 border border-amber-100 shadow-sm">
            <Puzzle className="w-4 h-4" />
            Extensions SketchUp — Les Créateurs 3D
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Des outils SketchUp qui{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-indigo-600 to-cyan-500">
              décuplent votre productivité
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-semibold">
            Regroupées en suites par usage, nos extensions s'installent en une seule fois.<br />
            <strong className="block text-indigo-600 font-extrabold text-xl md:text-2xl my-2">
              Une extension installée = toutes vos suites accessibles
            </strong>
            Achetez une suite ou plusieurs — les nouvelles fonctionnalités de vos suites possédées
            s'activent automatiquement à chaque mise à jour.
          </p>
        </motion.div>

        {/* Suites */}
        <div className="space-y-12 mb-24">
          {SUITES.map((suite, idx) => {
            const Icon = suite.icon;
            return (
              <motion.section
                key={suite.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-12 items-center">

                  {/* Infos */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 ${suite.bgLight} ${suite.borderColor} border rounded-full text-xs font-black tracking-widest ${suite.textColor} uppercase`}>
                        Suite d'extensions
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: suite.colorHex + '18' }}>
                          <Icon className="w-6 h-6" style={{ color: suite.colorHex }} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                          {suite.name}
                        </h2>
                      </div>
                      <p className="text-lg font-bold" style={{ color: suite.colorHex }}>
                        {suite.tagline}
                      </p>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {suite.description}
                    </p>
                    <ul className="space-y-2">
                      {suite.tools.map((tool) => (
                        <li key={tool} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: suite.colorHex }} />
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Achat */}
                  <div className="lg:col-span-5">
                    <div className={`${suite.bgLight} ${suite.borderColor} border rounded-2xl p-8 text-center space-y-4`}>
                      <div className="text-4xl font-black text-slate-900">
                        {suite.price} €
                        <span className="text-sm font-bold text-slate-400 ml-1">/ an</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        Mises à jour et nouveaux outils inclus pendant 1 an
                      </p>
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                        style={{ backgroundColor: suite.colorHex }}
                        onClick={() => alert('Paiement bientôt disponible — contactez-nous pour accéder en avant-première.')}
                      >
                        Acquérir la suite
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-600 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
                        onClick={() => alert('Essai gratuit 14 jours — bientôt disponible.')}
                      >
                        Essai gratuit 14 jours
                      </button>
                    </div>
                  </div>

                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Bloc pack tout inclus */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-indigo-600 to-[#204289] rounded-[2.5rem] p-8 sm:p-12 text-white text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-extrabold mb-6 border border-white/20">
            <Star className="w-4 h-4 text-amber-400" />
            Meilleure valeur
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pack Toutes Suites</h2>
          <p className="text-xl text-blue-100 font-semibold mb-2">
            Les 3 suites pour le prix de 2 — <span className="text-white font-extrabold">99 € / an</span>
          </p>
          <p className="text-blue-200 font-medium mb-8 max-w-xl mx-auto">
            Toutes les extensions actuelles et futures. Un seul achat, un seul renouvellement.
          </p>
          <button
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-indigo-700 bg-white rounded-full hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            onClick={() => alert('Pack bientôt disponible — contactez-nous pour accéder en avant-première.')}
          >
            Obtenir le pack complet
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.section>

        {/* Garanties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: ShieldCheck,
              title: 'Licence sécurisée',
              desc: 'Activation par clé liée à votre machine. Renouvellement optionnel après 1 an.',
            },
            {
              icon: RefreshCw,
              title: 'Mises à jour automatiques',
              desc: 'Les nouveaux outils d\'une suite que vous possédez s\'activent sans rien faire.',
            },
            {
              icon: Zap,
              title: 'Installation unique',
              desc: 'Une seule extension .rbz à installer. Toutes vos suites sont à l\'intérieur.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4">
                <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
