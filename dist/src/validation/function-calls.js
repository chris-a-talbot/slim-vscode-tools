"use strict";
// ============================================================================
// FUNCTION CALL VALIDATION
// Validates that function calls reference documented SLiM/Eidos functions
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFunctionCalls = validateFunctionCalls;
const vscode_languageserver_1 = require("vscode-languageserver");
const config_1 = require("../config/config");
const diagnostics_1 = require("../utils/diagnostics");
/**
 * Checks if a function name matches a callback definition.
 */
function isCallback(funcName, callbacksData) {
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
function validateFunctionCalls(line, lineIndex, functionsData, callbacksData) {
    const diagnostics = [];
    const pattern = config_1.IDENTIFIER_PATTERNS.FUNCTION_CALL;
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
        if (match.index === undefined)
            continue;
        const funcName = match[1];
        const beforeMatch = line.substring(0, match.index);
        const afterMatch = line.substring(match.index + match[0].length);
        // Skip partial identifiers (user still typing)
        if (afterMatch.length > 0 && config_1.TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) {
            continue;
        }
        // Skip control flow keywords
        if (config_1.CONTROL_FLOW_PATTERNS.CONTROL_FLOW_KEYWORDS.test(match[0])) {
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
        if (!config_1.FUNCTION_PREFIXES.some(prefix => funcName.startsWith(prefix))) {
            continue;
        }
        // Create diagnostic for unknown function
        diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, lineIndex, match.index, match.index + funcName.length, config_1.ERROR_MESSAGES.FUNCTION_NOT_FOUND(funcName)));
    }
    return diagnostics;
}
//# sourceMappingURL=function-calls.js.map