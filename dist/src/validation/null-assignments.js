"use strict";
// ============================================================================
// NULL ASSIGNMENT VALIDATION
// This file contains the code to validate NULL assignments to non-nullable parameters.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNullAssignments = validateNullAssignments;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostic_factory_1 = require("../utils/diagnostic-factory");
const type_utils_1 = require("../utils/type-utils");
const type_resolving_1 = require("../utils/type-resolving");
const text_processing_1 = require("../utils/text-processing");
const constants_1 = require("../config/constants");
const regex_patterns_1 = require("../config/regex-patterns");
/**
 * Creates a diagnostic for NULL assignment to non-nullable parameter.
 * @param lineIndex - The line index (0-based)
 * @param arg - The argument object
 * @param line - The full line
 * @param param - The parameter object
 * @param paramIndex - The parameter index (0-based)
 * @param context - Additional context (e.g., function or method name)
 * @returns Diagnostic object or null if NULL not found
 */
function createNullAssignmentDiagnostic(lineIndex, arg, line, param, paramIndex, context = '') {
    const argValue = arg.value.trim();
    // Check if argument is NULL
    if (argValue !== 'NULL' && argValue !== 'null') {
        return null;
    }
    // Check if parameter type is non-nullable
    if ((0, type_utils_1.isNullableType)(param.type)) {
        return null;
    }
    // Find the actual position of NULL in the argument
    const argText = line.substring(arg.start, arg.end);
    const nullMatch = argText.match(regex_patterns_1.TEXT_PROCESSING_PATTERNS.NULL_KEYWORD);
    if (!nullMatch || nullMatch.index === undefined) {
        return null;
    }
    const nullStart = arg.start + nullMatch.index;
    const nullEnd = nullStart + nullMatch[0].length;
    const paramName = param.name || `parameter ${paramIndex + constants_1.PARAMETER_INDEX_OFFSET}`;
    const typeName = param.type.replace(regex_patterns_1.TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX, '');
    const message = constants_1.ERROR_MESSAGES.NULL_TO_NON_NULLABLE(paramName, typeName, context);
    return (0, diagnostic_factory_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, nullStart, nullEnd, message);
}
/**
 * Parses function call arguments from a line, handling nested calls, generics, and strings.
 * @param line - The full line containing the function call
 * @param parenStart - The index of the opening parenthesis
 * @param parenEnd - The index of the closing parenthesis
 * @returns Array of argument objects
 */
function parseFunctionArguments(line, parenStart, parenEnd) {
    const argString = line.substring(parenStart + constants_1.CHAR_OFFSETS.AFTER_OPEN_PAREN, parenEnd);
    const args = [];
    let currentArg = '';
    let argStartPos = parenStart + constants_1.CHAR_OFFSETS.AFTER_OPEN_PAREN;
    let argDepth = constants_1.INITIAL_DEPTHS.ARGUMENT;
    let inString = false;
    let stringChar = null;
    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        const fullLinePos = parenStart + constants_1.CHAR_OFFSETS.AFTER_OPEN_PAREN + i;
        const isEscaped = (0, text_processing_1.isEscapedQuote)(argString, i);
        if (!inString && (char === '"' || char === "'") && !isEscaped) {
            inString = true;
            stringChar = char;
        }
        else if (inString && char === stringChar && !isEscaped) {
            inString = false;
            stringChar = null;
        }
        else if (!inString) {
            if (char === '(' || char === '<')
                argDepth++;
            else if (char === ')' || char === '>')
                argDepth--;
            else if (char === ',' && argDepth === constants_1.INITIAL_DEPTHS.ARGUMENT) {
                args.push({
                    value: currentArg.trim(),
                    start: argStartPos,
                    end: fullLinePos
                });
                currentArg = '';
                argStartPos = fullLinePos + constants_1.CHAR_OFFSETS.AFTER_COMMA;
                continue; // Skip adding comma to currentArg
            }
        }
        currentArg += char;
    }
    // Add the last argument if there is one
    if (currentArg.trim()) {
        args.push({
            value: currentArg.trim(),
            start: argStartPos,
            end: parenEnd
        });
    }
    return args;
}
/**
 * Validates that NULL is not passed to non-nullable parameters.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param functionsData - Map of function documentation
 * @param classesData - Map of class documentation
 * @param instanceDefinitions - Map of tracked instance definitions
 * @returns Array of diagnostic objects
 */
function validateNullAssignments(line, lineIndex, functionsData, classesData, instanceDefinitions) {
    const diagnostics = [];
    // Use centralized regex pattern
    const functionCallRegex = regex_patterns_1.IDENTIFIER_PATTERNS.FUNCTION_CALL;
    let match;
    while ((match = functionCallRegex.exec(line)) !== null) {
        if (match.index === undefined)
            continue;
        const funcName = match[1];
        const parenStart = match.index + match[0].length - constants_1.CHAR_OFFSETS.AFTER_DOT;
        // Extract arguments from the function call
        // Find matching closing paren
        let depth = 1; // Start at 1 because we're already inside the opening paren
        let argEnd = parenStart + constants_1.CHAR_OFFSETS.AFTER_OPEN_PAREN;
        while (depth > 0 && argEnd < line.length) {
            const char = line[argEnd];
            if (char === '(')
                depth++;
            else if (char === ')')
                depth--;
            argEnd++;
        }
        if (depth !== 0)
            continue; // Unclosed parentheses, skip
        // Parse arguments (split by comma, handling nested calls and generics)
        const args = parseFunctionArguments(line, parenStart, argEnd - constants_1.CHAR_OFFSETS.AFTER_DOT);
        // Check if this is a function call
        if (functionsData[funcName]) {
            const funcInfo = functionsData[funcName];
            const signature = funcInfo.signature || '';
            const params = (0, type_utils_1.extractParameterTypes)(signature);
            // Check each argument against its corresponding parameter
            for (let i = 0; i < args.length && i < params.length; i++) {
                const arg = args[i];
                const param = params[i];
                const diag = createNullAssignmentDiagnostic(lineIndex, arg, line, param, i, '');
                if (diag) {
                    diagnostics.push(diag);
                }
            }
        }
        // Check if this is a method call: object.method(...)
        const beforeCall = line.substring(constants_1.DEFAULT_POSITIONS.START_OF_LINE, match.index).trim();
        const methodMatch = beforeCall.match(/(\w+)\s*\.\s*$/);
        if (methodMatch) {
            const instanceName = methodMatch[constants_1.INDICES.SECOND];
            const className = (0, type_resolving_1.resolveClassName)(instanceName, instanceDefinitions);
            if (className && classesData[className] && classesData[className].methods && classesData[className].methods[funcName]) {
                const methodInfo = classesData[className].methods[funcName];
                const signature = methodInfo.signature || '';
                const params = (0, type_utils_1.extractParameterTypes)(signature);
                // Check each argument against its corresponding parameter
                for (let i = 0; i < args.length && i < params.length; i++) {
                    const arg = args[i];
                    const param = params[i];
                    const diag = createNullAssignmentDiagnostic(lineIndex, arg, line, param, i, `method ${className}.${funcName}`);
                    if (diag) {
                        diagnostics.push(diag);
                    }
                }
            }
        }
    }
    return diagnostics;
}
//# sourceMappingURL=null-assignments.js.map