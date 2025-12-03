import {
    DefinitionParams,
    Location,
    Position,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { trackInstanceDefinitions } from '../utils/instance';
import { CALLBACK_PSEUDO_PARAMETERS } from '../config/config';
import { escapeRegex } from '../utils/text-processing';

export function registerDefinitionProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onDefinition((params: DefinitionParams): Location | Location[] | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const text = document.getText();
        const position = params.position;
        
        // Get the word at cursor position
        const wordInfo = getWordAtPosition(text, position);
        if (!wordInfo) return null;

        // Use cached tracking state
        const trackingState = trackInstanceDefinitions(document);

        // Search for definition of this word
        const definition = findDefinition(
            text, 
            wordInfo.word,
            position,
            params.textDocument.uri,
            trackingState
        );
        return definition;
    });
}

interface WordInfo {
    word: string;
    isQuoted: boolean;
    range: Range;
}

function getWordAtPosition(text: string, position: Position): WordInfo | null {
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;

    const line = lines[position.line];
    const character = position.character;

    // Check if we're in a quoted string (for SLiM identifiers like "m1", "p1")
    let isQuoted = false;
    let start = character;
    let end = character;

    // Check for quoted identifier
    if (character > 0 && line[character - 1] === '"') {
        start = character;
        end = character;
        while (end < line.length && line[end] !== '"') {
            end++;
        }
        if (end < line.length) {
            isQuoted = true;
            const word = line.substring(start, end);
            return {
                word,
                isQuoted,
                range: Range.create(position.line, start, position.line, end)
            };
        }
    }

    let quoteStart = -1;
    for (let i = character - 1; i >= 0; i--) {
        if (line[i] === '"') {
            quoteStart = i;
            break;
        }
    }
    
    if (quoteStart !== -1) {
        let quoteEnd = line.indexOf('"', quoteStart + 1);
        if (quoteEnd !== -1 && character >= quoteStart && character <= quoteEnd) {
            isQuoted = true;
            const word = line.substring(quoteStart + 1, quoteEnd);
            return {
                word,
                isQuoted,
                range: Range.create(position.line, quoteStart + 1, position.line, quoteEnd)
            };
        }
    }

    // Regular word (not quoted)
    const wordChar = /[a-zA-Z0-9_]/;

    // Move start back to beginning of word
    start = character;
    while (start > 0 && wordChar.test(line[start - 1])) {
        start--;
    }

    // Move end forward to end of word
    end = character;
    while (end < line.length && wordChar.test(line[end])) {
        end++;
    }

    if (start === end) return null;

    const word = line.substring(start, end);
    return {
        word,
        isQuoted: false,
        range: Range.create(position.line, start, position.line, end)
    };
}

