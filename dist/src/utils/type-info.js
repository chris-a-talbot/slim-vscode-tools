"use strict";
// ============================================================================
// TYPE UTILITIES
// Consolidated type resolution, parsing, and analysis for SLiM/Eidos types
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSingletonType = isSingletonType;
exports.isVectorType = isVectorType;
exports.getBaseType = getBaseType;
exports.isNullableType = isNullableType;
exports.parseTypeInfo = parseTypeInfo;
exports.extractParameterTypes = extractParameterTypes;
exports.resolveClassName = resolveClassName;
exports.inferTypeFromExpression = inferTypeFromExpression;
const config_1 = require("../config/config");
const config_2 = require("../config/config");
// ============================================================================
// TYPE CLASSIFICATION
// ============================================================================
/**
 * Checks if a type string represents a singleton (has $ suffix).
 * In SLiM/Eidos, $ indicates a singleton (single value), no $ indicates a vector.
 */
function isSingletonType(type) {
    if (!type)
        return false;
    return config_1.TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}
/**
 * Checks if a type string represents a vector (no $ suffix).
 * In SLiM/Eidos, no $ indicates a vector, $ indicates a singleton.
 */
function isVectorType(type) {
    if (!type)
        return false;
    return !config_1.TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}
/**
 * Gets the base type without the $ suffix.
 */
function getBaseType(type) {
    if (!type)
        return type;
    return type.replace(config_1.TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX, '');
}
/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 */
function isNullableType(type) {
    if (!type)
        return false;
    const baseType = getBaseType(type);
    return config_1.TEXT_PROCESSING_PATTERNS.NULLABLE_TYPE.test(baseType) ||
        config_1.TEXT_PROCESSING_PATTERNS.NULLABLE_OBJECT_TYPE.test(baseType);
}
/**
 * Parses a type string into detailed type information.
 * @param type - The type string to parse (e.g., "integer$", "object<Mutation>", "Ni")
 */
