
import { Chess } from '../node_modules/chess.js/dist/esm/chess.js';
import sortBy from '../node_modules/lodash-es/sortBy.js';

// As far as material sacrifices are concerned, pawns are not considered to be meaningful.
const PIECE_VALUES = { n: 3, b: 3, r: 5, q: 9 };
// Two rooks for a queen or two minor pieces for a rook are not considered a substantial material difference.
const IRRELEVANT_MATERIAL_DIFFERENCE_THRESHOLD = 1;

const ADVANTAGE_LIMIT = 20;
const LOSS_RATIO_SCALE = 15;
const MISTAKE_THRESHOLD = 1.5;

export const BRILLIANT = 'brilliant';
export const GREAT = 'great';
export const OK = 'ok';
export const MISTAKE = 'mistake';
export const BLUNDER = 'blunder';

// Icons made with Inkscape, SVG formatted manually.
export const ANNOTATION_SVGS = {
    [BRILLIANT]: `
        <g class="annotation">
            <circle fill="var(--brilliant)" cx="50" cy="50" r="50" />
            <path fill="#ffffff" transform="translate(-13.736442)" d="m 58.651168,17.699996 -1.946615,44.85679 H 42.908974 L 40.962359,17.699996 Z M 58.354944,80.71109 H 41.258583 V 69.53921 h 17.096361 z" />
            <path fill="#ffffff" transform="translate(13.736442)" d="m 58.651168,17.699996 -1.946615,44.85679 H 42.908974 L 40.962359,17.699996 Z M 58.354944,80.71109 H 41.258583 V 69.53921 h 17.096361 z" />
        </g>
    `,
    [GREAT]: `
        <g class="annotation">
            <circle fill="var(--great)" cx="50" cy="50" r="50" />
            <path fill="#ffffff" d="m 58.651168,17.699996 -1.946615,44.85679 H 42.908974 L 40.962359,17.699996 Z M 58.354944,80.71109 H 41.258583 V 69.53921 h 17.096361 z" />
        </g>
    `,
    [MISTAKE]: `
        <g class="annotation">
            <circle fill="var(--mistake)" cx="50" cy="50" r="50" />
            <path fill="#ffffff" d="m 74.773361,34.373256 q 0,4.27409 -1.269532,7.574873 -1.227214,3.258465 -3.512371,5.670575 -2.285157,2.412111 -5.501304,4.316408 -3.17383,1.904298 -7.194014,3.470054 v 9.648441 H 42.400301 V 50.792534 q 3.004558,-0.804037 5.416669,-1.650392 2.454428,-0.846354 5.120444,-2.750652 2.496746,-1.692709 3.893231,-3.935548 1.438803,-2.24284 1.438803,-5.078127 0,-4.231773 -2.750652,-6.009117 -2.708335,-1.819663 -7.659509,-1.819663 -3.046876,0 -6.897789,1.31185 -3.808595,1.311849 -6.982425,3.385418 H 32.286364 V 21.339397 q 2.708335,-1.142579 8.336592,-2.369793 5.628258,-1.269532 11.425786,-1.269532 10.452478,0 16.588549,4.612632 6.13607,4.612632 6.13607,12.060552 z M 58.481036,81.980698 H 41.384675 v -11.17188 h 17.096361 z" />
        </g>
    `,
    [BLUNDER]: `
        <g class="annotation">
            <circle fill="var(--blunder)" cx="50" cy="50" r="50" />
            <path fill="#ffffff" transform="translate(-20.947792)" d="m 74.773361,34.373256 q 0,4.27409 -1.269532,7.574873 -1.227214,3.258465 -3.512371,5.670575 -2.285157,2.412111 -5.501304,4.316408 -3.17383,1.904298 -7.194014,3.470054 v 9.648441 H 42.400301 V 50.792534 q 3.004558,-0.804037 5.416669,-1.650392 2.454428,-0.846354 5.120444,-2.750652 2.496746,-1.692709 3.893231,-3.935548 1.438803,-2.24284 1.438803,-5.078127 0,-4.231773 -2.750652,-6.009117 -2.708335,-1.819663 -7.659509,-1.819663 -3.046876,0 -6.897789,1.31185 -3.808595,1.311849 -6.982425,3.385418 H 32.286364 V 21.339397 q 2.708335,-1.142579 8.336592,-2.369793 5.628258,-1.269532 11.425786,-1.269532 10.452478,0 16.588549,4.612632 6.13607,4.612632 6.13607,12.060552 z M 58.481036,81.980698 H 41.384675 v -11.17188 h 17.096361 z" />
            <path fill="#ffffff" transform="translate(17.867587)" d="m 74.773361,34.373256 q 0,4.27409 -1.269532,7.574873 -1.227214,3.258465 -3.512371,5.670575 -2.285157,2.412111 -5.501304,4.316408 -3.17383,1.904298 -7.194014,3.470054 v 9.648441 H 42.400301 V 50.792534 q 3.004558,-0.804037 5.416669,-1.650392 2.454428,-0.846354 5.120444,-2.750652 2.496746,-1.692709 3.893231,-3.935548 1.438803,-2.24284 1.438803,-5.078127 0,-4.231773 -2.750652,-6.009117 -2.708335,-1.819663 -7.659509,-1.819663 -3.046876,0 -6.897789,1.31185 -3.808595,1.311849 -6.982425,3.385418 H 32.286364 V 21.339397 q 2.708335,-1.142579 8.336592,-2.369793 5.628258,-1.269532 11.425786,-1.269532 10.452478,0 16.588549,4.612632 6.13607,4.612632 6.13607,12.060552 z M 58.481036,81.980698 H 41.384675 v -11.17188 h 17.096361 z" />
        </g>
    `,
};
export const ANNOTATION_SYMBOLS = {
    [BRILLIANT]: '!!',
    [GREAT]: '!',
    [MISTAKE]: '?',
    [BLUNDER]: '??',
};


