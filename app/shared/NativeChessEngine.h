// KONUM: app/shared/NativeChessEngine.h   (mevcut dosyanın üzerine yaz)
//
// EngineApi örneği bu sınıfın üyesi. Uygulama boyunca tek örnek yaşar,
// oyun durumu C++ tarafında tutulur. JS yalnızca aynasını gösterir.
//
// Codegen tip eşlemesi:
//   TS string  -> std::string
//   TS number  -> double        (int'e biz çeviriyoruz)
//   TS boolean -> bool
//   TS void    -> void

#pragma once

#include <AppSpecsJSI.h>

#include <EngineApi.hpp>

#include <memory>
#include <string>

namespace facebook::react {

class NativeChessEngine
    : public NativeChessEngineCxxSpec<NativeChessEngine> {
 public:
  explicit NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker);

  std::string nativeVersion(jsi::Runtime& rt);

  bool newGame(jsi::Runtime& rt, std::string fen);
  std::string snapshot(jsi::Runtime& rt);

  bool makeMove(jsi::Runtime& rt, std::string uci);
  bool undo(jsi::Runtime& rt);
  std::string sanFor(jsi::Runtime& rt, std::string uci);

  std::string bestMove(jsi::Runtime& rt, double timeMs, double maxDepth);
  void stop(jsi::Runtime& rt);

  void setSkillLevel(jsi::Runtime& rt, double level);
  double getSkillLevel(jsi::Runtime& rt);
  void setHashSizeMB(jsi::Runtime& rt, double mb);

  std::string lastSearchInfo(jsi::Runtime& rt);

 private:
  EngineApi engine_;
};

} // namespace facebook::react
