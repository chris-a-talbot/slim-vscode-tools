import { Diagnostic } from 'vscode-languageserver';
import { ClassInfo } from '../types';
/**
 * Validates method and property calls on class instances.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param instanceDefinitions - Map of tracked instance definitions
 * @param classesData - Map of class documentation
 * @returns Array of diagnostic objects
 */
export declare function validateMethodOrPropertyCall(line: string, lineIndex: number, instanceDefinitions: Record<string, string>, classesData: Record<string, ClassInfo>): Diagnostic[];
//# sourceMappingURL=method-property.d.ts.map