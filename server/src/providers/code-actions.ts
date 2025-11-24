import {
    CodeAction,
    CodeActionKind,
    CodeActionParams,
    Diagnostic,
    WorkspaceEdit,
    TextEdit
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { ERROR_MESSAGES } from '../config/config';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function registerCodeActionProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onCodeAction((params: CodeActionParams): CodeAction[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        const codeActions: CodeAction[] = [];
        
        // Process each diagnostic in the current range (optimized - single pass)
        for (const diagnostic of params.context.diagnostics) {
            const actions = createCodeActionsForDiagnostic(
                diagnostic, 
                params, 
                document,
                context
            );
            codeActions.push(...actions);
        }

        // Add batch actions if multiple fixable diagnostics exist
        const batchActions = createBatchActions(params.context.diagnostics, document);
        codeActions.push(...batchActions);

        return codeActions;
    });
}

function createCodeActionsForDiagnostic(
    diagnostic: Diagnostic,
    _params: CodeActionParams,
    document: TextDocument,
    context: LanguageServerContext
): CodeAction[] {
    const actions: CodeAction[] = [];
    const message = diagnostic.message;
    const uri = document.uri;

    // Handle missing semicolon
    if (message.includes('missing a semicolon')) {
        actions.push(createAddSemicolonAction(diagnostic, uri));
    }

    // Handle method/property not exists errors - suggest alternatives
    if (message.includes('does not exist on')) {
        const suggestions = getSuggestionsForMissingMember(
            diagnostic,
            document,
            context
        );
        actions.push(...suggestions);
    }

    // Handle NULL assignment errors
    if (message.includes('NULL cannot be passed')) {
        const nullAction = createRemoveNullAction(diagnostic, document);
        if (nullAction) actions.push(nullAction);
    }

    // Handle unclosed string
    if (message.includes('Unclosed string literal')) {
        actions.push(createCloseStringAction(diagnostic, uri));
    }

    // Handle unexpected closing brace
    if (message === ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE) {
        actions.push(createRemoveBraceAction(diagnostic, uri));
    }

    // Handle unclosed brace(s)
    if (message.includes('Unclosed brace')) {
        actions.push(createAddClosingBraceAction(diagnostic, uri));
    }

    // Handle old syntax
    if (message.includes('Event type must be specified explicitly')) {
        actions.push(createFixOldSyntaxAction(diagnostic, document));
    }

    // Handle event parameters error
    if (message.includes('event needs 0 parameters')) {
        actions.push(createRemoveEventParamsAction(diagnostic, document));
    }

    // Handle reserved identifier errors
    if (message.includes('is reserved and cannot be used')) {
        actions.push(createRenameReservedIdentifierAction(diagnostic, document));
    }

    // Handle duplicate definitions
    if (message.includes('already defined')) {
        actions.push(createRemoveDuplicateAction(diagnostic, uri));
    }

    // Handle undefined references
    if (message.includes('may not be defined')) {
        actions.push(createAddDefinitionCommentAction(diagnostic, uri));
    }

    return actions;
}

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

function createRemoveNullAction(diagnostic: Diagnostic, document: TextDocument): CodeAction | null {
    const line = document.getText({
        start: { line: diagnostic.range.start.line, character: 0 },
        end: { line: diagnostic.range.start.line + 1, character: 0 }
    }).trimEnd();

    // Try to find and remove the NULL argument
    const nullRemovalEdit = findAndRemoveNull(line, diagnostic.range.start.line, document);
    if (!nullRemovalEdit) {
        // If we can't automatically remove it, suggest manual removal
        return {
            title: 'NULL cannot be passed to non-nullable parameter',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic]
        };
    }

    return {
        title: 'Remove NULL argument',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: nullRemovalEdit,
        isPreferred: true
    };
}

function findAndRemoveNull(line: string, lineNumber: number, document: TextDocument): WorkspaceEdit | null {
    // Look for NULL as an argument in a function call
    // Patterns: func(NULL), func(a, NULL), func(NULL, b), func(a, NULL, b)
    const nullPatterns = [
        { regex: /,\s*NULL\s*\)/g, replacement: ')' },           // trailing NULL: func(a, NULL)
        { regex: /\(\s*NULL\s*,/g, replacement: '(' },           // leading NULL: func(NULL, a)
        { regex: /,\s*NULL\s*,/g, replacement: ',' },            // middle NULL: func(a, NULL, b)
        { regex: /\(\s*NULL\s*\)/g, replacement: '()' }          // only arg: func(NULL)
    ];

    for (const pattern of nullPatterns) {
        if (pattern.regex.test(line)) {
            const newLine = line.replace(pattern.regex, pattern.replacement);
            return {
                changes: {
                    [document.uri]: [{
                        range: {
                            start: { line: lineNumber, character: 0 },
                            end: { line: lineNumber, character: line.length }
                        },
                        newText: newLine
                    }]
                }
            };
        }
    }

    return null;
}

function getSuggestionsForMissingMember(
    diagnostic: Diagnostic,
    document: TextDocument,
    context: LanguageServerContext
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

    // Get the class info from documentation service
    const { documentationService } = context;
    if (!documentationService) return actions;

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
            isMethod ? 'method' : 'property',
            document.uri
        ));
    }

    return actions;
}

