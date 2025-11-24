"use strict";
// ============================================================================
// CODE FORMATTING PROVIDER
// Basic code formatting with brace-based indentation
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSLiMCode = formatSLiMCode;
exports.registerFormattingProvider = registerFormattingProvider;
/**
 * Removes comments and strings from a line for brace counting.
 */
function stripCommentsAndStrings(line) {
    let result = '';
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : '';
        // Handle strings
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            continue;
        }
        if (inString && char === stringChar && line[i - 1] !== '\\') {
            inString = false;
            continue;
        }
        if (inString)
            continue;
        // Handle comments
        if (char === '/' && nextChar === '/')
            break;
        result += char;
    }
    return result;
}
/**
 * Formats SLiM code with basic brace-based indentation.
 */
function formatSLiMCode(text, options) {
    const tabSize = options.tabSize || 4;
    const insertSpaces = options.insertSpaces !== false;
    const indentString = insertSpaces ? ' '.repeat(tabSize) : '\t';
    const lines = text.split(/\r?\n/);
    const formattedLines = [];
    let indentLevel = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        // Empty lines
        if (!trimmed) {
            formattedLines.push('');
            continue;
        }
        // Comment-only lines
        if (trimmed.startsWith('//')) {
            formattedLines.push(indentString.repeat(indentLevel) + trimmed);
            continue;
        }
        // Extract code part (remove inline comments)
        let codePart = trimmed;
        let commentPart = '';
        const commentIndex = trimmed.indexOf('//');
        if (commentIndex >= 0) {
            codePart = trimmed.substring(0, commentIndex).trim();
            commentPart = ' ' + trimmed.substring(commentIndex);
        }
        // Count braces (ignoring strings and comments)
        const cleaned = stripCommentsAndStrings(codePart);
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        // Dedent for closing braces at start
        if (trimmed.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        // Format line
        const formatted = indentString.repeat(indentLevel) + codePart + commentPart;
        formattedLines.push(formatted);
        // Update indent level
        indentLevel += openBraces - closeBraces;
        indentLevel = Math.max(0, indentLevel);
    }
    return formattedLines.join('\n');
}
/**
 * Registers the document formatting provider handler.
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