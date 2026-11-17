import { motion } from 'motion/react';
import {
  ArrowLeft,
  Puzzle,
  Package,
  Settings,
  Move,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
  KeyRound,
  Download,
  Film,
} from 'lucide-react';
import { FR_VAT, PAYMENT_AVAILABLE, PRICES_HT, buyUrl, formatPrice, type PackKey } from '../lib/payments';

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
    name: 'IzyStudio Configurators',
    tagline: 'Fenêtres, portes, escaliers, dressings, cuisines : générez-les en quelques clics.',
    icon: Settings,
    colorHex: '#4f46e5',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    textColor: 'text-indigo-700',
    tools: ['Fenêtres et portes paramétriques', 'Escaliers paramétriques', 'Dressings, cuisines et meubles sur mesure (IzyModul)'],
    description: 'Créez des éléments paramétriques précis directement dans SketchUp : menuiseries, escaliers, dressings, cuisines et meubles, sans modélisation manuelle fastidieuse.',
  },
  {
    id: 'modelisateurs',
    key: 'modeling',
    name: 'IzyStudio Modeling',
    tagline: 'Murs, sols, moulures, arrondis, loft et déformations : modélisez ce que SketchUp rend difficile.',
    icon: Package,
    colorHex: '#e11d48',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-100',
    textColor: 'text-rose-600',
    tools: [
      'Murs et sols dessinés en direct',
      'Moulures et cimaises à tracer avec leur profil',
      'Arrondis, chanfreins et profils',
      'Loft entre sections',
      'Pliage, courbure et déformation FFD',
      'Push/pull sur surface courbe',
      'Treillis et édition de sommets',
    ],
    description: 'Des outils de modélisation avancée qui comblent les lacunes natives de SketchUp : de l\'architecture (murs, sols, moulures) aux formes complexes (arrondis, loft, déformations).',
  },
  {
    id: 'media',
    key: 'media',
    name: 'IzyStudio Media',
    tagline: 'Vidéos caméra fluides et planches PDF pour présenter vos projets.',
    icon: Film,
    colorHex: '#06bcbf',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-100',
    textColor: 'text-[#06bcbf]',
    tools: ['Vidéos caméra fluides', 'Planches PDF'],
    description: 'Passez de votre maquette SketchUp à une vidéo animée et à des planches PDF prêtes à envoyer au client.',
  },
  {
    id: 'control',
    key: 'control',
    name: 'IzyStudio Control',
    tagline: 'Déplacez, placez et animez vos objets — avec des parentés — puis texturez les surfaces courbes.',
    icon: Move,
    colorHex: '#f59e0b',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-100',
    textColor: 'text-amber-600',
    tools: [
      "Gizmo de déplacement et d'animation (IzyMove)",
      'Animations de déplacement avec liens de parenté',
      'Gizmo UV et textures sur courbes (IzyUV)',
    ],
    description: 'Manipulez, positionnez et animez vos objets, y compris avec des liens de parenté entre eux, puis habillez-les de textures, avec une précision et une fluidité inégalées.',
  },
];

