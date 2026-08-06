#pragma once
#include "Types.hpp"
#include "Board.hpp"
#include "MoveGen.hpp"
#include <string>

// ============================================================
//  FAZ 5a: GOSTERIM KATMANI
// ============================================================
// moveToString ve parseMove daha once main.cpp icindeydi ve Tests.cpp
// bunlara "extern" ile ulasiyordu. Motoru bir kutuphane olarak
// derleyebilmek icin (CMake ve ileride mobil kopru) bu bagimliligin
// tersine cevrilmesi gerekiyordu: artik gosterim de kutuphanenin parcasi.
namespace Notation {

    // Uzun cebirsel gosterim (UCI): "e2e4", "e7e8q", bos hamle icin "0000"
    std::string toUci(const Move& m);

    // UCI metnini legal hamleye cevirir. Sinir kontrolu yapar ve hamlenin
    // gercekten legal oldugunu dogrular; gecersizse false doner ve tahtaya
    // dokunmaz.
    bool fromUci(const std::string& text, ChessBoard& board, MoveGenerator& moveGen, Move& out);
}
