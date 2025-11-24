import { Position } from 'vscode-languageserver';
import { WordContext } from '../config/types';
export interface WordInfo {
    word: string;
    context: WordContext;
}
export interface PositionOptions {
    resolveClassName?: (instanceName: string, instanceDefinitions: Record<string, string>) => string | null;
    instanceDefinitions?: Record<string, string>;
    classesData?: Record<string, unknown>;
    inferTypeFromExpression?: (expr: string) => string | null;
}
/**
 * Gets the operator at a given position in the text.
 */
export declare function getOperatorAtPosition(text: string, position: Position): string | null;
/**
 * Gets the word and context at a given position (for hover, etc).
 */
export declare function getWordAndContextAtPosition(text: string, position: Position, options?: PositionOptions): WordInfo | null;
/**
 * Gets the autocomplete context at a given position.
 */
export declare function getAutocompleteContextAtPosition(text: string, position: Position, options?: PositionOptions): WordInfo | null;
//# sourceMappingURL=positions.d.ts.map