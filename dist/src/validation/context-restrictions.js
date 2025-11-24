"use strict";
// ============================================================================
// CONTEXT-SPECIFIC VALIDATION
// Validates function/method calls that are restricted to specific callbacks
// or model types (WF vs nonWF)
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContextRestrictions = validateContextRestrictions;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostics_1 = require("../utils/diagnostics");
const config_1 = require("../config/config");
/**
 * Validates context-restricted functions, methods, and pseudo-parameters
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param trackingState - The tracking state containing callback context and model type
 * @returns Array of diagnostic objects
 */
function validateContextRestrictions(line, lineIndex, trackingState) {
    const diagnostics = [];
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
/**
 * Validates functions that can only be called within initialize() callbacks
 */
function validateInitializeOnlyFunctions(line, lineIndex, currentCallback) {
    const diagnostics = [];
    // Check for initialize-only function calls
    for (const funcName of config_1.INITIALIZE_ONLY_FUNCTIONS) {
        const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
        let match;
        while ((match = pattern.exec(line)) !== null) {
            // Skip if we're in an initialize() callback
            if (currentCallback === 'initialize()') {
                continue;
            }
            const startCol = match.index;
            const endCol = match.index + funcName.length;
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Function '${funcName}()' can only be called within an initialize() callback`));
        }
    }
    return diagnostics;
}
/**
 * Validates methods that can only be called within reproduction() callbacks
 */
function validateReproductionOnlyMethods(line, lineIndex, currentCallback, modelType) {
    const diagnostics = [];
    // These methods can only be used in reproduction() callbacks (which are nonWF-only)
    for (const methodName of config_1.REPRODUCTION_ONLY_METHODS) {
        const pattern = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
        let match;
        while ((match = pattern.exec(line)) !== null) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + methodName.length;
            // Check if we're in a reproduction() callback
            if (currentCallback !== 'reproduction()') {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Method '${methodName}()' can only be called within a reproduction() callback (nonWF models only)`));
            }
            // Also check model type - reproduction() only exists in nonWF
            else if (modelType === 'WF') {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Method '${methodName}()' requires a nonWF model, but model type is WF`));
            }
        }
    }
    return diagnostics;
}
/**
 * Validates methods that can only be used in nonWF models
 */
function validateNonWFOnlyMethods(line, lineIndex, modelType) {
    const diagnostics = [];
    // Skip if model type is not WF (either nonWF or unknown)
    if (modelType !== 'WF') {
        return diagnostics;
    }
    // Check for nonWF-only methods
    for (const methodName of config_1.NONWF_ONLY_METHODS) {
        const pattern = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
        let match;
        while ((match = pattern.exec(line)) !== null) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + methodName.length;
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Method '${methodName}()' can only be used in nonWF models`));
        }
    }
    return diagnostics;
}
/**
 * Validates callback definitions based on model type
 */
function validateCallbackModelType(line, lineIndex, _currentCallback, modelType) {
    const diagnostics = [];
    // Skip if model type is unknown
    if (!modelType) {
        return diagnostics;
    }
    // Check for nonWF-only callbacks in WF models
    if (modelType === 'WF') {
        for (const callbackName of config_1.NONWF_ONLY_CALLBACKS) {
            const pattern = new RegExp(`\\b${callbackName}\\s*\\(`, 'g');
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const startCol = match.index;
                const endCol = match.index + callbackName.length;
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Callback '${callbackName}()' can only be used in nonWF models`));
            }
        }
    }
    // Check for WF-only callbacks in nonWF models
    if (modelType === 'nonWF') {
        for (const callbackName of config_1.WF_ONLY_CALLBACKS) {
            const pattern = new RegExp(`\\b${callbackName}\\s*\\(`, 'g');
            let match;
            while ((match = pattern.exec(line)) !== null) {
                const startCol = match.index;
                const endCol = match.index + callbackName.length;
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Callback '${callbackName}()' can only be used in WF models`));
            }
        }
    }
    return diagnostics;
}
/**
 * Validates pseudo-parameters that are only available in specific callbacks
 */
function validateCallbackSpecificPseudoParams(line, lineIndex, currentCallback) {
    const diagnostics = [];
    // Check for callback-specific pseudo-parameters
    for (const [paramName, allowedCallbacks] of Object.entries(config_1.CALLBACK_SPECIFIC_PSEUDO_PARAMS)) {
        // Match the parameter as a standalone identifier (not as part of a longer identifier)
        const pattern = new RegExp(`\\b${paramName}\\b`, 'g');
        let match;
        while ((match = pattern.exec(line)) !== null) {
            // Check if we're in one of the allowed callbacks
            const isAllowed = currentCallback && allowedCallbacks.includes(currentCallback);
            if (!isAllowed) {
                const startCol = match.index;
                const endCol = match.index + paramName.length;
                const allowedList = allowedCallbacks.join(', ');
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `Pseudo-parameter '${paramName}' is only available in ${allowedList} callback(s)`));
            }
        }
    }
    return diagnostics;
}
/**
 * Validates timing-restricted methods (e.g., InteractionType.evaluate())
 */
function validateTimingRestrictedMethods(line, lineIndex, currentCallback) {
    const diagnostics = [];
    // Check for InteractionType.evaluate() calls
    // Pattern matches: something.evaluate(
    const evaluatePattern = /\.evaluate\s*\(/g;
    let match;
    while ((match = evaluatePattern.exec(line)) !== null) {
        // Check if we're in a callback that blocks evaluate()
        if (currentCallback && config_1.CALLBACKS_BLOCKING_EVALUATE.includes(currentCallback)) {
            const startCol = match.index + 1; // Skip the dot
            const endCol = startCol + 'evaluate'.length;
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `InteractionType.evaluate() cannot be called during offspring generation or viability/survival stages (current callback: ${currentCallback})`));
        }
    }
    return diagnostics;
}
//# sourceMappingURL=context-restrictions.js.map