"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const positions_1 = require("../../../src/utils/positions");
function pos(line, character) {
    return { line, character };
}
(0, vitest_1.describe)('getOperatorAtPosition', () => {
    const code = '1 + 2\n3 <= 4\n5 && 6\n7 < 8';
    (0, vitest_1.it)('returns single-character operator at cursor', () => {
        (0, vitest_1.expect)((0, positions_1.getOperatorAtPosition)(code, pos(0, 2))).toBe('+');
    });
    (0, vitest_1.it)('returns multi-character operator when cursor is anywhere on it', () => {
        (0, vitest_1.expect)((0, positions_1.getOperatorAtPosition)(code, pos(1, 3))).toBe('<=');
        (0, vitest_1.expect)((0, positions_1.getOperatorAtPosition)(code, pos(2, 3))).toBe('&&');
    });
    (0, vitest_1.it)('returns null when no operator at position', () => {
        (0, vitest_1.expect)((0, positions_1.getOperatorAtPosition)(code, pos(0, 0))).toBeNull();
    });
});
(0, vitest_1.describe)('getWordAndContextAtPosition', () => {
    const text = 'sim.addSubpop(\"p1\", 100);\nobj.method();\nstandalone';
    (0, vitest_1.it)('returns method context when cursor is on method name', () => {
        const info = (0, positions_1.getWordAndContextAtPosition)(text, pos(0, 6), {
            instanceDefinitions: { sim: 'SLiMSim' },
            resolveClassName: (name) => (name === 'sim' ? 'SLiMSim' : null),
        });
        (0, vitest_1.expect)(info).not.toBeNull();
        (0, vitest_1.expect)(info.word).toBe('addSubpop');
        (0, vitest_1.expect)(info.context.isMethodOrProperty).toBe(true);
        (0, vitest_1.expect)(info.context.className).toBe('SLiMSim');
        (0, vitest_1.expect)(info.context.instanceName).toBe('sim');
    });
    (0, vitest_1.it)('returns instance context when cursor is on object name', () => {
        const info = (0, positions_1.getWordAndContextAtPosition)(text, pos(1, 1), {
            instanceDefinitions: { obj: 'SomeClass' },
        });
        (0, vitest_1.expect)(info).not.toBeNull();
        (0, vitest_1.expect)(info.word).toBe('obj');
        (0, vitest_1.expect)(info.context.isMethodOrProperty).toBe(false);
        (0, vitest_1.expect)(info.context.instanceClass).toBe('SomeClass');
    });
    (0, vitest_1.it)('returns plain word when not part of dot expression', () => {
        const info = (0, positions_1.getWordAndContextAtPosition)(text, pos(2, 0), {});
        (0, vitest_1.expect)(info).toBeNull();
    });
});
(0, vitest_1.describe)('getAutocompleteContextAtPosition', () => {
    const text = 'obj.\nstandalone';
    (0, vitest_1.it)('detects method/property completion context after dot', () => {
        const info = (0, positions_1.getAutocompleteContextAtPosition)(text, pos(0, 4), {
            instanceDefinitions: { obj: 'SomeClass' },
            resolveClassName: (name, defs) => defs[name] || null,
        });
        (0, vitest_1.expect)(info).not.toBeNull();
        (0, vitest_1.expect)(info.context.isMethodOrProperty).toBe(true);
        (0, vitest_1.expect)(info.context.className).toBe('SomeClass');
        (0, vitest_1.expect)(info.context.instanceName).toBe('obj');
    });
    (0, vitest_1.it)('returns identifier context when not after dot', () => {
        const info = (0, positions_1.getAutocompleteContextAtPosition)(text, pos(1, 2));
        (0, vitest_1.expect)(info).not.toBeNull();
        (0, vitest_1.expect)(info.word).toBe('st');
        (0, vitest_1.expect)(info.context.isMethodOrProperty).toBe(false);
    });
});
//# sourceMappingURL=position-utils.test.js.map