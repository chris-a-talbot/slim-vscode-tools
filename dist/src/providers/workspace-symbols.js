"use strict";
// ============================================================================
// WORKSPACE SYMBOLS PROVIDER
// Provides symbol search across the workspace
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWorkspaceSymbolsProvider = registerWorkspaceSymbolsProvider;
const vscode_languageserver_1 = require("vscode-languageserver");
const regex_patterns_1 = require("../config/regex-patterns");
/**
 * Registers the workspace symbols provider
 */
function registerWorkspaceSymbolsProvider(context) {
    const { connection, documents } = context;
    connection.onWorkspaceSymbol((params) => {
        const query = params.query.toLowerCase();
        const allSymbols = [];
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
function findSymbolsInDocument(text, uri, query) {
    const symbols = [];
    const lines = text.split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        // Skip comments
        if (line.trim().startsWith('//'))
            continue;
        // Find functions
        const functionMatch = line.match(/function\s+(\w+)\s*\(/);
        if (functionMatch) {
            const name = functionMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Function, uri, lineIndex, line.indexOf(name)));
            }
        }
        // Find constants
        const constantMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch) {
            const name = constantMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Constant, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find mutation types
        const mutationTypeMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.MUTATION_TYPE);
        if (mutationTypeMatch) {
            const name = mutationTypeMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Class, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find genomic element types
        const genomicElementMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE);
        if (genomicElementMatch) {
            const name = genomicElementMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Class, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find interaction types
        const interactionTypeMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.INTERACTION_TYPE);
        if (interactionTypeMatch) {
            const name = interactionTypeMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Class, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find subpopulations
        const subpopMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.SUBPOP);
        if (subpopMatch) {
            const name = subpopMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Variable, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find species
        const speciesMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.SPECIES);
        if (speciesMatch) {
            const name = speciesMatch[1];
            if (matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Namespace, uri, lineIndex, line.indexOf(`"${name}"`)));
            }
        }
        // Find variable assignments
        const assignmentMatch = line.match(/^\s*(\w+)\s*=/);
        if (assignmentMatch) {
            const name = assignmentMatch[1];
            // Skip if it looks like a comparison
            if (!line.includes('==') && matchesQuery(name, query)) {
                symbols.push(createSymbol(name, vscode_languageserver_1.SymbolKind.Variable, uri, lineIndex, line.indexOf(name)));
            }
        }
        // Find callback definitions
        const callbackPatterns = [
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event },
            { pattern: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK, kind: vscode_languageserver_1.SymbolKind.Event }
        ];
        for (const { pattern, kind } of callbackPatterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                const name = match[1];
                if (matchesQuery(name, query)) {
                    symbols.push(createSymbol(name, kind, uri, lineIndex, line.indexOf(`"${name}"`)));
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
                symbols.push(createSymbol(displayName, vscode_languageserver_1.SymbolKind.Event, uri, lineIndex, line.indexOf(callbackName)));
            }
        }
    }
    return symbols;
}
/**
 * Checks if a symbol name matches the query
 */
function matchesQuery(name, query) {
    // Empty query matches everything
    if (query === '')
        return true;
    // Case-insensitive substring match
    return name.toLowerCase().includes(query);
}
/**
 * Creates a SymbolInformation object
 */
function createSymbol(name, kind, uri, line, character) {
    return {
        name,
        kind,
        location: vscode_languageserver_1.Location.create(uri, vscode_languageserver_1.Range.create(line, character, line, character + name.length))
    };
}
//# sourceMappingURL=workspace-symbols.js.map