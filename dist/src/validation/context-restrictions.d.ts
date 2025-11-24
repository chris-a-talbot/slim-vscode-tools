import { Diagnostic } from 'vscode-languageserver';
import { TrackingState } from '../config/types';
/**
 * Validates context-restricted functions, methods, and pseudo-parameters
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param trackingState - The tracking state containing callback context and model type
 * @returns Array of diagnostic objects
 */
export declare function validateContextRestrictions(line: string, lineIndex: number, trackingState: TrackingState): Diagnostic[];
//# sourceMappingURL=context-restrictions.d.ts.map