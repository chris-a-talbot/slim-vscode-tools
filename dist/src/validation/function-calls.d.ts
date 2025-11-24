import { Diagnostic } from 'vscode-languageserver';
import { FunctionData, CallbackInfo } from '../config/types';
/**
 * Validates standalone function calls (not method calls).
 */
export declare function validateFunctionCalls(line: string, lineIndex: number, functionsData: Record<string, FunctionData>, callbacksData: Record<string, CallbackInfo>): Diagnostic[];
//# sourceMappingURL=function-calls.d.ts.map