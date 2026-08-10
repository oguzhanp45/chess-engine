/**
 * KONUM: app/src/components/Board.tsx   (üzerine yaz)
 *
 * DÜZELTME (dokunma ile sürükleme çakışması):
 *  - Sürükleme görseli artık parmak DRAG_THRESHOLD kadar hareket edene kadar
 *    başlamıyor. Basit dokunuşta taş yerinden oynamıyor.
 *  - canDrag saf bir soru: sadece true/false döner, durum değiştirmez.
 *    Seçimi Board kendi içinde gösteriyor (sürükleme sırasında dragFrom,
 *    diğer zamanlarda selected).
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import BoardSquares from './BoardSquares';
import BoardPieces from './BoardPieces';
import PieceView from './PieceView';
import { theme } from '../theme';
import { fenToBoard, squareToIndex } from '../chess/fen';
import { squareToXY, xyToSquare, type Geometry } from '../chess/geometry';

const DRAG_THRESHOLD = 8;

type Props = {
  fen: string;
  size: number;
  selected: string | null;
  legalMoves: string[];
  lastMove?: { from: string; to: string } | null;
  animating?: { from: string; to: string } | null;
  checkSquare?: string | null;
  flipped?: boolean;
  showCoords?: boolean;
  enabled?: boolean;

  onTap: (square: string) => void;
  /** SAF: sadece cevap verir, durum değiştirmez. */
  canDrag: (square: string) => boolean;
  onDrop: (from: string, to: string | null) => void;
};

