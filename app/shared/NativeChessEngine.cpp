// KONUM: app/shared/NativeChessEngine.cpp   (üzerine yaz)

#include "NativeChessEngine.h"
#include "AssetReader.h"
#include <sstream>
#include <utility>
#include <vector>

namespace facebook::react {

namespace {

std::string esc(const std::string& in) {
  std::string out;
  out.reserve(in.size() + 8);
  for (char c : in) {
    switch (c) {
      case '"':  out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n";  break;
      case '\r': out += "\\r";  break;
      case '\t': out += "\\t";  break;
      default:
        if (static_cast<unsigned char>(c) >= 0x20) out += c;
        break;
    }
  }
  return out;
}

std::string jsonArray(const std::vector<std::string>& items) {
  std::string out = "[";
  for (std::size_t i = 0; i < items.size(); ++i) {
    if (i > 0) out += ',';
    out += '"';
    out += esc(items[i]);
    out += '"';
  }
  out += ']';
  return out;
}

} // namespace
std::string NativeChessEngine::loadBook(jsi::Runtime&, std::string assetName) {
    // Değişmez kural 3: arama sürerken motora dokunmuyoruz.
    if (searching_.load()) {
        return R"({"ok":false,"reason":"searching"})";
    }

    const std::vector<unsigned char> bytes = chessapp::readAsset(assetName);
    if (bytes.empty()) {
        return R"({"ok":false,"reason":"asset-not-found"})";
    }

    const bool ok = engine_.loadBookFromMemory(bytes.data(), bytes.size());
    if (!ok) {
        return R"({"ok":false,"reason":"parse-failed","bytes":)" +
               std::to_string(bytes.size()) + "}";
    }
    return R"({"ok":true,"bytes":)" + std::to_string(bytes.size()) + "}";
}

void NativeChessEngine::setUseBook(jsi::Runtime&, bool on) {
    engine_.setUseBook(on);
}

NativeChessEngine::NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeChessEngineCxxSpec(std::move(jsInvoker)) {
  // Mobilde bellek sınırlı; masaüstü varsayılanı tablette sorun çıkarabilir.
  engine_.setHashSizeMB(32);

  // Arama sırasındaki "info depth ..." satırları buraya akar. Bu geri çağırım
  // ARAMA İŞ PARÇACIĞINDAN çalışır — içeride sadece kilitli alan güncellenir.
  engine_.setInfoCallback([this](const std::string& line) { onInfoLine(line); });

  engine_.newGame("");
  rebuildSnapshot();
}

NativeChessEngine::~NativeChessEngine() {
  engine_.stop();
  joinWorker();
}

void NativeChessEngine::joinWorker() {
  if (worker_.joinable()) worker_.join();
}

/**
 * "info depth 7 score cp 59 nodes 126661 time 114 nps 1111061 pv d2d4"
 * Sadece ihtiyacımız olan dört alanı çekiyoruz. Beklenmeyen biçim gelirse
 * sessizce yok sayılır — arama bu yüzden bozulmamalı.
 */
void NativeChessEngine::onInfoLine(const std::string& line) {
  std::istringstream in(line);
  std::string token;
  int depth = -1;
  int score = 0;
  bool mate = false;
  long long nodes = -1;

  while (in >> token) {
    if (token == "depth") {
      in >> depth;
    } else if (token == "score") {
      std::string kind;
      in >> kind;
      in >> score;
      mate = (kind == "mate");
    } else if (token == "nodes") {
      in >> nodes;
    }
  }

  std::lock_guard<std::mutex> lock(mutex_);
  if (depth >= 0) liveDepth_ = depth;
  if (nodes >= 0) liveNodes_ = nodes;
  liveScore_ = score;
  liveMate_ = mate;
}

void NativeChessEngine::rebuildSnapshot() {
  const std::string fen = engine_.getFen();
  const std::string side = engine_.sideToMove();
  const std::string status = engine_.gameStatus();
  const bool check = engine_.inCheck();
  const std::vector<std::string> legal = engine_.legalMoves();
  const std::vector<std::string> history = engine_.moveHistorySan();

  std::string out = "{";
  out += "\"fen\":\"" + esc(fen) + "\",";
  out += "\"side\":\"" + esc(side) + "\",";
  out += "\"status\":\"" + esc(status) + "\",";
  out += std::string("\"check\":") + (check ? "true" : "false") + ",";
  out += "\"legal\":" + jsonArray(legal) + ",";
  out += "\"history\":" + jsonArray(history);
  out += "}";

  std::lock_guard<std::mutex> lock(mutex_);
  cachedSnapshot_ = out;
}

std::string NativeChessEngine::nativeVersion(jsi::Runtime&) {
  return "chess-native 0.3 / arka plan arama";
}

bool NativeChessEngine::newGame(jsi::Runtime&, std::string fen) {
  if (searching_.load()) return false;
  joinWorker();
  const bool ok = engine_.newGame(fen);
  {
    std::lock_guard<std::mutex> lock(mutex_);
    resultMove_.clear();
    liveDepth_ = 0;
    liveScore_ = 0;
    liveNodes_ = 0;
    liveMate_ = false;
  }
  rebuildSnapshot();
  return ok;
}

std::string NativeChessEngine::snapshot(jsi::Runtime&) {
  std::lock_guard<std::mutex> lock(mutex_);
  return cachedSnapshot_;
}

bool NativeChessEngine::makeMove(jsi::Runtime&, std::string uci) {
  if (searching_.load()) return false;
  joinWorker();
  const bool ok = engine_.makeMove(uci);
  if (ok) rebuildSnapshot();
  return ok;
}

bool NativeChessEngine::undo(jsi::Runtime&) {
  if (searching_.load()) return false;
  joinWorker();
  const bool ok = engine_.undo();
  if (ok) rebuildSnapshot();
  return ok;
}

std::string NativeChessEngine::sanFor(jsi::Runtime&, std::string uci) {
  if (searching_.load()) return "";
  return engine_.sanFor(uci);
}

void NativeChessEngine::startSearch(
    jsi::Runtime&,
    double timeMs,
    double maxDepth) {
  if (searching_.load()) return;
  joinWorker(); // önceki arama bitmişse iş parçacığını topla

  {
    std::lock_guard<std::mutex> lock(mutex_);
    resultMove_.clear();
    liveDepth_ = 0;
    liveScore_ = 0;
    liveNodes_ = 0;
    liveMate_ = false;
  }

  const int ms = static_cast<int>(timeMs);
  const int depth = maxDepth > 0 ? static_cast<int>(maxDepth) : 64;

  searching_.store(true);
  worker_ = std::thread([this, ms, depth]() {
    std::string move;
    try {
      move = engine_.bestMove(ms, depth);
    } catch (...) {
      move.clear(); // arama içindeki bir hata uygulamayı çökertmesin
    }
    {
      std::lock_guard<std::mutex> lock(mutex_);
      resultMove_ = move;
      liveDepth_ = engine_.lastDepth();
      liveScore_ = engine_.lastScore();
      liveNodes_ = engine_.lastNodes();
    }
    // Bayrağı EN SON indir: JS bunu görünce sonucu okumaya başlayacak.
    searching_.store(false);
  });
}

std::string NativeChessEngine::searchState(jsi::Runtime&) {
  const bool running = searching_.load();

  std::lock_guard<std::mutex> lock(mutex_);
  std::string out = "{";
  out += std::string("\"running\":") + (running ? "true" : "false") + ",";
  out += "\"move\":\"" + esc(resultMove_) + "\",";
  out += "\"depth\":" + std::to_string(liveDepth_) + ",";
  out += "\"score\":" + std::to_string(liveScore_) + ",";
  out += "\"nodes\":" + std::to_string(liveNodes_) + ",";
  out += std::string("\"mate\":") + (liveMate_ ? "true" : "false");
  out += "}";
  return out;
}

void NativeChessEngine::stop(jsi::Runtime&) {
  engine_.stop();
}

void NativeChessEngine::setSkillLevel(jsi::Runtime&, double level) {
  if (searching_.load()) return;
  engine_.setSkillLevel(static_cast<int>(level));
}

double NativeChessEngine::getSkillLevel(jsi::Runtime&) {
  return static_cast<double>(engine_.getSkillLevel());
}

void NativeChessEngine::setHashSizeMB(jsi::Runtime&, double mb) {
  if (searching_.load()) return;
  engine_.setHashSizeMB(static_cast<int>(mb));
}

} // namespace facebook::react
