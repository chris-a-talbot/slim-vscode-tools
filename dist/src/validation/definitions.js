"use strict";
// ============================================================================
// DEFINITION VALIDATION
// This file contains the code to validate definitions.
// This includes checking for duplicate definitions and reserved identifier usage.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateDefinition = checkDuplicateDefinition;
exports.validateDefinitions = validateDefinitions;
const vscode_languageserver_1 = require("vscode-languageserver");
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const config_3 = require("../config/config");
const config_4 = require("../config/config");
const diagnostics_1 = require("../utils/diagnostics");
/**
 * Helper function to check for duplicate definitions and create diagnostics.
 * @param regex - Regex pattern to match the definition
 * @param seenMap - Map of seen definitions (id -> line number)
 * @param line - The line to check
 * @param lineIndex - The line index (0-based)
 * @param typeName - Human-readable type name for error messages
 * @param startOffset - Character offset for start position
 * @returns Diagnostic object if duplicate found, null otherwise
 */
function checkDuplicateDefinition(regex, seenMap, line, lineIndex, typeName, startOffset = config_1.DEFAULT_POSITIONS.START_OF_LINE) {
    const match = line.match(regex);
    if (match && match.index !== undefined) {
        const id = match[config_1.INDICES.SECOND];
        if (seenMap.has(id)) {
            const startChar = match.index + startOffset;
            const endChar = startOffset > config_1.DEFAULT_POSITIONS.START_OF_LINE ? startChar + id.length : match.index + match[config_1.INDICES.FIRST].length;
            return (0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startChar, endChar, `${typeName} ${id} already defined (first defined at line ${seenMap.get(id) + config_1.PARAMETER_INDEX_OFFSET})`);
        }
        else {
            seenMap.set(id, lineIndex);
        }
    }
    return null;
}
/**
 * Validates duplicate definitions and reserved identifier usage.
 * Also validates that reserved identifiers are not used.
 * @param text - The full source text (unused but kept for consistency)
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
function validateDefinitions(_text, lines) {
    const diagnostics = [];
    const seenConstants = new Map(); // Map of constant name -> line number
    const seenMutationTypes = new Map();
    const seenGenomicElementTypes = new Map();
    const seenInteractionTypes = new Map();
    const seenSubpopulations = new Map();
    const seenSpecies = new Map();
    // Use centralized regex patterns
    const defineConstantRegex = config_3.DEFINITION_PATTERNS.DEFINE_CONSTANT;
    const mutationTypeRegex = config_3.DEFINITION_PATTERNS.MUTATION_TYPE;
    const genomicElementTypeRegex = config_3.DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE;
    const interactionTypeRegex = config_3.DEFINITION_PATTERNS.INTERACTION_TYPE;
    const subpopRegex = config_3.DEFINITION_PATTERNS.SUBPOP;
    const subpopSplitRegex = config_3.DEFINITION_PATTERNS.SUBPOP_SPLIT;
    const speciesRegex = config_3.DEFINITION_PATTERNS.SPECIES;
    lines.forEach((line, lineIndex) => {
        let match;
        // Check for duplicate constants
        if ((match = line.match(defineConstantRegex)) !== null && match.index !== undefined) {
            const constName = match[config_1.INDICES.SECOND];
            const constStartChar = match.index + 'defineConstant("'.length;
            const constEndChar = constStartChar + constName.length;
            if (config_2.RESERVED_IDENTIFIERS.has(constName)) {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, constStartChar, constEndChar, config_4.ERROR_MESSAGES.RESERVED_IDENTIFIER(constName, config_4.RESERVED_IDENTIFIER_CONTEXTS.GLOBAL_CONSTANT)));
            }
            else if (seenConstants.has(constName)) {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, constStartChar, constEndChar, config_4.ERROR_MESSAGES.DUPLICATE_DEFINITION(config_4.TYPE_NAMES_FOR_ERRORS.CONSTANT, constName, seenConstants.get(constName) + config_1.PARAMETER_INDEX_OFFSET)));
            }
            else {
                seenConstants.set(constName, lineIndex);
            }
        }
        // Check for duplicate mutation types
        const mutTypeDiag = checkDuplicateDefinition(mutationTypeRegex, seenMutationTypes, line, lineIndex, config_4.TYPE_NAMES_FOR_ERRORS.MUTATION_TYPE);
        if (mutTypeDiag)
            diagnostics.push(mutTypeDiag);
        // Check for duplicate genomic element types
        const genElemTypeDiag = checkDuplicateDefinition(genomicElementTypeRegex, seenGenomicElementTypes, line, lineIndex, config_4.TYPE_NAMES_FOR_ERRORS.GENOMIC_ELEMENT_TYPE);
        if (genElemTypeDiag)
            diagnostics.push(genElemTypeDiag);
        // Check for duplicate interaction types
        const intTypeDiag = checkDuplicateDefinition(interactionTypeRegex, seenInteractionTypes, line, lineIndex, config_4.TYPE_NAMES_FOR_ERRORS.INTERACTION_TYPE);
        if (intTypeDiag)
            diagnostics.push(intTypeDiag);
        // Check for duplicate subpopulations
        if ((match = line.match(subpopRegex)) !== null || (match = line.match(subpopSplitRegex)) !== null) {
            if (match && match.index !== undefined) {
                const subpopName = match[config_1.INDICES.SECOND];
                if (seenSubpopulations.has(subpopName)) {
                    // Find the position of the subpopulation name in the match
                    const nameStartChar = match.index + match[config_1.INDICES.FIRST].indexOf(`"${subpopName}"`);
                    const nameEndChar = nameStartChar + subpopName.length + config_1.CHAR_OFFSETS.QUOTE_LENGTH;
                    diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, nameStartChar + config_1.CHAR_OFFSETS.SKIP_OPEN_QUOTE, nameEndChar - config_1.CHAR_OFFSETS.SKIP_CLOSE_QUOTE, config_4.ERROR_MESSAGES.DUPLICATE_DEFINITION(config_4.TYPE_NAMES_FOR_ERRORS.SUBPOPULATION, subpopName, seenSubpopulations.get(subpopName) + config_1.PARAMETER_INDEX_OFFSET)));
                }
                else {
                    seenSubpopulations.set(subpopName, lineIndex);
                }
            }
        }
        // Check for duplicate species
        if ((match = line.match(speciesRegex)) !== null && match.index !== undefined) {
            const speciesName = match[config_1.INDICES.SECOND];
            const speciesStartChar = match.index + 'species '.length;
            const speciesEndChar = speciesStartChar + speciesName.length;
            if (config_2.RESERVED_IDENTIFIERS.has(speciesName)) {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, speciesStartChar, speciesEndChar, config_4.ERROR_MESSAGES.RESERVED_SPECIES_NAME(speciesName)));
            }
            else if (seenSpecies.has(speciesName)) {
                diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, speciesStartChar, speciesEndChar, config_4.ERROR_MESSAGES.DUPLICATE_DEFINITION(config_4.TYPE_NAMES_FOR_ERRORS.SPECIES, speciesName, seenSpecies.get(speciesName) + config_1.PARAMETER_INDEX_OFFSET)));
            }
            else {
                seenSpecies.set(speciesName, lineIndex);
            }
        }
    });
    return diagnostics;
}
//# sourceMappingURL=definitions.js.map