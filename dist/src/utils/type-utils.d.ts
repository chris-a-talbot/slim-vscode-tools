import { ParameterInfo } from '../types';
export type { ParameterInfo };
/**
 * Checks if a type string represents a nullable type.
 * Nullable types in Eidos/SLiM start with 'N' (e.g., Ni, No, Nl, Ns, Nf, Nif, Nis).
 * @param type - The type string to check (may include $ suffix)
 * @returns True if the type is nullable
 */
export declare function isNullableType(type: string): boolean;
/**
 * Extracts parameter types from a function/method signature.
 * @param signature - The signature string (e.g., "(integer)funcName(integer x, string y)")
 * @returns Array of parameter info
 */
export declare function extractParameterTypes(signature: string): ParameterInfo[];
//# sourceMappingURL=type-utils.d.ts.map