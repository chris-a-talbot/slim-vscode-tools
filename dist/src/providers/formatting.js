"use strict";
// ============================================================================
// CODE FORMATTING PROVIDER
// This file contains the code to format code according to SLiMgui formatting rules.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenizeSLiM = tokenizeSLiM;
exports.formatSLiMCode = formatSLiMCode;
exports.registerFormattingProvider = registerFormattingProvider;
const regex_patterns_1 = require("../config/regex-patterns");
const constants_1 = require("../config/constants");
/**
 * Simple tokenizer for basic formatting (doesn't need full Eidos parser).
 * @param text - The text to tokenize
 * @returns Array of token objects with type, value, and start position
 */
function tokenizeSLiM(text) {
    const tokens = [];
    let i = 0;
    const len = text.length;
    while (i < len) {
        // Skip whitespace (we'll handle it separately)
        if (regex_patterns_1.TEXT_PROCESSING_PATTERNS.WHITESPACE.test(text[i])) {
            i++;
            continue;
        }
        // Comments
        if (text[i] === '/' && text[i + 1] === '/') {
            const start = i;
            while (i < len && text[i] !== '\n' && text[i] !== '\r') {
                i++;
            }
            tokens.push({ type: 'comment', value: text.substring(start, i), start });
            continue;
        }
        // String literals
        if (text[i] === '"' || text[i] === "'") {
            const quote = text[i];
            const start = i;
            i++; // Skip opening quote
            while (i < len) {
                if (text[i] === '\\' && i + 1 < len) {
                    i += 2; // Skip escaped character
                }
                else if (text[i] === quote) {
                    i++;
                    break;
                }
                else {
                    i++;
                }
            }
            tokens.push({ type: 'string', value: text.substring(start, i), start });
            continue;
        }
        // Numbers
        if (regex_patterns_1.TEXT_PROCESSING_PATTERNS.DIGIT.test(text[i]) || (text[i] === '.' && regex_patterns_1.TEXT_PROCESSING_PATTERNS.DIGIT.test(text[i + 1]))) {
            const start = i;
            while (i < len && (regex_patterns_1.TEXT_PROCESSING_PATTERNS.NUMBER.test(text[i]) || (text[i] === '.' && regex_patterns_1.TEXT_PROCESSING_PATTERNS.DIGIT.test(text[i + 1])))) {
                i++;
            }
            tokens.push({ type: 'number', value: text.substring(start, i), start });
            continue;
        }
        // Multi-character operators
        const twoCharOps = ['==', '!=', '<=', '>=', '&&', '||', '<-', '->'];
        let matched = false;
        for (const op of twoCharOps) {
            if (text.substring(i, i + op.length) === op) {
                tokens.push({ type: 'operator', value: op, start: i });
                i += op.length;
                matched = true;
                break;
            }
        }
        if (matched)
            continue;
        // Single character operators and punctuation
        if (regex_patterns_1.TEXT_PROCESSING_PATTERNS.OPERATOR_PUNCTUATION.test(text[i])) {
            tokens.push({ type: 'operator', value: text[i], start: i });
            i++;
            continue;
        }
        // Identifiers and keywords
        if (regex_patterns_1.TEXT_PROCESSING_PATTERNS.IDENTIFIER_START.test(text[i])) {
            const start = i;
            while (i < len && regex_patterns_1.TEXT_PROCESSING_PATTERNS.IDENTIFIER_CHAR.test(text[i])) {
                i++;
            }
            const value = text.substring(start, i);
            const isKeyword = constants_1.CONTROL_FLOW_KEYWORDS.includes(value);
            tokens.push({
                type: isKeyword ? 'keyword' : 'identifier',
                value,
                start
            });
            continue;
        }
        // Unknown character - skip it
        i++;
    }
    return tokens;
}
/**
 * Formats SLiM code roughly according to SLiMgui formatting rules.
 * Handles indentation based on braces and control flow, preserving comments and string literals.
 * @param text - The code to format
 * @param options - Formatting options
 * @returns The formatted code
 */
