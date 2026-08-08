#include "Tests.hpp"
#include "Polyglot.hpp"
#include "EngineApi.hpp"
#include <iostream>
#include <sstream>
#include <vector>
#include <chrono>
#include <cctype>
#include <iomanip>

// main.cpp icindeki cevirici (FAZ 5'te ayri bir Notation.hpp'ye tasinacak)
#include "Notation.hpp"

namespace Tests {

    const char* START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    // ---------------- PERFT ----------------

    unsigned long long perft(ChessBoard& board, MoveGenerator& mg, int depth, bool bulk) {
        if (depth <= 0) return 1ULL;

        std::vector<Move> moves = mg.getLegalMoves(board);
        if (bulk && depth == 1) return (unsigned long long)moves.size();

        unsigned long long total = 0;
        for (size_t i = 0; i < moves.size(); i++) {
            board.makeMove(moves[i]);
            total += perft(board, mg, depth - 1, bulk);
            board.undoMove();
        }
        return total;
    }

    void perftDivide(ChessBoard& board, MoveGenerator& mg, int depth) {
        if (depth <= 0) { std::cout << "Nodes searched: 1" << std::endl; return; }

        std::vector<Move> moves = mg.getLegalMoves(board);
        unsigned long long total = 0;

        for (size_t i = 0; i < moves.size(); i++) {
            board.makeMove(moves[i]);
            unsigned long long n = perft(board, mg, depth - 1, true);
            board.undoMove();
            total += n;
            std::cout << Notation::toUci(moves[i]) << ": " << n << std::endl;
        }
        std::cout << "\nNodes searched: " << total << std::endl;
    }

    bool perftVerify(ChessBoard& board, MoveGenerator& mg, int depth) {
        if (depth <= 0) return true;

        std::vector<Move> moves = mg.getLegalMoves(board);

        for (size_t i = 0; i < moves.size(); i++) {
            std::string fenBefore = board.getFen();
            unsigned long long hashBefore = board.pieceHash;

            board.makeMove(moves[i]);

            // FAZ 4a: takip edilen sah kareleri tahtayla tutarli mi?
            if (!board.debugKingSquaresValid()) {
                std::cout << "HATA [sah karesi]: " << Notation::toUci(moves[i])
                    << " sonrasi takip edilen sah karesi yanlis.\n"
                    << "  Pozisyon (hamle oncesi): " << fenBefore << std::endl;
                board.undoMove();
                return false;
            }

            // FAZ 2: artimli TAM anahtar, sifirdan hesaplanan Polyglot
            // anahtariyla ayni mi? (Rok, en passant ve sira dahil.)
            unsigned long long refKey = PolyglotBook::computeHash(board);
            if (refKey != board.zobristKey) {
                std::cout << "HATA [zobristKey]: " << Notation::toUci(moves[i])
                    << " sonrasi artimli anahtar referanstan farkli.\n"
                    << "  Pozisyon (hamle oncesi): " << fenBefore << "\n"
                    << "  artimli = " << std::hex << board.zobristKey
                    << ", referans = " << refKey << std::dec << std::endl;
                board.undoMove();
                return false;
            }

            // Artimli tas hash'i tahtayla tutarli mi?
            unsigned long long recomputed = board.debugRecomputePieceHash();
            if (recomputed != board.pieceHash) {
                std::cout << "HATA [artimli hash]: " << Notation::toUci(moves[i])
                    << " sonrasi pieceHash tutmuyor.\n"
                    << "  Pozisyon (hamle oncesi): " << fenBefore << "\n"
                    << "  pieceHash = " << std::hex << board.pieceHash
                    << ", beklenen = " << recomputed << std::dec << std::endl;
                board.undoMove();
                return false;
            }

            if (!perftVerify(board, mg, depth - 1)) { board.undoMove(); return false; }

            board.undoMove();

            std::string fenAfter = board.getFen();
            if (fenAfter != fenBefore) {
                std::cout << "HATA [undoMove]: " << Notation::toUci(moves[i])
                    << " geri alindiginda pozisyon eski haline donmedi.\n"
                    << "  Once : " << fenBefore << "\n"
                    << "  Sonra: " << fenAfter << std::endl;
                return false;
            }
            if (board.pieceHash != hashBefore) {
                std::cout << "HATA [undoMove hash]: " << Notation::toUci(moves[i])
                    << " sonrasi pieceHash geri gelmedi. Pozisyon: " << fenBefore << std::endl;
                return false;
            }
        }
        return true;
    }

