#include "Notation.hpp"
#include <cstdlib>
#include <vector>

namespace Notation {

    std::string toUci(const Move& m) {
        if (m.isNull()) return "0000";
        std::string s;
        s += (char)(m.startCol + 'a');
        s += std::to_string(8 - m.startRow);
        s += (char)(m.targetCol + 'a');
        s += std::to_string(8 - m.targetRow);

        if (m.promotionPiece != 0) {
            int p = std::abs((int)m.promotionPiece);
            if (p == W_QUEEN)       s += "q";
            else if (p == W_ROOK)   s += "r";
            else if (p == W_BISHOP) s += "b";
            else if (p == W_KNIGHT) s += "n";
        }
        return s;
    }

    bool fromUci(const std::string& text, ChessBoard& board, MoveGenerator& moveGen, Move& out) {
        if (text.length() < 4) return false;

        int startCol = text[0] - 'a';
        int startRow = 8 - (text[1] - '0');
        int targetCol = text[2] - 'a';
        int targetRow = 8 - (text[3] - '0');

        if (startCol < 0 || startCol  > 7 || startRow < 0 || startRow  > 7) return false;
        if (targetCol < 0 || targetCol > 7 || targetRow < 0 || targetRow > 7) return false;

        int promoType = 0;
        if (text.length() >= 5) {
            switch (text[4]) {
            case 'q': promoType = W_QUEEN;  break;
            case 'r': promoType = W_ROOK;   break;
            case 'b': promoType = W_BISHOP; break;
            case 'n': promoType = W_KNIGHT; break;
            default: return false;
            }
        }

        // Legal hamle listesinde esini ara: terfi tasinin isareti buradan dogru
        // gelir ve gecersiz girdiler tahtayi bozamaz.
        std::vector<Move> legals = moveGen.getLegalMoves(board);
        for (size_t i = 0; i < legals.size(); i++) {
            const Move& m = legals[i];
            if (m.startRow != startRow || m.startCol != startCol) continue;
            if (m.targetRow != targetRow || m.targetCol != targetCol) continue;
            if (promoType == 0) { if (m.promotionPiece != 0) continue; }
            else { if (std::abs((int)m.promotionPiece) != promoType) continue; }
            out = m;
            return true;
        }
        return false;
    }

}  // namespace Notation