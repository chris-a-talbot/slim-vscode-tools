import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Diagnostic,
    WorkspaceEdit
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { ERROR_MESSAGES } from '../config/config';

/**
 * Registers the code action provider for quick fixes and refactorings
 */
export function registerCodeActionProvider(context: LanguageServerContext): void {
    const { connection, documents, documentationService } = context;

    connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        const codeActions: CodeAction[] = [];
        
        // Process each diagnostic in the current range
        for (const diagnostic of params.context.diagnostics) {
            const actions = createCodeActionsForDiagnostic(diagnostic, params, document.uri);
            codeActions.push(...actions);
        }

        // Add available method/property suggestions for error diagnostics
        for (const diagnostic of params.context.diagnostics) {
            if (diagnostic.message.includes('does not exist on')) {
                const suggestions = getSuggestionsForMissingMember(
                    diagnostic,
                    document.getText(),
                    documentationService
                );
                codeActions.push(...suggestions);
            }
        }

        return codeActions;
    });
}

/**
 * Creates code actions for a specific diagnostic
 */
function createCodeActionsForDiagnostic(
    diagnostic: Diagnostic,
    _params: CodeActionParams,
    uri: string
): CodeAction[] {
    const actions: CodeAction[] = [];
    const message = diagnostic.message;

    // Handle missing semicolon
    if (message.includes('missing a semicolon')) {
        actions.push(createAddSemicolonAction(diagnostic, uri));
    }

    // Handle method not exists errors - handled in getSuggestionsForMissingMember
    // Handle property not exists errors - handled in getSuggestionsForMissingMember

    // Handle NULL assignment errors
    if (message.includes('NULL cannot be passed')) {
        actions.push(createRemoveNullAction(diagnostic, uri));
    }

    // Handle unclosed string
    if (message.includes('Unclosed string literal')) {
        actions.push(createCloseStringAction(diagnostic, uri));
    }

    // Handle unexpected closing brace
    if (message === ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE) {
        actions.push(createRemoveBraceAction(diagnostic, uri));
    }

    return actions;
}

/**
 * Creates a code action to add a semicolon
 */
function createAddSemicolonAction(diagnostic: Diagnostic, uri: string): CodeAction {
    const line = diagnostic.range.end.line;
    const character = diagnostic.range.end.character;

    const edit: WorkspaceEdit = {
        changes: {
            [uri]: [{
                range: {
                    start: { line, character },
                    end: { line, character }
                },
                newText: ';'
            }]
        }
    };

    return {
        title: 'Add semicolon',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Creates a code action to close an unclosed string
 */
function createCloseStringAction(diagnostic: Diagnostic, uri: string): CodeAction {
    const line = diagnostic.range.end.line;
    const character = diagnostic.range.end.character;

    const edit: WorkspaceEdit = {
        changes: {
            [uri]: [{
                range: {
                    start: { line, character },
                    end: { line, character }
                },
                newText: '"'
            }]
        }
    };

    return {
        title: 'Close string with "',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit,
        isPreferred: true
    };
}

/**
 * Creates a code action to remove an unexpected closing brace
 */
function createRemoveBraceAction(diagnostic: Diagnostic, uri: string): CodeAction {
    const edit: WorkspaceEdit = {
        changes: {
            [uri]: [{
                range: diagnostic.range,
                newText: ''
            }]
        }
    };

    return {
        title: 'Remove unexpected closing brace',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit
    };
}

/**
 * Creates a code action to remove NULL argument
 */
function createRemoveNullAction(diagnostic: Diagnostic, uri: string): CodeAction {
    return {
        title: 'Remove NULL argument',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        // Note: This would need more context to properly remove the argument
        // For now, just mark it as available
        command: {
            title: 'Remove NULL argument',
            command: 'slim.removeNullArgument',
            arguments: [uri, diagnostic.range]
        }
    };
}

/**
 * Gets suggestions for missing methods or properties
 */
function getSuggestionsForMissingMember(
    diagnostic: Diagnostic,
    _documentText: string,
    documentationService: any
): CodeAction[] {
    const actions: CodeAction[] = [];
    const message = diagnostic.message;

    // Parse the error message to extract method/property name and class name
    let wrongName: string | undefined;
    let className: string | undefined;
    let isMethod = false;

    const methodMatch = message.match(/Method '([^']+)' does not exist on (\w+)/);
    if (methodMatch) {
        [, wrongName, className] = methodMatch;
        isMethod = true;
    } else {
        const propertyMatch = message.match(/Property '([^']+)' does not exist on (\w+)/);
        if (propertyMatch) {
            [, wrongName, className] = propertyMatch;
            isMethod = false;
        }
    }

    if (!wrongName || !className) return actions;

    // Get the class info
    const classesData = documentationService.getClasses();
    const classInfo = classesData[className];
    if (!classInfo) return actions;

    // Find similar names using Levenshtein-like similarity
    const availableNames = isMethod
        ? Object.keys(classInfo.methods || {})
        : Object.keys(classInfo.properties || {});

    // Also check Object base class
    const objectClass = classesData['Object'];
    if (objectClass) {
        const objectNames = isMethod
            ? Object.keys(objectClass.methods || {})
            : Object.keys(objectClass.properties || {});
        availableNames.push(...objectNames);
    }

    // Find similar names
    const suggestions = findSimilarNames(wrongName, availableNames);

    // Create code actions for top suggestions
    for (const suggestion of suggestions.slice(0, 3)) {
        actions.push(createRenameAction(
            diagnostic,
            wrongName,
            suggestion,
            isMethod ? 'method' : 'property'
        ));
    }

    return actions;
}

/**
 * Creates a code action to rename a method or property
 */
function createRenameAction(
    diagnostic: Diagnostic,
    _wrongName: string,
    correctName: string,
    _type: 'method' | 'property'
): CodeAction {
    return {
        title: `Change to '${correctName}'`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [diagnostic.range.start.line.toString()]: [{
                    range: diagnostic.range,
                    newText: correctName
                }]
            }
        }
    };
}

/**
 * Finds similar names using simple string similarity
 */
function findSimilarNames(target: string, candidates: string[]): string[] {
    const targetLower = target.toLowerCase();
    
    // Score each candidate
    const scored = candidates.map(candidate => {
        const candidateLower = candidate.toLowerCase();
        let score = 0;

        // Exact match (shouldn't happen, but just in case)
        if (targetLower === candidateLower) score += 1000;

        // Starts with same letters
        if (candidateLower.startsWith(targetLower.substring(0, 3))) score += 50;

        // Contains target
        if (candidateLower.includes(targetLower)) score += 30;

        // Target contains candidate
        if (targetLower.includes(candidateLower)) score += 20;

        // Levenshtein distance (simple version)
        const distance = levenshteinDistance(targetLower, candidateLower);
        score += Math.max(0, 20 - distance);

        return { name: candidate, score };
    });

    // Sort by score and return names
    return scored
        .filter(s => s.score > 10) // Only return reasonably similar names
        .sort((a, b) => b.score - a.score)
        .map(s => s.name);
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

