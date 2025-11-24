// ============================================================================
// METHOD AND PROPERTY CALL VALIDATION
// Validates that method and property calls reference documented class members
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { resolveClassName } from '../utils/type-resolving';
import { IDENTIFIER_PATTERNS, TEXT_PROCESSING_PATTERNS, ERROR_MESSAGES } from '../config/config';
import { ClassInfo } from '../config/types';
import { createDiagnostic } from '../utils/diagnostics';

/**
 * Validates method and property calls on class instances.
 */
export function validateMethodOrPropertyCall(
    line: string,
    lineIndex: number,
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, ClassInfo>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Validate method calls
    const methodPattern = IDENTIFIER_PATTERNS.METHOD_CALL;
    methodPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = methodPattern.exec(line)) !== null) {
        if (match.index === undefined) continue;
        
        const instanceName = match[1];
        const methodName = match[2];
        const className = resolveClassName(instanceName, instanceDefinitions);
        
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
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            lineIndex,
            startPos,
            startPos + methodName.length,
            ERROR_MESSAGES.METHOD_NOT_EXISTS(methodName, className)
        ));
    }
    
    // Validate property access
    const propertyPattern = IDENTIFIER_PATTERNS.PROPERTY_ACCESS;
    propertyPattern.lastIndex = 0;
    
    while ((match = propertyPattern.exec(line)) !== null) {
        if (match.index === undefined) continue;
        
        const instanceName = match[1];
        const propertyName = match[2];
        const afterMatch = line.substring(match.index + match[0].length);
        
        // Skip partial identifiers (user still typing)
        if (afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) {
            continue;
        }
        
        // For properties, ensure valid terminator
        if (afterMatch.length > 0 && !TEXT_PROCESSING_PATTERNS.VALID_TERMINATOR.test(afterMatch)) {
            continue;
        }
        
        const className = resolveClassName(instanceName, instanceDefinitions);
        
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
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            lineIndex,
            startPos,
            startPos + propertyName.length,
            ERROR_MESSAGES.PROPERTY_NOT_EXISTS(propertyName, className)
        ));
    }
    
    return diagnostics;
}

