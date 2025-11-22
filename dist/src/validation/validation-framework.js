"use strict";
// ============================================================================
// GENERIC VALIDATION FRAMEWORK
// Unified framework for pattern-based validation that reduces code duplication
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePattern = validatePattern;
exports.createStandardDiagnostic = createStandardDiagnostic;
exports.validateMultiplePatterns = validateMultiplePatterns;
const diagnostic_factory_1 = require("../utils/diagnostic-factory");
const constants_1 = require("../config/constants");
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
function validatePattern(line, lineIndex, config, validationContext) {
    const diagnostics = [];
    const { pattern, extractIdentifier, shouldSkip, shouldValidate, createDiagnostic } = config;
    // Reset regex lastIndex to ensure consistent behavior
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
        if (match.index === undefined)
            continue;
        const identifier = extractIdentifier(match);
        const matchEnd = match.index + match[0].length;
        const beforeMatch = line.substring(constants_1.DEFAULT_POSITIONS.START_OF_LINE, match.index);
        const afterMatch = line.substring(matchEnd);
        const matchContext = {
            match,
            line,
            lineIndex,
            beforeMatch,
            afterMatch,
            matchStart: match.index,
            matchEnd
        };
        // Skip if shouldSkip returns true
        if (shouldSkip && shouldSkip(matchContext, validationContext)) {
            continue;
        }
        // Validate if shouldValidate returns true (meaning validation should proceed)
        if (!shouldValidate(identifier, matchContext, validationContext)) {
            continue;
        }
        // Create diagnostic
        const diagnostic = createDiagnostic(identifier, matchContext, validationContext);
        if (diagnostic) {
            diagnostics.push(diagnostic);
        }
    }
    return diagnostics;
}
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
function createStandardDiagnostic(severity, identifier, context, message, startOffset = 0, endOffset) {
    const startPos = context.matchStart + startOffset;
    const endPos = startPos + (endOffset ?? identifier.length);
    return (0, diagnostic_factory_1.createDiagnostic)(severity, context.lineIndex, startPos, endPos, message);
}
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
function validateMultiplePatterns(line, lineIndex, configs, validationContext) {
    const allDiagnostics = [];
    for (const config of configs) {
        const diagnostics = validatePattern(line, lineIndex, config, validationContext);
        allDiagnostics.push(...diagnostics);
    }
    return allDiagnostics;
}
//# sourceMappingURL=validation-framework.js.map