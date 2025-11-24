"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRenameProvider = registerRenameProvider;
const vscode_languageserver_1 = require("vscode-languageserver");
const config_1 = require("../config/config");
/**
 * Registers the rename provider for symbol renaming
 */
function registerRenameProvider(context) {
    const { connection, documents } = context;
    // Prepare rename - validates the symbol before allowing rename
    connection.onPrepareRename((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const text = document.getText();
        const position = params.position;
        // Get the word at cursor position
        const wordInfo = getWordAtPositionWithRange(text, position);
        if (!wordInfo)
            return null;
        // Check if this is a renameable symbol
        if (config_1.RESERVED_IDENTIFIERS.has(wordInfo.word)) {
            // Return error for reserved identifiers
            throw new vscode_languageserver_1.ResponseError(1, `Cannot rename reserved identifier '${wordInfo.word}'`);
        }
        // Return the range of the symbol to rename
        return {
            range: wordInfo.range,
            placeholder: wordInfo.word
        };
    });
    // Perform rename
    connection.onRenameRequest((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const text = document.getText();
        const position = params.position;
        const newName = params.newName;
        // Validate new name
        if (!isValidIdentifier(newName)) {
            throw new vscode_languageserver_1.ResponseError(1, `'${newName}' is not a valid identifier`);
        }
        if (config_1.RESERVED_IDENTIFIERS.has(newName)) {
            throw new vscode_languageserver_1.ResponseError(1, `'${newName}' is a reserved identifier`);
        }
        // Get the word at cursor position
        const wordInfo = getWordAtPositionWithRange(text, position);
        if (!wordInfo)
            return null;
        const oldName = wordInfo.word;
        // Find all occurrences to rename
        const edits = findRenameLocations(text, oldName, params.textDocument.uri);
        // Return workspace edit
        const workspaceEdit = {
            changes: {
                [params.textDocument.uri]: edits.map(range => ({
                    range,
                    newText: newName
                }))
            }
        };
        return workspaceEdit;
    });
}
/**
 * Gets the word at a specific position along with its range
 */
function getWordAtPositionWithRange(text, position) {
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
    const word = line.substring(start, end);
    const range = vscode_languageserver_1.Range.create(position.line, start, position.line, end);
    return { word, range };
}
/**
 * Finds all locations where a symbol should be renamed
 */
function findRenameLocations(text, oldName, _uri) {
    const locations = [];
    const lines = text.split('\n');
    // Create regex for word boundaries to avoid partial matches
    const wordPattern = new RegExp(`\\b${escapeRegex(oldName)}\\b`, 'g');
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
            // Check if it's in a string literal (but include string literals that are identifiers in function calls)
            if (isInStringLiteral(searchText, matchIndex)) {
                // Check if this string is an identifier in a definition context
                // e.g., defineConstant("K", ...) or sim.addSubpop("p1", ...)
                if (!isIdentifierStringInDefinition(searchText, oldName, matchIndex)) {
                    continue;
                }
            }
            locations.push(vscode_languageserver_1.Range.create(lineIndex, matchIndex, lineIndex, matchIndex + oldName.length));
        }
    }
    return locations;
}
/**
 * Checks if a symbol name in quotes is an identifier in a definition context
 */
function isIdentifierStringInDefinition(line, _name, index) {
    const before = line.substring(0, index).trim();
    // Check for definition patterns that use quoted identifiers
    const definitionPatterns = [
        /defineConstant\s*\(\s*["']$/,
        /initializeMutationType\s*\(\s*["']$/,
        /initializeGenomicElementType\s*\(\s*["']$/,
        /initializeInteractionType\s*\(\s*["']$/,
        /addSubpop\s*\(\s*["']$/,
        /initializeSpecies\s*\(\s*["']$/,
        /registerEarlyEvent\s*\([^,]*,\s*[^,]*,\s*[^,]*,\s*["']$/,
        /registerLateEvent\s*\([^,]*,\s*[^,]*,\s*[^,]*,\s*["']$/,
        /registerFirstEvent\s*\([^,]*,\s*[^,]*,\s*[^,]*,\s*["']$/,
    ];
    return definitionPatterns.some(pattern => pattern.test(before));
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
 * Validates if a string is a valid identifier
 */
function isValidIdentifier(name) {
    // Must start with letter or underscore
    // Can contain letters, numbers, underscores
    const identifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return identifierPattern.test(name);
}
/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=rename.js.map