export default function Board({
  fen, size, selected, legalMoves, lastMove = null, animating = null,
  checkSquare = null, flipped = false, showCoords = true, enabled = true,
  onTap, canDrag, onDrop,
}: Props) {
  const frame = theme.frame;
  const square = Math.floor((size - frame * 2) / 8);
  const boardPx = square * 8;

  const geometry: Geometry = useMemo(() => ({ square, flipped }), [square, flipped]);
  const board = useMemo(() => fenToBoard(fen), [fen]);

  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const dragPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Vurgu ve hedef noktaları: sürükleniyorsa sürüklenen kare, değilse seçili kare.
  const highlightFrom = dragFrom ?? selected;

  const targets = useMemo(() => {
    if (highlightFrom === null) return new Set<string>();
    const set = new Set<string>();
    for (const m of legalMoves) {
      if (m.slice(0, 2) === highlightFrom) set.add(m.slice(2, 4));
    }
    return set;
  }, [highlightFrom, legalMoves]);

  // PanResponder içinden okunan değerler ref'te tutulur; state kullanırsak
  // closure eski değeri görür.
  const originRef = useRef({ x: 0, y: 0 });
  const startRef = useRef({ x: 0, y: 0, square: '' });
  const draggingRef = useRef(false);
  const dragFromRef = useRef<string | null>(null);
  const geometryRef = useRef(geometry);
  geometryRef.current = geometry;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const canDragRef = useRef(canDrag);
  canDragRef.current = canDrag;

  const containerRef = useRef<View>(null);

  const onLayout = (_e: LayoutChangeEvent) => {
    containerRef.current?.measureInWindow((x, y) => {
      originRef.current = { x: x + frame, y: y + frame };
    });
  };

  const beginDrag = (sq: string, lx: number, ly: number) => {
    const g = geometryRef.current;
    draggingRef.current = true;
    dragFromRef.current = sq;
    setDragFrom(sq);
    dragPos.setValue({ x: lx - g.square / 2, y: ly - g.square / 2 });
  };

  const endDrag = () => {
    draggingRef.current = false;
    dragFromRef.current = null;
    setDragFrom(null);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: e => {
          if (!enabledRef.current) return;
          const g = geometryRef.current;
          const lx = e.nativeEvent.pageX - originRef.current.x;
          const ly = e.nativeEvent.pageY - originRef.current.y;
          const sq = xyToSquare(lx, ly, g);

          // Sadece not al. Sürükleme görseli HENÜZ başlamıyor.
          startRef.current = { x: lx, y: ly, square: sq ?? '' };
          draggingRef.current = false;
        },

        onPanResponderMove: e => {
          if (!enabledRef.current) return;
          const g = geometryRef.current;
          const lx = e.nativeEvent.pageX - originRef.current.x;
          const ly = e.nativeEvent.pageY - originRef.current.y;

          if (draggingRef.current) {
            dragPos.setValue({ x: lx - g.square / 2, y: ly - g.square / 2 });
            return;
          }

          const moved =
            Math.abs(lx - startRef.current.x) > DRAG_THRESHOLD ||
            Math.abs(ly - startRef.current.y) > DRAG_THRESHOLD;

          if (moved) {
            const sq = startRef.current.square;
            if (sq && canDragRef.current(sq)) {
              beginDrag(sq, lx, ly);
            } else {
              // Sürüklenemeyen kareden başladı; bu jest artık dokunuş da sayılmaz.
              startRef.current.square = '';
            }
          }
        },

        onPanResponderRelease: e => {
          if (!enabledRef.current) return;
          const g = geometryRef.current;
          const lx = e.nativeEvent.pageX - originRef.current.x;
          const ly = e.nativeEvent.pageY - originRef.current.y;
          const from = dragFromRef.current;
          const wasDragging = draggingRef.current;

          endDrag();

          if (wasDragging && from) {
            onDrop(from, xyToSquare(lx, ly, g));
          } else if (startRef.current.square) {
            onTap(startRef.current.square);
          }
        },

        onPanResponderTerminate: () => {
          endDrag();
        },
      }),
    [dragPos, onDrop, onTap],
  );

  const draggedPiece = dragFrom ? board[squareToIndex(dragFrom)] : null;

  return (
    <View
      ref={containerRef}
      onLayout={onLayout}
      style={[styles.frame, { padding: frame }]}
      {...panResponder.panHandlers}
    >
      <View style={{ width: boardPx, height: boardPx }}>
        <BoardSquares square={square} flipped={flipped} showCoords={showCoords} />

        {lastMove && (
          <>
            <Highlight square={lastMove.from} geometry={geometry} color={theme.board.lastMove} />
            <Highlight square={lastMove.to} geometry={geometry} color={theme.board.lastMove} />
          </>
        )}
        {checkSquare && (
          <Highlight square={checkSquare} geometry={geometry} color={theme.board.check} />
        )}
        {highlightFrom && (
          <Highlight square={highlightFrom} geometry={geometry} color={theme.board.selected} />
        )}

        <BoardPieces
          board={board}
          geometry={geometry}
          animating={animating}
          draggingFrom={dragFrom}
        />

        {[...targets].map(sq => (
          <TargetDot
            key={sq}
            square={sq}
            geometry={geometry}
            occupied={board[squareToIndex(sq)] !== null}
          />
        ))}

        {draggedPiece && (
          <Animated.View
            style={[
              styles.dragged,
              {
                transform: [
                  { translateX: dragPos.x },
                  { translateY: dragPos.y },
                  { scale: theme.piece.dragScale },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <PieceView piece={draggedPiece} size={square} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function Highlight({
  square, geometry, color,
}: { square: string; geometry: Geometry; color: string }) {
  const p = squareToXY(square, geometry);
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: geometry.square,
        height: geometry.square,
        backgroundColor: color,
        opacity: 0.55,
        transform: [{ translateX: p.x }, { translateY: p.y }],
      }}
    />
  );
}

function TargetDot({
  square, geometry, occupied,
}: { square: string; geometry: Geometry; occupied: boolean }) {
  const p = squareToXY(square, geometry);
  const s = geometry.square;
  const size = occupied ? s * 0.9 : s * 0.26;
  const offset = (s - size) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: occupied ? 'transparent' : theme.board.target,
        borderWidth: occupied ? s * 0.07 : 0,
        borderColor: theme.board.target,
        transform: [{ translateX: p.x + offset }, { translateY: p.y + offset }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: theme.board.frame,
    borderRadius: 4,
    alignSelf: 'center',
  },
  dragged: { position: 'absolute', left: 0, top: 0, zIndex: 10 },
});
