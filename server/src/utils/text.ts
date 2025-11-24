// ============================================================================
// TEXT PROCESSING UTILITIES
// SLiM/Eidos-specific text processing, type cleaning, and code parsing
// ============================================================================

import { decode as decodeHTML } from 'he';
import type { ParseState, ParseOptions, BraceCounts } from '../config/types';

export type { ParseState, ParseOptions, BraceCounts };

// ============================================================================
// SLIM/EIDOS TYPE CLEANING
// ============================================================================

/**
 * Expands Eidos/SLiM type abbreviations to readable base type names.
 * Type abbreviations: N = nullable, i = integer, o = object, l = logical, s = string, f = float
 * Examples: Ni -> integer, No<Class> -> object<Class>, Nl -> logical
 */
export function expandTypeAbbreviations(text: string): string {
    if (!text) return text;
    
    return text
        .replace(/\bNi\b/g, 'integer')
        .replace(/\bNl\b/g, 'logical')
        .replace(/\bNs\b/g, 'string')
        .replace(/\bNf\b/g, 'float')
        .replace(/\bNo<([^>]+)>/g, 'object<$1>')
        .replace(/\bNif\b/g, 'integer or float')
        .replace(/\bNis\b/g, 'integer or string')
        .replace(/\bis\b/g, 'integer or string');
}

/**
 * Cleans type names by removing trailing dollar signs and expanding abbreviations.
 * In SLiM/Eidos, $ indicates singleton types (single value), no $ = vector.
 */
export function cleanTypeNames(text: string): string {
    if (!text) return text;
    
    // Remove $ from type names, then expand abbreviations
    text = text.replace(/(\w+(?:<[^>]+>)?)\$/g, '$1');
    return expandTypeAbbreviations(text);
}

/**
 * Cleans signatures by removing $ from type names, expanding abbreviations,
 * and simplifying object<> notation.
 */
export function cleanSignature(signature: string): string {
    if (!signature) return signature;
    let cleaned = cleanTypeNames(signature);
    // Replace "object<ClassType>" with "<ClassType>" for clarity
    return cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');
}

/**
 * Cleans documentation text by decoding HTML entities, removing type suffixes,
 * and converting HTML tags to markdown.
 */
export function cleanDocumentationText(text: string): string {
    if (!text) return text;
    
    // Decode HTML entities using 'he' library
    let cleaned = decodeHTML(text);
    
    // Clean type names
    cleaned = cleanTypeNames(cleaned);
    
    // Replace "object<ClassType>" with "<ClassType>" in descriptions
    cleaned = cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');
    
    // Convert HTML tags to markdown (preserve sub/sup tags)
    cleaned = cleaned
        .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
        .replace(/<i>/gi, '*').replace(/<\/i>/gi, '*')
        .replace(/<b>/gi, '**').replace(/<\/b>/gi, '**')
        .replace(/<em>/gi, '*').replace(/<\/em>/gi, '*')
        .replace(/<strong>/gi, '**').replace(/<\/strong>/gi, '**');
    
    // Clean up multiple spaces
    return cleaned.replace(/\s{2,}/g, ' ');
}

// ============================================================================
// STRING AND COMMENT PARSING
// ============================================================================

/**
 * Checks if a quote character at a given position in text is escaped by counting backslashes.
 * An even number (including 0) of backslashes means the quote is not escaped.
 */
export function isEscapedQuote(text: string, position: number): boolean {
    let backslashCount = 0;
    let j = position - 1;
    while (j >= 0 && text[j] === '\\') {
        backslashCount++;
        j--;
    }
    return (backslashCount % 2) === 1;
}

/**
 * State machine for tracking string and comment parsing state
 */
export class StringCommentStateMachine {
    private state: ParseState;
    private readonly options: Required<ParseOptions>;

    constructor(options: ParseOptions = {}) {
        this.options = {
            trackStrings: options.trackStrings ?? true,
            trackComments: options.trackComments ?? true,
            trackMultiLineComments: options.trackMultiLineComments ?? true
        };
        this.state = {
            inString: false,
            stringChar: null,
            inSingleLineComment: false,
            inMultiLineComment: false
        };
    }

    getState(): ParseState {
        return { ...this.state };
    }

    /**
     * Processes a character and updates the state machine
     */
    processChar(
        char: string,
        prevChar: string | null,
        nextChar: string | null,
        code: string,
        position: number
    ): { skipChar: boolean; breakLine: boolean } {
        // Handle multi-line comments
        if (this.options.trackComments && this.options.trackMultiLineComments) {
            // Enter multi-line comment: /*
            if (!this.state.inString && !this.state.inSingleLineComment && !this.state.inMultiLineComment &&
                char === '/' && nextChar === '*') {
                this.state.inMultiLineComment = true;
                return { skipChar: true, breakLine: false };
            }

            // Exit multi-line comment: */
            if (this.state.inMultiLineComment && prevChar === '*' && char === '/') {
                this.state.inMultiLineComment = false;
                return { skipChar: true, breakLine: false };
            }
        }

        // Handle single-line comments
        if (this.options.trackComments && !this.state.inString && !this.state.inMultiLineComment &&
            char === '/' && nextChar === '/') {
            this.state.inSingleLineComment = true;
            return { skipChar: false, breakLine: true };
        }

        // Handle strings (only if not in comment)
        if (this.options.trackStrings && !this.state.inSingleLineComment && !this.state.inMultiLineComment) {
            const isEscaped = isEscapedQuote(code, position);
            const quoteChar = char === '"' || char === "'";

            // Enter string
            if (!this.state.inString && quoteChar && !isEscaped) {
                this.state.inString = true;
                this.state.stringChar = char;
            }
            // Exit string
            else if (this.state.inString && char === this.state.stringChar && !isEscaped) {
                this.state.inString = false;
                this.state.stringChar = null;
            }
        }

        return { skipChar: false, breakLine: false };
    }
}

