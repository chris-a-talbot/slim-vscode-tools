import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { IDENTIFIER_PATTERNS, CONTROL_FLOW_PATTERNS, TEXT_PROCESSING_PATTERNS, ERROR_MESSAGES, EIDOS_EVENT_NAMES, CALLBACK_NAMES } from '../config/config';
import { FunctionData, CallbackInfo } from '../config/types';
import { createDiagnostic } from '../utils/diagnostics';

function isCallback(funcName: string, callbacksData: Record<string, CallbackInfo>): boolean {
    // Check if it's an Eidos event (early, late, first)
    if (EIDOS_EVENT_NAMES.includes(funcName)) {
        return true;
    }
    
    // Check if it's a known callback name (initialize, mutationEffect, etc.)
    if (CALLBACK_NAMES.includes(funcName)) {
        return true;
    }
    
    // Check if it's in the callbacks data directly
    if (callbacksData[funcName] || 
        callbacksData[funcName + '()'] || 
        callbacksData[funcName + '() callbacks']) {
        return true;
    }
    
    // Check if any callback signature matches
    for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
        if (callbackInfo.signature === funcName + '()' ||
            callbackName.startsWith(funcName + '(') || 
            callbackName.startsWith(funcName + '()')) {
            return true;
        }
    }
    
    return false;
}

export function validateFunctionCalls(
    line: string,
    lineIndex: number,
    functionsData: Record<string, FunctionData>,
    callbacksData: Record<string, CallbackInfo>,
    userDefinedFunctions: Set<string>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const pattern = IDENTIFIER_PATTERNS.FUNCTION_CALL;
    pattern.lastIndex = 0;
    
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(line)) !== null) {
        const funcName = match[1];
        const beforeMatch = line.substring(0, match.index!);
        const afterMatch = line.substring(match.index! + match[0].length);
        
        // Skip if it's not really a function call
        if (afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) continue;
        
        // Skip control flow keywords
        if (CONTROL_FLOW_PATTERNS.CONTROL_FLOW_KEYWORDS.test(match[0])) continue;
        
        // Skip method calls (preceded by '.')
        if (beforeMatch.trim().endsWith('.')) continue;
        
        // Skip constructor calls (preceded by 'new')
        if (beforeMatch.trim().endsWith('new')) continue;
        
        // Skip known callbacks
        if (isCallback(funcName, callbacksData)) continue;
        
        // Skip functions from documentation
        if (functionsData[funcName]) continue;
        
        // Skip user-defined functions in the script
        if (userDefinedFunctions.has(funcName)) continue;
        
        // If we got here, it's an unknown function call
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            lineIndex,
            match.index!,
            match.index! + funcName.length,
            ERROR_MESSAGES.FUNCTION_NOT_FOUND(funcName)
        ));
    }
    
    return diagnostics;
}