    struct PerftCase {
        const char* name;
        const char* fen;
        unsigned long long expected[7];   // index = derinlik, 0 kullanilmaz
        int maxKnown;
    };

    static const PerftCase PERFT_CASES[] = {
        { "1  Baslangic", START_FEN,
          { 0, 20, 400, 8902, 197281, 4865609, 119060324 }, 6 },
        { "2  Kiwipete",  "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
          { 0, 48, 2039, 97862, 4085603, 193690690, 0 }, 5 },
        { "3  Sonoyun",   "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
          { 0, 14, 191, 2812, 43238, 674624, 11030083 }, 6 },
        { "4  Terfi",     "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
          { 0, 6, 264, 9467, 422333, 15833292, 0 }, 5 },
        { "5  Karisik",   "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
          { 0, 44, 1486, 62379, 2103487, 89941194, 0 }, 5 },
        { "6  Orta oyun", "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
          { 0, 46, 2079, 89890, 3894594, 164075551, 0 }, 5 }
    };

    void runPerftSuite(ChessBoard& board, MoveGenerator& mg, int maxDepth) {
        int caseCount = (int)(sizeof(PERFT_CASES) / sizeof(PERFT_CASES[0]));
        int pass = 0, fail = 0;
        auto t0 = std::chrono::steady_clock::now();
        unsigned long long grandTotal = 0;

        std::cout << "\n=== PERFT SUITE (maks derinlik " << maxDepth << ") ===\n" << std::endl;

        for (int i = 0; i < caseCount; i++) {
            const PerftCase& pc = PERFT_CASES[i];
            std::cout << "--- " << pc.name << std::endl;
            std::cout << "    " << pc.fen << std::endl;

            if (!board.setFen(pc.fen)) {
                std::cout << "    FEN OKUNAMADI!\n" << std::endl;
                fail++;
                continue;
            }

            int limit = (maxDepth < pc.maxKnown) ? maxDepth : pc.maxKnown;
            for (int d = 1; d <= limit; d++) {
                if (pc.expected[d] == 0) break;

                auto s = std::chrono::steady_clock::now();
                unsigned long long got = perft(board, mg, d, true);
                auto e = std::chrono::steady_clock::now();
                long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(e - s).count();
                grandTotal += got;

                bool ok = (got == pc.expected[d]);
                if (ok) pass++; else fail++;

                std::cout << "    derinlik " << d
                    << "  bulunan " << std::setw(12) << got
                    << "  beklenen " << std::setw(12) << pc.expected[d]
                    << "  " << (ok ? "OK" : "HATA")
                    << "  (" << ms << " ms)";
                if (!ok) {
                    long long diff = (long long)got - (long long)pc.expected[d];
                    std::cout << "  fark " << (diff > 0 ? "+" : "") << diff;
                }
                std::cout << std::endl;

                if (!ok) break;   // ilk hatadan sonra derinlesmenin anlami yok
            }
            std::cout << std::endl;
        }

        auto t1 = std::chrono::steady_clock::now();
        long long totalMs = std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
        long long nps = (totalMs > 0) ? (long long)(grandTotal * 1000 / totalMs) : 0;

        std::cout << "=== SONUC: " << pass << " gecti, " << fail << " kaldi"
            << "  |  toplam " << grandTotal << " dugum, "
            << totalMs << " ms, " << nps << " dugum/sn ===\n" << std::endl;
    }

    // ---------------- MIRROR (AYNA) TESTI ----------------

