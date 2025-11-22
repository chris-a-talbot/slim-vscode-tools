"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const validation_service_1 = require("../../src/services/validation-service");
class MockDocumentationService {
    getFunctions() { return {}; }
    getClasses() { return {}; }
    getCallbacks() { return {}; }
}
(0, vitest_1.describe)('ValidationService integration', () => {
    (0, vitest_1.it)('produces diagnostics for missing semicolons', async () => {
        const text = ['x = 1', 'y = 2'].join('\n');
        const document = vscode_languageserver_textdocument_1.TextDocument.create('file:///test.slim', 'slim', 1, text);
        const validationService = new validation_service_1.ValidationService(new MockDocumentationService());
        const diagnostics = await validationService.validate(document);
        const messages = diagnostics.map((d) => d.message.toLowerCase());
        (0, vitest_1.expect)(messages.some((m) => m.includes('semicolon'))).toBe(true);
    });
});
//# sourceMappingURL=validation-service.integration.test.js.map