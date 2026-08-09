// KONUM: app/shared/NativeChessEngine.h
//
// C++ TurboModule başlığı. AppSpecsJSI.h Codegen tarafından üretilir;
// derlemeden önce dosya yoksa editör kırmızı gösterir, normaldir.
//
// NativeChessEngineCxxSpec, Codegen'in ürettiği taban sınıf. Adı,
// specs/NativeChessEngine.ts dosyasındaki modül adından türetilir.

#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeChessEngine
    : public NativeChessEngineCxxSpec<NativeChessEngine> {
 public:
  explicit NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker);

  std::string nativeVersion(jsi::Runtime& rt);
};

} // namespace facebook::react