function determineRelativeAdvantage(score, color) {
    const value = score.startsWith('M') ? Infinity * Math.sign(+score.slice(1)) : +score;
    return Math.max(Math.min(value, ADVANTAGE_LIMIT), -ADVANTAGE_LIMIT) * (color === 'w' ? 1 : -1);
}

if (import.meta.vitest) {
    test("determineRelativeAdvantage", () => {
        expect(determineRelativeAdvantage('1.0', 'w')).toBe(1);
        expect(determineRelativeAdvantage('-4.75', 'b')).toBe(4.75);
        expect(determineRelativeAdvantage('150', 'b')).toBe(-20);
        expect(determineRelativeAdvantage('M1', 'w')).toBe(20);
        expect(determineRelativeAdvantage('M-3', 'w')).toBe(-20);
        expect(determineRelativeAdvantage('M-12', 'b')).toBe(20);
    });
}


function calculateLoss(prev_value, new_value) {
    const diff = prev_value - new_value;
    let ratio = Infinity;
    if (Math.sign(prev_value) === Math.sign(new_value)) {
        ratio = diff / prev_value / new_value * LOSS_RATIO_SCALE;
    }
    return Math.min(diff, ratio);
}

if (import.meta.vitest) {
    test("calculateLoss", () => {
        expect(calculateLoss(1, 1)).toBe(0);
        expect(calculateLoss(3, -2)).toBe(5);
        expect(calculateLoss(0, -10)).toBe(10);
        expect(calculateLoss(5, 3)).toBe(2);
        expect(calculateLoss(8, 4)).toBe(1.875);
        expect(calculateLoss(-5, -10)).toBe(1.5);
    });
}


function countWonMaterial(move) {
    return (PIECE_VALUES[move.captured] ?? 0) + (PIECE_VALUES[move.promotion] ?? 0);
}

if (import.meta.vitest) {
    test("countWonMaterial", () => {
        expect(countWonMaterial(new Chess('7k/8/8/8/8/8/8/7K w').move('Kh2'))).toBe(0);
        expect(countWonMaterial(new Chess('7k/8/8/8/8/8/5p2/6RK b').move('fxg1=B'))).toBe(8);
    });
}


function evaluateWinnableMaterial(chess, consider_all_moves = false, alpha = -Infinity, beta = Infinity) {
    const key = [chess.fen(), consider_all_moves].join();
    if (key in evaluateWinnableMaterial.cache) {
        return evaluateWinnableMaterial.cache[key];
    }
    const moves = chess.moves({ verbose: true }).filter(move => consider_all_moves || PIECE_VALUES[move.captured] || move.promotion);
    const ordered_moves = sortBy(moves, move => (PIECE_VALUES[move.piece] ?? 0) - countWonMaterial(move));

    let value = -Infinity;
    for (const move of ordered_moves) {
        value = Math.max(value, countWonMaterial(move) - evaluateWinnableMaterial(new Chess(move.after), false, -beta, -alpha));
        alpha = Math.max(alpha, value);
        if (alpha >= beta) {
            break;
        }
    }
    if (!consider_all_moves) {
        value = Math.max(value, 0);
    }
    evaluateWinnableMaterial.cache[key] = value;
    return value;
}
evaluateWinnableMaterial.cache = {};

