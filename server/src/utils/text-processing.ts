import { decode as decodeHTML } from 'he';
import type { ParseState, ParseOptions, BraceCounts } from '../config/types';

export type { ParseState, ParseOptions, BraceCounts };

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

    /**
     * Gets the current state
     */
    getState(): ParseState {
        return { ...this.state };
    }

    /**
     * Processes a character and updates the state machine
     * @param char - Current character
     * @param prevChar - Previous character (or null)
     * @param nextChar - Next character (or null)
     * @param code - Full code string (for escape detection)
     * @param position - Current position in code
     * @returns Object with skipChar and breakLine flags
     */
    processChar(
        char: string,
        prevChar: string | null,
        nextChar: string | null,
        code: string,
        position: number
    ): {
        skipChar: boolean;
        breakLine: boolean;
    } {
        let skipChar = false;
        let breakLine = false;

        // Handle multi-line comments
        if (this.options.trackComments && this.options.trackMultiLineComments) {
            const multiLineResult = this.handleMultiLineComment(char, prevChar, nextChar);
            if (multiLineResult) {
                return { skipChar: multiLineResult.skipChar, breakLine: false };
            }
        }

        // Handle single-line comments
        if (this.options.trackComments) {
            const singleLineResult = this.handleSingleLineComment(char, nextChar);
            if (singleLineResult) {
                breakLine = true;
                return { skipChar, breakLine };
            }
        }

        // Handle strings (only if not in comment)
        if (this.options.trackStrings && !this.state.inSingleLineComment && !this.state.inMultiLineComment) {
            this.handleString(char, code, position);
        }

        return { skipChar, breakLine };
    }

    /**
     * Handles multi-line comment state transitions
     */
    private handleMultiLineComment(
        char: string,
        prevChar: string | null,
        nextChar: string | null
    ): { skipChar: boolean } | null {
        // Enter multi-line comment: /*
        if (!this.state.inString && !this.state.inSingleLineComment && !this.state.inMultiLineComment &&
            char === '/' && nextChar === '*') {
            this.state.inMultiLineComment = true;
            return { skipChar: true };
        }

        // Exit multi-line comment: */
        if (this.state.inMultiLineComment && prevChar === '*' && char === '/') {
            this.state.inMultiLineComment = false;
            return { skipChar: true };
        }

        return null;
    }

    /**
     * Handles single-line comment state transitions
     */
    private handleSingleLineComment(char: string, nextChar: string | null): boolean {
        if (!this.state.inString && !this.state.inMultiLineComment &&
            char === '/' && nextChar === '/') {
            this.state.inSingleLineComment = true;
            return true;
        }
        return false;
    }

    /**
     * Handles string state transitions
     */
    private handleString(char: string, code: string, position: number): void {
        const isEscaped = isEscapedQuote(code, position);
        const quoteChar = char === '"' || char === "'";

        // Enter string
        if (!this.state.inString && quoteChar && !isEscaped) {
            this.state.inString = true;
            this.state.stringChar = char;
            return;
        }

        // Exit string
        if (this.state.inString && char === this.state.stringChar && !isEscaped) {
            this.state.inString = false;
            this.state.stringChar = null;
            return;
        }
    }
}

/**
 * Checks if a quote character at a given position in text is escaped by counting backslashes.
 * An even number (including 0) of backslashes means the quote is not escaped.
 * @param text - The text to check
 * @param position - The position of the quote character (0-based)
 * @returns True if the quote is escaped
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
 * Unified code parser that tracks string and comment state.
 * This eliminates duplication across multiple validation files.
 * @param code - The code to parse
 * @param options - Parsing options
 * @param onChar - Callback for each character (char, state, position) => void
 * @param onStateChange - Optional callback when state changes (newState) => void
 * @returns Final parsing state
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
        
        // Process character through state machine
        const { skipChar, breakLine } = stateMachine.processChar(char, prevChar, nextChar, code, i);
        
        // Notify state change if needed
        if (onStateChange && (skipChar || breakLine)) {
            onStateChange(stateMachine.getState());
        }
        
        // Call character callback if provided
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
 * @param line - The line to analyze
 * @returns Object with openCount and closeCount
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
 * @param code - The code to analyze
 * @returns Object with openCount and closeCount (reused type for counts)
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
 * @param line - The line to process
 * @returns Code with strings replaced by placeholders
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
 * Removes comments from a line of code.
 * Handles both single-line comments (//) and multi-line comments (/* *\/).
 * Does not remove comment markers inside strings.
 * @param line - The line to process
 * @returns The line with comments removed
 */
export function removeCommentsFromLine(line: string): string {
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
            result += char;
            i++;
            continue;
        }
        
        if (inString && char === stringChar && !isEscaped) {
            inString = false;
            stringChar = null;
            result += char;
            i++;
            continue;
        }
        
        // If we're in a string, just copy the character
        if (inString) {
            result += char;
            i++;
            continue;
        }
        
        // Check for single-line comment
        if (char === '/' && nextChar === '/') {
            // Rest of line is a comment, stop here
            break;
        }
        
        // Check for multi-line comment start
        if (char === '/' && nextChar === '*') {
            // Skip until we find */
            i += 2;
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

/**
 * Removes both comments and strings from a line of code.
 * Replaces strings with placeholders to preserve character positions.
 * @param line - The line to process
 * @returns The line with comments removed and strings replaced with spaces
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
            // Rest of line is a comment, stop here
            break;
        }
        
        // Check for multi-line comment start
        if (char === '/' && nextChar === '*') {
            // Skip until we find */
            i += 2;
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

