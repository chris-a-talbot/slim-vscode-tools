import { TEXT_PROCESSING_PATTERNS } from '../config/config';
import { ParameterInfo } from '../config/types';

export type { ParameterInfo };

/**
 * Extended type information including singleton/vector status.
 */
export interface TypeInfo {
    baseType: string;      // Type without $ suffix
    isSingleton: boolean;  // True if has $ suffix
    isVector: boolean;     // True if no $ suffix
    isNullable: boolean;   // True if starts with N
}

/**
 * Checks if a type string represents a singleton (has $ suffix).
 * In SLiM/Eidos, $ indicates a singleton (single value), no $ indicates a vector.
 * @param type - The type string to check
 * @returns True if the type is a singleton (has $ suffix)
 */
export function isSingletonType(type: string): boolean {
    if (!type) return false;
    return TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}

/**
 * Checks if a type string represents a vector (no $ suffix).
 * In SLiM/Eidos, no $ indicates a vector, $ indicates a singleton.
 * @param type - The type string to check
 * @returns True if the type is a vector (no $ suffix)
 */
export function isVectorType(type: string): boolean {
    if (!type) return false;
    return !TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX.test(type);
}

/**
 * Gets the base type without the $ suffix.
 * @param type - The type string
 * @returns The type without $ suffix
 */
export function getBaseType(type: string): string {
    if (!type) return type;
    return type.replace(TEXT_PROCESSING_PATTERNS.DOLLAR_SUFFIX, '');
}

/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 * @param type - The type string to check (may include $ suffix)
 * @returns True if the type is nullable
 */
export function isNullableType(type: string): boolean {
    if (!type) return false;
    // Remove $ suffix if present (e.g., "Ni$" -> "Ni")
    // $ indicates a singleton, not a vector (contrary to earlier comment)
    const baseType = getBaseType(type);
    // Check if it starts with N (nullable indicator in Eidos/SLiM)
    // Examples: Ni (nullable integer), No (nullable object), No<Subpopulation> (nullable generic)
    return TEXT_PROCESSING_PATTERNS.NULLABLE_TYPE.test(baseType) || TEXT_PROCESSING_PATTERNS.NULLABLE_OBJECT_TYPE.test(baseType);
}

/**
 * Parses a type string into detailed type information.
 * @param type - The type string to parse (e.g., "integer$", "object<Mutation>", "Ni")
 * @returns TypeInfo object with parsed information
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

/**
 * Extracts parameter types from a function/method signature.
 * @param signature - The signature string (e.g., "(integer)funcName(integer x, string y)")
 * @returns Array of parameter info
 */
export function extractParameterTypes(signature: string): ParameterInfo[] {
    const params: ParameterInfo[] = [];
    if (!signature) return params;
    
    // Extract the parameter list from parentheses
    // [^)]* matches everything inside parens (handles nested parens in generics)
    const paramMatch = signature.match(TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
    if (!paramMatch) return params;
    
    const paramString = paramMatch[1];
    if (!paramString.trim()) return params; // No parameters
    
    // Split by comma, but be careful of nested generics and default values
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
        // Brackets indicate optional parameters in SLiM/Eidos signatures
        const optionalMatch = param.match(TEXT_PROCESSING_PATTERNS.OPTIONAL_PARAMETER);
        const isOptional = !!optionalMatch;
        const paramContent = optionalMatch ? optionalMatch[1] : param;
        
        // Extract type and name from parameter
        // Pattern matches: "type name" or "type$ name" or "type<Generic> name" or "type name = default"
        // [\w<>]+ matches type name (including generics like "object<Subpopulation>")
        // (?:\$)? optionally matches $ suffix for vector types
        const typeNameMatch = paramContent.match(TEXT_PROCESSING_PATTERNS.TYPE_NAME_PARAM);
        if (typeNameMatch) {
            params.push({
                name: typeNameMatch[2],
                type: typeNameMatch[1],
                isOptional: isOptional,
                defaultValue: typeNameMatch[3]
            });
        } else {
            // Just a type, no name (unlikely)
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

