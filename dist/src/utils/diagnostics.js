"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiagnostic = createDiagnostic;
exports.sendDiagnostics = sendDiagnostics;
const config_1 = require("../config/config");
/**
 * Creates a diagnostic object with consistent formatting.
 * @param severity - The severity level (Error, Warning, etc.)
 * @param lineIndex - The line number (0-based)
 * @param startChar - The starting character position (0-based)
 * @param endChar - The ending character position (0-based)
 * @param message - The diagnostic message
 * @returns A diagnostic object ready to be added to diagnostics array
 */
function createDiagnostic(severity, lineIndex, startChar, endChar, message) {
    return {
        severity: severity,
        range: {
            start: { line: lineIndex, character: startChar },
            end: { line: lineIndex, character: endChar }
        },
        message: message,
        source: config_1.DIAGNOSTIC_SOURCE
    };
}
/**
 * Sends diagnostics to the VS Code client for a given document.
 * @param connection - The language server connection
 * @param uri - The document URI
 * @param diagnostics - Array of diagnostic objects
 */
function sendDiagnostics(connection, uri, diagnostics) {
    connection.sendDiagnostics({ uri, diagnostics });
}
//# sourceMappingURL=diagnostics.js.map