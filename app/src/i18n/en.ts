/**
 * KONUM: app/src/i18n/en.ts   (yeni dosya)
 *
 * ENGLISH DICTIONARY. Mirrors tr.ts. A missing key falls back to Turkish
 * rather than crashing, so partial translations are safe.
 */

import type { Dict } from './tr';

export const en: Dict = {
  tabs: {
    home: 'Home',
    play: 'Play',
    puzzles: 'Puzzles',
    learn: 'Learn',
    more: 'More',
  },

  common: {
    white: 'White',
    black: 'Black',
    random: 'Random',
    apply: 'Apply',
    cancel: 'Cancel',
    close: 'Close',
    menu: 'Menu',
    soon: 'soon',
  },

  home: {
    title: 'Home',
    step: 'Coming in step 14',
    items: [
      'Player card: name, level, rating, daily streak',
      'Daily puzzle preview and "Solve" button',
      'Quick play: vs Tutor, vs Engine',
      'Continue learning: progress bar of your last course',
    ],
  },

  puzzles: {
    title: 'Puzzles',
    step: 'Coming in step 10',
    items: [
      'Daily puzzle',
      'Timed mode (3 / 5 minutes)',
      'Survival (3 mistakes)',
      'Themes: attack, defence, endgame, imbalances',
      'Tactics: fork, pin, skewer, deflection, sacrifice, mate',
      'Hint ladder and puzzle rating',
    ],
  },

  learn: {
    title: 'Learn',
    step: 'Coming in step 12',
    items: [
      'Chess Journey: Basics → Tactics → Attack → Defence → Strategy → Endgame → Advanced',
      'Course cards with progress bars',
      'Lesson screen: board + tutor panel, [Think] [Hint]',
      'Lessons from the Masters: Morphy, Capablanca, Fischer, Karpov',
      'Endgame drills',
    ],
  },

  more: {
    title: 'More',
    step: 'Spread across steps 7, 9, 13 and 14',
    items: [
      'Profile and statistics',
      'Game history and saved games',
      'Analysis board',
      'Opening Explorer',
      'Themes: board palettes, piece sets',
      'Settings: sound, level, time defaults',
      'Support and about',
    ],
  },

  settings: {
    language: 'Language',
    turkish: 'Türkçe',
    english: 'English',
    book: 'Opening book',
    bookLoaded: 'Loaded — {count} entries',
    bookMissing: 'Not loaded ({reason})',
  },

  newGame: {
    mode: 'Mode',
    ai: 'Engine',
    local: 'Local 1v1',
    tutor: 'Tutor',
    yourColor: 'Your colour',
    difficulty: 'Difficulty',
    time: 'Time',
    unlimited: 'Unlimited',
    custom: 'Custom',
    minutes: 'min',
    perMove: 'sec/move',
    start: 'Start Game',
    book: 'Opening book',
    bookOn: 'On',
    bookOff: 'Off',
  },

  levels: {
    l0: 'Rookie',
    l4: 'Beginner',
    l8: 'Intermediate',
    l12: 'Strong',
    l16: 'Hard',
    l20: 'Full strength',
  },

  play: {
    turn: 'Turn: {side}',
    check: 'CHECK!',
    youAre: 'you are {color}',
    moves: 'Moves',
    noMoves: 'No moves yet.',
    again: 'Restart',
    undo: 'Undo',
    flip: 'Flip',
    stop: 'Stop',
    engineMove: 'Engine move',
    thinking: 'Engine is thinking...',
    searchInfo: 'depth {depth} · {score} · {nps} n/s',
    noMoveFound: 'Engine found no move.',
    timeUp: 'Time out — {winner} wins',
  },

  status: {
    ongoing: 'Game in progress',
    checkmateWhiteWins: 'Checkmate — white wins',
    checkmateBlackWins: 'Checkmate — black wins',
    stalemate: 'Stalemate — draw',
    drawFifty: 'Draw — fifty-move rule',
    drawRepetition: 'Draw — threefold repetition',
    drawMaterial: 'Draw — insufficient material',
  },

  promotion: {
    title: 'Promotion',
    queen: 'Queen',
    rook: 'Rook',
    bishop: 'Bishop',
    knight: 'Knight',
    hint: 'Tap outside to cancel',
  },

  gameOver: {
    rematch: 'Rematch',
    analyze: 'Analyse',
    hint: 'Tap outside to see the board',
  },
};
