
import { Chess } from 'chess.js';


export function generateRepetition(chess) {
    const fen = chess.fen().split(' ').slice(0, 4).join(' ');

    for (const move1 of chess.moves({ verbose: true })) {
        if (move1.piece === 'p') {
            continue;
        }
        chess.move(move1.san);

        for (const move2 of chess.moves({ verbose: true })) {
            if (move2.piece === 'p') {
                continue;
            }
            chess.move(move2.san);

            try {
                const move3 = chess.move({ from: move1.to, to: move1.from });
                try {
                    const move4 = chess.move({ from: move2.to, to: move2.from });
                    if (chess.fen().split(' ').slice(0, 4).join(' ') === fen) {
                        return [move1, move2, move3, move4].map(move => move.lan);
                    }
                    chess.undo();
                } catch {}

                chess.undo();
            } catch {}

            chess.undo();
        }
        chess.undo();
    }
    return null;
}

if (import.meta.vitest) {
    test('generateRepetition', () => {
        expect(generateRepetition(new Chess())).toEqual(['b1a3', 'b8c6', 'a3b1', 'c6b8']);
        expect(generateRepetition(new Chess('7k/8/8/8/8/8/6r1/7K w'))).toBe(null);  // Capture necessary
        expect(generateRepetition(new Chess('4k3/4P3/4K3/7p/8/8/8/8 w'))).toBe(null);  // Pawn move necessary
        expect(generateRepetition(new Chess('r3k2r/3pPp2/3P1P2/8/8/3p1p2/3PpP2/R3K2R b Kq'))).toEqual(['h8h7', 'a1a2', 'h7h8', 'a2a1']);
        expect(generateRepetition(new Chess('r3k2r/3pPp2/3P1P2/8/8/3p1p2/3PpP2/R3K2R b KQ'))).toBe(null);  // Losing castling rights necessary

        const chess = new Chess();
        chess.move('e4');
        // https://github.com/jhlywa/chess.js/blob/v1.0.0-beta.6/README.md#fen
        expect(chess.fen()).not.toContain('e3');
        expect(generateRepetition(chess)).toEqual(['b8c6', 'b1a3', 'c6b8', 'a3b1']);
        chess.move('e6');
        chess.move('e5');
        chess.move('d5');
        expect(chess.fen()).toContain('d6');
        expect(generateRepetition(chess)).toBe(null);  // En passant possible only for this turn
    });
}
