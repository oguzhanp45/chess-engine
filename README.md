# Chess Engine

UCI-compatible chess engine written from scratch in C++(17).
Sıfırdan C++(17) ile yazılmış, UCI uyumlu satranç motoru.

---

## English

A single-threaded alpha-beta chess engine with a full test harness.
The engine plays via the UCI protocol and works with any standard GUI
(Arena, Cute Chess, BanksiaGUI).

### Features

**Search**
- Iterative deepening with aspiration windows
- Negamax with principal variation search (PVS)
- Transposition table (configurable size, packed 24-byte entries)
- Null-move pruning, late move reductions, razoring, futility pruning
- Singular extensions, check extensions (capped)
- Quiescence search with check evasions and static exchange evaluation
- Killer moves, history heuristic, counter-move table
- Mate-distance-aware scoring (`score mate N`)

**Evaluation**
- Tapered evaluation (middlegame / endgame interpolation)
- Piece-square tables, mobility, king safety, pawn structure
- Passed / isolated / doubled pawns, outposts, rook placement
- Verified colour-symmetric (see `mirror` test)

**Rules**
- Full legal move generation, verified against standard perft positions
- Threefold repetition, fifty-move rule, insufficient material
- Polyglot opening book support (`.bin`), standard-compliant hashing
- FEN import/export with validation

### Build

Requires CMake 3.15+ and a C++17 compiler. Tested with MSVC 2022 and GCC 13.

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

The build produces `chessengine` (static library) and `engine` (UCI executable).
The library/executable split exists so the engine core can be embedded in
other applications without the UCI layer.

Visual Studio users can also add all source files to an empty C++ project;
set the language standard to C++17 and build in Release x64.

### UCI options

| Option | Type | Default | Description |
|---|---|---|---|
| `Hash` | spin | 24 | Transposition table size in MB (1–1024) |
| `OwnBook` | check | true | Use the Polyglot opening book |
| `BookFile` | string | book.bin | Path to the Polyglot book |

Supported commands: `uci`, `isready`, `ucinewgame`, `position`
(both `startpos` and `fen`), `go` (`wtime`/`btime`/`winc`/`binc`/`movetime`/`depth`/`infinite`),
`stop`, `setoption`, `quit`.

Search runs on a background thread, so `stop` is honoured immediately.

### Test harness

This is the part of the project I would point at first. Every change to the
engine is validated against these before it is kept.

| Command | What it checks |
|---|---|
| `perftsuite [depth]` | Move generation against 6 standard perft positions |
| `perftverify [depth]` | `makeMove`/`undoMove` integrity, incremental hash, tracked king squares — at every node |
| `hashtest` | Zobrist keys against the 9 reference values in the Polyglot specification |
| `mirror` | `eval(pos) == -eval(mirrored pos)` — catches colour asymmetry in evaluation |
| `matetest` | Known mate positions: correct move *and* correct mate distance |
| `drawtest` | Stalemate, insufficient material, fifty-move rule, threefold repetition, FEN validation |
| `bench [depth]` | Reproducible node count and speed over 8 fixed positions |
| `perftdiv [depth]` | Per-move node counts, for locating a move generation bug |
| `d` / `eval` | Board, FEN, hash comparison / static evaluation |

Current status: perft 24/24, hash 9/9, mirror 9/9, mate 5/5, draw 14/14.

### Measured progress

Development proceeded in phases; each was validated by acceptance tests and,
where the change affected search behaviour, by self-play matches against the
previous version using `cutechess-cli`.

| Phase | Change | Result |
|---|---|---|
| 0 | Test harness, FEN support | Found: stalemate scored as mate, colour-asymmetric evaluation, infinite loop in aspiration window |
| 1 | Fixed the above + draw rules, mate distance | **+338 Elo** (±100, 80 games) |
| 2 | Unified Zobrist hashing to Polyglot standard | Fixed en-passant collisions in the transposition table |
| 3a | Negamax refactor | Neutral (−4 ±66, 400 games) — as intended; revealed singular extensions never fired for one side |
| 3b | Move ordering rewrite, quiescence check evasions | **+37 Elo** (±30, 400 games) |
| 4 | King tracking, capture-only generation, packed data structures | **+277 Elo** at 5+0.05 (±39, 400 games); 2.4× node rate |
| 5a | Portability, `stop` command, book in memory, CMake | Now builds on GCC/Clang, not just MSVC |

Search speed went from ~324k to ~856k nodes/second on the same machine.

Note on the phase 4 figure: Elo differences from speed gains depend heavily on
time control. At 5+0.05 an extra ply is worth far more than it would be in a
long game. The number measures what it measures.

### Known limitations

- Single-threaded search
- Hand-tuned evaluation, no automated parameter tuning
- Static exchange evaluation is a one-ply approximation (no x-ray, no multiple defenders)
- Transposition table uses always-replace, no depth preference or ageing
- No endgame tablebases
- No `ponder`, no `MultiPV`
- Absolute playing strength has not been calibrated against a rated opponent

### Roadmap

- Real SEE, LMR reduction table, pawn hash table, history ageing
- Skill levels for casual play
- SAN / PGN output
- Mobile application (React Native, Android first)

### Credits

- Piece-square tables adapted from published PeSTO values
- Polyglot book format and random number table follow the original
  Polyglot specification
- Perft reference positions from the Chess Programming Wiki

### License

See `LICENSE`.

---

## Türkçe

Sıfırdan C++17 ile yazılmış, UCI uyumlu bir satranç motoru. Arena, Cute Chess
gibi standart arayüzlerle çalışır.

**Derleme:**

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
```

Visual Studio kullanıyorsanız boş bir C++ projesine tüm kaynak dosyaları
ekleyip, dil standardını C++17 yapıp Release x64 derlemeniz yeterli.

**Öne çıkan yanı test altyapısı.** Motora yapılan her değişiklik korunmadan
önce şu testlerden geçiriliyor: `perftsuite` (hamle üretimi), `perftverify`
(geri alma ve artımlı hash bütünlüğü), `hashtest` (Polyglot uyumu), `mirror`
(değerlendirmenin renk simetrisi), `matetest`, `drawtest`, `bench`.

Arama davranışını değiştiren her adım ayrıca bir önceki sürüme karşı
`cutechess-cli` ile self-play maçıyla ölçüldü. Ayrıntılı tablo yukarıdaki
İngilizce bölümde.

Açılış kitabı (`book.bin`) depoya dahil değildir; motor kitapsız da çalışır.
İsterseniz herhangi bir Polyglot `.bin` dosyasını çalıştırılabilir dosyanın
yanına koyabilir veya `setoption name BookFile value <yol>` ile
belirtebilirsiniz.
