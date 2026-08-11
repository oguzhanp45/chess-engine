/**
 * KONUM: app/src/screens/HomeScreen.tsx   (üzerine yaz)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';
import { t, tList, useLanguage } from '../i18n';

export default function HomeScreen() {
  useLanguage();
  return (
    <Placeholder
      title={t('home.title')}
      step={t('home.step')}
      items={tList('home.items')}
    />
  );
}
