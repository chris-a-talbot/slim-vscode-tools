"use strict";
// ============================================================================
// METHOD AND PROPERTY CALL VALIDATION
// Validates that method and property calls reference documented class members
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMethodOrPropertyCall = validateMethodOrPropertyCall;
const vscode_languageserver_1 = require("vscode-languageserver");
const type_resolving_1 = require("../utils/type-resolving");
const config_1 = require("../config/config");
const diagnostics_1 = require("../utils/diagnostics");
/**
 * Validates method and property calls on class instances.
 */
function validateMethodOrPropertyCall(line, lineIndex, instanceDefinitions, classesData) {
    const diagnostics = [];
    // Validate method calls
    const methodPattern = config_1.IDENTIFIER_PATTERNS.METHOD_CALL;
    methodPattern.lastIndex = 0;
    let match;
    while ((match = methodPattern.exec(line)) !== null) {
        if (match.index === undefined)
            continue;
        const instanceName = match[1];
        const methodName = match[2];
        const className = (0, type_resolving_1.resolveClassName)(instanceName, instanceDefinitions);
        if (!className || !classesData[className]) {
            continue;
        }
        const classInfo = classesData[className];
        // Check if method exists on the class
        if (classInfo.methods?.[methodName]) {
            continue;
        }
        // Check if method exists on Object base class
        const objectClass = classesData['Object'];
        if (objectClass?.methods?.[methodName]) {
            continue;
        }
        // Create diagnostic for unknown method
        const startPos = match.index + instanceName.length + 1; // +1 for dot
        diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startPos, startPos + methodName.length, config_1.ERROR_MESSAGES.METHOD_NOT_EXISTS(methodName, className)));
    }
    // Validate property access
    const propertyPattern = config_1.IDENTIFIER_PATTERNS.PROPERTY_ACCESS;
    propertyPattern.lastIndex = 0;
    while ((match = propertyPattern.exec(line)) !== null) {
        if (match.index === undefined)
            continue;
        const instanceName = match[1];
        const propertyName = match[2];
        const afterMatch = line.substring(match.index + match[0].length);
        // Skip partial identifiers (user still typing)
        if (afterMatch.length > 0 && config_1.TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) {
            continue;
        }
        // For properties, ensure valid terminator
        if (afterMatch.length > 0 && !config_1.TEXT_PROCESSING_PATTERNS.VALID_TERMINATOR.test(afterMatch)) {
            continue;
        }
        const className = (0, type_resolving_1.resolveClassName)(instanceName, instanceDefinitions);
        if (!className || !classesData[className]) {
            continue;
        }
        const classInfo = classesData[className];
        // Check if property exists on the class
        if (classInfo.properties?.[propertyName]) {
            continue;
        }
        // Check if property exists on Object base class
        const objectClass = classesData['Object'];
        if (objectClass?.properties?.[propertyName]) {
            continue;
        }
        // Create diagnostic for unknown property
        const startPos = match.index + instanceName.length + 1; // +1 for dot
        diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startPos, startPos + propertyName.length, config_1.ERROR_MESSAGES.PROPERTY_NOT_EXISTS(propertyName, className)));
    }
    return diagnostics;
}
//# sourceMappingURL=method-property.js.map