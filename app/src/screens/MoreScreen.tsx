/**
 * KONUM: app/src/screens/MoreScreen.tsx   (yeni dosya)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';

export default function MoreScreen() {
  return (
    <Placeholder
      title="Daha Fazla"
      step="Adım 7, 9, 13 ve 14'e dağılmış"
      items={[
        'Profil ve istatistikler (Adım 13)',
        'Oyun geçmişi ve kayıtlı oyunlar (Adım 7)',
        'Analiz tahtası (Adım 9)',
        'Satranç Gezgini (Adım 14)',
        'Temalar: tahta paletleri, taş setleri (Adım 14)',
        'Ayarlar: ses, seviye, süre varsayılanları (Adım 6-7)',
        'Destek ve hakkında',
      ]}
    />
  );
}