function parseTypeInfo(type) {
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
function extractParameterTypes(signature) {
    const params = [];
    if (!signature)
        return params;
    // Extract the parameter list from parentheses
    const paramMatch = signature.match(config_1.TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
    if (!paramMatch)
        return params;
    const paramString = paramMatch[1];
    if (!paramString.trim())
        return params;
    // Split by comma, handling nested generics and default values
    const paramParts = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < paramString.length; i++) {
        const char = paramString[i];
        if (char === '<')
            depth++;
        else if (char === '>')
            depth--;
        else if (char === ',' && depth === 0) {
            paramParts.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim())
        paramParts.push(current.trim());
    // Parse each parameter
    for (const param of paramParts) {
        // Match optional parameters: [Ni$ name = NULL] or [integer x = 5]
        const optionalMatch = param.match(config_1.TEXT_PROCESSING_PATTERNS.OPTIONAL_PARAMETER);
        const isOptional = !!optionalMatch;
        const paramContent = optionalMatch ? optionalMatch[1] : param;
        // Extract type and name from parameter
        const typeNameMatch = paramContent.match(config_1.TEXT_PROCESSING_PATTERNS.TYPE_NAME_PARAM);
        if (typeNameMatch) {
            params.push({
                name: typeNameMatch[2],
                type: typeNameMatch[1],
                isOptional: isOptional,
                defaultValue: typeNameMatch[3]
            });
        }
        else {
            // Just a type, no name
            const typeMatch = paramContent.match(config_1.TEXT_PROCESSING_PATTERNS.TYPE_ONLY);
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
const INSTANCE_TO_CLASS_MAP = {
    'sim': config_1.CLASS_NAMES.SPECIES,
    'community': config_1.CLASS_NAMES.COMMUNITY,
    'species': config_1.CLASS_NAMES.SPECIES,
    'ind': config_1.CLASS_NAMES.INDIVIDUAL,
    'genome': config_1.CLASS_NAMES.HAPLOSOME,
    'mut': config_1.CLASS_NAMES.MUTATION,
    'muts': config_1.CLASS_NAMES.MUTATION,
    'mutations': config_1.CLASS_NAMES.MUTATION,
    'mutation': config_1.CLASS_NAMES.MUTATION,
    'chromosome': config_1.CLASS_NAMES.CHROMOSOME,
    'chr': config_1.CLASS_NAMES.CHROMOSOME,
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
function resolveClassName(instanceName, instanceDefinitions = {}) {
    // Check tracked instance definitions
    if (instanceDefinitions[instanceName]) {
        return instanceDefinitions[instanceName];
    }
    // Check known instance names
    if (INSTANCE_TO_CLASS_MAP[instanceName]) {
        return INSTANCE_TO_CLASS_MAP[instanceName];
    }
    // Infer from naming patterns using SLiM conventions
    if (config_1.TYPE_PATTERNS.SUBPOPULATION.test(instanceName)) {
        return config_1.CLASS_NAMES.SUBPOPULATION; // p1, p2, p10, etc.
    }
    if (config_1.TYPE_PATTERNS.MUTATION_TYPE.test(instanceName)) {
        return config_1.CLASS_NAMES.MUTATION_TYPE; // m1, m2, m10, etc.
    }
    if (config_1.TYPE_PATTERNS.GENOMIC_ELEMENT_TYPE.test(instanceName)) {
        return config_1.CLASS_NAMES.GENOMIC_ELEMENT_TYPE; // g1, g2, g10, etc.
    }
    if (config_1.TYPE_PATTERNS.INTERACTION_TYPE.test(instanceName)) {
        return config_1.CLASS_NAMES.INTERACTION_TYPE; // i1, i2, i10, etc.
    }
    return null;
}
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
    const numericFunctions = config_2.TYPE_INFERENCE_PATTERNS.NUMERIC_FUNCTIONS;
    const logicalOperators = config_2.TYPE_INFERENCE_PATTERNS.LOGICAL_OPERATORS;
    const logicalFunctions = config_2.TYPE_INFERENCE_PATTERNS.LOGICAL_FUNCTIONS;
    // If expression starts with numeric function or contains arithmetic operators,
    // it returns a numeric type, not an object
    if (numericFunctions.test(trimmed) || config_2.TYPE_INFERENCE_PATTERNS.ARITHMETIC_OPERATORS.test(trimmed)) {
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
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.SUBPOPULATION_METHODS, type: config_1.CLASS_NAMES.SUBPOPULATION },
        // Individual patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.INDIVIDUAL_METHODS, type: config_1.CLASS_NAMES.INDIVIDUAL },
        // Haplosome/Genome patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.HAPLOSOME_METHODS, type: config_1.CLASS_NAMES.HAPLOSOME },
        // Mutation patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.MUTATION_METHODS, type: config_1.CLASS_NAMES.MUTATION },
        // MutationType patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.MUTATION_TYPE_METHODS, type: config_1.CLASS_NAMES.MUTATION_TYPE },
        // GenomicElementType patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.GENOMIC_ELEMENT_TYPE_METHODS, type: config_1.CLASS_NAMES.GENOMIC_ELEMENT_TYPE },
        // InteractionType patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.INTERACTION_TYPE_METHODS, type: config_1.CLASS_NAMES.INTERACTION_TYPE },
        // Chromosome patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.CHROMOSOME_METHODS, type: config_1.CLASS_NAMES.CHROMOSOME },
        // LogFile patterns
        { pattern: config_2.TYPE_INFERENCE_PATTERNS.LOGFILE_METHODS, type: config_1.CLASS_NAMES.LOGFILE },
    ];
    for (const { pattern, type } of typePatterns) {
        if (pattern.test(expr)) {
            return type;
        }
    }
    return null;
}
//# sourceMappingURL=type-info.js.map