function findDefinition(
    text: string,
    word: string,
    cursorPosition: Position,
    uri: string,
    trackingState: any
): Location | null {
    const lines = text.split('\n');

    // Priority 1: Check callback pseudo-parameters first (if we're in a callback scope)
    const callbackName = trackingState.callbackContextByLine?.get(cursorPosition.line);
    if (callbackName) {
        const pseudoParams = CALLBACK_PSEUDO_PARAMETERS[callbackName] || {};
        if (word in pseudoParams) {
            const callbackPattern = callbackName.replace('()', '');
            const callbackRegex = new RegExp(`\\b${escapeRegex(callbackPattern)}\\s*\\(`);
            
            for (let i = cursorPosition.line; i >= 0; i--) {
                const line = lines[i].trim();
                if (!line.startsWith('//') && callbackRegex.test(lines[i])) {
                    return Location.create(uri, Range.create(
                        i, 0,
                        i, lines[i].length
                    ));
                }
            }
        }
    }

    // Priority 2: Check tracked definitions (constants, mutation types, etc.)
    if (trackingState.definedConstants?.has(word)) {
        const defLine = findFirstOccurrence(lines, `defineConstant("${word}"`, cursorPosition.line);
        if (defLine !== -1) {
            const match = lines[defLine].match(new RegExp(`defineConstant\\s*\\(\\s*["']${escapeRegex(word)}["']`));
            if (match) {
                const startChar = lines[defLine].indexOf(word, lines[defLine].indexOf('defineConstant'));
                return Location.create(uri, Range.create(
                    defLine, startChar,
                    defLine, startChar + word.length
                ));
            }
        }
    }

    if (trackingState.definedMutationTypes?.has(word)) {
        const defLine = findFirstOccurrence(lines, `initializeMutationType("${word}"`, cursorPosition.line);
        if (defLine !== -1) {
            const startChar = lines[defLine].indexOf(`"${word}"`);
            if (startChar !== -1) {
                return Location.create(uri, Range.create(
                    defLine, startChar + 1,
                    defLine, startChar + 1 + word.length
                ));
            }
        }
    }

    if (trackingState.definedGenomicElementTypes?.has(word)) {
        const defLine = findFirstOccurrence(lines, `initializeGenomicElementType("${word}"`, cursorPosition.line);
        if (defLine !== -1) {
            const startChar = lines[defLine].indexOf(`"${word}"`);
            if (startChar !== -1) {
                return Location.create(uri, Range.create(
                    defLine, startChar + 1,
                    defLine, startChar + 1 + word.length
                ));
            }
        }
    }

    if (trackingState.definedInteractionTypes?.has(word)) {
        const defLine = findFirstOccurrence(lines, `initializeInteractionType("${word}"`, cursorPosition.line);
        if (defLine !== -1) {
            const startChar = lines[defLine].indexOf(`"${word}"`);
            if (startChar !== -1) {
                return Location.create(uri, Range.create(
                    defLine, startChar + 1,
                    defLine, startChar + 1 + word.length
                ));
            }
        }
    }

    if (trackingState.definedSubpopulations?.has(word)) {
        // Try quoted string definition first: addSubpop("p1", ...)
        const subpopPattern = `addSubpop("${word}"`;
        let defLine = findFirstOccurrence(lines, subpopPattern, cursorPosition.line);
        if (defLine !== -1) {
            const startChar = lines[defLine].indexOf(`"${word}"`);
            if (startChar !== -1) {
                return Location.create(uri, Range.create(
                    defLine, startChar + 1,
                    defLine, startChar + 1 + word.length
                ));
            }
        }
        
        // Try addSubpopSplit with quoted string
        const splitPattern = `addSubpopSplit("${word}"`;
        defLine = findFirstOccurrence(lines, splitPattern, cursorPosition.line);
        if (defLine !== -1) {
            const startChar = lines[defLine].indexOf(`"${word}"`);
            if (startChar !== -1) {
                return Location.create(uri, Range.create(
                    defLine, startChar + 1,
                    defLine, startChar + 1 + word.length
                ));
            }
        }
        
        // If word is in p<num> format, also search for numeric ID definition
        const pNumMatch = word.match(/^p(\d+)$/);
        if (pNumMatch) {
            const numericId = pNumMatch[1];
            
            // Search for numeric definition: addSubpop(1, ...)
            const numericPattern = new RegExp(`addSubpop\\s*\\(\\s*${escapeRegex(numericId)}\\s*,`);
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(numericPattern);
                if (match && match.index !== undefined) {
                    const idStart = match.index + match[0].indexOf(numericId);
                    return Location.create(uri, Range.create(
                        i, idStart,
                        i, idStart + numericId.length
                    ));
                }
            }
            
            // Search for addSubpopSplit with numeric ID
            const splitNumericPattern = new RegExp(`addSubpopSplit\\s*\\(\\s*${escapeRegex(numericId)}\\s*,`);
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(splitNumericPattern);
                if (match && match.index !== undefined) {
                    const idStart = match.index + match[0].indexOf(numericId);
                    return Location.create(uri, Range.create(
                        i, idStart,
                        i, idStart + numericId.length
                    ));
                }
            }
        }
    }

    if (trackingState.definedSpecies?.has(word)) {
        const defLine = findFirstOccurrence(lines, `species ${word} initialize`, cursorPosition.line);
        if (defLine !== -1) {
            const match = lines[defLine].match(new RegExp(`species\\s+(${escapeRegex(word)})\\s+initialize`));
            if (match && match.index !== undefined) {
                const startChar = match.index + match[0].indexOf(word);
                return Location.create(uri, Range.create(
                    defLine, startChar,
                    defLine, startChar + word.length
                ));
            }
        }
    }

    // Priority 3: Check for function definitions
    const funcPattern = new RegExp(`^\\s*function\\s+${escapeRegex(word)}\\s*\\(`);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (funcPattern.test(line)) {
            const match = line.match(new RegExp(`function\\s+(${escapeRegex(word)})`));
            if (match && match.index !== undefined) {
                const startChar = match.index + match[0].indexOf(word);
                return Location.create(uri, Range.create(
                    lineIndex, startChar,
                    lineIndex, startChar + word.length
                ));
            }
        }
    }

    // Priority 4: Check for function parameters
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const funcMatch = line.match(/function\s+\w+\s*\(([^)]*)\)/);
        if (funcMatch) {
            const params = funcMatch[1].split(',').map(p => p.trim());
            if (params.includes(word)) {
                // Find the parameter in the parameter list
                const paramStart = funcMatch.index! + funcMatch[0].indexOf(funcMatch[1]);
                let currentPos = paramStart;
                for (const param of params) {
                    if (param === word) {
                        return Location.create(uri, Range.create(
                            lineIndex, currentPos,
                            lineIndex, currentPos + word.length
                        ));
                    }
                    currentPos += param.length + 1; // +1 for comma
                }
            }
        }
    }

    // Priority 5: Check for variable declarations
    const assignmentPattern = new RegExp(`^\\s*${escapeRegex(word)}\\s*=`);
    for (let lineIndex = 0; lineIndex < cursorPosition.line; lineIndex++) {
        const line = lines[lineIndex];
        if (assignmentPattern.test(line)) {
            const match = line.match(new RegExp(`^\\s*(${escapeRegex(word)})\\s*=`));
            if (match && match.index !== undefined) {
                const startChar = match.index + match[0].indexOf(word);
                return Location.create(uri, Range.create(
                    lineIndex, startChar,
                    lineIndex, startChar + word.length
                ));
            }
        }
    }

    // Priority 6: Check for loop variables
    const forLoopPattern = new RegExp(`for\\s*\\(\\s*${escapeRegex(word)}\\s+in\\s+`);
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        if (forLoopPattern.test(line)) {
            const match = line.match(new RegExp(`for\\s*\\(\\s*(${escapeRegex(word)})\\s+in`));
            if (match && match.index !== undefined) {
                const startChar = match.index + match[0].indexOf(word);
                return Location.create(uri, Range.create(
                    lineIndex, startChar,
                    lineIndex, startChar + word.length
                ));
            }
        }
    }

    return null;
}

function findFirstOccurrence(lines: string[], pattern: string, cursorLine: number): number {
    // Search backwards first (definition is usually before usage)
    for (let i = cursorLine; i >= 0; i--) {
        if (lines[i].includes(pattern)) {
            return i;
        }
    }
    
    // Search forward if not found
    for (let i = cursorLine + 1; i < lines.length; i++) {
        if (lines[i].includes(pattern)) {
            return i;
        }
    }
    
    return -1;
}