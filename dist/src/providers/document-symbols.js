"use strict";
// ============================================================================
// DOCUMENT SYMBOLS PROVIDER
// This file contains the code to generate document symbols (the outline view).
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDocumentSymbolsProvider = registerDocumentSymbolsProvider;
const constants_1 = require("../config/constants");
/**
 * Registers the document symbols provider handler.
 * Provides document symbols (outline) for the document.
 * @param context - The language server context
 */
function registerDocumentSymbolsProvider(context) {
    const { connection, documents } = context;
    connection.onDocumentSymbol((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const text = document.getText();
        const symbols = [];
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            // Match regular functions: function functionName(...)
            const functionMatch = line.match(/function\s+(\w+)/);
            if (functionMatch) {
                symbols.push({
                    name: functionMatch[1],
                    kind: constants_1.COMPLETION_KINDS.FUNCTION,
                    range: {
                        start: { line: index, character: 0 },
                        end: { line: index, character: line.length }
                    },
                    selectionRange: {
                        start: { line: index, character: 0 },
                        end: { line: index, character: line.length }
                    }
                });
            }
            // Match SLiM callbacks with optional tick number/range:
            // - callbackName() { }
            // - 123 callbackName() { }
            // - 123:456 callbackName() { }
            const callbackPattern = new RegExp(`^\\s*(?:(?:\\d+:\\d+|\\d+)\\s+)?(${constants_1.CALLBACK_NAMES.join('|')})\\s*\\(\\s*\\)\\s*\\{`);
            const callbackMatch = line.match(callbackPattern);
            if (callbackMatch) {
                const callbackName = callbackMatch[1];
                // Include tick info in the name if present
                const tickMatch = line.match(/^\s*((?:\d+:\d+|\d+)\s+)?/);
                const tickInfo = tickMatch && tickMatch[1] ? tickMatch[1].trim() + ' ' : '';
                const displayName = tickInfo + callbackName + '()';
                symbols.push({
                    name: displayName,
                    kind: constants_1.COMPLETION_KINDS.METHOD, // Use METHOD to differentiate from functions
                    range: {
                        start: { line: index, character: 0 },
                        end: { line: index, character: line.length }
                    },
                    selectionRange: {
                        start: { line: index, character: 0 },
                        end: { line: index, character: line.length }
                    }
                });
            }
        });
        return symbols;
    });
}
//# sourceMappingURL=document-symbols.js.map