import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
/**
 * Context information for a regex match during validation
 */
export interface MatchContext {
    /** The full match array from regex.exec() */
    match: RegExpMatchArray;
    /** The line being validated */
    line: string;
    /** The line index (0-based) */
    lineIndex: number;
    /** Text before the match */
    beforeMatch: string;
    /** Text after the match */
    afterMatch: string;
    /** The match start position */
    matchStart: number;
    /** The match end position */
    matchEnd: number;
}
/**
 * Configuration for pattern-based validation
 */
export interface ValidationPatternConfig<TContext = unknown> {
    /** The regex pattern to match */
    pattern: RegExp;
    /** Function to extract the identifier/name from the match (e.g., function name, method name) */
    extractIdentifier: (match: RegExpMatchArray) => string;
    /** Optional function to determine if a match should be skipped */
    shouldSkip?: (context: MatchContext, validationContext: TContext) => boolean;
    /** Function to determine if validation should proceed (e.g., item exists in documentation) */
    shouldValidate: (identifier: string, context: MatchContext, validationContext: TContext) => boolean;
    /** Function to create a diagnostic if validation fails */
    createDiagnostic: (identifier: string, context: MatchContext, validationContext: TContext) => Diagnostic | null;
    /** Optional function to extract start position for diagnostic (defaults to match.index) */
    getStartPosition?: (context: MatchContext) => number;
    /** Optional function to extract end position for diagnostic (defaults to start + identifier.length) */
    getEndPosition?: (context: MatchContext) => number;
}
/**
 * Validates a line using a regex pattern and returns diagnostics.
 * This generic function consolidates the common pattern of:
 * - Iterating over regex matches
 * - Checking if matches should be skipped
 * - Validating each match
 * - Creating diagnostics for failures
 *
 * @param line - The line to validate
 * @param lineIndex - The line index (0-based)
 * @param config - Validation pattern configuration
 * @param validationContext - Additional context for validation (e.g., documentation data)
 * @returns Array of diagnostic objects
 *
 * @example
 * ```typescript
 * const diagnostics = validatePattern(line, lineIndex, {
 *     pattern: IDENTIFIER_PATTERNS.FUNCTION_CALL,
 *     extractIdentifier: (match) => match[INDICES.SECOND],
 *     shouldSkip: (ctx, data) => shouldSkipFunctionCall(ctx, data),
 *     shouldValidate: (id, ctx, data) => !data.functionsData[id],
 *     createDiagnostic: (id, ctx, data) => createDiagnostic(...)
 * }, { functionsData, callbacksData });
 * ```
 */
export declare function validatePattern<TContext = unknown>(line: string, lineIndex: number, config: ValidationPatternConfig<TContext>, validationContext: TContext): Diagnostic[];
/**
 * Creates a diagnostic with standard positioning.
 * Helper function for common diagnostic creation patterns.
 *
 * @param severity - Diagnostic severity
 * @param identifier - The identifier that failed validation
 * @param context - Match context
 * @param message - Error message
 * @param startOffset - Optional offset from match start (default: 0)
 * @param endOffset - Optional offset from match end (default: identifier.length)
 * @returns Diagnostic object
 */
export declare function createStandardDiagnostic(severity: DiagnosticSeverity, identifier: string, context: MatchContext, message: string, startOffset?: number, endOffset?: number): Diagnostic;
/**
 * Validates multiple patterns on a single line.
 * Useful when you need to check multiple regex patterns in one pass.
 *
 * @param line - The line to validate
 * @param lineIndex - The line index (0-based)
 * @param configs - Array of validation pattern configurations
 * @param validationContext - Additional context for validation
 * @returns Array of all diagnostic objects
 */
export declare function validateMultiplePatterns<TContext = unknown>(line: string, lineIndex: number, configs: Array<ValidationPatternConfig<TContext>>, validationContext: TContext): Diagnostic[];
//# sourceMappingURL=validation-framework.d.ts.map