import {
    DocumentHighlight,
    DocumentHighlightKind,
    DocumentHighlightParams,
    Position,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';

export function registerDocumentHighlightsProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onDocumentHighlight((params: DocumentHighlightParams): DocumentHighlight[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        const text = document.getText();
        const position = params.position;
        
        // Get the word at cursor position
        const word = getWordAtPosition(text, position);
        if (!word) return [];

        // Find all occurrences of this word
        const highlights = findHighlights(text, word);
        
        return highlights;
    });
}

function getWordAtPosition(text: string, position: Position): string | null {
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;

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

    if (start === end) return null;

    return line.substring(start, end);
}

function findHighlights(text: string, word: string): DocumentHighlight[] {
    const highlights: DocumentHighlight[] = [];
    const lines = text.split('\n');
    
    // Create regex for word boundaries to match whole words only
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Skip content after comments
        const commentIndex = line.indexOf('//');
        const searchText = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        
        // Find all matches in this line
        wordPattern.lastIndex = 0; // Reset regex state
        let match: RegExpExecArray | null;
        
        while ((match = wordPattern.exec(searchText)) !== null) {
            const matchIndex = match.index;
            
            // Skip if it's in a string literal
            if (isInStringLiteral(searchText, matchIndex)) {
                continue;
            }
            
            // Determine highlight kind based on context
            const kind = getHighlightKind(searchText, word, matchIndex);
            
            highlights.push({
                range: Range.create(
                    lineIndex, matchIndex,
                    lineIndex, matchIndex + word.length
                ),
                kind: kind
            });
        }
    }

    return highlights;
}

function getHighlightKind(line: string, word: string, index: number): DocumentHighlightKind {
    const before = line.substring(0, index).trim();
    const after = line.substring(index + word.length).trim();
    
    // Check if this is a write context (definition or assignment)
    
    // Variable assignment: word = ...
    if (after.startsWith('=') && !after.startsWith('==')) {
        if (!before.match(/[+\-*/<>!&|]$/)) {
            return DocumentHighlightKind.Write;
        }
    }
    
    // Function definition: function word(...)
    if (before.endsWith('function')) {
        return DocumentHighlightKind.Write;
    }
    
    // defineConstant("word", ...)
    if (before.includes('defineConstant') && line.includes(`"${word}"`)) {
        return DocumentHighlightKind.Write;
    }
    
    // initializeMutationType("word", ...)
    if (before.match(/initializeMutationType\s*\(\s*["']$/)) {
        return DocumentHighlightKind.Write;
    }
    
    // initializeGenomicElementType("word", ...)
    if (before.match(/initializeGenomicElementType\s*\(\s*["']$/)) {
        return DocumentHighlightKind.Write;
    }
    
    // initializeInteractionType("word", ...)
    if (before.match(/initializeInteractionType\s*\(\s*["']$/)) {
        return DocumentHighlightKind.Write;
    }
    
    // sim.addSubpop("word", ...)
    if (before.match(/addSubpop\s*\(\s*["']$/)) {
        return DocumentHighlightKind.Write;
    }
    
    // initializeSpecies("word", ...)
    if (before.match(/initializeSpecies\s*\(\s*["']$/)) {
        return DocumentHighlightKind.Write;
    }
    
    // For loop: for (word in ...)
    if (before.match(/for\s*\(\s*$/) && after.startsWith(' in ')) {
        return DocumentHighlightKind.Write;
    }
    
    // Check if this is a read context (accessing a property or calling)
    // word.something or word(...)
    if (after.startsWith('.') || after.startsWith('(')) {
        return DocumentHighlightKind.Read;
    }
    
    // word[...] (array access)
    if (after.startsWith('[')) {
        return DocumentHighlightKind.Read;
    }
    
    // Default to read for all other cases
    return DocumentHighlightKind.Read;
}

function isInStringLiteral(line: string, index: number): boolean {
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

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

