import type { ParseState, ParseOptions, BraceCounts } from '../types';
export type { ParseState, ParseOptions, BraceCounts };
/**
 * Expands Eidos/SLiM type abbreviations to readable base type names.
 * Type abbreviations: N = nullable, i = integer, o = object, l = logical, s = string, f = float
 * Examples: Ni -> integer, No<Class> -> object<Class>, Nl -> logical
 * @param text - The text to expand
 * @returns Text with abbreviations expanded to base types
 */
export declare function expandTypeAbbreviations(text: string): string;
/**
 * Cleans type names in signatures and descriptions by removing trailing dollar signs.
 * Eidos/SLiM uses $ to indicate singleton types, but we remove it for clarity.
 * Also expands type abbreviations for better readability.
 * @param text - The text to clean
 * @returns Text with $ removed from type names and abbreviations expanded
 */
export declare function cleanTypeNames(text: string): string;
/**
 * Cleans signatures by removing trailing dollar signs from type names,
 * expanding type abbreviations, and removing "object<" prefix from generic types.
 * @param signature - The signature to clean
 * @returns Cleaned signature
 */
export declare function cleanSignature(signature: string): string;
/**
 * Cleans documentation text by decoding HTML entities, removing type suffixes,
 * and converting HTML tags to markdown.
 * @param text - The text to clean
 * @returns Cleaned text
 */
export declare function cleanDocumentationText(text: string): string;
/**
 * State machine for tracking string and comment parsing state
 */
export declare class StringCommentStateMachine {
    private state;
    private readonly options;
    constructor(options?: ParseOptions);
    /**
     * Gets the current state
     */
    getState(): ParseState;
    /**
     * Processes a character and updates the state machine
     * @param char - Current character
     * @param prevChar - Previous character (or null)
     * @param nextChar - Next character (or null)
     * @param code - Full code string (for escape detection)
     * @param position - Current position in code
     * @returns Object with skipChar and breakLine flags
     */
    processChar(char: string, prevChar: string | null, nextChar: string | null, code: string, position: number): {
        skipChar: boolean;
        breakLine: boolean;
    };
    /**
     * Handles multi-line comment state transitions
     */
    private handleMultiLineComment;
    /**
     * Handles single-line comment state transitions
     */
    private handleSingleLineComment;
    /**
     * Handles string state transitions
     */
    private handleString;
}
/**
 * Checks if a quote character at a given position in text is escaped by counting backslashes.
 * An even number (including 0) of backslashes means the quote is not escaped.
 * @param text - The text to check
 * @param position - The position of the quote character (0-based)
 * @returns True if the quote is escaped
 */
export declare function isEscapedQuote(text: string, position: number): boolean;
/**
 * Unified code parser that tracks string and comment state.
 * This eliminates duplication across multiple validation files.
 * @param code - The code to parse
 * @param options - Parsing options
 * @param onChar - Callback for each character (char, state, position) => void
 * @param onStateChange - Optional callback when state changes (newState) => void
 * @returns Final parsing state
 */
export declare function parseCodeWithStringsAndComments(code: string, options?: ParseOptions, onChar?: ((char: string, state: ParseState, position: number) => void) | null, onStateChange?: ((newState: ParseState) => void) | null): ParseState;
/**
 * Counts braces in code, ignoring those inside strings and comments.
 * @param line - The line to analyze
 * @returns Object with openCount and closeCount
 */
export declare function countBracesIgnoringStringsAndComments(line: string): BraceCounts;
/**
 * Counts parentheses in code, ignoring those inside strings and comments.
 * @param code - The code to analyze
 * @returns Object with openCount and closeCount (reused type for counts)
 */
export declare function countParenthesesIgnoringStringsAndComments(code: string): BraceCounts;
/**
 * Removes strings from a line, replacing them with placeholders.
 * Uses a unique placeholder pattern that's unlikely to appear in code.
 * @param line - The line to process
 * @returns Code with strings replaced by placeholders
 */
export declare function removeStringsFromLine(line: string): string;
//# sourceMappingURL=text-processing.d.ts.map