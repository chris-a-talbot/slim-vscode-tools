import { DiagnosticSeverity, Diagnostic, Connection } from 'vscode-languageserver';
/**
 * Creates a diagnostic object with consistent formatting.
 * @param severity - The severity level (Error, Warning, etc.)
 * @param lineIndex - The line number (0-based)
 * @param startChar - The starting character position (0-based)
 * @param endChar - The ending character position (0-based)
 * @param message - The diagnostic message
 * @returns A diagnostic object ready to be added to diagnostics array
 */
export declare function createDiagnostic(severity: DiagnosticSeverity, lineIndex: number, startChar: number, endChar: number, message: string): Diagnostic;
/**
 * Sends diagnostics to the VS Code client for a given document.
 * @param connection - The language server connection
 * @param uri - The document URI
 * @param diagnostics - Array of diagnostic objects
 */
export declare function sendDiagnostics(connection: Connection, uri: string, diagnostics: Diagnostic[]): void;
//# sourceMappingURL=diagnostics.d.ts.map