export default function ExtensionsPage({ onGoBack }: ExtensionsPageProps) {
  // Prix hors taxes ; la TVA du pays de l'acheteur est ajoutée sur la page de paiement Stripe.
  const priceOf = (key: PackKey) => formatPrice(PRICES_HT[key]);
  const priceFr = (key: PackKey) => formatPrice(Math.round(PRICES_HT[key] * (1 + FR_VAT) * 100) / 100);
  const separate = SUITES.reduce((sum, suite) => sum + PRICES_HT[suite.key], 0);
  const suiteAmount = PRICES_HT.suite;
  const buy = (key: PackKey) => {
    if (!PAYMENT_AVAILABLE) {
      alert('Le paiement ouvre très bientôt. Écrivez-nous à dautelle.sylvain@gmail.com pour être prévenu(e) dès le lancement.');
      return;
    }
    window.location.href = buyUrl(key);
  };
  const savedPercent = Math.round((1 - suiteAmount / separate) * 100);
  const goToSuite = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
          className="text-center max-w-4xl mx-auto mb-12 md:mb-16"
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
            Quatre barres d'outils pour SketchUp, à acheter séparément ou réunies dans IzyStudio Complet.<br />
            <strong className="block text-indigo-600 font-extrabold text-xl md:text-2xl my-2">
              Achat unique — licence à vie. Pas d'abonnement.
            </strong>
            Contrairement à la plupart des éditeurs, vous payez une fois et la version achetée est à vous pour toujours.
            Des vidéos de démonstration détaillées vous permettent de voir exactement ce que vous achetez avant de vous décider.
          </p>
        </motion.div>

        {/* Pack complet, mis en avant */}
        <motion.section
          id="pack"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-[#1e2a6b] to-[#204289] text-white shadow-2xl"
        >
          {/* Les couleurs des 4 barres d'outils */}
          <div className="flex h-2">
            {SUITES.map((suite) => (
              <div key={suite.id} className="flex-1" style={{ backgroundColor: suite.colorHex }} />
            ))}
          </div>

          <div className="grid grid-cols-1 items-center gap-10 p-8 sm:p-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold">
                  <Star className="h-4 w-4 text-amber-400" />
                  Meilleure valeur
                </span>
                {savedPercent > 0 && (
                  <span className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-black text-slate-900">−{savedPercent} %</span>
                )}
              </div>
              <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">IzyStudio Complet</h2>
              <p className="max-w-xl text-lg font-semibold text-blue-100">
                Les 4 barres d'outils IzyStudio en un seul achat : tout ce qu'il faut pour configurer, modéliser, présenter et piloter vos projets dans SketchUp.
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SUITES.map((suite) => {
                  const Icon = suite.icon;
                  return (
                    <li key={suite.id}>
                      <button
                        type="button"
                        onClick={() => goToSuite(suite.id)}
                        className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
                      >
                        <span className="shrink-0 rounded-xl p-2" style={{ backgroundColor: suite.colorHex }}>
                          <Icon className="h-5 w-5 text-white" />
                        </span>
                        <span>
                          <span className="block font-extrabold">{suite.name}</span>
                          <span className="block text-xs font-medium text-blue-200">{suite.tools.slice(0, 3).join(' · ')}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-4 rounded-3xl bg-white p-8 text-center text-slate-900 shadow-xl">
                <p className="text-sm font-bold text-slate-400">
                  <span className="line-through">{formatPrice(separate)} HT</span> pris séparément
                </p>
                <div className="text-5xl font-black sm:text-6xl">
                  {priceOf('suite')}
                  <span className="ml-1 text-base font-bold text-slate-400">HT, une fois</span>
                </div>
                <p className="-mt-2 text-xs font-medium text-slate-400">
                  Soit {priceFr('suite')} TTC en France · TVA de votre pays ajoutée au paiement
                </p>
                <button
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-[#204289] px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.03] active:scale-95"
                  onClick={() => buy('suite')}
                >
                  Obtenir le pack complet
                  <ArrowRight className="h-5 w-5" />
                </button>
                <ul className="space-y-2 pt-2 text-left text-sm font-semibold text-slate-600">
                  {[
                    'Licence à vie, sans abonnement',
                    'Une seule clé, sur 2 ordinateurs',
                    'Remboursement sous 14 jours',
                    'Vidéos de démonstration avant achat',
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Ou une barre d'outils à l'unité */}
        <div className="mb-20">
          <p className="mb-4 text-center text-sm font-extrabold uppercase tracking-widest text-slate-400">Ou choisissez une barre d'outils à l'unité</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {SUITES.map((suite) => {
              const Icon = suite.icon;
              return (
                <button
                  key={suite.id}
                  type="button"
                  onClick={() => goToSuite(suite.id)}
                  className="cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: suite.colorHex + '18' }}>
                    <Icon className="h-5 w-5" style={{ color: suite.colorHex }} />
                  </span>
                  <span className="block text-sm font-extrabold text-slate-900">{suite.name}</span>
                  <span className="block text-lg font-black" style={{ color: suite.colorHex }}>
                    {priceOf(suite.key)} <span className="text-xs font-bold text-slate-400">HT</span>
                  </span>
                  <span className="mt-1 block text-xs font-bold text-slate-400">Voir le détail ↓</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suites */}
        <div className="space-y-12 mb-24">
          {SUITES.map((suite, idx) => {
            const Icon = suite.icon;
            return (
              <motion.section
                key={suite.id}
                id={suite.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden scroll-mt-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-12 items-center">

                  {/* Infos */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 ${suite.bgLight} ${suite.borderColor} border rounded-full text-xs font-black tracking-widest ${suite.textColor} uppercase`}>
                        Barre d'outils
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
                        <span className="text-sm font-bold text-slate-400 ml-1">HT, une fois</span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium -mt-2">
                        Soit {priceFr(suite.key)} TTC en France · TVA de votre pays ajoutée au paiement
                      </p>
                      <p className="text-sm text-slate-500 font-medium">
                        Accès à vie — regardez les vidéos de démo avant d'acheter
                      </p>
                      <button
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                        style={{ backgroundColor: suite.colorHex }}
                        onClick={() => buy(suite.key)}
                      >
                        Acquérir cette barre d'outils
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.section>
            );
          })}
        </div>

        {/* Rappel du pack */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16 flex flex-col items-center justify-between gap-6 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-[#204289] p-8 text-center text-white sm:flex-row sm:text-left"
        >
          <div>
            <p className="text-2xl font-extrabold">IzyStudio Complet — {priceOf('suite')} HT</p>
            <p className="font-medium text-blue-200">
              Les 4 barres d'outils, une seule clé de licence{savedPercent > 0 ? `, −${savedPercent} % par rapport à l'achat séparé` : ''}.
            </p>
          </div>
          <button
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg transition-all hover:scale-105 hover:bg-blue-50 active:scale-95"
            onClick={() => buy('suite')}
          >
            Obtenir le pack complet
            <ArrowRight className="h-5 w-5" />
          </button>
        </motion.section>

        {/* Paiement et conditions */}
        <p className="text-center text-sm text-slate-500 font-semibold mb-10">
          Paiement sécurisé par Stripe (« Vendu via Link »), revendeur officiel — prix hors taxes, TVA de votre pays ajoutée au paiement. Remboursement sous 14 jours. Mises à jour offertes pendant 2 mois après l'achat.{' '}
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
              desc: 'Vous payez une fois, la version achetée est à vous pour toujours. Aucun abonnement, aucun renouvellement.',
            },
            {
              icon: KeyRound,
              title: 'Une clé, 2 ordinateurs',
              desc: 'Une seule clé de licence pour toutes vos barres d\'outils, à activer sur 2 ordinateurs.',
            },
            {
              icon: Download,
              title: 'Installation guidée',
              desc: 'Un fichier .rbz par barre d\'outils, à installer depuis le Gestionnaire d\'extensions de SketchUp. Vos liens de téléchargement arrivent par e-mail.',
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