/**
 * Unified code parser that tracks string and comment state.
 */
export function parseCodeWithStringsAndComments(
    code: string,
    options: ParseOptions = {},
    onChar: ((char: string, state: ParseState, position: number) => void) | null = null,
    onStateChange: ((newState: ParseState) => void) | null = null
): ParseState {
    const stateMachine = new StringCommentStateMachine(options);
    
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const prevChar = i > 0 ? code[i - 1] : null;
        const nextChar = i < code.length - 1 ? code[i + 1] : null;
        
        const { skipChar, breakLine } = stateMachine.processChar(char, prevChar, nextChar, code, i);
        
        if (onStateChange && (skipChar || breakLine)) {
            onStateChange(stateMachine.getState());
        }
        
        if (onChar && !skipChar) {
            onChar(char, stateMachine.getState(), i);
        }
        
        if (breakLine) break;
        if (skipChar) i++; // Skip next char if we processed a two-char sequence
    }
    
    return stateMachine.getState();
}

/**
 * Counts braces in code, ignoring those inside strings and comments.
 */
export function countBracesIgnoringStringsAndComments(line: string): BraceCounts {
    let openCount = 0;
    let closeCount = 0;
    
    parseCodeWithStringsAndComments(line, {}, (char, state) => {
        if (!state.inString && !state.inSingleLineComment && !state.inMultiLineComment) {
            if (char === '{') openCount++;
            else if (char === '}') closeCount++;
        }
    });
    
    return { openCount, closeCount };
}

/**
 * Counts parentheses in code, ignoring those inside strings and comments.
 */
export function countParenthesesIgnoringStringsAndComments(code: string): BraceCounts {
    let openCount = 0;
    let closeCount = 0;
    
    parseCodeWithStringsAndComments(code, {}, (char, state) => {
        if (!state.inString && !state.inSingleLineComment && !state.inMultiLineComment) {
            if (char === '(') openCount++;
            else if (char === ')') closeCount++;
        }
    });
    
    return { openCount, closeCount };
}

/**
 * Removes strings from a line, replacing them with placeholders.
 * Uses a unique placeholder pattern that's unlikely to appear in code.
 */
export function removeStringsFromLine(line: string): string {
    let result = '';
    let placeholderIndex = 0;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const isEscaped = isEscapedQuote(line, i);
        
        // Check if we're starting a string
        if ((char === '"' || char === "'") && !isEscaped) {
            const stringChar = char;
            const placeholder = `__STR${placeholderIndex}__`;
            placeholderIndex++;
            result += placeholder;
            i++;
            
            // Find the closing quote
            while (i < line.length) {
                const strChar = line[i];
                const strIsEscaped = isEscapedQuote(line, i);
                
                if (strChar === stringChar && !strIsEscaped) {
                    i++;
                    break;
                }
                i++;
            }
        } else {
            result += char;
            i++;
        }
    }
    
    return result;
}

/**
 * Removes both comments and strings from a line of code.
 * Replaces strings with spaces to preserve character positions for diagnostics.
 */
export function removeCommentsAndStringsFromLine(line: string): string {
    let result = '';
    let inString = false;
    let stringChar: string | null = null;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : null;
        const isEscaped = isEscapedQuote(line, i);
        
        // Track string state
        if (!inString && (char === '"' || char === "'") && !isEscaped) {
            inString = true;
            stringChar = char;
            result += ' '; // Replace string quote with space
            i++;
            continue;
        }
        
        if (inString && char === stringChar && !isEscaped) {
            inString = false;
            stringChar = null;
            result += ' '; // Replace closing quote with space
            i++;
            continue;
        }
        
        // If we're in a string, replace with spaces to preserve positions
        if (inString) {
            result += ' ';
            i++;
            continue;
        }
        
        // Check for single-line comment
        if (char === '/' && nextChar === '/') {
            break; // Rest of line is a comment
        }
        
        // Check for multi-line comment start
        if (char === '/' && nextChar === '*') {
            i += 2;
            // Skip until we find */
            while (i < line.length - 1) {
                if (line[i] === '*' && line[i + 1] === '/') {
                    i += 2;
                    break;
                }
                i++;
            }
            continue;
        }
        
        result += char;
        i++;
    }
    
    return result;
}
