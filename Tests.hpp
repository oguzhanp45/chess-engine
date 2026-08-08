#pragma once
#include "Board.hpp"
#include "MoveGen.hpp"
#include "AI.hpp"
#include <string>

// ============================================================
//  FAZ 0 - TEST ALTYAPISI
//  Amac: motoru degistirmeden ONCE dogrulugunu olcebilmek.
//  Buradaki hicbir fonksiyon motorun oyun mantigina karismaz.
// ============================================================
namespace Tests {

    extern const char* START_FEN;

    // Yaprak dugum sayimi. bulk=true ise son seviyede hamle
    // listesinin boyutu dogrudan sayilir (yaklasik 5x daha hizli).
    unsigned long long perft(ChessBoard& board, MoveGenerator& mg, int depth, bool bulk = true);

    // Her kok hamle icin ayri sayim -> hatanin hangi hamlede oldugunu bulmak icin.
    void perftDivide(ChessBoard& board, MoveGenerator& mg, int depth);

    // makeMove/undoMove butunluk testi:
    //   - undoMove sonrasi FEN birebir ayni mi?
    //   - artimli pieceHash tahtayla tutarli mi?
    // Hata bulursa false doner ve konumu ekrana basar.
    bool perftVerify(ChessBoard& board, MoveGenerator& mg, int depth);

    // Standart perft pozisyonlariyla PASS/FAIL raporu.
    void runPerftSuite(ChessBoard& board, MoveGenerator& mg, int maxDepth);

    // FEN'i dikey aynala + renkleri degistir (rok, sira ve en passant dahil).
    std::string mirrorFen(const std::string& fen);

    // eval(p) == -eval(aynala(p)) olmali. Degilse degerlendirme renk-asimetriktir.
    void runMirrorTest(ChessBoard& board, AI& ai);

    // Sabit derinlikte, kitapsiz, tekrarlanabilir dugum sayimi.
    void runBench(ChessBoard& board, AI& ai, int depth);

    // --- FAZ 1 KABUL TESTLERI ---
    // Bilinen mat pozisyonlari: dogru hamle secilyor mu, mat mesafesi dogru mu?
    void runMateTest(ChessBoard& board, AI& ai);
    // Pat, yetersiz materyal, 50 hamle ve uc tekrar kurallari.
    void runDrawTest(ChessBoard& board, MoveGenerator& mg, AI& ai);

    // --- FAZ 2 KABUL TESTI ---
    // Polyglot spesifikasyonundaki 9 referans anahtar. Artimli zobristKey
    // bunlarla birebir tutmali (en passant ve rok dahil).
    void runHashTest(ChessBoard& board, MoveGenerator& mg);

    // --- FAZ 5b KABUL TESTI ---
    // SAN uretimi: belirsizlik giderme, rok, terfi, en passant, sah/mat.
    void runSanTest(ChessBoard& board, MoveGenerator& mg);

    // EngineApi cephesini uctan uca dener (kopru bunu kullanacak).
    void runApiTest();

    // Seviye sistemi: dusuk seviyeler gercekten daha zayif mi oynuyor?
    void runLevelTest();
}