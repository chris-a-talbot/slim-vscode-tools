import {
    InlayHint,
    InlayHintKind,
    InlayHintParams,
    Position
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { trackInstanceDefinitions } from '../utils/instance';
import { inferTypeFromExpression } from '../utils/type-manager';
import { DEFINITION_PATTERNS } from '../config/config';

export function registerInlayHintsProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.languages.inlayHint.on((params: InlayHintParams): InlayHint[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) {
            return [];
        }

        const text = document.getText();
        const hints: InlayHint[] = [];

        // Track all instance definitions in the document
        const trackingState = trackInstanceDefinitions(document);

        // Get lines in the requested range
        const lines = text.split('\n');
        const startLine = params.range.start.line;
        const endLine = params.range.end.line;

        for (let lineIndex = startLine; lineIndex <= endLine && lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            // Add hints for variable assignments with inferred types
            hints.push(...getTypeHintsForLine(line, lineIndex, trackingState));
        }

        return hints;
    });
}

function getTypeHintsForLine(
    line: string,
    lineIndex: number,
    trackingState: any
): InlayHint[] {
    const hints: InlayHint[] = [];

    // Pattern: variable = expression;
    const assignmentMatch = line.match(DEFINITION_PATTERNS.ASSIGNMENT);
    if (assignmentMatch) {
        const varName = assignmentMatch[1];
        const expression = assignmentMatch[2].trim();

        // Check if we have a tracked type for this variable
        const trackedType = trackingState.instanceDefinitions[varName];
        if (trackedType) {
            // Find position after the variable name
            const varIndex = line.indexOf(varName);
            if (varIndex !== -1) {
                hints.push({
                    position: Position.create(lineIndex, varIndex + varName.length),
                    label: `: ${trackedType}`,
                    kind: InlayHintKind.Type,
                    paddingLeft: false,
                    paddingRight: true
                });
            }
        } else {
            // Try to infer type from expression
            const inferredType = inferTypeFromExpression(expression);
            if (inferredType) {
                const varIndex = line.indexOf(varName);
                if (varIndex !== -1) {
                    hints.push({
                        position: Position.create(lineIndex, varIndex + varName.length),
                        label: `: ${inferredType}`,
                        kind: InlayHintKind.Type,
                        paddingLeft: false,
                        paddingRight: true
                    });
                }
            }
        }
    }

    // Pattern: for (x in collection)
    const forInMatch = line.match(/for\s*\(\s*(\w+)\s+in\s+([^)]+)\)/);
    if (forInMatch) {
        const varName = forInMatch[1];
        const collection = forInMatch[2].trim();
        
        // Try to infer element type from collection
        const collectionType = inferTypeFromExpression(collection);
        if (collectionType) {
            const varIndex = line.indexOf(varName);
            if (varIndex !== -1) {
                // Show hint for loop variable
                hints.push({
                    position: Position.create(lineIndex, varIndex + varName.length),
                    label: `: ${collectionType}`,
                    kind: InlayHintKind.Type,
                    paddingLeft: false,
                    paddingRight: true
                });
            }
        }
    }

    return hints;
}