    std::string mirrorFen(const std::string& fen) {
        std::istringstream ss(fen);
        std::string boardPart, side, castle, ep, half = "0", full = "1", tmp;

        if (!(ss >> boardPart)) return fen;
        if (!(ss >> side))   side = "w";
        if (!(ss >> castle)) castle = "-";
        if (!(ss >> ep))     ep = "-";
        if (ss >> tmp) half = tmp;
        if (ss >> tmp) full = tmp;

        // Satirlari ters cevir ve buyuk/kucuk harfleri degistir
        std::vector<std::string> ranks;
        std::string cur;
        for (size_t i = 0; i < boardPart.size(); i++) {
            if (boardPart[i] == '/') { ranks.push_back(cur); cur.clear(); }
            else cur += boardPart[i];
        }
        ranks.push_back(cur);

        std::string newBoard;
        for (int i = (int)ranks.size() - 1; i >= 0; i--) {
            std::string r = ranks[i];
            for (size_t j = 0; j < r.size(); j++) {
                if (std::isalpha((unsigned char)r[j])) {
                    r[j] = std::islower((unsigned char)r[j])
                        ? (char)std::toupper((unsigned char)r[j])
                        : (char)std::tolower((unsigned char)r[j]);
                }
            }
            newBoard += r;
            if (i > 0) newBoard += '/';
        }

        std::string newSide = (side == "w") ? "b" : "w";

        std::string newCastle;
        if (castle == "-") newCastle = "-";
        else {
            std::string sw;
            for (size_t i = 0; i < castle.size(); i++) {
                sw += std::islower((unsigned char)castle[i])
                    ? (char)std::toupper((unsigned char)castle[i])
                    : (char)std::tolower((unsigned char)castle[i]);
            }
            // KQkq sirasina getir
            for (size_t i = 0; i < sw.size(); i++) if (sw[i] == 'K') newCastle += 'K';
            for (size_t i = 0; i < sw.size(); i++) if (sw[i] == 'Q') newCastle += 'Q';
            for (size_t i = 0; i < sw.size(); i++) if (sw[i] == 'k') newCastle += 'k';
            for (size_t i = 0; i < sw.size(); i++) if (sw[i] == 'q') newCastle += 'q';
            if (newCastle.empty()) newCastle = "-";
        }

        std::string newEp = "-";
        if (ep != "-" && ep.size() >= 2) {
            int rank = ep[1] - '0';
            newEp = std::string(1, ep[0]) + (char)('0' + (9 - rank));
        }

        return newBoard + " " + newSide + " " + newCastle + " " + newEp + " " + half + " " + full;
    }

    static const char* MIRROR_CASES[] = {
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
        "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
        "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
        "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
        "4rrk1/pp1n1ppp/2p1bn2/q3p3/2P1P3/1PN1BN1P/P2QBPP1/3R1RK1 w - - 0 16",
        "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1",
        "2r3k1/pp2bppp/2n1pn2/q7/3P4/2N1PN2/PP2BPPP/R2Q1RK1 b - - 0 14"
    };

    void runMirrorTest(ChessBoard& board, AI& ai) {
        int n = (int)(sizeof(MIRROR_CASES) / sizeof(MIRROR_CASES[0]));
        int pass = 0, fail = 0;
        int worst = 0;

        std::cout << "\n=== AYNA (MIRROR) DEGERLENDIRME TESTI ===" << std::endl;
        std::cout << "Beklenen: eval(pozisyon) == -eval(aynalanmis pozisyon)\n" << std::endl;

        for (int i = 0; i < n; i++) {
            std::string a = MIRROR_CASES[i];
            std::string b = mirrorFen(a);

            if (!board.setFen(a)) { std::cout << "FEN okunamadi: " << a << std::endl; fail++; continue; }
            int ea = ai.evaluateBoard(board);

            if (!board.setFen(b)) { std::cout << "Aynalanmis FEN okunamadi: " << b << std::endl; fail++; continue; }
            int eb = ai.evaluateBoard(board);

            int diff = ea + eb;              // 0 olmali
            if (diff < 0) diff = -diff;
            if (diff > worst) worst = diff;

            bool ok = (diff == 0);
            if (ok) pass++; else fail++;

            std::cout << (ok ? "  OK   " : "  HATA ")
                << "eval = " << std::setw(6) << ea
                << " | ayna = " << std::setw(6) << eb
                << " | fark = " << std::setw(5) << (ea + eb) << std::endl;
            if (!ok) {
                std::cout << "         " << a << std::endl;
                std::cout << "         " << b << std::endl;
            }
        }

        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi"
            << "  |  en buyuk asimetri: " << worst << " santipiyon ===\n" << std::endl;
    }

    // ---------------- FAZ 2: POLYGLOT HASH TESTI ----------------

    struct HashCase { const char* moves; unsigned long long key; const char* note; };

