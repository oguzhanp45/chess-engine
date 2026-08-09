/**
 * Motor sözleşmesi. Metot adları C++ tarafındaki EngineApi ile birebir aynı.
 * Bu dosyada uygulama YOK, sadece tip var. Adım 3'te NativeEngine bu
 * arayüzü uygulayacak ve MockEngine silinecek.
 *
 * Hepsi Promise döndürüyor: Adım 4'te bestMove arka plan thread'ine taşınınca
 * çağıran kodun değişmemesi için.
 */

export type Side = 'w' | 'b';

export interface ChessEngine {
  newGame(fen?: string): Promise<void>;
  getFen(): Promise<string>;
  sideToMove(): Promise<Side>;
  legalMoves(): Promise<string[]>;
  gameStatus(): Promise<string>;
  makeMove(uci: string): Promise<boolean>;
  undo(): Promise<boolean>;
  sanFor(uci: string): Promise<string>;
  moveHistorySan(): Promise<string[]>;
  bestMove(timeMs: number): Promise<string>;
  stop(): Promise<void>;
  setSkillLevel(level: number): Promise<void>;
  setHashSizeMB(mb: number): Promise<void>;
}

/** Ekranın motordan okuduğu her şey tek nesnede. */
export type Snapshot = {
  fen: string;
  sideToMove: Side;
  legalMoves: string[];
  historySan: string[];
  status: string;
};

/**
 * Tek okuma noktası. Her hamleden sonra bu çağrılır, dönen nesne state'e
 * yazılır. Ekran kendi başına pozisyon hesaplamaz; motor tek doğru kaynaktır.
 */
export async function readSnapshot(engine: ChessEngine): Promise<Snapshot> {
  const [fen, sideToMove, legalMoves, historySan, status] = await Promise.all([
    engine.getFen(),
    engine.sideToMove(),
    engine.legalMoves(),
    engine.moveHistorySan(),
    engine.gameStatus(),
  ]);
  return { fen, sideToMove, legalMoves, historySan, status };
}
