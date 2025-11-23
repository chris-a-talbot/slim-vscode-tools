"use strict";
// ============================================================================
// METHOD AND PROPERTY CALL VALIDATION
// This file contains the code to validate method and property calls.
// This includes checking that methods and properties exist on classes.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMethodOrPropertyCall = validateMethodOrPropertyCall;
const vscode_languageserver_1 = require("vscode-languageserver");
const type_resolving_1 = require("../utils/type-resolving");
const constants_1 = require("../config/constants");
const regex_patterns_1 = require("../config/regex-patterns");
const validation_framework_1 = require("./validation-framework");
/**
 * Validates method and property calls on class instances.
 * @param line - The line of code to validate
 * @param lineIndex - The line index (0-based)
 * @param instanceDefinitions - Map of tracked instance definitions
 * @param classesData - Map of class documentation
 * @returns Array of diagnostic objects
 */
function validateMethodOrPropertyCall(line, lineIndex, instanceDefinitions, classesData) {
    const validationContext = {
        instanceDefinitions,
        classesData
    };
    return (0, validation_framework_1.validateMultiplePatterns)(line, lineIndex, [
        // Method call validation
        {
            pattern: regex_patterns_1.IDENTIFIER_PATTERNS.METHOD_CALL,
            extractIdentifier: (match) => match[constants_1.INDICES.THIRD], // method name
            shouldSkip: (ctx) => {
                // Skip method calls when validating properties
                if (regex_patterns_1.TEXT_PROCESSING_PATTERNS.OPEN_PAREN_AFTER_WS.test(ctx.afterMatch)) {
                    return true;
                }
                // Skip partial identifiers
                if (ctx.afterMatch.length > 0 && regex_patterns_1.TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                    return true;
                }
                return false;
            },
            shouldValidate: (methodName, ctx, vCtx) => {
                const instanceName = ctx.match[constants_1.INDICES.SECOND];
                const className = (0, type_resolving_1.resolveClassName)(instanceName, vCtx.instanceDefinitions);
                if (!className || !vCtx.classesData[className]) {
                    return false; // Unknown class, skip validation
                }
                const classInfo = vCtx.classesData[className];
                // Check if method exists on the class
                if (classInfo.methods?.[methodName]) {
                    return false; // Method exists, skip validation
                }
                // Check if method exists on Object base class (all objects inherit from Object)
                const objectClass = vCtx.classesData['Object'];
                if (objectClass && objectClass.methods?.[methodName]) {
                    return false; // Method exists on Object, skip validation
                }
                return true; // Method doesn't exist, validate
            },
            createDiagnostic: (methodName, ctx, vCtx) => {
                const instanceName = ctx.match[constants_1.INDICES.SECOND];
                const className = (0, type_resolving_1.resolveClassName)(instanceName, vCtx.instanceDefinitions);
                if (!className)
                    return null;
                const startPos = ctx.matchStart + ctx.match[constants_1.INDICES.SECOND].length + constants_1.CHAR_OFFSETS.AFTER_DOT;
                return (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, methodName, { ...ctx, matchStart: startPos }, constants_1.ERROR_MESSAGES.METHOD_NOT_EXISTS(methodName, className), 0);
            }
        },
        // Property access validation
        {
            pattern: regex_patterns_1.IDENTIFIER_PATTERNS.PROPERTY_ACCESS,
            extractIdentifier: (match) => match[constants_1.INDICES.THIRD], // property name
            shouldSkip: (ctx) => {
                // Skip partial identifiers
                if (ctx.afterMatch.length > 0 && regex_patterns_1.TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(ctx.afterMatch)) {
                    return true;
                }
                // For properties, ensure valid terminator
                if (ctx.afterMatch.length > 0 && !regex_patterns_1.TEXT_PROCESSING_PATTERNS.VALID_TERMINATOR.test(ctx.afterMatch)) {
                    return true;
                }
                return false;
            },
            shouldValidate: (propertyName, ctx, vCtx) => {
                const instanceName = ctx.match[constants_1.INDICES.SECOND];
                const className = (0, type_resolving_1.resolveClassName)(instanceName, vCtx.instanceDefinitions);
                if (!className || !vCtx.classesData[className]) {
                    return false; // Unknown class, skip validation
                }
                const classInfo = vCtx.classesData[className];
                // Check if property exists on the class
                if (classInfo.properties?.[propertyName]) {
                    return false; // Property exists, skip validation
                }
                // Check if property exists on Object base class (all objects inherit from Object)
                const objectClass = vCtx.classesData['Object'];
                if (objectClass && objectClass.properties?.[propertyName]) {
                    return false; // Property exists on Object, skip validation
                }
                return true; // Property doesn't exist, validate
            },
            createDiagnostic: (propertyName, ctx, vCtx) => {
                const instanceName = ctx.match[constants_1.INDICES.SECOND];
                const className = (0, type_resolving_1.resolveClassName)(instanceName, vCtx.instanceDefinitions);
                if (!className)
                    return null;
                const startPos = ctx.matchStart + ctx.match[constants_1.INDICES.SECOND].length + constants_1.CHAR_OFFSETS.AFTER_DOT;
                return (0, validation_framework_1.createStandardDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, propertyName, { ...ctx, matchStart: startPos }, constants_1.ERROR_MESSAGES.PROPERTY_NOT_EXISTS(propertyName, className), 0);
            }
        }
    ], validationContext);
}
//# sourceMappingURL=method-property.js.map