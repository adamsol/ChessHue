
import tinycolor from '../node_modules/tinycolor2/esm/tinycolor.js';

const ADVANTAGE_LIMIT = 10;
const LOSS_SCALE = 5;
const COLORS = [
    ['#23b728', 0],
    ['#d59122', 0.5],
    ['#d35338', 1],
    ['#9439b9', 2],
];


function determineRelativeAdvantage(score, color) {
    const value = score.startsWith('M') ? Infinity * Math.sign(+score.slice(1)) : +score;
    return Math.max(Math.min(value, ADVANTAGE_LIMIT), -ADVANTAGE_LIMIT) * (color === 'w' ? 1 : -1);
}

if (import.meta.vitest) {
    test('determineRelativeAdvantage', () => {
        expect(determineRelativeAdvantage('1.0', 'w')).toBe(1);
        expect(determineRelativeAdvantage('-4.75', 'b')).toBe(4.75);
        expect(determineRelativeAdvantage('150', 'b')).toBe(-10);
        expect(determineRelativeAdvantage('M1', 'w')).toBe(10);
        expect(determineRelativeAdvantage('M-3', 'w')).toBe(-10);
        expect(determineRelativeAdvantage('M-12', 'b')).toBe(10);
    });
}


function calculateLoss(prev_value, new_value) {
    const diff = prev_value - new_value;
    const divisor = Math.max(Math.abs(prev_value), Math.abs(new_value));
    return diff / Math.max(divisor, LOSS_SCALE);
}

if (import.meta.vitest) {
    test('calculateLoss', () => {
        expect(calculateLoss(1, 1)).toBe(0);
        expect(calculateLoss(1, -1)).toBe(0.4);
        expect(calculateLoss(5, -2)).toBe(1.4);
        expect(calculateLoss(3, 0)).toBe(0.6);
        expect(calculateLoss(0, -10)).toBe(1);
        expect(calculateLoss(5, 3)).toBe(0.4);
        expect(calculateLoss(8, -4)).toBe(1.5);
        expect(calculateLoss(-2, -10)).toBe(0.8);
    });
}


function blendColors(i, t) {
    return tinycolor.mix(COLORS[i][0], COLORS[i+1][0], t*100).toHexString();
}

if (import.meta.vitest) {
    test('blendColors', () => {
        for (let i = 0; i < COLORS.length - 1; ++i) {
            expect(blendColors(i, 0.0)).toBe(COLORS[i][0]);
            expect(blendColors(i, 1.0)).toBe(COLORS[i+1][0]);
        }
        expect(blendColors(0, 0.4)).toBe('#6aa826');
        expect(blendColors(2, 0.7)).toBe('#a74192');
    });
}


export function getColor(loss) {
    for (let i = 0; i < COLORS.length; ++i) {
        if (loss <= COLORS[i+1][1]) {
            const t = (loss - COLORS[i][1]) / (COLORS[i+1][1] - COLORS[i][1]);
            return blendColors(i, t, i+1);
        }
    }
}

if (import.meta.vitest) {
    test('getColor', () => {
        expect(getColor(0)).toBe(blendColors(0, 0.0));
        expect(getColor(0.8)).toBe(blendColors(1, 0.6));
        expect(getColor(2)).toBe(blendColors(2, 1.0));
    });
}


export function gradeMove(move, prev_engine_line, new_engine_line) {
    if (move.san === prev_engine_line.move.san) {
        new_engine_line = prev_engine_line;
    } else if (!new_engine_line) {
        if (move.san.endsWith('#')) {
            new_engine_line = prev_engine_line;
        } else {
            new_engine_line = { score: '0' };  // Stalemate
        }
    }
    const prev_value = determineRelativeAdvantage(prev_engine_line.score, move.color);
    const new_value = determineRelativeAdvantage(new_engine_line.score, move.color);
    return Math.max(calculateLoss(prev_value, new_value), 0);
}

if (import.meta.vitest) {
    test('gradeMove', () => {
        expect(gradeMove({ san: 'e4' }, { score: '1', move: {} }, { score: '1'})).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: '1', move: { san: 'e4' } }, { score: '-5' })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'b' }, { score: '1', move: {} }, { score: '-5' })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: '10', move: {} }, { score: '-2' })).toBe(1.2);
        expect(gradeMove({ san: 'e4', color: 'b' }, { score: 'M-1', move: {} }, { score: 'M1' })).toBe(2);
        expect(gradeMove({ san: 'e4#', color: 'b' }, { score: 'M-1', move: {} })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: 'M1', move: {} })).toBe(1);  // Stalemate
    });
}
