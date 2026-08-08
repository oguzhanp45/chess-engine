#pragma once
#include "Types.hpp"
#include <vector>
#include <string>

class ChessBoard {
private:
    int board[8][8] = { 0 };

public:
    int currentPlayer = 1;
    int halfMoveClock = 0;
    int fullMoveNumber = 1;          // FAZ 0: FEN cikti/girisi icin eklendi

    // --- INCREMENTAL HASHING ---
    unsigned long long zobristKey = 0;
    unsigned long long pieceHash = 0;

    bool whiteCastleK = true;
    bool whiteCastleQ = true;
    bool blackCastleK = true;
    bool blackCastleQ = true;

    int enPassantRow = -1;
    int enPassantCol = -1;

    // --- FAZ 4a: SAH KARESI ARTIMLI TAKIP ---
    // Onceki surumde sah karesi her ihtiyac duyuldugunda 64 kare taranarak
    // bulunuyordu. getLegalMoves bunu HER sozde-hamle icin yapiyordu:
    // dugum basina ~35 hamle x 64 kare = 2.240 gereksiz okuma.
    int whiteKingRow = 7, whiteKingCol = 4;
    int blackKingRow = 0, blackKingCol = 4;

    std::vector<MoveRecord> history;

    void undoMove();
    void initializeBoard();
    void printBoard();
    bool isWhite(int x, int y);
    int getPiece(int row, int col);

    void generateHash();

    // --- FAZ 0: TEST ALTYAPISI ---
    bool setFen(const std::string& fen);   // basarisizsa false doner ve tahtayi bozmaz
    std::string getFen();
    unsigned long long debugRecomputePieceHash();  // artimli hash dogrulamasi icin

    bool isSquareAttacked(int row, int col, int attackerColor);
    bool isKingAttacked(int color);          // FAZ 4a
    void refreshKingSquares();               // FAZ 4a (setFen / initializeBoard sonrasi)
    bool debugKingSquaresValid();            // FAZ 4a (perftverify icin)
    void makeMove(Move move);

    // --- FAZ 1: BERABERLIK KURALLARI ---
    int  repetitionCount();          // mevcut pozisyon kac kez tekrarlandi (kendisi dahil)
    bool isInsufficientMaterial();   // K-K, K+A-K, K+F-K, ayni renk K+F-K+F
    bool isDraw();
};