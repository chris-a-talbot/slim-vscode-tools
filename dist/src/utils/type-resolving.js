"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveClassName = resolveClassName;
const config_1 = require("../config/config");
const config_2 = require("../config/config");
/**
 * Maps known instance names to their class types.
 * Pattern-based matching (p*, m*, g*, i*) is handled by inferClassFromVariableName()
 */
const instanceToClassMap = {
    'sim': config_2.CLASS_NAMES.SPECIES,
    'community': config_2.CLASS_NAMES.COMMUNITY,
    'species': config_2.CLASS_NAMES.SPECIES,
    'ind': config_2.CLASS_NAMES.INDIVIDUAL,
    'genome': config_2.CLASS_NAMES.HAPLOSOME,
    'mut': config_2.CLASS_NAMES.MUTATION,
    'muts': config_2.CLASS_NAMES.MUTATION,
    'mutations': config_2.CLASS_NAMES.MUTATION,
    'mutation': config_2.CLASS_NAMES.MUTATION,
    'chromosome': config_2.CLASS_NAMES.CHROMOSOME,
    'chr': config_2.CLASS_NAMES.CHROMOSOME,
};
/**
 * Infers class type from variable name patterns using SLiM naming conventions.
 * @param varName - The variable name to analyze
 * @returns The inferred class name or null if no match
 */
function inferClassFromVariableName(varName) {
    // Pattern matching for common SLiM naming conventions
    if (config_1.TYPE_PATTERNS.SUBPOPULATION.test(varName)) {
        return config_2.CLASS_NAMES.SUBPOPULATION; // p1, p2, p10, etc.
    }
    if (config_1.TYPE_PATTERNS.MUTATION_TYPE.test(varName)) {
        return config_2.CLASS_NAMES.MUTATION_TYPE; // m1, m2, m10, etc.
    }
    if (config_1.TYPE_PATTERNS.GENOMIC_ELEMENT_TYPE.test(varName)) {
        return config_2.CLASS_NAMES.GENOMIC_ELEMENT_TYPE; // g1, g2, g10, etc.
    }
    if (config_1.TYPE_PATTERNS.INTERACTION_TYPE.test(varName)) {
        return config_2.CLASS_NAMES.INTERACTION_TYPE; // i1, i2, i10, etc.
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