/**
 * KONUM: app/src/screens/LearnScreen.tsx   (yeni dosya)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';

export default function LearnScreen() {
  return (
    <Placeholder
      title="Öğren"
      step="Adım 12'de doldurulacak"
      items={[
        'Satranç Yolculuğu: Temeller → Taktikler → Saldırı → Savunma → Strateji → Oyun Sonu → İleri',
        'Kurs kartları ve ilerleme çubukları',
        'Ders ekranı: tahta + eğitmen kutusu, [Düşün] [İpucu]',
        'Ustalardan Dersler: Morphy, Capablanca, Fischer, Karpov',
        'Oyun sonu alıştırmaları (Adım 14)',
      ]}
    />
  );
}
