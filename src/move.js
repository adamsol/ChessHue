
export function getMoveNumberPrefix(ply_number) {
    if (ply_number % 2 === 1) {
        return `${(ply_number + 1) / 2}.`
    } else {
        return `${ply_number / 2}...`;
    }
}

if (import.meta.vitest) {
    test('getMovePrefix', () => {
        expect(getMoveNumberPrefix(1)).toBe('1.');
        expect(getMoveNumberPrefix(2)).toBe('1...');
        expect(getMoveNumberPrefix(3)).toBe('2.');
        expect(getMoveNumberPrefix(10)).toBe('5...');
    });
}
