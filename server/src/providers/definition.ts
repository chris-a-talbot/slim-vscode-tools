// ============================================================================
// DEFINITION PROVIDER
// Provides "Go to Definition" functionality for variables, functions, and types
// ============================================================================

import {
    DefinitionParams,
    Location,
    Position,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../types';
import { DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/regex-patterns';

/**
 * Registers the definition provider for Go to Definition
 */
export function registerDefinitionProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onDefinition((params: DefinitionParams): Location | Location[] | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const text = document.getText();
        const position = params.position;
        
        // Get the word at cursor position
        const word = getWordAtPosition(text, position);
        if (!word) return null;

        // Search for definition of this word
        const definition = findDefinition(text, word, params.textDocument.uri);
        return definition;
    });
}

/**
 * Gets the word at a specific position in the document
 */
function getWordAtPosition(text: string, position: Position): string | null {
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;

    const line = lines[position.line];
    const character = position.character;

    // Find word boundaries
    let start = character;
    let end = character;

    // Word characters: letters, numbers, underscore
    const wordChar = /[a-zA-Z0-9_]/;

    // Move start back to beginning of word
    while (start > 0 && wordChar.test(line[start - 1])) {
        start--;
    }

    // Move end forward to end of word
    while (end < line.length && wordChar.test(line[end])) {
        end++;
    }

    if (start === end) return null;

    return line.substring(start, end);
}

/**
 * Finds the definition of a word in the document
 */
function findDefinition(text: string, word: string, uri: string): Location | null {
    const lines = text.split('\n');

    // Try different definition patterns
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Check for variable assignment: word = ...
        const assignmentMatch = line.match(new RegExp(`\\b(${escapeRegex(word)})\\s*=`, 'g'));
        if (assignmentMatch) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for constant definition: defineConstant("word", ...)
        const constantMatch = line.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch && constantMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for subpopulation definition: sim.addSubpop("pX", ...)
        const subpopMatch = line.match(DEFINITION_PATTERNS.SUBPOP);
        if (subpopMatch && subpopMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for mutation type: initializeMutationType("mX", ...)
        const mutationTypeMatch = line.match(DEFINITION_PATTERNS.MUTATION_TYPE);
        if (mutationTypeMatch && mutationTypeMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for genomic element type: initializeGenomicElementType("gX", ...)
        const genomicElementMatch = line.match(DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE);
        if (genomicElementMatch && genomicElementMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for interaction type: initializeInteractionType("iX", ...)
        const interactionTypeMatch = line.match(DEFINITION_PATTERNS.INTERACTION_TYPE);
        if (interactionTypeMatch && interactionTypeMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for species: initializeSpecies("speciesX", ...)
        const speciesMatch = line.match(DEFINITION_PATTERNS.SPECIES);
        if (speciesMatch && speciesMatch[1] === word) {
            const index = line.indexOf(word);
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for function definition: function word(...) { ... }
        const functionMatch = line.match(new RegExp(`function\\s+(${escapeRegex(word)})\\s*\\(`));
        if (functionMatch) {
            const index = line.indexOf(word, line.indexOf('function'));
            if (index !== -1) {
                return Location.create(uri, Range.create(
                    lineIndex, index,
                    lineIndex, index + word.length
                ));
            }
        }

        // Check for callback definitions with script block IDs
        // e.g., s1.registerEarlyEvent(NULL, "{ ... }", 1, sX);
        const callbackPatterns = [
            CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT,
            CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT,
            CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT,
            CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK,
            CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK
        ];

        for (const pattern of callbackPatterns) {
            const match = line.match(pattern);
            if (match && match[1] === word) {
                const index = line.indexOf(word);
                if (index !== -1) {
                    return Location.create(uri, Range.create(
                        lineIndex, index,
                        lineIndex, index + word.length
                    ));
                }
            }
        }
    }

    return null;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

