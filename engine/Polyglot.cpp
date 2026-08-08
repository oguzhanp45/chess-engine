#include "Polyglot.hpp"
#include "Board.hpp"
#include "PolyglotKeys.hpp"
#include "Notation.hpp"
#include <fstream>
#include <vector>
#include <cstdlib>
#include <cstdint>
#include <cstring>

// ============================================================
//  FAZ 5a: TASINABILIR BYTE CEVIRME
// ============================================================
// Onceki surum <intrin.h> ve _byteswap_uint64 kullaniyordu; bunlar
// YALNIZCA MSVC'de var. Yani motor Windows disinda hic derlenmiyordu -
// Android NDK (clang) ilk engelde duruyordu.
#if defined(_MSC_VER)
#include <cstdlib>
#define ENGINE_BSWAP64(x) _byteswap_uint64(x)
#define ENGINE_BSWAP16(x) _byteswap_ushort(x)
#elif defined(__GNUC__) || defined(__clang__)
#define ENGINE_BSWAP64(x) __builtin_bswap64(x)
#define ENGINE_BSWAP16(x) __builtin_bswap16(x)
#else
  // Saf C++ geri donus: derleyiciler bu kalibi zaten tek komuta cevirir.
static inline unsigned long long ENGINE_BSWAP64(unsigned long long v) {
    return ((v & 0x00000000000000FFULL) << 56) | ((v & 0x000000000000FF00ULL) << 40) |
        ((v & 0x0000000000FF0000ULL) << 24) | ((v & 0x00000000FF000000ULL) << 8) |
        ((v & 0x000000FF00000000ULL) >> 8) | ((v & 0x0000FF0000000000ULL) >> 24) |
        ((v & 0x00FF000000000000ULL) >> 40) | ((v & 0xFF00000000000000ULL) >> 56);
}
static inline unsigned short ENGINE_BSWAP16(unsigned short v) {
    return (unsigned short)((v << 8) | (v >> 8));
}
#endif

// Polyglot dosyalari Big-Endian; bellekten okurken cevirmemiz gerekiyor.
unsigned long long PolyglotBook::readKey(const unsigned char* p) {
    unsigned long long v;
    std::memcpy(&v, p, 8);
    return ENGINE_BSWAP64(v);
}

unsigned short PolyglotBook::readU16(const unsigned char* p) {
    unsigned short v;
    std::memcpy(&v, p, 2);
    return ENGINE_BSWAP16(v);
}

unsigned long long PolyglotBook::computeHash(ChessBoard& board) {
    unsigned long long polyHash = 0;

    // 1. TASLAR
    for (int r = 0; r < 8; r++) {
        for (int c = 0; c < 8; c++) {
            int piece = board.getPiece(r, c);
            if (piece != 0) {
                int type = std::abs(piece);
                bool isWhite = (piece > 0);
                int polyPiece = (type - 1) * 2 + (isWhite ? 1 : 0);
                int polySquare = (7 - r) * 8 + c;
                polyHash ^= Random64[polyPiece * 64 + polySquare];
            }
        }
    }

    // 2. ROK HAKLARI
    if (board.whiteCastleK) polyHash ^= Random64[768];
    if (board.whiteCastleQ) polyHash ^= Random64[769];
    if (board.blackCastleK) polyHash ^= Random64[770];
    if (board.blackCastleQ) polyHash ^= Random64[771];

    // 3. EN PASSANT (Polyglot kurali: yalnizca gercekten alinabiliyorsa)
    if (board.enPassantCol != -1) {
        bool canCapture = false;
        int epRow = (board.currentPlayer == 1) ? 3 : 4;
        int myPawn = (board.currentPlayer == 1) ? W_PAWN : B_PAWN;
        if (board.enPassantCol > 0 && board.getPiece(epRow, board.enPassantCol - 1) == myPawn) canCapture = true;
        if (board.enPassantCol < 7 && board.getPiece(epRow, board.enPassantCol + 1) == myPawn) canCapture = true;
        if (canCapture) polyHash ^= Random64[772 + board.enPassantCol];
    }

    // 4. SIRA (Polyglot sadece sira beyazdaysa ekler)
    if (board.currentPlayer == 1) {
        polyHash ^= Random64[780];
    }

    return polyHash;
}


