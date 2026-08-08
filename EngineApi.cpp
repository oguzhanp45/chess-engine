#include "EngineApi.hpp"
#include "Notation.hpp"
#include "Tests.hpp"

EngineApi::EngineApi() {
    newGame();
}

// ---------------- OYUN KURULUMU ----------------
bool EngineApi::newGame(const std::string& fen) {
    std::string useFen = fen.empty() ? std::string(Tests::START_FEN) : fen;

    if (!board.setFen(useFen)) {
        board.initializeBoard();
        startFen = Tests::START_FEN;
        playedMoves.clear();
        gameHistory.clear();
        gameHistory.push_back(board.zobristKey);
        ai.clearTT();
        return false;
    }

    startFen = useFen;
    playedMoves.clear();
    gameHistory.clear();
    gameHistory.push_back(board.zobristKey);
    ai.clearTT();
    return true;
}

// ---------------- DURUM SORGULARI ----------------
std::string EngineApi::getFen() { return board.getFen(); }

std::string EngineApi::sideToMove() { return (board.currentPlayer == 1) ? "w" : "b"; }

bool EngineApi::inCheck() { return board.isKingAttacked(board.currentPlayer); }

std::vector<std::string> EngineApi::legalMoves() {
    std::vector<Move> moves = moveGen.getLegalMoves(board);
    std::vector<std::string> out;
    out.reserve(moves.size());
    for (size_t i = 0; i < moves.size(); i++) out.push_back(Notation::toUci(moves[i]));
    return out;
}

std::string EngineApi::gameStatus() {
    std::vector<Move> moves = moveGen.getLegalMoves(board);
    if (moves.empty()) {
        return inCheck() ? "checkmate" : "stalemate";
    }
    if (board.isInsufficientMaterial()) return "draw-material";
    if (board.halfMoveClock >= 100)      return "draw-fifty";
    if (board.repetitionCount() >= 3)    return "draw-repetition";
    return "ongoing";
}

std::vector<std::string> EngineApi::moveHistorySan() {
    // Baslangic pozisyonuna donup hamleleri tekrar oynayarak SAN uretiyoruz.
    // SAN, oynandigi ANDAKI pozisyona bagli oldugu icin baska yolu yok.
    ChessBoard tmp;
    tmp.setFen(startFen);
    MoveGenerator mg;
    std::vector<std::string> out;
    out.reserve(playedMoves.size());
    for (size_t i = 0; i < playedMoves.size(); i++) {
        out.push_back(Notation::toSan(playedMoves[i], tmp, mg));
        tmp.makeMove(playedMoves[i]);
    }
    return out;
}

// ---------------- HAMLE ----------------
bool EngineApi::findLegal(const std::string& uci, Move& out) {
    return Notation::fromUci(uci, board, moveGen, out);
}

bool EngineApi::makeMove(const std::string& uci) {
    Move m;
    if (!findLegal(uci, m)) return false;
    board.makeMove(m);
    playedMoves.push_back(m);
    gameHistory.push_back(board.zobristKey);
    return true;
}

bool EngineApi::undo() {
    if (playedMoves.empty()) return false;
    board.undoMove();
    playedMoves.pop_back();
    if (!gameHistory.empty()) gameHistory.pop_back();
    return true;
}

std::string EngineApi::sanFor(const std::string& uci) {
    Move m;
    if (!findLegal(uci, m)) return "";
    return Notation::toSan(m, board, moveGen);
}

// ---------------- ARAMA ----------------
std::string EngineApi::bestMove(int timeMs, int maxDepth) {
    if (timeMs < 10) timeMs = 10;
    Move m = ai.getBestMoveTimed(board, maxDepth, timeMs, timeMs, gameHistory);
    if (m.isNull()) return "";     // mat veya pat
    return Notation::toUci(m);
}

void EngineApi::stop() { ai.stop(); }

// ---------------- AYARLAR ----------------
void EngineApi::setSkillLevel(int level) { ai.setSkillLevel(level); }
int  EngineApi::getSkillLevel() const { return ai.getSkillLevel(); }
void EngineApi::setHashSizeMB(int mb) { ai.setHashSizeMB(mb); }
void EngineApi::setUseBook(bool on) { ai.useBook = on; }

bool EngineApi::loadBookFromFile(const std::string& path) {
    ai.bookPath = path;
    return true;   // gercek yukleme ilk aramada yapilir
}

bool EngineApi::loadBookFromMemory(const unsigned char* bytes, size_t size) {
    return ai.loadBookFromMemory(bytes, size);
}

void EngineApi::setInfoCallback(std::function<void(const std::string&)> cb) {
    ai.setInfoCallback(cb);
}