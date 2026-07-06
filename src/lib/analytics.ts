import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';

// Simple device detection
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Simple unique visitor ID stored in localStorage
function getOrCreateVisitorId(): string {
  try {
    let visitorId = localStorage.getItem('l3d_visitor_id');
    if (!visitorId) {
      visitorId = 'vis_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('l3d_visitor_id', visitorId);
    }
    return visitorId;
  } catch (e) {
    return 'vis_fallback_' + Math.random().toString(36).substring(2, 8);
  }
}

export interface AnalyticsEvent {
  id?: string;
  type: 'page_view' | 'action';
  page: string;
  action?: string;
  details?: string;
  visitorId: string;
  device: 'mobile' | 'tablet' | 'desktop';
  referrer: string;
  timestamp: any;
}

/**
 * Tracks a page view event.
 */
export async function trackPageView(page: string) {
  try {
    const visitorId = getOrCreateVisitorId();
    const device = getDeviceType();
    const referrer = document.referrer || 'direct';

    await addDoc(collection(db, 'analytics_events'), {
      type: 'page_view',
      page,
      visitorId,
      device,
      referrer,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.warn('[Analytics] Failed to track page view:', error);
  }
}

/**
 * Tracks an interactive action (like click Calendly, course buy, etc.)
 */
export async function trackEvent(action: string, page: string, details?: string) {
  try {
    const visitorId = getOrCreateVisitorId();
    const device = getDeviceType();
    const referrer = document.referrer || 'direct';

    await addDoc(collection(db, 'analytics_events'), {
      type: 'action',
      page,
      action,
      details: details || '',
      visitorId,
      device,
      referrer,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', error);
  }
}

/**
 * Fetches all analytics events for dashboard aggregation.
 */
export async function fetchAnalyticsEvents(limitCount = 5000): Promise<any[]> {
  try {
    const q = query(
      collection(db, 'analytics_events'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const events: any[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to JS Date
      let dateVal = new Date();
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        dateVal = data.timestamp.toDate();
      } else if (data.timestamp) {
        dateVal = new Date(data.timestamp);
      }
      events.push({
        id: doc.id,
        ...data,
        timestamp: dateVal
      });
    });
    return events;
  } catch (error) {
    console.error('[Analytics] Error fetching events:', error);
    return [];
  }
}
