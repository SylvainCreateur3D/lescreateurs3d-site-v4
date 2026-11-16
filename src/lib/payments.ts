// Paiement des extensions SketchUp IzyStudio : Stripe Managed Payments (Stripe est le revendeur officiel, « Vendu via Link »).
// Le bouton d'achat ouvre <serveur d'achat>/acheter/<pack> : le serveur crée la page de paiement Stripe du pack,
// puis la clé de licence arrive par e-mail et sur la page de remerciement.
// MISE EN VENTE : passer PAYMENT_OPEN à true une fois le serveur d'achat déployé avec les clés Stripe.
export const PAYMENT_OPEN = true;

const BUY_URL = 'https://izystudio-achat-vr4lcvecyq-ew.a.run.app/acheter/';

export type PackKey = 'suite' | 'configurators' | 'modeling' | 'media' | 'control';

// Prix hors taxes, identiques à ceux des produits Stripe. La TVA du pays de l'acheteur est ajoutée au paiement.
export const PRICES_HT: Record<PackKey, number> = {
  suite: 99,
  configurators: 69,
  modeling: 39,
  media: 39,
  control: 19,
};

// TVA française, pour afficher le prix TTC d'un acheteur en France à côté du prix HT.
export const FR_VAT = 0.2;

// En local, le bouton mène au serveur d'achat même avant l'ouverture (pour tester).
export const PAYMENT_AVAILABLE = PAYMENT_OPEN || ['localhost', '127.0.0.1'].includes(window.location.hostname);

export function buyUrl(key: PackKey): string {
  return BUY_URL + key;
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
