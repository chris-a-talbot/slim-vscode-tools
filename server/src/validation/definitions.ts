// ============================================================================
// DEFINITION VALIDATION
// This file contains the code to validate definitions.
// This includes checking for duplicate definitions and reserved identifier usage.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { INDICES, PARAMETER_INDEX_OFFSET, CHAR_OFFSETS, DEFAULT_POSITIONS } from '../config/config';
import { RESERVED_IDENTIFIERS } from '../config/config';
import { DEFINITION_PATTERNS } from '../config/config';
import { ERROR_MESSAGES, TYPE_NAMES_FOR_ERRORS as TYPE_NAMES, RESERVED_IDENTIFIER_CONTEXTS } from '../config/config';
import { createDiagnostic } from '../utils/diagnostics';

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
export function checkDuplicateDefinition(
    regex: RegExp,
    seenMap: Map<string, number>,
    line: string,
    lineIndex: number,
    typeName: string,
    startOffset: number = DEFAULT_POSITIONS.START_OF_LINE
): Diagnostic | null {
    const match = line.match(regex);
    if (match && match.index !== undefined) {
        const id = match[INDICES.SECOND];
        if (seenMap.has(id)) {
            const startChar = match.index + startOffset;
            const endChar = startOffset > DEFAULT_POSITIONS.START_OF_LINE ? startChar + id.length : match.index + match[INDICES.FIRST].length;
            return createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                startChar,
                endChar,
                `${typeName} ${id} already defined (first defined at line ${seenMap.get(id)! + PARAMETER_INDEX_OFFSET})`
            );
        } else {
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
export function validateDefinitions(_text: string, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const seenConstants = new Map<string, number>(); // Map of constant name -> line number
    const seenMutationTypes = new Map<string, number>();
    const seenGenomicElementTypes = new Map<string, number>();
    const seenInteractionTypes = new Map<string, number>();
    const seenSubpopulations = new Map<string, number>();
    const seenSpecies = new Map<string, number>();
    
    // Use centralized regex patterns
    const defineConstantRegex = DEFINITION_PATTERNS.DEFINE_CONSTANT;
    const mutationTypeRegex = DEFINITION_PATTERNS.MUTATION_TYPE;
    const genomicElementTypeRegex = DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE;
    const interactionTypeRegex = DEFINITION_PATTERNS.INTERACTION_TYPE;
    const subpopRegex = DEFINITION_PATTERNS.SUBPOP;
    const subpopSplitRegex = DEFINITION_PATTERNS.SUBPOP_SPLIT;
    const speciesRegex = DEFINITION_PATTERNS.SPECIES;
    
    lines.forEach((line, lineIndex) => {
        let match: RegExpMatchArray | null;
        
        // Check for duplicate constants
        if ((match = line.match(defineConstantRegex)) !== null && match.index !== undefined) {
            const constName = match[INDICES.SECOND];
            const constStartChar = match.index + 'defineConstant("'.length;
            const constEndChar = constStartChar + constName.length;
            
            if (RESERVED_IDENTIFIERS.has(constName)) {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    constStartChar,
                    constEndChar,
                    ERROR_MESSAGES.RESERVED_IDENTIFIER(constName, RESERVED_IDENTIFIER_CONTEXTS.GLOBAL_CONSTANT)
                ));
            } else if (seenConstants.has(constName)) {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    constStartChar,
                    constEndChar,
                    ERROR_MESSAGES.DUPLICATE_DEFINITION(TYPE_NAMES.CONSTANT, constName, seenConstants.get(constName)! + PARAMETER_INDEX_OFFSET)
                ));
            } else {
                seenConstants.set(constName, lineIndex);
            }
        }
        
        // Check for duplicate mutation types
        const mutTypeDiag = checkDuplicateDefinition(mutationTypeRegex, seenMutationTypes, line, lineIndex, TYPE_NAMES.MUTATION_TYPE);
        if (mutTypeDiag) diagnostics.push(mutTypeDiag);
        
        // Check for duplicate genomic element types
        const genElemTypeDiag = checkDuplicateDefinition(genomicElementTypeRegex, seenGenomicElementTypes, line, lineIndex, TYPE_NAMES.GENOMIC_ELEMENT_TYPE);
        if (genElemTypeDiag) diagnostics.push(genElemTypeDiag);
        
        // Check for duplicate interaction types
        const intTypeDiag = checkDuplicateDefinition(interactionTypeRegex, seenInteractionTypes, line, lineIndex, TYPE_NAMES.INTERACTION_TYPE);
        if (intTypeDiag) diagnostics.push(intTypeDiag);
        
        // Check for duplicate subpopulations
        if ((match = line.match(subpopRegex)) !== null || (match = line.match(subpopSplitRegex)) !== null) {
            if (match && match.index !== undefined) {
                const subpopName = match[INDICES.SECOND];
                if (seenSubpopulations.has(subpopName)) {
                    // Find the position of the subpopulation name in the match
                    const nameStartChar = match.index + match[INDICES.FIRST].indexOf(`"${subpopName}"`);
                    const nameEndChar = nameStartChar + subpopName.length + CHAR_OFFSETS.QUOTE_LENGTH;
                    diagnostics.push(createDiagnostic(
                        DiagnosticSeverity.Error,
                        lineIndex,
                        nameStartChar + CHAR_OFFSETS.SKIP_OPEN_QUOTE,
                        nameEndChar - CHAR_OFFSETS.SKIP_CLOSE_QUOTE,
                        ERROR_MESSAGES.DUPLICATE_DEFINITION(TYPE_NAMES.SUBPOPULATION, subpopName, seenSubpopulations.get(subpopName)! + PARAMETER_INDEX_OFFSET)
                    ));
                } else {
                    seenSubpopulations.set(subpopName, lineIndex);
                }
            }
        }
        
        // Check for duplicate species
        if ((match = line.match(speciesRegex)) !== null && match.index !== undefined) {
            const speciesName = match[INDICES.SECOND];
            const speciesStartChar = match.index + 'species '.length;
            const speciesEndChar = speciesStartChar + speciesName.length;
            
            if (RESERVED_IDENTIFIERS.has(speciesName)) {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    speciesStartChar,
                    speciesEndChar,
                    ERROR_MESSAGES.RESERVED_SPECIES_NAME(speciesName)
                ));
            } else if (seenSpecies.has(speciesName)) {
                diagnostics.push(createDiagnostic(
                    DiagnosticSeverity.Error,
                    lineIndex,
                    speciesStartChar,
                    speciesEndChar,
                    ERROR_MESSAGES.DUPLICATE_DEFINITION(TYPE_NAMES.SPECIES, speciesName, seenSpecies.get(speciesName)! + PARAMETER_INDEX_OFFSET)
                ));
            } else {
                seenSpecies.set(speciesName, lineIndex);
            }
        }
    });
    
    return diagnostics;
}

