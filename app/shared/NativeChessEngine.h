// KONUM: app/shared/NativeChessEngine.h   (üzerine yaz)
//
// EngineApi iş parçacığı güvenli DEĞİL. Arama arka planda çalışırken JS
// tarafından gelen hiçbir çağrı motora dokunmamalı. Kurallar:
//
//   searching_ == true iken:
//     snapshot()  -> önbellekteki son durumu döndürür (motora dokunmaz)
//     makeMove()  -> false
//     undo()      -> false
//     newGame()   -> false
//     sanFor()    -> ""
//     stop()      -> izinli (EngineApi::stop atomic ile çalışır)
//
// Konum bilgisi her değişiklikten sonra bir kez hesaplanıp önbelleğe yazılır.

#pragma once

#include <AppSpecsJSI.h>

#include <EngineApi.hpp>

#include <atomic>
#include <memory>
#include <mutex>
#include <string>
#include <thread>

namespace facebook::react {

class NativeChessEngine
    : public NativeChessEngineCxxSpec<NativeChessEngine> {
 public:
  explicit NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker);
  ~NativeChessEngine();

  std::string nativeVersion(jsi::Runtime& rt);

  bool newGame(jsi::Runtime& rt, std::string fen);
  std::string snapshot(jsi::Runtime& rt);

  bool makeMove(jsi::Runtime& rt, std::string uci);
  bool undo(jsi::Runtime& rt);
  std::string sanFor(jsi::Runtime& rt, std::string uci);

  void startSearch(jsi::Runtime& rt, double timeMs, double maxDepth);
  std::string searchState(jsi::Runtime& rt);
  void stop(jsi::Runtime& rt);

  void setSkillLevel(jsi::Runtime& rt, double level);
  double getSkillLevel(jsi::Runtime& rt);
  void setHashSizeMB(jsi::Runtime& rt, double mb);

 private:
  void rebuildSnapshot();          // motora dokunur, önbelleği tazeler
  void joinWorker();               // iş parçacığını bekler
  void onInfoLine(const std::string& line);

  EngineApi engine_;

  std::thread worker_;
  std::atomic<bool> searching_{false};

  std::mutex mutex_;               // aşağıdaki alanları korur
  std::string cachedSnapshot_;
  std::string resultMove_;
  int liveDepth_{0};
  int liveScore_{0};
  long long liveNodes_{0};
  bool liveMate_{false};
};

} // namespace facebook::react
