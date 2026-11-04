import { useEffect, useState } from 'react';

// Paddle (paiement des extensions SketchUp IzyStudio).
// Le « client token » est public : il est fait pour apparaître dans une page web.
// MISE EN VENTE : remplacer environment par 'production', le token par celui du compte Paddle réel
// (Developer tools > Authentication > Client-side tokens) et les priceId par ceux du compte réel.
export const PADDLE = {
  environment: 'sandbox' as 'sandbox' | 'production',
  clientToken: 'test_665c2d50b22abc0fedc3e86f9a9',
};

// Page de remerciement qui affiche la clé de licence après l'achat (serveur d'achat).
// MISE EN VENTE : remplacer par l'adresse définitive.
const THANKS_URL = 'https://izystudio-achat-vr4lcvecyq-ew.a.run.app/merci';

export type PackKey = 'suite' | 'configurators' | 'modeling' | 'media' | 'control';

// Un prix modifié dans Paddle (même identifiant) se répercute ici sans toucher au code.
// Un prix recréé dans Paddle a un nouvel identifiant : le changer ici.
export const PRICE_IDS: Record<PackKey, string> = {
  suite: 'pri_01m6k48r4w7rtx96r36933xerz',
  configurators: 'pri_01m6k4cwx0p1ah271vdjnfp2sg',
  modeling: 'pri_01m6k4drfpd7nbh6ea4h8g6p4e',
  media: 'pri_01m6k4f15naexv5th1bx5hjavh',
  control: 'pri_01m6k4ecn0bjnrqppzbm3knrc8',
};

// Affichés si Paddle ne répond pas (réseau coupé, bloqueur de publicités) : en euros, TVA comprise ou non selon le réglage Paddle.
export const FALLBACK_PRICES: Record<PackKey, number> = {
  suite: 99,
  configurators: 69,
  modeling: 39,
  media: 39,
  control: 19,
};

export interface PackPrices {
  /** Montant (unité : l'unité de la devise, ex. 99) par pack ; absent tant que Paddle n'a pas répondu. */
  amounts: Partial<Record<PackKey, number>>;
  currency: string;
  /** Vrai quand les montants viennent de Paddle (faux = valeurs de secours). */
  live: boolean;
}

declare global {
  interface Window {
    Paddle?: any;
  }
}

// Le sandbox de Paddle n'accepte que des cartes de test : il n'est utilisé qu'en local. Sur le vrai site,
// tant que le jeton est celui du sandbox, les prix de secours s'affichent et le paiement n'est pas proposé.
export const PAYMENT_AVAILABLE =
  PADDLE.environment === 'production' || ['localhost', '127.0.0.1'].includes(window.location.hostname);

let loading: Promise<any> | null = null;

// Charge Paddle.js une seule fois et l'initialise.
export function loadPaddle(): Promise<any> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const start = () => {
      try {
        window.Paddle.Environment.set(PADDLE.environment);
        window.Paddle.Initialize({
          token: PADDLE.clientToken,
          eventCallback: (event: any) => {
            if (event?.name === 'checkout.completed') {
              const transaction = event.data?.transaction_id ?? '';
              window.Paddle.Checkout.close();
              window.location.href = `${THANKS_URL}?txn=${encodeURIComponent(transaction)}`;
            }
          },
        });
        resolve(window.Paddle);
      } catch (error) {
        reject(error);
      }
    };
    if (window.Paddle) return start();
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = start;
    script.onerror = () => reject(new Error('Paddle.js indisponible'));
    document.head.appendChild(script);
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

// Prix actuels de Paddle : devise et TVA du pays du visiteur comprises, remises comprises.
export function usePackPrices(): PackPrices {
  const [state, setState] = useState<PackPrices>({ amounts: {}, currency: 'EUR', live: false });

  useEffect(() => {
    if (!PAYMENT_AVAILABLE) return;
    let cancelled = false;
    loadPaddle()
      .then((paddle) =>
        paddle.PricePreview({
          items: (Object.keys(PRICE_IDS) as PackKey[]).map((key) => ({ priceId: PRICE_IDS[key], quantity: 1 })),
        })
      )
      .then((preview: any) => {
        if (cancelled) return;
        const lines: any[] = preview?.data?.details?.lineItems ?? [];
        const amounts: Partial<Record<PackKey, number>> = {};
        (Object.keys(PRICE_IDS) as PackKey[]).forEach((key) => {
          const line = lines.find((l) => l?.price?.id === PRICE_IDS[key]);
          const minor = Number(line?.totals?.total);
          if (line && Number.isFinite(minor)) amounts[key] = minor / 100;
        });
        if (Object.keys(amounts).length === Object.keys(PRICE_IDS).length) {
          setState({ amounts, currency: preview.data.currencyCode || 'EUR', live: true });
        }
      })
      .catch(() => {
        /* valeurs de secours */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// Ouvre le paiement Paddle du pack ; la clé de licence arrive ensuite par e-mail et sur la page de remerciement.
export async function openCheckout(key: PackKey): Promise<void> {
  const paddle = await loadPaddle();
  paddle.Checkout.open({
    items: [{ priceId: PRICE_IDS[key], quantity: 1 }],
    settings: { displayMode: 'overlay', theme: 'light', locale: 'fr' },
  });
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
