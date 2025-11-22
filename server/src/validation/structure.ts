// ============================================================================
// SCRIPT STRUCTURE VALIDATION
// This file contains the code to check for structural errors including unclosed strings and missing events.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostic-factory';
import { 
    parseCodeWithStringsAndComments, 
    countParenthesesIgnoringStringsAndComments,
    removeStringsFromLine 
} from '../utils/text-processing';
import { DEFAULT_POSITIONS, INITIAL_DEPTHS, CHAR_OFFSETS, INDICES } from '../config/constants';
import { EVENT_PATTERNS, CONTROL_FLOW_PATTERNS, TEXT_PROCESSING_PATTERNS } from '../config/regex-patterns';
import { ERROR_MESSAGES } from '../config/constants';
import { SemicolonResult } from '../types';

/**
 * Helper function to validate script structure
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
export function validateScriptStructure(text: string, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Check for unclosed string literals
    let stringStartLine: number = DEFAULT_POSITIONS.INVALID;
    let stringStartChar: number = DEFAULT_POSITIONS.INVALID;
    let inString = false;
    
    lines.forEach((line, lineIndex) => {
        parseCodeWithStringsAndComments(line, {}, (_char, state, position) => {
            // Track when we enter a string
            if (state.inString && !inString) {
                stringStartLine = lineIndex;
                stringStartChar = position;
            } else if (!state.inString && inString) {
                // String closed
                stringStartLine = DEFAULT_POSITIONS.INVALID;
                stringStartChar = DEFAULT_POSITIONS.INVALID;
            }
            inString = state.inString;
        });
        
        // Only report error on the last line if we're still in a string
        if (inString && lineIndex === lines.length - 1) {
            const startLine = stringStartLine >= DEFAULT_POSITIONS.START_OF_LINE ? stringStartLine : lineIndex;
            const startChar = stringStartChar >= DEFAULT_POSITIONS.START_OF_LINE ? stringStartChar : DEFAULT_POSITIONS.START_OF_LINE;
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                startLine,
                startChar,
                line.length,
                ERROR_MESSAGES.UNCLOSED_STRING
            ));
        }
    });
    
    // Check for required events (first, early, or late)
    // Use centralized regex patterns
    const hasEvent = EVENT_PATTERNS.STANDARD_EVENT.test(text) || 
                     EVENT_PATTERNS.SPECIES_EVENT.test(text);
    
    if (!hasEvent) {
        // Check if there are any initialize callbacks (if so, warn about missing events)
        if (EVENT_PATTERNS.INITIALIZE.test(text)) {
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                DEFAULT_POSITIONS.START_OF_FILE,
                DEFAULT_POSITIONS.START_OF_LINE,
                DEFAULT_POSITIONS.START_OF_LINE,
                ERROR_MESSAGES.NO_EIDOS_EVENT
            ));
        }
    }
    
    // Check for old syntax and event parameter errors in a single pass
    lines.forEach((line, lineIndex) => {
        // Check for deprecated syntax: "1 { ... }" without explicit event type
        // Old SLiM syntax allowed this, but modern syntax requires "1 early() { ... }"
        const oldSyntaxMatch = EVENT_PATTERNS.OLD_SYNTAX.test(line);
        // Verify it's not the new syntax by checking for event type keyword
        if (oldSyntaxMatch && !EVENT_PATTERNS.STANDARD_EVENT.test(line)) {
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                DEFAULT_POSITIONS.START_OF_LINE,
                line.length,
                ERROR_MESSAGES.OLD_SYNTAX
            ));
        }
        
        // Check for event parameter errors (early/late/first should have 0 parameters)
        // Events like "1 early()" must have empty parentheses - no parameters allowed
        // Pattern matches if there's anything between the parentheses
        const eventWithParams = EVENT_PATTERNS.EVENT_WITH_PARAMS.test(line);
        if (eventWithParams) {
            // Find the exact position of the event keyword for error reporting
            const eventMatch = line.match(EVENT_PATTERNS.EVENT_MATCH);
            if (eventMatch && eventMatch.index !== undefined) {
                const endChar = eventMatch.index + eventMatch[INDICES.FIRST].length - CHAR_OFFSETS.AFTER_DOT;
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

/**
 * Checks if a statement should have a semicolon.
 * @param line - The line to check
 * @param parenBalance - Current parenthesis balance
 * @returns Object with shouldMark boolean and updated parenBalance
 */
export function shouldHaveSemicolon(line: string, parenBalance: number = INITIAL_DEPTHS.PARENTHESIS): SemicolonResult {
    // Remove strings first (they could contain parentheses or other characters)
    const codeWithoutStrings = removeStringsFromLine(line);
    
    // Remove comments (strings already removed, so we can safely match // and /*)
    let codeOnly = codeWithoutStrings
        .replace(TEXT_PROCESSING_PATTERNS.SINGLE_LINE_COMMENT, '') // Single-line comments: // to end of line
        .replace(TEXT_PROCESSING_PATTERNS.MULTILINE_COMMENT, '') // Multi-line comments on same line: /* ... */
        .trim();
    
    // Count parentheses, ignoring any remaining comments
    const parenCounts = countParenthesesIgnoringStringsAndComments(codeOnly);
    const netParens = parenBalance + parenCounts.openCount - parenCounts.closeCount;
    
    // Check if line ends with safe characters (after removing strings/comments)
    const trimmedCode = codeOnly.trim();
    const isDefinitelySafe =
        trimmedCode.endsWith(';') ||  // Already has semicolon
        trimmedCode.endsWith('{') ||  // Opening brace (block start)
        trimmedCode.endsWith('}') ||  // Closing brace (block end)
        netParens > 0 ||  // Still inside function call/expression
        // Control flow statements that don't need semicolons
        CONTROL_FLOW_PATTERNS.CONTROL_FLOW_STATEMENT.test(trimmedCode) ||
        // Callback definitions: initialize() { ... }, fitness() { ... }
        CONTROL_FLOW_PATTERNS.CALLBACK_DEFINITION_STATEMENT.test(trimmedCode) ||
        // SLiM event blocks: "1 early()" or "s1 1 late()"
        CONTROL_FLOW_PATTERNS.SLIM_EVENT_BLOCK.test(trimmedCode) ||
        TEXT_PROCESSING_PATTERNS.COMMENT_LINE.test(line) ||  // Comment line (// or /*)
        TEXT_PROCESSING_PATTERNS.COMMENT_CONTINUATION.test(line) ||  // Continuation of multi-line comment
        TEXT_PROCESSING_PATTERNS.EMPTY_LINE.test(line);  // Empty line

    return {
        shouldMark: !isDefinitelySafe && netParens === INITIAL_DEPTHS.PARENTHESIS,
        parenBalance: netParens
    };
}

