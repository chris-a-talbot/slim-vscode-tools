"use strict";
// ============================================================================
// UNDEFINED REFERENCES VALIDATION
// This file contains the code check that mutations, genomes, and subpopulations are defined before use.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUndefinedReferences = validateUndefinedReferences;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostics_1 = require("../utils/diagnostics");
const config_1 = require("../config/config");
const config_2 = require("../config/config");
const config_3 = require("../config/config");
/**
 * Validates undefined references to SLiM types (mutation types, genomic element types, subpopulations).
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
function validateUndefinedReferences(_text, lines) {
    const diagnostics = [];
    const fullText = lines.join('\n');
    /**
     * Checks for undefined references to a specific type pattern.
     */
    function checkUndefinedReferences(refRegex, definitionPattern, hasDynamicCreation, typeName, contextCheck = null) {
        const definitionPatternStr = typeof definitionPattern === 'string'
            ? definitionPattern
            : definitionPattern.source;
        lines.forEach((line, lineIndex) => {
            let match;
            // Reset regex lastIndex for global regex
            refRegex.lastIndex = 0;
            while ((match = refRegex.exec(line)) !== null) {
                const typeId = match[1];
                // Check if this is part of a definition on the same line
                // Escape special regex characters in the ID to use it safely in a pattern
                // This prevents false positives when the ID contains regex metacharacters
                const escapedId = typeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Match if the ID appears right after the definition function call
                // Quotes are optional (some functions allow quoted or unquoted IDs)
                const isDefinitionOnSameLine = new RegExp(`${definitionPatternStr}\\s*\\(\\s*["']?${escapedId}["']?`).test(line);
                if (!isDefinitionOnSameLine) {
                    // Check if it's been defined in previous lines
                    const beforeThisLine = lines.slice(0, lineIndex).join('\n');
                    const definitionRegex = new RegExp(`${definitionPatternStr}\\s*\\(\\s*"?${escapedId}"?`);
                    const hasExplicitDefinition = definitionRegex.test(beforeThisLine);
                    // Skip warnings if dynamic creation is detected or explicit definition exists
                    if (!hasExplicitDefinition && !hasDynamicCreation) {
                        // Optional context check (e.g., for subpopulations)
                        if (contextCheck && !contextCheck(line, match)) {
                            continue;
                        }
                        if (match.index !== undefined) {
                            diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, lineIndex, match.index, match.index + typeId.length, config_3.ERROR_MESSAGES.UNDEFINED_REFERENCE(typeName, typeId)));
                        }
                    }
                }
            }
        });
    }
    // Check mutation types (m1, m2, etc.)
    // Detect if mutation types are created dynamically (not with string literals)
    // This happens when IDs are computed at runtime, so we can't validate them statically
    const hasDynamicMutTypeCreation = config_2.VALIDATION_PATTERNS.DYNAMIC_MUT_TYPE.test(fullText) ||
        config_2.VALIDATION_PATTERNS.DYNAMIC_MUT_TYPE_CONCAT.test(fullText);
    // Match mutation type IDs: m1, m2, m10, etc.
    // \b ensures we match whole words (not "m1" inside "m10")
    checkUndefinedReferences(config_2.VALIDATION_PATTERNS.MUTATION_TYPE_REF, 'initializeMutationType(?:Nuc)?', hasDynamicMutTypeCreation, config_1.TYPE_NAMES_FOR_ERRORS.MUTATION_TYPE);
    // Check genomic element types (g1, g2, etc.)
    const hasDynamicGenElemTypeCreation = config_2.VALIDATION_PATTERNS.DYNAMIC_GEN_ELEM_TYPE.test(fullText) ||
        config_2.VALIDATION_PATTERNS.DYNAMIC_GEN_ELEM_TYPE_CONCAT.test(fullText);
    checkUndefinedReferences(config_2.VALIDATION_PATTERNS.GENOMIC_ELEMENT_TYPE_REF, 'initializeGenomicElementType', hasDynamicGenElemTypeCreation, config_3.TYPE_NAMES_FOR_ERRORS.GENOMIC_ELEMENT_TYPE);
    // Check subpopulations (p1, p2, etc.) with context validation
    // Skip subpopulation validation if readFromPopulationFile() is detected
    // (populations are assumed to be loaded from file in that case)
    const hasReadFromPopulationFile = /readFromPopulationFile\s*\(/.test(fullText);
    const hasDynamicSubpopCreation = config_2.VALIDATION_PATTERNS.DYNAMIC_SUBPOP.test(fullText);
    if (!hasReadFromPopulationFile) {
        checkUndefinedReferences(config_2.VALIDATION_PATTERNS.SUBPOPULATION_REF, // Match subpopulation IDs: p1, p2, etc.
        '(sim\\.)?addSubpop(?:Split)?', // Match both sim.addSubpop and addSubpop
        hasDynamicSubpopCreation, config_3.TYPE_NAMES_FOR_ERRORS.SUBPOPULATION, (line, match) => {
            // Only warn if it looks like it's being used as a subpopulation
            // Check surrounding context to avoid false positives (e.g., "p1" in "temp1")
            // We want to match "p1" when it's a standalone identifier, not part of a word
            if (match.index === undefined)
                return false;
            const context = line.substring(Math.max(0, match.index - config_1.LOOKAHEAD_LIMITS.CONTEXT_WINDOW), match.index + match[config_1.INDICES.SECOND].length + config_1.LOOKAHEAD_LIMITS.CONTEXT_WINDOW);
            // Ensure p1 is surrounded by non-word characters (not part of another identifier)
            return config_2.TYPE_PATTERNS.TYPE_ID_IN_CONTEXT.test(context);
        });
    }
    return diagnostics;
}
//# sourceMappingURL=references.js.map