import { FormattingOptions, LanguageServerContext } from '../config/types';
/**
 * Formats SLiM code with basic brace-based indentation.
 */
export declare function formatSLiMCode(text: string, options: FormattingOptions): string;
/**
 * Registers the document formatting provider handler.
 */
export declare function registerFormattingProvider(context: LanguageServerContext): void;
//# sourceMappingURL=formatting.d.ts.map