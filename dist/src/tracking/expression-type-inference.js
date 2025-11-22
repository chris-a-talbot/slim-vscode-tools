"use strict";
// ============================================================================
// TYPE INFERENCE FROM EXPRESSIONS
// Infers class type from method calls and property access in expressions.
// This is used to provide type information for the hover and signature help providers.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferTypeFromExpression = inferTypeFromExpression;
const regex_patterns_1 = require("../config/regex-patterns");
const constants_1 = require("../config/constants");
/**
 * Infers class type from method calls and property access in expressions.
 * @param expr - The expression to analyze
 * @returns The inferred class type or null if no match
 */
function inferTypeFromExpression(expr) {
    const trimmed = expr.trim();
    // Check for outermost function calls that return specific types
    // These take precedence over inner method calls - if the expression is numeric/logical,
    // we shouldn't infer an object type
    const numericFunctions = regex_patterns_1.TYPE_INFERENCE_PATTERNS.NUMERIC_FUNCTIONS;
    const logicalOperators = regex_patterns_1.TYPE_INFERENCE_PATTERNS.LOGICAL_OPERATORS;
    const logicalFunctions = regex_patterns_1.TYPE_INFERENCE_PATTERNS.LOGICAL_FUNCTIONS;
    // If expression starts with numeric function or contains arithmetic operators,
    // it returns a numeric type, not an object
    if (numericFunctions.test(trimmed) || regex_patterns_1.TYPE_INFERENCE_PATTERNS.ARITHMETIC_OPERATORS.test(trimmed)) {
        return null; // Don't infer object type for numeric results
    }
    // If expression starts with logical operator or logical function,
    // it returns a logical type, not an object
    if (logicalOperators.test(trimmed) || logicalFunctions.test(trimmed)) {
        return null; // Don't infer object type for logical results
    }
    // Common SLiM patterns that return specific types
    const typePatterns = [
        // Subpopulation patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.SUBPOPULATION_METHODS, type: constants_1.CLASS_NAMES.SUBPOPULATION },
        // Individual patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.INDIVIDUAL_METHODS, type: constants_1.CLASS_NAMES.INDIVIDUAL },
        // Haplosome/Genome patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.HAPLOSOME_METHODS, type: constants_1.CLASS_NAMES.HAPLOSOME },
        // Mutation patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.MUTATION_METHODS, type: constants_1.CLASS_NAMES.MUTATION },
        // MutationType patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.MUTATION_TYPE_METHODS, type: constants_1.CLASS_NAMES.MUTATION_TYPE },
        // GenomicElementType patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.GENOMIC_ELEMENT_TYPE_METHODS, type: constants_1.CLASS_NAMES.GENOMIC_ELEMENT_TYPE },
        // InteractionType patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.INTERACTION_TYPE_METHODS, type: constants_1.CLASS_NAMES.INTERACTION_TYPE },
        // Chromosome patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.CHROMOSOME_METHODS, type: constants_1.CLASS_NAMES.CHROMOSOME },
        // LogFile patterns
        { pattern: regex_patterns_1.TYPE_INFERENCE_PATTERNS.LOGFILE_METHODS, type: constants_1.CLASS_NAMES.LOGFILE },
    ];
    for (const { pattern, type } of typePatterns) {
        if (pattern.test(expr)) {
            return type;
        }
    }
    return null;
}
//# sourceMappingURL=expression-type-inference.js.map