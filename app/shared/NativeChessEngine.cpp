// KONUM: app/shared/NativeChessEngine.cpp
//
// Adım 2'nin tek amacı: C++'tan JS'e bir değer geçtiğini kanıtlamak.
// Motor henüz bağlı değil. Adım 3'te EngineApi buraya dahil edilecek.

#include "NativeChessEngine.h"

namespace facebook::react {

NativeChessEngine::NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeChessEngineCxxSpec(std::move(jsInvoker)) {}

std::string NativeChessEngine::nativeVersion(jsi::Runtime& rt) {
  // Derleyici ve standart bilgisi: köprünün gerçekten C++ tarafından
  // geldiğini ve hangi standartla derlendiğini tek satırda görürüz.
  std::string standard = "bilinmiyor";
  if (__cplusplus >= 201703L) {
    standard = "C++17+";
  }
  return "chess-native 0.1 / " + standard;
}

} // namespace facebook::react