    static const HashCase HASH_CASES[] = {
        { "",                                          0x463b96181691fc9cULL, "baslangic pozisyonu" },
        { "e2e4",                                      0x823c9b50fd114196ULL, "e4" },
        { "e2e4 d7d5",                                 0x0756b94461c50fb0ULL, "e4 d5 (ep alinamaz)" },
        { "e2e4 d7d5 e4e5",                            0x662fafb965db29d4ULL, "e4 d5 e5" },
        { "e2e4 d7d5 e4e5 f7f5",                       0x22a48b5a8e47ff78ULL, "EN PASSANT alinabilir" },
        { "e2e4 d7d5 e4e5 f7f5 e1e2",                  0x652a607ca3f242c1ULL, "rok haklari kayboldu" },
        { "e2e4 d7d5 e4e5 f7f5 e1e2 e8f7",             0x00fdd303c946bdd9ULL, "iki taraf da rok hakkini yitirdi" },
        { "a2a4 b7b5 h2h4 b5b4 c2c4",                  0x3c8123ea7b067637ULL, "EN PASSANT alinabilir (2)" },
        { "a2a4 b7b5 h2h4 b5b4 c2c4 b4c3 a1a3",        0x5c3f9b829b279560ULL, "ep ile alim + kale oynadi" }
    };

    void runHashTest(ChessBoard& board, MoveGenerator& mg) {
        int n = (int)(sizeof(HASH_CASES) / sizeof(HASH_CASES[0]));
        int pass = 0, fail = 0;

        std::cout << "\n=== POLYGLOT HASH TESTI ===" << std::endl;
        std::cout << "Referans: Polyglot kitap formati spesifikasyonu\n" << std::endl;

        for (int i = 0; i < n; i++) {
            const HashCase& hc = HASH_CASES[i];
            board.setFen(START_FEN);

            bool seqOk = true;
            std::istringstream ms(hc.moves);
            std::string tok;
            while (ms >> tok) {
                std::vector<Move> legals = mg.getLegalMoves(board);
                bool found = false;
                for (size_t k = 0; k < legals.size(); k++) {
                    if (Notation::toUci(legals[k]) == tok) { board.makeMove(legals[k]); found = true; break; }
                }
                if (!found) { seqOk = false; break; }
            }

            bool ok = seqOk && (board.zobristKey == hc.key);
            if (ok) pass++; else fail++;

            std::cout << (ok ? "  OK   " : "  HATA ")
                << std::hex << std::setw(16) << std::setfill('0') << board.zobristKey
                << std::setfill(' ') << std::dec
                << "  (beklenen " << std::hex << std::setw(16) << std::setfill('0') << hc.key
                << std::setfill(' ') << std::dec << ")   " << hc.note << std::endl;
        }

        board.setFen(START_FEN);
        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi ===\n" << std::endl;
    }

    // ---------------- FAZ 5b: SAN TESTI ----------------

    struct SanCase {
        const char* fen;
        const char* uci;
        const char* san;
        const char* note;
    };

    static const SanCase SAN_CASES[] = {
        { START_FEN, "e2e4", "e4", "basit piyon hamlesi" },
        { START_FEN, "g1f3", "Nf3", "at hamlesi" },
        { "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
          "e4d5", "exd5", "piyon alimi (kalkis dosyasi ile)" },
        { "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
          "e1g1", "O-O", "kisa rok" },
        { "r3kbnr/pppqpppp/2n5/3p1b2/3P1B2/2N5/PPPQPPPP/R3KBNR w KQkq - 6 5",
          "e1c1", "O-O-O", "uzun rok" },
        { "7k/3P4/8/8/8/8/8/K7 w - - 0 1",
          "d7d8q", "d8=Q+", "terfi + sah" },
        { "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
          "b5c6", "Bxc6", "fil alimi" },
          // Belirsizlik: iki at da d2'ye gidebiliyor, dosyalar farkli -> dosya harfi
          { "4k3/8/8/8/8/8/8/1N1K1N2 w - - 0 1",
            "b1d2", "Nbd2", "belirsizlik: dosya ile ayirt" },
            // Belirsizlik: iki kale de e-dosyasinda, satirlar farkli -> satir rakami
            { "4k3/8/8/8/R7/8/8/R3K3 w Q - 0 1",
              "a1a3", "R1a3", "belirsizlik: satir ile ayirt" },
              // Belirsizlik: uc vezir ayni kareye gidebiliyor -> tam kare
              { "4k3/Q7/8/8/8/8/8/Q3K1Q1 w - - 0 1",
                "a1d4", "Qa1d4", "belirsizlik: tam kare gerekli" },
                // En passant
                { "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3",
                  "e5f6", "exf6", "en passant alimi" },
                  // Mat
                  { "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",
                    "a1a8", "Ra8#", "mat isareti" }
    };

