"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveClassName = resolveClassName;
const regex_patterns_1 = require("../config/regex-patterns");
const constants_1 = require("../config/constants");
/**
 * Maps known instance names to their class types.
 * Pattern-based matching (p*, m*, g*, i*) is handled by inferClassFromVariableName()
 */
const instanceToClassMap = {
    'sim': constants_1.CLASS_NAMES.SPECIES,
    'community': constants_1.CLASS_NAMES.COMMUNITY,
    'species': constants_1.CLASS_NAMES.SPECIES,
    'ind': constants_1.CLASS_NAMES.INDIVIDUAL,
    'genome': constants_1.CLASS_NAMES.HAPLOSOME,
    'mut': constants_1.CLASS_NAMES.MUTATION,
    'muts': constants_1.CLASS_NAMES.MUTATION,
    'mutations': constants_1.CLASS_NAMES.MUTATION,
    'mutation': constants_1.CLASS_NAMES.MUTATION,
    'chromosome': constants_1.CLASS_NAMES.CHROMOSOME,
    'chr': constants_1.CLASS_NAMES.CHROMOSOME,
};
/**
 * Infers class type from variable name patterns using SLiM naming conventions.
 * @param varName - The variable name to analyze
 * @returns The inferred class name or null if no match
 */
function inferClassFromVariableName(varName) {
    // Pattern matching for common SLiM naming conventions
    if (regex_patterns_1.TYPE_PATTERNS.SUBPOPULATION.test(varName)) {
        return constants_1.CLASS_NAMES.SUBPOPULATION; // p1, p2, p10, etc.
    }
    if (regex_patterns_1.TYPE_PATTERNS.MUTATION_TYPE.test(varName)) {
        return constants_1.CLASS_NAMES.MUTATION_TYPE; // m1, m2, m10, etc.
    }
    if (regex_patterns_1.TYPE_PATTERNS.GENOMIC_ELEMENT_TYPE.test(varName)) {
        return constants_1.CLASS_NAMES.GENOMIC_ELEMENT_TYPE; // g1, g2, g10, etc.
    }
    if (regex_patterns_1.TYPE_PATTERNS.INTERACTION_TYPE.test(varName)) {
        return constants_1.CLASS_NAMES.INTERACTION_TYPE; // i1, i2, i10, etc.
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
function resolveClassName(instanceName, instanceDefinitions = {}) {
    return instanceDefinitions[instanceName] ||
        instanceToClassMap[instanceName] ||
        inferClassFromVariableName(instanceName) ||
        null;
}
//# sourceMappingURL=type-resolving.js.map