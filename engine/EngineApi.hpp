#pragma once
#include "Board.hpp"
#include "MoveGen.hpp"
#include "AI.hpp"
#include <string>
#include <vector>
#include <functional>

// ============================================================
//  FAZ 5b: KOPRU CEPHESI
// ============================================================
// Bu sinif, motorun disariya bakan tek yuzu. React Native koprusu
// (ve ileride baska her sey) SADECE buraya baglanacak.
//
// Neden gerekli:
//   1) Kopruden gecen her sey basit tipte olmali. Move struct'ini
//      JavaScript'e gecirmek eziyettir; "e2e4" gecirmek bedavadir.
//      Ceviriyi tek yerde yapiyoruz.
//   2) UCI metin protokolu bir ARAYUZ degil, bir PROTOKOL. Mobil
//      uygulamada metin ayristirmak sacma olur.
//   3) Motorun ic yapisi degistiginde (Move'un boyutu, TT duzeni...)
//      kopru kodu etkilenmez. Sinir burasi.
//
// UCI katmani (main.cpp) bu sinifi kullanmaz; ikisi kardestir.
// Boylece motoru hem satranc arayuzleriyle test edebiliyor hem de
// mobil uygulamaya gomebiliyoruz.
class EngineApi {
public:
    EngineApi();

    // ---------------- OYUN KURULUMU ----------------
    // fen bos birakilirsa baslangic pozisyonu kullanilir.
    bool newGame(const std::string& fen = "");

    // ---------------- DURUM SORGULARI ----------------
    std::string getFen();
    std::string sideToMove();                  // "w" veya "b"
    bool inCheck();

    // Su an oynanabilecek tum hamleler, UCI formatinda ("e2e4", "e7e8q").
    std::vector<std::string> legalMoves();

    // "ongoing" | "checkmate" | "stalemate" |
    // "draw-fifty" | "draw-repetition" | "draw-material"
    // checkmate durumunda kaybeden taraf sideToMove()'dur.
    std::string gameStatus();

    // Oynanan hamleler, SAN formatinda ("e4", "Nf3", "O-O", "Qxd5+").
    std::vector<std::string> moveHistorySan();

    // ---------------- HAMLE ----------------
    bool makeMove(const std::string& uci);     // legal degilse false, tahta degismez
    bool undo();                               // geri alinacak hamle yoksa false

    // Bir hamlenin SAN karsiligi (hamle OYNANMADAN once sorulur).
    std::string sanFor(const std::string& uci);

    // ---------------- ARAMA ----------------
    // Bloke eder. Cagiran taraf bunu arka plan is parcaciginda cagirmali.
    std::string bestMove(int timeMs, int maxDepth = 64);

    void stop();                               // baska bir is parcacigindan cagrilabilir
    int  lastScore() const { return ai.lastScore; }
    int  lastDepth() const { return ai.lastDepth; }
    long long lastNodes() const { return ai.nodes; }
    int  lastSkillLoss() const { return ai.lastSkillLoss; }   // seviye yuzunden feda edilen cp

    // ---------------- AYARLAR ----------------
    void setSkillLevel(int level);             // 0 (en zayif) - 20 (tam guc)
    int  getSkillLevel() const;
    void setHashSizeMB(int mb);
    void setUseBook(bool on);
    bool loadBookFromFile(const std::string& path);
    bool loadBookFromMemory(const unsigned char* bytes, size_t size);

    // Arama sirasindaki "info depth ..." satirlari buraya akar.
    void setInfoCallback(std::function<void(const std::string&)> cb);

private:
    ChessBoard board;
    MoveGenerator moveGen;
    AI ai;

    std::vector<Move> playedMoves;                 // SAN gecmisi icin
    std::vector<unsigned long long> gameHistory;   // tekrar tespiti icin
    std::string startFen;

    bool findLegal(const std::string& uci, Move& out);
};
