import type { ParseState, ParseOptions, BraceCounts } from '../types';

export type { ParseState, ParseOptions, BraceCounts };

/**
 * Expands Eidos/SLiM type abbreviations to readable base type names.
 * Type abbreviations: N = nullable, i = integer, o = object, l = logical, s = string, f = float
 * Examples: Ni -> integer, No<Class> -> object<Class>, Nl -> logical
 * @param text - The text to expand
 * @returns Text with abbreviations expanded to base types
 */
export function expandTypeAbbreviations(text: string): string {
    if (!text) return text;
    
    // Expand nullable type abbreviations to base types (drop the "nullable" part for brevity)
    // Ni = integer (nullable), Nl = logical (nullable), Ns = string (nullable), Nf = float (nullable)
    text = text.replace(/\bNi\b/g, 'integer');
    text = text.replace(/\bNl\b/g, 'logical');
    text = text.replace(/\bNs\b/g, 'string');
    text = text.replace(/\bNf\b/g, 'float');
    
    // Expand nullable object types: No<ClassType> -> object<ClassType>
    text = text.replace(/\bNo<([^>]+)>/g, 'object<$1>');
    
    // Expand compound nullable types: Nif = integer or float, Nis = integer or string
    text = text.replace(/\bNif\b/g, 'integer or float');
    text = text.replace(/\bNis\b/g, 'integer or string');
    
    // Expand union types: is = integer or string (non-nullable)
    text = text.replace(/\bis\b/g, 'integer or string');
    
    return text;
}

/**
 * Cleans type names in signatures and descriptions by removing trailing dollar signs.
 * In SLiM/Eidos, $ indicates singleton types (single value), while no $ indicates vectors.
 * We remove $ for display clarity, but preserve it internally for type inference.
 * Also expands type abbreviations for better readability.
 * @param text - The text to clean
 * @returns Text with $ removed from type names and abbreviations expanded
 */
export function cleanTypeNames(text: string): string {
    if (!text) return text;
    
    // Remove $ that appears after type names (e.g., "integer$" -> "integer", "object<DataFrame>$" -> "object<DataFrame>")
    // Match word characters, angle brackets with content, then optional $
    // This handles: integer$, string$, object<ClassType>$, etc.
    text = text.replace(/(\w+(?:<[^>]+>)?)\$/g, '$1');
    
    // Expand type abbreviations for better readability
    text = expandTypeAbbreviations(text);
    
    return text;
}

/**
 * Cleans signatures by removing trailing dollar signs from type names,
 * expanding type abbreviations, and removing "object<" prefix from generic types.
 * @param signature - The signature to clean
 * @returns Cleaned signature
 */
export function cleanSignature(signature: string): string {
    if (!signature) return signature;
    let cleaned = cleanTypeNames(signature);
    // Replace "object<ClassType>" with "<ClassType>" in signatures for clarity
    cleaned = cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');
    return cleaned;
}

/**
 * Cleans documentation text by decoding HTML entities, removing type suffixes,
 * and converting HTML tags to markdown.
 * @param text - The text to clean
 * @returns Cleaned text
 */
export function cleanDocumentationText(text: string): string {
    if (!text) return text;
    
    // First, decode HTML entities
    let cleaned = text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&times;/g, '×')
        .replace(/&divide;/g, '÷')
        .replace(/&plusmn;/g, '±')
        .replace(/&le;/g, '≤')
        .replace(/&ge;/g, '≥')
        .replace(/&ne;/g, '≠')
        .replace(/&hellip;/g, '…');
    
    // Remove trailing $ from type names and expand abbreviations
    cleaned = cleanTypeNames(cleaned);
    
    // Replace "object<ClassType>" with "<ClassType>" in descriptions for clarity
    cleaned = cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');
    
    // Convert subscript tags to markdown
    // Pattern: <sub>content</sub> -> ~content~
    cleaned = cleaned.replace(/<sub>([^<]+)<\/sub>/gi, '<sub>$1</sub>'); 
    
    // Convert superscript tags to markdown
    cleaned = cleaned.replace(/<sup>([^<]+)<\/sup>/gi, '<sup>$1</sup>'); 
    
    // Remove any remaining HTML tags that we don't want (but preserve <sub> and <sup>)
    cleaned = cleaned.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');
    cleaned = cleaned.replace(/<i>/gi, '*').replace(/<\/i>/gi, '*');
    cleaned = cleaned.replace(/<b>/gi, '**').replace(/<\/b>/gi, '**');
    cleaned = cleaned.replace(/<em>/gi, '*').replace(/<\/em>/gi, '*');
    cleaned = cleaned.replace(/<strong>/gi, '**').replace(/<\/strong>/gi, '**');
    
    // Clean up any double spaces that might have been created
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    
    return cleaned;
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

