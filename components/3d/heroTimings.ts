// ============================================================
// TIMING & SOGLIE SCROLL DELL'ANIMAZIONE HERO (progress 0 → 1)
// Tutti i valori calibrabili dell'esperienza sono qui:
// modifica questi numeri senza toccare i componenti.
// ============================================================

// Altezza della sezione hero: lo scroll "in eccesso" rispetto al
// viewport (height - 100vh) alimenta l'animazione prima del rilascio.
export const SECTION_HEIGHT_VH = 300;
export const SECTION_HEIGHT_VH_MOBILE = 240; // animazione più corta su mobile

// --- Fase 1 → 2: testo overlay e partenza della convergenza ---
export const TEXT_FADE_START = 0.02;    // il testo overlay inizia a sparire
export const TEXT_FADE_END = 0.14;      // testo completamente sparito
export const CONVERGENCE_START = 0.06;  // i primi elementi partono verso lo schermo
export const CONVERGENCE_SPREAD = 0.22; // finestra casuale di partenza per elemento (effetto organico)
export const CONVERGENCE_END = 0.7;     // entro qui tutti gli elementi sono confluiti

// --- Fase 3: accensione schermo e composizione del sito ---
export const SCREEN_ON_THRESHOLD = 0.72; // lo schermo inizia ad accendersi
export const SCREEN_FLASH_PEAK = 0.78;   // picco del flash (bloom massimo)
export const SCREEN_SETTLE = 0.86;       // il glow si assesta al valore di regime
export const SITE_REVEAL_START = 0.78;   // il sito inizia a comporsi sul display
export const SITE_REVEAL_STAGGER = 0.045; // ritardo tra una sezione del mockup e la successiva
export const SITE_SECTION_DURATION = 0.1; // durata del reveal di una singola sezione
export const CTA_IN_START = 0.88;        // le CTA finali appaiono sotto il laptop

// --- Elementi fluttuanti ---
export const ELEMENT_COUNT_DESKTOP = 52;
export const ELEMENT_COUNT_MOBILE = 24;

// --- Scena ---
export const LAPTOP_SCALE = 0.68;        // dimensione del laptop (e del sito sul display)
export const LAPTOP_Y = 0;               // quota del laptop in scena
export const LAPTOP_SCALE_MOBILE = 0.5;  // su mobile: più piccolo…
export const LAPTOP_Y_MOBILE = -0.55;    // …e più in basso, sotto il testo overlay
