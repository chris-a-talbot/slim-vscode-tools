import { Diagnostic } from 'vscode-languageserver';
import { SemicolonResult } from '../types';
/**
 * Helper function to validate script structure
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
export declare function validateScriptStructure(text: string, lines: string[]): Diagnostic[];
/**
 * Checks if a statement should have a semicolon.
 * @param line - The line to check
 * @param parenBalance - Current parenthesis balance
 * @returns Object with shouldMark boolean and updated parenBalance
 */
export declare function shouldHaveSemicolon(line: string, parenBalance?: number): SemicolonResult;
//# sourceMappingURL=structure.d.ts.map