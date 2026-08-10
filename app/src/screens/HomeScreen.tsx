/**
 * KONUM: app/src/screens/HomeScreen.tsx   (yeni dosya)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';

export default function HomeScreen() {
  return (
    <Placeholder
      title="Ana Sayfa"
      step="Adım 14'te doldurulacak"
      items={[
        'Kullanıcı kartı: isim, seviye, ELO, günlük seri',
        'Günün bulmacası önizlemesi ve "Çöz" düğmesi',
        'Hızlı oyna: Eğitmene karşı, Yapay zekaya karşı',
        'Eğitime devam et: son kursun ilerleme çubuğu',
      ]}
    />
  );
}
