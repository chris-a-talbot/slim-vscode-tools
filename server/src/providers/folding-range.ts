import {
    FoldingRange,
    FoldingRangeKind,
    FoldingRangeParams
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';

export function registerFoldingRangeProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;

    connection.onFoldingRanges((params: FoldingRangeParams): FoldingRange[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        const text = document.getText();
        const lines = text.split('\n');
        
        return findFoldingRanges(lines);
    });
}

function findFoldingRanges(lines: string[]): FoldingRange[] {
    const ranges: FoldingRange[] = [];
    const bracketStack: Array<{ line: number; kind?: FoldingRangeKind; type: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('//')) {
            continue;
        }
        
        // Remove comments from the line for analysis
        const codeOnly = removeComments(line);
        
        // Check for block starts
        const blockType = identifyBlockType(codeOnly);
        
        // Count opening and closing braces
        for (let j = 0; j < codeOnly.length; j++) {
            const char = codeOnly[j];
            
            if (char === '{') {
                // Push the block type onto the stack
                bracketStack.push({
                    line: i,
                    kind: blockType?.kind,
                    type: blockType?.type || 'block'
                });
            } else if (char === '}') {
                // Pop from stack and create folding range
                if (bracketStack.length > 0) {
                    const start = bracketStack.pop()!;
                    
                    // Only create folding range if the block spans multiple lines
                    if (i > start.line) {
                        const range: FoldingRange = {
                            startLine: start.line,
                            endLine: i
                        };
                        
                        // Add kind if available
                        if (start.kind) {
                            range.kind = start.kind;
                        }
                        
                        ranges.push(range);
                    }
                }
            }
        }
    }
    
    // Add comment block folding
    ranges.push(...findCommentBlocks(lines));
    
    return ranges;
}

interface BlockType {
    kind?: FoldingRangeKind;
    type: string;
}

function identifyBlockType(line: string): BlockType | null {
    const trimmed = line.trim();
    
    // SLiM callbacks (e.g., "1 early() {", "s1 reproduction() {")
    if (/^\d+[:\d]*\s+(early|late|initialize|fitness|mateChoice|modifyChild|recombination|mutation|survival|reproduction)\s*\(/.test(trimmed)) {
        return { kind: FoldingRangeKind.Region, type: 'callback' };
    }
    
    // Initialize blocks without tick number
    if (/^initialize\s*\(/.test(trimmed)) {
        return { kind: FoldingRangeKind.Region, type: 'initialize' };
    }
    
    // Function definitions
    if (/^function\s+\w+\s*\(/.test(trimmed)) {
        return { kind: FoldingRangeKind.Region, type: 'function' };
    }
    
    // Conditional blocks
    if (/^(if|else\s+if|else)\s*(\(|{)/.test(trimmed)) {
        return { type: 'conditional' };
    }
    
    // Loop blocks
    if (/^(for|while|do)\s*(\(|{)/.test(trimmed)) {
        return { type: 'loop' };
    }
    
    // Generic blocks
    return { type: 'block' };
}

function removeComments(line: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (escapeNext) {
            result += char;
            escapeNext = false;
            continue;
        }
        
        if (char === '\\' && inString) {
            result += char;
            escapeNext = true;
            continue;
        }
        
        if (char === '"') {
            inString = !inString;
            result += char;
            continue;
        }
        
        if (!inString && char === '/' && i + 1 < line.length && line[i + 1] === '/') {
            // Found a comment, stop processing
            break;
        }
        
        result += char;
    }
    
    return result;
}

function findCommentBlocks(lines: string[]): FoldingRange[] {
    const ranges: FoldingRange[] = [];
    let commentStart: number | null = null;
    
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        
        if (trimmed.startsWith('//')) {
            // Start or continue a comment block
            if (commentStart === null) {
                commentStart = i;
            }
        } else if (commentStart !== null) {
            // End of comment block
            if (i - commentStart > 1) { // Only fold if 2+ consecutive comment lines
                ranges.push({
                    startLine: commentStart,
                    endLine: i - 1,
                    kind: FoldingRangeKind.Comment
                });
            }
            commentStart = null;
        }
    }
    
    // Handle comment block that extends to end of file
    if (commentStart !== null && lines.length - commentStart > 1) {
        ranges.push({
            startLine: commentStart,
            endLine: lines.length - 1,
            kind: FoldingRangeKind.Comment
        });
    }
    
    return ranges;
}

