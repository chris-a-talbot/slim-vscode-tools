// ============================================================================
// UNDEFINED REFERENCES VALIDATION
// This file contains the code check that mutations, genomes, and subpopulations are defined before use.
// ============================================================================

import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostic-factory';
import { LOOKAHEAD_LIMITS, INDICES, TYPE_NAMES_FOR_ERRORS } from '../config/constants';
import { VALIDATION_PATTERNS, TYPE_PATTERNS } from '../config/regex-patterns';
import { ERROR_MESSAGES, TYPE_NAMES_FOR_ERRORS as TYPE_NAMES } from '../config/constants';

/**
 * Validates undefined references to SLiM types (mutation types, genomic element types, subpopulations).
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
export function validateUndefinedReferences(_text: string, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const fullText = lines.join('\n');
    
    /**
     * Checks for undefined references to a specific type pattern.
     */
    function checkUndefinedReferences(
        refRegex: RegExp,
        definitionPattern: RegExp | string,
        hasDynamicCreation: boolean,
        typeName: string,
        contextCheck: ((line: string, match: RegExpMatchArray) => boolean) | null = null
    ): void {
        const definitionPatternStr = typeof definitionPattern === 'string' 
            ? definitionPattern 
            : definitionPattern.source;
        
        lines.forEach((line, lineIndex) => {
            let match: RegExpMatchArray | null;
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
                const isDefinitionOnSameLine = new RegExp(
                    `${definitionPatternStr}\\s*\\(\\s*["']?${escapedId}["']?`
                ).test(line);
                
                if (!isDefinitionOnSameLine) {
                    // Check if it's been defined in previous lines
                    const beforeThisLine = lines.slice(0, lineIndex).join('\n');
                    const definitionRegex = new RegExp(
                        `${definitionPatternStr}\\s*\\(\\s*"?${escapedId}"?`
                    );
                    const hasExplicitDefinition = definitionRegex.test(beforeThisLine);
                    
                    // Skip warnings if dynamic creation is detected or explicit definition exists
                    if (!hasExplicitDefinition && !hasDynamicCreation) {
                        // Optional context check (e.g., for subpopulations)
                        if (contextCheck && !contextCheck(line, match)) {
                            continue;
                        }
                        
                        if (match.index !== undefined) {
                            diagnostics.push(createDiagnostic(
                                DiagnosticSeverity.Warning,
                                lineIndex,
                                match.index,
                                match.index + typeId.length,
                                ERROR_MESSAGES.UNDEFINED_REFERENCE(typeName, typeId)
                            ));
                        }
                    }
                }
            }
        });
    }
    
    // Check mutation types (m1, m2, etc.)
    // Detect if mutation types are created dynamically (not with string literals)
    // This happens when IDs are computed at runtime, so we can't validate them statically
    const hasDynamicMutTypeCreation = VALIDATION_PATTERNS.DYNAMIC_MUT_TYPE.test(fullText) || 
                                      VALIDATION_PATTERNS.DYNAMIC_MUT_TYPE_CONCAT.test(fullText);
    // Match mutation type IDs: m1, m2, m10, etc.
    // \b ensures we match whole words (not "m1" inside "m10")
    checkUndefinedReferences(
        VALIDATION_PATTERNS.MUTATION_TYPE_REF,
        'initializeMutationType(?:Nuc)?',
        hasDynamicMutTypeCreation,
        TYPE_NAMES_FOR_ERRORS.MUTATION_TYPE
    );
    
    // Check genomic element types (g1, g2, etc.)
    const hasDynamicGenElemTypeCreation = VALIDATION_PATTERNS.DYNAMIC_GEN_ELEM_TYPE.test(fullText) ||
                                          VALIDATION_PATTERNS.DYNAMIC_GEN_ELEM_TYPE_CONCAT.test(fullText);
    checkUndefinedReferences(
        VALIDATION_PATTERNS.GENOMIC_ELEMENT_TYPE_REF,
        'initializeGenomicElementType',
        hasDynamicGenElemTypeCreation,
        TYPE_NAMES.GENOMIC_ELEMENT_TYPE
    );
    
    // Check subpopulations (p1, p2, etc.) with context validation
    const hasDynamicSubpopCreation = VALIDATION_PATTERNS.DYNAMIC_SUBPOP.test(fullText);
    checkUndefinedReferences(
        VALIDATION_PATTERNS.SUBPOPULATION_REF,  // Match subpopulation IDs: p1, p2, etc.
        '(sim\\.)?addSubpop(?:Split)?',  // Match both sim.addSubpop and addSubpop
        hasDynamicSubpopCreation,
        TYPE_NAMES.SUBPOPULATION,
        (line, match) => {
            // Only warn if it looks like it's being used as a subpopulation
            // Check surrounding context to avoid false positives (e.g., "p1" in "temp1")
            // We want to match "p1" when it's a standalone identifier, not part of a word
            if (match.index === undefined) return false;
            const context = line.substring(
                Math.max(0, match.index - LOOKAHEAD_LIMITS.CONTEXT_WINDOW), 
                match.index + match[INDICES.SECOND].length + LOOKAHEAD_LIMITS.CONTEXT_WINDOW
            );
            // Ensure p1 is surrounded by non-word characters (not part of another identifier)
            return TYPE_PATTERNS.TYPE_ID_IN_CONTEXT.test(context);
        }
    );
    
    return diagnostics;
}

