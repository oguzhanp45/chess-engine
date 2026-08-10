/**
 * KONUM: app/src/components/BoardPieces.tsx   (üzerine yaz)
 *
 * DÜZELTME: önceki sürümde bir taş, animasyon varken SlidingPiece, yokken düz
 * Animated.View olarak çiziliyordu. Aynı anahtarda bileşen TÜRÜ değişince
 * React eskisini söküp yenisini takar — her animasyon bitiminde tüm taşlar
 * yeniden bindirilirdi. Hızlı oynarken titreme buradan geliyordu.
 *
 * Şimdi tek bir bileşen var; animasyon olup olmaması sadece bir prop.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import PieceView from './PieceView';
import { theme } from '../theme';
import { indexToSquare, type BoardArray, type Piece } from '../chess/fen';
import { squareToXY, type Geometry } from '../chess/geometry';

type Props = {
  board: BoardArray;
  geometry: Geometry;
  animating: { from: string; to: string } | null;
  draggingFrom: string | null;
};

function BoardPiecesBase({ board, geometry, animating, draggingFrom }: Props) {
  return (
    <>
      {board.map((piece, index) => {
        if (piece === null) return null;
        const name = indexToSquare(index);
        if (name === draggingFrom) return null;

        const pos = squareToXY(name, geometry);
        const slide =
          animating !== null && animating.to === name && theme.anim.move > 0;
        const from = slide ? squareToXY(animating.from, geometry) : pos;

        return (
          <PieceSprite
            key={`${piece}-${name}`}
            piece={piece}
            size={geometry.square}
            x={pos.x}
            y={pos.y}
            fromX={from.x}
            fromY={from.y}
            slide={slide}
          />
        );
      })}
    </>
  );
}

type SpriteProps = {
  piece: Piece;
  size: number;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  slide: boolean;
};

function PieceSpriteBase({ piece, size, x, y, fromX, fromY, slide }: SpriteProps) {
  // 1 = kalkış karesinde, 0 = varış karesinde
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (slide && (fromX !== x || fromY !== y)) {
      t.setValue(1);
      Animated.timing(t, {
        toValue: 0,
        duration: theme.anim.move,
        useNativeDriver: true,
      }).start();
    } else {
      t.setValue(0);
    }
  }, [slide, fromX, fromY, x, y, t]);

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [x, fromX] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [y, fromY] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <PieceView piece={piece} size={size} />
    </Animated.View>
  );
}

const PieceSprite = React.memo(PieceSpriteBase);

const styles = StyleSheet.create({
  piece: { position: 'absolute', left: 0, top: 0 },
});

export default React.memo(BoardPiecesBase);
