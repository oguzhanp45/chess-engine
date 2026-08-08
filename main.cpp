// main.cpp : UCI protokol katmani.
//
// FAZ 5a: Arama artik AYRI BIR IS PARCACIGINDA kosuyor.
// Onceki surumde "go" komutu motoru bloke ediyordu; bu sirada gelen
// "stop" komutu okunamiyordu bile. UCI standardi bunu gerektirir
// (analiz modunda her arayuz "stop" bekler) ve React Native tarafinda
// da ayni makineyi kullanacagiz - orada arama UI is parcacigini
// kilitlerse uygulama donar.

#include "Board.hpp"
#include "MoveGen.hpp"
#include "AI.hpp"
#include "Polyglot.hpp"
#include "Notation.hpp"
#include "Tests.hpp"
#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <memory>
#include <cstdlib>
#include <chrono>
#include <thread>
#include <mutex>
#include <atomic>

int main() {
    auto game = std::make_unique<ChessBoard>();
    auto chessAI = std::make_unique<AI>();
    MoveGenerator moveGen;

    game->initializeBoard();

    std::vector<unsigned long long> gameHistory;
    gameHistory.push_back(game->zobristKey);

    // --- Ciktinin tek kapisi ---
    // Arama is parcacigi ile ana is parcacigi ayni anda yazabilir;
    // satirlarin birbirine girmemesi icin tek kilit.
    std::mutex outMutex;
    auto say = [&outMutex](const std::string& line) {
        std::lock_guard<std::mutex> lock(outMutex);
        std::cout << line << std::endl;
        };
    chessAI->setInfoCallback(say);

    std::thread searchThread;
    auto stopAndJoin = [&]() {
        if (searchThread.joinable()) {
            chessAI->stop();
            searchThread.join();
        }
        };

    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;

        std::stringstream ss(line);
        std::string command;
        ss >> command;

        if (command == "uci") {
            say("id name Chess Engine v1.0");
            say("id author Oguzhan Puskullu");
            say("option name Hash type spin default 24 min 1 max 1024");
            say("option name OwnBook type check default true");
            say("option name BookFile type string default book.bin");
            say("uciok");
        }
        else if (command == "isready") {
            // Arama surerken de hemen cevaplanmali; join ETMIYORUZ.
            say("readyok");
        }
        else if (command == "setoption") {
            stopAndJoin();
            std::string tok, name, valueStr;
            while (ss >> tok) {
                if (tok == "name") {
                    ss >> name;
                }
                else if (tok == "value") {
                    std::getline(ss, valueStr);
                    // bastaki bosluklari kirp
                    size_t p = valueStr.find_first_not_of(" \t");
                    valueStr = (p == std::string::npos) ? "" : valueStr.substr(p);
                }
            }
            if (name == "Hash") {
                int mb = std::atoi(valueStr.c_str());
                if (mb > 0) { chessAI->setHashSizeMB(mb); say("info string Hash " + std::to_string(mb) + " MB"); }
            }
            else if (name == "OwnBook") {
                chessAI->useBook = (valueStr == "true" || valueStr == "1");
                say(std::string("info string OwnBook ") + (chessAI->useBook ? "acik" : "kapali"));
            }
            else if (name == "BookFile") {
                chessAI->bookPath = valueStr;
                say("info string BookFile " + valueStr);
            }
        }
        else if (command == "ucinewgame") {
            stopAndJoin();
            game->initializeBoard();
            chessAI->clearTT();
            gameHistory.clear();
            gameHistory.push_back(game->zobristKey);
        }
        else if (command == "position") {
            stopAndJoin();
            std::string token, fen;
            std::vector<std::string> moveTokens;
            int stage = 0;   // 1 = fen okunuyor, 2 = moves okunuyor

            while (ss >> token) {
                if (token == "startpos") { fen = Tests::START_FEN; stage = 0; }
                else if (token == "fen") { fen.clear(); stage = 1; }
                else if (token == "moves") { stage = 2; }
                else if (stage == 1) { if (!fen.empty()) fen += " "; fen += token; }
                else if (stage == 2) { moveTokens.push_back(token); }
            }

            if (fen.empty()) fen = Tests::START_FEN;
            if (!game->setFen(fen)) {
                say("info string HATA: FEN okunamadi, baslangic pozisyonuna donuluyor.");
                game->initializeBoard();
            }

            gameHistory.clear();
            gameHistory.push_back(game->zobristKey);

            for (size_t i = 0; i < moveTokens.size(); i++) {
                Move m;
                if (!Notation::fromUci(moveTokens[i], *game, moveGen, m)) {
                    say("info string HATA: gecersiz hamle '" + moveTokens[i] + "', kalan hamleler yok sayildi.");
                    break;
                }
                game->makeMove(m);
                gameHistory.push_back(game->zobristKey);
            }
        }
        else if (command == "go") {
            stopAndJoin();   // onceki arama varsa kes

            int maxDepth = 64;
            long long wtime = 0, btime = 0, winc = 0, binc = 0, movetime = 0;
            bool infinite = false;

            std::string token;
            while (ss >> token) {
                if (token == "wtime") ss >> wtime;
                else if (token == "btime") ss >> btime;
                else if (token == "winc") ss >> winc;
                else if (token == "binc") ss >> binc;
                else if (token == "depth") ss >> maxDepth;
                else if (token == "movetime") ss >> movetime;
                else if (token == "infinite") infinite = true;
            }

            const long long MOVE_OVERHEAD = 40;   // arayuz gecikmesi payi

            long long timeLimit = 1000;
            long long maxTimeLimit = 1000;
            long long timeLeft = (game->currentPlayer == 1) ? wtime : btime;

            if (infinite) {
                // "stop" gelene kadar dusun.
                timeLimit = 1000LL * 60 * 60 * 24;
                maxTimeLimit = timeLimit;
            }
            else if (movetime > 0) {
                timeLimit = movetime - MOVE_OVERHEAD;
                if (timeLimit < 10) timeLimit = 10;
                maxTimeLimit = timeLimit;
            }
            else {
                long long increment = (game->currentPlayer == 1) ? winc : binc;
                if (timeLeft > 0) {
                    timeLimit = (timeLeft / 40) + (increment / 2);
                    maxTimeLimit = timeLimit * 3;
                    if (maxTimeLimit > (timeLeft / 5)) maxTimeLimit = (timeLeft / 5);
                }
                if (timeLimit < 100 && timeLeft > 100) timeLimit = 100;
            }

            if (!infinite && timeLeft > 0) {
                long long usable = timeLeft - MOVE_OVERHEAD;
                if (usable < 10) usable = 10;
                if (timeLimit > usable / 2) timeLimit = usable / 2;
                if (maxTimeLimit > usable / 2) maxTimeLimit = usable / 2;
            }
            if (timeLimit < 10) timeLimit = 10;
            if (maxTimeLimit < timeLimit) maxTimeLimit = timeLimit;

            // FAZ 5a DUZELTMESI: "go infinite" ANALIZ modudur, kitap kullanilmaz.
            // Aksi halde acilis pozisyonlarinda motor hic dusunmeden kitap
            // hamlesini basar; arayuzde analiz penceresi bos kalir.
            bool bookBackup = chessAI->useBook;
            if (infinite) chessAI->useBook = false;

            // Arama arka planda; ana dongu "stop" ve "quit" okumaya devam eder.
            searchThread = std::thread([&, maxDepth, timeLimit, maxTimeLimit, bookBackup]() {
                Move best = chessAI->getBestMoveTimed(*game, maxDepth, timeLimit, maxTimeLimit, gameHistory);
                chessAI->useBook = bookBackup;
                say("bestmove " + Notation::toUci(best));
                });
        }
        else if (command == "stop") {
            chessAI->stop();     // arama kendi kendine bitip bestmove basacak
        }
        // ---------------- TEST KOMUTLARI ----------------
        else if (command == "perft") {
            stopAndJoin();
            int d = 5; ss >> d;
            auto t0 = std::chrono::steady_clock::now();
            unsigned long long n = Tests::perft(*game, moveGen, d, true);
            auto t1 = std::chrono::steady_clock::now();
            long long ms = std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
            std::cout << "perft(" << d << ") = " << n << "   (" << ms << " ms)" << std::endl;
        }
        else if (command == "perftdiv") {
            stopAndJoin(); int d = 4; ss >> d; Tests::perftDivide(*game, moveGen, d);
        }
        else if (command == "perftverify") {
            stopAndJoin(); int d = 4; ss >> d;
            std::cout << "makeMove/undoMove butunluk testi, derinlik " << d << " ..." << std::endl;
            bool ok = Tests::perftVerify(*game, moveGen, d);
            std::cout << (ok ? "SONUC: TEMIZ - undoMove, artimli hash ve sah karesi tutarli."
                : "SONUC: HATA BULUNDU (yukariya bakin).") << std::endl;
        }
        else if (command == "perftsuite") {
            stopAndJoin(); int d = 5; ss >> d; Tests::runPerftSuite(*game, moveGen, d); game->initializeBoard();
        }
        else if (command == "hashtest") {
            stopAndJoin(); Tests::runHashTest(*game, moveGen); game->initializeBoard();
        }
        else if (command == "apitest") {
            stopAndJoin(); Tests::runApiTest(); game->initializeBoard();
        }
        else if (command == "leveltest") {
            stopAndJoin(); Tests::runLevelTest(); game->initializeBoard();
        }
        else if (command == "santest") {
            stopAndJoin(); Tests::runSanTest(*game, moveGen); game->initializeBoard();
        }
        else if (command == "mirror") {
            stopAndJoin(); Tests::runMirrorTest(*game, *chessAI); game->initializeBoard();
        }
        else if (command == "matetest") {
            stopAndJoin(); Tests::runMateTest(*game, *chessAI); game->initializeBoard();
        }
        else if (command == "drawtest") {
            stopAndJoin(); Tests::runDrawTest(*game, moveGen, *chessAI); game->initializeBoard();
        }
        else if (command == "bench") {
            stopAndJoin(); int d = 7; ss >> d; Tests::runBench(*game, *chessAI, d); game->initializeBoard();
        }
        else if (command == "d") {
            stopAndJoin();
            game->printBoard();
            unsigned long long ref = PolyglotBook::computeHash(*game);
            std::cout << "FEN: " << game->getFen() << std::endl;
            std::cout << "Zobrist(artimli): " << std::hex << game->zobristKey
                << "   Polyglot(referans): " << ref << std::dec
                << (game->zobristKey == ref ? "   [ESLESIYOR]" : "   [!!! AYRISMIS !!!]") << std::endl;
        }
        else if (command == "eval") {
            stopAndJoin();
            std::cout << "Statik degerlendirme (beyaz lehine): " << chessAI->evaluateBoard(*game) << std::endl;
        }
        else if (command == "quit") {
            stopAndJoin();
            break;
        }
    }

    stopAndJoin();
    return 0;
}