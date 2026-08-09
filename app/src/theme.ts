/**
 * Tek renk/ölçü kaynağı. Bileşenlerin içine renk kodu yazılmaz.
 * Adım 5'te tema seçici eklenecekse burası çoğaltılır.
 */
export const theme = {
  board: {
    light: '#EDE6D6',
    dark: '#7C8C5A',
    selected: '#F2E14C',
    lastMove: '#D9D26B',
    target: 'rgba(20, 20, 20, 0.28)',
    coord: 'rgba(20, 20, 20, 0.55)',
    frame: '#3A3A33',
  },
  piece: {
    white: '#FCFCFA',
    whiteEdge: '#1A1A1A',
    black: '#1A1A1A',
    blackEdge: '#F0F0F0',
  },
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
