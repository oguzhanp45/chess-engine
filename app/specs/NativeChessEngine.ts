/**
 * KONUM: app/specs/NativeChessEngine.ts
 *
 * JS ile C++ arasındaki sözleşme. Codegen bu dosyayı okuyup her iki taraf
 * için ara kodu üretir. Dosya adı "Native" ile başlamak ZORUNDA, yoksa
 * Codegen dosyayı yok sayar.
 *
 * Adım 2'de tek metot var. Adım 3'te EngineApi metotları buraya eklenecek.
 */

import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  readonly nativeVersion: () => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativeChessEngine');
