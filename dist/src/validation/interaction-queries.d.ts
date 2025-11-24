import { Diagnostic } from 'vscode-languageserver';
/**
 * Validates that InteractionType query methods are called after evaluate()
 * Uses brace tracking to identify individual event blocks
 * @param lines - All lines of code
 * @param trackingState - The tracking state with callback context
 * @returns Array of diagnostic objects
 */
export declare function validateInteractionQueries(lines: string[], trackingState: any): Diagnostic[];
//# sourceMappingURL=interaction-queries.d.ts.map