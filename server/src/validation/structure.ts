import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostics';
import { 
    parseCodeWithStringsAndComments, 
    countParenthesesIgnoringStringsAndComments,
    removeStringsFromLine 
} from '../utils/text-processing';
import { EVENT_PATTERNS, CONTROL_FLOW_PATTERNS, TEXT_PROCESSING_PATTERNS } from '../config/config';
import { ERROR_MESSAGES } from '../config/config';

export function validateScriptStructure(text: string, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    let stringStartLine: number = -1;
    let stringStartChar: number = -1;
    let inString = false;
    
    lines.forEach((line, lineIndex) => {
        parseCodeWithStringsAndComments(line, {}, (_char, state, position) => {
            if (state.inString && !inString) {
                stringStartLine = lineIndex;
                stringStartChar = position;
            } else if (!state.inString && inString) {
                stringStartLine = -1;
                stringStartChar = -1;
            }
            inString = state.inString;
        });
        
        if (inString && lineIndex === lines.length - 1) {
            const startLine = stringStartLine >= 0 ? stringStartLine : lineIndex;
            const startChar = stringStartChar >= 0 ? stringStartChar : 0;
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                startLine,
                startChar,
                line.length,
                ERROR_MESSAGES.UNCLOSED_STRING
            ));
        }
    });
    
    const hasEvent = EVENT_PATTERNS.STANDARD_EVENT.test(text) || 
                     EVENT_PATTERNS.SPECIES_EVENT.test(text);
    
    if (!hasEvent && EVENT_PATTERNS.INITIALIZE.test(text)) {
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            0,
            0,
            0,
            ERROR_MESSAGES.NO_EIDOS_EVENT
        ));
    }
    
    lines.forEach((line, lineIndex) => {
        const oldSyntaxMatch = EVENT_PATTERNS.OLD_SYNTAX.test(line);
        if (oldSyntaxMatch && !EVENT_PATTERNS.STANDARD_EVENT.test(line)) {
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                0,
                line.length,
                ERROR_MESSAGES.OLD_SYNTAX
            ));
        }
        
        const eventWithParams = EVENT_PATTERNS.EVENT_WITH_PARAMS.test(line);
        if (eventWithParams) {
            const eventMatch = line.match(EVENT_PATTERNS.EVENT_MATCH);
            if (eventMatch && eventMatch.index !== undefined) {
                const endChar = eventMatch.index + eventMatch[0].length - 1;
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    eventMatch.index,
                    endChar,
                    ERROR_MESSAGES.EVENT_PARAMETERS(eventMatch[1])
                ));
            }
        }
    });
    
    return diagnostics;
}

export function shouldHaveSemicolon(line: string, parenBalance: number = 0): { shouldMark: boolean; parenBalance: number } {
    const codeWithoutStrings = removeStringsFromLine(line);
    
    let codeOnly = codeWithoutStrings
        .replace(TEXT_PROCESSING_PATTERNS.SINGLE_LINE_COMMENT, '')
        .replace(TEXT_PROCESSING_PATTERNS.MULTILINE_COMMENT, '')
        .trim();
    
    const parenCounts = countParenthesesIgnoringStringsAndComments(codeOnly);
    const netParens = parenBalance + parenCounts.openCount - parenCounts.closeCount;
    
    const trimmedCode = codeOnly.trim();
    const isDefinitelySafe =
        trimmedCode.endsWith(';') ||
        trimmedCode.endsWith('{') ||
        trimmedCode.endsWith('}') ||
        netParens > 0 ||
        CONTROL_FLOW_PATTERNS.CONTROL_FLOW_STATEMENT.test(trimmedCode) ||
        CONTROL_FLOW_PATTERNS.CALLBACK_DEFINITION_STATEMENT.test(trimmedCode) ||
        CONTROL_FLOW_PATTERNS.SLIM_EVENT_BLOCK.test(trimmedCode) ||
        TEXT_PROCESSING_PATTERNS.COMMENT_LINE.test(line) ||
        TEXT_PROCESSING_PATTERNS.COMMENT_CONTINUATION.test(line) ||
        TEXT_PROCESSING_PATTERNS.EMPTY_LINE.test(line);

    return {
        shouldMark: !isDefinitelySafe && netParens === 0,
        parenBalance: netParens
    };
}