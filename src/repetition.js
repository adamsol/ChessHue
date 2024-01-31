
import { Chess } from 'chess.js';


const cache = {};
let moves_tried;  // For tests

export function generateRepetition(chess) {
    const fen = chess.fen().split(' ').slice(0, 4).join(' ');
    moves_tried = 0;

    if (fen in cache) {
        return cache[fen];
    }
    const store = result => {
        cache[fen] = result;
        return result;
    }

    const first_moves = chess.moves({ verbose: true });
    if (first_moves.some(move => move.flags.includes('e'))) {
        // Repetition not possible when en passant is available.
        return store(null);
    }

    const isViable = move => {
        // A pawn move or capture.
        if (move.piece === 'p' || move.flags.includes('c')) {
            return false;
        }
        // A rook or king move when there are still castling rights.
        const castling = chess.getCastlingRights(chess.turn());
        if (castling.k && (move.piece === 'r' && move.lan[0] === 'h' || move.piece === 'k')) {
            return false;
        }
        if (castling.q && (move.piece === 'r' && move.lan[0] === 'a' || move.piece === 'k')) {
            return false;
        }
        return true;
    };
    const makeMove = move => {
        moves_tried += 1;
        return chess.move(move);
    };

    for (const move1 of first_moves) {
        if (!isViable(move1)) {
            continue;
        }
        makeMove(move1);

        for (const move2 of chess.moves({ verbose: true })) {
            if (!isViable(move2)) {
                continue;
            }
            makeMove(move2);

            try {
                const move3 = makeMove({ from: move1.to, to: move1.from });
                try {
                    const move4 = makeMove({ from: move2.to, to: move2.from });
                    if (chess.fen().split(' ').slice(0, 4).join(' ') === fen) {
                        return store([move1, move2, move3, move4].map(move => move.lan));
                    } else {
                        console.warn("generateRepetition: FEN mismatch")
                    }
                    chess.undo();
                } catch {}

                chess.undo();
            } catch {}

            chess.undo();
        }
        chess.undo();
    }
    return store(null);
}

if (import.meta.vitest) {
    test('generateRepetition', () => {
        expect(generateRepetition(new Chess())).toEqual(['b1a3', 'b8c6', 'a3b1', 'c6b8']);
        expect(moves_tried).toEqual(4);

        expect(generateRepetition(new Chess('7k/8/8/8/8/8/6r1/7K w'))).toBe(null);
        expect(moves_tried).toEqual(0);

        expect(generateRepetition(new Chess('4k3/4P3/4K3/7p/8/8/8/8 w'))).toBe(null);
        expect(moves_tried).toEqual(21);

        expect(generateRepetition(new Chess('r3k2r/3pPp2/3P1P2/8/8/3p1p2/3PpP2/R3K2R b Kq'))).toEqual(['h8h7', 'a1a2', 'h7h8', 'a2a1']);
        expect(moves_tried).toEqual(4);

        expect(generateRepetition(new Chess('r3k2r/3p1p2/3P1P2/8/8/3p1p2/3P1P2/R3K2R b KQ'))).toBe(null);
        expect(moves_tried).toEqual(19);

        expect(generateRepetition(new Chess('5k2/8/8/8/8/4n2q/8/5K2 w'))).toEqual(['f1e2', 'e3g2', 'e2f1', 'g2e3']);
        expect(moves_tried).toEqual(22);

        expect(generateRepetition(new Chess('K4k2/8/8/8/8/8/8/7b w'))).toBe(null);
        expect(moves_tried).toEqual(52);

        const chess = new Chess();
        chess.move('e4');
        // https://github.com/jhlywa/chess.js/blob/v1.0.0-beta.6/README.md#fen
        expect(chess.fen()).not.toContain('e3');
        expect(generateRepetition(chess)).toEqual(['b8c6', 'b1a3', 'c6b8', 'a3b1']);
        chess.move('e6');
        chess.move('e5');
        chess.move('d5');
        expect(chess.fen()).toContain('d6');
        expect(generateRepetition(chess)).toBe(null);
        expect(moves_tried).toEqual(0);
    });
}
