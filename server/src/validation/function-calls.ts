// ============================================================================
// FUNCTION CALL VALIDATION
// Validates that function calls reference documented SLiM/Eidos functions
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { IDENTIFIER_PATTERNS, CONTROL_FLOW_PATTERNS, TEXT_PROCESSING_PATTERNS, FUNCTION_PREFIXES, ERROR_MESSAGES } from '../config/config';
import { FunctionData, CallbackInfo } from '../config/types';
import { createDiagnostic } from '../utils/diagnostics';

/**
 * Checks if a function name matches a callback definition.
 */
function isCallback(funcName: string, callbacksData: Record<string, CallbackInfo>): boolean {
    if (callbacksData[funcName] || 
        callbacksData[funcName + '()'] || 
        callbacksData[funcName + '() callbacks']) {
        return true;
    }
    
    for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
        if (callbackInfo.signature === funcName + '()' ||
            callbackName.startsWith(funcName + '(') || 
            callbackName.startsWith(funcName + '()')) {
            return true;
        }
    }
    
    return false;
}

/**
 * Validates standalone function calls (not method calls).
 */
export function validateFunctionCalls(
    line: string,
    lineIndex: number,
    functionsData: Record<string, FunctionData>,
    callbacksData: Record<string, CallbackInfo>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pattern = IDENTIFIER_PATTERNS.FUNCTION_CALL;
    pattern.lastIndex = 0;
    
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line)) !== null) {
        if (match.index === undefined) continue;
        
        const funcName = match[1];
        const beforeMatch = line.substring(0, match.index);
        const afterMatch = line.substring(match.index + match[0].length);
        
        // Skip partial identifiers (user still typing)
        if (afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) {
            continue;
        }
        
        // Skip control flow keywords
        if (CONTROL_FLOW_PATTERNS.CONTROL_FLOW_KEYWORDS.test(match[0])) {
            continue;
        }
        
        // Skip method calls (handled elsewhere)
        if (beforeMatch.trim().endsWith('.')) {
            continue;
        }
        
        // Skip constructor calls
        if (beforeMatch.trim().endsWith('new')) {
            continue;
        }
        
        // Skip callbacks
        if (isCallback(funcName, callbacksData)) {
            continue;
        }
        
        // Only validate if function doesn't exist and has SLiM/Eidos prefix
        if (functionsData[funcName]) {
            continue;
        }
        
        if (!FUNCTION_PREFIXES.some(prefix => funcName.startsWith(prefix))) {
            continue;
        }
        
        // Create diagnostic for unknown function
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            lineIndex,
            match.index,
            match.index + funcName.length,
            ERROR_MESSAGES.FUNCTION_NOT_FOUND(funcName)
        ));
    }
    
    return diagnostics;
}

