/**
 * KONUM: app/src/components/PieceView.tsx   (yeni dosya)
 *
 * TEK TAŞ ÇİZİMİ. Tasarımı değiştirmek istediğinde ilk uğrayacağın yer.
 *
 * İki mod var:
 *   'glyph' -> yazı tipi sembolü (varsayılan, dosya gerektirmez)
 *   'image' -> PNG görsel (kaliteli sonuç için önerilen)
 *
 * GÖRSELE GEÇMEK İÇİN:
 *   1. app/assets/pieces/ klasörünü oluştur
 *   2. 12 PNG koy: wK wQ wR wB wN wP bK bQ bR bB bN bP (öneri: 256x256, şeffaf)
 *   3. Aşağıdaki IMAGES bloğunun yorumunu kaldır
 *   4. PIECE_MODE'u 'image' yap
 * Metro yeni klasörü görsün diye: npm start -- --reset-cache
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { glyphFor, isWhitePiece, type Piece } from '../chess/fen';

type Mode = 'glyph' | 'image';
const PIECE_MODE: Mode = 'glyph';

/*
import { Image } from 'react-native';

const IMAGES: Record<Piece, any> = {
  K: require('../../assets/pieces/wK.png'),
  Q: require('../../assets/pieces/wQ.png'),
  R: require('../../assets/pieces/wR.png'),
  B: require('../../assets/pieces/wB.png'),
  N: require('../../assets/pieces/wN.png'),
  P: require('../../assets/pieces/wP.png'),
  k: require('../../assets/pieces/bK.png'),
  q: require('../../assets/pieces/bQ.png'),
  r: require('../../assets/pieces/bR.png'),
  b: require('../../assets/pieces/bB.png'),
  n: require('../../assets/pieces/bN.png'),
  p: require('../../assets/pieces/bP.png'),
};
*/

type Props = {
  piece: Piece;
  size: number; // kare boyutu
};

function PieceViewBase({ piece, size }: Props) {
  if (PIECE_MODE === 'image') {
    // return (
    //   <Image
    //     source={IMAGES[piece]}
    //     style={{ width: size, height: size }}
    //     resizeMode="contain"
    //   />
    // );
  }

  const white = isWhitePiece(piece);
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Text
        style={[
          styles.glyph,
          {
            fontSize: size * theme.piece.scale,
            color: white ? theme.piece.white : theme.piece.black,
            textShadowColor: white ? theme.piece.whiteEdge : theme.piece.blackEdge,
          },
        ]}
      >
        {glyphFor(piece)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  glyph: {
    includeFontPadding: false,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
});

export default React.memo(PieceViewBase);
