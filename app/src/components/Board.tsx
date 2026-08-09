/**
 * Tahta. 8 satır açıkça çizilir — flexWrap kullanılmaz.
 *
 * Neden: flexWrap, üst kutunun iç genişliğine bağlıdır. Kenarlık, dolgu veya
 * yuvarlama eklendiğinde iç genişlik birkaç piksel azalır ve 8. kare alt
 * satıra düşer. Satırları elle çizince bu risk tamamen ortadan kalkar.
 *
 * Çerçeve ayrı bir View: kenarlık ızgaranın DIŞINDA kalsın diye.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Square from './Square';
import { theme } from '../theme';
import { fenToBoard, indexToSquare, isDarkSquare } from '../chess/fen';

type Props = {
  fen: string;
  size: number;            // çerçeve dahil hedef kenar uzunluğu
  selected: string | null;
  legalMoves: string[];
  lastMove?: { from: string; to: string } | null;
  flipped?: boolean;
  showCoords?: boolean;
  onSquarePress: (square: string) => void;
};

const FRAME = 6;

export default function Board({
  fen, size, selected, legalMoves, lastMove = null,
  flipped = false, showCoords = true, onSquarePress,
}: Props) {
  // Kare boyutu tam sayı olmalı, yoksa satırlar arasında yarım piksel boşluk çıkar.
  const squareSize = Math.floor((size - FRAME * 2) / 8);

  const board = useMemo(() => fenToBoard(fen), [fen]);

  const targets = useMemo(() => {
    if (selected === null) return new Set<string>();
    const set = new Set<string>();
    for (const move of legalMoves) {
      if (move.slice(0, 2) === selected) set.add(move.slice(2, 4));
    }
    return set;
  }, [selected, legalMoves]);

  // 8 satır x 8 indeks. Çevrilmişse sıra tersine döner.
  const rows = useMemo(() => {
    const list = Array.from({ length: 64 }, (_, i) => i);
    if (flipped) list.reverse();
    const out: number[][] = [];
    for (let r = 0; r < 8; r++) out.push(list.slice(r * 8, r * 8 + 8));
    return out;
  }, [flipped]);

  return (
    <View style={styles.frame}>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((index, colIndex) => {
              const square = indexToSquare(index);
              return (
                <Square
                  key={square}
                  square={square}
                  piece={board[index]}
                  dark={isDarkSquare(index)}
                  selected={selected === square}
                  lastMove={lastMove !== null && (lastMove.from === square || lastMove.to === square)}
                  target={targets.has(square)}
                  size={squareSize}
                  fileLabel={showCoords && rowIndex === 7 ? square[0] : undefined}
                  rankLabel={showCoords && colIndex === 0 ? square[1] : undefined}
                  onPress={onSquarePress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: FRAME,
    backgroundColor: theme.board.frame,
    borderRadius: 4,
    // Genişlik verilmiyor: içerik kadar olsun, hesap hatası ihtimali kalmasın.
    alignSelf: 'center',
  },
  grid: { overflow: 'hidden' },
  row: { flexDirection: 'row' },
});
