import {
    WorkspaceSymbolParams,
    SymbolInformation,
    SymbolKind,
    Location,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/config';
import { removeCommentsAndStringsFromLine } from '../utils/text-processing';

export function registerWorkspaceSymbolsProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onWorkspaceSymbol((params: WorkspaceSymbolParams): SymbolInformation[] => {
        const query = params.query.toLowerCase();
        const allSymbols: SymbolInformation[] = [];
        const seenSymbols = new Set<string>(); // Deduplicate symbols

        // Search through all open documents
        documents.all().forEach(document => {
            const symbols = findSymbolsInDocument(document.getText(), document.uri, query);
            symbols.forEach(symbol => {
                const key = `${symbol.name}:${symbol.kind}:${symbol.location.uri}:${symbol.location.range.start.line}`;
                if (!seenSymbols.has(key)) {
                    seenSymbols.add(key);
                    allSymbols.push(symbol);
                }
            });
        });

        return allSymbols;
    });
}

function findSymbolsInDocument(text: string, uri: string, query: string): SymbolInformation[] {
    const symbols: SymbolInformation[] = [];
    const lines = text.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        // Clean line of comments and strings for pattern matching
        const cleanedLine = removeCommentsAndStringsFromLine(line);
        if (!cleanedLine.trim()) continue;
        
        // Find functions
        const functionMatch = cleanedLine.match(/function\s+(\w+)\s*\(/);
        if (functionMatch && functionMatch.index !== undefined) {
            const name = functionMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(name, functionMatch.index);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Function,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos : 0
                ));
            }
        }

        // Find constants
        const constantMatch = cleanedLine.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch && constantMatch.index !== undefined) {
            const name = constantMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Constant,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find mutation types
        const mutationTypeMatch = cleanedLine.match(DEFINITION_PATTERNS.MUTATION_TYPE);
        if (mutationTypeMatch && mutationTypeMatch.index !== undefined) {
            const name = mutationTypeMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find genomic element types
        const genomicElementMatch = cleanedLine.match(DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE);
        if (genomicElementMatch && genomicElementMatch.index !== undefined) {
            const name = genomicElementMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find interaction types
        const interactionTypeMatch = cleanedLine.match(DEFINITION_PATTERNS.INTERACTION_TYPE);
        if (interactionTypeMatch && interactionTypeMatch.index !== undefined) {
            const name = interactionTypeMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Class,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find subpopulations
        const subpopMatch = cleanedLine.match(DEFINITION_PATTERNS.SUBPOP);
        if (subpopMatch && subpopMatch.index !== undefined) {
            const name = subpopMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Variable,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find species
        const speciesMatch = cleanedLine.match(DEFINITION_PATTERNS.SPECIES);
        if (speciesMatch && speciesMatch.index !== undefined) {
            const name = speciesMatch[1];
            if (matchesQuery(name, query)) {
                const charPos = line.indexOf(`"${name}"`);
                symbols.push(createSymbol(
                    name,
                    SymbolKind.Namespace,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos + 1 : 0
                ));
            }
        }

        // Find callback definitions with IDs
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
            const match = cleanedLine.match(pattern);
            if (match && match[1] && match.index !== undefined) {
                const name = match[1];
                if (matchesQuery(name, query)) {
                    const charPos = line.indexOf(`"${name}"`);
                    symbols.push(createSymbol(
                        name,
                        kind,
                        uri,
                        lineIndex,
                        charPos >= 0 ? charPos + 1 : 0
                    ));
                }
            }
        }

        // Find inline callback blocks (e.g., "1 early() {", "s1:initialize() {")
        const inlineCallbackMatch = cleanedLine.match(/((?:\d+(?::\d+)?|[sp]\d+:)\s*)?(initialize|early|late|first|fitness|interaction|mateChoice|modifyChild|mutation|recombination|reproduction|survival)\s*\(/);
        if (inlineCallbackMatch && inlineCallbackMatch.index !== undefined) {
            const prefix = inlineCallbackMatch[1]?.trim() || '';
            const callbackName = inlineCallbackMatch[2];
            const displayName = prefix ? `${prefix} ${callbackName}()` : `${callbackName}()`;
            
            if (matchesQuery(displayName, query)) {
                const charPos = line.indexOf(callbackName, Math.max(0, inlineCallbackMatch.index - 10));
                symbols.push(createSymbol(
                    displayName,
                    SymbolKind.Event,
                    uri,
                    lineIndex,
                    charPos >= 0 ? charPos : 0
                ));
            }
        }
    }

    return symbols;
}

function matchesQuery(name: string, query: string): boolean {
    // Empty query matches everything
    if (query === '') return true;
    
    // Case-insensitive substring match
    return name.toLowerCase().includes(query);
}

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

