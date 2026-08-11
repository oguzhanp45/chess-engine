/**
 * KONUM: app/src/i18n/tr.ts   (yeni dosya, yeni klasör)
 *
 * TÜRKÇE SÖZLÜK — referans dil. Yeni metin önce buraya eklenir, sonra en.ts'e.
 * İngilizce karşılığı yoksa uygulama Türkçesine düşer, çökmez.
 *
 * Anahtar düzeni: alan.altAlan. Metin içindeki {isim} yer tutucusu
 * t('anahtar', { isim: 'değer' }) ile doldurulur.
 */

export const tr = {
  tabs: {
    home: 'Ana Sayfa',
    play: 'Oyna',
    puzzles: 'Bulmacalar',
    learn: 'Öğren',
    more: 'Daha Fazla',
  },

  common: {
    white: 'Beyaz',
    black: 'Siyah',
    random: 'Rastgele',
    apply: 'Uygula',
    cancel: 'Vazgeç',
    close: 'Kapat',
    menu: 'Menü',
    soon: 'yakında',
  },

  home: {
    title: 'Ana Sayfa',
    step: "Adım 14'te doldurulacak",
    items: [
      'Kullanıcı kartı: isim, seviye, ELO, günlük seri',
      'Günün bulmacası önizlemesi ve "Çöz" düğmesi',
      'Hızlı oyna: Eğitmene karşı, Yapay zekaya karşı',
      'Eğitime devam et: son kursun ilerleme çubuğu',
    ],
  },

  puzzles: {
    title: 'Bulmacalar',
    step: "Adım 10'da doldurulacak",
    items: [
      'Günlük bulmaca',
      'Zamanlı mod (3 / 5 dakika)',
      'Hayatta kalma (3 yanlış)',
      'Tematik: saldırı, savunma, oyun sonu, dengesizlikler',
      'Taktik türleri: çatal, açmaz, şiş, saptırma, feda, mat',
      'İpucu merdiveni ve bulmaca reytingi',
    ],
  },

  learn: {
    title: 'Öğren',
    step: "Adım 12'de doldurulacak",
    items: [
      'Satranç Yolculuğu: Temeller → Taktikler → Saldırı → Savunma → Strateji → Oyun Sonu → İleri',
      'Kurs kartları ve ilerleme çubukları',
      'Ders ekranı: tahta + eğitmen kutusu, [Düşün] [İpucu]',
      'Ustalardan Dersler: Morphy, Capablanca, Fischer, Karpov',
      'Oyun sonu alıştırmaları',
    ],
  },

  more: {
    title: 'Daha Fazla',
    step: "Adım 7, 9, 13 ve 14'e dağılmış",
    items: [
      'Profil ve istatistikler',
      'Oyun geçmişi ve kayıtlı oyunlar',
      'Analiz tahtası',
      'Satranç Gezgini',
      'Temalar: tahta paletleri, taş setleri',
      'Ayarlar: ses, seviye, süre varsayılanları',
      'Destek ve hakkında',
    ],
  },

  settings: {
    language: 'Dil',
    turkish: 'Türkçe',
    english: 'English',
    book: 'Açılış kitabı',
    bookLoaded: 'Yüklü — {count} kayıt',
    bookMissing: 'Yüklenemedi ({reason})',
  },

  newGame: {
    mode: 'Mod',
    ai: 'Yapay Zeka',
    local: 'Yerel 1v1',
    tutor: 'Eğitmen',
    yourColor: 'Rengin',
    difficulty: 'Zorluk',
    time: 'Süre',
    unlimited: 'Süresiz',
    custom: 'Özel',
    minutes: 'dk',
    perMove: 'sn/hamle',
    start: 'Oyunu Başlat',
    book: 'Açılış kitabı',
    bookOn: 'Açık',
    bookOff: 'Kapalı',
  },

  levels: {
    l0: 'Acemi',
    l4: 'Başlangıç',
    l8: 'Orta',
    l12: 'İyi',
    l16: 'Zor',
    l20: 'Tam güç',
  },

  play: {
    turn: 'Sıra: {side}',
    check: 'ŞAH!',
    youAre: 'sen {color}',
    moves: 'Hamleler',
    noMoves: 'Henüz hamle yok.',
    again: 'Yeniden',
    undo: 'Geri al',
    flip: 'Çevir',
    stop: 'Durdur',
    engineMove: 'Motor oynasın',
    thinking: 'Motor düşünüyor...',
    searchInfo: 'derinlik {depth} · {score} · {nps} d/sn',
    noMoveFound: 'Motor hamle bulamadı.',
    timeUp: 'Süre bitti — {winner} kazandı',
  },

  status: {
    ongoing: 'Oyun sürüyor',
    checkmateWhiteWins: 'Mat — beyaz kazandı',
    checkmateBlackWins: 'Mat — siyah kazandı',
    stalemate: 'Pat — beraberlik',
    drawFifty: 'Beraberlik — 50 hamle kuralı',
    drawRepetition: 'Beraberlik — üç kez tekrar',
    drawMaterial: 'Beraberlik — yetersiz materyal',
  },

  promotion: {
    title: 'Terfi',
    queen: 'Vezir',
    rook: 'Kale',
    bishop: 'Fil',
    knight: 'At',
    hint: 'Vazgeçmek için dışarı dokun',
  },

  gameOver: {
    rematch: 'Tekrar oyna',
    analyze: 'Analiz et',
    hint: 'Tahtaya bakmak için dışarı dokun',
  },
};

export type Dict = typeof tr;
