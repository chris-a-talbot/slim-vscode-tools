import { ParameterInfo } from '../config/types';
export type { ParameterInfo };
/**
 * Extended type information including singleton/vector status.
 */
export interface TypeInfo {
    baseType: string;
    isSingleton: boolean;
    isVector: boolean;
    isNullable: boolean;
}
/**
 * Checks if a type string represents a singleton (has $ suffix).
 * In SLiM/Eidos, $ indicates a singleton (single value), no $ indicates a vector.
 */
export declare function isSingletonType(type: string): boolean;
/**
 * Checks if a type string represents a vector (no $ suffix).
 * In SLiM/Eidos, no $ indicates a vector, $ indicates a singleton.
 */
export declare function isVectorType(type: string): boolean;
/**
 * Gets the base type without the $ suffix.
 */
export declare function getBaseType(type: string): string;
/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 */
export declare function isNullableType(type: string): boolean;
/**
 * Parses a type string into detailed type information.
 * @param type - The type string to parse (e.g., "integer$", "object<Mutation>", "Ni")
 */
export declare function parseTypeInfo(type: string): TypeInfo;
/**
 * Extracts parameter types from a function/method signature.
 * Handles SLiM's complex signature format including optional parameters,
 * generic types, and default values.
 *
 * @param signature - The signature string (e.g., "(integer)funcName(integer x, [string y = 'default'])")
 * @returns Array of parameter info with types, names, and optionality
 */
export declare function extractParameterTypes(signature: string): ParameterInfo[];
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
export declare function resolveClassName(instanceName: string, instanceDefinitions?: Record<string, string>): string | null;
/**
 * Infers class type from method calls and property access in expressions.
 * @param expr - The expression to analyze
 * @returns The inferred class type or null if no match
 */
export declare function inferTypeFromExpression(expr: string): string | null;
//# sourceMappingURL=type-info.d.ts.map