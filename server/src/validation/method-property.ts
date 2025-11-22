// ============================================================================
// METHOD AND PROPERTY CALL VALIDATION
// This file contains the code to validate method and property calls.
// This includes checking that methods and properties exist on classes.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { resolveClassName } from '../utils/type-resolving';
import { CHAR_OFFSETS, INDICES, ERROR_MESSAGES } from '../config/constants';
import { IDENTIFIER_PATTERNS, TEXT_PROCESSING_PATTERNS } from '../config/regex-patterns';
import { ClassInfo } from '../types';
import { validateMultiplePatterns, createStandardDiagnostic } from './validation-framework';

/**
 * Validation context for method/property calls
 */
interface MethodPropertyContext {
    instanceDefinitions: Record<string, string>;
    classesData: Record<string, ClassInfo>;
}

/**
 * Validates method and property calls on class instances.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param instanceDefinitions - Map of tracked instance definitions
 * @param classesData - Map of class documentation
 * @returns Array of diagnostic objects
 */
export function validateMethodOrPropertyCall(
    line: string,
    lineIndex: number,
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, ClassInfo>
): Diagnostic[] {
    const validationContext: MethodPropertyContext = {
        instanceDefinitions,
        classesData
    };
    
    return validateMultiplePatterns(line, lineIndex, [
        // Method call validation
        {
            pattern: IDENTIFIER_PATTERNS.METHOD_CALL,
            extractIdentifier: (match) => match[INDICES.THIRD], // method name
            shouldSkip: (ctx) => {
                // Skip method calls when validating properties
                if (TEXT_PROCESSING_PATTERNS.OPEN_PAREN_AFTER_WS.test(ctx.afterMatch)) {
                    return true;
                }
                
                // Skip partial identifiers
                if (ctx.afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                    return true;
                }
                
                return false;
            },
            shouldValidate: (methodName, ctx, vCtx) => {
                const instanceName = ctx.match[INDICES.SECOND];
                const className = resolveClassName(instanceName, vCtx.instanceDefinitions);
                
                if (!className || !vCtx.classesData[className]) {
                    return false; // Unknown class, skip validation
                }
                
                const classInfo = vCtx.classesData[className];
                return !classInfo.methods?.[methodName]; // Validate if method doesn't exist
            },
            createDiagnostic: (methodName, ctx, vCtx) => {
                const instanceName = ctx.match[INDICES.SECOND];
                const className = resolveClassName(instanceName, vCtx.instanceDefinitions);
                
                if (!className) return null;
                
                const startPos = ctx.matchStart + ctx.match[INDICES.SECOND].length + CHAR_OFFSETS.AFTER_DOT;
                return createStandardDiagnostic(
                    DiagnosticSeverity.Error,
                    methodName,
                    { ...ctx, matchStart: startPos },
                    ERROR_MESSAGES.METHOD_NOT_EXISTS(methodName, className),
                    0
                );
            }
        },
        
        // Property access validation
        {
            pattern: IDENTIFIER_PATTERNS.PROPERTY_ACCESS,
            extractIdentifier: (match) => match[INDICES.THIRD], // property name
            shouldSkip: (ctx) => {
                // Skip partial identifiers
                if (ctx.afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                    return true;
                }
                
                // For properties, ensure valid terminator
                if (ctx.afterMatch.length > 0 && !TEXT_PROCESSING_PATTERNS.VALID_TERMINATOR.test(ctx.afterMatch)) {
                    return true;
                }
                
                return false;
            },
            shouldValidate: (propertyName, ctx, vCtx) => {
                const instanceName = ctx.match[INDICES.SECOND];
                const className = resolveClassName(instanceName, vCtx.instanceDefinitions);
                
                if (!className || !vCtx.classesData[className]) {
                    return false; // Unknown class, skip validation
                }
                
                const classInfo = vCtx.classesData[className];
                return !classInfo.properties?.[propertyName]; // Validate if property doesn't exist
            },
            createDiagnostic: (propertyName, ctx, vCtx) => {
                const instanceName = ctx.match[INDICES.SECOND];
                const className = resolveClassName(instanceName, vCtx.instanceDefinitions);
                
                if (!className) return null;
                
                const startPos = ctx.matchStart + ctx.match[INDICES.SECOND].length + CHAR_OFFSETS.AFTER_DOT;
                return createStandardDiagnostic(
                    DiagnosticSeverity.Error,
                    propertyName,
                    { ...ctx, matchStart: startPos },
                    ERROR_MESSAGES.PROPERTY_NOT_EXISTS(propertyName, className),
                    0
                );
            }
        }
    ], validationContext);
}

