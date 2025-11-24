import { 
    DocumentFormattingParams, 
    DocumentRangeFormattingParams,
    DocumentOnTypeFormattingParams,
    TextEdit
} from 'vscode-languageserver';
import { LanguageServerContext } from '../config/types';

function stripCommentsAndStrings(line: string): string {
    let result = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : '';
        
        // Handle strings
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
            continue;
        }
        if (inString && char === stringChar && line[i - 1] !== '\\') {
            inString = false;
            continue;
        }
        if (inString) continue;
        
        // Handle comments
        if (char === '/' && nextChar === '/') break;
        
        result += char;
    }
    
    return result;
}

export function formatSLiMCode(text: string, options: { tabSize?: number; insertSpaces?: boolean }): string {
    const tabSize = options.tabSize || 4;
    const insertSpaces = options.insertSpaces !== false;
    const indentString = insertSpaces ? ' '.repeat(tabSize) : '\t';
    
    const lines = text.split(/\r?\n/);
    const formattedLines: string[] = [];
    let indentLevel = 0;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Empty lines
        if (!trimmed) {
            formattedLines.push('');
            continue;
        }
        
        // Comment-only lines
        if (trimmed.startsWith('//')) {
            formattedLines.push(indentString.repeat(indentLevel) + trimmed);
            continue;
        }
        
        // Extract code part (remove inline comments)
        let codePart = trimmed;
        let commentPart = '';
        const commentIndex = trimmed.indexOf('//');
        if (commentIndex >= 0) {
            codePart = trimmed.substring(0, commentIndex).trim();
            commentPart = ' ' + trimmed.substring(commentIndex);
        }
        
        // Count braces (ignoring strings and comments)
        const cleaned = stripCommentsAndStrings(codePart);
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        
        // Dedent for closing braces at start
        if (trimmed.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Format line
        const formatted = indentString.repeat(indentLevel) + codePart + commentPart;
        formattedLines.push(formatted);
        
        // Update indent level
        indentLevel += openBraces - closeBraces;
        indentLevel = Math.max(0, indentLevel);
    }
    
    return formattedLines.join('\n');
}

function formatRange(
    text: string, 
    startLine: number, 
    endLine: number, 
    options: { tabSize?: number; insertSpaces?: boolean }
): string {
    const lines = text.split(/\r?\n/);
    
    // Get context: determine the indent level at the start of the range
    let contextIndentLevel = 0;
    for (let i = 0; i < startLine; i++) {
        const line = lines[i];
        const cleaned = stripCommentsAndStrings(line);
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        contextIndentLevel += openBraces - closeBraces;
    }
    contextIndentLevel = Math.max(0, contextIndentLevel);
    
    // Format only the selected range
    const rangeLines = lines.slice(startLine, endLine + 1);
    
    const tabSize = options.tabSize || 4;
    const insertSpaces = options.insertSpaces !== false;
    const indentString = insertSpaces ? ' '.repeat(tabSize) : '\t';
    
    const formattedLines: string[] = [];
    let indentLevel = contextIndentLevel;
    
    for (const line of rangeLines) {
        const trimmed = line.trim();
        
        // Empty lines
        if (!trimmed) {
            formattedLines.push('');
            continue;
        }
        
        // Comment-only lines
        if (trimmed.startsWith('//')) {
            formattedLines.push(indentString.repeat(indentLevel) + trimmed);
            continue;
        }
        
        // Extract code part
        let codePart = trimmed;
        let commentPart = '';
        const commentIndex = trimmed.indexOf('//');
        if (commentIndex >= 0) {
            codePart = trimmed.substring(0, commentIndex).trim();
            commentPart = ' ' + trimmed.substring(commentIndex);
        }
        
        // Count braces
        const cleaned = stripCommentsAndStrings(codePart);
        const openBraces = (cleaned.match(/{/g) || []).length;
        const closeBraces = (cleaned.match(/}/g) || []).length;
        
        // Dedent for closing braces at start
        if (trimmed.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Format line
        const formatted = indentString.repeat(indentLevel) + codePart + commentPart;
        formattedLines.push(formatted);
        
        // Update indent level
        indentLevel += openBraces - closeBraces;
        indentLevel = Math.max(0, indentLevel);
    }
    
    return formattedLines.join('\n');
}

export function registerFormattingProvider(context: LanguageServerContext): void {
    const { connection, documents } = context;
    
    // Full document formatting
    connection.onDocumentFormatting((params: DocumentFormattingParams): TextEdit[] | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const text = document.getText();
        const formatted = formatSLiMCode(text, {
            tabSize: params.options.tabSize || 4,
            insertSpaces: params.options.insertSpaces !== false
        });

        const lines = text.split('\n');
        return [{
            range: {
                start: { line: 0, character: 0 },
                end: { line: document.lineCount - 1, character: lines[document.lineCount - 1]?.length || 0 }
            },
            newText: formatted
        }];
    });
    
    // Range formatting
    connection.onDocumentRangeFormatting((params: DocumentRangeFormattingParams): TextEdit[] | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const text = document.getText();
        const { start, end } = params.range;
        
        const formatted = formatRange(text, start.line, end.line, {
            tabSize: params.options.tabSize || 4,
            insertSpaces: params.options.insertSpaces !== false
        });

        const lines = text.split('\n');
        const endChar = lines[end.line]?.length || 0;
        
        return [{
            range: {
                start: { line: start.line, character: 0 },
                end: { line: end.line, character: endChar }
            },
            newText: formatted
        }];
    });
    
    // On-type formatting (triggered after specific characters)
    connection.onDocumentOnTypeFormatting((params: DocumentOnTypeFormattingParams): TextEdit[] | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const { position, ch } = params;
        const currentLine = position.line;
        
        // Only format on newline or closing brace
        if (ch !== '\n' && ch !== '}') {
            return null;
        }
        
        const text = document.getText();
        const lines = text.split('\n');
        
        if (ch === '\n') {
            // Format the previous line and the current (new) line
            const startLine = Math.max(0, currentLine - 1);
            const endLine = currentLine;
            
            const formatted = formatRange(text, startLine, endLine, {
                tabSize: params.options.tabSize || 4,
                insertSpaces: params.options.insertSpaces !== false
            });
            
            const endChar = lines[endLine]?.length || 0;
            
            return [{
                range: {
                    start: { line: startLine, character: 0 },
                    end: { line: endLine, character: endChar }
                },
                newText: formatted
            }];
        } else if (ch === '}') {
            // Format just the current line when closing brace is typed
            const formatted = formatRange(text, currentLine, currentLine, {
                tabSize: params.options.tabSize || 4,
                insertSpaces: params.options.insertSpaces !== false
            });
            
            const endChar = lines[currentLine]?.length || 0;
            
            return [{
                range: {
                    start: { line: currentLine, character: 0 },
                    end: { line: currentLine, character: endChar }
                },
                newText: formatted
            }];
        }
        
        return null;
    });
}
