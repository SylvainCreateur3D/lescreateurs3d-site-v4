// Estimation de la TVA affichée sur la page Extensions, d'après le pays du visiteur.
// Ce n'est qu'une estimation : le montant exact est calculé par Stripe à l'étape de paiement, d'après l'adresse de facturation.

// Taux standards en vigueur en 2026. Les services numériques vendus à un particulier sont taxés au taux du pays de l'acheteur.
// Source : tableau 2026 d'Eurofiscalis, vérifié le 17 novembre 2026 ; Royaume-Uni : 20 %.
export const VAT_RATES: Record<string, number> = {
  AT: 0.2, BE: 0.21, BG: 0.2, HR: 0.25, CY: 0.19, CZ: 0.21, DK: 0.25, EE: 0.24, FI: 0.255, FR: 0.2,
  DE: 0.19, GR: 0.24, HU: 0.27, IE: 0.23, IT: 0.22, LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, NL: 0.21,
  PL: 0.23, PT: 0.23, RO: 0.21, SK: 0.23, SI: 0.22, ES: 0.21, SE: 0.25, GB: 0.2,
};

export const OTHER_COUNTRY = 'OTHER';
export const DEFAULT_COUNTRY = 'FR';

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

/** Pays proposés dans le sélecteur, triés par nom français. */
export function selectableCountries(): { code: string; name: string }[] {
  return Object.keys(VAT_RATES)
    .map((code) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export function vatRate(code: string): number | null {
  return Object.prototype.hasOwnProperty.call(VAT_RATES, code) ? VAT_RATES[code] : null;
}

export function priceWithVat(amountHt: number, rate: number): number {
  // + 1e-6 : évite qu'un « demi-centime » exact (ex. 124,245) soit arrondi vers le bas par l'imprécision des décimales.
  return Math.round(amountHt * (1 + rate) * 100 + 1e-6) / 100;
}

export function formatRate(rate: number): string {
  return String(Math.round(rate * 1000) / 10).replace('.', ',');
}

function isCountryCode(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Z]{2}$/.test(value);
}

/** Première estimation, immédiate : région de la langue du navigateur (fr-BE → BE), sinon France. */
export function guessCountryFromBrowser(): string {
  try {
    for (const lang of navigator.languages?.length ? navigator.languages : [navigator.language]) {
      const region = lang.split('-')[1]?.toUpperCase();
      if (isCountryCode(region)) return region;
    }
  } catch {
    /* France par défaut */
  }
  return DEFAULT_COUNTRY;
}

/** Pays du visiteur d'après son adresse IP, fourni par l'hébergeur du site (aucun service tiers). Null si indisponible. */
export async function detectCountry(timeoutMs = 3000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch('/api/pays', { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json();
    return isCountryCode(data?.country) ? data.country : null;
  } catch {
    return null;
  }
}
