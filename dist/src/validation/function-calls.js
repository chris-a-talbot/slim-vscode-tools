"use strict";
// ============================================================================
// FUNCTION CALL VALIDATION
// This file contains the code to validate function calls.
// This includes checking that functions exist in documentation.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFunctionCalls = validateFunctionCalls;
const vscode_languageserver_1 = require("vscode-languageserver");
const constants_1 = require("../config/constants");
const constants_2 = require("../config/constants");
const regex_patterns_1 = require("../config/regex-patterns");
const constants_3 = require("../config/constants");
const validation_framework_1 = require("./validation-framework");
/**
 * Checks if a function name matches a callback definition.
 * @param funcName - The function name to check
 * @param callbacksData - Map of callback documentation
 * @returns True if the function name is a callback
 */
function isCallback(funcName, callbacksData) {
    if (!callbacksData)
        return false;
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
 * Validates standalone function calls (not method calls).
 * Checks that functions exist in documentation.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param functionsData - Map of function documentation
 * @param callbacksData - Map of callback documentation
 * @returns Array of diagnostic objects
 */
function validateFunctionCalls(line, lineIndex, functionsData, callbacksData) {
    const controlFlowKeywords = regex_patterns_1.CONTROL_FLOW_PATTERNS.CONTROL_FLOW_KEYWORDS;
    const validationContext = {
        functionsData,
        callbacksData,
        controlFlowKeywords
    };
    return (0, validation_framework_1.validatePattern)(line, lineIndex, {
        pattern: regex_patterns_1.IDENTIFIER_PATTERNS.FUNCTION_CALL,
        extractIdentifier: (match) => match[constants_1.INDICES.SECOND],
        shouldSkip: (ctx, vCtx) => {
            const funcName = ctx.match[constants_1.INDICES.SECOND];
            // Skip partial identifiers (user still typing)
            if (ctx.afterMatch.length > 0 && regex_patterns_1.TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                return true;
            }
            // Skip control flow keywords
            if (vCtx.controlFlowKeywords.test(ctx.match[constants_1.INDICES.FIRST])) {
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
            return constants_2.FUNCTION_PREFIXES.some(prefix => funcName.startsWith(prefix));
        },
        createDiagnostic: (funcName, ctx) => {
            return (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, funcName, ctx, constants_3.ERROR_MESSAGES.FUNCTION_NOT_FOUND(funcName));
        }
    }, validationContext);
}
//# sourceMappingURL=function-calls.js.map