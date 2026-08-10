/**
 * KONUM: app/src/screens/PuzzlesScreen.tsx   (yeni dosya)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';

export default function PuzzlesScreen() {
  return (
    <Placeholder
      title="Bulmacalar"
      step="Adım 10'da doldurulacak"
      items={[
        'Günlük bulmaca',
        'Zamanlı mod (3 / 5 dakika)',
        'Hayatta kalma (3 yanlış)',
        'Tematik: saldırı, savunma, oyun sonu, dengesizlikler',
        'Taktik türleri: çatal, açmaz, şiş, saptırma, feda, mat',
        'İpucu merdiveni ve bulmaca reytingi',
      ]}
    />
  );
}
