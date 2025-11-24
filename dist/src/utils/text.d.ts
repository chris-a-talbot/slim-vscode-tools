import type { ParseState, ParseOptions, BraceCounts } from '../config/types';
export type { ParseState, ParseOptions, BraceCounts };
/**
 * Expands Eidos/SLiM type abbreviations to readable base type names.
 * Type abbreviations: N = nullable, i = integer, o = object, l = logical, s = string, f = float
 * Examples: Ni -> integer, No<Class> -> object<Class>, Nl -> logical
 */
export declare function expandTypeAbbreviations(text: string): string;
/**
 * Cleans type names by removing trailing dollar signs and expanding abbreviations.
 * In SLiM/Eidos, $ indicates singleton types (single value), no $ = vector.
 */
export declare function cleanTypeNames(text: string): string;
/**
 * Cleans signatures by removing $ from type names, expanding abbreviations,
 * and simplifying object<> notation.
 */
export declare function cleanSignature(signature: string): string;
/**
 * Cleans documentation text by decoding HTML entities, removing type suffixes,
 * and converting HTML tags to markdown.
 */
export declare function cleanDocumentationText(text: string): string;
/**
 * Checks if a quote character at a given position in text is escaped by counting backslashes.
 * An even number (including 0) of backslashes means the quote is not escaped.
 */
export declare function isEscapedQuote(text: string, position: number): boolean;
/**
 * State machine for tracking string and comment parsing state
 */
export declare class StringCommentStateMachine {
    private state;
    private readonly options;
    constructor(options?: ParseOptions);
    getState(): ParseState;
    /**
     * Processes a character and updates the state machine
     */
    processChar(char: string, prevChar: string | null, nextChar: string | null, code: string, position: number): {
        skipChar: boolean;
        breakLine: boolean;
    };
}
/**
 * Unified code parser that tracks string and comment state.
 */
export declare function parseCodeWithStringsAndComments(code: string, options?: ParseOptions, onChar?: ((char: string, state: ParseState, position: number) => void) | null, onStateChange?: ((newState: ParseState) => void) | null): ParseState;
/**
 * Counts braces in code, ignoring those inside strings and comments.
 */
export declare function countBracesIgnoringStringsAndComments(line: string): BraceCounts;
/**
 * Counts parentheses in code, ignoring those inside strings and comments.
 */
export declare function countParenthesesIgnoringStringsAndComments(code: string): BraceCounts;
/**
 * Removes strings from a line, replacing them with placeholders.
 * Uses a unique placeholder pattern that's unlikely to appear in code.
 */
export declare function removeStringsFromLine(line: string): string;
/**
 * Removes both comments and strings from a line of code.
 * Replaces strings with spaces to preserve character positions for diagnostics.
 */
export declare function removeCommentsAndStringsFromLine(line: string): string;
//# sourceMappingURL=text.d.ts.map