
import { Chess } from '../node_modules/chess.js/dist/esm/chess.js';

import { classify } from './classification.js';

describe("classify", () => {
    describe("mistakes and blunders", () => {
        test("forced move", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K w').move('Kg1'), [{ score: '-' }], [{ score: '-' }])).toBe('ok');
        });
        test("mistake must be significantly worse than the best move", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K w').move('Kg1'), [{ score: '0', move: 'Kh2' }, { score: '-' }], [{ score: '-2' }])).toBe('mistake');
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K w').move('Kg1'), [{ score: '0', move: 'Kh2' }, { score: '-' }], [{ score: '-1' }])).toBe('ok');
        });
        test("an obvious loss of material is a blunder", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/7n/7K b').move('Kg7'), [{ score: '0', move: 'Ng4' }, { score: '-' }], [{ score: '2' }])).toBe('blunder');
            expect(classify(new Chess('7k/8/8/8/8/8/7n/7K b').move('Nf3'), [{ score: '0', move: 'Ng4' }, { score: '-' }], [{ score: '2' }])).toBe('mistake');
        });
        test("two rooks for a queen is not considered loss of material", () => {
            expect(classify(new Chess('5q1k/8/8/8/8/8/6R1/6QK w').move('Rg8+'), [{ score: '0', move: 'Rg3' }, { score: '-' }], [{ score: '-2' }])).toBe('blunder');
            expect(classify(new Chess('5q1k/8/8/8/8/8/6R1/6RK w').move('Rg8+'), [{ score: '0', move: 'Rg3' }, { score: '-' }], [{ score: '-2' }])).toBe('mistake');
        });
    });
    describe("great moves", () => {
        test("it must be the best move in a given position", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K b').move('Kg8'), [{ score: '0', move: 'Kg8' }, { score: '2', move: 'Kh7' }], [{ score: '0' }])).toBe('great');
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K b').move('Kh7'), [{ score: '0', move: 'Kg8' }, { score: '2', move: 'Kh7' }], [{ score: '2' }])).toBe('mistake');
        });
        test("the second move must be significantly worse", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K b').move('Kg8'), [{ score: '0', move: 'Kg8' }, { score: '2', move: 'Kh7' }], [{ score: '-' }])).toBe('great');
            expect(classify(new Chess('7k/8/8/8/8/8/8/7K b').move('Kg8'), [{ score: '1', move: 'Kg8' }, { score: '2', move: 'Kh7' }], [{ score: '-' }])).toBe('ok');
        });
        test("the second move should not be a blunder", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/8/1B5K w').move('Kg1'), [{ score: '0', move: 'Kg1' }, { score: '-2', move: 'Kh2' }], [{ score: '-' }])).toBe('great');
            expect(classify(new Chess('7k/8/8/8/8/8/8/1B5K w').move('Kg1'), [{ score: '0', move: 'Kg1' }, { score: '-2', move: 'Bh7' }], [{ score: '-' }])).toBe('ok');
        });
        test("fork that leads to winning material may be a great move even if it's the only way not to lose material", () => {
            expect(classify(new Chess('7k/8/8/5n2/8/8/8/5R1K b').move('Ng3+'), [{ score: '0', move: 'Ng3+' }, { score: '2', move: 'Kg8' }], [])).toBe('great');
            expect(classify(new Chess('7k/8/8/5n2/8/6B1/8/5R1K b').move('Nxg3+'), [{ score: '0', move: 'Nxg3+' }, { score: '2', move: 'Kg8' }], [])).toBe('ok');
        });
        test("capture may be a great move unless it's an obvious one", () => {
            expect(classify(new Chess('7k/8/8/2r2r2/3P2P1/8/8/7K w').move('dxc5'), [{ score: '0', move: 'dxc5' }, { score: '-2', move: 'gxf5' }], [{ score: '-' }])).toBe('great');
            expect(classify(new Chess('7k/8/8/2r2n2/3P2P1/8/8/7K w').move('dxc5'), [{ score: '0', move: 'dxc5' }, { score: '-2', move: 'gxf5' }], [{ score: '-' }])).toBe('ok');
        });
        test("underpromotion may be a great move even if it's the only way to gain material", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/3p4/7K b').move('d1=R+'), [{ score: '0', move: 'd1=R+' }, { score: '2', move: 'Kh7' }], [])).toBe('great');
            expect(classify(new Chess('7k/8/8/8/8/8/3p4/7K b').move('d1=Q+'), [{ score: '0', move: 'd1=Q+' }, { score: '2', move: 'Kh7' }], [])).toBe('ok');
        });
        test("sudden checkmate may also be a great move", () => {
            expect(classify(new Chess('7k/8/8/8/8/8/6R1/6RK w').move('Rh2#'), [{ score: 'M1', move: 'Rh2#' }, { score: 'M-1', move: 'Kh2' }], [])).toBe('great');
            expect(classify(new Chess('7k/8/8/8/8/8/6R1/6RK w').move('Rh2#'), [{ score: 'M1', move: 'Rh2#' }, { score: '10', move: 'Kh2' }], [])).toBe('ok');
        });
    });
    describe("brilliant moves", () => {
        test("it must be a sacrifice of material", () => {
            expect(classify(new Chess('7k/6n1/8/8/4P3/8/8/7K b').move('Nf5'), [{ score: '0', move: 'Nf5' }, { score: '2', move: 'Ne6' }], [{ score: '-' }])).toBe('brilliant');
            expect(classify(new Chess('b6k/6n1/8/8/4P3/8/8/7K b').move('Nf5'), [{ score: '0', move: 'Nf5' }, { score: '2', move: 'Ne6' }], [{ score: '-' }])).toBe('great');
        });
        test("two minor pieces for a rook is not considered a sacrifice", () => {
            expect(classify(new Chess('6rk/6p1/4N3/8/8/8/8/Q6K w').move('Nxg7'), [{ score: '0', move: 'Nxg7' }, { score: '-2', move: 'Kh2' }], [{ score: '-' }])).toBe('brilliant');
            expect(classify(new Chess('6rk/6p1/4N3/8/8/8/8/B6K w').move('Nxg7'), [{ score: '0', move: 'Nxg7' }, { score: '-2', move: 'Kh2' }], [{ score: '-' }])).toBe('great');
        });
        test("the sacrificed piece must not have been trapped", () => {
            expect(classify(new Chess('6Nk/8/8/8/8/8/8/7K w').move('Kg1'), [{ score: '0', move: 'Kg1' }, { score: '-2', move: 'Ne7' }], [{ score: '-' }])).toBe('brilliant');
            expect(classify(new Chess('6Nk/8/8/8/8/8/8/7K w').move('Kg1'), [{ score: '0', move: 'Kg1' }, { score: '-2', move: 'Kh2' }], [{ score: '-' }])).toBe('great');
        });
        test("the second move may also be a loss of material but of lower value", () => {
            expect(classify(new Chess('7k/8/8/8/6n1/5K2/4r3/8 b').move('Nf6'), [{ score: '0', move: 'Nf6' }, { score: '2', move: 'Re1' }], [{ score: '-' }])).toBe('brilliant');
            expect(classify(new Chess('7k/8/8/8/6n1/5K2/4r3/8 b').move('Nf6'), [{ score: '0', move: 'Nf6' }, { score: '2', move: 'Nh6' }], [{ score: '-' }])).toBe('great');
        });
        test("underpromotion may be considered a sacrifice", () => {
            expect(classify(new Chess('8/4P2k/8/8/8/8/8/7K w').move('e8=B'), [{ score: '0', move: 'e8=B' }, { score: '-2', move: 'e8=R' }], [{ score: '-' }])).toBe('brilliant');
            expect(classify(new Chess('8/4P2k/8/8/8/8/8/7K w').move('e8=B'), [{ score: '0', move: 'e8=B' }, { score: '-2', move: 'e8=N' }], [{ score: '-' }])).toBe('great');
        });
    });
    describe("real games", () => {
        describe("mistakes and blunders", () => {
            test("equal trade is not a blunder even if it makes the position much worse", () => {
                expect(classify(new Chess('r1bq1rk1/pp1pnppp/8/3pP1N1/3Bn2P/3B4/P4PP1/R2Q1K1R b - - 4 17').move('Nxg5'), [{ score: '-1', move: 'd6' }, { score: '-' }], [{ score: '5' }])).toBe('mistake');
            });
            test("move that allows a winning sacrifice is not a blunder", () => {
                expect(classify(new Chess('2kr3r/ppp3bp/2n5/3q1b2/3p1P2/6NP/PPPBPQP1/2KR1B1R w - - 3 17').move('Kb1'), [{ score: '0', move: 'Qf3' }, { score: '-' }], [{ score: '-7' }])).toBe('mistake');
            });
            test("leaving a hanging piece may be a blunder even if it cannot be taken immediately due to checkmate threat", () => {
                expect(classify(new Chess('rn2k2r/pp2ppbp/2p1b1p1/3PP3/8/qP2BQ2/P1P2PPP/1K1R1BNR b kq - 0 14').move('Bxe5'), [{ score: '0', move: 'cxd5' }, { score: '-' }], [{ score: '7' }])).toBe('blunder');
            });
            test("rook defending a piece gets pinned to the king", () => {
                // FIXME
                expect(classify(new Chess('4r3/pp1R2k1/4rpp1/2P5/1P2n2R/7P/P5P1/6K1 b - - 6 31').move('R6e7'), [{ score: '-5', move: 'R8e7' }, { score: '-' }], [{ score: '1' }])).toBe('blunder');
            });
        });
        describe("ordinary moves", () => {
            test("the only way to get out of check without an obvious loss of material", () => {
                expect(classify(new Chess('r1bqkb1r/p1p2ppp/2Q2n2/4p3/8/7P/PPPP1PP1/RNB1K1NR b KQkq - 0 7').move('Bd7'), [{ score: '0', move: 'Bd7' }, { score: '5', move: 'Qd7' }], [])).toBe('ok');
            });
            test("the only way to save both hanging pieces", () => {
                expect(classify(new Chess('rn1qkb1r/ppp2pp1/4pn1p/6N1/2B1P1b1/2N5/PPPP2PP/R1BQK2R w KQkq - 1 8').move('Nf3'), [{ score: '0', move: 'Nf3' }, { score: '-4', move: 'Nxf7' }], [])).toBe('ok');
            });
            test("the only recapture that doesn't lose more material", () => {
                expect(classify(new Chess('r1bqk2r/pp1pnppp/5n2/3pP3/8/2bB1N2/P2B1PPP/R2QK2R w KQkq - 0 12').move('Bxc3'), [{ score: '0', move: 'Bxc3' }, { score: '-3', move: 'exf6' }], [])).toBe('ok');
            });
        });
        describe("great moves", () => {
            test("the only winning move while in check", () => {
                expect(classify(new Chess('r1bq1r1k/pp1p4/6Q1/3pP1P1/3n4/8/P3KPP1/R7 w - - 0 25').move('Kd3'), [{ score: 'M4', move: 'Kd3' }, { score: '-10', move: 'Ke3' }], [])).toBe('great');
            });
            test("winning material with a counter-check", () => {
                expect(classify(new Chess('r3k2r/2p1qpp1/p1Qbbn1p/8/3P4/2P2N2/PP3PPP/RNB1K2R b KQkq - 0 11').move('Bd7+'), [{ score: '-10', move: 'Bd7+' }, { score: '8', move: 'Qd7' }], [])).toBe('great');
            });
            test("giving a check before recapturing a piece", () => {
                expect(classify(new Chess('1r4k1/p1p4p/2bN4/4ppp1/8/P2P3K/1PP2Pr1/RNB2R2 b - - 0 23').move('g4+'), [{ score: '-5', move: 'g4+' }, { score: '-3', move: 'cxd6' }], [])).toBe('great');
            });
            test("silent move to defend the position", () => {
                expect(classify(new Chess('1r1q1rk1/p1p2ppp/2bb4/4p3/5n2/P2P1N1P/1PPQ1PP1/RNB2RK1 w - - 7 14').move('Qd1'), [{ score: '-1', move: 'Qd1' }, { score: '-4', move: 'Qe3' }], [])).toBe('great');
            });
            test("capture of the attacking piece to defend the position", () => {
                expect(classify(new Chess('r4r2/pp2bqpk/2pN3p/4Bb2/8/6Q1/PPP2PPP/3R1RK1 b - - 6 20').move('Bxd6'), [{ score: '1', move: 'Bxd6' }, { score: '3', move: 'Qg6' }], [])).toBe('great');
            });
            test("exchanging queens as the only winning move", () => {
                expect(classify(new Chess('r2qk2r/ppp2pp1/2n3b1/2b4n/4p2p/P3PN1P/1PP1BPP1/R1BQ1RKN w kq - 0 13').move('Qxd8+'), [{ score: '2', move: 'Qxd8+' }, { score: '-2', move: 'Nd2' }], [])).toBe('great');
            });
            test("promotion to a knight with check to win material", () => {
                expect(classify(new Chess('1r3r2/4P1bk/p4ppn/4p2p/2B1P3/6BP/5PP1/2RqR1K1 w - - 1 26').move('exf8=N+'), [{ score: '7', move: 'exf8=N+' }, { score: '4', move: 'Rexd1' }], [])).toBe('great');
            });
        });
        describe("brilliant moves", () => {
            test("sacrifice for a strong attack", () => {
                expect(classify(new Chess('5rk1/p1p3pp/2p3r1/3p3q/2nPpB2/P1P4P/2P2PPK/R1Q2R2 b - - 3 22').move('Rxg2+'), [{ score: '-4.5', move: 'Rxg2+' }, { score: '-3', move: 'Rgf6' }], [])).toBe('brilliant');
            });
            test("sacrifice while opponent's piece is hanging", () => {
                expect(classify(new Chess('r1bq4/5kpp/3b1n2/8/3nN3/8/PP1P1PPP/R1BQ1RK1 b - - 0 16').move('Bxh2+'), [{ score: '-7', move: 'Bxh2+' }, { score: '-4', move: 'Nxe4' }], [])).toBe('brilliant');
            });
            test("attacking piece cannot be taken because of checkmate threat", () => {
                expect(classify(new Chess('r1b2k1r/pp2q1bp/3p1np1/6N1/2Q1P3/B1P5/5PPP/RN2K2R w KQ - 2 16').move('Bxd6'), [{ score: '20', move: 'Bxd6' }, { score: '3', move: 'O-O' }], [])).toBe('brilliant');
            });
            test("queen left undefended for checkmate threat", () => {
                expect(classify(new Chess('1kr4r/pp1Qqp2/7p/1N4p1/1n2P3/5P2/PPP3PP/2KR1B1R b - - 0 18').move('Rhd8'), [{ score: '0', move: 'Rhd8' }, { score: '7', move: 'Qxd7' }], [])).toBe('brilliant');
            });
        });
        describe("questionable cases", () => {
            test("sacrifice is not brilliant if the second move would also be a sacrifice", () => {
                expect(classify(new Chess('r2qk2r/1p1n1pbp/p2Ppnp1/6N1/5B2/2N5/P4PPP/R2QR1K1 w kq - 2 17').move('Nxe6'), [{ score: '7', move: 'Nxe6' }, { score: '6', move: 'Rxe6+' }], [])).toBe('ok');
            });
            test("sacrifice is not brilliant if the second move also leads to checkmate but repeats the position", () => {
                // TODO: generate a repetition of the position to fool the engine
                expect(classify(new Chess('r1bq1r1k/pp1p4/2n3Q1/3pP1P1/3B4/8/P4PP1/R4K2 w - - 1 24').move('Ke2'), [{ score: 'M5', move: 'Ke2' }, { score: 'M7', move: 'Qh6+' }], [])).toBe('ok');
            });
            test("winning move is not great if the second move involves hanging a piece for perpetual check", () => {
                expect(classify(new Chess('1r4k1/p1p3pp/2bb1r2/4pp2/2N5/P2P4/1PP2P2/RNB2RK1 b - - 3 20').move('Rg6+'), [{ score: '-5', move: 'Rg6+' }, { score: '0', move: 'Rxb2' }], [])).toBe('ok');
            });
            test("an obvious recapture of a pawn threatening to capture a piece is considered a great move", () => {
                expect(classify(new Chess('rnbqkbnr/ppp2ppp/8/4p3/4p3/3B3P/PPPP1PP1/RNBQK1NR w KQkq - 0 4').move('Bxe4'), [{ score: '-1', move: 'Bxe4' }, { score: '-2.5', move: 'Bc4' }], [])).toBe('great');
            });
            test("the only way to get out of check that doesn't lead to quick checkmate is considered a great move", () => {
                expect(classify(new Chess('1k6/pp3p2/7p/6p1/1n2P3/P1N1qP2/1PP3PP/2K2B1R w - - 1 23').move('Kd1'), [{ score: '-4', move: 'Kd1' }, { score: 'M-2', move: 'Kb1' }], [])).toBe('great');
            });
            test("hanging checkmate is not a blunder", () => {
                expect(classify(new Chess('r1b1k2r/ppp2pp1/3p4/4q2p/2P3n1/2N1P2P/PP2BPP1/R2Q1RK1 w kq - 3 13').move('Nd5'), [{ score: '-2', move: 'Bxg4' }, { score: '-' }], [{ score: 'M-1' }])).toBe('mistake');
            });
        });
        describe("complex positions", () => {
            test("lots of potential captures but not a sacrifice", () => {
                expect(classify(new Chess('2kr3r/ppp2pp1/2n4p/2bP4/3Nq1n1/P7/1P2BPPP/R1BQR1K1 b - - 1 15').move('Nxf2'), [{ score: '-6', move: 'Nxf2' }, { score: '-1', move: 'Nce5' }], [])).toBe('great');
            });
            test("lots of potential captures but not a blunder", () => {
                expect(classify(new Chess('r3k2r/ppq2pp1/5n2/4b2p/6b1/2N5/PPPBBPPP/R2Q1RK1 w kq - 0 13').move('f4'), [{ score: '1', move: 'h3' }, { score: '-' }], [{ score: '-0.5' }])).toBe('mistake');
            });
            test("lots of potential captures and promotions", () => {
                expect(classify(new Chess('rn1q1rk1/pp2Ppbp/6p1/5b2/2B2Q2/2NR4/PPP2PPP/2K3NR b - - 0 12').move('Qxe7'), [{ score: '0', move: 'Qxe7' }, { score: '8', move: 'Qc8' }], [])).toBe('ok');
            });
        });
    });
});
