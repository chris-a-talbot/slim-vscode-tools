"use strict";
// ============================================================================
// SCRIPT STRUCTURE VALIDATION
// This file contains the code to check for structural errors including unclosed strings and missing events.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScriptStructure = validateScriptStructure;
exports.shouldHaveSemicolon = shouldHaveSemicolon;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostics_1 = require("../utils/diagnostics");
const text_1 = require("../utils/text");
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const config_3 = require("../config/config");
/**
 * Helper function to validate script structure
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
function validateScriptStructure(text, lines) {
    const diagnostics = [];
    // Check for unclosed string literals
    let stringStartLine = config_1.DEFAULT_POSITIONS.INVALID;
    let stringStartChar = config_1.DEFAULT_POSITIONS.INVALID;
    let inString = false;
    lines.forEach((line, lineIndex) => {
        (0, text_1.parseCodeWithStringsAndComments)(line, {}, (_char, state, position) => {
            // Track when we enter a string
            if (state.inString && !inString) {
                stringStartLine = lineIndex;
                stringStartChar = position;
            }
            else if (!state.inString && inString) {
                // String closed
                stringStartLine = config_1.DEFAULT_POSITIONS.INVALID;
                stringStartChar = config_1.DEFAULT_POSITIONS.INVALID;
            }
            inString = state.inString;
        });
        // Only report error on the last line if we're still in a string
        if (inString && lineIndex === lines.length - 1) {
            const startLine = stringStartLine >= config_1.DEFAULT_POSITIONS.START_OF_LINE ? stringStartLine : lineIndex;
            const startChar = stringStartChar >= config_1.DEFAULT_POSITIONS.START_OF_LINE ? stringStartChar : config_1.DEFAULT_POSITIONS.START_OF_LINE;
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, startLine, startChar, line.length, config_3.ERROR_MESSAGES.UNCLOSED_STRING));
        }
    });
    // Check for required events (first, early, or late)
    // Use centralized regex patterns
    const hasEvent = config_2.EVENT_PATTERNS.STANDARD_EVENT.test(text) ||
        config_2.EVENT_PATTERNS.SPECIES_EVENT.test(text);
    if (!hasEvent) {
        // Check if there are any initialize callbacks (if so, warn about missing events)
        if (config_2.EVENT_PATTERNS.INITIALIZE.test(text)) {
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, config_1.DEFAULT_POSITIONS.START_OF_FILE, config_1.DEFAULT_POSITIONS.START_OF_LINE, config_1.DEFAULT_POSITIONS.START_OF_LINE, config_3.ERROR_MESSAGES.NO_EIDOS_EVENT));
        }
    }
    // Check for old syntax and event parameter errors in a single pass
    lines.forEach((line, lineIndex) => {
        // Check for deprecated syntax: "1 { ... }" without explicit event type
        // Old SLiM syntax allowed this, but modern syntax requires "1 early() { ... }"
        const oldSyntaxMatch = config_2.EVENT_PATTERNS.OLD_SYNTAX.test(line);
        // Verify it's not the new syntax by checking for event type keyword
        if (oldSyntaxMatch && !config_2.EVENT_PATTERNS.STANDARD_EVENT.test(line)) {
            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, config_1.DEFAULT_POSITIONS.START_OF_LINE, line.length, config_3.ERROR_MESSAGES.OLD_SYNTAX));
        }
        // Check for event parameter errors (early/late/first should have 0 parameters)
        // Events like "1 early()" must have empty parentheses - no parameters allowed
        // Pattern matches if there's anything between the parentheses
        const eventWithParams = config_2.EVENT_PATTERNS.EVENT_WITH_PARAMS.test(line);
        if (eventWithParams) {
            // Find the exact position of the event keyword for error reporting
            const eventMatch = line.match(config_2.EVENT_PATTERNS.EVENT_MATCH);
            if (eventMatch && eventMatch.index !== undefined) {
                const endChar = eventMatch.index + eventMatch[config_1.INDICES.FIRST].length - config_1.CHAR_OFFSETS.AFTER_DOT;
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, eventMatch.index, endChar, config_3.ERROR_MESSAGES.EVENT_PARAMETERS(eventMatch[1])));
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
function shouldHaveSemicolon(line, parenBalance = config_1.INITIAL_DEPTHS.PARENTHESIS) {
    // Remove strings first (they could contain parentheses or other characters)
    const codeWithoutStrings = (0, text_1.removeStringsFromLine)(line);
    // Remove comments (strings already removed, so we can safely match // and /*)
    let codeOnly = codeWithoutStrings
        .replace(config_2.TEXT_PROCESSING_PATTERNS.SINGLE_LINE_COMMENT, '') // Single-line comments: // to end of line
        .replace(config_2.TEXT_PROCESSING_PATTERNS.MULTILINE_COMMENT, '') // Multi-line comments on same line: /* ... */
        .trim();
    // Count parentheses, ignoring any remaining comments
    const parenCounts = (0, text_1.countParenthesesIgnoringStringsAndComments)(codeOnly);
    const netParens = parenBalance + parenCounts.openCount - parenCounts.closeCount;
    // Check if line ends with safe characters (after removing strings/comments)
    const trimmedCode = codeOnly.trim();
    const isDefinitelySafe = trimmedCode.endsWith(';') || // Already has semicolon
        trimmedCode.endsWith('{') || // Opening brace (block start)
        trimmedCode.endsWith('}') || // Closing brace (block end)
        netParens > 0 || // Still inside function call/expression
        // Control flow statements that don't need semicolons
        config_2.CONTROL_FLOW_PATTERNS.CONTROL_FLOW_STATEMENT.test(trimmedCode) ||
        // Callback definitions: initialize() { ... }, fitness() { ... }
        config_2.CONTROL_FLOW_PATTERNS.CALLBACK_DEFINITION_STATEMENT.test(trimmedCode) ||
        // SLiM event blocks: "1 early()" or "s1 1 late()"
        config_2.CONTROL_FLOW_PATTERNS.SLIM_EVENT_BLOCK.test(trimmedCode) ||
        config_2.TEXT_PROCESSING_PATTERNS.COMMENT_LINE.test(line) || // Comment line (// or /*)
        config_2.TEXT_PROCESSING_PATTERNS.COMMENT_CONTINUATION.test(line) || // Continuation of multi-line comment
        config_2.TEXT_PROCESSING_PATTERNS.EMPTY_LINE.test(line); // Empty line
    return {
        shouldMark: !isDefinitelySafe && netParens === config_1.INITIAL_DEPTHS.PARENTHESIS,
        parenBalance: netParens
    };
}
//# sourceMappingURL=structure.js.map