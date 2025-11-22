import { TYPE_PATTERNS } from '../config/regex-patterns';
import { CLASS_NAMES } from '../config/constants';

/**
 * Maps known instance names to their class types.
 * Pattern-based matching (p*, m*, g*, i*) is handled by inferClassFromVariableName()
 */
const instanceToClassMap: Readonly<Record<string, string>> = {
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
 * Infers class type from variable name patterns using SLiM naming conventions.
 * @param varName - The variable name to analyze
 * @returns The inferred class name or null if no match
 */
function inferClassFromVariableName(varName: string): string | null {
    // Pattern matching for common SLiM naming conventions
    if (TYPE_PATTERNS.SUBPOPULATION.test(varName)) {
        return CLASS_NAMES.SUBPOPULATION;  // p1, p2, p10, etc.
    }
    if (TYPE_PATTERNS.MUTATION_TYPE.test(varName)) {
        return CLASS_NAMES.MUTATION_TYPE;  // m1, m2, m10, etc.
    }
    if (TYPE_PATTERNS.GENOMIC_ELEMENT_TYPE.test(varName)) {
        return CLASS_NAMES.GENOMIC_ELEMENT_TYPE;  // g1, g2, g10, etc.
    }
    if (TYPE_PATTERNS.INTERACTION_TYPE.test(varName)) {
        return CLASS_NAMES.INTERACTION_TYPE;  // i1, i2, i10, etc.
    }
    
    // Check known instance names
    return instanceToClassMap[varName] || null;
}

/**
 * Resolves a class name from an instance name using multiple strategies.
 * @param instanceName - The instance name to resolve
 * @param instanceDefinitions - Map of tracked instance definitions
 * @returns The resolved class name or null
 */
export function resolveClassName(
    instanceName: string,
    instanceDefinitions: Record<string, string> = {}
): string | null {
    return instanceDefinitions[instanceName] || 
           instanceToClassMap[instanceName] ||
           inferClassFromVariableName(instanceName) ||
           null;
}

