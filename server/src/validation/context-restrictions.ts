import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostics';
import { TrackingState } from '../config/types';
import {
    INITIALIZE_ONLY_FUNCTIONS,
    REPRODUCTION_ONLY_METHODS,
    NONWF_ONLY_METHODS,
    NONWF_ONLY_CALLBACKS,
    WF_ONLY_CALLBACKS,
    CALLBACK_SPECIFIC_PSEUDO_PARAMS,
    CALLBACKS_BLOCKING_EVALUATE
} from '../config/config';

export function validateContextRestrictions(
    line: string,
    lineIndex: number,
    trackingState: TrackingState
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Get the callback context for this line
    const currentCallback = trackingState.callbackContextByLine.get(lineIndex);
    const modelType = trackingState.modelType;
    
    // Validate initialize-only functions
    diagnostics.push(...validateInitializeOnlyFunctions(line, lineIndex, currentCallback));
    
    // Validate reproduction-only methods
    diagnostics.push(...validateReproductionOnlyMethods(line, lineIndex, currentCallback, modelType));
    
    // Validate nonWF-only methods
    diagnostics.push(...validateNonWFOnlyMethods(line, lineIndex, modelType));
    
    // Validate callback model type restrictions
    diagnostics.push(...validateCallbackModelType(line, lineIndex, currentCallback, modelType));
    
    // Validate callback-specific pseudo-parameters
    diagnostics.push(...validateCallbackSpecificPseudoParams(line, lineIndex, currentCallback));
    
    // Validate timing-restricted methods (like InteractionType.evaluate())
    diagnostics.push(...validateTimingRestrictedMethods(line, lineIndex, currentCallback));
    
    return diagnostics;
}

function validateInitializeOnlyFunctions(
    line: string,
    lineIndex: number,
    currentCallback: string | null | undefined
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Check for initialize-only function calls
    for (const funcName of INITIALIZE_ONLY_FUNCTIONS) {
        const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
        let match: RegExpExecArray | null;
        
        while ((match = pattern.exec(line)) !== null) {
            // Skip if we're in an initialize() callback
            if (currentCallback === 'initialize()') {
                continue;
            }
            
            const startCol = match.index;
            const endCol = match.index + funcName.length;
            
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                startCol,
                endCol,
                `Function '${funcName}()' can only be called within an initialize() callback`
            ));
        }
    }
    
    return diagnostics;
}

function validateReproductionOnlyMethods(
    line: string,
    lineIndex: number,
    currentCallback: string | null | undefined,
    modelType: 'WF' | 'nonWF' | null
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // These methods can only be used in reproduction() callbacks (which are nonWF-only)
    for (const methodName of REPRODUCTION_ONLY_METHODS) {
        const pattern = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
        let match: RegExpExecArray | null;
        
        while ((match = pattern.exec(line)) !== null) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + methodName.length;
            
            // Check if we're in a reproduction() callback
            if (currentCallback !== 'reproduction()') {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    startCol,
                    endCol,
                    `Method '${methodName}()' can only be called within a reproduction() callback (nonWF models only)`
                ));
            }
            // Also check model type - reproduction() only exists in nonWF
            else if (modelType === 'WF') {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    startCol,
                    endCol,
                    `Method '${methodName}()' requires a nonWF model, but model type is WF`
                ));
            }
        }
    }
    
    return diagnostics;
}

function validateNonWFOnlyMethods(
    line: string,
    lineIndex: number,
    modelType: 'WF' | 'nonWF' | null
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Skip if model type is not WF (either nonWF or unknown)
    if (modelType !== 'WF') {
        return diagnostics;
    }
    
    // Check for nonWF-only methods
    for (const methodName of NONWF_ONLY_METHODS) {
        const pattern = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
        let match: RegExpExecArray | null;
        
        while ((match = pattern.exec(line)) !== null) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + methodName.length;
            
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                startCol,
                endCol,
                `Method '${methodName}()' can only be used in nonWF models`
            ));
        }
    }
    
    return diagnostics;
}

function validateCallbackModelType(
    line: string,
    lineIndex: number,
    _currentCallback: string | null | undefined,
    modelType: 'WF' | 'nonWF' | null
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Skip if model type is unknown
    if (!modelType) {
        return diagnostics;
    }
    
    // Check for nonWF-only callbacks in WF models
    if (modelType === 'WF') {
        for (const callbackName of NONWF_ONLY_CALLBACKS) {
            const pattern = new RegExp(`\\b${callbackName}\\s*\\(`, 'g');
            let match: RegExpExecArray | null;
            
            while ((match = pattern.exec(line)) !== null) {
                const startCol = match.index;
                const endCol = match.index + callbackName.length;
                
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    startCol,
                    endCol,
                    `Callback '${callbackName}()' can only be used in nonWF models`
                ));
            }
        }
    }
    
    // Check for WF-only callbacks in nonWF models
    if (modelType === 'nonWF') {
        for (const callbackName of WF_ONLY_CALLBACKS) {
            const pattern = new RegExp(`\\b${callbackName}\\s*\\(`, 'g');
            let match: RegExpExecArray | null;
            
            while ((match = pattern.exec(line)) !== null) {
                const startCol = match.index;
                const endCol = match.index + callbackName.length;
                
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    startCol,
                    endCol,
                    `Callback '${callbackName}()' can only be used in WF models`
                ));
            }
        }
    }
    
    return diagnostics;
}

function validateCallbackSpecificPseudoParams(
    line: string,
    lineIndex: number,
    currentCallback: string | null | undefined
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Check for callback-specific pseudo-parameters
    for (const [paramName, allowedCallbacks] of Object.entries(CALLBACK_SPECIFIC_PSEUDO_PARAMS)) {
        // Match the parameter as a standalone identifier (not as part of a longer identifier)
        const pattern = new RegExp(`\\b${paramName}\\b`, 'g');
        let match: RegExpExecArray | null;
        
        while ((match = pattern.exec(line)) !== null) {
            // Check if we're in one of the allowed callbacks
            const isAllowed = currentCallback && allowedCallbacks.includes(currentCallback);
            
            if (!isAllowed) {
                const startCol = match.index;
                const endCol = match.index + paramName.length;
                
                const allowedList = allowedCallbacks.join(', ');
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    startCol,
                    endCol,
                    `Pseudo-parameter '${paramName}' is only available in ${allowedList} callback(s)`
                ));
            }
        }
    }
    
    return diagnostics;
}

function validateTimingRestrictedMethods(
    line: string,
    lineIndex: number,
    currentCallback: string | null | undefined
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Check for InteractionType.evaluate() calls
    // Pattern matches: something.evaluate(
    const evaluatePattern = /\.evaluate\s*\(/g;
    let match: RegExpExecArray | null;
    
    while ((match = evaluatePattern.exec(line)) !== null) {
        // Check if we're in a callback that blocks evaluate()
        if (currentCallback && CALLBACKS_BLOCKING_EVALUATE.includes(currentCallback)) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + 'evaluate'.length;
            
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                startCol,
                endCol,
                `InteractionType.evaluate() cannot be called during offspring generation or viability/survival stages (current callback: ${currentCallback})`
            ));
        }
    }
    
    return diagnostics;
}

