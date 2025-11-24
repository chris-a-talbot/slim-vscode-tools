import {
    CodeLens,
    CodeLensParams,
    Command,
    Position,
    Range
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';
import { CALLBACK_NAMES, DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/config';

export function registerCodeLensProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onCodeLens((params: CodeLensParams): CodeLens[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        // Get configuration settings (passed from client middleware)
        const text = document.getText();
        const codeLenses: CodeLens[] = [];
        const lines = text.split('\n');

        lines.forEach((line: string, lineIndex: number) => {
            // Find functions
            const functionMatch = line.match(/function\s+(\w+)\s*\(/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                const references = findReferences(text, functionName, false);
                
                // Create code lens with reference count
                const position = line.indexOf(functionName);
                codeLenses.push({
                    range: Range.create(
                        Position.create(lineIndex, position),
                        Position.create(lineIndex, position + functionName.length)
                    ),
                    command: Command.create(
                        `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                        'editor.action.showReferences',
                        params.textDocument.uri,
                        Position.create(lineIndex, position),
                        references.map(ref => ({
                            uri: params.textDocument.uri,
                            range: ref.range
                        }))
                    )
                });
            }

            const callbackPattern = new RegExp(
                `^\\s*(?:(?:\\d+:\\d+|\\d+)\\s+)?(${CALLBACK_NAMES.join('|')})\\s*\\(`,
                'i'
            );
            const callbackMatch = line.match(callbackPattern);
            if (callbackMatch) {
                const callbackName = callbackMatch[1];
                const position = line.indexOf(callbackName);
                
                // Extract tick information if present
                const tickMatch = line.match(/^\s*((?:\d+:\d+|\d+)\s+)?/);
                const tickInfo = tickMatch && tickMatch[1] ? tickMatch[1].trim() : '';
                
                codeLenses.push({
                    range: Range.create(
                        Position.create(lineIndex, position),
                        Position.create(lineIndex, position + callbackName.length)
                    ),
                    command: Command.create(
                        tickInfo ? `Tick: ${tickInfo}` : 'Callback',
                        ''  // No command, just informational
                    )
                });
            }

            const constantMatch = line.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
            if (constantMatch) {
                const constName = constantMatch[1];
                const references = findReferences(text, constName, false);
                
                if (references.length > 0) {
                    const position = line.indexOf(constName);
                    codeLenses.push({
                        range: Range.create(
                            Position.create(lineIndex, position),
                            Position.create(lineIndex, position + constName.length)
                        ),
                        command: Command.create(
                            `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                            'editor.action.showReferences',
                            params.textDocument.uri,
                            Position.create(lineIndex, position),
                            references.map(ref => ({
                                uri: params.textDocument.uri,
                                range: ref.range
                            }))
                        )
                    });
                }
            }

            const subpopMatch = line.match(DEFINITION_PATTERNS.SUBPOP);
            if (subpopMatch) {
                const subpopName = subpopMatch[1];
                const references = findReferences(text, subpopName, false);
                
                if (references.length > 0) {
                    const position = line.indexOf(subpopName);
                    codeLenses.push({
                        range: Range.create(
                            Position.create(lineIndex, position),
                            Position.create(lineIndex, position + subpopName.length)
                        ),
                        command: Command.create(
                            `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                            'editor.action.showReferences',
                            params.textDocument.uri,
                            Position.create(lineIndex, position),
                            references.map(ref => ({
                                uri: params.textDocument.uri,
                                range: ref.range
                            }))
                        )
                    });
                }
            }

            const mutationTypeMatch = line.match(DEFINITION_PATTERNS.MUTATION_TYPE);
            if (mutationTypeMatch) {
                const typeName = mutationTypeMatch[1];
                const references = findReferences(text, typeName, false);
                
                if (references.length > 0) {
                    const position = line.indexOf(typeName);
                    codeLenses.push({
                        range: Range.create(
                            Position.create(lineIndex, position),
                            Position.create(lineIndex, position + typeName.length)
                        ),
                        command: Command.create(
                            `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                            'editor.action.showReferences',
                            params.textDocument.uri,
                            Position.create(lineIndex, position),
                            references.map(ref => ({
                                uri: params.textDocument.uri,
                                range: ref.range
                            }))
                        )
                    });
                }
            }

            const genomicElementMatch = line.match(DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE);
            if (genomicElementMatch) {
                const typeName = genomicElementMatch[1];
                const references = findReferences(text, typeName, false);
                
                if (references.length > 0) {
                    const position = line.indexOf(typeName);
                    codeLenses.push({
                        range: Range.create(
                            Position.create(lineIndex, position),
                            Position.create(lineIndex, position + typeName.length)
                        ),
                        command: Command.create(
                            `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                            'editor.action.showReferences',
                            params.textDocument.uri,
                            Position.create(lineIndex, position),
                            references.map(ref => ({
                                uri: params.textDocument.uri,
                                range: ref.range
                            }))
                        )
                    });
                }
            }

            const interactionTypeMatch = line.match(DEFINITION_PATTERNS.INTERACTION_TYPE);
            if (interactionTypeMatch) {
                const typeName = interactionTypeMatch[1];
                const references = findReferences(text, typeName, false);
                
                if (references.length > 0) {
                    const position = line.indexOf(typeName);
                    codeLenses.push({
                        range: Range.create(
                            Position.create(lineIndex, position),
                            Position.create(lineIndex, position + typeName.length)
                        ),
                        command: Command.create(
                            `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                            'editor.action.showReferences',
                            params.textDocument.uri,
                            Position.create(lineIndex, position),
                            references.map(ref => ({
                                uri: params.textDocument.uri,
                                range: ref.range
                            }))
                        )
                    });
                }
            }

            const scriptBlockPatterns = [
                CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT,
                CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT,
                CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT,
                CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK,
                CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK
            ];

            for (const pattern of scriptBlockPatterns) {
                const scriptMatch = line.match(pattern);
                if (scriptMatch) {
                    const blockId = scriptMatch[1];
                    const references = findReferences(text, blockId, false);
                    
                    if (references.length > 0) {
                        const position = line.indexOf(blockId);
                        codeLenses.push({
                            range: Range.create(
                                Position.create(lineIndex, position),
                                Position.create(lineIndex, position + blockId.length)
                            ),
                            command: Command.create(
                                `${references.length} reference${references.length !== 1 ? 's' : ''}`,
                                'editor.action.showReferences',
                                params.textDocument.uri,
                                Position.create(lineIndex, position),
                                references.map(ref => ({
                                    uri: params.textDocument.uri,
                                    range: ref.range
                                }))
                            )
                        });
                    }
                    break;
                }
            }
        });

        return codeLenses;
    });
}

interface ReferenceLocation {
    range: Range;
}

function findReferences(
    text: string,
    word: string,
    includeDeclaration: boolean
): ReferenceLocation[] {
    const references: ReferenceLocation[] = [];
    const lines = text.split('\n');
    const wordPattern = new RegExp(`\\b${escapeRegex(word)}\\b`, 'g');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const commentIndex = line.indexOf('//');
        const searchText = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        
        wordPattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        
        while ((match = wordPattern.exec(searchText)) !== null) {
            const matchIndex = match.index;
            const isDeclaration = isDefinitionContext(searchText, word, matchIndex);
            
            if (isDeclaration && !includeDeclaration) {
                continue;
            }
            
            if (isInStringLiteral(searchText, matchIndex)) {
                continue;
            }
            
            references.push({
                range: Range.create(
                    lineIndex, matchIndex,
                    lineIndex, matchIndex + word.length
                )
            });
        }
    }

    return references;
}

function isDefinitionContext(line: string, word: string, index: number): boolean {
    const before = line.substring(0, index).trim();
    const after = line.substring(index + word.length).trim();
    
    if (after.startsWith('=') && !after.startsWith('==')) {
        if (!before.match(/[+\-*/<>!&|]$/)) {
            return true;
        }
    }
    
    if (before.endsWith('function')) {
        return true;
    }
    
    if (before.includes('defineConstant') && line.includes(`"${word}"`)) {
        return true;
    }
    
    if (before.match(/initializeMutationType\s*\(\s*["']$/)) {
        return true;
    }
    
    if (before.match(/initializeGenomicElementType\s*\(\s*["']$/)) {
        return true;
    }
    
    if (before.match(/initializeInteractionType\s*\(\s*["']$/)) {
        return true;
    }
    
    if (before.match(/addSubpop\s*\(\s*["']$/)) {
        return true;
    }
    
    if (before.match(/initializeSpecies\s*\(\s*["']$/)) {
        return true;
    }
    
    if (before.match(/for\s*\(\s*$/) && after.startsWith(' in ')) {
        return true;
    }
    
    return false;
}

function isInStringLiteral(line: string, index: number): boolean {
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < index; i++) {
        const char = line[i];
        
        if (escapeNext) {
            escapeNext = false;
            continue;
        }
        
        if (char === '\\') {
            escapeNext = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
        }
    }
    
    return inString;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

