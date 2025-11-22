"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const text_processing_1 = require("../../../src/utils/text-processing");
(0, vitest_1.describe)('type cleaning helpers', () => {
    (0, vitest_1.it)('expands type abbreviations', () => {
        (0, vitest_1.expect)((0, text_processing_1.expandTypeAbbreviations)('Ni Nl Ns Nf Nif Nis is')).toBe('integer logical string float integer or float integer or string integer or string');
    });
    (0, vitest_1.it)('removes singleton $ suffix and expands types', () => {
        (0, vitest_1.expect)((0, text_processing_1.cleanTypeNames)('integer$ object<DataFrame>$ Ni')).toBe('integer object<DataFrame> integer');
    });
    (0, vitest_1.it)('cleans signatures and collapses object<Clazz>', () => {
        (0, vitest_1.expect)((0, text_processing_1.cleanSignature)('object<DataFrame>$ -> Ni')).toBe('<DataFrame> -> integer');
    });
});
(0, vitest_1.describe)('cleanDocumentationText', () => {
    (0, vitest_1.it)('decodes HTML entities and cleans types', () => {
        const input = 'E.g. &lt;tag&gt; &amp; integer$ Ni';
        const output = (0, text_processing_1.cleanDocumentationText)(input);
        (0, vitest_1.expect)(output).toContain('<tag> & integer integer');
    });
    (0, vitest_1.it)('strips span and formats basic tags', () => {
        const input = '<span><b>bold</b> <i>italics</i></span>';
        const output = (0, text_processing_1.cleanDocumentationText)(input);
        (0, vitest_1.expect)(output).toBe('**bold** *italics*');
    });
});
(0, vitest_1.describe)('StringCommentStateMachine and helpers', () => {
    (0, vitest_1.it)('tracks string state correctly', () => {
        const code = '"a\\"b" // comment';
        let lastStateInString = false;
        (0, text_processing_1.parseCodeWithStringsAndComments)(code, {}, (_char, state) => {
            lastStateInString = state.inString;
        });
        (0, vitest_1.expect)(lastStateInString).toBe(false);
    });
    (0, vitest_1.it)('detects escaped quotes', () => {
        const text = '\\""';
        // position 1 is the quote after a backslash => escaped
        // position 2 is an unescaped quote
        (0, vitest_1.expect)((0, text_processing_1.removeStringsFromLine)(text)).toMatch(/__STR0__/);
    });
});
(0, vitest_1.describe)('brace and parenthesis counting', () => {
    (0, vitest_1.it)('ignores braces inside strings and comments', () => {
        const line = '"{" // }';
        const counts = (0, text_processing_1.countBracesIgnoringStringsAndComments)(line);
        (0, vitest_1.expect)(counts.openCount).toBe(0);
        (0, vitest_1.expect)(counts.closeCount).toBe(0);
    });
    (0, vitest_1.it)('counts parentheses outside of strings/comments', () => {
        const code = '("(") // )';
        const counts = (0, text_processing_1.countParenthesesIgnoringStringsAndComments)(code);
        (0, vitest_1.expect)(counts.openCount).toBe(1);
        (0, vitest_1.expect)(counts.closeCount).toBe(1);
    });
});
(0, vitest_1.describe)('removeStringsFromLine', () => {
    (0, vitest_1.it)('replaces strings with stable placeholders', () => {
        const line = 'x = "a" + "b"';
        const result = (0, text_processing_1.removeStringsFromLine)(line);
        (0, vitest_1.expect)(result).toBe('x = __STR0__ + __STR1__');
    });
});
//# sourceMappingURL=text-processing.test.js.map