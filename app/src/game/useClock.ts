/**
 * KONUM: app/src/game/useClock.ts   (üzerine yaz)
 *
 * Değişiklik: aynı zamanlayıcı artık saate "yaşıyorum" damgası da vuruyor.
 * Donma tespiti buna dayanıyor (bkz. clock.ts).
 */

import { useEffect, useRef } from 'react';
import type { Side } from '../chess/engine';
import type { TimeControl } from './types';
import { createClock, type Clock } from './clock';

export function useClock(time: TimeControl, onFlag: (side: Side) => void): Clock {
  const clockRef = useRef<Clock | null>(null);
  if (clockRef.current === null) clockRef.current = createClock(time);
  const clock = clockRef.current;

  const onFlagRef = useRef(onFlag);
  onFlagRef.current = onFlag;

  useEffect(() => {
    if (!clock.enabled) return;
    const id = setInterval(() => {
      clock.beat();                    // önce donma kontrolü
      const side = clock.takeFlag();   // sonra süre bitti mi
      if (side !== null) onFlagRef.current(side);
    }, 200);
    return () => clearInterval(id);
  }, [clock]);

  return clock;
}
