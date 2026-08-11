/**
 * KONUM: app/src/screens/PuzzlesScreen.tsx   (üzerine yaz)
 */

import React from 'react';
import Placeholder from '../components/Placeholder';
import { t, tList, useLanguage } from '../i18n';

export default function PuzzlesScreen() {
  useLanguage();
  return (
    <Placeholder
      title={t('puzzles.title')}
      step={t('puzzles.step')}
      items={tList('puzzles.items')}
    />
  );
}
