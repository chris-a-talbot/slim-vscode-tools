import { Position } from 'vscode-languageserver';
import { WordContext } from '../types';
/**
 * Word information with context
 */
export interface WordInfo {
    word: string;
    context: WordContext;
}
/**
 * Options for position utilities
 */
export interface PositionOptions {
    resolveClassName?: (instanceName: string, instanceDefinitions: Record<string, string>) => string | null;
    instanceDefinitions?: Record<string, string>;
    classesData?: Record<string, unknown>;
    inferTypeFromExpression?: (expr: string) => string | null;
}
/**
 * Gets the operator at a given position in the text.
 * Checks for multi-character operators first (e.g., '<=', '=='), then single-character operators.
 * Used for hover documentation on operators.
 * @param text - The source text
 * @param position - The cursor position
 * @returns The operator symbol found, or null if no operator at position
 */
export declare function getOperatorAtPosition(text: string, position: Position): string | null;
/**
 * Gets the word and its context at a given position in the text.
 * Used for hover documentation and context-aware features.
 * @param text - The source text
 * @param position - The cursor position
 * @param options - Options object with resolveClassName, instanceDefinitions, classesData, inferTypeFromExpression
 * @returns Object with word and context info, or null if no word at position
 */
export declare function getWordAndContextAtPosition(text: string, position: Position, options?: PositionOptions): WordInfo | null;
/**
 * Gets the autocomplete context at a given position.
 * Determines if we're completing a method/property (after a dot) or a standalone identifier.
 * @param text - The source text
 * @param position - The cursor position
 * @param options - Options object with resolveClassName and instanceDefinitions
 * @returns Object with word and context info for autocomplete, or null if not found
 */
export declare function getAutocompleteContextAtPosition(text: string, position: Position, options?: PositionOptions): WordInfo | null;
//# sourceMappingURL=position-utils.d.ts.map