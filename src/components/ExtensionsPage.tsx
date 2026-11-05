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
  Film,
} from 'lucide-react';
import { FALLBACK_PRICES, PAYMENT_AVAILABLE, formatPrice, openCheckout, usePackPrices, type PackKey } from '../lib/paddle';

interface ExtensionsPageProps {
  onGoBack: () => void;
}

const SUITES: {
  id: string;
  key: PackKey;
  name: string;
  tagline: string;
  icon: typeof Settings;
  colorHex: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  tools: string[];
  description: string;
}[] = [
  {
    id: 'configurateurs',
    key: 'configurators',
    name: 'Suite Configurateurs',
    tagline: 'Générez des fenêtres, escaliers et mobilier paramétrique en quelques clics.',
    icon: Settings,
    colorHex: '#4f46e5',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    textColor: 'text-indigo-700',
    tools: ['Configurateur de fenêtres', "Configurateur d'escaliers", 'Configurateur de mobilier'],
    description: 'Créez des éléments paramétriques précis directement dans SketchUp, sans modélisation manuelle fastidieuse.',
  },
  {
    id: 'modelisateurs',
    key: 'modeling',
    name: 'Suite Modélisateurs',
    tagline: 'Arrondis, moulures, loft et push/pull sur formes complexes.',
    icon: Package,
    colorHex: '#06bcbf',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
    textColor: 'text-[#06bcbf]',
    tools: ['Arrondir les angles', 'Moulures et profils', 'Loft entre sections', 'Push/pull sur courbe'],
    description: 'Des outils de modélisation avancée qui comblent les lacunes natives de SketchUp pour les formes complexes.',
  },
  {
    id: 'media',
    key: 'media',
    name: 'Suite Media',
    tagline: 'Vidéos caméra fluides et planches PDF pour présenter vos projets.',
    icon: Film,
    colorHex: '#e11d48',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-100',
    textColor: 'text-rose-600',
    tools: ['Vidéos caméra fluides', 'Planches PDF'],
    description: 'Passez de votre maquette SketchUp à une vidéo animée et à des planches PDF prêtes à envoyer au client.',
  },
  {
    id: 'control',
    key: 'control',
    name: 'Suite Control',
    tagline: 'Gizmo de déplacement, placement précis et textures sur surfaces courbes.',
    icon: Move,
    colorHex: '#f59e0b',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-100',
    textColor: 'text-amber-600',
    tools: ["Gizmo de déplacement et d'animation (IzyMove)", 'Gizmo UV et textures sur courbes (IzyUV)'],
    description: 'Manipulez, positionnez et animez vos objets, puis habillez-les de textures, avec une précision et une fluidité inégalées.',
  },
];

export default function ExtensionsPage({ onGoBack }: ExtensionsPageProps) {
  const { amounts, currency } = usePackPrices();
  // Prix de Paddle (devise et TVA du visiteur) ; valeurs de secours en euros si Paddle ne répond pas.
  const priceOf = (key: PackKey) => formatPrice(amounts[key] ?? FALLBACK_PRICES[key], amounts[key] === undefined ? 'EUR' : currency);
  const separate = SUITES.reduce((sum, suite) => sum + (amounts[suite.key] ?? FALLBACK_PRICES[suite.key]), 0);
  const suiteAmount = amounts.suite ?? FALLBACK_PRICES.suite;
  const buy = (key: PackKey) => {
    if (!PAYMENT_AVAILABLE) {
      alert('Le paiement ouvre très bientôt. Écrivez-nous à dautelle.sylvain@gmail.com pour être prévenu(e) dès le lancement.');
      return;
    }
    openCheckout(key).catch(() => alert('Le paiement est momentanément indisponible. Réessayez dans un instant ou contactez-nous.'));
  };
  const savedPercent = Math.round((1 - suiteAmount / separate) * 100);

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
          <div className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 to-[#204289] px-8 py-5 mb-8 shadow-xl">
            <img src="/izystudio-logo.png" alt="IzyStudio" className="h-12 sm:h-16 w-auto" />
          </div>
          <br />
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
              Achat unique — accès à vie. Pas d'abonnement.
            </strong>
            Contrairement à la plupart des éditeurs, vous payez une fois et l'outil est à vous pour toujours.
            Des vidéos de démonstration détaillées vous permettent de voir exactement ce que vous achetez avant de vous décider.
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
                        {priceOf(suite.key)}
                        <span className="text-sm font-bold text-slate-400 ml-1">une fois</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">
                        Accès à vie — regardez les vidéos de démo avant d'acheter
                      </p>
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                        style={{ backgroundColor: suite.colorHex }}
                        onClick={() => buy(suite.key)}
                      >
                        Acquérir la suite
                        <ArrowRight className="w-4 h-4" />
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
            Les 4 suites — <span className="text-white font-extrabold">{priceOf('suite')} une fois</span>
            {savedPercent > 0 && (
              <span className="block text-base text-blue-200 mt-1">
                au lieu de <span className="line-through">{formatPrice(separate, amounts.suite === undefined ? 'EUR' : currency)}</span> pris séparément (−{savedPercent} %)
              </span>
            )}
          </p>
          <p className="text-blue-200 font-medium mb-8 max-w-xl mx-auto">
            Toutes les extensions actuelles. Un seul achat, à vie. Zéro abonnement.
          </p>
          <button
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-indigo-700 bg-white rounded-full hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            onClick={() => buy('suite')}
          >
            Obtenir le pack complet
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.section>

        {/* Paiement et conditions */}
        <p className="text-center text-sm text-slate-500 font-semibold mb-10">
          Paiement sécurisé par Lemon Squeezy, revendeur officiel — TVA incluse. Remboursement sous 14 jours.{' '}
          <a href="/cgv" className="text-indigo-600 underline">Conditions de vente</a> ·{' '}
          <a href="/remboursement" className="text-indigo-600 underline">Remboursement</a> ·{' '}
          <a href="/confidentialite" className="text-indigo-600 underline">Confidentialité</a>
        </p>

        {/* Garanties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: ShieldCheck,
              title: 'Licence à vie',
              desc: 'Vous payez une fois, l\'outil est à vous pour toujours. Aucun abonnement, aucun renouvellement.',
            },
            {
              icon: RefreshCw,
              title: 'Mises à jour incluses',
              desc: 'Les corrections et améliorations des outils que vous possédez s\'appliquent automatiquement.',
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