function createRenameAction(
    diagnostic: Diagnostic,
    _wrongName: string,
    correctName: string,
    _type: 'method' | 'property',
    uri: string
): CodeAction {
    return {
        title: `Change to '${correctName}'`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [uri]: [{
                    range: diagnostic.range,
                    newText: correctName
                }]
            }
        },
        isPreferred: true
    };
}

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

function createAddClosingBraceAction(diagnostic: Diagnostic, uri: string): CodeAction {
    const line = diagnostic.range.start.line;
    
    return {
        title: 'Add closing brace',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [uri]: [{
                    range: {
                        start: { line: line + 1, character: 0 },
                        end: { line: line + 1, character: 0 }
                    },
                    newText: '}\n'
                }]
            }
        },
        isPreferred: true
    };
}

function createFixOldSyntaxAction(diagnostic: Diagnostic, document: TextDocument): CodeAction {
    const line = document.getText({
        start: { line: diagnostic.range.start.line, character: 0 },
        end: { line: diagnostic.range.start.line + 1, character: 0 }
    }).trimEnd();

    // Match pattern like "1 {" or "1000 {" and replace with "1 early() {"
    const match = line.match(/^(\s*)(\d+)(\s*)\{/);
    if (match) {
        const newText = `${match[1]}${match[2]} early() {`;
        return {
            title: 'Change to "early()" syntax',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: {
                changes: {
                    [document.uri]: [{
                        range: {
                            start: { line: diagnostic.range.start.line, character: 0 },
                            end: { line: diagnostic.range.start.line, character: line.length }
                        },
                        newText
                    }]
                }
            },
            isPreferred: true
        };
    }

    // Fallback generic action
    return {
        title: 'Fix event syntax',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic]
    };
}

function createRemoveEventParamsAction(diagnostic: Diagnostic, document: TextDocument): CodeAction {
    const line = document.getText({
        start: { line: diagnostic.range.start.line, character: 0 },
        end: { line: diagnostic.range.start.line + 1, character: 0 }
    }).trimEnd();

    // Match event with parameters like "early(param)" and change to "early()"
    const match = line.match(/^(.*(early|late|first)\s*\()[^)]+(\).*)$/);
    if (match) {
        const newText = `${match[1]}${match[3]}`;
        return {
            title: 'Remove event parameters',
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
            edit: {
                changes: {
                    [document.uri]: [{
                        range: {
                            start: { line: diagnostic.range.start.line, character: 0 },
                            end: { line: diagnostic.range.start.line, character: line.length }
                        },
                        newText
                    }]
                }
            },
            isPreferred: true
        };
    }

    return {
        title: 'Remove parameters from event',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic]
    };
}

function createRenameReservedIdentifierAction(diagnostic: Diagnostic, document: TextDocument): CodeAction {
    const line = document.getText({
        start: { line: diagnostic.range.start.line, character: diagnostic.range.start.character },
        end: { line: diagnostic.range.end.line, character: diagnostic.range.end.character }
    });

    // Suggest adding a suffix to make it non-reserved
    const newName = `${line}_val`;

    return {
        title: `Rename to '${newName}'`,
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [document.uri]: [{
                    range: diagnostic.range,
                    newText: newName
                }]
            }
        },
        isPreferred: true
    };
}

function createRemoveDuplicateAction(diagnostic: Diagnostic, uri: string): CodeAction {
    return {
        title: 'Remove duplicate definition',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [uri]: [{
                    range: {
                        start: { line: diagnostic.range.start.line, character: 0 },
                        end: { line: diagnostic.range.start.line + 1, character: 0 }
                    },
                    newText: ''
                }]
            }
        }
    };
}

function createAddDefinitionCommentAction(diagnostic: Diagnostic, uri: string): CodeAction {
    return {
        title: 'Add comment about missing definition',
        kind: CodeActionKind.QuickFix,
        diagnostics: [diagnostic],
        edit: {
            changes: {
                [uri]: [{
                    range: {
                        start: { line: diagnostic.range.start.line, character: 0 },
                        end: { line: diagnostic.range.start.line, character: 0 }
                    },
                    newText: '// TODO: Define this in the focal species\n'
                }]
            }
        }
    };
}

function createBatchActions(diagnostics: Diagnostic[], document: TextDocument): CodeAction[] {
    const actions: CodeAction[] = [];
    
    // Count fixable issues
    const semicolonErrors = diagnostics.filter(d => d.message.includes('missing a semicolon'));
    const braceErrors = diagnostics.filter(d => d.message === ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE);
    
    // Batch fix all missing semicolons
    if (semicolonErrors.length > 1) {
        const edits: TextEdit[] = semicolonErrors.map(diagnostic => ({
            range: {
                start: { line: diagnostic.range.end.line, character: diagnostic.range.end.character },
                end: { line: diagnostic.range.end.line, character: diagnostic.range.end.character }
            },
            newText: ';'
        }));

        actions.push({
            title: `Fix all ${semicolonErrors.length} missing semicolons`,
            kind: CodeActionKind.QuickFix,
            edit: {
                changes: {
                    [document.uri]: edits
                }
            }
        });
    }

    // Batch remove all unexpected braces
    if (braceErrors.length > 1) {
        const edits: TextEdit[] = braceErrors.map(diagnostic => ({
            range: diagnostic.range,
            newText: ''
        }));

        actions.push({
            title: `Remove all ${braceErrors.length} unexpected braces`,
            kind: CodeActionKind.QuickFix,
            edit: {
                changes: {
                    [document.uri]: edits
                }
            }
        });
    }

    return actions;
}

