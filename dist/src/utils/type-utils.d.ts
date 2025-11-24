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
 * @param type - The type string to check
 * @returns True if the type is a singleton (has $ suffix)
 */
export declare function isSingletonType(type: string): boolean;
/**
 * Checks if a type string represents a vector (no $ suffix).
 * In SLiM/Eidos, no $ indicates a vector, $ indicates a singleton.
 * @param type - The type string to check
 * @returns True if the type is a vector (no $ suffix)
 */
export declare function isVectorType(type: string): boolean;
/**
 * Gets the base type without the $ suffix.
 * @param type - The type string
 * @returns The type without $ suffix
 */
export declare function getBaseType(type: string): string;
/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 * @param type - The type string to check (may include $ suffix)
 * @returns True if the type is nullable
 */
export declare function isNullableType(type: string): boolean;
/**
 * Parses a type string into detailed type information.
 * @param type - The type string to parse (e.g., "integer$", "object<Mutation>", "Ni")
 * @returns TypeInfo object with parsed information
 */
export declare function parseTypeInfo(type: string): TypeInfo;
/**
 * Extracts parameter types from a function/method signature.
 * @param signature - The signature string (e.g., "(integer)funcName(integer x, string y)")
 * @returns Array of parameter info
 */
export declare function extractParameterTypes(signature: string): ParameterInfo[];
//# sourceMappingURL=type-utils.d.ts.map