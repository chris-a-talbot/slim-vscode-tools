"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_languageserver_1 = require("vscode-languageserver");
const validation_framework_1 = require("../../../src/validation/validation-framework");
(0, vitest_1.describe)('validation framework', () => {
    (0, vitest_1.it)('validatePattern produces diagnostics for matching identifiers', () => {
        const line = 'foo(bar); baz(qux);';
        const pattern = /(\w+)\(/g;
        const diagnostics = (0, validation_framework_1.validatePattern)(line, 3, {
            pattern,
            extractIdentifier: (m) => m[1],
            shouldValidate: (id) => id === 'baz',
            createDiagnostic: (id, ctx) => (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, id, ctx, `Unknown function ${id}`),
        }, null);
        (0, vitest_1.expect)(diagnostics).toHaveLength(1);
        const d = diagnostics[0];
        (0, vitest_1.expect)(d.range.start.line).toBe(3);
        (0, vitest_1.expect)(d.range.start.character).toBe(line.indexOf('baz'));
        (0, vitest_1.expect)(d.message).toBe('Unknown function baz');
    });
    (0, vitest_1.it)('validatePattern respects shouldSkip', () => {
        const line = 'skip(me); keep(me);';
        const pattern = /(\w+)\(/g;
        const diagnostics = (0, validation_framework_1.validatePattern)(line, 0, {
            pattern,
            extractIdentifier: (m) => m[1],
            shouldSkip: (ctx) => ctx.match[1] === 'skip',
            shouldValidate: () => true,
            createDiagnostic: (id, ctx) => (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, id, ctx, 'bad'),
        }, {});
        (0, vitest_1.expect)(diagnostics).toHaveLength(1);
        (0, vitest_1.expect)(diagnostics[0].message).toBe('bad');
    });
    (0, vitest_1.it)('validateMultiplePatterns aggregates diagnostics from multiple configs', () => {
        const line = 'foo(); bar();';
        const pattern = /(\w+)\(/g;
        const configs = [
            {
                pattern,
                extractIdentifier: (m) => m[1],
                shouldValidate: (id) => id === 'foo',
                createDiagnostic: (id, ctx) => (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, id, ctx, 'first'),
            },
            {
                pattern,
                extractIdentifier: (m) => m[1],
                shouldValidate: (id) => id === 'bar',
                createDiagnostic: (id, ctx) => (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, id, ctx, 'second'),
            },
        ];
        const diagnostics = (0, validation_framework_1.validateMultiplePatterns)(line, 1, configs, {});
        (0, vitest_1.expect)(diagnostics).toHaveLength(2);
        (0, vitest_1.expect)(diagnostics.map((d) => d.message).sort()).toEqual(['first', 'second']);
    });
});
//# sourceMappingURL=validation-framework.test.js.map