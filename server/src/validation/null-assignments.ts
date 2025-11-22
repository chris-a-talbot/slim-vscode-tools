// ============================================================================
// NULL ASSIGNMENT VALIDATION
// This file contains the code to validate NULL assignments to non-nullable parameters.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostic-factory';
import { isNullableType, extractParameterTypes, ParameterInfo } from '../utils/type-utils';
import { resolveClassName } from '../utils/type-resolving';
import { isEscapedQuote } from '../utils/text-processing';
import { CHAR_OFFSETS, PARAMETER_INDEX_OFFSET, INITIAL_DEPTHS, DEFAULT_POSITIONS, INDICES, ERROR_MESSAGES } from '../config/constants';
import { IDENTIFIER_PATTERNS, TEXT_PROCESSING_PATTERNS } from '../config/regex-patterns';
import { FunctionData, ClassInfo, ArgumentInfo } from '../types';

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
function createNullAssignmentDiagnostic(
    lineIndex: number,
    arg: ArgumentInfo,
    line: string,
    param: ParameterInfo,
    paramIndex: number,
    context: string = ''
): Diagnostic | null {
    const argValue = arg.value.trim();
    
    // Check if argument is NULL
    if (argValue !== 'NULL' && argValue !== 'null') {
        return null;
    }
    
    // Check if parameter type is non-nullable
    if (isNullableType(param.type)) {
        return null;
    }
    
    // Find the actual position of NULL in the argument
    const argText = line.substring(arg.start, arg.end);
    const nullMatch = argText.match(TEXT_PROCESSING_PATTERNS.NULL_KEYWORD);
    if (!nullMatch || nullMatch.index === undefined) {
        return null;
    }
    
    const nullStart = arg.start + nullMatch.index;
    const nullEnd = nullStart + nullMatch[0].length;
    const paramName = param.name || `parameter ${paramIndex + PARAMETER_INDEX_OFFSET}`;
    const typeName = param.type.replace(TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX, '');
    const message = ERROR_MESSAGES.NULL_TO_NON_NULLABLE(paramName, typeName, context);
    
    return createDiagnostic(
        DiagnosticSeverity.Error,
        lineIndex,
        nullStart,
        nullEnd,
        message
    );
}

/**
 * Parses function call arguments from a line, handling nested calls, generics, and strings.
 * @param line - The full line containing the function call
 * @param parenStart - The index of the opening parenthesis
 * @param parenEnd - The index of the closing parenthesis
 * @returns Array of argument objects
 */
function parseFunctionArguments(line: string, parenStart: number, parenEnd: number): ArgumentInfo[] {
    const argString = line.substring(parenStart + CHAR_OFFSETS.AFTER_OPEN_PAREN, parenEnd);
    const args: ArgumentInfo[] = [];
    let currentArg = '';
    let argStartPos = parenStart + CHAR_OFFSETS.AFTER_OPEN_PAREN;
    let argDepth = INITIAL_DEPTHS.ARGUMENT;
    let inString = false;
    let stringChar: string | null = null;
    
    for (let i = 0; i < argString.length; i++) {
        const char = argString[i];
        const fullLinePos = parenStart + CHAR_OFFSETS.AFTER_OPEN_PAREN + i;
        const isEscaped = isEscapedQuote(argString, i);
        
        if (!inString && (char === '"' || char === "'") && !isEscaped) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && !isEscaped) {
            inString = false;
            stringChar = null;
        } else if (!inString) {
            if (char === '(' || char === '<') argDepth++;
            else if (char === ')' || char === '>') argDepth--;
            else if (char === ',' && argDepth === INITIAL_DEPTHS.ARGUMENT) {
                args.push({
                    value: currentArg.trim(),
                    start: argStartPos,
                    end: fullLinePos
                });
                currentArg = '';
                argStartPos = fullLinePos + CHAR_OFFSETS.AFTER_COMMA;
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
export function validateNullAssignments(
    line: string,
    lineIndex: number,
    functionsData: Record<string, FunctionData>,
    classesData: Record<string, ClassInfo>,
    instanceDefinitions: Record<string, string>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Use centralized regex pattern
    const functionCallRegex = IDENTIFIER_PATTERNS.FUNCTION_CALL;
    let match: RegExpMatchArray | null;
    
    while ((match = functionCallRegex.exec(line)) !== null) {
        if (match.index === undefined) continue;
        const funcName = match[1];
        const parenStart = match.index + match[0].length - CHAR_OFFSETS.AFTER_DOT;
        
        // Extract arguments from the function call
        // Find matching closing paren
        let depth = 1; // Start at 1 because we're already inside the opening paren
        let argEnd = parenStart + CHAR_OFFSETS.AFTER_OPEN_PAREN;
        while (depth > 0 && argEnd < line.length) {
            const char = line[argEnd];
            if (char === '(') depth++;
            else if (char === ')') depth--;
            argEnd++;
        }
        
        if (depth !== 0) continue; // Unclosed parentheses, skip
        
        // Parse arguments (split by comma, handling nested calls and generics)
        const args = parseFunctionArguments(line, parenStart, argEnd - CHAR_OFFSETS.AFTER_DOT);
        
        // Check if this is a function call
        if (functionsData[funcName]) {
            const funcInfo = functionsData[funcName];
            const signature = funcInfo.signature || '';
            const params = extractParameterTypes(signature);
            
            // Check each argument against its corresponding parameter
            for (let i = 0; i < args.length && i < params.length; i++) {
                const arg = args[i];
                const param = params[i];
                const diag = createNullAssignmentDiagnostic(
                    lineIndex, 
                    arg, 
                    line, 
                    param, 
                    i,
                    ''
                );
                if (diag) {
                    diagnostics.push(diag);
                }
            }
        }
        
        // Check if this is a method call: object.method(...)
        const beforeCall = line.substring(DEFAULT_POSITIONS.START_OF_LINE, match.index).trim();
        const methodMatch = beforeCall.match(/(\w+)\s*\.\s*$/);
        if (methodMatch) {
            const instanceName = methodMatch[INDICES.SECOND];
            const className = resolveClassName(instanceName, instanceDefinitions);
            
            if (className && classesData[className] && classesData[className].methods && classesData[className].methods[funcName]) {
                const methodInfo = classesData[className].methods[funcName];
                const signature = methodInfo.signature || '';
                const params = extractParameterTypes(signature);
                
                // Check each argument against its corresponding parameter
                for (let i = 0; i < args.length && i < params.length; i++) {
                    const arg = args[i];
                    const param = params[i];
                    const diag = createNullAssignmentDiagnostic(
                        lineIndex, 
                        arg, 
                        line, 
                        param, 
                        i,
                        `method ${className}.${funcName}`
                    );
                    if (diag) {
                        diagnostics.push(diag);
                    }
                }
            }
        }
    }
    
    return diagnostics;
}