function formatSLiMCode(text, options) {
    const tabSize = options.tabSize || 4;
    const insertSpaces = options.insertSpaces !== false; // Default to spaces (VS Code preference)
    const lines = text.split(/\r?\n/);
    const formattedLines = [];
    // Indent stack: tracks braces and control-flow keywords
    // Stack items: '{', 'if', 'else', 'for', 'while', 'do', '?' (ternary - doesn't generate indent)
    const indentStack = [];
    let statementStart = true; // Are we starting a new statement?
    let inTernary = false;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const trimmed = line.trim();
        // Handle empty lines
        if (!trimmed) {
            formattedLines.push('');
            continue;
        }
        // Extract comment
        let codePart = trimmed;
        let commentPart = '';
        const commentIndex = trimmed.indexOf('//');
        if (commentIndex >= 0) {
            codePart = trimmed.substring(0, commentIndex).trim();
            commentPart = trimmed.substring(commentIndex);
        }
        // Tokenize (even if codePart is empty, we might have a comment)
        const tokens = tokenizeSLiM(codePart);
        // Calculate indentation for this line based on CURRENT stack state
        // First, handle closing braces (they reduce indent for THIS line)
        let closeBraces = 0;
        let openBraces = 0;
        for (const token of tokens) {
            if (token.value === '}')
                closeBraces++;
            if (token.value === '{')
                openBraces++;
        }
        // Pop from real stack for closing braces (they affect indent for this line)
        for (let i = 0; i < closeBraces; i++) {
            // Pop until we find a {
            while (indentStack.length > 0 && indentStack[indentStack.length - 1] !== '{') {
                indentStack.pop();
            }
            if (indentStack.length > 0) {
                indentStack.pop(); // Pop the {
            }
        }
        // Calculate current indent level based on current stack state
        // Count items in stack excluding ternary '?'
        let currentIndent = indentStack.filter(item => item !== '?').length;
        // Determine what this line ends with (for determining if next line is a continuation)
        const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
        const lineEndsWithSemicolon = lastToken && lastToken.value === ';';
        const lineEndsWithCloseBrace = lastToken && lastToken.value === '}';
        const lineEndsWithOpenBrace = tokens.length > 0 && tokens[tokens.length - 1].value === '{';
        const lineEndsWithComment = commentPart !== '';
        // Check if line ends with a function call (identifier followed by closing paren)
        let lineEndsWithFunctionCall = false;
        if (tokens.length >= 2) {
            const secondLast = tokens[tokens.length - 2];
            const last = tokens[tokens.length - 1];
            if (secondLast.type === 'identifier' && last.value === ')' && !lineEndsWithSemicolon) {
                lineEndsWithFunctionCall = true;
            }
        }
        // Special case: If line starts with { and last item is control-flow, outdent one level
        // (because control-flow + brace should only count as one indent)
        if (tokens.length > 0 && tokens[0].value === '{' && indentStack.length > 0) {
            const lastItem = indentStack[indentStack.length - 1];
            if (['if', 'else', 'for', 'while', 'do'].includes(lastItem)) {
                currentIndent = Math.max(0, currentIndent - 1);
            }
        }
        // Special case: Continuation indent (for multi-line statements outside braces)
        // Only add if:
        // - Not starting a new statement
        // - Not ending with ;, }, comment, or function call
        // - Not inside a brace block (last item is not {)
        // - Last item is not a control-flow keyword
        // IMPORTANT: Never add continuation indent when inside braces - braces already provide indent
        const isContinuation = !statementStart &&
            !lineEndsWithSemicolon &&
            !lineEndsWithCloseBrace &&
            !lineEndsWithComment &&
            !lineEndsWithFunctionCall;
        // Check if we're inside a brace block
        const isInsideBraces = indentStack.length > 0 && indentStack[indentStack.length - 1] === '{';
        if (isContinuation && indentStack.length > 0 && !isInsideBraces) {
            const lastItem = indentStack[indentStack.length - 1];
            // Only add continuation indent if we're NOT in control-flow and NOT ternary
            if (lastItem !== '?' && !['if', 'else', 'for', 'while', 'do'].includes(lastItem)) {
                currentIndent++;
            }
        }
        // Create indentation (use same indent for comments as for code)
        const indent = insertSpaces
            ? ' '.repeat(currentIndent * tabSize)
            : '\t'.repeat(currentIndent);
        // Format the line
        let formattedLine = codePart;
        if (commentPart) {
            formattedLine = codePart ? `${codePart} ${commentPart}` : commentPart;
        }
        formattedLines.push(indent + formattedLine);
        // Update state for next line - process tokens to update indent stack
        let sawSemicolon = false;
        let sawOpenBrace = false;
        let sawCloseBrace = false;
        let pendingElseIf = false;
        // Check if there's a { anywhere on this line (for control-flow + brace detection)
        const hasBraceOnLine = tokens.some(t => t.value === '{');
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = i + 1 < tokens.length ? tokens[i + 1] : null;
            if (token.type === 'keyword') {
                if (['if', 'for', 'while', 'do'].includes(token.value)) {
                    // Check if this is part of an else-if
                    if (pendingElseIf && token.value === 'if') {
                        pendingElseIf = false;
                        // else-if: don't push anything, the else was already removed
                        // Check if there's a { on this line
                        if (hasBraceOnLine) {
                            // Don't push - brace will be pushed
                        }
                        else {
                            indentStack.push('if');
                        }
                    }
                    else {
                        // Regular control-flow
                        // Check if there's a { on this line (anywhere, not just next token)
                        if (hasBraceOnLine) {
                            // Control-flow + brace: only push the brace (special case - don't double-indent)
                            // Don't push the control-flow keyword - it will be removed when we process the {
                        }
                        else {
                            // Control-flow without brace: push it
                            indentStack.push(token.value);
                        }
                    }
                }
                else if (token.value === 'else') {
                    // Check if followed by if
                    if (nextToken && nextToken.value === 'if') {
                        // else-if: remove else from stack if present
                        if (indentStack.length > 0 && indentStack[indentStack.length - 1] === 'else') {
                            indentStack.pop();
                        }
                        pendingElseIf = true;
                    }
                    else {
                        // Regular else: push it
                        indentStack.push('else');
                    }
                }
            }
            else if (token.value === '{') {
                sawOpenBrace = true;
                // If the last item on stack is a control-flow keyword, remove it
                // (control-flow + brace on same line should only count as one indent)
                if (indentStack.length > 0) {
                    const lastItem = indentStack[indentStack.length - 1];
                    if (['if', 'else', 'for', 'while', 'do'].includes(lastItem)) {
                        indentStack.pop();
                    }
                }
                // Push the brace
                indentStack.push('{');
            }
            else if (token.value === '}') {
                sawCloseBrace = true;
                // Already handled above (popped from stack before processing tokens)
            }
            else if (token.value === ';') {
                sawSemicolon = true;
                // In SLiM/Eidos, a semicolon always ends a statement.
                // For control-flow without braces (if/for/while/do), the statement ends at the semicolon,
                // so we should pop the control-flow keyword from the stack.
                // This ensures sequential if statements are at the same indentation level.
                // Check if there's an else after this semicolon in remaining tokens
                const hasElseAfter = tokens.slice(i + 1).some(t => t.value === 'else');
                // Pop control-flow tokens from the top of stack
                // Always do this, even if we're inside braces (the control-flow is complete)
                while (indentStack.length > 0) {
                    const top = indentStack[indentStack.length - 1];
                    if (top === '{')
                        break; // Don't pop braces
                    if (top === 'if' && hasElseAfter) {
                        break; // Keep if if else follows
                    }
                    if (['if', 'for', 'while', 'do'].includes(top)) {
                        indentStack.pop();
                        break; // Only pop one control-flow keyword (the most recent one)
                    }
                    // If it's not a control-flow keyword, stop
                    break;
                }
                // Semicolon always ends a statement, so next line starts a new statement
                // This is handled by statementStart update at end of loop
            }
            else if (token.value === '?') {
                inTernary = true;
                indentStack.push('?'); // On stack but doesn't generate indent
            }
            else if (token.value === ':' && inTernary) {
                // Ternary else - remove ? from stack
                if (indentStack.length > 0 && indentStack[indentStack.length - 1] === '?') {
                    indentStack.pop();
                }
                inTernary = false;
            }
        }
        // Update statement start for next line
        // A statement starts after: ;, {, }, or if line ends with comment/function call
        // IMPORTANT: Also start a new statement if line ends with opening brace (next line is inside block)
        statementStart = sawSemicolon || sawOpenBrace || sawCloseBrace || lineEndsWithComment || lineEndsWithFunctionCall || lineEndsWithOpenBrace;
    }
    return formattedLines.join('\n');
}
/**
 * Registers the document formatting provider handler.
 * @param context - The language server context
 */
function registerFormattingProvider(context) {
    const { connection, documents } = context;
    connection.onDocumentFormatting((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const text = document.getText();
        const formatted = formatSLiMCode(text, {
            tabSize: params.options.tabSize || 4,
            insertSpaces: params.options.insertSpaces !== false
        });
        const lines = text.split('\n');
        return [{
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: document.lineCount - 1, character: lines[document.lineCount - 1]?.length || 0 }
                },
                newText: formatted
            }];
    });
}
//# sourceMappingURL=formatting.js.map