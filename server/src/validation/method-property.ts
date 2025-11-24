import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { resolveClassName } from '../utils/type-manager';
import { IDENTIFIER_PATTERNS, TEXT_PROCESSING_PATTERNS, ERROR_MESSAGES } from '../config/config';
import { ClassInfo } from '../config/types';
import { createDiagnostic } from '../utils/diagnostics';

export function validateMethodOrPropertyCall(
    line: string,
    lineIndex: number,
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, ClassInfo>
): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    const methodPattern = IDENTIFIER_PATTERNS.METHOD_CALL;
    methodPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    
    while ((match = methodPattern.exec(line)) !== null) {
        const instanceName = match[1];
        const methodName = match[2];
        const className = resolveClassName(instanceName, instanceDefinitions);
        
        if (!className || !classesData[className]) continue;
        
        const classInfo = classesData[className];
        
        if (classInfo.methods?.[methodName]) continue;
        
        const objectClass = classesData['Object'];
        if (objectClass?.methods?.[methodName]) continue;
        
        const startPos = match.index! + instanceName.length + 1;
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            lineIndex,
            startPos,
            startPos + methodName.length,
            ERROR_MESSAGES.METHOD_NOT_EXISTS(methodName, className)
        ));
    }
    
    const propertyPattern = IDENTIFIER_PATTERNS.PROPERTY_ACCESS;
    propertyPattern.lastIndex = 0;
    
    while ((match = propertyPattern.exec(line)) !== null) {
        const instanceName = match[1];
        const propertyName = match[2];
        const afterMatch = line.substring(match.index! + match[0].length);
        
        if (afterMatch.length > 0 && TEXT_PROCESSING_PATTERNS.WORD_CHAR.test(afterMatch)) continue;
        if (afterMatch.length > 0 && !TEXT_PROCESSING_PATTERNS.VALID_TERMINATOR.test(afterMatch)) continue;
        
        const className = resolveClassName(instanceName, instanceDefinitions);
        
        if (!className || !classesData[className]) continue;
        
        const classInfo = classesData[className];
        
        if (classInfo.properties?.[propertyName]) continue;
        
        const objectClass = classesData['Object'];
        if (objectClass?.properties?.[propertyName]) continue;
        
        const startPos = match.index! + instanceName.length + 1;
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

