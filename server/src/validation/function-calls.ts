// ============================================================================
// FUNCTION CALL VALIDATION
// This file contains the code to validate function calls.
// This includes checking that functions exist in documentation.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { INDICES } from '../config/constants';
import { FUNCTION_PREFIXES } from '../config/constants';
import { IDENTIFIER_PATTERNS, CONTROL_FLOW_PATTERNS, TEXT_PROCESSING_PATTERNS } from '../config/regex-patterns';
import { ERROR_MESSAGES } from '../config/constants';
import { FunctionData, CallbackInfo } from '../types';
import { validatePattern, createStandardDiagnostic } from './validation-framework';

/**
 * Checks if a function name matches a callback definition.
 * @param funcName - The function name to check
 * @param callbacksData - Map of callback documentation
 * @returns True if the function name is a callback
 */
function isCallback(funcName: string, callbacksData: Record<string, CallbackInfo> | undefined): boolean {
    if (!callbacksData) return false;
    
    // Check if it's a callback by name (with or without parentheses, or with " callbacks" suffix)
    if (callbacksData[funcName] || 
        callbacksData[funcName + '()'] || 
        callbacksData[funcName + '() callbacks']) {
        return true;
    }
    
    // Also check if any callback signature or name starts with this function name
    for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
        // Check if the signature matches (e.g., "initialize()")
        if (callbackInfo.signature === funcName + '()') {
            return true;
        }
        // Check if the callback name starts with the function name (e.g., "initialize() callbacks")
        if (callbackName.startsWith(funcName + '(') || callbackName.startsWith(funcName + '()')) {
            return true;
        }
    }
    
    return false;
}

/**
 * Validation context for function calls
 */
interface FunctionCallContext {
    functionsData: Record<string, FunctionData>;
    callbacksData: Record<string, CallbackInfo>;
    controlFlowKeywords: RegExp;
}

/**
 * Validates standalone function calls (not method calls).
 * Checks that functions exist in documentation.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param functionsData - Map of function documentation
 * @param callbacksData - Map of callback documentation
 * @returns Array of diagnostic objects
 */
export function validateFunctionCalls(
    line: string,
    lineIndex: number,
    functionsData: Record<string, FunctionData>,
    callbacksData: Record<string, CallbackInfo>
): Diagnostic[] {
    const controlFlowKeywords = CONTROL_FLOW_PATTERNS.CONTROL_FLOW_KEYWORDS;
    const validationContext: FunctionCallContext = {
        functionsData,
        callbacksData,
        controlFlowKeywords
    };
    
    return validatePattern(line, lineIndex, {
        pattern: IDENTIFIER_PATTERNS.FUNCTION_CALL,
        extractIdentifier: (match) => match[INDICES.SECOND],
        shouldSkip: (ctx, vCtx) => {
            const funcName = ctx.match[INDICES.SECOND];
            
            // Skip partial identifiers (user still typing)
            if (ctx.afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                return true;
            }
            
            // Skip control flow keywords
            if (vCtx.controlFlowKeywords.test(ctx.match[INDICES.FIRST])) {
                return true;
            }
            
            // Skip method calls (handled elsewhere)
            if (ctx.beforeMatch.trim().endsWith('.')) {
                return true;
            }
            
            // Skip constructor calls
            if (ctx.beforeMatch.trim().endsWith('new')) {
                return true;
            }
            
            // Skip callbacks
            if (isCallback(funcName, vCtx.callbacksData)) {
                return true;
            }
            
            return false;
        },
        shouldValidate: (funcName, _ctx, vCtx) => {
            // Only validate if function doesn't exist and has SLiM/Eidos prefix
            if (vCtx.functionsData[funcName]) {
                return false; // Function exists, skip validation
            }
            
            // Only warn for SLiM/Eidos function prefixes
            return FUNCTION_PREFIXES.some(prefix => funcName.startsWith(prefix));
        },
        createDiagnostic: (funcName, ctx) => {
            return createStandardDiagnostic(
                DiagnosticSeverity.Warning,
                funcName,
                ctx,
                ERROR_MESSAGES.FUNCTION_NOT_FOUND(funcName)
            );
        }
    }, validationContext);
}

