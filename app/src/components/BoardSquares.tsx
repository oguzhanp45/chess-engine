/**
 * KONUM: app/src/components/BoardSquares.tsx   (yeni dosya)
 *
 * 64 sabit kare + koordinat yazıları. Hamle olduğunda YENİDEN ÇİZİLMEZ —
 * props'u (kare boyutu, çevrik mi) değişmediği sürece React.memo devrede.
 * Taşlar ayrı katmanda olduğu için bu katman tamamen durağan.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { indexToSquare, isDarkSquare } from '../chess/fen';

type Props = {
  square: number;   // kare kenarı (piksel)
  flipped: boolean;
  showCoords: boolean;
};

function BoardSquaresBase({ square, flipped, showCoords }: Props) {
  const rows: number[][] = [];
  const list = Array.from({ length: 64 }, (_, i) => i);
  if (flipped) list.reverse();
  for (let r = 0; r < 8; r++) rows.push(list.slice(r * 8, r * 8 + 8));

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((index, colIndex) => {
            const name = indexToSquare(index);
            return (
              <View
                key={name}
                style={{
                  width: square,
                  height: square,
                  backgroundColor: isDarkSquare(index)
                    ? theme.board.dark
                    : theme.board.light,
                }}
              >
                {showCoords && colIndex === 0 && (
                  <Text style={[styles.coord, styles.rank, { fontSize: square * 0.2 }]}>
                    {name[1]}
                  </Text>
                )}
                {showCoords && rowIndex === 7 && (
                  <Text style={[styles.coord, styles.file, { fontSize: square * 0.2 }]}>
                    {name[0]}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  coord: { position: 'absolute', color: theme.board.coord, fontWeight: '700' },
  rank: { top: 1, left: 3 },
  file: { bottom: 0, right: 3 },
});

export default React.memo(BoardSquaresBase);
