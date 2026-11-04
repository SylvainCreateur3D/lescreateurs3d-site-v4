import { motion, useInView } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import LogicielsPage from './components/LogicielsPage';
import ExtensionsPage from './components/ExtensionsPage';
import LegalPage, { type LegalKind } from './components/LegalPage';
import FormationsCatalogPage from './components/FormationsCatalogPage';
import AdminStatsPage from './components/AdminStatsPage';
import { trackPageView, trackEvent } from './lib/analytics';
import {
  ArrowRight,
  Youtube,
  Users,
  Target,
  Sparkles,
  MessageCircle,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  MonitorPlay,
  Instagram,
  Shapes,
  GraduationCap,
  TrendingUp,
  Award,
  Zap,
  Menu,
  X
} from 'lucide-react';

function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easeOutExpo = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(end * easeOutExpo));
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function App() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'logiciels' | 'formations' | 'admin' | 'extensions' | LegalKind>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track page views on page changes
  useEffect(() => {
    if (currentPage !== 'admin') {
      trackPageView(currentPage);
    }
  }, [currentPage]);

  // Dynamic Elfsight visibility control
  useEffect(() => {
    let intervalId: any;
    let observer: MutationObserver | null = null;
    let styleEl: HTMLStyleElement | null = null;

    const selectors = [
      '.elfsight-app-8e7e055c-5f4b-48e0-a9c8-55099bb7e86a',
      '[class*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"]',
      '[id*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"]'
    ];

    const applyHiding = () => {
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl && htmlEl.style.display !== 'none') {
              htmlEl.style.setProperty('display', 'none', 'important');
              htmlEl.style.setProperty('opacity', '0', 'important');
              htmlEl.style.setProperty('visibility', 'hidden', 'important');
              htmlEl.style.setProperty('pointer-events', 'none', 'important');
            }
          });
        } catch (e) {
          // ignore
        }
      });
    };

    const restoreVisibility = () => {
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl) {
              htmlEl.style.removeProperty('display');
              htmlEl.style.removeProperty('opacity');
              htmlEl.style.removeProperty('visibility');
              htmlEl.style.removeProperty('pointer-events');
            }
          });
        } catch (e) {
          // ignore
        }
      });
    };

    if (currentPage === 'formations') {
      // 1. Inject aggressive CSS to head (only targeting chatbot)
      styleEl = document.createElement('style');
      styleEl.id = 'app-hide-elfsight-style';
      styleEl.innerHTML = `
        .elfsight-app-8e7e055c-5f4b-48e0-a9c8-55099bb7e86a,
        [class*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"],
        [id*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          max-width: 0 !important;
          max-height: 0 !important;
          transform: scale(0) !important;
        }
      `;
      document.head.appendChild(styleEl);

      // 2. Continuous enforcement via interval (catches dynamic additions)
      intervalId = setInterval(applyHiding, 200);

      // 3. High-performance observer for DOM changes
      observer = new MutationObserver(() => {
        applyHiding();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Apply immediately
      applyHiding();
    } else {
      // Restore standard visibility when not on formations page
      restoreVisibility();
      const existingStyle = document.getElementById('app-hide-elfsight-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (observer) observer.disconnect();
      const existingStyle = document.getElementById('app-hide-elfsight-style');
      if (existingStyle) {
        existingStyle.remove();
      }
      restoreVisibility();
    };
  }, [currentPage]);

  useEffect(() => {
    const LEGAL_PATHS: Record<string, LegalKind> = {
      '/mentions-legales': 'mentions',
      '/cgv': 'cgv',
      '/remboursement': 'remboursement',
      '/confidentialite': 'confidentialite',
    };
    const handleHashChange = () => {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/extensions') {
        setCurrentPage('extensions');
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      const legal = LEGAL_PATHS[path];
      if (legal) {
        setCurrentPage(legal);
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }
      if (window.location.hash === '#logiciels') {
        setCurrentPage('logiciels');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#extensions') {
        setCurrentPage('extensions');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash.startsWith('#formations-catalog')) {
        setCurrentPage('formations');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#admin') {
        setCurrentPage('admin');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#mentions-legales') {
        setCurrentPage('mentions');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#cgv') {
        setCurrentPage('cgv');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#remboursement') {
        setCurrentPage('remboursement');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (window.location.hash === '#confidentialite') {
        setCurrentPage('confidentialite');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        setCurrentPage('home');
        if (window.location.hash && window.location.hash !== '#') {
          const id = window.location.hash.replace('#', '');
          const element = document.getElementById(id);
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      }
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: 'home' | 'logiciels' | 'formations' | 'admin' | 'extensions', hash?: string) => {
    setMobileMenuOpen(false);
    // Depuis une page légale (/cgv…) : on revient à la racine du site avant de changer de page.
    const leavingPath = window.location.pathname !== '/';
    if (leavingPath) window.history.replaceState(null, '', '/' + window.location.search);
    if (page === 'logiciels') {
      window.location.hash = '#logiciels';
    } else if (page === 'extensions') {
      window.location.hash = '#extensions';
    } else if (page === 'formations') {
      window.location.hash = '#formations-catalog';
    } else if (page === 'admin') {
      window.location.hash = '#admin';
    } else {
      if (hash) {
        window.location.hash = hash;
        if (currentPage === 'home') {
          const element = document.getElementById(hash.replace('#', ''));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else {
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    if (leavingPath) window.dispatchEvent(new Event('hashchange'));
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60px 0px',
      threshold: 0.02,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [currentPage]);


  return (
    <div className="font-sans antialiased text-slate-900 min-h-screen selection:bg-blue-200 flex flex-col">
      
      {/* Header */}
      {currentPage !== 'admin' && (
        <header className="sticky top-0 z-50 bg-[#204289] text-white backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div onClick={() => navigateTo('home')} className="flex items-center gap-2 cursor-pointer group">
              <img 
                src="/logo seul PNG.png" 
                alt="Les Créateurs 3D Logo" 
                className="w-10 h-10 group-hover:scale-105 transition-transform object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-extrabold tracking-tight">Les Créateurs 3D</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigateTo('home', '#accompagnements')} className={`text-sm font-bold cursor-pointer transition-all ${currentPage === 'home' ? 'text-white hover:text-blue-200' : 'text-blue-100 hover:text-white'}`}>Nos accompagnements & formations</button>
              <button onClick={() => navigateTo('formations')} className={`text-sm font-black cursor-pointer transition-all px-3 py-1 rounded-full ${currentPage === 'formations' ? 'bg-[#06bcbf] text-white ring-2 ring-white/10 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}>Formations e-learning</button>
              <button onClick={() => navigateTo('logiciels')} className={`text-sm font-black cursor-pointer transition-all px-3 py-1 rounded-full ${currentPage === 'logiciels' ? 'bg-[#06bcbf] text-white ring-2 ring-white/10 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}>Nos logiciels</button>
              <button onClick={() => navigateTo('extensions')} className={`text-sm font-black cursor-pointer transition-all px-3 py-1 rounded-full ${currentPage === 'extensions' ? 'bg-amber-500 text-white ring-2 ring-white/10 shadow-md' : 'text-blue-100 hover:text-white hover:bg-white/5'}`}>Extensions SketchUp</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  trackEvent('calendly_click', currentPage);
                  (window as any).Calendly?.initPopupWidget({url: 'https://calendly.com/lescreateurs3d/appel-telephonique-formation'});
                }}
                className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-slate-900 bg-white rounded-full hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
              >
                Parlons de votre projet
              </button>
              <button 
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#204289] border-t border-white/10 px-6 py-6 pb-8 space-y-4 absolute top-20 left-0 w-full z-50 shadow-2xl animate-fade-in">
              <button 
                onClick={() => navigateTo('home', '#accompagnements')} 
                className="block text-left w-full text-base font-extrabold text-white hover:text-blue-200 py-1"
              >
                Nos accompagnements & formations
              </button>
              <button 
                onClick={() => navigateTo('formations')} 
                className="block text-left w-full text-lg font-black text-[#06bcbf] hover:text-cyan-300 py-2 border-t border-white/10"
              >
                Formations e-learning
              </button>
              <button
                onClick={() => navigateTo('logiciels')}
                className="block text-left w-full text-lg font-black text-white hover:text-blue-200 py-2 border-t border-white/10"
              >
                Nos logiciels
              </button>
              <button
                onClick={() => navigateTo('extensions')}
                className="block text-left w-full text-lg font-black text-amber-300 hover:text-amber-200 py-2 border-t border-white/10"
              >
                Extensions SketchUp
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  trackEvent('calendly_click', currentPage);
                  (window as any).Calendly?.initPopupWidget({url: 'https://calendly.com/lescreateurs3d/appel-telephonique-formation'});
                }}
                className="w-full text-center block mt-6 px-6 py-3.5 text-sm font-bold text-slate-900 bg-white rounded-full hover:bg-blue-50 transition-all shadow-md"
              >
                Parlons de votre projet
              </button>
            </div>
          )}
        </header>
      )}

      <main className="flex-grow">
        {currentPage === 'home' && (
          <>
            {/* Dynamic Colorful Hero */}
            <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
          {/* Abstract background blur accents */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-400 via-violet-400 to-orange-300 opacity-20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-yellow-300/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-6 z-10 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column (Content) */}
              <div className="lg:col-span-7 text-left flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8 border border-blue-100 shadow-sm w-fit">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Formations en 3D, rendu et IA <span className="sr-only">pour architectes et concepteurs</span>
                  </span>
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.05]"
                >
                  Apprenez la 3D et l'IA, <br className="hidden md:inline" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500">le futur de la visualisation</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium mb-10"
                >
                  De l'architecture intérieure au paysagisme, en passant par l'agencement et l'immobilier : apprenez à maîtriser la 3D et l'IA avec un workflow clair pour transformer vos idées en évidences visuelles.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center gap-4"
                >
                  <a href="#accompagnements" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-extrabold rounded-full hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg text-center">
                    Découvrez les formations & Accompagnements
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="https://lakahut.com/j/lescreateurs3d?l=mon-site" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 font-extrabold rounded-full hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg shadow-sm text-center">
                    <MessageCircle className="w-5 h-5 text-slate-400" />
                    Rejoindre la communauté gratuite
                  </a>
                </motion.div>
              </div>

              {/* Right Column (Image Card) */}
              <div className="lg:col-span-5 relative w-full flex justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative w-full max-w-[480px] lg:max-w-none group"
                >
                  {/* Decorative background gradients framing the image */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  
                  {/* The trainer image itself */}
                  <div className="relative bg-slate-900/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-white/40">
                    <img 
                      src="/formateur.png?v=2" 
                      alt="Maîtrisez l'Art de la Visualisation 3D - Formations Les Créateurs 3D" 
                      className="w-full h-auto object-cover rounded-2xl transform hover:scale-[1.01] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  {/* Floating Micro Badge - "Nouveau Workflow 3D + IA" */}
                  <div className="absolute -bottom-4 -left-4 bg-slate-900 text-white text-[11px] md:text-xs font-extrabold py-3 px-4 rounded-xl shadow-lg border border-slate-700/50 flex items-center gap-2 animate-bounce [animation-duration:3s]">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>Nouveau : Workflow 3D + IA</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Credibility Logocloud / Stats */}
        <section className="py-16 border-y border-slate-200/50 bg-white/80 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center divide-y sm:divide-y-0 sm:gap-y-12 lg:divide-x divide-slate-200/60">
              <div className="flex flex-col flex-1 items-center justify-center py-2 group lg:border-l-0">
                <Youtube className="w-10 h-10 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  <AnimatedCounter end={44500} suffix="+" />
                </p>
                <p className="font-extrabold text-red-600 text-sm uppercase tracking-wider mb-2">Abonnés YouTube</p>
                <p className="text-sm text-slate-500 font-medium">Créateurs qui suivent nos astuces.</p>
              </div>
              <div className="flex flex-col flex-1 items-center justify-center py-2 group sm:border-l sm:border-slate-200/60 lg:border-l">
                <Users className="w-10 h-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  <AnimatedCounter end={3500} suffix="+" />
                </p>
                <p className="font-extrabold text-blue-600 text-sm uppercase tracking-wider mb-2">Membres sur Skool</p>
                <p className="text-sm text-slate-500 font-medium">Membres passionnés.</p>
              </div>
              <div className="flex flex-col flex-1 items-center justify-center py-2 group lg:border-l">
                <GraduationCap className="w-10 h-10 text-violet-500 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  <AnimatedCounter end={3217} suffix="" />
                </p>
                <p className="font-extrabold text-violet-500 text-sm uppercase tracking-wider mb-2">FORMATIONS DELIVREES</p>
                <p className="text-sm text-slate-500 font-medium">Professionnels passés à l'action.</p>
              </div>
              <div className="flex flex-col flex-1 items-center justify-center py-2 group sm:border-l sm:border-slate-200/60 lg:border-l">
                <Award className="w-10 h-10 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  <AnimatedCounter end={10} suffix="+" />
                </p>
                <p className="font-extrabold text-orange-500 text-sm uppercase tracking-wider mb-2">Ans d'expérience</p>
                <p className="text-sm text-slate-500 font-medium font-bold">Sur le marché pro.</p>
              </div>
            </div>
          </div>
        </section>

        {/* The Journey / Ecosystem */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20 reveal">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">4 espaces pour vous former, à votre rythme.</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">Parce qu'on ne passe pas de la découverte d'un logiciel 3D à une présentation de projet parfaite en un jour, nous avons structuré pour vous cet écosystème progressif.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Connecting line for desktop */}
              <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[3px] bg-gradient-to-r from-red-200 via-blue-200 via-violet-200 to-orange-200 -z-10 rounded-full"></div>
              
              {/* YT */}
              <a 
                href="https://www.youtube.com/@lescreateurs3d" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-6 rounded-[1.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 hover:border-red-200 text-center relative group hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-[88px] h-[88px] mx-auto bg-slate-50 group-hover:bg-red-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-colors">
                    <Youtube className="w-10 h-10 text-slate-400 group-hover:text-red-500 transition-colors" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-slate-900 group-hover:text-red-600 transition-colors">1. YouTube (La Découverte)</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">Sur la chaîne YouTube Les créateurs 3D, familiarisez-vous avec la 3D et l'IA. Piochez des astuces techniques pour mieux modéliser, texturer ou éclairer vos espaces.</p>
                </div>
              </a>
              
              {/* Communauté */}
              <a 
                href="https://www.skool.com/lescreateurs3d/about" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white p-6 rounded-[1.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 hover:border-blue-200 text-center relative group hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-[88px] h-[88px] mx-auto bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-colors">
                    <Users className="w-10 h-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">2. La Communauté (L'Entraide)</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">Vous bloquez sur un rendu ou un détail technique ? Rejoignez l'espace gratuit pour poser vos questions et obtenir les retours d'autres créateurs et professionnels.</p>
                </div>
              </a>

              {/* Formations Vidéos */}
              <a 
                href="#formations-catalog" 
                className="bg-white p-6 rounded-[1.5rem] shadow-xl shadow-slate-200/30 border border-slate-100 hover:border-violet-200 text-center relative group hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-[88px] h-[88px] mx-auto bg-slate-50 group-hover:bg-violet-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm transition-colors">
                    <MonitorPlay className="w-10 h-10 text-slate-400 group-hover:text-violet-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-slate-900 group-hover:text-violet-600 transition-colors">3. Formations Vidéos (L'Autonomie)</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">Des cursus structurés de A à Z en vidéo à suivre à votre rythme. Maîtrisez les textures, la lumière ou la post-production en autonomie complète.</p>
                </div>
              </a>
              
              {/* Accompagnement */}
              <a 
                href="#accompagnements"
                className="bg-white p-6 rounded-[1.5rem] shadow-2xl shadow-orange-500/5 border-2 border-orange-100 hover:border-orange-300 text-center relative group hover:-translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Format Premium</div>
                <div>
                  <div className="w-[88px] h-[88px] mx-auto bg-orange-50 group-hover:bg-orange-100/50 rounded-2xl flex items-center justify-center mb-8 border border-orange-100 shadow-sm transition-colors">
                    <TrendingUp className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-slate-900 group-hover:text-orange-600 transition-colors">4. Accompagnements (Le Coaching)</h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed">Arrêtez de tâtonner. Un suivi individuel sur-mesure sur vos propres projets avec un cadre clair pour produire de magnifiques visuels d'espaces, sans stress.</p>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Technical Assurance Banner */}
        <section className="border-y border-slate-200/60 bg-slate-50/40 py-8 relative z-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <p className="text-sm font-extrabold text-slate-500 uppercase tracking-wider shrink-0 text-center lg:text-left">
              Un accompagnement centré sur les logiciels dont vous avez besoin pour votre activité.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-5 gap-y-3">
              {[
                { name: "SketchUp", color: "text-blue-600 bg-blue-50/60 border-blue-100" },
                { name: "Layout", color: "text-amber-600 bg-amber-50/60 border-amber-100" },
                { name: "V-Ray", color: "text-red-600 bg-red-50/60 border-red-100" },
                { name: "Enscape", color: "text-emerald-600 bg-emerald-50/60 border-emerald-100" },
                { name: "Outils IA", color: "text-violet-600 bg-violet-50/60 border-violet-100 animate-pulse" },
                { name: "Twinmotion", color: "text-teal-600 bg-teal-50/60 border-teal-100" },
                { name: "D5 Render", color: "text-slate-800 bg-slate-100/60 border-slate-200" },
                { name: "Blender", color: "text-orange-600 bg-orange-50/60 border-orange-100" },
                { name: "Photoshop", color: "text-sky-600 bg-sky-50/60 border-sky-100" },
              ].map((tech) => (
                <span
                  key={tech.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${tech.color} shadow-sm transition-all hover:scale-105 duration-200`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  {tech.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Manifest & Method */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            {/* Manifeste */}
            <div className="text-center mb-20 reveal">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Votre 3D n’a pas besoin de plus d’outils. Elle a besoin de plus de méthode.</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-medium">
                Regarder des tutos permet de démarrer. Tester l'IA permet d'aller plus vite. Mais sans cadre, on finit par s'éparpiller et perdre des heures sur ses projets. Ici, le but n'est pas d'empiler les outils. C'est d'apprendre à bien s'en servir pour produire de belles images, sans stress.
              </p>
            </div>

            {/* Pas ici */}
            <div className="mt-20 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white">
               <h3 className="text-2xl md:text-3xl font-extrabold mb-10 text-center">Ce que vous ne trouverez pas ici</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                 {[
                   "De la magie artificielle (l'IA ne fait pas tout le projet à votre place).",
                   "Une avalanche de vidéos sans aucun lien entre elles.",
                   "De la théorie abstraite, déconnectée de vos vrais chantiers d'aménagement.",
                   "Du jargon technique compliqué pour vous impressionner.",
                   "Des cours où vous êtes laissé complètement seul face à votre écran."
                 ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                         <span className="text-slate-400 font-bold">×</span>
                      </div>
                      <p className="font-medium text-slate-300">{item}</p>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* SECTION TÉMOIGNAGES */}
        <section style={{ padding: '4rem 1rem', backgroundColor: 'var(--color-surface, #f9f8f5)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* En-tête de la section */}
            <div className="reveal" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--color-text, #28251d)', marginBottom: '0.5rem' }}>Ils ont structuré leur méthode (et ça se voit).</h2>
              <p style={{ color: 'var(--color-text-muted, #7a7974)', fontSize: '1.1rem' }}>Avis certifiés extraits de notre page Google.</p>
            </div>

            {/* Grille des avis */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

              {/* AVIS 1 */}
              <div className="reveal" style={{ transitionDelay: '0ms', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', color: '#fbbc04', fontSize: '1.2rem' }}>
                    ★ ★ ★ ★ ★
                  </div>
                  {/* Logo Google SVG */}
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <p style={{ fontWeight: 700, color: '#202124', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: 1.4 }}>"Des explications simples, qui permettent de progresser vite."</p>
                <p style={{ color: '#4d5156', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1 }}>"Il est à l’écoute, emploie des termes simples et permet une progression rapide. Si je dois recommander un formateur, c’est lui."</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#e8f0fe', color: '#1967d2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>I</div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#202124', margin: 0, fontSize: '0.95rem' }}>Ixia Deslande</p>
                    <p style={{ color: '#70757a', margin: 0, fontSize: '0.85rem' }}>Utilisatrice SketchUp</p>
                  </div>
                </div>
              </div>

              {/* AVIS 2 */}
              <div className="reveal" style={{ transitionDelay: '100ms', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', color: '#fbbc04', fontSize: '1.2rem' }}>
                    ★ ★ ★ ★ ★
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <p style={{ fontWeight: 700, color: '#202124', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: 1.4 }}>"Tu m’as fait gagner des heures de rendu."</p>
                <p style={{ color: '#4d5156', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1 }}>"Sylvain regorge d’astuces, met à l’aise, et m’a fait gagner énormément de temps sur mes rendus. Je recommande clairement."</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#ceead6', color: '#137333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>E</div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#202124', margin: 0, fontSize: '0.95rem' }}>Eleonore Favre</p>
                    <p style={{ color: '#70757a', margin: 0, fontSize: '0.85rem' }}>Créatrice 3D</p>
                  </div>
                </div>
              </div>

              {/* AVIS 3 */}
              <div className="reveal" style={{ transitionDelay: '200ms', background: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #eaeaea', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '4px', color: '#fbbc04', fontSize: '1.2rem' }}>
                    ★ ★ ★ ★ ★
                  </div>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <p style={{ fontWeight: 700, color: '#202124', marginBottom: '0.75rem', fontSize: '1.05rem', lineHeight: 1.4 }}>"Je réalise des visuels que je présente à mes clients !"</p>
                <p style={{ color: '#4d5156', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1 }}>"Sylvain est LE formateur dont on a besoin pour tout apprendre sur la 3D, SketchUp, V-Ray... Grâce à toi, je présente maintenant mes visuels à mes clients."</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: '#fce8e6', color: '#c5221f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>S</div>
                  <div>
                    <p style={{ fontWeight: 600, color: '#202124', margin: 0, fontSize: '0.95rem' }}>Stéphanie G.</p>
                    <p style={{ color: '#70757a', margin: 0, fontSize: '0.85rem' }}>Architecte d'intérieur</p>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Bouton vers tous les avis (Transparence) */}
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <a href="https://share.google/qmXw4iBtuuW21mdYi" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', color: '#1a73e8', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem', border: '1px solid #dadce0', padding: '0.6rem 1.2rem', borderRadius: '20px', transition: 'background-color 0.2s' }}>
                Voir tous nos avis sur Google
              </a>
            </div>

          </div>
        </section>

        {/* Offers Section */}
        <section id="accompagnements" className="py-20 bg-slate-900 text-white relative overflow-hidden rounded-[2.5rem] mx-4 md:mx-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/30 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10 py-12">
            <div className="mb-20 max-w-3xl reveal">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                Choisir le bon accompagnement pour vos projets.
              </h2>
              <p className="text-xl text-slate-300 font-medium font-bold">
                Que vous conceviez votre tout premier aménagement ou que vous cherchiez à optimiser vos rendus pour vos clients, nous adaptons notre cadre à votre niveau, sans stress.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              
              {/* Individual - The Core Value */}
              <div className="xl:col-span-7 bg-white text-slate-900 rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl group reveal" style={{ transitionDelay: '0ms' }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-violet-100 opacity-80 blur-[80px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-orange-100 opacity-80 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 h-full flex flex-col items-start">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 text-white text-sm font-bold mb-8 uppercase tracking-wider shadow-md shadow-blue-500/30">
                    Formation & Coaching certifiant
                  </span>
                  
                  <h3 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Formation & Accompagnement individuel</h3>
                  
                  <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed font-medium">
                    Un véritable parcours de formation sur-mesure pour maîtriser les logiciels 3D et de rendu de votre choix, ainsi que les nouveaux outils IA. Entièrement personnalisé selon vos objectifs et adapté à votre niveau actuel (de l'initiation au perfectionnement), ce parcours structuré s'ajuste à vos besoins réels.
                  </p>
                  
                  <ul className="space-y-5 mb-12">
                    <li className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-bold text-lg">Des sessions individuelles en visio, adaptées à votre emploi du temps</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-bold text-lg">Une formule éligible aux financements CPF et OPCO</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-bold text-lg">Un travail direct sur vos propres chantiers et esquisses</span>
                    </li>
                  </ul>
                  
                  <img 
                    src="/logo_moncompteformation_rvb copie.jpg" 
                    alt="Logo Mon Compte Formation" 
                    className="w-32 object-contain mt-[-5.4px] mb-[17px] pt-[2px] pb-[2px] rotate-3 shadow-md rounded-lg"
                    referrerPolicy="no-referrer"
                  />

                  <div className="mt-auto pt-6 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button 
                      onClick={(e) => {
                         e.preventDefault();
                         (window as any).Calendly?.initPopupWidget({url: 'https://calendly.com/lescreateurs3d/appel-telephonique-formation'});
                      }}
                      className="px-8 py-5 bg-slate-900 text-white font-extrabold rounded-full hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl text-center"
                    >
                      Demander un entretien personnalisé
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <a 
                      href="https://lescreateurs3d.systeme.io/parcours_archi" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-8 py-5 text-blue-600 bg-blue-50 hover:bg-blue-100 font-extrabold rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
                    >
                      Voir le contenu & les prix
                    </a>
                  </div>
                </div>
              </div>

              {/* Group & E-learning */}
              <div className="xl:col-span-5 flex flex-col gap-8">
                
                {/* Group */}
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 hover:bg-white/15 transition-colors flex flex-col group reveal" style={{ transitionDelay: '100ms' }}>
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <span className="text-blue-300 text-xs font-extrabold uppercase tracking-widest mb-2 block">Format équipes & agences</span>
                      <h3 className="text-3xl font-extrabold text-white">Formation & Accompagnement d'équipe</h3>
                    </div>
                    <div className="p-3 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-500/30 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-slate-300 mb-8 font-medium leading-relaxed">
                    Formez vos collaborateurs à la 3D et à l'IA pour augmenter l'impact de vos présentations clients et optimiser vos flux de production. Un programme sur-mesure pour votre entreprise, réalisable en présentiel ou à distance.
                  </p>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      (window as any).Calendly?.initPopupWidget({url: 'https://calendly.com/lescreateurs3d/appel-telephonique-formation'});
                    }}
                    className="mt-auto self-start text-white font-bold flex items-center gap-2 hover:gap-3 transition-all bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full"
                  >
                    Former votre équipe <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* E-learning */}
                <div id="formations" className="flex-1 bg-white/10 backdrop-blur-md rounded-[2rem] p-8 border border-white/20 hover:bg-white/15 transition-colors flex flex-col group reveal" style={{ transitionDelay: '200ms' }}>
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <span className="text-violet-300 text-xs font-extrabold uppercase tracking-widest mb-2 block">Pratique en autonomie</span>
                      <h3 className="text-3xl font-extrabold text-white">E-learning vidéo</h3>
                    </div>
                    <div className="p-3 bg-violet-500/20 text-violet-300 rounded-2xl border border-violet-500/30 shrink-0">
                      <MonitorPlay className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-slate-300 mb-8 font-medium leading-relaxed">
                    Des vidéos concrètes à suivre à votre rythme. Le complément idéal pour acquérir des compétences ciblées (créer des textures réalistes, gérer vos éclairages ou faire de la post-production).
                  </p>
                  <a href="#formations-catalog" className="mt-auto self-start text-white font-bold flex items-center gap-2 hover:gap-3 transition-all bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full">
                    Accéder au catalogue autonome <ChevronRight className="w-5 h-5" />
                  </a>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Méthode d'accompagnement */}
        <section id="methode" className="py-20 bg-slate-50 border-t border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="reveal">
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">Une méthode d'accompagnement simple en 4 étapes</h2>
                <p className="text-lg text-slate-600 mb-8 font-medium leading-relaxed">
                  L'accompagnement est pensé pour simplifier votre quotidien : de la création de la 3D jusqu'à l'image finale que vous allez présenter.
                </p>
              </div>
              <div className="space-y-4">
                 {[
                   "1. Le diagnostic : Faire le point sur votre façon de travailler aujourd'hui.",
                   "2. Le tri : Garder uniquement les méthodes et les outils qui vous sont vraiment utiles.",
                   "3. La routine : Mettre en place votre méthode de création étape par étape (3D + IA).",
                   "4. Le rendu : Apprendre à créer des images qui marquent et qui servent votre communication."
                 ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="font-bold text-slate-800">{step}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Integration Section */}
        <section id="ia" className="py-20 relative">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col lg:flex-row items-center gap-16 overflow-hidden relative">
              <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[150%] bg-gradient-to-l from-orange-50 via-violet-50 to-transparent pointer-events-none -z-10"></div>
              
              <div className="lg:w-1/2 relative z-10 reveal">
                <span className="inline-flex items-center gap-2 text-orange-600 font-extrabold text-sm tracking-wider uppercase mb-4">
                  <Sparkles className="w-5 h-5" /> 3D & Intelligence Artificielle
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-slate-900">
                  Utilisez l'IA comme un allié, pas comme un gadget.
                </h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed font-medium">
                  L'IA n'est pas là pour faire vos projets à votre place, mais pour vous aider à faire mieux et plus vite. Apprenez à vous en servir au bon moment : pour essayer des ambiances, explorer des matériaux, améliorer votre travail, tout en gardant le contrôle complet sur vos créations.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <Shapes className="w-8 h-8 text-blue-600 mb-4" />
                    <h4 className="font-extrabold text-lg mb-2 text-slate-900">Tester des ambiances</h4>
                    <p className="text-sm text-slate-600 font-medium">Essayez différentes lumières et couleurs en quelques secondes pour nourrir vos projets d'aménagement.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <MonitorPlay className="w-8 h-8 text-violet-600 mb-4" />
                    <h4 className="font-extrabold text-lg mb-2 text-slate-900">Trouver les bonnes matières</h4>
                    <p className="text-sm text-slate-600 font-medium">Ajoutez instantanément du relief à votre modèle 3D avec des propositions réalistes de bois, de métaux ou de tissus.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:col-span-2">
                    <Sparkles className="w-8 h-8 text-amber-500 mb-4" />
                    <h4 className="font-extrabold text-lg mb-2 text-slate-900">Améliorer vos rendus (AI Enhancing)</h4>
                    <p className="text-sm text-slate-600 font-medium">Sublimez instantanément vos images de synthèse. L'IA analyse les détails pour corriger les imperfections, augmenter la netteté et accentuer le photoréalisme des matières sans nouveau temps de calcul.</p>
                  </div>
                </div>
              </div>
 
              <div className="lg:w-1/2 w-full relative z-10 reveal" style={{ transitionDelay: '150ms' }}>
                <div className="aspect-square relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-violet-400 to-orange-400 rounded-full blur-[80px] opacity-20"></div>
                  
                  <div className="relative z-10 w-full max-w-md bg-white border border-slate-100 rounded-[2rem] p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-100">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                          <Shapes className="w-7 h-7 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-lg">Votre base 3D</p>
                          <p className="text-sm text-slate-500 font-medium">Volume, échelle et mobilier</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-100">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <Zap className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-lg">Rendu rapide</p>
                          <p className="text-sm text-slate-500 font-medium">Cadrage, éclairage & prévisualisation</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center mb-6 relative">
                       <div className="absolute w-1 h-14 bg-gradient-to-b from-slate-200 to-violet-200 -z-10"></div>
                       <div className="bg-white border border-violet-100 shadow-lg shadow-violet-500/10 px-6 py-3 rounded-full text-sm font-extrabold text-violet-600 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          BOOST IA
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <Sparkles className="w-7 h-7 text-white mix-blend-overlay" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xl">Image finale réaliste</p>
                          <p className="text-sm text-orange-600 font-bold">Projet immédiatement compris</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Free Community Hub */}
        <section id="communaute" className="py-20">
          <div className="max-w-4xl mx-auto px-6 text-center reveal">
            <div className="w-24 h-24 bg-blue-100/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-blue-100 rotate-3">
              <MessageCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Posez vos questions sur notre espace d'entraide.</h2>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed font-medium">
              Un doute sur une texture ? Un rendu qui ne se lance pas ou une astuce technique qui vous échappe ? Rejoignez notre communauté gratuite pour poser vos questions à d'autres concepteurs d'espaces.
            </p>
            <a href="https://lakahut.com/j/lescreateurs3d?l=mon-site" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-white text-blue-600 font-extrabold border-2 border-blue-100 rounded-full hover:border-blue-600 hover:bg-blue-50 active:scale-95 transition-all shadow-sm text-lg flex items-center justify-center gap-3 mx-auto max-w-fit">
               <Users className="w-6 h-6" />
              Rejoindre l'espace d'entraide gratuit
            </a>
          </div>
        </section>



        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center mb-12 tracking-tight">
              Questions fréquentes
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Quelle formation SketchUp choisir pour débuter en architecture ?",
                  r: "Si vous débutez, notre chaîne YouTube vous permet de faire vos premiers pas. Pour une méthode de A à Z, notre e-learning autonome ou notre accompagnement individuel vous donneront le cadre nécessaire."
                },
                {
                  q: "Faut-il connaitre V-Ray, Enscape ou l'IA avant de commencer un accompagnement ?",
                  r: "Non, notre méthode s'adapte à votre niveau. Nous ne reprenons pas depuis le début absolu mais depuis votre début, à partir de vos connaissances réelles, pour y intégrer la 3D et l'IA et perfectionner vos rendus."
                },
                {
                  q: "L'intelligence artificielle va-t-elle remplacer les logiciels 3D ?",
                  r: "L'IA est un accélérateur, pas un remplaçant. Elle s'intègre dans notre workflow de formation pour améliorer vos éclairages et tester des ambiances, mais vous gardez toujours la main sur vos volumes et votre conception de base."
                },
                {
                  q: "J'ai une question précise ou un projet spécifique, comment vous contacter ?",
                  r: (
                    <span>
                      En cas de question précise, vous pouvez{" "}
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          (window as any).Calendly?.initPopupWidget({url: 'https://calendly.com/lescreateurs3d/appel-telephonique-formation'});
                        }}
                        className="text-blue-600 hover:text-blue-800 font-extrabold underline cursor-pointer inline"
                      >
                        prendre un rdv téléphonique
                      </button>{" "}
                      pour en discuter de vive voix. Vous pouvez également nous contacter via WhatsApp (le widget de discussion est en bas à gauche de la page) ou échanger en direct avec notre assistant IA également disponible en bas à gauche pour vous guider en temps réel.
                    </span>
                  )
                }
              ].map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <span className="font-bold text-slate-800 text-lg">{faq.q}</span>
                      <span className={`text-blue-600 transition-transform duration-300 transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-slate-600 font-medium leading-relaxed text-[15px] border-t border-slate-100">
                        {faq.r}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
          </>
        )}
        {currentPage === 'logiciels' && (
          <LogicielsPage onGoBack={() => navigateTo('home')} />
        )}
        {currentPage === 'extensions' && (
          <ExtensionsPage onGoBack={() => navigateTo('home')} />
        )}
        {currentPage === 'formations' && (
          <FormationsCatalogPage onGoBack={() => navigateTo('home')} />
        )}
        {currentPage === 'admin' && (
          <AdminStatsPage onGoBack={() => navigateTo('home')} />
        )}
        {(currentPage === 'mentions' || currentPage === 'cgv' || currentPage === 'remboursement' || currentPage === 'confidentialite') && (
          <LegalPage kind={currentPage} onGoBack={() => navigateTo('home')} />
        )}
      </main>

      {/* Footer */}
      {currentPage !== 'formations' && currentPage !== 'admin' && (
        <footer className="bg-slate-900 text-slate-400 py-20 border-t-4 border-blue-600">
          <div className="max-w-7xl mx-auto px-6 pb-[33.2px]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-slate-800 pb-16">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <img 
                    src="/logo seul PNG.png" 
                    alt="Les Créateurs 3D Logo" 
                    className="w-10 h-10 object-contain"
                  />
                  <span className="text-2xl font-extrabold tracking-tight text-white">Les Créateurs 3D</span>
                </div>
                <div className="flex gap-4 items-center">
                  <img 
                    src="/carre vra copieROND couleur petit.png" 
                    alt="Auteur" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-600"
                    referrerPolicy="no-referrer"
                  />
                  <blockquote className="max-w-sm text-[13.4px] italic text-white font-medium border-l-4 border-blue-600 pl-4">
                    "La 3D ne devrait jamais être un obstacle à votre créativité.<br /><br />
                    Arrêtez de perdre des heures à tâtonner sur la technique. Ensemble, nous allons mettre en place un workflow simple et solide pour que vos rendus deviennent un réflexe.<br /><br />
                    Discutons de vos prochains projets et de la façon dont on peut les accélérer."
                  </blockquote>
                </div>
                <div className="flex gap-4 mt-5">
                  <a href="https://www.youtube.com/@lescreateurs3d" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a href="https://www.instagram.com/createurddd" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="https://www.skool.com/lescreateurs3d/about" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors">
                    <Users className="w-5 h-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <h4 className="font-extrabold text-white mb-6 uppercase tracking-wider text-sm">Le Parcours</h4>
                <ul className="space-y-4">
                  <li><a href="#accompagnements" className="hover:text-blue-400 transition-colors font-bold">Accompagnement Individuel</a></li>
                  <li><a href="#accompagnements" className="hover:text-blue-400 transition-colors font-bold">Accompagnement d'Équipe</a></li>
                  <li><a href="#formations-catalog" className="hover:text-blue-400 transition-colors font-bold">Formations vidéos e-learning</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-extrabold text-white mb-6 uppercase tracking-wider text-sm">Ressources</h4>
                <ul className="space-y-4">
                  <li><a href="https://www.youtube.com/@lescreateurs3d" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors font-bold">La chaîne YouTube</a></li>
                  <li><a href="https://www.skool.com/lescreateurs3d/about" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors font-bold">La Communauté Skool</a></li>
                  <li><a href="https://www.instagram.com/createurddd" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors font-bold">Instagram</a></li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-bold">
              <p 
                onClick={(e) => { if (e.detail === 3) { navigateTo('admin'); } }} 
                className="cursor-default select-none"
              >
                © {new Date().getFullYear()} Les Créateurs 3D. Tous droits réservés.
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
                <a href="/cgv" className="hover:text-white transition-colors">CGV</a>
                <a href="/remboursement" className="hover:text-white transition-colors">Remboursement</a>
                <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