    void runSanTest(ChessBoard& board, MoveGenerator& mg) {
        int n = (int)(sizeof(SAN_CASES) / sizeof(SAN_CASES[0]));
        int pass = 0, fail = 0;

        std::cout << "\n=== SAN (STANDART GOSTERIM) TESTI ===\n" << std::endl;

        for (int i = 0; i < n; i++) {
            const SanCase& sc = SAN_CASES[i];
            if (!board.setFen(sc.fen)) {
                std::cout << "  HATA FEN okunamadi: " << sc.fen << std::endl; fail++; continue;
            }

            Move m;
            if (!Notation::fromUci(sc.uci, board, mg, m)) {
                std::cout << "  HATA hamle legal degil: " << sc.uci << "   " << sc.note << std::endl;
                std::cout << "        " << sc.fen << std::endl;
                fail++; continue;
            }

            std::string got = Notation::toSan(m, board, mg);
            bool ok = (got == sc.san);
            if (ok) pass++; else fail++;

            std::cout << (ok ? "  OK   " : "  HATA ")
                << std::setw(8) << sc.uci << "  ->  " << std::setw(8) << got
                << "  (beklenen " << sc.san << ")   " << sc.note << std::endl;
            if (!ok) std::cout << "        " << sc.fen << std::endl;
        }

        board.setFen(START_FEN);
        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi ===\n" << std::endl;
    }

