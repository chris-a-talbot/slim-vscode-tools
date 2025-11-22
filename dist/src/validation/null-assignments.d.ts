import { Diagnostic } from 'vscode-languageserver';
import { FunctionData, ClassInfo } from '../types';
/**
 * Validates that NULL is not passed to non-nullable parameters.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param functionsData - Map of function documentation
 * @param classesData - Map of class documentation
 * @param instanceDefinitions - Map of tracked instance definitions
 * @returns Array of diagnostic objects
 */
export declare function validateNullAssignments(line: string, lineIndex: number, functionsData: Record<string, FunctionData>, classesData: Record<string, ClassInfo>, instanceDefinitions: Record<string, string>): Diagnostic[];
//# sourceMappingURL=null-assignments.d.ts.map