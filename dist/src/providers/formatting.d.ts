import { Token, FormattingOptions, LanguageServerContext } from '../types';
/**
 * Simple tokenizer for basic formatting (doesn't need full Eidos parser).
 * @param text - The text to tokenize
 * @returns Array of token objects with type, value, and start position
 */
export declare function tokenizeSLiM(text: string): Token[];
/**
 * Formats SLiM code roughly according to SLiMgui formatting rules.
 * Handles indentation based on braces and control flow, preserving comments and string literals.
 * @param text - The code to format
 * @param options - Formatting options
 * @returns The formatted code
 */
export declare function formatSLiMCode(text: string, options: FormattingOptions): string;
/**
 * Registers the document formatting provider handler.
 * @param context - The language server context
 */
export declare function registerFormattingProvider(context: LanguageServerContext): void;
//# sourceMappingURL=formatting.d.ts.map