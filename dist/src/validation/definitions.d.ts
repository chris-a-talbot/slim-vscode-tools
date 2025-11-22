import { Diagnostic } from 'vscode-languageserver';
/**
 * Helper function to check for duplicate definitions and create diagnostics.
 * @param regex - Regex pattern to match the definition
 * @param seenMap - Map of seen definitions (id -> line number)
 * @param line - The line to check
 * @param lineIndex - The line index (0-based)
 * @param typeName - Human-readable type name for error messages
 * @param startOffset - Character offset for start position
 * @returns Diagnostic object if duplicate found, null otherwise
 */
export declare function checkDuplicateDefinition(regex: RegExp, seenMap: Map<string, number>, line: string, lineIndex: number, typeName: string, startOffset?: number): Diagnostic | null;
/**
 * Validates duplicate definitions and reserved identifier usage.
 * Also validates that reserved identifiers are not used.
 * @param text - The full source text (unused but kept for consistency)
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
export declare function validateDefinitions(_text: string, lines: string[]): Diagnostic[];
//# sourceMappingURL=definitions.d.ts.map