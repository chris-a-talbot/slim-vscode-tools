"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hover_1 = require("../../src/providers/hover");
class MockDocumentationService {
    getFunctions() { return {}; }
    getClasses() { return {}; }
    getCallbacks() { return {}; }
    getTypes() { return {}; }
    getOperators() {
        return {
            '+': {
                signature: '+',
                description: 'addition',
                symbol: '+',
            },
        };
    }
}
function createHoverTestContext(source) {
    const document = {
        getText: () => source,
    };
    let hoverHandler;
    const connection = {
        onHover: (handler) => {
            hoverHandler = handler;
        },
    };
    const documents = {
        get: () => document,
    };
    const documentationService = new MockDocumentationService();
    const ctx = {
        connection,
        documents,
        documentationService,
        validationService: {},
        completionService: {},
    };
    (0, hover_1.registerHoverProvider)(ctx);
    return {
        getHover: () => hoverHandler,
    };
}
(0, vitest_1.describe)('hover provider integration', () => {
    (0, vitest_1.it)('returns operator hover for +', async () => {
        const { getHover } = createHoverTestContext('1 + 2');
        const hover = await getHover()({
            textDocument: { uri: 'file:///test.slim' },
            position: { line: 0, character: 2 },
        });
        (0, vitest_1.expect)(hover).not.toBeNull();
        const value = hover.contents;
        (0, vitest_1.expect)(typeof value.value).toBe('string');
        (0, vitest_1.expect)(value.value).toContain('+');
    });
});
//# sourceMappingURL=hover-provider.integration.test.js.map