if (import.meta.vitest) {
    test("evaluateWinnableMaterial", () => {
        expect(evaluateWinnableMaterial(new Chess('7k/8/7r/8/8/8/7R/7K w'))).toBe(5);
        expect(evaluateWinnableMaterial(new Chess('7k/1B6/8/3R4/5n2/8/8/7K b'))).toBe(2);
        expect(evaluateWinnableMaterial(new Chess('7k/8/1q6/1nB5/2B5/Q7/8/7K w'))).toBe(0);
        expect(evaluateWinnableMaterial(new Chess('7k/4P3/8/8/8/8/8/7K w'))).toBe(9);
        expect(evaluateWinnableMaterial(new Chess('7k/8/8/8/8/8/3p4/2R1N2K b'))).toBe(14);
        expect(evaluateWinnableMaterial(new Chess('7k/7r/4n3/8/8/7B/7Q/7K w'))).toBe(0);
        expect(evaluateWinnableMaterial(new Chess('7k/2n5/8/p7/1b3R2/6B1/8/7K w'))).toBe(1);
        expect(evaluateWinnableMaterial(new Chess('4n2k/8/8/7Q/8/8/8/7K b'), true)).toBe(-3);
    });
}


function evaluateMaterialChange(move) {
    const chess = new Chess(move.after);
    return countWonMaterial(move) - evaluateWinnableMaterial(chess, chess.isCheck());
}

if (import.meta.vitest) {
    test("evaluateMaterialChange", () => {
        expect(evaluateMaterialChange(new Chess('7k/7r/8/8/8/8/7B/7K b').move('Rxh2+'))).toBe(-2);
        expect(evaluateMaterialChange(new Chess('8/2k3q1/8/6B1/6R1/8/8/7K w').move('Bd8+'))).toBe(6);
        expect(evaluateMaterialChange(new Chess('7k/5q2/4P3/8/8/8/2p5/3R2BK b').move('cxd1=R'))).toBe(1);
    });
}


function isSubstantialMaterialLoss(material_change, other_move_material_change) {
    return material_change < other_move_material_change - IRRELEVANT_MATERIAL_DIFFERENCE_THRESHOLD;
}

if (import.meta.vitest) {
    test("isSubstantialMaterialLoss", () => {
        expect(isSubstantialMaterialLoss(9, 10)).toBe(false);
        expect(isSubstantialMaterialLoss(-5, -3)).toBe(true);
    });
}


function isUnderpromotion(move) {
    return PIECE_VALUES[move.promotion] < PIECE_VALUES.q;
}

if (import.meta.vitest) {
    test("isUnderpromotion", () => {
        expect(isUnderpromotion(new Chess('7k/5P2/8/8/8/8/8/7K w').move('f8=R+'))).toBe(true);
        expect(isUnderpromotion(new Chess('7k/5P2/8/8/8/8/8/7K w').move('f8=Q+'))).toBe(false);
        expect(isUnderpromotion(new Chess('7k/8/8/8/8/4p3/8/7K b').move('e2'))).toBe(false);
    });
}


export function classify(move, prev_engine_lines, new_engine_lines) {
    if (prev_engine_lines.length === 1) {
        return OK;
    }
    if (new_engine_lines.length === 0) {
        new_engine_lines = prev_engine_lines;
    }
    const [
        prev_best_value,
        prev_second_value,
        new_value,
    ] = [
        prev_engine_lines[0],
        prev_engine_lines[1],
        new_engine_lines[0],
    ].map(({ score }) => determineRelativeAdvantage(score, move.color));

    if (move.san === prev_engine_lines[0].move) {
        if (calculateLoss(prev_best_value, prev_second_value) >= MISTAKE_THRESHOLD) {
            const material_change = evaluateMaterialChange(move);
            const second_move_material_change = evaluateMaterialChange(new Chess(move.before).move(prev_engine_lines[1].move));

            // Are we sacrificing material that we didn't have to?
            if (isSubstantialMaterialLoss(material_change, second_move_material_change)) {
                return BRILLIANT;
            }
            // Wouldn't the second move be an obvious waste of material?
            if (!isSubstantialMaterialLoss(second_move_material_change, material_change)) {
                return GREAT;
            }
            // Or does this move win material in a tricky way?
            if (material_change > IRRELEVANT_MATERIAL_DIFFERENCE_THRESHOLD && (countWonMaterial(move) === 0 || isUnderpromotion(move))) {
                return GREAT;
            }
        }
    } else {
        if (calculateLoss(prev_best_value, new_value) >= MISTAKE_THRESHOLD) {
            const material_change = evaluateMaterialChange(move);
            const best_move_material_change = evaluateMaterialChange(new Chess(move.before).move(prev_engine_lines[0].move));

            if (isSubstantialMaterialLoss(material_change, best_move_material_change)) {
                return BLUNDER;
            }
            return MISTAKE;
        }
    }
    return OK;
}
