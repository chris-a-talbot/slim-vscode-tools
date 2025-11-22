import { Position } from 'vscode-languageserver';
import { IDENTIFIER_PATTERNS, FORMATTING_PATTERNS } from '../config/regex-patterns';
import { WordContext } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Word information with context
 */
export interface WordInfo {
    word: string;
    context: WordContext;
}

/**
 * Options for position utilities
 */
export interface PositionOptions {
    resolveClassName?: (instanceName: string, instanceDefinitions: Record<string, string>) => string | null;
    instanceDefinitions?: Record<string, string>;
    classesData?: Record<string, unknown>;
    inferTypeFromExpression?: (expr: string) => string | null;
}

/**
 * Gets the operator at a given position in the text.
 * Checks for multi-character operators first (e.g., '<=', '=='), then single-character operators.
 * Used for hover documentation on operators.
 * @param text - The source text
 * @param position - The cursor position
 * @returns The operator symbol found, or null if no operator at position
 */
export function getOperatorAtPosition(text: string, position: Position): string | null {
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;
    
    const line = lines[position.line];
    if (position.character >= line.length) return null;
    
    // Multi-character operators (check in order of length, longest first)
    // Note: '?:' is special - it's actually '?' followed by 'else', but we check for '?' here
    const multiCharOperators = FORMATTING_PATTERNS.TWO_CHAR_OPS;
    
    // Check for multi-character operators by looking at characters around cursor
    for (const op of multiCharOperators) {
        const startPos = Math.max(0, position.character - op.length + 1);
        const endPos = Math.min(line.length, position.character + op.length);
        const substr = line.substring(startPos, endPos);
        
        // Check if the operator appears at a position that includes the cursor
        for (let i = 0; i <= substr.length - op.length; i++) {
            if (substr.substring(i, i + op.length) === op) {
                const opStart = startPos + i;
                const opEnd = opStart + op.length;
                // Check if cursor is within this operator
                if (position.character >= opStart && position.character < opEnd) {
                    return op;
                }
            }
        }
    }
    
    // Single-character operators
    const char = line[position.character];
    const singleCharOperators = FORMATTING_PATTERNS.SINGLE_CHAR_OPS;
    
    if (char && singleCharOperators.includes(char as typeof singleCharOperators[number])) {
        // For '?', check if it's part of ternary operator (but we'll just show '?' for now)
        // For '<' and '>', make sure they're not part of multi-char operators we already checked
        if ((char === '<' || char === '>') && position.character > 0) {
            const nextChar = line[position.character + 1] || '';
            const prevChar = line[position.character - 1] || '';
            // If it's part of <=, >=, <-, ->, skip it (already handled above)
            if ((char === '<' && (nextChar === '=' || nextChar === '-')) ||
                (char === '>' && (nextChar === '=' || prevChar === '-'))) {
                return null;
            }
        }
        return char;
    }
    
    return null;
}

/**
 * Resolves class name using a chain of strategies.
 * Reduces nested conditionals by using a lookup chain.
 */
function resolveClassNameChain(
    instanceName: string,
    resolveClassName: PositionOptions['resolveClassName'],
    instanceDefinitions: Record<string, string>,
    lineUptoCursor: string,
    classesData: Record<string, unknown>,
    inferTypeFromExpression?: (expr: string) => string | null
): string {
    // Strategy 1: Use resolver function
    if (resolveClassName) {
        const resolved = resolveClassName(instanceName, instanceDefinitions);
        if (resolved && classesData[resolved]) {
            return resolved;
        }
    }
    
    // Strategy 2: Check instance definitions directly
    const fromDefinitions = instanceDefinitions[instanceName];
    if (fromDefinitions && classesData[fromDefinitions]) {
        return fromDefinitions;
    }
    
    // Strategy 3: Try type inference
    if (inferTypeFromExpression) {
        const inferred = inferTypeFromExpression(lineUptoCursor);
        if (inferred && classesData[inferred]) {
            return inferred;
        }
    }
    
    // Strategy 4: Fallback to instance name
    return instanceName;
}

/**
 * Handles dot pattern match when cursor is on the object part (before the dot)
 */
function handleDotPatternObject(
    instanceName: string,
    resolveClassName: PositionOptions['resolveClassName'],
    instanceDefinitions: Record<string, string>
): WordInfo | null {
    const instanceClass = resolveClassName?.(instanceName, instanceDefinitions) || instanceDefinitions[instanceName];
    
    if (!instanceClass) {
        return null;
    }
    
    return {
        word: instanceName,
        context: {
            isMethodOrProperty: false,
            instanceClass
        }
    };
}

/**
 * Handles dot pattern match when cursor is on the method/property part (after the dot)
 */
function handleDotPatternMember(
    instanceName: string,
    memberName: string,
    lineUptoCursor: string,
    resolveClassName: PositionOptions['resolveClassName'],
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, unknown>,
    inferTypeFromExpression?: (expr: string) => string | null
): WordInfo {
    const className = resolveClassNameChain(
        instanceName,
        resolveClassName,
        instanceDefinitions,
        lineUptoCursor,
        classesData,
        inferTypeFromExpression
    );
    
    return {
        word: memberName,
        context: {
            isMethodOrProperty: true,
            className,
            instanceName
        }
    };
}

