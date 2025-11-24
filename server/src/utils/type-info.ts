// ============================================================================
// TYPE UTILITIES
// Consolidated type resolution, parsing, and analysis for SLiM/Eidos types
// ============================================================================

import { TEXT_PROCESSING_PATTERNS, TYPE_PATTERNS, CLASS_NAMES } from '../config/config';
import { ParameterInfo } from '../config/types';
import { TYPE_INFERENCE_PATTERNS } from '../config/config';
import { TypePattern } from '../config/types';

export type { ParameterInfo };

// ============================================================================
// TYPE INFORMATION
// ============================================================================

/**
 * Extended type information including singleton/vector status.
 */
export interface TypeInfo {
    baseType: string;      // Type without $ suffix
    isSingleton: boolean;  // True if has $ suffix
    isVector: boolean;     // True if no $ suffix
    isNullable: boolean;   // True if starts with N
}

// ============================================================================
// TYPE CLASSIFICATION
// ============================================================================

/**
 * Checks if a type string represents a singleton (has $ suffix).
 * In SLiM/Eidos, $ indicates a singleton (single value), no $ indicates a vector.
 */
export function isSingletonType(type: string): boolean {
    if (!type) return false;
    return TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}

/**
 * Checks if a type string represents a vector (no $ suffix).
 * In SLiM/Eidos, no $ indicates a vector, $ indicates a singleton.
 */
export function isVectorType(type: string): boolean {
    if (!type) return false;
    return !TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}

/**
 * Gets the base type without the $ suffix.
 */
export function getBaseType(type: string): string {
    if (!type) return type;
    return type.replace(TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX, '');
}

/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 */
export function isNullableType(type: string): boolean {
    if (!type) return false;
    const baseType = getBaseType(type);
    return TEXT_PROCESSING_PATTERNS.NULLABLE_TYPE.test(baseType) || 
           TEXT_PROCESSING_PATTERNS.NULLABLE_OBJECT_TYPE.test(baseType);
}

/**
 * Parses a type string into detailed type information.
 * @param type - The type string to parse (e.g., "integer$", "object<Mutation>", "Ni")
 */
export function parseTypeInfo(type: string): TypeInfo {
    if (!type) {
        return {
            baseType: '',
            isSingleton: false,
            isVector: false,
            isNullable: false
        };
    }
    
    const hasDollar = isSingletonType(type);
    const baseType = getBaseType(type);
    
    return {
        baseType,
        isSingleton: hasDollar,
        isVector: !hasDollar,
        isNullable: isNullableType(type)
    };
}

// ============================================================================
// PARAMETER EXTRACTION
// ============================================================================

/**
 * Extracts parameter types from a function/method signature.
 * Handles SLiM's complex signature format including optional parameters,
 * generic types, and default values.
 * 
 * @param signature - The signature string (e.g., "(integer)funcName(integer x, [string y = 'default'])")
 * @returns Array of parameter info with types, names, and optionality
 */
export function extractParameterTypes(signature: string): ParameterInfo[] {
    const params: ParameterInfo[] = [];
    if (!signature) return params;
    
    // Extract the parameter list from parentheses
    const paramMatch = signature.match(TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
    if (!paramMatch) return params;
    
    const paramString = paramMatch[1];
    if (!paramString.trim()) return params;
    
    // Split by comma, handling nested generics and default values
    const paramParts: string[] = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < paramString.length; i++) {
        const char = paramString[i];
        if (char === '<') depth++;
        else if (char === '>') depth--;
        else if (char === ',' && depth === 0) {
            paramParts.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) paramParts.push(current.trim());
    
    // Parse each parameter
    for (const param of paramParts) {
        // Match optional parameters: [Ni$ name = NULL] or [integer x = 5]
        const optionalMatch = param.match(TEXT_PROCESSING_PATTERNS.OPTIONAL_PARAMETER);
        const isOptional = !!optionalMatch;
        const paramContent = optionalMatch ? optionalMatch[1] : param;
        
        // Extract type and name from parameter
        const typeNameMatch = paramContent.match(TEXT_PROCESSING_PATTERNS.TYPE_NAME_PARAM);
        if (typeNameMatch) {
            params.push({
                name: typeNameMatch[2],
                type: typeNameMatch[1],
                isOptional: isOptional,
                defaultValue: typeNameMatch[3]
            });
        } else {
            // Just a type, no name
            const typeMatch = paramContent.match(TEXT_PROCESSING_PATTERNS.TYPE_ONLY);
            if (typeMatch) {
                params.push({
                    name: null,
                    type: typeMatch[1],
                    isOptional: isOptional
                });
            }
        }
    }
    
    return params;
}

// ============================================================================
// CLASS NAME RESOLUTION
// ============================================================================

/**
 * Maps known instance names to their class types.
 * Pattern-based matching (p*, m*, g*, i*) is handled inline in resolveClassName()
 */
const INSTANCE_TO_CLASS_MAP: Readonly<Record<string, string>> = {
    'sim': CLASS_NAMES.SPECIES,
    'community': CLASS_NAMES.COMMUNITY,
    'species': CLASS_NAMES.SPECIES,
    'ind': CLASS_NAMES.INDIVIDUAL,
    'genome': CLASS_NAMES.HAPLOSOME,
    'mut': CLASS_NAMES.MUTATION,
    'muts': CLASS_NAMES.MUTATION,
    'mutations': CLASS_NAMES.MUTATION,
    'mutation': CLASS_NAMES.MUTATION,
    'chromosome': CLASS_NAMES.CHROMOSOME,
    'chr': CLASS_NAMES.CHROMOSOME,
};

/**
 * Resolves a class name from an instance name using multiple strategies:
 * 1. Check tracked instance definitions (from code analysis)
 * 2. Check known instance names (sim, community, etc.)
 * 3. Infer from naming patterns (p1, m1, g1, i1)
 * 
 * @param instanceName - The instance name to resolve
 * @param instanceDefinitions - Map of tracked instance definitions from code analysis
 * @returns The resolved class name or null if not found
 */
export function resolveClassName(
    instanceName: string,
    instanceDefinitions: Record<string, string> = {}
): string | null {
    // Check tracked instance definitions
    if (instanceDefinitions[instanceName]) {
        return instanceDefinitions[instanceName];
    }
    
    // Check known instance names
    if (INSTANCE_TO_CLASS_MAP[instanceName]) {
        return INSTANCE_TO_CLASS_MAP[instanceName];
    }
    
    // Infer from naming patterns using SLiM conventions
    if (TYPE_PATTERNS.SUBPOPULATION.test(instanceName)) {
        return CLASS_NAMES.SUBPOPULATION;  // p1, p2, p10, etc.
    }
    if (TYPE_PATTERNS.MUTATION_TYPE.test(instanceName)) {
        return CLASS_NAMES.MUTATION_TYPE;  // m1, m2, m10, etc.
    }
    if (TYPE_PATTERNS.GENOMIC_ELEMENT_TYPE.test(instanceName)) {
        return CLASS_NAMES.GENOMIC_ELEMENT_TYPE;  // g1, g2, g10, etc.
    }
    if (TYPE_PATTERNS.INTERACTION_TYPE.test(instanceName)) {
        return CLASS_NAMES.INTERACTION_TYPE;  // i1, i2, i10, etc.
    }
    
    return null;
}

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

