// KONUM: app/shared/NativeChessEngine.cpp   (mevcut dosyanın üzerine yaz)

#include "NativeChessEngine.h"

#include <string>
#include <vector>

namespace facebook::react {

namespace {

// FEN, UCI ve SAN metinlerinde JSON'u bozacak karakter beklenmiyor ama
// kaçış yapmamak, ileride buraya yorum/hata metni eklendiğinde sessiz
// bir bozulma demek. Ucuz sigorta.
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
  for (size_t i = 0; i < items.size(); ++i) {
    if (i > 0) out += ',';
    out += '"';
    out += esc(items[i]);
    out += '"';
  }
  out += ']';
  return out;
}

} // namespace

NativeChessEngine::NativeChessEngine(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeChessEngineCxxSpec(std::move(jsInvoker)) {
  // Mobilde bellek sınırlı. Masaüstü varsayılanı tabletde sorun çıkarabilir.
  engine_.setHashSizeMB(32);
  engine_.newGame("");
}

std::string NativeChessEngine::nativeVersion(jsi::Runtime&) {
  return "chess-native 0.2 / EngineApi bagli";
}

bool NativeChessEngine::newGame(jsi::Runtime&, std::string fen) {
  return engine_.newGame(fen);
}

std::string NativeChessEngine::snapshot(jsi::Runtime&) {
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
  return out;
}

bool NativeChessEngine::makeMove(jsi::Runtime&, std::string uci) {
  return engine_.makeMove(uci);
}

bool NativeChessEngine::undo(jsi::Runtime&) {
  return engine_.undo();
}

std::string NativeChessEngine::sanFor(jsi::Runtime&, std::string uci) {
  return engine_.sanFor(uci);
}

std::string NativeChessEngine::bestMove(
    jsi::Runtime&,
    double timeMs,
    double maxDepth) {
  const int ms = static_cast<int>(timeMs);
  const int depth = maxDepth > 0 ? static_cast<int>(maxDepth) : 64;
  // Bloke eder: JS thread'i bu süre boyunca durur. Adım 4'te iş parçacığına
  // taşınacak; o zaman burası değişmeyecek, çağıran taraf değişecek.
  return engine_.bestMove(ms, depth);
}

void NativeChessEngine::stop(jsi::Runtime&) {
  engine_.stop();
}

void NativeChessEngine::setSkillLevel(jsi::Runtime&, double level) {
  engine_.setSkillLevel(static_cast<int>(level));
}

double NativeChessEngine::getSkillLevel(jsi::Runtime&) {
  return static_cast<double>(engine_.getSkillLevel());
}

void NativeChessEngine::setHashSizeMB(jsi::Runtime&, double mb) {
  engine_.setHashSizeMB(static_cast<int>(mb));
}

std::string NativeChessEngine::lastSearchInfo(jsi::Runtime&) {
  std::string out = "{";
  out += "\"score\":" + std::to_string(engine_.lastScore()) + ",";
  out += "\"depth\":" + std::to_string(engine_.lastDepth()) + ",";
  out += "\"nodes\":" + std::to_string(engine_.lastNodes());
  out += "}";
  return out;
}

} // namespace facebook::react
