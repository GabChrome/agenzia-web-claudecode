/**
 * Elenco configurabile dei siti clienti per l'area /reports.
 *
 * Per aggiungere un sito basta inserire una nuova voce in questo array:
 * l'indice dei report e la pagina di dettaglio vengono generati in automatico.
 *
 * - `id`          slug univoco, usato nell'URL (/reports/<id>)
 * - `name`        nome mostrato nell'interfaccia
 * - `domain`      dominio del sito (solo informativo)
 * - `launchDate`  data di lancio in formato ISO (YYYY-MM-DD)
 * - `sector`      settore del cliente, mostrato come etichetta
 * - `profile`     forma del traffico demo:
 *                 `business` = più traffico nei giorni feriali
 *                 `leisure`  = più traffico nel weekend
 *                 `flat`     = distribuito uniformemente
 * - `baseDailyVisits` ordine di grandezza delle visite giornaliere
 * - `monthlyGrowth`   crescita media mensile del traffico (0.03 = +3%/mese)
 */

export type SiteProfile = 'business' | 'leisure' | 'flat';

export interface SiteConfig {
  id: string;
  name: string;
  domain: string;
  launchDate: string;
  sector: string;
  profile: SiteProfile;
  baseDailyVisits: number;
  monthlyGrowth: number;
}

export const sites: SiteConfig[] = [
  {
    id: 'ristorante-da-mario',
    name: 'Ristorante Da Mario',
    domain: 'ristorantedamario.it',
    launchDate: '2025-03-14',
    sector: 'Ristorazione',
    profile: 'leisure',
    baseDailyVisits: 180,
    monthlyGrowth: 0.05,
  },
  {
    id: 'studio-legale-bianchi',
    name: 'Studio Legale Bianchi',
    domain: 'studiolegalebianchi.it',
    launchDate: '2024-11-02',
    sector: 'Servizi legali',
    profile: 'business',
    baseDailyVisits: 95,
    monthlyGrowth: 0.03,
  },
  {
    id: 'greenfit-palestre',
    name: 'GreenFit Palestre',
    domain: 'greenfitpalestre.it',
    launchDate: '2025-06-20',
    sector: 'Fitness & benessere',
    profile: 'flat',
    baseDailyVisits: 320,
    monthlyGrowth: 0.08,
  },
  {
    id: 'boutique-lanterna',
    name: 'Boutique La Lanterna',
    domain: 'boutiquelalanterna.it',
    launchDate: '2026-01-10',
    sector: 'E-commerce moda',
    profile: 'leisure',
    baseDailyVisits: 240,
    monthlyGrowth: 0.11,
  },
];

export function getSite(id: string): SiteConfig | undefined {
  return sites.find((s) => s.id === id);
}
