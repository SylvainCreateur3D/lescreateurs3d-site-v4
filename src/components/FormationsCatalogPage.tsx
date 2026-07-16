import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { db, handleFirestoreError, OperationType, storage, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, onSnapshot, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { trackEvent } from '../lib/analytics';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  CheckCircle2,
  Play,
  Users,
  Star,
  Layers,
  Sparkles,
  Zap,
  Flame,
  Download,
  HelpCircle,
  FileText,
  ShieldCheck,
  Lock,
  Unlock,
  MessageSquare,
  Compass,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  Percent,
  Eye,
  EyeOff,
  Briefcase,
  Video,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertCircle,
  Volume2,
  Copy
} from 'lucide-react';
import { defaultCourses, Course, CourseModule } from './coursesData';
import CountdownTimer from './CountdownTimer';

// Utility helper to safely sanitize objects for Firestore (maps undefined values to null)
const cleanForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanForFirestore(obj[key]);
    }
    return cleaned;
  }
  return obj;
};

interface FormationsCatalogPageProps {
  onGoBack: () => void;
}

export default function FormationsCatalogPage({ onGoBack }: FormationsCatalogPageProps) {
  // --- STATE ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedLevel, setSelectedLevel] = useState<string>('Tous');
  const [showOnlyPromos, setShowOnlyPromos] = useState<boolean>(false);
  
  // Promo code management types and states
  const defaultPromoCodes: { code: string; discountType: "fixed" | "percentage"; discountValue: number; isActive: boolean; stripeSynced: boolean; courseId?: string }[] = [
    { code: 'BIENVENUE10', discountType: 'percentage', discountValue: 10, isActive: true, stripeSynced: true },
    { code: 'SYLVAIN50', discountType: 'fixed', discountValue: 50, isActive: true, stripeSynced: true, courseId: 'ia-creatives' },
    { code: 'IMMO20', discountType: 'percentage', discountValue: 20, isActive: true, stripeSynced: false }
  ];

  const [promoCodes, setPromoCodes] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    stripeSynced: boolean;
    courseId?: string;
  }[]>([]);
  
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    stripeSynced: boolean;
    courseId?: string;
  } | null>(null);
  
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'comptant' | 'installments'>('comptant');
  const [adminTab, setAdminTab] = useState<'courses' | 'promos' | 'security'>('courses');

  useEffect(() => {
    setPaymentMode('comptant');
  }, [selectedCourseId]);
  
  const [newPromoCode, setNewPromoCode] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    stripeSynced: boolean;
    courseId: string;
  }>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    isActive: true,
    stripeSynced: true,
    courseId: 'all'
  });

  // Calculate dynamic FOMO prices & handle Stripe pre-filled promo codes
  const getEffectiveCoursePrice = (course: Course) => {
    // If originalPrice is not set, or is less than or equal to price, there is no promotion.
    // The active base price is course.price, and no promo timer is active.
    let basePrice = typeof course.price === 'number' ? course.price : 0;
    let isPromoTimerActive = false;
    
    const hasPromoPriceSetting = typeof course.originalPrice === 'number' && 
                                 course.originalPrice > 0 && 
                                 course.originalPrice > (course.price || 0);
                                 
    if (hasPromoPriceSetting) {
      if (course.promoDeadline) {
        const deadline = new Date(course.promoDeadline);
        const isExpired = deadline.getTime() <= Date.now();
        if (!isExpired) {
          basePrice = typeof course.price === 'number' ? course.price : 0;
          isPromoTimerActive = true;
        } else {
          // Revert to original price when expired
          basePrice = course.originalPrice;
          isPromoTimerActive = false;
        }
      } else {
        basePrice = typeof course.price === 'number' ? course.price : 0;
        isPromoTimerActive = true;
      }
    } else {
      basePrice = typeof course.price === 'number' ? course.price : 0;
      isPromoTimerActive = false;
    }
    
    let finalPrice = basePrice;
    let promoDiscount = 0;
    
    if (appliedPromo) {
      const matchesCourse = !appliedPromo.courseId || appliedPromo.courseId === 'all' || appliedPromo.courseId === course.id;
      if (matchesCourse && appliedPromo.isActive) {
        if (appliedPromo.discountType === 'percentage') {
          promoDiscount = Math.round((basePrice * appliedPromo.discountValue) / 100);
          finalPrice = Math.max(0, basePrice - promoDiscount);
        } else {
          promoDiscount = appliedPromo.discountValue;
          finalPrice = Math.max(0, basePrice - promoDiscount);
        }
      }
    }
    
    let stripeLink = isPromoTimerActive ? (course.stripePromoLink || course.stripeStandardLink) : course.stripeStandardLink;
    if (!stripeLink) {
      stripeLink = `https://buy.stripe.com/mock-checkout-${course.id}`;
    }
    
    if (appliedPromo && appliedPromo.stripeSynced) {
      const separator = stripeLink.includes('?') ? '&' : '?';
      stripeLink = `${stripeLink}${separator}prefilled_promo_code=${appliedPromo.code}`;
    }

    // Calculs de paiement en plusieurs fois (échéances)
    let stripeInstallmentsLink = course.stripeInstallmentsLink;
    let stripeInstallmentsPromoLink = course.stripeInstallmentsPromoLink || stripeInstallmentsLink;
    
    if (!stripeInstallmentsLink && course.installmentsEnabled) {
      stripeInstallmentsLink = `https://buy.stripe.com/mock-installments-${course.id}`;
      stripeInstallmentsPromoLink = stripeInstallmentsLink;
    }

    let finalInstallmentsLink = (isPromoTimerActive && stripeInstallmentsPromoLink) ? stripeInstallmentsPromoLink : stripeInstallmentsLink;
    
    if (appliedPromo && appliedPromo.stripeSynced && finalInstallmentsLink) {
      const separator = finalInstallmentsLink.includes('?') ? '&' : '?';
      finalInstallmentsLink = `${finalInstallmentsLink}${separator}prefilled_promo_code=${appliedPromo.code}`;
    }
    
    const installmentsCount = course.installmentsCount || 3;
    const installmentsPrice = (isPromoTimerActive && course.installmentsPromoPrice) 
      ? course.installmentsPromoPrice 
      : (course.installmentsPrice || Math.round((finalPrice / installmentsCount) * 100) / 100);
    
    return {
      basePrice,
      finalPrice,
      promoDiscount,
      isPromoTimerActive,
      stripeLink,
      stripeInstallmentsLink: finalInstallmentsLink,
      installmentsCount,
      installmentsPrice,
      totalInstallmentsPrice: Math.round(installmentsPrice * installmentsCount * 100) / 100
    };
  };

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSuccess(null);
    
    const trimmed = promoCodeInput.trim().toUpperCase();
    if (!trimmed) return;
    
    const found = promoCodes.find(c => c.code === trimmed);
    if (!found) {
      setPromoError("Ce code promo n'existe pas ou est invalide.");
      setAppliedPromo(null);
      return;
    }
    
    if (!found.isActive) {
      setPromoError("Ce code promo est expiré ou désactivé.");
      setAppliedPromo(null);
      return;
    }
    
    if (found.courseId && found.courseId !== 'all' && found.courseId !== selectedCourseId) {
      const targetCourseName = courses.find(c => c.id === found.courseId)?.title || "une autre formation";
      setPromoError(`Ce code promo est uniquement valable pour la formation : "${targetCourseName}".`);
      setAppliedPromo(null);
      return;
    }
    
    setAppliedPromo(found);
    if (found.discountType === 'percentage') {
      setPromoSuccess(`Félicitations ! Code '${found.code}' appliqué : -${found.discountValue}% de réduction immédiate !`);
    } else {
      setPromoSuccess(`Félicitations ! Code '${found.code}' appliqué : -${found.discountValue}€ de réduction immédiate !`);
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess(null);
    setPromoError(null);
  };
  
  // UI states
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number | null>(0);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [demoActiveVideo, setDemoActiveVideo] = useState<'chantier' | 'interieur' | 'vente'>('chantier');
  const [isVideoInteracted, setIsVideoInteracted] = useState<boolean>(false);

  // Reset video interaction when switching courses
  useEffect(() => {
    setIsVideoInteracted(false);
  }, [selectedCourseId]);
  
  // Admin Mode states
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [expiryTrigger, setExpiryTrigger] = useState<number>(0);

  const handleTimerExpire = useCallback(() => {
    setExpiryTrigger(prev => prev + 1);
  }, []);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'course' | 'promo';
    id: string;
    label: string;
  } | null>(null);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Masquer le widget Elfsight Chatbot sur cette page
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'hide-elfsight-style';
    styleEl.innerHTML = `
      .elfsight-app-8e7e055c-5f4b-48e0-a9c8-55099bb7e86a,
      [class*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"],
      [id*="8e7e055c-5f4b-48e0-a9c8-55099bb7e86a"] {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      const existingStyle = document.getElementById('hide-elfsight-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Handle Firebase Auth Session Persistence for FormationsCatalogPage
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
          const token = sessionStorage.getItem('l3d_admin_token');
          if (!token || !token.startsWith('l3d_sess_')) {
            sessionStorage.removeItem('l3d_admin_token');
            sessionStorage.removeItem('l3d_admin_auth');
            setIsAuthenticated(false);
            setLoginError("Accès refusé. Seul le compte propriétaire (lescreateurs3d@gmail.com) est autorisé.");
          } else {
            setIsAuthenticated(true);
          }
        }
      } else {
        const token = sessionStorage.getItem('l3d_admin_token');
        if (!token || !token.startsWith('l3d_sess_')) {
          sessionStorage.removeItem('l3d_admin_token');
          sessionStorage.removeItem('l3d_admin_auth');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsUploadingMedia(true);
    setLoginError(null);
    setUnauthorizedDomainError(false);
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
        setLoginError("Accès refusé. Seul le compte propriétaire (lescreateurs3d@gmail.com) est autorisé.");
      }
    } catch (err: any) {
      console.error("[Google Auth Error]", err);
      const isDomainError = err.code === 'auth/unauthorized-domain' || 
                            String(err.message).includes('unauthorized-domain') ||
                            String(err).includes('unauthorized-domain');
      if (isDomainError) {
        setUnauthorizedDomainError(true);
      }
      setLoginError("Erreur d'authentification Google : " + (err.message || String(err)));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const [adminPasscode, setAdminPasscode] = useState<string>('');

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode.trim()) return;
    setIsUploadingMedia(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasscode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('l3d_admin_token', data.token);
        sessionStorage.setItem('l3d_admin_auth', 'true');
        setIsAuthenticated(true);
        setAdminPasscode('');
      } else {
        setLoginError(data.error || "Une erreur s'est produite lors de la connexion.");
      }
    } catch (err: any) {
      console.error("[Passcode Auth Error]", err);
      setLoginError("Erreur d'authentification : " + (err.message || String(err)));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Mock payment link warning modal state
  const [mockLinkModal, setMockLinkModal] = useState<{
    isOpen: boolean;
    courseTitle: string;
    stripeLink: string;
  }>({
    isOpen: false,
    courseTitle: '',
    stripeLink: ''
  });
  
  // Course form states for adding/editing
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Stripe & Skool Automation states
  const [stripeConfigured, setStripeConfigured] = useState<boolean>(false);
  const [stripeConfigMessage, setStripeConfigMessage] = useState<string>('');
  const [skoolConfigured, setSkoolConfigured] = useState<boolean>(false);
  const [skoolConfigMessage, setSkoolConfigMessage] = useState<string>('');
  const [isStripeSyncing, setIsStripeSyncing] = useState<boolean>(false);

  const checkServerConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setStripeConfigured(data.stripeConfigured);
      setStripeConfigMessage(data.stripeMessage || data.message || '');
      setSkoolConfigured(data.skoolConfigured);
      setSkoolConfigMessage(data.skoolMessage || '');
    } catch (e) {
      setStripeConfigured(false);
      setStripeConfigMessage("Impossible de joindre le serveur pour valider la configuration Stripe.");
      setSkoolConfigured(false);
      setSkoolConfigMessage("Impossible de joindre le serveur pour valider la configuration School.");
    }
  };
  
  // --- LOCAL & SERVER PERSISTENCE ---
  useEffect(() => {
    checkServerConfig();
    

    // Promo codes loading
    const savedCodes = localStorage.getItem('lescreateurs3d_promo_codes');
    if (savedCodes) {
      try {
        setPromoCodes(JSON.parse(savedCodes));
      } catch (e) {
        setPromoCodes(defaultPromoCodes);
      }
    } else {
      setPromoCodes(defaultPromoCodes);
      localStorage.setItem('lescreateurs3d_promo_codes', JSON.stringify(defaultPromoCodes));
    }
    
    const unsub = onSnapshot(collection(db, 'courses'), async (snapshot) => {
      if (snapshot.empty) {
        // Only seed if we haven't already initialized this database
        try {
          const configRef = doc(db, 'system', 'config');
          const configSnap = await getDoc(configRef);
          if (!configSnap.exists()) {
            // Seed initial data
            // Seed initial data
            for (const course of defaultCourses) {
              await setDoc(doc(db, 'courses', course.id), cleanForFirestore(course), { merge: true });
            }
            await setDoc(configRef, { seeded: true });
          } else {
            setCourses([]);
          }
        } catch (err) {
          console.error("Error checking database initialization:", err);
          setCourses([]);
        }
      } else {
        const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(coursesData);
        // Sync with server local file as fallback
        try {
          const token = sessionStorage.getItem('l3d_admin_token');
          if (token) {
            fetch('/api/courses', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(coursesData)
            }).catch(err => console.error('Error in background sync:', err));
          }
        } catch (e) {}
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'courses');
    });

    return () => unsub();
  }, []);

  const saveCoursesToStorage = async (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
    
    // 1. Sync to server's courses.json first (especially important for passcode login!)
    // The server-side admin SDK will securely handle the Firestore writes.
    let serverSyncSuccess = false;
    try {
      const token = sessionStorage.getItem('l3d_admin_token') || '';
      if (token) {
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatedCourses)
        });
        if (response.ok) {
          serverSyncSuccess = true;
        }
      }
    } catch (e) {
      console.error('Failed to sync courses to server:', e);
    }

    // 2. Try to persist directly to Firestore on client side (works for Google Sign-In)
    try {
      for (const course of updatedCourses) {
        const cleanedCourse = cleanForFirestore(course);
        await setDoc(doc(db, 'courses', course.id), cleanedCourse, { merge: true });
      }
    } catch (err) {
      const token = sessionStorage.getItem('l3d_admin_token') || '';
      const isPasscodeSession = token && token.startsWith('l3d_sess_');
      
      // If it's a passcode session and server sync succeeded, we do NOT alert because the server
      // has already bypassed security rules and successfully written it to Firestore!
      if (isPasscodeSession && serverSyncSuccess) {
        console.log("[Client] Client-side Firestore write failed (this is expected for passcode login, server has handled it successfully):", err);
      } else {
        console.error("Error writing courses to Firestore:", err);
        alert("Erreur lors de la sauvegarde dans la base de données Firestore : " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const savePromoCodesToStorage = (updatedCodes: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    stripeSynced: boolean;
    courseId?: string;
  }[]) => {
    setPromoCodes(updatedCodes);
    localStorage.setItem('lescreateurs3d_promo_codes', JSON.stringify(updatedCodes));
  };

  // --- SUB-ROUTING (HASH & QUERY DETECTION) ---
  useEffect(() => {
    const handleHashAndQuery = () => {
      const hash = window.location.hash;
      
      // Check for ?course= in hash or search
      if (hash.includes('?course=') || window.location.search.includes('course=')) {
        let courseId = null;
        if (hash.includes('?course=')) {
          courseId = hash.split('?course=')[1]?.split('&')[0];
        } else {
          const params = new URLSearchParams(window.location.search);
          courseId = params.get('course');
        }
        
        if (courseId) {
          setSelectedCourseId(courseId);
          setIsAdminView(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      
      // Check for ?admin=true, secret hashes, or key queries
      if (
        hash.includes('?admin=true') || 
        hash.includes('#createurs3d-admin') || 
        window.location.search.includes('admin=true') ||
        window.location.search.includes('key=createurs3d')
      ) {
        setIsAdminView(true);
        setSelectedCourseId(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setSelectedCourseId(null);
      setIsAdminView(false);
    };

    handleHashAndQuery();
    window.addEventListener('hashchange', handleHashAndQuery);
    return () => window.removeEventListener('hashchange', handleHashAndQuery);
  }, []);

  const selectCourse = (id: string | null) => {
    if (id) {
      window.location.hash = `#formations-catalog?course=${id}`;
    } else {
      window.location.hash = '#formations-catalog';
    }
  };

  const toggleAdminView = (active: boolean) => {
    if (active) {
      window.location.hash = '#formations-catalog?admin=true';
    } else {
      window.location.hash = '#formations-catalog';
    }
  };

  // --- AUTHENTICATION ---
  const handleLogout = async () => {
    await auth.signOut();
    setIsAuthenticated(false);
    sessionStorage.removeItem('l3d_admin_token');
    sessionStorage.removeItem('l3d_admin_auth');
    toggleAdminView(false);
  };

  // --- COURSE MANAGEMENT ACTIONS ---
  const handleTogglePublished = (id: string) => {
    const updated = courses.map(c => c.id === id ? { ...c, published: !c.published } : c);
    saveCoursesToStorage(updated);
  };

  const handleToggleFeatured = (id: string) => {
    const updated = courses.map(c => c.id === id ? { ...c, featured: !c.featured } : c);
    saveCoursesToStorage(updated);
  };

  const handleTogglePromo = (id: string) => {
    const updated = courses.map(c => {
      if (c.id === id) {
        // Simple logic to set a promo price
        const updatedCourse = { ...c };
        const hasPromo = c.originalPrice > c.price;
        if (hasPromo) {
          // If already has promo price, restore original price
          updatedCourse.price = c.originalPrice;
          updatedCourse.promoDeadline = undefined;
          updatedCourse.promoLabel = undefined;
        } else {
          // Put standard 30% promo
          updatedCourse.price = Math.round(c.originalPrice * 0.7);
          updatedCourse.promoDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          updatedCourse.promoLabel = 'Offre limitée';
        }
        return updatedCourse;
      }
      return c;
    });
    saveCoursesToStorage(updated);
  };

  const handleDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    setDeleteConfirm({
      type: 'course',
      id,
      label: course?.title || id
    });
  };

  const executeDeleteCourse = async (id: string) => {
    try {
      const updated = courses.filter(c => c.id !== id);
      
      // 1. Sync updated courses to the server first (especially important for passcode login!)
      let serverSyncSuccess = false;
      const token = sessionStorage.getItem('l3d_admin_token') || '';
      if (token) {
        const res = await fetch('/api/courses', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          serverSyncSuccess = true;
        }
      }
      
      // 2. Try to delete document directly from Firestore on client side (Option 1 Google Sign-In)
      try {
        await deleteDoc(doc(db, 'courses', id));
      } catch (dbErr) {
        const isPasscodeSession = token && token.startsWith('l3d_sess_');
        if (isPasscodeSession && serverSyncSuccess) {
          console.log("[Client] Client-side Firestore delete failed (this is expected for passcode login, server has handled it successfully):", dbErr);
        } else {
          throw dbErr;
        }
      }
      
      // Filter out locally and update UI
      setCourses(updated);
    } catch (error) {
      console.error("Erreur lors de la suppression de la formation :", error);
      alert("Erreur lors de la suppression de la formation.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleTogglePromoCodeActive = (codeStr: string) => {
    const updated = promoCodes.map(c => c.code === codeStr ? { ...c, isActive: !c.isActive } : c);
    savePromoCodesToStorage(updated);
  };

  const handleDeletePromoCode = (codeStr: string) => {
    setDeleteConfirm({
      type: 'promo',
      id: codeStr,
      label: codeStr
    });
  };

  const executeDeletePromoCode = (codeStr: string) => {
    const updated = promoCodes.filter(c => c.code !== codeStr);
    savePromoCodesToStorage(updated);
    if (appliedPromo && appliedPromo.code === codeStr) {
      handleRemovePromoCode();
    }
    setDeleteConfirm(null);
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = newPromoCode.code?.trim().toUpperCase();
    if (!codeUpper) return;

    if (promoCodes.some(c => c.code === codeUpper)) {
      alert("Ce code promo existe déjà.");
      return;
    }

    let isSynced = false;
    if (stripeConfigured && newPromoCode.stripeSynced !== false) {
      setIsStripeSyncing(true);
      try {
        const token = sessionStorage.getItem('l3d_admin_token') || '';
        const response = await fetch('/api/stripe/sync-promo', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            code: codeUpper,
            discountType: newPromoCode.discountType,
            discountValue: Number(newPromoCode.discountValue)
          })
        });

        const data = await response.json();
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('l3d_admin_token');
          alert('Session expirée. Veuillez vous reconnecter.');
        } else if (response.ok && data.success) {
          isSynced = true;
          alert(`✓ Code promo "${codeUpper}" créé et configuré automatiquement sur Stripe !`);
        } else {
          alert(`⚠️ Impossible de créer sur Stripe : ${data.error || 'Erreur inconnue'}.\nLe code est sauvegardé uniquement localement.`);
        }
      } catch (err: any) {
        alert(`⚠️ Erreur de connexion avec l'API Stripe : ${err.message || err}.\nSauvegardé localement.`);
      } finally {
        setIsStripeSyncing(false);
      }
    }

    const created = {
      code: codeUpper,
      discountType: newPromoCode.discountType as 'percentage' | 'fixed',
      discountValue: Number(newPromoCode.discountValue) || 10,
      isActive: newPromoCode.isActive !== false,
      stripeSynced: isSynced || (stripeConfigured && newPromoCode.stripeSynced !== false),
      courseId: newPromoCode.courseId === 'all' ? undefined : newPromoCode.courseId
    };

    const updated = [...promoCodes, created];
    savePromoCodesToStorage(updated);

    setNewPromoCode({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      isActive: true,
      stripeSynced: true,
      courseId: 'all'
    });
  };

  const handleDuplicateCourse = (course: Course) => {
    const uniqueSuffix = Date.now().toString().slice(-4);
    const duplicated: Course = {
      ...course,
      id: `${course.id}-copie-${uniqueSuffix}`,
      title: `${course.title} (Copie)`,
      published: false, // Start as draft
      order: courses.length + 1,
      // Clear payment links to encourage fresh ones
      stripeStandardLink: '',
      stripePromoLink: '',
    };
    setEditingCourse(duplicated);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (course: Course) => {
    setEditingCourse({ ...course });
    setIsFormOpen(true);
  };

  const handleOpenAddForm = () => {
    setEditingCourse({
      id: 'nouveau-cours-' + Date.now(),
      title: '',
      slogan: '',
      category: 'Intelligence Artificielle',
      duration: '4h de formation',
      lessonsCount: 20,
      modulesCount: 5,
      level: 'Tous niveaux',
      rating: 5.0,
      reviewsCount: 1,
      price: 299,
      originalPrice: 449,
      gradient: 'from-blue-600 to-indigo-700',
      accentColor: '#204289',
      description: '',
      outcomes: ['Savoir concevoir un projet complet', 'Apprendre pas à pas', 'Maitriser les outils innovants'],
      audience: ['Architectes', 'Décorateurs', 'Créateurs d\'espace'],
      includes: ['Accès à vie', 'Ressources de formation', 'Support formateur'],
      modules: [
        { title: 'Module 1 : Introduction', duration: '30 min', lessons: ['Leçon 1', 'Leçon 2'] }
      ],
      testimonials: [
        { name: 'Élève Exemple', role: 'Professionnel', comment: 'Une superbe formation très didactique !', rating: 5 }
      ],
      faq: [
        { q: 'Est-ce adapté aux débutants ?', r: 'Oui, tout à fait !' }
      ],
      published: true,
      featured: false,
      order: courses.length + 1
    });
    setIsFormOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.title || !editingCourse.id) return;

    let finalCourse = { ...editingCourse };

    if (stripeConfigured) {
      setIsStripeSyncing(true);
      try {
        const token = sessionStorage.getItem('l3d_admin_token') || '';
        const response = await fetch('/api/stripe/sync-course', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id: editingCourse.id,
            title: editingCourse.title,
            slogan: editingCourse.slogan,
            price: Number(editingCourse.price),
            originalPrice: Number(editingCourse.originalPrice),
            installmentsEnabled: !!editingCourse.installmentsEnabled,
            installmentsCount: editingCourse.installmentsCount ? Number(editingCourse.installmentsCount) : undefined,
            installmentsPrice: editingCourse.installmentsPrice ? Number(editingCourse.installmentsPrice) : undefined,
            installmentsPromoPrice: editingCourse.installmentsPromoPrice ? Number(editingCourse.installmentsPromoPrice) : undefined,
            stripeInstallmentsPromoLink: editingCourse.stripeInstallmentsPromoLink
          })
        });

        const data = await response.json();
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          sessionStorage.removeItem('l3d_admin_token');
          alert('Session expirée. Veuillez vous reconnecter.');
        } else if (response.ok && data.success) {
          finalCourse.stripeStandardLink = data.stripeStandardLink;
          finalCourse.stripePromoLink = data.stripePromoLink;
          finalCourse.stripeInstallmentsLink = data.stripeInstallmentsLink || null;
          finalCourse.stripeInstallmentsPromoLink = data.stripeInstallmentsPromoLink || editingCourse.stripeInstallmentsPromoLink || null;
          
          let alertMsg = `✓ Formation "${editingCourse.title}" synchronisée sur Stripe !\n\nLien Standard : ${data.stripeStandardLink}\nLien Promo : ${data.stripePromoLink}`;
          if (data.stripeInstallmentsLink) {
            alertMsg += `\nLien Plusieurs Fois : ${data.stripeInstallmentsLink}`;
          }
          if (finalCourse.stripeInstallmentsPromoLink) {
            alertMsg += `\nLien Plusieurs Fois Promo : ${finalCourse.stripeInstallmentsPromoLink}`;
          }
          alert(alertMsg);
        } else {
          alert(`⚠️ Impossible de synchroniser sur Stripe : ${data.error || 'Erreur inconnue'}.\nLa formation est sauvegardée localement.`);
        }
      } catch (err: any) {
        alert(`⚠️ Erreur de connexion avec l'API Stripe : ${err.message || err}.\nSauvegardée localement.`);
      } finally {
        setIsStripeSyncing(false);
      }
    }

    const exists = courses.some(c => c.id === finalCourse.id);
    let updated: Course[];

    if (exists) {
      updated = courses.map(c => c.id === finalCourse.id ? (finalCourse as Course) : c);
    } else {
      updated = [...courses, finalCourse as Course];
    }

    saveCoursesToStorage(updated);
    setIsFormOpen(false);
    setEditingCourse(null);
  };

  // --- FILTERS ---
  const publicPublishedCourses = courses.filter(c => c.published);

  const filteredCourses = publicPublishedCourses.filter(course => {
    const isPromo = course.originalPrice > course.price;
    const matchPromo = !showOnlyPromos || isPromo;
    const matchCategory = selectedCategory === 'Tous' || course.category === selectedCategory;
    const matchLevel = selectedLevel === 'Tous' || 
                       course.level === selectedLevel || 
                       (selectedLevel === 'Débutant' && course.level.includes('Débutant')) ||
                       (selectedLevel === 'Intermédiaire' && course.level.includes('Intermédiaire')) ||
                       (selectedLevel === 'Avancé' && course.level.includes('Avancé'));
    return matchPromo && matchCategory && matchLevel;
  });

  const categories = ['Tous', 'Modélisation', 'Rendu 3D', 'Intelligence Artificielle', 'Workflow'];
  const levels = ['Tous', 'Débutant', 'Intermédiaire', 'Avancé'];

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      {/* Design Tokens & Theme Variable Definitions */}
      <style>{`
        :root {
          --color-brand-primary: #204289; /* Deep Blue Les Créateurs 3D */
          --color-brand-accent: #06bcbf;  /* Cyan Action Button */
          --color-brand-accent-hover: #05a5a7;
          --color-brand-dark: #0f172a;
          --color-brand-light: #f8fafc;
        }
      `}</style>

      <AnimatePresence mode="wait">
        
        {/* --- 1. ADMIN MODE OVERLAY (AUTHENTICATION OR BACKEND VIEW) --- */}
        {isAdminView ? (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-grow pt-8 pb-20 px-6 bg-slate-950 text-white"
          >
            <div className="max-w-6xl mx-auto">
              
              {/* ADMIN HEADER */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-500/10 text-[#06bcbf] rounded-2xl flex items-center justify-center border border-teal-500/20">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white">Espace d'Administration Privé</h1>
                    <p className="text-slate-400 text-sm">Gestion en temps réel du catalogue de formations de Sylvain</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAdminView(false)}
                    className="px-4 py-2 border border-slate-800 text-slate-300 hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer"
                  >
                    Quitter l'Admin
                  </button>
                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Se Déconnecter
                    </button>
                  )}
                </div>
              </div>

              {/* AUTH SCREEN IF NOT LOGGED IN */}
              {!isAuthenticated ? (
                <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden space-y-6">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#06bcbf]/10 blur-[80px] pointer-events-none"></div>
                  
                  <div className="text-center">
                    <Unlock className="w-10 h-10 text-[#06bcbf] mx-auto mb-3 animate-pulse" />
                    <h3 className="text-xl font-black text-white">Connexion Administrateur</h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      L'accès à l'espace d'administration du catalogue est sécurisé de manière robuste au niveau client et serveur. Seul le propriétaire est autorisé :
                    </p>
                    <div className="mt-3 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800/80 inline-block">
                      <span className="text-[#06bcbf] font-mono text-xs font-bold">lescreateurs3d@gmail.com</span>
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-400 leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {unauthorizedDomainError && (
                    <div className="p-5 bg-amber-950/40 border border-amber-900/50 rounded-2xl flex flex-col gap-3 text-xs text-amber-300 leading-relaxed shadow-xl my-2">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                        <div>
                          <h4 className="font-bold text-sm text-amber-200 mb-1">🔑 Solution de Connexion Directe</h4>
                          <p className="mb-2 text-[11px] text-amber-300/90">
                            Firebase Authentication bloque la connexion Google directe sur <strong>{window.location.hostname}</strong> car ce domaine personnalisé n'est pas autorisé.
                          </p>
                          <p className="mb-2 text-[11px] text-amber-300/90 font-semibold">
                            Puisque vous n'avez pas les droits d'écriture sur les paramètres de ce projet Firebase système (ce qui est normal pour cet environnement), 
                            la solution est de vous connecter via l'une des adresses système officielles déjà autorisées à 100%.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                        <span className="font-bold text-amber-200 text-[11px] block">👉 Comment sauvegarder vos prix définitivement en 1 minute :</span>
                        
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-300">
                            1. Cliquez sur le bouton ci-dessous pour ouvrir l'espace d'administration sécurisé officiel :
                          </p>
                          <a 
                            href="https://les-cr-ateurs-3d-680100005101.europe-west2.run.app/#formations-catalog?admin=true" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#06bcbf] hover:bg-[#05a5a7] text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-lg w-full justify-center"
                          >
                            Ouvrir l'Espace Admin Autorisé ↗
                          </a>
                        </div>

                        <p className="text-[10px] text-slate-400">
                          2. Sur cette page, cliquez sur <strong>Se connecter avec Google</strong> et choisissez votre adresse <strong>lescreateurs3d@gmail.com</strong>.
                        </p>
                        <p className="text-[10px] text-slate-400">
                          3. Faites vos modifications de prix et enregistrez. Les modifications seront alors <strong>définitivement sauvegardées dans Firestore</strong> et seront immédiatement visibles sur votre site principal <span className="text-[#06bcbf] font-mono">lescreateurs3d.com</span> !
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Method 1: Google Login */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-black tracking-widest uppercase text-slate-500">Option 1: Google Sign-In (Recommandé)</span>
                      
                      {isInIframe && (
                        <div className="p-4 bg-amber-950/40 border border-amber-900/50 rounded-2xl flex items-start gap-3 text-xs text-amber-300 leading-relaxed shadow-xl my-2">
                          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                          <div>
                            <h4 className="font-bold text-amber-200 mb-0.5">⚠️ Cadre Aperçu (iFrame) Détecté</h4>
                            <p className="text-[11px] text-amber-300/90 mb-2">
                              Le navigateur bloque l'ouverture des fenêtres d'authentification Google sécurisées (Popups) lorsqu'elles sont déclenchées depuis l'intérieur d'un cadre d'intégration (iFrame).
                            </p>
                            <a 
                              href={window.location.origin + window.location.pathname} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06bcbf] hover:bg-[#05a5a7] text-slate-950 font-black text-[11px] rounded-lg transition-all cursor-pointer shadow"
                            >
                              Ouvrir l'application dans un nouvel onglet ↗
                            </a>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleGoogleLogin}
                        disabled={isUploadingMedia}
                        className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-950 font-black text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50"
                      >
                        {isUploadingMedia ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                          </svg>
                        )}
                        {isUploadingMedia ? "Connexion en cours..." : "Se connecter avec Google"}
                      </button>
                      
                      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] text-blue-300 leading-normal">
                        <strong>Note d'intégration :</strong> Si vous obtenez l'erreur <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-200">auth/unauthorized-domain</code>, ajoutez ce domaine d'aperçu dans votre <em>Console Firebase → Authentication → Paramètres → Domaines autorisés</em>, ou utilisez l'Option de secours ci-dessous.
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold">OU</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    {/* Method 2: Fallback Passcode */}
                    <form onSubmit={handlePasscodeLogin} className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[10px] font-black tracking-widest uppercase text-slate-500">Option 2: Mot de Passe de Secours (Zéro Config)</label>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            value={adminPasscode}
                            onChange={(e) => setAdminPasscode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-[#06bcbf] text-white px-4 py-2.5 rounded-xl text-xs outline-none transition-all"
                            placeholder="Entrez le mot de passe administrateur"
                          />
                          <button
                            type="submit"
                            disabled={isUploadingMedia || !adminPasscode.trim()}
                            className="px-4 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            Valider
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                          Saisissez le mot de passe administrateur. La vérification et la session sécurisée sont gérées en toute sécurité côté serveur.
                        </p>
                      </div>
                    </form>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Sécurité renforcée Firebase Auth & Firestore Rules
                    </p>
                  </div>
                </div>
              ) : (
                
                // AUTHENTICATED ADMIN DASHBOARD
                <div className="space-y-8">
                  
                  {sessionStorage.getItem('l3d_admin_token')?.startsWith('l3d_sess_') && (
                    <div className="p-5 bg-amber-950/40 border border-amber-900/50 rounded-2xl flex items-start gap-3.5 text-xs text-amber-400 leading-relaxed shadow-xl">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
                      <div>
                        <h4 className="font-bold text-sm text-amber-300 mb-1">⚠️ Session Temporaire (Sauvegarde Restreinte)</h4>
                        <p className="mb-2">
                          Vous êtes actuellement connecté avec le <strong>mot de passe de secours</strong>. En raison des restrictions de sécurité de Google Cloud / Firebase (accès inter-projets), 
                          le serveur ne peut pas écrire directement dans votre base de données permanente Firestore avec cette méthode. 
                          Vos modifications de prix et de cours sont stockées temporairement en mémoire et seront <strong>définitivement perdues au prochain redémarrage automatique du serveur</strong>.
                        </p>
                        <p className="font-semibold text-amber-200">
                          👉 Pour enregistrer vos prix et vos cours de manière permanente et sécurisée dans la base de données, veuillez vous déconnecter puis utiliser l'<strong>Option 1 : Se connecter avec Google</strong> avec l'adresse <strong>lescreateurs3d@gmail.com</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* METRICS ROW */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Formations</p>
                        <p className="text-2xl font-black">{courses.length}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                        <Eye className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">En Ligne (Publiques)</p>
                        <p className="text-2xl font-black text-emerald-400">{courses.filter(c => c.published).length}</p>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Promotions Actives</p>
                        <p className="text-2xl font-black text-amber-400">
                          {courses.filter(c => c.originalPrice > c.price).length}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#06bcbf]/10 text-[#06bcbf] rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Membres (Simulé)</p>
                        <p className="text-2xl font-black text-[#06bcbf]">1 240</p>
                      </div>
                    </div>
                  </div>


                  {/* AUTOMATION CONNECTION STATUS ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* STRIPE AUTOMATION CONNECTION STATUS */}
                    <div className={`border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      stripeConfigured 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          stripeConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <Zap className={`w-5 h-5 ${stripeConfigured ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white flex items-center gap-2">
                            {stripeConfigured ? '✓ Synchronisation Stripe Active' : '⚠️ Stripe Incomplet'}
                            {isStripeSyncing && (
                              <span className="text-[10px] font-bold text-blue-400 animate-pulse bg-blue-500/10 px-2 py-0.5 rounded-full uppercase ml-2">Sync...</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            {stripeConfigured 
                              ? 'Vos prix, formations et codes promos sont synchronisés en temps réel.'
                              : 'Renseignez la variable STRIPE_SECRET_KEY.'}
                          </p>
                        </div>
                      </div>
                      {!stripeConfigured && (
                        <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 border border-slate-800 font-mono self-start sm:self-center">
                          STRIPE_SECRET_KEY
                        </div>
                      )}
                    </div>

                    {/* SKOOL AUTOMATION CONNECTION STATUS */}
                    <div className={`border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      skoolConfigured 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          skoolConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <Users className={`w-5 h-5 ${skoolConfigured ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white flex items-center gap-2">
                            {skoolConfigured ? '✓ Liaison School Active' : '⚠️ Liaison School Incomplète'}
                          </p>
                          <p className="text-xs text-slate-300 mt-1">
                            {skoolConfigured 
                              ? 'Les acheteurs recevront automatiquement leur invitation d\'accès sur School.'
                              : 'Renseignez SKOOL_API_KEY et SKOOL_GROUP_ID.'}
                          </p>
                        </div>
                      </div>
                      {!skoolConfigured && (
                        <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 border border-slate-800 font-mono self-start sm:self-center">
                          SKOOL_API_KEY
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ADMIN TABS NAVIGATION */}
                  <div className="flex border-b border-slate-800 gap-2 pb-px">
                    <button
                      type="button"
                      onClick={() => setAdminTab('courses')}
                      className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        adminTab === 'courses'
                          ? 'border-[#06bcbf] text-white bg-slate-900/40'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#06bcbf]" />
                        Catalogue & Tarifs
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('promos')}
                      className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        adminTab === 'promos'
                          ? 'border-amber-400 text-white bg-slate-900/40'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-amber-500" />
                        Codes Promos Stripe
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminTab('security')}
                      className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                        adminTab === 'security'
                          ? 'border-teal-400 text-white bg-slate-900/40'
                          : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-teal-400" />
                        Sécurité & Accès
                      </span>
                    </button>
                  </div>

                  {adminTab === 'courses' && (
                    /* COURSE LIST TABLE */
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h3 className="font-black text-lg text-white">Catalogue des Formations</h3>
                        <button
                          onClick={handleOpenAddForm}
                          className="px-5 py-2.5 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-slate-950 text-xs font-black rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#06bcbf]/10"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter une formation
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-extrabold tracking-wider bg-slate-950/50">
                              <th className="py-4 px-6">Formation</th>
                              <th className="py-4 px-6">Thématique</th>
                              <th className="py-4 px-6">Tarif Public</th>
                              <th className="py-4 px-6 text-center">Statuts</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-sm">
                            {courses.map(course => {
                              const isPromo = course.originalPrice > course.price;
                              const discountPercent = isPromo ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;
                              return (
                                <tr key={course.id} className="hover:bg-slate-800/30 transition-colors">
                                  <td className="py-5 px-6">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className={`w-10 h-10 rounded-lg ${(!course.gradient || !course.gradient.startsWith('#')) ? `bg-gradient-to-br ${course.gradient || 'from-slate-900 to-slate-950'}` : ''} flex items-center justify-center shrink-0`}
                                        style={course.gradient?.startsWith('#') ? { backgroundColor: course.gradient } : undefined}
                                      >
                                        <Play className="w-4 h-4 text-white fill-current" />
                                      </div>
                                      <div>
                                        <p className="font-extrabold text-white text-sm line-clamp-1">{course.title}</p>
                                        <p className="text-slate-400 text-xs line-clamp-1">{course.slogan}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-5 px-6">
                                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-md">
                                      {course.category}
                                    </span>
                                  </td>
                                  <td className="py-5 px-6">
                                    <div className="flex flex-col">
                                      <span className="font-extrabold text-white text-base">{course.price} €</span>
                                      {isPromo && (
                                        <span className="text-slate-500 text-xs line-through">{course.originalPrice} €</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-5 px-6">
                                    <div className="flex items-center justify-center gap-2">
                                      
                                      {/* PUBLISHED TOGGLE BADGE */}
                                      <button
                                        onClick={() => handleTogglePublished(course.id)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                                          course.published 
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                        }`}
                                        title="Cliquer pour changer la visibilité"
                                      >
                                        {course.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {course.published ? 'Publié' : 'Brouillon'}
                                      </button>

                                      {/* PROMO TOGGLE BADGE */}
                                      <button
                                        onClick={() => handleTogglePromo(course.id)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                                          isPromo 
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                        }`}
                                        title="Cliquer pour activer/désactiver la promotion"
                                      >
                                        <Percent className="w-3 h-3" />
                                        {isPromo ? `-${discountPercent}%` : 'Normal'}
                                      </button>

                                      {/* FEATURED TOGGLE BADGE */}
                                      <button
                                        onClick={() => handleToggleFeatured(course.id)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                                          course.featured 
                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                        }`}
                                        title="Cliquer pour mettre à la une"
                                      >
                                        <Flame className="w-3 h-3" />
                                        {course.featured ? 'Une' : 'Standard'}
                                      </button>

                                    </div>
                                  </td>
                                  <td className="py-5 px-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => window.open(`/#formations-catalog?course=${course.id}`, '_blank')}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                        title="Prévisualiser la formation"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDuplicateCourse(course)}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                        title="Dupliquer la formation (Modèle)"
                                      >
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleOpenEditForm(course)}
                                        className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                        title="Éditer la fiche"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        className="w-8 h-8 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                                        title="Supprimer la formation"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminTab === 'promos' && (
                    /* PROMO CODES PANEL */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* LEFT: PROMO CODES LIST */}
                      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
                        <div>
                          <div className="p-6 border-b border-slate-800">
                            <h3 className="font-black text-lg text-white">Codes Promotionnels Actifs</h3>
                            <p className="text-xs text-slate-400 mt-1">Codes utilisables par vos étudiants à l'étape du panier ou préremplis dans les liens Stripe.</p>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-extrabold tracking-wider bg-slate-950/50">
                                  <th className="py-4 px-6">Code Coupon</th>
                                  <th className="py-4 px-6">Réduction</th>
                                  <th className="py-4 px-6">Applicable sur</th>
                                  <th className="py-4 px-6 text-center">Stripe Synced</th>
                                  <th className="py-4 px-6 text-center">Status</th>
                                  <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-sm">
                                {promoCodes.map((promo) => {
                                  const associatedCourse = courses.find(c => c.id === promo.courseId);
                                  return (
                                    <tr key={promo.code} className="hover:bg-slate-800/30 transition-colors">
                                      <td className="py-4 px-6">
                                        <span className="font-mono font-black text-sm text-[#06bcbf] bg-[#06bcbf]/5 px-2.5 py-1.5 rounded-lg border border-[#06bcbf]/10">
                                          {promo.code}
                                        </span>
                                      </td>
                                      <td className="py-4 px-6 font-extrabold text-white">
                                        {promo.discountType === 'percentage' ? `-${promo.discountValue}%` : `-${promo.discountValue} €`}
                                      </td>
                                      <td className="py-4 px-6 text-xs text-slate-300">
                                        {associatedCourse ? (
                                          <span className="font-bold line-clamp-1 text-blue-400" title={associatedCourse.title}>
                                            {associatedCourse.title}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-medium">Toutes les formations</span>
                                        )}
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        {promo.stripeSynced ? (
                                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                                            <Check className="w-3 h-3" />
                                            Active
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase">
                                            Locale seule
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-4 px-6 text-center">
                                        <button
                                          onClick={() => handleTogglePromoCodeActive(promo.code)}
                                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                                            promo.isActive
                                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                          }`}
                                        >
                                          {promo.isActive ? 'Actif' : 'Désactivé'}
                                        </button>
                                      </td>
                                      <td className="py-4 px-6 text-right">
                                        <button
                                          onClick={() => handleDeletePromoCode(promo.code)}
                                          className="w-8 h-8 rounded-lg hover:bg-red-950/30 text-slate-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                                          title="Supprimer ce code promo"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {promoCodes.length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="py-8 text-center text-slate-500 text-xs font-bold">
                                      Aucun code promotionnel configuré. Créez-en un à droite !
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* STRIPE EDUCATIONAL INTENT COMPONENT */}
                        <div className="p-6 border-t border-slate-800 bg-slate-950/40">
                          <h4 className="font-extrabold text-xs text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            Comment fonctionne la synchronisation avec Stripe ?
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            L'application <span className="text-white font-bold">ne requiert pas de serveur API complexe</span> ou de clés secrètes pour fonctionner. Pour que les coupons soient effectifs au paiement :
                          </p>
                          <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1.5 mt-2 ml-1">
                            <li>Créez un Code de Promotion (ex : <code className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">SYLVAIN50</code>) sur votre <span className="text-blue-400 font-bold">Dashboard Stripe &gt; Bons de réduction</span>.</li>
                            <li>Ajoutez le <span className="text-white font-bold">même code identique</span> ici dans l'application avec l'option <span className="text-emerald-400 font-bold">"Synchronisé avec Stripe"</span> active.</li>
                            <li>L'application injectera dynamiquement le paramètre prérempli sur le lien Stripe standard ou promo pour appliquer le coupon instantanément sans saisie manuelle de l'étudiant !</li>
                          </ol>
                        </div>
                      </div>

                      {/* RIGHT: CREATE PROMO CODE FORM */}
                      <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                          <h3 className="font-black text-base text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-[#06bcbf]" />
                            Nouveau Code Promo
                          </h3>

                          <form onSubmit={handleCreatePromoCode} className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                                Code Promo (ex: BLACKFRIDAY)
                              </label>
                              <input
                                type="text"
                                placeholder="BLACKFRIDAY"
                                required
                                value={newPromoCode.code || ''}
                                onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-[#06bcbf] rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                                  Type
                                </label>
                                <select
                                  value={newPromoCode.discountType || 'percentage'}
                                  onChange={(e) => setNewPromoCode({ ...newPromoCode, discountType: e.target.value as 'percentage' | 'fixed' })}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#06bcbf] rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none"
                                >
                                  <option value="percentage">Pourcentage (%)</option>
                                  <option value="fixed">Montant fixe (€)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                                  Valeur
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={newPromoCode.discountValue || ''}
                                  onChange={(e) => setNewPromoCode({ ...newPromoCode, discountValue: parseInt(e.target.value) || 0 })}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-[#06bcbf] rounded-xl px-3 py-2.5 text-xs text-white outline-none font-black"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                                Formation cible
                              </label>
                              <select
                                value={newPromoCode.courseId || 'all'}
                                onChange={(e) => setNewPromoCode({ ...newPromoCode, courseId: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-[#06bcbf] rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none"
                              >
                                <option value="all">Toutes les formations (Global)</option>
                                {courses.map(c => (
                                  <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                              </select>
                            </div>

                            <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
                              <label className="flex items-start gap-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newPromoCode.stripeSynced !== false}
                                  onChange={(e) => setNewPromoCode({ ...newPromoCode, stripeSynced: e.target.checked })}
                                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-[#06bcbf] focus:ring-[#06bcbf] cursor-pointer"
                                />
                                <div>
                                  <p className="text-xs font-bold text-white leading-tight">Code synchronisé sur Stripe</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">L'application transmettra automatiquement ce code à Stripe lors de l'inscription pour préremplir la réduction.</p>
                                </div>
                              </label>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                            >
                              Créer le code promo
                            </button>
                          </form>
                        </div>
                      </div>

                    </div>
                  )}

                  {adminTab === 'security' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-[#06bcbf] flex items-center justify-center border border-teal-500/20">
                          <Lock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-white">Sécurité de l'Espace Admin</h3>
                          <p className="text-xs text-slate-400">Authentification Google Sign-In & Règles de Sécurité Firestore.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                          <p className="text-xs text-slate-300 leading-relaxed">
                            L'Espace Admin est dorénavant sécurisé de manière robuste par <strong className="text-[#06bcbf]">Firebase Authentication</strong> et des règles d'accès strictes côté serveur (<strong className="text-[#06bcbf]">Firestore Rules</strong>).
                          </p>
                          <ul className="text-[11px] text-slate-400 space-y-2 list-disc list-inside">
                            <li><strong className="text-slate-200">Sécurité Côté Serveur :</strong> Personne d'autre que le compte propriétaire (<code className="text-[#06bcbf] font-mono">lescreateurs3d@gmail.com</code>) ne peut lire les statistiques de ventes ou modifier vos formations, y compris si un utilisateur tente de manipuler le code client.</li>
                            <li><strong className="text-slate-200">Accès Authentifié :</strong> Les formulaires de connexion basés sur des mots de passe génériques stockés localement ont été entièrement supprimés et remplacés par l'authentification officielle Google.</li>
                          </ul>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-2xl space-y-2">
                        <p className="text-xs font-bold text-amber-400">Rappel pour l'accès caché :</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Pour accéder à cette page d'administration, vous pouvez cliquer <strong className="text-white">3 fois rapidement</strong> sur le copyright en bas de page (<em className="text-[#06bcbf]">"© 2026 Les Créateurs 3D"</em>), ou ajouter <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">#createurs3d-admin</code> ou <code className="text-emerald-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">?key=createurs3d</code> à la fin de l'adresse de votre site dans votre navigateur.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COUPLING FIRESTORE INTEGRATION GUIDE */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                    <h4 className="font-extrabold text-base text-white mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#06bcbf]" />
                      Note d'intégration technique Firestore (Écosystème IzyPano)
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Ce catalogue est prêt pour une intégration client directe sur Firebase. Dans un environnement de production, les appels de lecture public et les écritures administratives s'intégreront avec le SDK Firestore de la façon suivante :
                    </p>
                    <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] overflow-x-auto font-mono leading-relaxed border border-slate-800">
{`// 1. Lecture publique des formations (FormationsCatalogPage.tsx)
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../lib/firebase";

const loadFormations = async () => {
  const q = query(collection(db, "formations"), where("published", "==", true), orderBy("order", "asc"));
  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setCourses(data);
};

// 2. Écriture administrative (Sécurisée par Firebase Rules)
import { doc, setDoc, deleteDoc } from "firebase/firestore";
const handleSave = async (course) => {
  await setDoc(doc(db, "formations", course.id), course);
};`}
                    </pre>
                  </div>

                </div>
              )}
            </div>

            {/* EDIT/ADD COURSE SLIDER FORM */}
            <AnimatePresence>
              {isFormOpen && editingCourse && (
                <div className="fixed inset-0 z-50 flex flex-col items-center bg-slate-900">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="w-full max-w-6xl bg-slate-900 text-white h-full overflow-y-auto p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                      <h3 className="text-xl font-black text-[#06bcbf]">
                        {courses.some(c => c.id === editingCourse.id) ? 'Éditer la Formation' : 'Nouvelle Formation'}
                      </h3>
                      <button
                        onClick={() => { setIsFormOpen(false); setEditingCourse(null); }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>

                    <form onSubmit={handleSaveCourse} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID Unique (Slug URL)</label>
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
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Titre de la formation</label>
                        <input
                          type="text"
                          value={editingCourse.title || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Slogan / Accroche</label>
                        <input
                          type="text"
                          value={editingCourse.slogan || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, slogan: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thématique</label>
                          <select
                            value={editingCourse.category || 'Intelligence Artificielle'}
                            onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as any })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                          >
                            <option value="Modélisation">Modélisation</option>
                            <option value="Rendu 3D">Rendu 3D</option>
                            <option value="Intelligence Artificielle">Intelligence Artificielle</option>
                            <option value="Workflow">Workflow</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Niveau</label>
                          <input
                            type="text"
                            value={editingCourse.level || 'Tous niveaux'}
                            onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Couleur Arrière-plan</label>
                          <div className="flex gap-2">
                            <select
                              value={editingCourse.gradient?.startsWith('#') ? 'custom' : (editingCourse.gradient || 'from-blue-600 to-indigo-700')}
                              onChange={(e) => {
                                if (e.target.value === 'custom') {
                                  setEditingCourse({ ...editingCourse, gradient: '#204289' });
                                } else {
                                  setEditingCourse({ ...editingCourse, gradient: e.target.value });
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                            >
                              <option value="from-teal-600 via-cyan-600 to-blue-700">Océan (Teal/Bleu)</option>
                              <option value="from-amber-500 to-orange-600">Feu (Orange/Ambre)</option>
                              <option value="from-indigo-600 to-violet-800">Mystique (Violet)</option>
                              <option value="from-blue-600 to-indigo-700">Classique (Bleu profond)</option>
                              <option value="from-emerald-500 to-teal-700">Nature (Émeraude)</option>
                              <option value="from-rose-500 to-red-600">Passion (Rose/Rouge)</option>
                              <option value="from-slate-700 to-slate-900">Sombre (Gris/Noir)</option>
                              <option value="custom">Personnalisée (Couleur unie)</option>
                            </select>
                            {editingCourse.gradient?.startsWith('#') && (
                              <input
                                type="color"
                                value={editingCourse.gradient}
                                onChange={(e) => setEditingCourse({ ...editingCourse, gradient: e.target.value })}
                                className="w-12 h-[38px] bg-slate-950 border border-slate-800 rounded-xl cursor-pointer p-0.5 shrink-0"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Durée (Vidéo)</label>
                          <input
                            type="text"
                            value={editingCourse.duration || '4h de formation'}
                            onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre de Leçons</label>
                          <input
                            type="number"
                            value={editingCourse.lessonsCount || 20}
                            onChange={(e) => setEditingCourse({ ...editingCourse, lessonsCount: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarif de base (€)</label>
                          <input
                            type="number"
                            value={editingCourse.originalPrice || 0}
                            onChange={(e) => setEditingCourse({ ...editingCourse, originalPrice: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarif remisé (€)</label>
                          <input
                            type="number"
                            value={editingCourse.price || 0}
                            onChange={(e) => setEditingCourse({ ...editingCourse, price: parseInt(e.target.value) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                          Deadline de promotion (Optionnel)
                        </label>
                        <input
                          type="datetime-local"
                          value={editingCourse.promoDeadline || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, promoDeadline: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Uniquement actif si le tarif remisé est inférieur au tarif de base. Affiche un compte à rebours animé sur les tuiles et la page de vente.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                          Label de promotion personnalisé (Optionnel)
                        </label>
                        <input
                          type="text"
                          value={editingCourse.promoLabel || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, promoLabel: e.target.value })}
                          placeholder="Ex: Vente Flash active, Offre Spéciale, Lancement"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#06bcbf]"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Texte affiché sur les badges et la bannière du compte à rebours (par défaut : "Vente Flash active" ou "Promo active").
                        </p>
                      </div>

                      {/* AUTOMATED STRIPE GENERATOR CARD */}
                      <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${stripeConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                            Synchronisation Stripe {stripeConfigured ? 'Active' : 'Inactive'}
                          </span>
                          {stripeConfigured && (
                            <button
                              type="button"
                              disabled={isStripeSyncing}
                              onClick={async () => {
                                if (!editingCourse.title) {
                                  alert("Veuillez d'abord saisir un titre de formation.");
                                  return;
                                }
                                setIsStripeSyncing(true);
                                try {
                                  const token = sessionStorage.getItem('l3d_admin_token') || '';
                                  const response = await fetch('/api/stripe/sync-course', {
                                    method: 'POST',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      id: editingCourse.id,
                                      title: editingCourse.title,
                                      slogan: editingCourse.slogan,
                                      price: Number(editingCourse.price),
                                      originalPrice: Number(editingCourse.originalPrice),
                                      installmentsEnabled: !!editingCourse.installmentsEnabled,
                                      installmentsCount: editingCourse.installmentsCount ? Number(editingCourse.installmentsCount) : undefined,
                                      installmentsPrice: editingCourse.installmentsPrice ? Number(editingCourse.installmentsPrice) : undefined
                                    })
                                  });
                                  const data = await response.json();
                                  if (response.ok && data.success) {
                                    setEditingCourse(prev => prev ? ({
                                      ...prev,
                                      stripeStandardLink: data.stripeStandardLink,
                                      stripePromoLink: data.stripePromoLink,
                                      stripeInstallmentsLink: data.stripeInstallmentsLink || undefined
                                    }) : null);
                                    
                                    let alertMsg = `✓ Liens Stripe générés avec succès !\n\nLien Standard : ${data.stripeStandardLink}\nLien Promo : ${data.stripePromoLink}`;
                                    if (data.stripeInstallmentsLink) {
                                      alertMsg += `\nLien Plusieurs Fois : ${data.stripeInstallmentsLink}`;
                                    }
                                    alert(alertMsg);
                                  } else {
                                    alert(`⚠️ Erreur : ${data.error || 'Impossible de synchroniser.'}`);
                                  }
                                } catch (err: any) {
                                  alert(`⚠️ Erreur de connexion : ${err.message || err}`);
                                } finally {
                                  setIsStripeSyncing(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-[#06bcbf] hover:bg-[#05a5a7] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              {isStripeSyncing ? 'Génération...' : 'Générer via Stripe'}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {stripeConfigured 
                            ? "Votre clé Stripe secrète est détectée. Saisissez le titre et les tarifs, puis cliquez sur 'Générer via Stripe' pour créer automatiquement le produit et remplir les liens ci-dessous !" 
                            : "Aucune clé secrète Stripe détectée (STRIPE_SECRET_KEY dans .env). Configurez votre clé Stripe dans le panneau des Secrets pour générer vos liens automatiquement."
                          }
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#06bcbf] uppercase mb-1">Lien Stripe Standard</label>
                          <input
                            type="url"
                            placeholder="https://buy.stripe.com/..."
                            value={editingCourse.stripeStandardLink || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, stripeStandardLink: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-amber-400 uppercase mb-1">Lien Stripe Promo (Timer)</label>
                          <input
                            type="url"
                            placeholder="https://buy.stripe.com/..."
                            value={editingCourse.stripePromoLink || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, stripePromoLink: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 -mt-2">
                        Si un code promo valide est saisi par l'étudiant et est configuré comme "Synchronisé avec Stripe", l'application ajoutera automatiquement <code className="text-[#06bcbf] font-mono">?prefilled_promo_code=CODE</code> au lien sélectionné pour l'appliquer au checkout Stripe.
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-[#f26322] uppercase mb-1">Identifiant du cours sur School (Skool Course ID)</label>
                        <input
                          type="text"
                          placeholder="e.g. ia-creatives-skool"
                          value={editingCourse.skoolCourseId || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, skoolCourseId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#f26322]"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Saisissez le "Course ID" exact défini sur School. Lors d'un achat Stripe réussi, notre webhook utilisera cet identifiant pour inscrire automatiquement l'étudiant sur School.
                        </p>
                      </div>

                      {/* Options de paiement en plusieurs fois */}
                      <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="installmentsEnabled"
                            checked={editingCourse.installmentsEnabled || false}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              const newCourse = { ...editingCourse, installmentsEnabled: isEnabled };
                              if (!isEnabled) {
                                delete newCourse.stripeInstallmentsLink;
                                delete newCourse.stripeInstallmentsPromoLink;
                                delete newCourse.installmentsCount;
                                delete newCourse.installmentsPrice;
                                delete newCourse.installmentsPromoPrice;
                              }
                              setEditingCourse(newCourse);
                            }}
                            className="w-4 h-4 text-[#06bcbf] bg-slate-900 border-slate-800 rounded focus:ring-[#06bcbf]"
                          />
                          <label htmlFor="installmentsEnabled" className="text-xs font-bold text-[#06bcbf] uppercase cursor-pointer select-none">
                            Activer la possibilité de payer en plusieurs fois (3x, 4x, etc.)
                          </label>
                        </div>

                        {editingCourse.installmentsEnabled && (
                          <div className="space-y-4 pt-3 border-t border-slate-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre de mensualités</label>
                                <input
                                  type="number"
                                  min="2"
                                  max="12"
                                  placeholder="3"
                                  value={editingCourse.installmentsCount || ''}
                                  onChange={(e) => setEditingCourse({ ...editingCourse, installmentsCount: e.target.value ? Number(e.target.value) : undefined })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Montant de chaque mensualité (EUR) <span className="text-[10px] text-slate-500 font-normal">(Optionnel)</span></label>
                                <input
                                  type="number"
                                  placeholder="Laisser vide pour calcul automatique"
                                  value={editingCourse.installmentsPrice || ''}
                                  onChange={(e) => setEditingCourse({ ...editingCourse, installmentsPrice: e.target.value ? Number(e.target.value) : undefined })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Montant mensualité PROMO (EUR) <span className="text-[10px] text-slate-500 font-normal">(Optionnel)</span></label>
                                <input
                                  type="number"
                                  placeholder="Prix promo mensualité"
                                  value={editingCourse.installmentsPromoPrice || ''}
                                  onChange={(e) => setEditingCourse({ ...editingCourse, installmentsPromoPrice: e.target.value ? Number(e.target.value) : undefined })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                                />
                              </div>
                            </div>
                              <div>
                              <label className="block text-xs font-bold text-teal-400 uppercase mb-1">Lien Stripe Paiement Plusieurs Fois</label>
                              <input
                                type="url"
                                placeholder="https://buy.stripe.com/..."
                                value={editingCourse.stripeInstallmentsLink || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, stripeInstallmentsLink: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-amber-400 uppercase mb-1">Lien Stripe Plusieurs Fois Promo</label>
                              <input
                                type="url"
                                placeholder="https://buy.stripe.com/..."
                                value={editingCourse.stripeInstallmentsPromoLink || ''}
                                onChange={(e) => setEditingCourse({ ...editingCourse, stripeInstallmentsPromoLink: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL de la vidéo (MP4 ou Vimeo embed)</label>
                          <input
                            type="url"
                            placeholder="/videos/mon-cours.mp4 ou https://player.vimeo.com/video/..."
                            value={editingCourse.videoUrl || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, videoUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL de l'image (Firebase ou Externe)</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={editingCourse.imageUrl || ''}
                            onChange={(e) => setEditingCourse({ ...editingCourse, imageUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Code d'intégration Vimeo (Optionnel)</label>
                        <input
                          type="text"
                          placeholder="Ex: <iframe src=...>"
                          value={editingCourse.vimeoEmbedCode || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, vimeoEmbedCode: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#06bcbf]"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="checkbox"
                          checked={!!editingCourse.showCouponField}
                          onChange={(e) => setEditingCourse({ ...editingCourse, showCouponField: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#06bcbf] focus:ring-[#06bcbf]"
                        />
                        <label className="text-xs font-bold text-slate-300">Afficher le champ "Code Promo"</label>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                          {isUploadingMedia ? 'Chargement en cours...' : 'Ou charger un nouveau média (Vidéo ou Photo)'}
                        </label>
                        <input
                          type="file"
                          accept="video/mp4,video/x-m4v,video/*,image/*"
                          disabled={isUploadingMedia}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingMedia(true);
                            try {
                              const fileRef = ref(storage, `catalog-media/${Date.now()}_${file.name}`);
                              await uploadBytes(fileRef, file);
                              const downloadUrl = await getDownloadURL(fileRef);
                              
                              if (file.type.startsWith('image/')) {
                                setEditingCourse({ ...editingCourse, imageUrl: downloadUrl, videoUrl: '' });
                              } else {
                                setEditingCourse({ ...editingCourse, videoUrl: downloadUrl, imageUrl: '' });
                              }
                            } catch (err) {
                              console.error("Upload failed", err);
                              alert("Erreur lors de l'upload du média.");
                            } finally {
                              setIsUploadingMedia(false);
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#06bcbf] file:text-white hover:file:bg-[#05a5a7] outline-none disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description courte (Page de vente)</label>
                        <textarea
                          value={editingCourse.description || ''}
                          onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#06bcbf]"
                          required
                        />
                      </div>

                      {/* OBJECTIFS ET BÉNÉFICES */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                        <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider">Bénéfices & Résultats (Bullet Points)</h4>
                        <div className="space-y-2">
                          {(editingCourse.outcomes || []).map((outcome, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={outcome}
                                onChange={(e) => {
                                  const copy = [...(editingCourse.outcomes || [])];
                                  copy[idx] = e.target.value;
                                  setEditingCourse({ ...editingCourse, outcomes: copy });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#06bcbf]"
                                placeholder="Résultat ou compétence acquise..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = (editingCourse.outcomes || []).filter((_, i) => i !== idx);
                                  setEditingCourse({ ...editingCourse, outcomes: copy });
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse({
                                ...editingCourse,
                                outcomes: [...(editingCourse.outcomes || []), '']
                              });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un résultat clé
                          </button>
                        </div>
                      </div>

                      {/* INCLUS DANS LA FORMATION */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                        <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider">Ce qui est inclus dans l'accès</h4>
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#06bcbf]"
                                placeholder="Ex: Accès à vie 24h/24..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = (editingCourse.includes || []).filter((_, i) => i !== idx);
                                  setEditingCourse({ ...editingCourse, includes: copy });
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse({
                                ...editingCourse,
                                includes: [...(editingCourse.includes || []), '']
                              });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un élément inclus
                          </button>
                        </div>
                      </div>

                      {/* PUBLIC CIBLE */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-3">
                        <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider">Public cible</h4>
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#06bcbf]"
                                placeholder="Ex: Décorateurs, Architectes..."
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = (editingCourse.audience || []).filter((_, i) => i !== idx);
                                  setEditingCourse({ ...editingCourse, audience: copy });
                                }}
                                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse({
                                ...editingCourse,
                                audience: [...(editingCourse.audience || []), '']
                              });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un public cible
                          </button>
                        </div>
                      </div>

                      {/* PROGRAMME PAR MODULES */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider">Programme / Syllabus (Modules)</h4>
                          <span className="text-[10px] bg-[#06bcbf]/10 text-[#06bcbf] font-bold px-2 py-0.5 rounded">
                            {(editingCourse.modules || []).length} module(s)
                          </span>
                        </div>
                        <div className="space-y-4">
                          {(editingCourse.modules || []).map((mod, idx) => {
                            const lessonsText = (mod.lessons || []).join('\n');
                            return (
                              <div key={idx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const copy = (editingCourse.modules || []).filter((_, i) => i !== idx);
                                    setEditingCourse({ 
                                      ...editingCourse, 
                                      modules: copy,
                                      modulesCount: copy.length
                                    });
                                  }}
                                  className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-850 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                  title="Supprimer ce module"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                
                                <span className="text-[10px] font-black text-[#06bcbf] uppercase bg-[#06bcbf]/5 px-2 py-0.5 rounded border border-[#06bcbf]/10">Module {idx + 1}</span>
                                
                                <div className="grid grid-cols-1 gap-2 pt-1">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Titre du module</label>
                                    <input
                                      type="text"
                                      value={mod.title}
                                      onChange={(e) => {
                                        const copy = [...(editingCourse.modules || [])];
                                        copy[idx] = { ...copy[idx], title: e.target.value };
                                        setEditingCourse({ ...editingCourse, modules: copy });
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                      placeholder="Ex: Module 1 : Principes fondamentaux"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Durée (ex: '45 min • 4 leçons')</label>
                                    <input
                                      type="text"
                                      value={mod.duration}
                                      onChange={(e) => {
                                        const copy = [...(editingCourse.modules || [])];
                                        copy[idx] = { ...copy[idx], duration: e.target.value };
                                        setEditingCourse({ ...editingCourse, modules: copy });
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                      placeholder="Ex: 1h15 • 6 leçons"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Leçons (Une leçon par ligne)</label>
                                    <textarea
                                      rows={3}
                                      value={lessonsText}
                                      onChange={(e) => {
                                        const lessonsList = e.target.value.split('\n');
                                        const copy = [...(editingCourse.modules || [])];
                                        copy[idx] = { ...copy[idx], lessons: lessonsList };
                                        
                                        // Re-calculate total lessonsCount automatically!
                                        const totalLessons = [...copy].reduce((sum, m) => sum + (m.lessons || []).filter(l => l.trim() !== '').length, 0);
                                        
                                        setEditingCourse({ 
                                          ...editingCourse, 
                                          modules: copy,
                                          lessonsCount: totalLessons,
                                          modulesCount: copy.length
                                        });
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                      placeholder="Leçon 1&#10;Leçon 2&#10;Leçon 3"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              const newModule: CourseModule = { title: '', duration: '', lessons: [] };
                              const copy = [...(editingCourse.modules || []), newModule];
                              setEditingCourse({
                                ...editingCourse,
                                modules: copy,
                                modulesCount: copy.length
                              });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un module
                          </button>
                        </div>
                      </div>

                      {/* FAQ ITEMS */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-4">
                        <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider border-b border-slate-800 pb-2">Questions Fréquentes (FAQ)</h4>
                        <div className="space-y-4">
                          {(editingCourse.faq || []).map((item, idx) => (
                            <div key={idx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = (editingCourse.faq || []).filter((_, i) => i !== idx);
                                  setEditingCourse({ ...editingCourse, faq: copy });
                                }}
                                className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-850 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Supprimer cette question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Question</label>
                                <input
                                  type="text"
                                  value={item.q}
                                  onChange={(e) => {
                                    const copy = [...(editingCourse.faq || [])];
                                    copy[idx] = { ...copy[idx], q: e.target.value };
                                    setEditingCourse({ ...editingCourse, faq: copy });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                  placeholder="Ex: Comment se passe le support ?"
                                />
                              </div>

                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Réponse</label>
                                <textarea
                                  rows={2}
                                  value={item.r}
                                  onChange={(e) => {
                                    const copy = [...(editingCourse.faq || [])];
                                    copy[idx] = { ...copy[idx], r: e.target.value };
                                    setEditingCourse({ ...editingCourse, faq: copy });
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                  placeholder="Ex: Vous avez accès à un canal d'entraide privé..."
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...(editingCourse.faq || []), { q: '', r: '' }];
                              setEditingCourse({ ...editingCourse, faq: copy });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter une FAQ
                          </button>
                        </div>
                      </div>

                      {/* TESTIMONIALS */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/60 space-y-4">
                        <h4 className="text-xs font-black text-[#06bcbf] uppercase tracking-wider border-b border-slate-800 pb-2">Avis & Témoignages clients</h4>
                        <div className="space-y-4">
                          {(editingCourse.testimonials || []).map((t, idx) => (
                            <div key={idx} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = (editingCourse.testimonials || []).filter((_, i) => i !== idx);
                                  setEditingCourse({ ...editingCourse, testimonials: copy });
                                }}
                                className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-850 text-slate-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Supprimer ce témoignage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Nom de l'élève</label>
                                  <input
                                    type="text"
                                    value={t.name}
                                    onChange={(e) => {
                                      const copy = [...(editingCourse.testimonials || [])];
                                      copy[idx] = { ...copy[idx], name: e.target.value };
                                      setEditingCourse({ ...editingCourse, testimonials: copy });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                    placeholder="Ex: Sarah Connor"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Rôle / Métier</label>
                                  <input
                                    type="text"
                                    value={t.role}
                                    onChange={(e) => {
                                      const copy = [...(editingCourse.testimonials || [])];
                                      copy[idx] = { ...copy[idx], role: e.target.value };
                                      setEditingCourse({ ...editingCourse, testimonials: copy });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                    placeholder="Ex: Agenceuse 3D"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 items-center">
                                <div className="col-span-2">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Commentaire</label>
                                  <textarea
                                    rows={2}
                                    value={t.comment}
                                    onChange={(e) => {
                                      const copy = [...(editingCourse.testimonials || [])];
                                      copy[idx] = { ...copy[idx], comment: e.target.value };
                                      setEditingCourse({ ...editingCourse, testimonials: copy });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                    placeholder="Avis sur la formation..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Note</label>
                                  <select
                                    value={t.rating}
                                    onChange={(e) => {
                                      const copy = [...(editingCourse.testimonials || [])];
                                      copy[idx] = { ...copy[idx], rating: Number(e.target.value) };
                                      
                                      const avgRating = Number((copy.reduce((sum, item) => sum + item.rating, 0) / copy.length).toFixed(1));
                                      setEditingCourse({ 
                                        ...editingCourse, 
                                        testimonials: copy,
                                        rating: isNaN(avgRating) ? 5.0 : avgRating,
                                        reviewsCount: copy.length
                                      });
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs outline-none focus:border-[#06bcbf]"
                                  >
                                    <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                    <option value="4">⭐⭐⭐⭐ (4)</option>
                                    <option value="3">⭐⭐⭐ (3)</option>
                                    <option value="2">⭐⭐ (2)</option>
                                    <option value="1">⭐ (1)</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...(editingCourse.testimonials || []), { name: '', role: '', comment: '', rating: 5 }];
                              setEditingCourse({
                                ...editingCourse,
                                testimonials: copy,
                                reviewsCount: copy.length
                              });
                            }}
                            className="text-[11px] font-black text-[#06bcbf] hover:text-[#05a5a7] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Ajouter un témoignage
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => { setIsFormOpen(false); setEditingCourse(null); }}
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
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        ) : !selectedCourse ? (
          
          // --- 2. PUBLIC CATALOG PAGE VIEW ---
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="pb-24 flex-grow"
          >
            {/* Header / Hero Section in exact "Les Créateurs 3D" corporate styling */}
            <div className="relative overflow-hidden bg-[#204289] text-white py-16 md:py-24 px-6 border-b-4 border-[#06bcbf]">
              {/* Background Glow */}
              <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none"></div>
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[250px] bg-gradient-to-r from-transparent via-cyan-500/10 to-teal-500/10 blur-[100px] pointer-events-none"></div>

              <div className="max-w-7xl mx-auto relative z-10">
                <button 
                  onClick={onGoBack}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-200 hover:text-white mb-6 transition-colors group cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Retour à l'accueil
                </button>

                <div className="max-w-3xl">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-cyan-300 text-xs font-black uppercase tracking-wider rounded-full border border-white/20 mb-4 animate-pulse">
                    <Video className="w-3.5 h-3.5" />
                    E-learning • Formations Vidéo
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
                    Le Catalogue de nos <span className="text-[#06bcbf]">Formations Vidéo</span>
                  </h1>
                  <p className="text-lg text-slate-200 leading-relaxed font-medium">
                    Apprenez à concevoir, modéliser, illuminer et commercialiser vos plus beaux projets 3D. Des cours vidéo de niveau professionnel, animés par Sylvain, accessibles en ligne à tout moment.
                  </p>
                </div>
              </div>
            </div>

            {/* Filter controls & courses grid */}
            <div className="max-w-7xl mx-auto px-6 mt-12">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Filters Sidebar */}
                <div className="w-full lg:w-64 shrink-0 space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 sticky top-28">
                    <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Compass className="w-5 h-5 text-[#204289]" />
                      Filtrer les cours
                    </h3>
                    
                    {/* Category Selector */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thématique</label>
                        <div className="space-y-1.5">
                          {categories.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                                selectedCategory === cat
                                  ? 'bg-[#204289]/10 text-[#204289] font-black'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <span>{cat}</span>
                              {selectedCategory === cat && <span className="w-2 h-2 bg-[#204289] rounded-full"></span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Niveau</label>
                        <div className="flex flex-wrap gap-1.5">
                          {levels.map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setSelectedLevel(lvl)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedLevel === lvl
                                  ? 'bg-[#204289] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Offres Spéciales</label>
                        <button
                          onClick={() => setShowOnlyPromos(!showOnlyPromos)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-between border transition-all cursor-pointer ${
                            showOnlyPromos
                              ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                              : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-amber-500" />
                            <span>Uniquement en promo</span>
                          </div>
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${showOnlyPromos ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}>
                            <div className="w-3 h-3 rounded-full bg-white transition-all shadow-sm"></div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid of Courses */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-bold text-slate-500">
                      {filteredCourses.length} formation{filteredCourses.length > 1 ? 's' : ''} disponible{filteredCourses.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
                      <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-800 mb-2">Aucune formation trouvée</h4>
                      <p className="text-slate-500 text-sm mb-4">Essayez d'ajuster vos filtres de thématiques et de niveaux.</p>
                      <button 
                        onClick={() => { setSelectedCategory('Tous'); setSelectedLevel('Tous'); }}
                        className="px-5 py-2 bg-[#204289] text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCourses.map((course) => {
                        const calculatedPrice = getEffectiveCoursePrice(course);
                        const isPromoActive = calculatedPrice.isPromoTimerActive;
                        const discountPercent = isPromoActive ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) : 0;
                        return (
                          <motion.div
                            key={course.id}
                            layoutId={`course-card-${course.id}`}
                            onClick={() => selectCourse(course.id)}
                            className={`bg-white rounded-[2rem] overflow-hidden border transition-all duration-300 group cursor-pointer flex flex-col h-full relative ${
                              isPromoActive 
                                ? 'border-amber-400 shadow-md shadow-amber-500/5 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10' 
                                : 'border-slate-200/80 hover:border-[#204289]/50 hover:shadow-xl'
                            }`}
                            whileHover={{ y: -4 }}
                          >
                            {/* Graphic Header with Vibrant Background and Logo */}
                            <div 
                              className={`relative h-44 ${(!course.gradient || !course.gradient.startsWith('#')) ? `bg-gradient-to-br ${course.gradient || 'from-slate-900 to-slate-950'}` : ''} flex items-center justify-center p-6 text-white overflow-hidden`}
                              style={course.gradient?.startsWith('#') ? { backgroundColor: course.gradient } : undefined}
                            >
                              {course.imageUrl ? (
                                <>
                                  <img src={course.imageUrl} alt={course.title} className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                </>
                              ) : (
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                              )}
                              
                              <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 z-10">
                                {course.category}
                              </span>

                              {isPromoActive ? (
                                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border border-amber-300 animate-pulse">
                                  <Percent className="w-3.5 h-3.5" />
                                  PROMO -{discountPercent}%
                                </span>
                              ) : course.badge ? (
                                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider bg-[#06bcbf] text-slate-950 px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 fill-current" />
                                  {course.badge}
                                </span>
                              ) : null}

                              <div className="p-4 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-[#06bcbf]" />
                              </div>
                            </div>

                            {/* Details Content */}
                            <div className="p-6 flex flex-col flex-grow">
                              <div className="flex items-center gap-3 mb-3 text-slate-400 text-xs font-extrabold">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {course.duration.split(' ')[0]}h</span>
                                <span>•</span>
                                <span>{course.lessonsCount} leçons</span>
                                <span>•</span>
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider">{course.level}</span>
                              </div>

                              <h3 className="text-xl font-black text-slate-900 group-hover:text-[#204289] transition-colors leading-snug mb-3 line-clamp-2">
                                {course.title}
                              </h3>

                              <p className="text-sm text-slate-500 line-clamp-3 mb-4 font-medium leading-relaxed">
                                {course.slogan}
                              </p>

                              {course.promoDeadline && course.promoLabel && (() => {
                                const deadlineTime = new Date(course.promoDeadline).getTime();
                                const now = Date.now();
                                const isExpired = now >= deadlineTime;
                                const difference = now - deadlineTime;
                                const twentyFourHours = 24 * 60 * 60 * 1000;
                                if (!isExpired || difference <= twentyFourHours) {
                                  return (
                                    <div className="mb-4">
                                      <CountdownTimer deadline={course.promoDeadline} variant="tile" onExpire={handleTimerExpire} promoLabel={course.promoLabel} />
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Pricing & CTA Button */}
                              <div className={`mt-auto pt-4 border-t flex items-center justify-between ${
                                isPromoActive
                                  ? 'border-amber-100 bg-amber-500/5 -mx-6 -mb-6 p-6 rounded-b-[2rem]' 
                                  : 'border-slate-100'
                              }`}>
                                <div className="flex flex-col">
                                  {isPromoActive && course.promoLabel && (
                                    <span className="text-[9px] text-amber-600 font-black uppercase tracking-wider mb-0.5">{course.promoLabel}</span>
                                  )}
                                  <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-black ${isPromoActive ? 'text-amber-600' : 'text-slate-900'}`}>{isPromoActive ? course.price : course.originalPrice} €</span>
                                    {isPromoActive && (
                                      <span className="text-lg text-slate-400 line-through decoration-red-500 decoration-2 font-bold">{course.originalPrice} €</span>
                                    )}
                                  </div>
                                </div>
                                
                                <span className={`inline-flex items-center justify-center gap-1.5 text-xs font-black transition-transform ${
                                  isPromoActive ? 'text-amber-700 group-hover:translate-x-1' : 'text-[#204289] group-hover:translate-x-1'
                                }`}>
                                  Découvrir
                                  <ChevronRight className={`w-4 h-4 ${isPromoActive ? 'text-amber-500' : 'text-[#06bcbf]'}`} />
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          
          // --- 3. DYNAMIC ULTRA HIGH-CONVERTING SALES PAGE (SELECTED COURSE) ---
          <motion.div
            key={`details-${selectedCourse.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="pb-24 bg-slate-50 flex-grow"
          >
            {/* Sticky Container for Countdown Banner + Navbar */}
            <div className="sticky top-20 z-40 flex flex-col">
              {/* Sales page top sticky promotional countdown banner */}
              {selectedCourse && selectedCourse.originalPrice > selectedCourse.price && selectedCourse.promoDeadline && (
                <CountdownTimer deadline={selectedCourse.promoDeadline} variant="banner" onExpire={handleTimerExpire} promoLabel={selectedCourse.promoLabel} />
              )}
              
              {/* Sales page custom header sticky navbar */}
              <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                  <button 
                    onClick={() => selectCourse(null)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au catalogue
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="hidden md:inline text-xs font-black tracking-wider uppercase text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-xs">
                      Un programme e-learning par <span className="text-[#06bcbf] font-black">Les Créateurs 3D</span>
                    </span>
                    {(() => {
                      const calculated = getEffectiveCoursePrice(selectedCourse);
                      return (
                        <a 
                          href={calculated.stripeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (calculated.stripeLink.includes('mock-')) {
                              e.preventDefault();
                              setMockLinkModal({
                                isOpen: true,
                                courseTitle: selectedCourse?.title || 'Formation',
                                stripeLink: calculated.stripeLink
                              });
                            }
                          }}
                          className="px-5 py-2 bg-[#06bcbf] hover:bg-[#05a5a7] text-slate-950 text-xs font-black rounded-full transition-all cursor-pointer shadow-sm text-decoration-none inline-flex items-center justify-center uppercase tracking-wider text-[10px]"
                        >
                          M'inscrire ({calculated.finalPrice} €)
                        </a>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-CONVERTING HERO SECTION WITH EXQUISITE GRAPHICS */}
            <div 
              className={`relative overflow-hidden ${(!selectedCourse.gradient || !selectedCourse.gradient.startsWith('#')) ? `bg-gradient-to-br ${selectedCourse.gradient || 'from-slate-900 to-slate-950'}` : ''} text-white py-16 md:py-24 px-6`}
              style={selectedCourse.gradient?.startsWith('#') ? { backgroundColor: selectedCourse.gradient } : undefined}
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-white/5 blur-[130px] pointer-events-none"></div>

              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10 items-center">
                
                {/* Hero left: Copywriting pitch & Hook */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1 bg-[#204289]/30 text-[#06bcbf] text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30">
                      {selectedCourse.category}
                    </span>
                    <span className="px-3 py-1 bg-white/10 text-slate-200 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {selectedCourse.level}
                    </span>
                    {selectedCourse.badge && (
                      <span className="px-3 py-1 bg-[#06bcbf] text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-full shadow-md flex items-center gap-1 animate-pulse">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {selectedCourse.badge}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3.5xl md:text-5xl font-black tracking-tight leading-tight text-white">
                    {selectedCourse.title}
                  </h1>

                  <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-semibold">
                    {selectedCourse.slogan}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm text-slate-300 font-bold">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#06bcbf]" /> {selectedCourse.duration}</span>
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> {selectedCourse.lessonsCount} leçons • {selectedCourse.modulesCount} modules</span>
                    <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-400 fill-current" /> {selectedCourse.rating}/5 ({selectedCourse.reviewsCount} avis)</span>
                  </div>

                  <p className="text-slate-400 leading-relaxed font-medium pt-2 max-w-2xl text-[15px]">
                    {selectedCourse.description}
                  </p>
                </div>

                {/* Hero right: Dynamic conversion block */}
                <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-8 text-slate-900 shadow-2xl border border-slate-100">
                  <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden mb-6 shadow-lg border border-slate-200">
                    {/* Background Autoplay Loop - Muted native MP4 video, Vimeo embed or Image */}
                    {selectedCourse.imageUrl ? (
                      <img 
                        src={selectedCourse.imageUrl} 
                        alt={selectedCourse.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : selectedCourse.vimeoEmbedCode ? (
                      <div 
                        className="absolute inset-0 w-full h-full"
                        dangerouslySetInnerHTML={{ __html: selectedCourse.vimeoEmbedCode }}
                      />
                    ) : selectedCourse.videoUrl?.includes('vimeo.com') ? (
                      <ReactPlayer
                        src={selectedCourse.videoUrl.split('?')[0]}
                        width="100%"
                        height="100%"
                        className="absolute inset-0"
                        playing={true}
                        controls={true}
                        muted={true}
                        loop={true}
                        config={{
                          vimeo: {
                            playerOptions: {
                              autoplay: true,
                              muted: true,
                              loop: true,
                              byline: false,
                              portrait: false,
                              title: false,
                            }
                          } as any
                        }}
                      />
                    ) : (
                      <video
                        key={selectedCourse.videoUrl || "default"}
                        src={selectedCourse.videoUrl || "/hero_video.mp4"}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Premium Overlaid Info Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-[#204289]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                        {selectedCourse.imageUrl ? "Aperçu de la formation" : "Vidéo réalisée pendant la formation"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const calculated = getEffectiveCoursePrice(selectedCourse);
                      const displayPrice = paymentMode === 'installments' ? calculated.installmentsPrice : calculated.finalPrice;
                      const hasDiscount = paymentMode === 'comptant' && (calculated.isPromoTimerActive || calculated.promoDiscount > 0);
                      
                      return (
                        <>
                          {/* CHOIX DU MODE DE PAIEMENT */}
                          {selectedCourse.installmentsEnabled && (
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                              <button
                                type="button"
                                onClick={() => setPaymentMode('comptant')}
                                className={`py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                                  paymentMode === 'comptant'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-950'
                                }`}
                              >
                                Comptant ({calculated.finalPrice} €)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMode('installments')}
                                className={`py-2 px-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                                  paymentMode === 'installments'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-950'
                                }`}
                              >
                                En {calculated.installmentsCount}x
                                <span className="text-[9px] opacity-80 font-bold -mt-0.5">
                                  {calculated.installmentsPrice} € / mois
                                  <span className="block text-[8px] opacity-70">Total : {calculated.totalInstallmentsPrice} €</span>
                                </span>
                              </button>
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5">
                            {hasDiscount && (
                              <div className="flex flex-wrap gap-1.5 mb-1">
                                {calculated.isPromoTimerActive && (
                                  <motion.span 
                                    animate={{ 
                                      scale: [1, 1.05, 1],
                                      backgroundColor: ["#f59e0b", "#ea580c", "#f59e0b"],
                                      boxShadow: [
                                        "0 0 0 rgba(245, 158, 11, 0)",
                                        "0 0 10px rgba(245, 158, 11, 0.4)",
                                        "0 0 0 rgba(245, 158, 11, 0)"
                                      ]
                                    }}
                                    transition={{ 
                                      duration: 3, 
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    className="text-[9px] text-white font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                  >
                                    {selectedCourse.promoLabel || "Vente Flash active"}
                                  </motion.span>
                                )}
                                {appliedPromo && (
                                  <motion.span 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[9px] bg-emerald-600 text-white font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                  >
                                    Code {appliedPromo.code} (-{appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountType === 'percentage' ? `${appliedPromo.discountValue}%` : `${appliedPromo.discountValue}€`}` : `${appliedPromo.discountValue}€`})
                                  </motion.span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3">
                              <span className="text-4xl font-black text-slate-950">
                                {displayPrice} €
                                {paymentMode === 'installments' && (
                                  <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider mt-1">
                                    par mois pendant {calculated.installmentsCount} mois
                                    {selectedCourse.installmentsPromoPrice && calculated.isPromoTimerActive && (
                                      <span className="block text-emerald-600">Promo appliquée</span>
                                    )}
                                  </span>
                                )}
                              </span>
                              {(hasDiscount || (paymentMode === 'installments' && selectedCourse.installmentsPromoPrice && calculated.isPromoTimerActive)) && (
                                <>
                                  <span className="text-2xl text-slate-400 line-through decoration-red-500 decoration-2 font-bold mt-1">
                                    {paymentMode === 'installments' 
                                      ? (selectedCourse.installmentsPromoPrice && calculated.isPromoTimerActive ? `${selectedCourse.installmentsPrice} €` : '')
                                      : `${selectedCourse.originalPrice} €`}
                                  </span>
                                  {calculated.isPromoTimerActive && !appliedPromo && (
                                    <motion.span 
                                      animate={{ 
                                        y: [0, -3, 0],
                                        scale: [1, 1.04, 1]
                                      }}
                                      transition={{ 
                                        duration: 2.5, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                      className="ml-auto text-[10px] font-black uppercase text-slate-950 bg-amber-400 px-2 py-1 rounded-full shadow-md flex items-center gap-0.5 border border-amber-300"
                                    >
                                      <Percent className="w-3 h-3" />
                                      -{paymentMode === 'installments' 
                                        ? Math.round(((selectedCourse.installmentsPrice - selectedCourse.installmentsPromoPrice) / selectedCourse.installmentsPrice) * 100)
                                        : Math.round(((selectedCourse.originalPrice - selectedCourse.price) / selectedCourse.originalPrice) * 100)}% de remise
                                    </motion.span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* PROMO INPUT FIELD */}
                          <div className={`bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-2.5 shadow-sm ${(selectedCourse.showCouponField && promoCodes.some(p => p.isActive && (!p.courseId || p.courseId === selectedCourse.id))) ? '' : 'hidden'}`}>
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Un code promo ?</label>
                              {appliedPromo && (
                                <button
                                  type="button"
                                  onClick={handleRemovePromoCode}
                                  className="text-[9px] font-black uppercase text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                >
                                  Retirer
                                </button>
                              )}
                            </div>
                            
                            {!appliedPromo ? (
                              <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Ex : BIENVENUE10"
                                  value={promoCodeInput}
                                  onChange={(e) => setPromoCodeInput(e.target.value)}
                                  className="flex-grow bg-white border border-slate-300 focus:border-[#06bcbf] px-3 py-1.5 rounded-xl text-xs uppercase font-extrabold outline-none tracking-wider text-slate-800"
                                />
                                <button
                                  type="submit"
                                  className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-black transition-all uppercase tracking-wider cursor-pointer"
                                >
                                  Appliquer
                                </button>
                              </form>
                            ) : (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-extrabold">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Code appliqué : {appliedPromo.code}</span>
                              </div>
                            )}
                            
                            {promoError && (
                              <p className="text-[10px] font-extrabold text-red-600 leading-tight">{promoError}</p>
                            )}
                            {promoSuccess && !appliedPromo && (
                              <p className="text-[10px] font-extrabold text-emerald-600 leading-tight">{promoSuccess}</p>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                            Accès immédiat et à vie • Garantie satisfait ou remboursé sous 30 jours
                          </p>

                          {(() => {
                            const targetLink = paymentMode === 'installments' ? calculated.stripeInstallmentsLink : calculated.stripeLink;
                            return (
                              <a 
                                href={targetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  trackEvent('buy_course_click', 'formations', selectedCourse?.title);
                                  if (targetLink.includes('mock-')) {
                                    e.preventDefault();
                                    setMockLinkModal({
                                      isOpen: true,
                                      courseTitle: selectedCourse?.title || 'Formation',
                                      stripeLink: targetLink
                                    });
                                  }
                                }}
                                className="w-full py-4 px-6 bg-[#06bcbf] hover:bg-[#05a5a7] text-slate-950 text-center font-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-decoration-none text-sm uppercase tracking-wider animate-pulse hover:animate-none"
                              >
                                <Lock className="w-4.5 h-4.5" />
                                {paymentMode === 'installments' ? `S'inscrire en ${calculated.installmentsCount}x` : "S'inscrire à la formation"}
                              </a>
                            );
                          })()}

                          {appliedPromo && appliedPromo.stripeSynced && (
                            <p className="text-[10px] text-center text-emerald-600 font-bold -mt-2">
                              ✓ Le code <span className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{appliedPromo.code}</span> sera automatiquement pré-rempli sur votre page Stripe !
                            </p>
                          )}
                        </>
                      );
                    })()}

                    <p className="text-[11px] text-center text-emerald-700 bg-emerald-50 border border-emerald-100/80 py-2 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                      Accès instantané après paiement
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* BRANDING INTEGRATION: CUSTOM COPYWRITING MODULES */}
            {selectedCourse.id === 'ia-creatives' && (
              <div className="max-w-7xl mx-auto px-6 mt-16 space-y-16">
                
                {/* 1. THE PROBLEM SECTOR */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
                  <div>
                    <span className="text-xs font-black text-red-500 uppercase tracking-widest block mb-2">Le constat</span>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                      Vos projets méritent mieux qu'une photo. Et vos clients potentiels aussi.
                    </h2>
                    <div className="space-y-4 text-slate-600 font-medium leading-relaxed mb-6">
                      <p>
                        En ce moment, vos concurrents communiquent avec les mêmes outils que vous : des photos de réalisations, des posts LinkedIn, des plans. Le résultat ? Tout le monde se ressemble. Personne ne se démarque vraiment.
                      </p>
                      <p className="text-slate-900 font-bold text-base md:text-lg border-l-4 border-indigo-500 pl-4 py-1 leading-relaxed">
                        Une vidéo créative générée par IA change complètement la donne. Elle capte l'attention en 3 secondes, elle raconte l'espace avec émotion, elle montre votre niveau de maîtrise sans que vous ayez besoin de l'expliquer. Et surtout — elle ne ressemble à rien de ce que font vos concurrents aujourd'hui.
                      </p>
                      <p>
                        Ceux qui adoptent cette approche dès maintenant ont une longueur d'avance réelle : <strong className="text-[#204289]">plus de visibilité, des contacts plus qualifiés, et une image perçue comme premium</strong>.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</span>
                        <p className="text-sm text-slate-700 font-bold">Gagnez en visibilité et démarquez vous</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">✓</span>
                        <p className="text-sm text-slate-700 font-bold">Racontez vos histoires et scénarisez vos projets</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <img 
                      src="/image25.jpg" 
                      alt="Illustration Réalité Commerciale" 
                      className="w-full rounded-3xl object-cover shadow-sm border border-slate-200/60 max-h-[280px]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-center text-center">
                      <Sparkles className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                      <h4 className="font-extrabold text-slate-900 text-lg mb-2">Le pouvoir de l'IA</h4>
                      <p className="text-slate-600 text-base md:text-lg font-extrabold italic leading-relaxed">"L'IA permet la création de vidéo jusqu'ici inenvisageable pour un indépendant."</p>
                    </div>
                  </div>
                </div>

                {/* 2. THE BREAKTHROUGH SWITCH (LA BASCULE) */}
                <div className="bg-[#204289] text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-cyan-500/10 blur-[100px] pointer-events-none"></div>
                  
                  <div className="max-w-3xl relative z-10">
                    <span className="text-xs font-black text-[#06bcbf] uppercase tracking-widest block mb-2">La solution innovante</span>
                    <h2 className="text-3.5xl font-black tracking-tight leading-tight mb-6">
                      La Bascule : Ce que l'IA rend aujourd'hui possible (seul et sans budget)
                    </h2>
                    <p className="text-slate-100 font-medium leading-relaxed mb-8">
                      Grâce à un workflow minutieusement configuré, vous pouvez créer des vidéos cinématiques immersives en moins de 30 minutes. Il ne s'agit pas de "bricolage" IA, mais d'une méthode de production pas-à-pas pour transformer vos plans en films d'émotions d'une qualité saisissante.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Zap className="w-8 h-8 text-[#06bcbf] mb-3" />
                        <h4 className="font-extrabold text-white text-base mb-1">Mise en scène</h4>
                        <p className="text-slate-300 text-xs">Simuler l'avancée des travaux, l'apparition des meubles et générer des transitions incroyablement créatives.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Users className="w-8 h-8 text-[#06bcbf] mb-3" />
                        <h4 className="font-extrabold text-white text-base mb-1">Vos acteurs</h4>
                        <p className="text-slate-300 text-xs">Insérez des personnages dans vos vidéos. Vous êtes à la baguette comme un vrai réalisateur.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <Award className="w-8 h-8 text-[#06bcbf] mb-3" />
                        <h4 className="font-extrabold text-white text-base mb-1">Actif de vente</h4>
                        <p className="text-slate-300 text-xs">De telles vidéos sont un outil d'acquisition client infatigable !</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. DÉMONSTRATIONS INTERACTIVES BLOCK (REAL PROOFS) */}
                <div className="space-y-6">
                  <div className="text-center max-w-2xl mx-auto">
                    <span className="text-xs font-black text-[#204289] uppercase tracking-widest block mb-2">Preuve concrète</span>
                    <h2 className="text-3xl font-black text-slate-900">Admirez ce que vous saurez créer</h2>
                    <p className="text-slate-500 text-sm mt-1">Cliquez sur les différents types de rendus pour observer le résultat final d'une création de 30 secondes</p>
                  </div>

                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
                    {(() => {
                      if (!selectedCourse || !selectedCourse.promoDeadline || selectedCourse.originalPrice <= selectedCourse.price) return null;
                      
                      const deadlineTime = new Date(selectedCourse.promoDeadline).getTime();
                      const now = Date.now();
                      const isExpired = now >= deadlineTime;
                      const difference = now - deadlineTime;
                      const twentyFourHours = 24 * 60 * 60 * 1000;
                      
                      // If it is expired by more than 24 hours, hide the entire block
                      if (isExpired && difference > twentyFourHours) {
                        return null;
                      }
                      
                      return (
                        <div className={`max-w-2xl mx-auto mb-8 rounded-[2rem] p-6 border shadow-sm transition-all duration-300 ${ 
                          isExpired 
                            ? 'bg-slate-50/50 border-slate-200/80 text-center' 
                            : 'bg-amber-500/5 border-amber-500/10'
                        }`}>
                          {!isExpired ? (
                            <>
                              <div className="text-center mb-4">
                                <p className="text-sm font-black uppercase tracking-wider text-amber-600 flex items-center justify-center gap-1.5">
                                  <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                                  Profitez du tarif réduit avant l'expiration de l'offre
                                </p>
                              </div>
                              <CountdownTimer 
                                deadline={selectedCourse.promoDeadline} 
                                variant="tile" 
                                size="large"
                                onExpire={handleTimerExpire} 
                                promoLabel={selectedCourse.promoLabel} 
                              />
                            </>
                          ) : ( 
                            <div className="flex flex-col items-center gap-4 py-1.5">
                              <p className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5 text-center leading-relaxed">
                                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                                L'offre de lancement est terminée — Tarif standard en vigueur
                              </p>
                              <CountdownTimer 
                                deadline={selectedCourse.promoDeadline} 
                                variant="tile" 
                                size="large"
                                onExpire={handleTimerExpire} 
                                promoLabel={selectedCourse.promoLabel} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                      <button
                        onClick={() => setDemoActiveVideo('chantier')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border shadow-sm ${
                          demoActiveVideo === 'chantier' 
                            ? 'bg-[#204289] text-white border-[#204289] shadow-[#204289]/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        1. La construction accélérée (Chantier)
                      </button>
                      <button
                        onClick={() => setDemoActiveVideo('interieur')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border shadow-sm ${
                          demoActiveVideo === 'interieur' 
                            ? 'bg-[#204289] text-white border-[#204289] shadow-[#204289]/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        2. Visite immersive virtuelle d'intérieur
                      </button>
                      <button
                        onClick={() => setDemoActiveVideo('vente')}
                        className={`px-6 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border shadow-sm ${
                          demoActiveVideo === 'vente' 
                            ? 'bg-[#204289] text-white border-[#204289] shadow-[#204289]/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        3. Au coeur de la nature
                      </button>
                    </div>

                    <div className="relative aspect-video max-w-3xl mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                      {/* Native HTML5 video players for zero-control, high-performance looping playback */}
                      {demoActiveVideo === 'chantier' && (
                        <>
                          <video
                            key="video-chantier"
                            src="/video1.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="hidden md:block absolute bottom-16 left-4 z-10 bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left max-w-sm shadow-xl">
                            <span className="bg-[#06bcbf]/20 text-[#06bcbf] border border-[#06bcbf]/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-2 inline-block">
                              Séquence active
                            </span>
                            <h4 className="font-extrabold text-white text-sm mb-1">Séquence 1 : Visualisation de travaux en direct</h4>
                            <p className="text-slate-300 text-[11px] leading-relaxed">Visualisez les travaux en direct, ici une piscine est construite par des ouvriers animés, pourquoi pas un immeuble, une maison... Tout est possible.</p>
                          </div>
                        </>
                      )}

                      {demoActiveVideo === 'interieur' && (
                        <>
                          <video
                            key="video-interieur"
                            src="/video2.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="hidden md:block absolute bottom-16 left-4 z-10 bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left max-w-sm shadow-xl">
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-2 inline-block">
                              Séquence active
                            </span>
                            <h4 className="font-extrabold text-white text-sm mb-1">Séquence 2 : Travelling intérieur hyperréaliste</h4>
                            <p className="text-slate-300 text-[11px] leading-relaxed">Une visite guidée fluide de l'espace avec jeux de lumières naturelles, reflets réalistes du bois et bruits d'ambiance d'exception.</p>
                          </div>
                        </>
                      )}

                      {demoActiveVideo === 'vente' && (
                        <>
                          <video
                            key="video-vente"
                            src="/video3.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="hidden md:block absolute bottom-16 left-4 z-10 bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-xl p-4 text-left max-w-sm shadow-xl">
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-2 inline-block">
                              Séquence active
                            </span>
                            <h4 className="font-extrabold text-white text-sm mb-1">Séquence 3 : Au coeur de la nature</h4>
                            <p className="text-slate-300 text-[11px] leading-relaxed">Une immersion sensorielle au coeur d'un projet niché dans la verdure. Lumières douces et ambiance apaisante.</p>
                          </div>
                        </>
                      )}

                      <div className="hidden sm:flex absolute bottom-4 left-4 right-4 justify-between items-center bg-black/60 backdrop-blur-sm p-3 rounded-lg text-xs">
                        <span className="text-slate-300 font-bold">Rendu prototype animé d'une séquence de 30s</span>
                        <div className="text-[#06bcbf] font-black flex items-center gap-1">
                          Lecture en continu <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Split Page Details (Curriculum, Testimonials, What's included, Guarantee) */}
            <div className="max-w-7xl mx-auto px-6 mt-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Side: learning curriculum & faq */}
                <div className="lg:col-span-8 space-y-12">
                  
                  {/* Outcomes Checklist */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/80">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0" />
                      Ce que vous allez savoir faire
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {selectedCourse.outcomes.map((pt, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{pt}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Syllabus / Modules */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <BookOpen className="w-7 h-7 text-[#204289] shrink-0" />
                        Programme détaillé
                      </h2>
                      <span className="text-xs text-slate-400 font-bold">{selectedCourse.modules.length} modules d'étude</span>
                    </div>

                    <div className="space-y-3">
                      {selectedCourse.modules.map((mod, index) => {
                        const isExpanded = expandedModuleIndex === index;
                        return (
                          <div 
                            key={index} 
                            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"
                          >
                            <button
                              onClick={() => setExpandedModuleIndex(isExpanded ? null : index)}
                              className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex-1">
                                <h4 className="font-extrabold text-slate-900 text-base leading-tight">
                                  {mod.title}
                                </h4>
                                <span className="text-xs text-slate-400 font-bold block mt-1">{mod.duration}</span>
                              </div>
                              <span className={`w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden border-t border-slate-100"
                                >
                                  <div className="p-5 bg-slate-50/40 space-y-3">
                                    {mod.lessons.map((les, lidx) => (
                                      <div key={lidx} className="flex items-center gap-3 text-slate-600 font-semibold">
                                        <Play className="w-3.5 h-3.5 text-[#06bcbf] shrink-0 fill-current" />
                                        <span className="text-sm text-slate-700">{les}</span>
                                        <span className="ml-auto text-[9px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Cours Vidéo</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Audience Segment */}
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-200/80 shadow-sm space-y-4">
                    <h4 className="text-xl font-black text-slate-900">Pour qui est faite cette formation ?</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedCourse.audience.map((aud, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <Users className="w-6 h-6 text-[#204289] mx-auto mb-2" />
                          <p className="text-xs font-black text-slate-800 leading-normal">{aud}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* THE INSTRUCTOR: SYLVAIN */}
                  <div className="bg-[#204289]/10 rounded-[2.5rem] p-8 border border-[#204289]/20 flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-24 h-24 rounded-full shrink-0 overflow-hidden shadow-lg border-2 border-[#06bcbf] bg-white">
                      <img 
                        src="/carre vra copieROND couleur petit.png" 
                        alt="Sylvain de chez Les Créateurs 3D" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-3 text-center md:text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#204289] bg-white px-2.5 py-1 rounded-full border border-blue-200">Votre formateur</span>
                      <h4 className="text-xl font-black text-slate-900">Sylvain de chez Les Créateurs 3D</h4>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Formateur reconnu de la communauté 3D francophone avec ma chaîne YouTube, je conçois des programmes pour les professionnels de la conception d'espaces. Pas de discours théorique complexe : uniquement des workflows concrets testés sur le terrain.
                      </p>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <HelpCircle className="w-7 h-7 text-teal-600 shrink-0" />
                      Questions fréquemment posées
                    </h2>

                    <div className="space-y-3">
                      {selectedCourse.faq.map((fq, index) => {
                        const isFaqActive = activeFaqIndex === index;
                        return (
                          <div 
                            key={index} 
                            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"
                          >
                            <button
                              onClick={() => setActiveFaqIndex(isFaqActive ? null : index)}
                              className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                            >
                              <span className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                                {fq.q}
                              </span>
                              <span className={`w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center transition-transform ${isFaqActive ? 'rotate-90' : ''}`}>
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </button>

                            <AnimatePresence initial={false}>
                              {isFaqActive && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden border-t border-slate-100"
                                >
                                  <div className="p-5 text-slate-600 font-medium leading-relaxed text-sm md:text-[15px] bg-slate-50/40">
                                    {fq.r}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* testimonials */}
                  <div className="bg-white rounded-[2rem] p-4 md:p-8 shadow-xl border border-slate-200">
                    <iframe 
                      src="/elfsight-reviews.html" 
                      width="100%" 
                      height="600" 
                      frameBorder="0" 
                      scrolling="no"
                      title="Google Reviews"
                      className="w-full"
                    />
                  </div>

                </div>

                {/* Right Side: What's included checkmark, guarantee certificate */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Includes List card */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/80">
                    <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Download className="w-5 h-5 text-[#204289]" />
                      Inclus dans le programme
                    </h4>
                    
                    <div className="space-y-3.5">
                      {selectedCourse.includes.map((inc, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#06bcbf] mt-0.5 shrink-0" />
                          <span className="text-xs md:text-sm font-bold text-slate-600 leading-normal">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guarantee satisfaction badge card */}
                  <div className="bg-[#204289] text-white rounded-[2rem] p-6 shadow-lg text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#06bcbf]/10 to-transparent blur-[50px] pointer-events-none"></div>
                    <Award className="w-10 h-10 text-[#06bcbf] mx-auto mb-3" />
                    <h4 className="font-black text-sm uppercase tracking-wider mb-2">Garantie 30 Jours</h4>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed mb-4">
                      Testez notre méthode sans risque pendant 30 jours complets. Si vous n'êtes pas bluffé par vos vidéos créées, vous pourrez demander un remboursement intégral. Sans justification.
                    </p>
                    <span className="inline-block text-[10px] font-black uppercase text-[#06bcbf] bg-white/10 px-3 py-1 rounded-full border border-cyan-500/20">
                      100% Serein • Aucun Risque
                    </span>
                  </div>



                </div>

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FOOTER: CONTAINS HIDDEN SECURITY DOOR TO ADMIN --- */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div 
            onClick={(e) => {
              if (e.detail === 3) {
                toggleAdminView(!isAdminView);
              }
            }}
            className="text-xs font-bold select-none cursor-default hover:text-slate-300 transition-colors"
            title="© 2026 Les Créateurs 3D"
          >
            © 2026 Les Créateurs 3D. Tous droits réservés.
          </div>
          <div className="flex items-center gap-4">
            {/* The visible "Accès Pro" button has been completely removed to ensure 100% discretion. */}
          </div>
        </div>
      </footer>

      {/* MOCK STRIPE LINK WARNING POPUP */}
      <AnimatePresence>
        {mockLinkModal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMockLinkModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10 p-8 space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white leading-tight">Lien de Paiement de Démo</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">L'erreur "Access Denied" est tout à fait normale ! Elle s'affiche car ce bouton utilise un lien de démonstration temporaire.</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950 p-5 rounded-2xl border border-slate-800/60 text-xs text-slate-300 leading-relaxed">
                <p>
                  Dans ce catalogue prototype, les formations sont configurées par défaut avec des liens fictifs du type :
                </p>
                <code className="block p-2 bg-slate-900 rounded border border-slate-800 text-amber-400 font-mono select-all break-all">
                  {mockLinkModal.stripeLink}
                </code>
                <p className="text-amber-500/95 font-bold">
                  Stripe n'accepte pas ces liens fictifs (qui ne sont pas créés sur votre vrai tableau de bord Stripe) et affiche donc un écran vide ou un message "Access Denied".
                </p>
                {stripeConfigured ? (
                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <p className="text-xs font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                      Synchronisation Stripe disponible !
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                      Votre clé secrète Stripe est configurée. Nous pouvons générer automatiquement les produits, tarifs et liens de paiement réels sur votre compte Stripe pour la formation <strong className="text-white">"{mockLinkModal.courseTitle}"</strong> en un seul clic !
                    </p>
                    <button
                      type="button"
                      disabled={isStripeSyncing}
                      onClick={async () => {
                        const courseToSync = courses.find(c => c.title === mockLinkModal.courseTitle);
                        if (!courseToSync) {
                          alert("Impossible de trouver les informations de cette formation.");
                          return;
                        }
                        setIsStripeSyncing(true);
                        try {
                          const token = sessionStorage.getItem('l3d_admin_token') || '';
                          const response = await fetch('/api/stripe/sync-course', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              id: courseToSync.id,
                              title: courseToSync.title,
                              slogan: courseToSync.slogan,
                              price: Number(courseToSync.price),
                              originalPrice: Number(courseToSync.originalPrice),
                              installmentsEnabled: !!courseToSync.installmentsEnabled,
                              installmentsCount: courseToSync.installmentsCount ? Number(courseToSync.installmentsCount) : undefined,
                              installmentsPrice: courseToSync.installmentsPrice ? Number(courseToSync.installmentsPrice) : undefined
                            })
                          });
                          const data = await response.json();
                          if (response.ok && data.success) {
                            const updated = courses.map(c => c.id === courseToSync.id ? {
                              ...c,
                              stripeStandardLink: data.stripeStandardLink,
                              stripePromoLink: data.stripePromoLink,
                              stripeInstallmentsLink: data.stripeInstallmentsLink || undefined
                            } : c);
                            saveCoursesToStorage(updated);
                            
                            setMockLinkModal(prev => ({ ...prev, isOpen: false }));
                            alert(`✓ Succès ! Les vrais liens de paiement Stripe ont été générés et configurés automatiquement pour "${courseToSync.title}" !\n\nVous pouvez maintenant cliquer à nouveau sur "S'inscrire" pour tester le checkout Stripe.`);
                          } else {
                            alert(`⚠️ Erreur : ${data.error || 'Impossible de synchroniser.'}`);
                          }
                        } catch (err: any) {
                          alert(`⚠️ Erreur de connexion : ${err.message || err}`);
                        } finally {
                          setIsStripeSyncing(false);
                        }
                      }}
                      className="w-full py-3 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-[#06bcbf]/10"
                    >
                      {isStripeSyncing ? 'Création des liens sur Stripe...' : 'Générer mes vrais liens de paiement Stripe'}
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <p className="font-extrabold text-white text-[11px] uppercase tracking-wider">Comment connecter vos vrais liens de paiement Stripe :</p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-slate-300 font-bold">
                      <li>Accédez à votre espace Administrateur discret en effectuant un <strong className="text-white">triple-clic (3 clics rapides)</strong> sur la phrase de copyright tout en bas du site (<em className="text-[#06bcbf]">"© 2026 Les Créateurs 3D"</em>).</li>
                      <li>Saisissez vos identifiants administrateur.</li>
                      <li>Sélectionnez la formation <strong className="text-[#06bcbf]">"{mockLinkModal.courseTitle}"</strong> et cliquez sur <strong className="text-[#06bcbf]">Modifier</strong>.</li>
                      <li>Remplacez les champs <strong className="text-white">Lien Stripe Standard</strong> et <strong className="text-white">Lien Stripe Promo</strong> par vos propres liens de checkout créés sur votre tableau de bord Stripe.</li>
                      <li>Enregistrez les modifications ! Vos boutons redirigeront instantanément vers vos vraies pages de paiement sécurisées.</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMockLinkModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-[#06bcbf] hover:bg-[#05a5a7] active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  J'ai compris, merci !
                </button>
                <a
                  href={mockLinkModal.stripeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center text-decoration-none flex items-center justify-center gap-1 border border-slate-700 text-sm"
                >
                  <span>Tester le lien de démo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 z-10 overflow-hidden"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500" />
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-950/30 border border-red-800/40 flex items-center justify-center text-red-400">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Confirmation de suppression</h3>
                  <span className="text-[10px] font-black tracking-widest uppercase text-red-400/80">Action Irréversible</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement :
                </p>
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="font-extrabold text-white text-xs block truncate">
                    {deleteConfirm.type === 'course' ? 'Formation :' : 'Code promo :'}
                  </span>
                  <span className="text-[#06bcbf] font-black text-sm block mt-0.5 truncate">
                    {deleteConfirm.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cette action supprimera l'élément de votre catalogue de manière permanente.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 text-center"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirm.type === 'course') {
                      executeDeleteCourse(deleteConfirm.id);
                    } else if (deleteConfirm.type === 'promo') {
                      executeDeletePromoCode(deleteConfirm.id);
                    }
                  }}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-900/20 text-center"
                >
                  Supprimer définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
