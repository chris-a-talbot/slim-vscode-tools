// ============================================================================
// TYPE INFERENCE FROM EXPRESSIONS
// Infers class type from method calls and property access in expressions.
// This is used to provide type information for the hover and signature help providers.
// ============================================================================

import { TYPE_INFERENCE_PATTERNS } from '../config/regex-patterns';
import { CLASS_NAMES } from '../config/constants';
import { TypePattern } from '../types';

/**
 * Infers class type from method calls and property access in expressions.
 * @param expr - The expression to analyze
 * @returns The inferred class type or null if no match
 */
export function inferTypeFromExpression(expr: string): string | null {
    const trimmed = expr.trim();
    
    // Check for outermost function calls that return specific types
    // These take precedence over inner method calls - if the expression is numeric/logical,
    // we shouldn't infer an object type
    const numericFunctions = TYPE_INFERENCE_PATTERNS.NUMERIC_FUNCTIONS;
    const logicalOperators = TYPE_INFERENCE_PATTERNS.LOGICAL_OPERATORS;
    const logicalFunctions = TYPE_INFERENCE_PATTERNS.LOGICAL_FUNCTIONS;
    
    // If expression starts with numeric function or contains arithmetic operators,
    // it returns a numeric type, not an object
    if (numericFunctions.test(trimmed) || TYPE_INFERENCE_PATTERNS.ARITHMETIC_OPERATORS.test(trimmed)) {
        return null; // Don't infer object type for numeric results
    }
    
    // If expression starts with logical operator or logical function,
    // it returns a logical type, not an object
    if (logicalOperators.test(trimmed) || logicalFunctions.test(trimmed)) {
        return null; // Don't infer object type for logical results
    }
    
    // Common SLiM patterns that return specific types
    const typePatterns: TypePattern[] = [
        // Subpopulation patterns
        { pattern: TYPE_INFERENCE_PATTERNS.SUBPOPULATION_METHODS, type: CLASS_NAMES.SUBPOPULATION },
        
        // Individual patterns
        { pattern: TYPE_INFERENCE_PATTERNS.INDIVIDUAL_METHODS, type: CLASS_NAMES.INDIVIDUAL },
        
        // Haplosome/Genome patterns
        { pattern: TYPE_INFERENCE_PATTERNS.HAPLOSOME_METHODS, type: CLASS_NAMES.HAPLOSOME },
        
        // Mutation patterns
        { pattern: TYPE_INFERENCE_PATTERNS.MUTATION_METHODS, type: CLASS_NAMES.MUTATION },
        
        // MutationType patterns
        { pattern: TYPE_INFERENCE_PATTERNS.MUTATION_TYPE_METHODS, type: CLASS_NAMES.MUTATION_TYPE },
        
        // GenomicElementType patterns
        { pattern: TYPE_INFERENCE_PATTERNS.GENOMIC_ELEMENT_TYPE_METHODS, type: CLASS_NAMES.GENOMIC_ELEMENT_TYPE },
        
        // InteractionType patterns
        { pattern: TYPE_INFERENCE_PATTERNS.INTERACTION_TYPE_METHODS, type: CLASS_NAMES.INTERACTION_TYPE },
        
        // Chromosome patterns
        { pattern: TYPE_INFERENCE_PATTERNS.CHROMOSOME_METHODS, type: CLASS_NAMES.CHROMOSOME },
        
        // LogFile patterns
        { pattern: TYPE_INFERENCE_PATTERNS.LOGFILE_METHODS, type: CLASS_NAMES.LOGFILE },
    ];
    
    for (const { pattern, type } of typePatterns) {
        if (pattern.test(expr)) {
            return type;
        }
    }
    return null;
}