    // ---------------- FAZ 5b: ENGINE API TESTI ----------------
    void runApiTest() {
        int pass = 0, fail = 0;
        auto check = [&](bool ok, const std::string& what, const std::string& got) {
            if (ok) pass++; else fail++;
            std::cout << (ok ? "  OK   " : "  HATA ") << what;
            if (!got.empty()) std::cout << "  ->  " << got;
            std::cout << std::endl;
            };

        std::cout << "\n=== ENGINE API TESTI (kopru cephesi) ===\n" << std::endl;

        EngineApi api;
        api.setUseBook(false);

        check(api.sideToMove() == "w", "yeni oyun: sira beyazda", api.sideToMove());
        check(api.legalMoves().size() == 20, "baslangicta 20 legal hamle",
            std::to_string(api.legalMoves().size()));
        check(api.gameStatus() == "ongoing", "durum: ongoing", api.gameStatus());
        check(api.sanFor("g1f3") == "Nf3", "sanFor(g1f3)", api.sanFor("g1f3"));

        check(api.makeMove("e2e4"), "makeMove(e2e4) kabul", "");
        check(!api.makeMove("e2e4"), "makeMove(e2e4) ikinci kez reddedilmeli", "");
        check(!api.makeMove("zzzz"), "makeMove(zzzz) reddedilmeli", "");
        check(api.sideToMove() == "b", "sira siyaha gecti", api.sideToMove());

        api.makeMove("e7e5");
        api.makeMove("g1f3");
        std::vector<std::string> hist = api.moveHistorySan();
        bool histOk = (hist.size() == 3 && hist[0] == "e4" && hist[1] == "e5" && hist[2] == "Nf3");
        check(histOk, "SAN gecmisi: e4 e5 Nf3",
            histOk ? "" : (hist.size() > 2 ? hist[0] + " " + hist[1] + " " + hist[2] : "eksik"));

        check(api.undo(), "undo calisiyor", "");
        check(api.moveHistorySan().size() == 2, "gecmis 2'ye dustu",
            std::to_string(api.moveHistorySan().size()));

        // Mat pozisyonu
        api.newGame("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1");
        std::string mv = api.bestMove(1000, 4);
        check(mv == "a1a8", "mat pozisyonunda dogru hamle", mv);
        api.makeMove("a1a8");
        check(api.gameStatus() == "checkmate", "durum: checkmate", api.gameStatus());

        // Pat pozisyonu
        api.newGame("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
        check(api.gameStatus() == "stalemate", "durum: stalemate", api.gameStatus());

        // Yetersiz materyal
        api.newGame("8/8/8/4k3/8/8/4KB2/8 w - - 0 1");
        check(api.gameStatus() == "draw-material", "durum: draw-material", api.gameStatus());

        // Gecersiz FEN reddedilmeli
        check(!api.newGame("8/8/8/4k3/8/8/8/8 w - - 0 1"), "sahsiz FEN reddedilmeli", "");

        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi ===\n" << std::endl;
    }

    // ---------------- FAZ 5b: SEVIYE TESTI ----------------
    void runLevelTest() {
        std::cout << "\n=== SEVIYE TESTI ===" << std::endl;
        std::cout << "Olcut: secilen hamle EN IYI hamleden kac santipiyon kotu?" << std::endl;
        std::cout << "(Sakin bir pozisyonda farkli hamle oynamak zayiflik degildir;" << std::endl;
        std::cout << " asil onemli olan ne kadar kaybettigidir.)\n" << std::endl;

        // Taktik firsat iceren bir pozisyon: en iyi hamle belirgin sekilde daha iyi
        const char* fens[] = {
            "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
            "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
            "rnbqkb1r/pp2pppp/3p1n2/2pP4/8/2N5/PPP1PPPP/R1BQKBNR w KQkq - 0 4"
        };

        std::cout << "  seviye | derinlik | ort. kayip (cp) | en kotu kayip" << std::endl;
        std::cout << "  -------+----------+-----------------+--------------" << std::endl;

        int levels[] = { 0, 5, 10, 15, 18, 20 };
        for (int k = 0; k < 6; k++) {
            EngineApi api;
            api.setUseBook(false);
            api.setSkillLevel(levels[k]);

            long long totalLoss = 0; int worst = 0; int depth = 0; int trials = 0;

            for (int f = 0; f < 3; f++) {
                for (int t = 0; t < 6; t++) {
                    api.newGame(fens[f]);
                    api.bestMove(600, 64);
                    int loss = api.lastSkillLoss();
                    totalLoss += loss;
                    if (loss > worst) worst = loss;
                    depth = api.lastDepth();
                    trials++;
                }
            }

            std::cout << "  " << std::setw(6) << levels[k]
                << " | " << std::setw(8) << depth
                << " | " << std::setw(15) << (totalLoss / (trials ? trials : 1))
                << " | " << std::setw(12) << worst << std::endl;
        }
        std::cout << "\nBeklenen: seviye yukseldikce hem derinlik artar hem kayip duser." << std::endl;
        std::cout << "Seviye 20'de kayip SIFIR olmalidir (tam guc).\n" << std::endl;
    }

    // ---------------- BENCH ----------------

    static const char* BENCH_CASES[] = {
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
        "4rrk1/pp1n3p/3q2pQ/2p1pb2/2PP4/2P3N1/P2B2PP/4RRK1 b - - 7 19",
        "rq3rk1/ppp2ppp/1bnpb3/3N2B1/3NP3/7P/PPPQ1PP1/2KR3R w - - 7 14",
        "r1bq1r1k/1pp1n1pp/1p1p4/4p2Q/4Pp2/1BNP4/PPP2PPP/3R1RK1 w - - 2 14",
        "r3r1k1/2p2ppp/p1p1bn2/8/1q2P3/2NPQN2/PPP3PP/R4RK1 b - - 2 15",
        "r1bq1rk1/ppp1nppp/4n3/3p3Q/3P4/1BP1B3/PP1N2PP/R4RK1 w - - 1 16",
        "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"
    };

    // ---------------- FAZ 1: MAT TESTI ----------------

    struct MateCase {
        const char* fen;
        const char* bestMove;   // beklenen hamle (UCI)
        int mateIn;             // beklenen mat mesafesi (hamle cinsinden)
        int depth;
        const char* note;
    };

    static const MateCase MATE_CASES[] = {
        { "7k/8/6K1/8/8/8/8/5Q2 w - - 0 1",                              "f1f8", 1, 4,
          "PAT TUZAGI: Vf7 pattir, Vf8 mattir" },
        { "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1",                           "a1a8", 1, 4,
          "son yatay mati" },
        { "6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1",                       "c1c8", 1, 4,
          "son yatay mati (2)" },
        { "2rr3k/pp3pp1/1nnqbN1p/3pN3/2pP4/2P3Q1/PPB4P/R4RK1 w - - 0 1", "g3g6", 2, 8,
          "vezir fedasi, mat 2" },
        { "r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1",                       "f6a6", 3, 9,
          "kale manevrasi, mat 3" }
    };

    void runMateTest(ChessBoard& board, AI& ai) {
        int n = (int)(sizeof(MATE_CASES) / sizeof(MATE_CASES[0]));
        int pass = 0, fail = 0;
        const long long HUGE_MS = 1000LL * 60 * 60;
        bool bookBackup = ai.useBook;
        ai.useBook = false;

        std::cout << "\n=== MAT TESTI ===" << std::endl;
        std::cout << "Beklenen: dogru hamle + dogru mat mesafesi\n" << std::endl;

        for (int i = 0; i < n; i++) {
            const MateCase& mc = MATE_CASES[i];
            if (!board.setFen(mc.fen)) { std::cout << "  FEN okunamadi" << std::endl; fail++; continue; }
            ai.clearTT();

            Move best = ai.getBestMoveTimed(board, mc.depth, HUGE_MS, HUGE_MS, {});
            std::string got = Notation::toUci(best);

            int gotMate = 0;
            if (ai.lastScore > MATE_THRESHOLD)  gotMate = (MATE_VALUE - ai.lastScore + 1) / 2;
            if (ai.lastScore < -MATE_THRESHOLD) gotMate = -(MATE_VALUE + ai.lastScore + 1) / 2;

            bool moveOk = (got == mc.bestMove);
            bool mateOk = (gotMate == mc.mateIn);
            if (moveOk && mateOk) pass++; else fail++;

            std::cout << (moveOk && mateOk ? "  OK   " : "  HATA ")
                << "hamle " << std::setw(6) << got << " (beklenen " << mc.bestMove << ")"
                << "  mat " << std::setw(3) << gotMate << " (beklenen " << mc.mateIn << ")"
                << "   " << mc.note << std::endl;
            if (!(moveOk && mateOk)) std::cout << "         " << mc.fen << std::endl;
        }

        ai.useBook = bookBackup;
        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi ===\n" << std::endl;
    }

    // ---------------- FAZ 1: BERABERLIK TESTI ----------------

    struct DrawCase { const char* fen; bool expectDraw; const char* note; };

    static const DrawCase DRAW_CASES[] = {
        { "8/8/8/4k3/8/8/4K3/8 w - - 0 1",        true,  "K - K" },
        { "8/8/8/4k3/8/8/4KB2/8 w - - 0 1",       true,  "K+F - K" },
        { "8/8/8/4k3/8/8/4KN2/8 w - - 0 1",       true,  "K+A - K" },
        { "8/8/3b4/4k3/8/8/4KB2/8 w - - 0 1",     true,  "K+F - K+F (ayni renk kare)" },
        { "8/8/4b3/4k3/8/8/4KB2/8 w - - 0 1",     false, "K+F - K+F (farkli renk kare) -> beraberlik DEGIL" },
        { "8/8/8/4k3/8/8/4KR2/8 w - - 0 1",       false, "K+K - K -> beraberlik DEGIL" },
        { "8/8/8/4k3/8/8/4KR2/8 w - - 100 100",   true,  "50 hamle kurali" },
        { "8/8/8/4k3/8/8/4KR2/8 w - - 99 100",    false, "99 yarim hamle -> henuz degil" }
    };

    void runDrawTest(ChessBoard& board, MoveGenerator& mg, AI& ai) {
        (void)ai;
        int pass = 0, fail = 0;
        std::cout << "\n=== BERABERLIK TESTI ===\n" << std::endl;

        int n = (int)(sizeof(DRAW_CASES) / sizeof(DRAW_CASES[0]));
        for (int i = 0; i < n; i++) {
            const DrawCase& dc = DRAW_CASES[i];
            if (!board.setFen(dc.fen)) { std::cout << "  FEN okunamadi: " << dc.fen << std::endl; fail++; continue; }
            bool got = board.isDraw();
            bool ok = (got == dc.expectDraw);
            if (ok) pass++; else fail++;
            std::cout << (ok ? "  OK   " : "  HATA ")
                << "isDraw = " << (got ? "evet" : "hayir")
                << " (beklenen " << (dc.expectDraw ? "evet" : "hayir") << ")   "
                << dc.note << std::endl;
        }

        // --- FAZ 5a: GECERSIZ FEN REDDEDILMELI ---
        {
            struct BadFen { const char* fen; const char* note; };
            static const BadFen BAD[] = {
                { "8/8/8/4k3/8/8/8/8 w - - 0 1",                 "beyaz sah yok" },
                { "8/8/8/8/8/8/8/4K3 w - - 0 1",                 "siyah sah yok" },
                { "4k3/8/8/8/8/8/8/4R1K1 w - - 0 1",             "sira beyazda ama siyah sah tehdit altinda" },
                { "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "GECERLI (kabul edilmeli)" }
            };
            for (int k = 0; k < 4; k++) {
                bool ok = board.setFen(BAD[k].fen);
                bool expected = (k == 3);
                bool good = (ok == expected);
                if (good) pass++; else fail++;
                std::cout << (good ? "  OK   " : "  HATA ")
                    << "setFen = " << (ok ? "kabul" : "red")
                    << " (beklenen " << (expected ? "kabul" : "red") << ")   "
                    << BAD[k].note << std::endl;
            }
        }

        // --- PAT: hamle yok ama sah da yok ---
        {
            board.setFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
            std::vector<Move> moves = mg.getLegalMoves(board);
            bool inCheck = ai.isInCheck(board);
            bool ok = (moves.empty() && !inCheck);
            if (ok) pass++; else fail++;
            std::cout << (ok ? "  OK   " : "  HATA ")
                << "pat pozisyonu: legal hamle " << moves.size()
                << ", sah " << (inCheck ? "var" : "yok")
                << " (beklenen 0 / yok)" << std::endl;
        }

        // --- UC TEKRAR: at hamleleriyle ayni pozisyona iki kez donuluyor ---
        {
            board.setFen(START_FEN);
            const char* seq[] = { "g1f3","g8f6","f3g1","f6g8", "g1f3","g8f6","f3g1","f6g8" };
            bool seqOk = true;
            for (int i = 0; i < 8 && seqOk; i++) {
                std::vector<Move> legals = mg.getLegalMoves(board);
                bool found = false;
                for (size_t k = 0; k < legals.size(); k++) {
                    if (Notation::toUci(legals[k]) == seq[i]) { board.makeMove(legals[k]); found = true; break; }
                }
                if (!found) seqOk = false;
            }
            int rc = board.repetitionCount();
            bool ok = seqOk && (rc == 3) && board.isDraw();
            if (ok) pass++; else fail++;
            std::cout << (ok ? "  OK   " : "  HATA ")
                << "uc tekrar: repetitionCount = " << rc
                << " (beklenen 3), isDraw = " << (board.isDraw() ? "evet" : "hayir") << std::endl;
        }

        std::cout << "\n=== SONUC: " << pass << " gecti, " << fail << " kaldi ===\n" << std::endl;
    }

    void runBench(ChessBoard& board, AI& ai, int depth) {
        int n = (int)(sizeof(BENCH_CASES) / sizeof(BENCH_CASES[0]));
        long long totalNodes = 0;
        const long long HUGE_MS = 1000LL * 60 * 60;   // pratikte zaman siniri yok

        bool bookBackup = ai.useBook;
        ai.useBook = false;   // tekrarlanabilirlik icin kitap kapali

        std::cout << "\n=== BENCH (sabit derinlik " << depth << ", kitapsiz) ===\n" << std::endl;
        auto t0 = std::chrono::steady_clock::now();

        for (int i = 0; i < n; i++) {
            if (!board.setFen(BENCH_CASES[i])) { std::cout << "FEN okunamadi." << std::endl; continue; }
            ai.clearTT();

            auto s = std::chrono::steady_clock::now();
            Move best = ai.getBestMoveTimed(board, depth, HUGE_MS, HUGE_MS, {});
            auto e = std::chrono::steady_clock::now();

            long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(e - s).count();
            totalNodes += ai.nodes;

            std::cout << "  poz " << std::setw(2) << (i + 1)
                << "  hamle " << std::setw(6) << Notation::toUci(best)
                << "  dugum " << std::setw(12) << ai.nodes
                << "  sure " << std::setw(7) << ms << " ms" << std::endl;
        }

        auto t1 = std::chrono::steady_clock::now();
        long long totalMs = std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
        long long nps = (totalMs > 0) ? (totalNodes * 1000 / totalMs) : 0;

        ai.useBook = bookBackup;

        std::cout << "\n===========================================" << std::endl;
        std::cout << "Toplam dugum : " << totalNodes << std::endl;
        std::cout << "Toplam sure  : " << totalMs << " ms" << std::endl;
        std::cout << "Dugum/saniye : " << nps << std::endl;
        std::cout << "===========================================\n" << std::endl;
    }
}