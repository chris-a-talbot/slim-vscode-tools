"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const documentation_service_1 = require("../../../src/services/documentation-service");
(0, vitest_1.describe)('DocumentationService transformations', () => {
    (0, vitest_1.it)('transformFunctionData extracts return type and cleans signature', () => {
        const svc = new documentation_service_1.DocumentationService();
        const fn = svc.transformFunctionData('s_func', { signatures: ['(i)$s_func(i x, f y)'], description: 'desc' }, 'category', 'SLiM');
        (0, vitest_1.expect)(fn.source).toBe('SLiM');
        (0, vitest_1.expect)(fn.returnType).toBeDefined();
        (0, vitest_1.expect)(typeof fn.signature).toBe('string');
    });
    (0, vitest_1.it)('transformCallbackData strips trailing callback suffixes', () => {
        const svc = new documentation_service_1.DocumentationService();
        const cb = svc.transformCallbackData('initialize', {
            signature: 'initialize() callbacks',
            description: 'd',
        });
        (0, vitest_1.expect)(cb.signature).toBe('initialize()');
    });
    (0, vitest_1.it)('transformOperatorData sets symbol field', () => {
        const svc = new documentation_service_1.DocumentationService();
        const op = svc.transformOperatorData('+', { signature: '+', description: 'plus' }, '+');
        (0, vitest_1.expect)(op.symbol).toBe('+');
    });
    (0, vitest_1.it)('extractClassConstructors derives constructor info from class data', () => {
        const svc = new documentation_service_1.DocumentationService();
        const classes = {
            Foo: {
                constructor: { signature: 'Foo(i x)', description: 'c' },
                methods: {},
                properties: {},
            },
            Bar: {
                constructor: { signature: 'None', description: 'none' },
                methods: {},
                properties: {},
            },
        };
        const ctors = svc.extractClassConstructors(classes);
        (0, vitest_1.expect)(ctors.Foo.signature).toContain('Foo');
        (0, vitest_1.expect)(ctors.Bar.signature).toBe('None');
    });
});
//# sourceMappingURL=documentation-service.test.js.map