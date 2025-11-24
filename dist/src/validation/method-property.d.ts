import { Diagnostic } from 'vscode-languageserver';
import { ClassInfo } from '../config/types';
/**
 * Validates method and property calls on class instances.
 */
export declare function validateMethodOrPropertyCall(line: string, lineIndex: number, instanceDefinitions: Record<string, string>, classesData: Record<string, ClassInfo>): Diagnostic[];
//# sourceMappingURL=method-property.d.ts.map