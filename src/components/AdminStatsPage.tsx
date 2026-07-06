import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Users,
  MousePointerClick,
  Smartphone,
  Laptop,
  Tablet,
  Calendar,
  ArrowLeft,
  Lock,
  RefreshCw,
  Eye,
  Share2,
  LogOut,
  Clock,
  ExternalLink,
  Flame,
  CheckCircle2,
  ChevronRight,
  Filter,
  Euro,
  CreditCard
} from 'lucide-react';
import { fetchAnalyticsEvents } from '../lib/analytics';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AdminStatsPageProps {
  onGoBack: () => void;
}

export default function AdminStatsPage({ onGoBack }: AdminStatsPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [filterDays, setFilterDays] = useState<number>(7); // 1, 7, 30, 0 (all-time)
  const [stripeSales, setStripeSales] = useState<any[]>([]);
  const [stripeError, setStripeError] = useState<string>('');

  // Handle Firebase Auth Session Persistence
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (user.email === 'lescreateurs3d@gmail.com') {
          try {
            const token = await user.getIdToken(true);
            sessionStorage.setItem('l3d_admin_token', token);
            sessionStorage.setItem('l3d_admin_auth', 'true');
            setIsAuthenticated(true);
          } catch (e) {
            console.error("[Auth] Error getting token:", e);
          }
        } else {
          await auth.signOut();
          sessionStorage.removeItem('l3d_admin_token');
          sessionStorage.removeItem('l3d_admin_auth');
          setIsAuthenticated(false);
          setLoginError("Accès refusé. Seul le compte propriétaire (lescreateurs3d@gmail.com) est autorisé.");
        }
      } else {
        sessionStorage.removeItem('l3d_admin_token');
        sessionStorage.removeItem('l3d_admin_auth');
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user.email === 'lescreateurs3d@gmail.com') {
        const token = await user.getIdToken(true);
        sessionStorage.setItem('l3d_admin_token', token);
        sessionStorage.setItem('l3d_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        await auth.signOut();
        sessionStorage.removeItem('l3d_admin_token');
        sessionStorage.removeItem('l3d_admin_auth');
        setIsAuthenticated(false);
        setLoginError("Accès refusé. Seul le compte propriétaire (lescreateurs3d@gmail.com) est autorisé à accéder à cet espace.");
      }
    } catch (err: any) {
      console.error("[Google Auth Error]", err);
      setLoginError("Erreur d'authentification Google : " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setIsAuthenticated(false);
    sessionStorage.removeItem('l3d_admin_token');
    sessionStorage.removeItem('l3d_admin_auth');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await fetchAnalyticsEvents();
      setEvents(fetchedEvents);

      // Fetch real Stripe sales directly from our new server API with authentication
      const token = sessionStorage.getItem('l3d_admin_token') || '';
      const stripeRes = await fetch('/api/admin/stripe-sales', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const stripeData = await stripeRes.json();
      if (stripeData.success) {
        setStripeSales(stripeData.sales || []);
        setStripeError('');
      } else {
        console.warn('Stripe Sales API error:', stripeData.error);
        setStripeError(stripeData.error || 'Erreur Stripe');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Calculations based on filter duration
  const getFilteredEvents = () => {
    if (filterDays === 0) return events;
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - filterDays);
    return events.filter(e => new Date(e.timestamp) >= limitDate);
  };

  const filteredEvents = getFilteredEvents();

  const getFilteredStripeSales = () => {
    if (filterDays === 0) return stripeSales;
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - filterDays);
    return stripeSales.filter(sale => new Date(sale.date) >= limitDate);
  };

  const filteredStripeSales = getFilteredStripeSales();

  // Metrics for real Stripe sales
  const realSalesCount = filteredStripeSales.length;
  const totalRevenue = filteredStripeSales.reduce((sum, s) => sum + (s.amount || 0), 0);

  // Group real Stripe sales by course name
  const realSalesByName = filteredStripeSales.reduce((acc: { [key: string]: number }, s) => {
    const courseTitle = s.courseName || 'Formation Générique';
    acc[courseTitle] = (acc[courseTitle] || 0) + 1;
    return acc;
  }, {});

  // Metrics calculations
  const totalViews = filteredEvents.filter(e => e.type === 'page_view').length;
  const uniqueVisitors = new Set(filteredEvents.map(e => e.visitorId)).size;
  const totalActions = filteredEvents.filter(e => e.type === 'action').length;
  
  // Interactions conversions (specifically Calendly bookings / community clicks)
  const calendlyClicks = filteredEvents.filter(e => e.type === 'action' && e.action === 'calendly_click').length;
  const communityClicks = filteredEvents.filter(e => e.type === 'action' && e.action === 'skool_click').length;
  const courseBuys = filteredEvents.filter(e => e.type === 'action' && e.action === 'buy_course_click').length;
  
  // Group course sales/buys by course name
  const courseSalesByName = filteredEvents
    .filter(e => e.type === 'action' && e.action === 'buy_course_click')
    .reduce((acc: { [key: string]: number }, e) => {
      const courseTitle = e.details || 'Formation Générique';
      acc[courseTitle] = (acc[courseTitle] || 0) + 1;
      return acc;
    }, {});
  
  // Engagement rate (visitors who did at least 1 action)
  const engagedVisitors = new Set(
    filteredEvents.filter(e => e.type === 'action').map(e => e.visitorId)
  ).size;
  const engagementRate = uniqueVisitors > 0 ? Math.round((engagedVisitors / uniqueVisitors) * 100) : 0;

  // Group views by page
  const pageViewsCount = filteredEvents.reduce((acc: any, e) => {
    if (e.type === 'page_view') {
      acc[e.page] = (acc[e.page] || 0) + 1;
    }
    return acc;
  }, {});

  const pageNames: { [key: string]: string } = {
    home: 'Accueil (Landing)',
    logiciels: 'Logiciels & Outils',
    formations: 'Catalogue Formations'
  };

  // Group events by device
  const devicesCount = filteredEvents.reduce((acc: any, e) => {
    acc[e.device || 'desktop'] = (acc[e.device || 'desktop'] || 0) + 1;
    return acc;
  }, {});

  // Group events by referrer
  const referrersCount = filteredEvents.reduce((acc: any, e) => {
    const ref = e.referrer === 'direct' ? 'Accès Direct' : e.referrer;
    let cleanRef = ref;
    try {
      if (ref.startsWith('http')) {
        const urlObj = new URL(ref);
        cleanRef = urlObj.hostname;
      }
    } catch (_) {}
    acc[cleanRef] = (acc[cleanRef] || 0) + 1;
    return acc;
  }, {});

  // Get daily views for chart (last 7 or 30 days)
  const getDailyStats = () => {
    const daysToGenerate = filterDays === 0 ? 30 : filterDays;
    const dailyData: { [key: string]: { views: number, actions: number, visitors: Set<string> } } = {};
    
    // Initialize last N days
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      dailyData[dateStr] = { views: 0, actions: 0, visitors: new Set() };
    }

    // Populate daily stats
    filteredEvents.forEach(e => {
      const eDate = new Date(e.timestamp);
      const dateStr = eDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      
      if (dailyData[dateStr]) {
        if (e.type === 'page_view') {
          dailyData[dateStr].views += 1;
        } else {
          dailyData[dateStr].actions += 1;
        }
        dailyData[dateStr].visitors.add(e.visitorId);
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      views: data.views,
      actions: data.actions,
      visitors: data.visitors.size
    }));
  };

  const dailyStats = getDailyStats();
  const maxDailyViews = Math.max(...dailyStats.map(d => d.views), 1);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-[#1e293b] to-slate-900 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden font-sans">
        {/* Decorative ambient backgrounds */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <button 
          onClick={onGoBack}
          className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au site
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img 
              src="/logo seul PNG.png" 
              alt="Les Créateurs 3D" 
              className="w-16 h-16 mx-auto mb-4 object-contain filter drop-shadow-lg"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Espace Administration</h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">Visualisez l'activité et l'engagement de votre site en temps réel</p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold border border-blue-500/20">
                <Lock className="w-3 h-3" /> Espace Sécurisé
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Afin de garantir la confidentialité et la sécurité de vos données de vente et de configuration, l'accès est restreint au compte propriétaire : <strong className="text-white">lescreateurs3d@gmail.com</strong>.
              </p>
            </div>

            {loginError && (
              <p className="text-red-400 text-xs font-bold bg-red-950/50 border border-red-900/50 p-4 rounded-xl leading-relaxed text-center">
                {loginError}
              </p>
            )}

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 font-black py-4 px-6 rounded-xl shadow-lg hover:shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-3 text-sm border border-slate-200 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              )}
              {loading ? "Connexion en cours..." : "Se connecter avec Google"}
            </button>

            <div className="border-t border-slate-700/60 pt-4 text-center">
              <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Double Vérification Client & Serveur</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo seul PNG.png" 
            alt="Logo" 
            className="w-9 h-9 object-contain"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-lg font-black tracking-tight text-white leading-none">Console Admin</h2>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Statistiques Temps Réel</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={loadData}
            disabled={loading}
            className="text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          
          <button 
            onClick={onGoBack}
            className="text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour Site
          </button>

          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Quitter
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Title and duration filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Tableau de Bord</h1>
            <p className="text-slate-400 text-sm font-medium">Découvrez l'attractivité de vos programmes et logiciels auprès des visiteurs</p>
          </div>

          {/* Time range picker */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            {[
              { label: 'Aujourd\'hui', days: 1 },
              { label: '7 jours', days: 7 },
              { label: '30 jours', days: 30 },
              { label: 'Tout', days: 0 }
            ].map(range => (
              <button
                key={range.days}
                onClick={() => setFilterDays(range.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
                  filterDays === range.days 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Cards Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
          {/* Page Views */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pages Vues</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/10">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : totalViews.toLocaleString('fr-FR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Impressions de pages</p>
          </div>

          {/* Unique Visitors */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visiteurs Uniques</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : uniqueVisitors.toLocaleString('fr-FR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Visiteurs distincts</p>
          </div>

          {/* Course Sales Card (Clics d'intérêt) */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group border-violet-550/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clics d'Intérêt</span>
              <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-550/10">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight text-violet-300">
              {loading ? '...' : courseBuys.toLocaleString('fr-FR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Inscriptions initiées</p>
          </div>

          {/* Stripe Real Sales Card */}
          <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ventes Stripe</span>
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight text-emerald-300">
              {loading ? '...' : realSalesCount.toLocaleString('fr-FR')}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Ventes confirmées</p>
          </div>

          {/* Stripe Total Revenue Card */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Chiffre d'Affaires</span>
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/20">
                <Euro className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight text-amber-300">
              {loading ? '...' : totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Revenus Stripe</p>
          </div>

          {/* Engagement percentage */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux d'Engagement</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-white tracking-tight">
              {loading ? '...' : `${engagementRate}%`}
            </p>
            <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Visiteurs actifs</p>
          </div>
        </div>

        {/* Charts & Graphs Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Main timeline chart */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Évolution de l'Audience</h3>
                <p className="text-slate-400 text-xs font-medium">Comparaison des pages vues par jour</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Pages Vues
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Actions
                </span>
              </div>
            </div>

            {/* Custom SVG/HTML Chart */}
            <div className="h-64 flex items-end gap-2 md:gap-3 border-b border-slate-800 pb-2 relative">
              {/* Gridlines */}
              <div className="absolute inset-x-0 top-0 border-t border-slate-800/40 text-[9px] text-slate-600 pt-1">Max: {maxDailyViews}</div>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-800/40"></div>

              {dailyStats.map((day, idx) => {
                const viewPct = maxDailyViews > 0 ? (day.views / maxDailyViews) * 90 : 0;
                const actionPct = maxDailyViews > 0 ? (day.actions / maxDailyViews) * 90 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-850 border border-slate-700 text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 shadow-xl whitespace-nowrap">
                      <p className="font-bold text-white mb-0.5">{day.date}</p>
                      <p className="text-blue-400">{day.views} Pages vues</p>
                      <p className="text-emerald-400">{day.actions} Actions</p>
                      <p className="text-indigo-400">{day.visitors} Visiteurs uniques</p>
                    </div>

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-[2px] h-[85%]">
                      {/* Views bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(viewPct, 3)}%` }}
                        className="w-1/2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-[3px] group-hover:brightness-110 transition-all"
                      ></motion.div>
                      {/* Actions bar */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(actionPct, 2)}%` }}
                        className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-[3px] group-hover:brightness-110 transition-all"
                      ></motion.div>
                    </div>

                    {/* Label */}
                    <span className="text-[9px] text-slate-500 font-bold mt-2 rotate-12 md:rotate-0 tracking-tight">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device and Page Distribution */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-white mb-6">Popularité des Pages</h3>
              
              <div className="space-y-4">
                {['home', 'logiciels', 'formations'].map((pKey) => {
                  const count = pageViewsCount[pKey] || 0;
                  const total = Object.values(pageViewsCount).reduce((a: any, b: any) => a + b, 0) as number;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const pName = pageNames[pKey] || pKey;

                  return (
                    <div key={pKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-200">{pName}</span>
                        <span className="text-slate-400 font-bold">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${
                            pKey === 'home' ? 'bg-blue-500' : pKey === 'logiciels' ? 'bg-[#06bcbf]' : 'bg-violet-500'
                          }`}
                        ></motion.div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-800/80 mt-6 pt-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Appareils des visiteurs</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Desktop', icon: Laptop, value: devicesCount.desktop || 0 },
                  { label: 'Mobile', icon: Smartphone, value: devicesCount.mobile || 0 },
                  { label: 'Tablet', icon: Tablet, value: devicesCount.tablet || 0 }
                ].map((device, idx) => {
                  const total = Object.values(devicesCount).reduce((a: any, b: any) => a + b, 0) as number;
                  const pct = total > 0 ? Math.round((device.value / total) * 100) : 0;
                  return (
                    <div key={idx} className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                      <device.icon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{device.label}</p>
                      <p className="text-base font-black text-white mt-1">{pct}%</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{device.value} clics</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Detailed conversions & interactions list */}
          <div className="lg:col-span-6 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-4">Objectifs et Conversions</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Découvrez les actions à forte valeur ajoutée réalisées par vos visiteurs</p>

              <div className="space-y-4">
                {/* Calendly booking click */}
                <div className="flex items-center justify-between p-4 bg-slate-850 rounded-xl border border-slate-800 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Appels Calendly Initiés</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clics sur "Parlons de votre projet"</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{calendlyClicks}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Conversion</p>
                  </div>
                </div>

                {/* Skool community signup */}
                <div className="flex items-center justify-between p-4 bg-slate-850 rounded-xl border border-slate-800 hover:border-orange-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Rejoindre la Communauté Skool</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clics vers l'espace d'entraide</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{communityClicks}</p>
                    <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Conversion</p>
                  </div>
                </div>

                {/* Course purchase clicks */}
                <div className="flex items-center justify-between p-4 bg-slate-850 rounded-xl border border-slate-800 hover:border-violet-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Inscriptions de Formations</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clics "S'inscrire / Débloquer"</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{courseBuys}</p>
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Conversion</p>
                  </div>
                </div>
              </div>

              {/* Referrers sub-table */}
              <div className="mt-8 border-t border-slate-800 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-slate-400" /> Principaux canaux d'acquisition
                </h4>
                <div className="space-y-3">
                  {Object.entries(referrersCount)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([refName, refVal]: any, idx) => {
                      const total = Object.values(referrersCount).reduce((a: any, b: any) => a + b, 0) as number;
                      const pct = total > 0 ? Math.round((refVal / total) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-850 p-2.5 rounded-lg border border-slate-800/40">
                          <span className="font-bold text-slate-200 truncate max-w-[240px]">{refName}</span>
                          <span className="font-extrabold text-slate-400">{refVal} visites ({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Ventes de formations détaillées */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white mb-2">Ventes de Formations</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Répartition détaillée des inscriptions (clics de paiement) par formation</p>

              <div className="space-y-4.5">
                {Object.keys(courseSalesByName).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-xs font-bold uppercase tracking-wider">Aucune vente enregistrée</p>
                    <p className="text-[10px] text-slate-600 font-medium mt-1">Les clics d'achat apparaîtront ici en temps réel</p>
                  </div>
                ) : (
                  (Object.entries(courseSalesByName) as [string, number][])
                    .sort((a, b) => b[1] - a[1])
                    .map(([title, count]) => {
                      const pct = courseBuys > 0 ? Math.round((count / courseBuys) * 100) : 0;
                      return (
                        <div key={title} className="space-y-1.5 bg-slate-850/50 p-3 rounded-xl border border-slate-800/60 hover:border-violet-500/20 transition-all">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-100 truncate pr-3" title={title}>{title}</span>
                            <span className="text-violet-400 font-black shrink-0">{count} {count > 1 ? 'ventes' : 'vente'} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500"
                            ></motion.div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Real-time live activity feed */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Flux d'Activité Réel
                </h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2 py-0.5 rounded-full uppercase">Live</span>
              </div>
              <p className="text-xs text-slate-400 mb-6 font-medium">Historique des {Math.min(filteredEvents.length, 100)} dernières actions enregistrées</p>

              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-55 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider">Aucun événement enregistré</p>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">Naviguez sur le site pour générer des visites !</p>
                  </div>
                ) : (
                  filteredEvents.slice(0, 15).map((e, idx) => {
                    const isPageView = e.type === 'page_view';
                    const timeDiff = Math.round((Date.now() - new Date(e.timestamp).getTime()) / 1000); // in sec
                    let timeStr = "À l'instant";
                    if (timeDiff >= 3600) {
                      timeStr = `Il y a ${Math.floor(timeDiff / 3600)}h`;
                    } else if (timeDiff >= 60) {
                      timeStr = `Il y a ${Math.floor(timeDiff / 60)}m`;
                    } else if (timeDiff > 5) {
                      timeStr = `Il y a ${timeDiff}s`;
                    }

                    return (
                      <div key={idx} className="flex items-start gap-3 text-xs bg-slate-850 p-3 rounded-xl border border-slate-800/40 relative overflow-hidden group text-left">
                        <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                          isPageView 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : e.action === 'buy_course_success'
                            ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20'
                            : e.action === 'calendly_click' 
                            ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {isPageView ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : e.action === 'buy_course_success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <MousePointerClick className="w-3.5 h-3.5" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 font-medium leading-normal">
                            {isPageView ? (
                              <>
                                Un visiteur ({e.device || 'desktop'}) a affiché la page{' '}
                                <strong className="text-white font-extrabold">{pageNames[e.page] || e.page}</strong>.
                              </>
                            ) : (
                              <>
                                {e.action === 'buy_course_success' ? (
                                  <span className="text-emerald-400 font-bold">Vente confirmée : </span>
                                ) : (
                                  <span>Clic d'engagement : </span>
                                )}
                                <strong className="text-white font-extrabold">
                                  {e.action === 'calendly_click' 
                                    ? 'Prise de contact Calendly' 
                                    : e.action === 'skool_click' 
                                    ? 'Rejoindre la communauté Skool' 
                                    : e.action === 'buy_course_click' 
                                    ? `Clic d'achat formation: ${e.details || ''}` 
                                    : e.action === 'buy_course_success'
                                    ? `${e.details || 'Formation'} (${e.email || 'Client'})`
                                    : e.action}
                                </strong>
                              </>
                            )}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1 font-bold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeStr}
                            </span>
                            <span className="uppercase tracking-wider">
                              Device: {e.device || 'desktop'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-slate-850 p-4 border border-slate-800 rounded-xl mt-6 text-left">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explication Technique</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Ce tableau de bord s'alimente directement via Stripe et Firebase Firestore. Chaque visite, clic Calendly ou paiement validé alimente en direct vos statistiques.
              </p>
            </div>
          </div>
        </div>

        {/* Real Stripe Sales Table Section */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                Ventes Réelles Enregistrées (Stripe API)
              </h3>
              <p className="text-xs text-slate-400 font-medium">Historique des transactions réelles et payées sur votre compte Stripe</p>
            </div>
            {stripeError ? (
              <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-lg font-bold">
                Erreur Clé Stripe : {stripeError}
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-bold">
                Stripe Connecté (Temps Réel)
              </span>
            )}
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredStripeSales.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/40">
                <Euro className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Aucune vente Stripe confirmée sur cette période</p>
                <p className="text-[10px] text-slate-600 font-medium mt-1">Les ventes payées s'afficheront ici automatiquement dès la validation du paiement.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Client (Email)</th>
                    <th className="py-3 px-4">Formation</th>
                    <th className="py-3 px-4">Date de Paiement</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredStripeSales.map((sale, idx) => (
                    <tr key={sale.id || idx} className="hover:bg-slate-850/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{sale.email}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700/60 text-[11px] font-bold">
                          {sale.courseName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {new Date(sale.date).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-400 font-black">
                        {sale.amount.toLocaleString('fr-FR', { style: 'currency', currency: sale.currency || 'EUR' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                          Payé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
