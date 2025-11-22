import { Diagnostic } from 'vscode-languageserver';
import { FunctionData, CallbackInfo } from '../types';
/**
 * Validates standalone function calls (not method calls).
 * Checks that functions exist in documentation.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param functionsData - Map of function documentation
 * @param callbacksData - Map of callback documentation
 * @returns Array of diagnostic objects
 */
export declare function validateFunctionCalls(line: string, lineIndex: number, functionsData: Record<string, FunctionData>, callbacksData: Record<string, CallbackInfo>): Diagnostic[];
//# sourceMappingURL=function-calls.d.ts.map