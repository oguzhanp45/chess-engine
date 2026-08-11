/**
 * KONUM: app/src/screens/LearnScreen.tsx   (üzerine yaz)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';
import { t, tList, useLanguage } from '../i18n';

export default function LearnScreen() {
  useLanguage();
  return (
    <Placeholder
      title={t('learn.title')}
      step={t('learn.step')}
      items={tList('learn.items')}
    />
  );
}
