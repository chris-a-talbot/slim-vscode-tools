"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReferencesProvider = registerReferencesProvider;
const vscode_languageserver_1 = require("vscode-languageserver");
/**
 * Registers the references provider for Find All References
 */
function registerReferencesProvider(context) {
    const { connection, documents } = context;
    connection.onReferences((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return [];
        const text = document.getText();
        const position = params.position;
        // Get the word at cursor position
        const word = getWordAtPosition(text, position);
        if (!word)
            return [];
        // Find all references to this word
        const references = findReferences(text, word, params.textDocument.uri, params.context.includeDeclaration);
        return references;
    });
}
/**
 * Gets the word at a specific position in the document
 */
function getWordAtPosition(text, position) {
    const lines = text.split('\n');
    if (position.line >= lines.length)
        return null;
    const line = lines[position.line];
    const character = position.character;
    // Find word boundaries
    let start = character;
    let end = character;
    // Word characters: letters, numbers, underscore
    const wordChar = /[a-zA-Z0-9_]/;
    // Move start back to beginning of word
    while (start > 0 && wordChar.test(line[start - 1])) {
        start--;
    }
    // Move end forward to end of word
    while (end < line.length && wordChar.test(line[end])) {
        end++;
    }
    if (start === end)
        return null;
    return line.substring(start, end);
}
/**
 * Finds all references to a word in the document
 */
function findReferences(text, word, uri, includeDeclaration) {
    const references = [];
    const lines = text.split('\n');
    // Create regex for word boundaries to avoid partial matches
    // \b ensures we match whole words only
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Skip comments (simple heuristic)
        const commentIndex = line.indexOf('//');
        const searchText = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        // Find all matches in this line
        wordPattern.lastIndex = 0; // Reset regex state
        let match;
        while ((match = wordPattern.exec(searchText)) !== null) {
            const matchIndex = match.index;
            // Check if this is a declaration or a reference
            const isDeclaration = isDefinitionContext(searchText, word, matchIndex);
            // Skip declarations if not requested
            if (isDeclaration && !includeDeclaration) {
                continue;
            }
            // Skip if it's in a string literal (simple heuristic)
            if (isInStringLiteral(searchText, matchIndex)) {
                continue;
            }
            references.push(vscode_languageserver_1.Location.create(uri, vscode_languageserver_1.Range.create(lineIndex, matchIndex, lineIndex, matchIndex + word.length)));
        }
    }
    return references;
}
/**
 * Checks if a word occurrence is in a definition context
 */
function isDefinitionContext(line, word, index) {
    // Get text before the word
    const before = line.substring(0, index).trim();
    const after = line.substring(index + word.length).trim();
    // Check for various definition patterns
    // Variable assignment: word = ...
    if (after.startsWith('=') && !after.startsWith('==')) {
        // Make sure it's not a comparison in a longer expression
        // Simple heuristic: if there's no operator before, it's likely an assignment
        if (!before.match(/[+\-*/<>!&|]$/)) {
            return true;
        }
    }
    // Function definition: function word(...)
    if (before.endsWith('function')) {
        return true;
    }
    // defineConstant("word", ...)
    if (before.includes('defineConstant') && line.includes(`"${word}"`)) {
        return true;
    }
    // initializeMutationType("word", ...)
    if (before.match(/initializeMutationType\s*\(\s*["']$/)) {
        return true;
    }
    // initializeGenomicElementType("word", ...)
    if (before.match(/initializeGenomicElementType\s*\(\s*["']$/)) {
        return true;
    }
    // initializeInteractionType("word", ...)
    if (before.match(/initializeInteractionType\s*\(\s*["']$/)) {
        return true;
    }
    // sim.addSubpop("word", ...)
    if (before.match(/addSubpop\s*\(\s*["']$/)) {
        return true;
    }
    // initializeSpecies("word", ...)
    if (before.match(/initializeSpecies\s*\(\s*["']$/)) {
        return true;
    }
    // For loop: for (word in ...)
    if (before.match(/for\s*\(\s*$/) && after.startsWith(' in ')) {
        return true;
    }
    return false;
}
/**
 * Checks if a position is inside a string literal
 */
function isInStringLiteral(line, index) {
    // Count quotes before this position
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < index; i++) {
        const char = line[i];
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
        }
    }
    return inString;
}
/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=references.js.map