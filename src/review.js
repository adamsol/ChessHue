
import tinycolor from 'tinycolor2';

const SIGMOID_STEEPNESS = 0.4;

const COLORS = [
    ['#23b700', 0],
    ['#d59100', 0.4],
    ['#d34a29', 1],
    ['#b34aff', 2],
];
const GAMMA = 2.2;


function estimateExpectedGameResult(score) {
    const value = score.startsWith('M') ? Infinity * (score[1] === '-' ? -1 : 1) : +score;
    // https://lichess.org/page/accuracy
    return 1 / (1 + Math.exp(-value * SIGMOID_STEEPNESS));
}

if (import.meta.vitest) {
    test('estimateExpectedGameResult', () => {
        expect(estimateExpectedGameResult('0')).toBe(0.5);
        expect(estimateExpectedGameResult('-1')).toBeCloseTo(0.4);
        expect(estimateExpectedGameResult('3')).toBeCloseTo(0.77);
        expect(estimateExpectedGameResult('-10')).toBeCloseTo(0.02);
        expect(estimateExpectedGameResult('M5')).toBe(1);
        expect(estimateExpectedGameResult('M-2')).toBe(0);
    });
}


export function calculateLoss(prev_score, new_score) {
    return 2 * (estimateExpectedGameResult(prev_score) - estimateExpectedGameResult(new_score));
}

if (import.meta.vitest) {
    test('calculateLoss', () => {
        expect(calculateLoss('1', '1')).toBe(0);
        expect(calculateLoss('1', '-1')).toBeCloseTo(0.39);
        expect(calculateLoss('1.5', '0')).toBeCloseTo(0.29);
        expect(calculateLoss('5', '3')).toBeCloseTo(0.22);
        expect(calculateLoss('-2', '-10')).toBeCloseTo(0.58);
        expect(calculateLoss('10', '0')).toBeCloseTo(0.96);
        expect(calculateLoss('8', '-4')).toBeCloseTo(1.59);
        expect(calculateLoss('M1', 'M-1')).toBe(2);
    });
}


function blendColors(i, t) {
    const a = tinycolor(COLORS[i][0]).toRgb();
    const b = tinycolor(COLORS[i+1][0]).toRgb();
    for (const x of ['r', 'g', 'b']) {
        // https://blog.johnnovak.net/2016/09/21/what-every-coder-should-know-about-gamma/
        a[x] = Math.pow(Math.pow(a[x], GAMMA) * (1 - t) + Math.pow(b[x], GAMMA) * t, 1 / GAMMA);
    }
    return tinycolor(a).toHexString();
}

if (import.meta.vitest) {
    test('blendColors', () => {
        for (let i = 0; i < COLORS.length - 1; ++i) {
            expect(blendColors(i, 0.0)).toBe(COLORS[i][0]);
            expect(blendColors(i, 1.0)).toBe(COLORS[i+1][0]);
        }
        expect(blendColors(0, 0.4)).toBe('#8ea900');
        expect(blendColors(2, 0.7)).toBe('#bd4ada');
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
        expect(getColor(0.8)).toBe(blendColors(1, 2/3));
        expect(getColor(2)).toBe(blendColors(2, 1.0));
    });
}


export function gradeMove(move, prev_engine_line, new_engine_line) {
    if (move.san === prev_engine_line.move.san) {
        new_engine_line = prev_engine_line;
    }
    const loss = calculateLoss(prev_engine_line.score, new_engine_line.score);
    return Math.max(loss * (move.color === 'w' ? 1 : -1), 0);
}

if (import.meta.vitest) {
    test('gradeMove', () => {
        expect(gradeMove({ san: 'e4' }, { score: '1', move: {} }, { score: '1'})).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: '1', move: { san: 'e4' } }, { score: '-5' })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'b' }, { score: '1', move: {} }, { score: '-5' })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: '10', move: {} }, { score: '-2' })).toBeCloseTo(1.34);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: 'M1', move: {} }, { score: '10' })).toBeCloseTo(0.04);
        expect(gradeMove({ san: 'e4', color: 'b' }, { score: 'M-1', move: {} }, { score: 'M1' })).toBe(2);
        expect(gradeMove({ san: 'e4#', color: 'b' }, { score: 'M-1', move: {} }, { score: 'M-0' })).toBe(0);
        expect(gradeMove({ san: 'e4', color: 'w' }, { score: 'M1', move: {} }, { score: '0' })).toBe(1);
    });
}