// ============================================================
//  KITABI BIR KEZ BELLEGE AL
// ============================================================
bool PolyglotBook::load(const std::string& path) {
    if (loaded) return true;
    if (loadFailed) return false;   // ayni dosyayi her hamlede yeniden denemeyelim

    std::ifstream file(path, std::ios::binary | std::ios::ate);
    if (!file.is_open()) {
        info("info string Acilis kitabi bulunamadi: " + path);
        loadFailed = true;
        return false;
    }

    std::streamsize size = file.tellg();
    if (size <= 0 || (size % 16) != 0) {
        info("info string Acilis kitabi bos veya bozuk: " + path);
        loadFailed = true;
        return false;
    }

    data.resize((size_t)size);
    file.seekg(0, std::ios::beg);
    if (!file.read(reinterpret_cast<char*>(data.data()), size)) {
        info("info string Acilis kitabi okunamadi: " + path);
        data.clear();
        loadFailed = true;
        return false;
    }

    loaded = true;
    info("info string Acilis kitabi yuklendi: " + std::to_string(size / 16) + " kayit");
    return true;
}

bool PolyglotBook::loadFromMemory(const unsigned char* bytes, size_t size) {
    if (bytes == nullptr || size == 0 || (size % 16) != 0) {
        info("info string Bellekteki kitap verisi gecersiz");
        loadFailed = true;
        return false;
    }
    data.assign(bytes, bytes + size);
    loaded = true;
    loadFailed = false;
    info("info string Acilis kitabi bellekten yuklendi: " + std::to_string(size / 16) + " kayit");
    return true;
}

Move PolyglotBook::getBookMove(ChessBoard& board, MoveGenerator& moveGen) {
    if (!loaded || data.empty()) return Move();

    const unsigned long long boardHash = board.zobristKey;
    const size_t numEntries = data.size() / 16;

    // Bellekte binary search
    size_t low = 0, high = numEntries;
    size_t matchIndex = numEntries;
    while (low < high) {
        size_t mid = low + (high - low) / 2;
        unsigned long long key = readKey(&data[mid * 16]);
        if (key == boardHash) { matchIndex = mid; break; }
        else if (key < boardHash) low = mid + 1;
        else high = mid;
    }
    if (matchIndex == numEntries) return Move();

    // Ayni anahtarin ilk kaydina geri sar
    size_t first = matchIndex;
    while (first > 0 && readKey(&data[(first - 1) * 16]) == boardHash) first--;

    unsigned short maxWeight = 0;
    std::vector<unsigned short> bestMoves;

    for (size_t i = first; i < numEntries; i++) {
        const unsigned char* e = &data[i * 16];
        if (readKey(e) != boardHash) break;

        unsigned short move = readU16(e + 8);
        unsigned short weight = readU16(e + 10);

        if (weight > maxWeight) { maxWeight = weight; bestMoves.clear(); bestMoves.push_back(move); }
        else if (weight == maxWeight) bestMoves.push_back(move);
    }
    if (bestMoves.empty()) return Move();

    // FAZ 5a: srand/rand yerine bir kez tohumlanan mt19937
    std::uniform_int_distribution<size_t> pick(0, bestMoves.size() - 1);
    unsigned short chosen = bestMoves[pick(rng)];

    int toCol = chosen & 7;
    int toRowPoly = (chosen >> 3) & 7;
    int fromCol = (chosen >> 6) & 7;
    int fromRowPoly = (chosen >> 9) & 7;
    int promo = (chosen >> 12) & 7;

    int sRow = 7 - fromRowPoly;
    int tRow = 7 - toRowPoly;

    int promotionPiece = 0;
    if (promo != 0) {
        int color = board.currentPlayer;
        if (promo == 1)      promotionPiece = color * W_KNIGHT;
        else if (promo == 2) promotionPiece = color * W_BISHOP;
        else if (promo == 3) promotionPiece = color * W_ROOK;
        else if (promo == 4) promotionPiece = color * W_QUEEN;
    }

    // Kitaptan gelen hamlenin gercekten legal oldugunu dogrula
    std::vector<Move> legals = moveGen.getLegalMoves(board);
    for (size_t i = 0; i < legals.size(); i++) {
        const Move& m = legals[i];
        if (m.startRow == sRow && m.startCol == fromCol &&
            m.targetRow == tRow && m.targetCol == toCol &&
            m.promotionPiece == promotionPiece) {
            info("info string Kitap hamlesi: " + Notation::toUci(m) + " (agirlik " + std::to_string(maxWeight) + ")");
            return m;
        }
    }
    return Move();
}