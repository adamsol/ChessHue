
import { Chess } from 'chess.js';

export const PIECE_VALUES = { Q: 9, R: 5, B: 3, N: 3, P: 1 };


export function calculateMaterialDifference(chess) {
    const piece_counts = Object.fromEntries(Object.keys(PIECE_VALUES).map(type => [type, 0]));

    for (const file of 'abcdefgh') {
        for (const rank of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const piece = chess.get(file + rank);
            const type = piece?.type?.toUpperCase();
            if (type in piece_counts) {
                piece_counts[type] += piece.color === 'w' ? 1 : -1;
            }
        }
    }
    const result = {
        white: {},
        black: {},
        value: 0,
    };
    for (const [type, count] of Object.entries(piece_counts)) {
        if (count > 0) {
            result.white[type] = count
        } else if (count < 0) {
            result.black[type] = -count;
        }
        result.value += count * PIECE_VALUES[type];
    }
    return result;
}

if (import.meta.vitest) {
    test('getMaterialDifference', () => {
        expect(calculateMaterialDifference(new Chess())).toEqual({ white: {}, black: {}, value: 0 });
        expect(calculateMaterialDifference(new Chess('rn3rk1/pp2Ppbp/6p1/5b2/2B5/2NR4/PPP2PPP/2K3NR w'))).toEqual({ white: { N: 1, P: 2 }, black: { B: 1 }, value: 2 });
        expect(calculateMaterialDifference(new Chess('rnbqkbnr/pppppppp/8/8/8/8/8/4K3 w'))).toEqual({ white: {}, black: { Q: 1, R: 2, B: 2, N: 2, P: 8 }, value: -39 });
        expect(calculateMaterialDifference(new Chess('rnqRBBNQ/bNRNPpbR/QNnkPnBN/nBbnrPrP/NPbPnbQp/QBrRRQpN/PpbrBNKP/rRnBBrnB b'))).toEqual({ white: { Q: 4, B: 3, P: 4 }, black: { R: 1 }, value: 44 });
    });
}
