import { motion } from 'motion/react';
// @ts-expect-error - Vite handles PNG imports but TypeScript requires declaration file
import izyProjectImg from '../assets/images/hero_visual_welcome_1780947040226.png';
import { 
  Camera, 
  Box, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink, 
  MessageSquare, 
  RotateCw, 
  Share2, 
  Maximize2, 
  ArrowLeft,
  Compass,
  Laptop,
  Check,
  Zap,
  Layers,
  FileSpreadsheet,
  Globe,
  Play
} from 'lucide-react';

interface LogicielsPageProps {
  onGoBack: () => void;
}

export default function LogicielsPage({ onGoBack }: LogicielsPageProps) {
  return (
    <div className="relative overflow-hidden bg-slate-50">
      
      {/* Background radial blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-r from-cyan-300 via-indigo-200 to-amber-200 opacity-20 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] bg-cyan-300/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 -left-40 w-[600px] h-[600px] bg-amber-400/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        
        {/* Back Button */}
        <button 
          onClick={onGoBack}
          className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white rounded-full border border-slate-200 shadow-sm transition-all hover:shadow-md mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20 md:mb-28">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-extrabold mb-6 border border-indigo-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Développé par Les Créateurs 3D
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
            Nos outils pour transformer vos projets SketchUp en <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-indigo-600 to-amber-500">présentations qui marquent</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-semibold">
            En tant que spécialistes SketchUp, nous avons conçu 3 outils complémentaires pour présenter vos projets à vos clients de façon immersive, sans effort.<br />
            <strong className="block text-indigo-600 font-extrabold text-xl md:text-2xl my-2">Un compte = 3 logiciels liés</strong>
            Commençables gratuitement (grâce à nos versions d'accès libre), ils fonctionnent en parfaite synergie et ne nécessitent d'ailleurs qu'un seul et unique abonnement unifié pour les professionnels qui souhaitent exploiter toutes leurs fonctionnalités avancées.
          </p>
        </div>

        {/* ==================== BLOC 1 — IZYPANO ==================== */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-20 md:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-12 items-center">
            
            {/* Column 1: Details */}
            <div className="lg:col-span-6 space-y-8">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-cyan-50 border border-cyan-100 rounded-full text-xs font-black tracking-widest text-[#06bcbf] uppercase">
                  Web App 360°
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Laptop className="w-3.5 h-3.5" /> Extension SketchUp inclu
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none mb-3">
                  IzyPano
                </h2>
                <p className="text-xl font-bold text-[#06bcbf] tracking-tight">
                  Vos visites virtuelles 360°, générées depuis SketchUp en quelques minutes.
                </p>
              </div>

              {/* Problème vs Solution */}
              <div className="space-y-4">
                <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-2xl p-4">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-slate-505 mb-1 text-slate-500">Le problème</p>
                  <p className="text-sm font-medium text-slate-600">
                    Créer une visite virtuelle 360° c'est de loin le meilleur support pour présenter votre projet et le faire comprendre parfaitement.<br />
                    MAIS c'est normalement long, technique et coûteux : logiciels complexes, placement manuel de chaque point de navigation… La plupart des architectes y renoncent, faute de temps.
                  </p>
                </div>

                <div className="bg-cyan-50/50 border-l-4 border-[#06bcbf] rounded-r-2xl p-4">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-[#06bcbf] mb-1">La Solution</p>
                  <p className="text-sm font-semibold text-slate-700">
                    Une extension SketchUp qui transforme votre 3D SketchUp en visite virtuelle 360° complète, navigable et partageable par un simple lien.<br />
                    Le tout en 5 minutes top chrono !<br />
                    L'IA peut même faire els rendus réalistes pour vous dans le logiciel directement.
                  </p>
                </div>
              </div>

              {/* Comment ça marche */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-4">Comment ça marche ?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#06bcbf] font-black text-sm flex items-center justify-center mb-3">
                      1
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Placez des repères dans votre modèle SketchUp
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#06bcbf] font-black text-sm flex items-center justify-center mb-3">
                      2
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Cliquez sur « Exporter » dans le menu
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-[#06bcbf] font-black text-sm flex items-center justify-center mb-3">
                      3
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Votre visite est en ligne, prête à partager
                    </p>
                  </div>
                </div>
              </div>

              {/* Points forts */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-3">Les points forts :</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    "Prête en moins de 5 minutes",
                    "Aucun matériel nécessaire",
                    "Hotspots de navigation & plans automatiques",
                    "Variantes de matériaux/lumières intégrables",
                    "Rendus photoréalistes par IA intégrés — sublimez vos projets et testez les ambiances en un clic",
                    "Partage facile par lien, QR code ou iframe"
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-semibold leading-tight">
                      <span className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#06bcbf] stroke-[3]" />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a 
                  href="https://www.izypano.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-white font-extrabold rounded-full shadow-lg shadow-cyan-500/20 transition-all text-base group"
                >
                  Découvrir IzyPano
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="https://youtu.be/LX8zumByLwI?si=VZxW7tCbp7nDjJUv" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-extrabold rounded-full border border-slate-200 shadow-md transition-all text-base group"
                >
                  <Play className="w-5 h-5 text-red-500 fill-current" />
                  Vidéo de présentation
                </a>
              </div>
            </div>

            {/* Column 2: Simulated browser viewer mockup */}
            <div className="lg:col-span-6 relative">
              {/* Outer decorative back glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-indigo-500 rounded-[2rem] blur-3xl opacity-25" />
              
              <div className="relative border border-slate-200 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Browser top-bar */}
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 w-full max-w-sm truncate">
                    <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>https://pano.izyshare.com/view/f6ddbc0ad8cc4661</span>
                  </div>
                </div>

                {/* Real interactive 360 viewer iframe */}
                <div className="w-full h-[400px] sm:h-[500px] relative overflow-hidden bg-slate-950">
                  <iframe 
                    src="https://pano.izyshare.com/view/f6ddbc0ad8cc4661" 
                    className="w-full h-full border-none"
                    allowFullScreen 
                    allow="gyroscope; accelerometer"
                  />
                </div>
              </div>

              {/* Floating feature detail tag */}
              <div className="absolute -bottom-5 -right-2 bg-[#122851] text-white border border-blue-500/30 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 hidden sm:flex">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-[#06bcbf]">
                  <Sparkles className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyan-300 uppercase leading-none">Visite Réelle</p>
                  <p className="text-xs font-extrabold">Manipulez la 360° en direct</p>
                </div>
              </div>

            </div>

          </div>
        </section>


        {/* ==================== BLOC 2 — IZY3D ==================== */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-12 items-center">
            
            {/* Column 1: Interactive 3D camera viewer iframe (Left on desktop) */}
            <div className="lg:col-span-6 lg:order-1 order-2 relative">
              {/* Outer decorative back glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff6d6b] to-rose-400 rounded-[2rem] blur-3xl opacity-20" />
              
              <div className="relative border border-slate-200 bg-slate-950 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Browser top-bar */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <div className="bg-slate-950/60 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 w-full max-w-sm truncate">
                    <Globe className="w-3.5 h-3.5 text-[#ff6d6b] shrink-0" />
                    <span>https://3d.izyshare.com/view/ecfa8d06-74e5-4564-8fec-f793e3d0fa53</span>
                  </div>
                </div>

                {/* Real Iframe container configured responsively */}
                <div className="w-full h-[320px] sm:h-[420px] relative overflow-hidden bg-slate-900">
                  <iframe 
                    src="https://3d.izyshare.com/view/ecfa8d06-74e5-4564-8fec-f793e3d0fa53" 
                    className="w-full h-full border-none"
                    allow="fullscreen" 
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Floating feature detail tag */}
              <div className="absolute -bottom-5 -left-2 bg-[#1c1917] text-white border border-stone-800 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 hidden sm:flex z-10">
                <div className="w-8 h-8 rounded-lg bg-[#ff6d6b]/10 flex items-center justify-center text-[#ff6d6b]">
                  <Share2 className="w-4 h-4 text-[#ff6d6b]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#ff6d6b] uppercase leading-none">Démo Interactive</p>
                  <p className="text-xs font-extrabold text-white">Manipulez la 3D en direct</p>
                </div>
              </div>

            </div>

            {/* Column 2: Details (Right on desktop) */}
            <div className="lg:col-span-6 lg:order-2 order-1 space-y-8">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-[#ff6d6b]/10 border border-[#ff6d6b]/20 rounded-full text-xs font-black tracking-widest text-[#ff6d6b] uppercase">
                  Web App Interactive 3D
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-505">
                  <Globe className="w-3.5 h-3.5 text-[#ff6d6b]" /> Accessible tout support
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none mb-3">
                  Izy3D
                </h2>
                <p className="text-xl font-bold text-[#ff6d6b] tracking-tight">
                  Partagez vos modèles 3D sous forme de maquette numérique avec vos clients, par un simple lien.
                </p>
              </div>

              {/* Problème vs Solution */}
              <div className="space-y-4">
                <div className="bg-slate-50 border-l-4 border-slate-300 rounded-r-2xl p-4">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-slate-500 mb-1">Le problème</p>
                  <p className="text-sm font-medium text-slate-600">
                    Envoyer un modèle 3D à un client non-technicien, c'est compliqué : fichiers lourds, logiciels à installer, formats incompatibles… et au final le client ne sait pas le manipuler.
                  </p>
                </div>

                <div className="bg-[#ff6d6b]/5 border-l-4 border-[#ff6d6b] rounded-r-2xl p-4">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-[#ff6d6b] mb-1">La Solution</p>
                  <p className="text-sm font-semibold text-slate-700">
                    Transformez vos objets 3D en maquette interactive, accessible directement dans le navigateur — sans aucune installation côté client. Il tourne, zoome, explore librement.
                  </p>
                </div>
              </div>

              {/* Comment ça marche */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-4">Comment ça marche ?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-[#ff6d6b]/10 text-[#ff6d6b] font-black text-sm flex items-center justify-center mb-3">
                      1
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Exportez votre modèle depuis SketchUp
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-[#ff6d6b]/10 text-[#ff6d6b] font-black text-sm flex items-center justify-center mb-3">
                      2
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Importez-le simplement sur Izy3D
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-[#ff6d6b]/10 text-[#ff6d6b] font-black text-sm flex items-center justify-center mb-3">
                      3
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      Partagez le lien de consultation à votre client
                    </p>
                  </div>
                </div>
              </div>

              {/* Points forts */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-3">Les points forts :</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    "Modèle 3D interactif dans un navigateur internet",
                    "Zéro installation requise pour vos clients",
                    "Avis & annotations collaboratifs directement sur la 3D",
                    "Visualisation en réalité augmentée pour placer vos 3D dans l'environnement réel",
                    "Hotspots informatifs pour enrichir le projet",
                    "Idéal pour valider des choix techniques à distance"
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-semibold leading-tight">
                      <span className="w-5 h-5 rounded-full bg-[#ff6d6b]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#ff6d6b] stroke-[3]" />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bouton CTA */}
              <div className="pt-2">
                <a 
                  href="https://3d.izyshare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#ff6d6b] hover:bg-[#e05654] active:scale-95 text-white font-extrabold rounded-full shadow-lg shadow-red-500/20 transition-all text-base group"
                >
                  Découvrir Izy3D
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

          </div>
        </section>


        {/* ==================== BLOC 3 — IZYPROJECT ==================== */}
        <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-8 sm:p-12 items-center">
            
            {/* Column 1: Details */}
            <div className="lg:col-span-6 space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1.5 bg-[#d9b732]/10 border border-[#d9b732]/20 rounded-full text-xs font-black tracking-widest text-[#d9b732] uppercase">
                  Web App Relation Client
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-[#d9b732]" /> Écosystème Unifié
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-none mb-3">
                  IzyProject
                </h2>
                <p className="text-xl font-bold text-[#d9b732] tracking-tight">
                  La page projet qui réunit tout, pour vos clients.
                </p>
                <p className="text-sm text-slate-600 font-semibold mt-2">
                  Le chaînon qui transforme vos visites 360° et vos maquettes 3D en une véritable expérience client.
                </p>
              </div>

              {/* Pitch */}
              <div className="space-y-4">
                <div className="bg-slate-50 border-l-4 border-[#d9b732]/50 rounded-r-2xl p-4">
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    Vous utilisez déjà <strong>IzyPano</strong> pour vos visites virtuelles 360° et <strong>Izy3D</strong> pour vos maquettes interactives. <strong>IzyProject</strong> les rassemble enfin au même endroit : une page de projet unique, élégante et partageable, que votre client consulte d'un seul lien.
                  </p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mt-2.5">
                    <strong>Mais ce n'est pas TOUT !</strong> IzyProject vous permet d'ajouter des plans, des images, des vidéos, des devis, des budgets, des DCE, des PC...
                  </p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mt-2.5">
                    Vous pouvez proposer des choix de matériaux, des comparateurs d'images et des validations au client.
                  </p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mt-2.5">
                    Une messagerie privée y est intégrée pour permettre une communication simple avec vos clients.
                  </p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed mt-2.5">
                    Tout le projet est présenté sur une seule page, ergonomique, organisée du début à la fin du projet.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">🚧</span>
                  <p className="text-xs sm:text-sm font-semibold text-amber-800 leading-relaxed">
                    <strong>IzyProject</strong> est actuellement en développement actif. Disponible prochainement pour les utilisateurs de l'écosystème.
                  </p>
                </div>
              </div>

              {/* L'argument écosystème */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider mb-3">L'argument écosystème (Transversal)</h4>
                <ul className="space-y-2.5">
                  <li className="text-sm text-slate-600 font-semibold leading-snug flex items-start gap-2">
                    <span className="text-[#d9b732] mt-0.5">•</span>
                    <span><strong>Une seule connexion pour les trois apps</strong> : vos visites IzyPano et vos modèles Izy3D sont détectés automatiquement dans IzyProject — rien à réimporter.</span>
                  </li>
                </ul>
              </div>

              {/* Comment ça marche / Les bénéfices clés */}
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg mb-3">Les bénéfices clés :</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    "Un seul lien à envoyer au client — fini les pièces jointes éparpillées",
                    "L'évolution du projet et les décisions sont traçables — historique clair à chaque étape",
                    "Messagerie intégrée — tous les échanges centralisés, plus de mails perdus",
                    "Page à votre nom — votre cabinet en avant, expérience premium"
                  ].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-semibold leading-tight">
                      <span className="w-5 h-5 rounded-full bg-[#d9b732]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-[#d9b732] stroke-[3]" />
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phrase de clôture */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-base font-extrabold text-[#d9b732] italic">
                  « IzyPano immerge, Izy3D montre les détails, IzyProject fait avancer le projet. »
                </p>
              </div>
            </div>

            {/* Column 2: Simulated browser viewer mockup with screenshot (Right on desktop) */}
            <div className="lg:col-span-6 relative">
              {/* Outer decorative back glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#d9b732] to-[#e0c860] rounded-[2rem] blur-3xl opacity-25" />
              
              <div className="relative border border-slate-200 bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Browser top-bar */}
                <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex items-center gap-1.5 w-full max-w-sm truncate">
                    <Globe className="w-3.5 h-3.5 text-[#d9b732] shrink-0" />
                    <span>https://project.izyshare.com/view/votre-projet-client</span>
                  </div>
                </div>

                {/* Real Image container configured responsively */}
                <div className="w-full relative overflow-hidden bg-slate-950 p-2 sm:p-4">
                  <img 
                    src={izyProjectImg} 
                    alt="IzyProject client page interface mockup"
                    className="w-full h-auto object-cover rounded-xl border border-slate-800 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Floating feature detail tag */}
              <div className="absolute -bottom-5 -right-2 bg-slate-900 text-white border border-slate-700 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 hidden sm:flex">
                <div className="w-8 h-8 rounded-lg bg-[#d9b732]/10 flex items-center justify-center text-[#d9b732]">
                  <Sparkles className="w-4 h-4 text-[#d9b732] animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#e0c860] uppercase leading-none">Aperçu</p>
                  <p className="text-xs font-extrabold text-white">Espace de travail client</p>
                </div>
              </div>
            </div>

          </div>
        </section>


        {/* ==================== SECTION DE CLÔTURE (bas de page) ==================== */}
        <section className="mt-20 md:mt-28">
          <div className="relative overflow-hidden bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-14 text-center border-4 border-[#d9b732] shadow-2xl">
            {/* Inner background decorative glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/30 via-slate-900 to-rose-900/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff6d6b]/15 rounded-full blur-[100px]" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-2xl mx-auto">
                <Zap className="w-10 h-10 text-[#e0c860]" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
                Trois outils pensés pour les pros de la conception qui veulent communiquer leurs projets avec impact — sans complexité technique.
              </h2>
              
              <p className="text-slate-300 font-medium text-base md:text-lg max-w-xl mx-auto">
                Connectez-vous dès aujourd'hui et divisez par dix le temps passé à expliquer vos choix de conception à vos clients.
              </p>


            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
