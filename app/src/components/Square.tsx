/**
 * Tek kare. Hiçbir şey bilmez, verilen props'u çizer ve basıldığında bildirir.
 * Adım 5'te tasarım değişikliği yalnızca bu dosyada olacak.
 *
 * ÖNEMLİ: burada borderWidth KULLANILMAZ. React Native'de kenarlık genişliğin
 * içinden yer alır; karelere kenarlık verilirse 8 kare satıra sığmaz.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { glyphFor, isWhitePiece, type Piece } from '../chess/fen';

type Props = {
  square: string;
  piece: Piece | null;
  dark: boolean;
  selected: boolean;
  lastMove: boolean;
  target: boolean;
  size: number;
  fileLabel?: string;
  rankLabel?: string;
  onPress: (square: string) => void;
};

function SquareBase({
  square, piece, dark, selected, lastMove, target, size,
  fileLabel, rankLabel, onPress,
}: Props) {
  const background = selected
    ? theme.board.selected
    : lastMove
    ? theme.board.lastMove
    : dark
    ? theme.board.dark
    : theme.board.light;

  const white = piece !== null && isWhitePiece(piece);

  return (
    <Pressable
      onPress={() => onPress(square)}
      style={[styles.square, { width: size, height: size, backgroundColor: background }]}
      accessibilityRole="button"
      accessibilityLabel={piece ? `${square} dolu` : `${square} boş`}
    >
      {rankLabel !== undefined && (
        <Text style={[styles.coord, styles.rank, { fontSize: size * 0.2 }]}>{rankLabel}</Text>
      )}
      {fileLabel !== undefined && (
        <Text style={[styles.coord, styles.file, { fontSize: size * 0.2 }]}>{fileLabel}</Text>
      )}

      {piece !== null && (
        <Text
          style={[
            styles.piece,
            {
              fontSize: size * 0.74,
              color: white ? theme.piece.white : theme.piece.black,
              textShadowColor: white ? theme.piece.whiteEdge : theme.piece.blackEdge,
            },
          ]}
        >
          {glyphFor(piece)}
        </Text>
      )}

      {/* Hedef göstergesi: boş kareye nokta, dolu kareye halka.
          legalMoves boşken hiç görünmez — Adım 3'te motor doldurur. */}
      {target && piece === null && (
        <View
          style={[
            styles.dot,
            { width: size * 0.26, height: size * 0.26, borderRadius: size * 0.13 },
          ]}
        />
      )}
      {target && piece !== null && (
        <View
          style={[
            styles.ring,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: size * 0.45,
              borderWidth: size * 0.07,
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  piece: {
    includeFontPadding: false,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  coord: {
    position: 'absolute',
    color: theme.board.coord,
    fontWeight: '700',
  },
  rank: { top: 1, left: 3 },
  file: { bottom: 0, right: 3 },
  dot: { position: 'absolute', backgroundColor: theme.board.target },
  ring: { position: 'absolute', borderColor: theme.board.target },
});

/** Props değişmedikçe yeniden çizme. 64 kare var, her hamlede hepsi çizilmesin. */
export default React.memo(SquareBase);
