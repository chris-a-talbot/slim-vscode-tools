import {
    WorkspaceSymbolParams,
    SymbolInformation,
    SymbolKind,
    Location,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/config';

/**
 * Registers the workspace symbols provider
 */
export function registerWorkspaceSymbolsProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onWorkspaceSymbol((params: WorkspaceSymbolParams): SymbolInformation[] => {
        const query = params.query.toLowerCase();
        const allSymbols: SymbolInformation[] = [];

        // Search through all open documents
        documents.all().forEach(document => {
            const symbols = findSymbolsInDocument(document.getText(), document.uri, query);
            allSymbols.push(...symbols);
        });

        return allSymbols;
    });
}

/**
 * Finds all symbols in a document that match the query
 */
function findSymbolsInDocument(text: string, uri: string, query: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lines = text.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Skip comments
        if (line.trim().startsWith('//')) continue;
        
        // Find functions
        const functionMatch = line.match(/function\s+(\w+)\s*\(/);
        if (functionMatch) {
            const name = functionMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Function,
                    uri,
                    lineIndex,
                    line.indexOf(name)
                ));
            }
        }

        // Find constants
        const constantMatch = line.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch) {
            const name = constantMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Constant,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find mutation types
        const mutationTypeMatch = line.match(DEFINITION_PATTERNS.MUTATION_TYPE);
        if (mutationTypeMatch) {
            const name = mutationTypeMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find genomic element types
        const genomicElementMatch = line.match(DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE);
        if (genomicElementMatch) {
            const name = genomicElementMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find interaction types
        const interactionTypeMatch = line.match(DEFINITION_PATTERNS.INTERACTION_TYPE);
        if (interactionTypeMatch) {
            const name = interactionTypeMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find subpopulations
        const subpopMatch = line.match(DEFINITION_PATTERNS.SUBPOP);
        if (subpopMatch) {
            const name = subpopMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Variable,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find species
        const speciesMatch = line.match(DEFINITION_PATTERNS.SPECIES);
        if (speciesMatch) {
            const name = speciesMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Namespace,
                    uri,
                    lineIndex,
                    line.indexOf(`"${name}"`)
                ));
            }
        }

        // Find variable assignments
        const assignmentMatch = line.match(/^\s*(\w+)\s*=/);
        if (assignmentMatch) {
            const name = assignmentMatch[1];
            // Skip if it looks like a comparison
            if (!line.includes('==') && matchesQuery(name, query)) {
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Variable,
                    uri,
                    lineIndex,
                    line.indexOf(name)
                ));
            }
        }

        // Find callback definitions
        const callbackPatterns = [
            { pattern: CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK, kind: SymbolKind.Event },
            { pattern: CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK, kind: SymbolKind.Event }
        ];

        for (const { pattern, kind } of callbackPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                const name = match[1];
                if (matchesQuery(name, query)) {
                    symbols.push(createSymbol(
                        name,
                        kind,
                        uri,
                        lineIndex,
                        line.indexOf(`"${name}"`)
                    ));
                }
            }
        }

        // Find inline callback blocks (e.g., "1 early() {", "initialize() {")
        const inlineCallbackMatch = line.match(/(\d+\s+)?(initialize|early|late|first|fitness|interaction|mateChoice|modifyChild|mutation|recombination|reproduction|survival)\s*\(/);
        if (inlineCallbackMatch) {
            const generation = inlineCallbackMatch[1]?.trim() || '';
            const callbackName = inlineCallbackMatch[2];
            const displayName = generation ? `${generation} ${callbackName}()` : `${callbackName}()`;
            
            if (matchesQuery(displayName, query)) {
                symbols.push(createSymbol(
                    displayName,
                    SymbolKind.Event,
                    uri,
                    lineIndex,
                    line.indexOf(callbackName)
                ));
            }
        }
    }

    return symbols;
}

/**
 * Checks if a symbol name matches the query
 */
function matchesQuery(name: string, query: string): boolean {
    // Empty query matches everything
    if (query === '') return true;
    
    // Case-insensitive substring match
    return name.toLowerCase().includes(query);
}

/**
 * Creates a SymbolInformation object
 */
function createSymbol(
    name: string,
    kind: SymbolKind,
    uri: string,
    line: number,
    character: number
): SymbolInformation {
    return {
        name,
        kind,
        location: Location.create(
            uri,
            Range.create(line, character, line, character + name.length)
        )
    };
}

