/**
 * KONUM: app/src/i18n/index.ts   (yeni dosya)
 *
 * Küçük ve bağımlılıksız çeviri katmanı.
 *
 * Kullanım:
 *   const lang = useLanguage();          // dil değişince yeniden çizilsin diye
 *   <Text>{t('play.undo')}</Text>
 *   <Text>{t('play.turn', { side: t('common.white') })}</Text>
 *   {tList('home.items').map(...)}
 *
 * Neden hazır kütüphane değil: ihtiyacımız arama + yer tutucu doldurma.
 * Elli satır. Bir native bağımlılık ve derleme turu eklemeye değmez.
 * İlerde çoğullama gibi ihtiyaç çıkarsa buranın içi değişir, çağrı yerleri değil.
 */

import { useSyncExternalStore } from 'react';
import { tr } from './tr';
import { en } from './en';

export type Lang = 'tr' | 'en';

const DICTS: Record<Lang, unknown> = { tr, en };

/** Cihaz dili. Hermes'te Intl var, ek paket gerekmiyor. */
function detectLanguage(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    return locale.toLowerCase().startsWith('tr') ? 'tr' : 'en';
  } catch {
    return 'tr';
  }
}

let current: Lang = detectLanguage();

// Dil değişince yeniden çizilmesi gereken bileşenler burada kayıtlı.
const listeners = new Set<() => void>();

export function getLanguage(): Lang {
  return current;
}

export function setLanguage(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  listeners.forEach(fn => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Bileşen bunu çağırırsa dil değiştiğinde yeniden çizilir. */
export function useLanguage(): Lang {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage);
}

/** 'play.turn' gibi noktalı yolu sözlükte arar. */
function lookup(dict: unknown, key: string): unknown {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

/** Metin getirir. Yoksa Türkçesine, o da yoksa anahtarın kendisine düşer. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const found = lookup(DICTS[current], key) ?? lookup(tr, key);
  if (typeof found !== 'string') return key;
  return fill(found, vars);
}

/** Dizi metinler için (madde listeleri). */
export function tList(key: string): string[] {
  const found = lookup(DICTS[current], key) ?? lookup(tr, key);
  return Array.isArray(found) ? (found as string[]) : [];
}

/** Sayıyı aktif dile göre biçimlendirir (1.234,5 / 1,234.5). */
export function formatNumber(value: number): string {
  return value.toLocaleString(current === 'tr' ? 'tr-TR' : 'en-US');
}
