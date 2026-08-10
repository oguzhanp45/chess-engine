/**
 * KONUM: app/src/theme.ts   (üzerine yaz)
 *
 * TASARIMI BURADAN DEĞİŞTİR.
 *
 * boardThemes içine yeni palet ekleyip BOARD_THEME'i değiştirmen yeterli.
 * Adım 6'da bu seçim ayarlar ekranına bağlanacak.
 */

export const boardThemes = {
  zeytin: {
    light: '#EDE6D6',
    dark: '#7C8C5A',
    selected: '#F2E14C',
    lastMove: '#D9D26B',
    check: '#D9503F',
    target: 'rgba(20, 20, 20, 0.28)',
    coord: 'rgba(20, 20, 20, 0.55)',
    frame: '#3A3A33',
  },
  mavi: {
    light: '#DEE3E6',
    dark: '#788A9E',
    selected: '#F3D250',
    lastMove: '#C7D68B',
    check: '#D9503F',
    target: 'rgba(20, 20, 20, 0.26)',
    coord: 'rgba(20, 20, 20, 0.5)',
    frame: '#2E3742',
  },
  ahsap: {
    light: '#E8D0A9',
    dark: '#B07B4F',
    selected: '#F0D264',
    lastMove: '#DCC066',
    check: '#C4462F',
    target: 'rgba(40, 20, 0, 0.3)',
    coord: 'rgba(40, 20, 0, 0.55)',
    frame: '#4A3222',
  },
};

export type BoardTheme = typeof boardThemes.zeytin;

/** Aktif palet. Değiştir, kaydet, tablette anında gör. */
export const BOARD_THEME: keyof typeof boardThemes = 'zeytin';

export const theme = {
  board: boardThemes[BOARD_THEME],

  piece: {
    white: '#FCFCFA',
    whiteEdge: '#1A1A1A',
    black: '#1A1A1A',
    blackEdge: '#F0F0F0',
    /** Taşın kare içinde kapladığı oran. 0.7–0.9 arası dene. */
    scale: 0.82,
    /** Sürüklerken taş ne kadar büyüsün. */
    dragScale: 1.15,
  },

  anim: {
    /** Hamle kayma süresi (ms). 0 yaparsan animasyon kapanır. */
    move: 160,
  },

  /** Tahta çerçevesi kalınlığı (piksel). 0 = çerçevesiz. */
  frame: 6,

  bg: '#161513',
  panel: '#222018',
  panelEdge: '#33302A',
  button: '#312D22',
  text: '#EDEAE2',
  textDim: '#9A958A',
  warn: '#C9A227',
  radius: 10,
  gap: 12,
};