/**
 * Finds word at cursor position using word regex pattern
 */
function findWordAtPosition(
    line: string,
    position: Position,
    resolveClassName: PositionOptions['resolveClassName'],
    instanceDefinitions: Record<string, string>
): WordInfo | null {
    const wordRegex = IDENTIFIER_PATTERNS.WORD;
    let match: RegExpMatchArray | null;
    
    while ((match = wordRegex.exec(line)) !== null) {
        if (match.index === undefined) continue;
        
        const start = match.index;
        const end = match.index + match[0].length;
        if (position.character < start || position.character > end) {
            continue;
        }
        
        const word = match[0];
        const instanceClass = resolveClassName?.(word, instanceDefinitions) || instanceDefinitions[word];
        
        return {
            word,
            context: {
                isMethodOrProperty: false,
                instanceClass: instanceClass || undefined
            }
        };
    }
    return null;
}

/**
 * Checks for dot pattern match and returns word info if cursor is within the match
 */
function checkDotPatternMatch(
    line: string,
    position: Position,
    lineUptoCursor: string,
    resolveClassName: PositionOptions['resolveClassName'],
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, unknown>,
    inferTypeFromExpression?: (expr: string) => string | null
): WordInfo | null {
    const dotRegex = IDENTIFIER_PATTERNS.DOT_WITH_MEMBER;
    let dotMatch: RegExpMatchArray | null;
    
    while ((dotMatch = dotRegex.exec(line)) !== null) {
        if (dotMatch.index === undefined) continue;
        const start = dotMatch.index;
        const dotPos = dotMatch.index + dotMatch[1].length;
        const end = dotMatch.index + dotMatch[0].length;
        
        if (position.character >= start && position.character <= end) {
            // Check if cursor is on the object part (before the dot) or the method/property part (after the dot)
            if (position.character < dotPos) {
                // Cursor is on the object name
                const result = handleDotPatternObject(dotMatch[1], resolveClassName, instanceDefinitions);
                if (result) return result;
            } else {
                // Cursor is on the method/property name
                return handleDotPatternMember(
                    dotMatch[1],
                    dotMatch[2] || '',
                    lineUptoCursor,
                    resolveClassName,
                    instanceDefinitions,
                    classesData,
                    inferTypeFromExpression
                );
            }
        }
    }
    return null;
}

/**
 * Gets the word and its context at a given position in the text.
 * Used for hover documentation and context-aware features.
 * @param text - The source text
 * @param position - The cursor position
 * @param options - Options object with resolveClassName, instanceDefinitions, classesData, inferTypeFromExpression
 * @returns Object with word and context info, or null if no word at position
 */
export function getWordAndContextAtPosition(
    text: string,
    position: Position,
    options: PositionOptions = {}
): WordInfo | null {
    const {
        resolveClassName,
        instanceDefinitions = {},
        classesData = {},
        inferTypeFromExpression
    } = options;
    
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;

    const line = lines[position.line];
    const lineUptoCursor = line.slice(0, position.character);
    
    // Check for method/property access pattern (e.g., "ClassName.method" or "object.method")
    const dotPatternResult = checkDotPatternMatch(
        line,
        position,
        lineUptoCursor,
        resolveClassName,
        instanceDefinitions,
        classesData,
        inferTypeFromExpression
    );
    if (dotPatternResult) return dotPatternResult;

    // Find the word at cursor position
    return findWordAtPosition(line, position, resolveClassName, instanceDefinitions);
}

/**
 * Gets the autocomplete context at a given position.
 * Determines if we're completing a method/property (after a dot) or a standalone identifier.
 * @param text - The source text
 * @param position - The cursor position
 * @param options - Options object with resolveClassName and instanceDefinitions
 * @returns Object with word and context info for autocomplete, or null if not found
 */
export function getAutocompleteContextAtPosition(
    text: string,
    position: Position,
    options: PositionOptions = {}
): WordInfo | null {
    const {
        resolveClassName,
        instanceDefinitions = {}
    } = options;
    
    const lines = text.split('\n');
    if (position.line >= lines.length) return null;

    const line = lines[position.line];
    const lineUptoCursor = line.slice(0, position.character);
    
    // Use centralized regex patterns
    const wordRegex = IDENTIFIER_PATTERNS.WORD;
    const dotRegex = IDENTIFIER_PATTERNS.DOT_PATTERN; // Match "instance."

    // Check for method/property access pattern (e.g., "ClassName." or "object.")
    const dotMatch = lineUptoCursor.match(dotRegex);
    if (dotMatch) {
        const className = resolveClassName ? resolveClassName(dotMatch[1], instanceDefinitions) : null;
        return {
            word: '',
            context: {
                isMethodOrProperty: true,
                className: className || dotMatch[1],
                instanceName: dotMatch[1]
            }
        };
    }

    // Find the word at cursor position
    let match: RegExpMatchArray | null;
    while ((match = wordRegex.exec(lineUptoCursor)) !== null) {
        if (match.index === undefined) continue;
        const start = match.index;
        const end = match.index + match[0].length;
        if (position.character >= start && position.character <= end) {
            return {
                word: match[0],
                context: {
                    isMethodOrProperty: false
                }
            };
        }
    }

    return null;
}

