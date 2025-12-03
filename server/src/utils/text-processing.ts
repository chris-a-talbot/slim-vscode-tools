import { decode as decodeHTML } from 'he';
import type { ParseState, ParseOptions } from '../config/types';

export type { ParseState, ParseOptions };

export function expandTypeAbbreviations(text: string): string {
    if (!text) return text;

    // Process longest patterns first to avoid partial matches
    return text
        // 4+ character abbreviations (all nullable with N prefix)
        .replace(/\bNlif\b/g, 'logical or integer or float')
        .replace(/\bNlis\b/g, 'logical or integer or string')
        .replace(/\bNiso\b/g, 'integer or string or object')
        // 3 character abbreviations (all nullable with N prefix)
        .replace(/\bNif\b/g, 'integer or float')
        .replace(/\bNis\b/g, 'integer or string')
        .replace(/\bNio\b/g, 'integer or object')
        .replace(/\bNfs\b/g, 'float or string')
        .replace(/\bNli\b/g, 'logical or integer')
        .replace(/\bNlo\b/g, 'logical or object')
        // Non-nullable multi-type abbreviations (only match when followed by $ or <)
        .replace(/\biso(?=[\$<\s])/g, 'integer or string or object')
        .replace(/\bio(?=[\$<\s])/g, 'integer or object')
        .replace(/\bis(?=[\$<\s])/g, 'integer or string')
        // 2 character abbreviations with angle brackets (object types)
        .replace(/\bNo<([^>]+)>/g, 'object<$1>')
        // 2 character abbreviations (all nullable with N prefix)
        .replace(/\bNi\b/g, 'integer')
        .replace(/\bNl\b/g, 'logical')
        .replace(/\bNs\b/g, 'string')
        .replace(/\bNf\b/g, 'float')
        .replace(/\bNo\b/g, 'object');
}

// Remove the $ from type names
export function cleanTypeNames(text: string): string {
    if (!text) return text;
    text = text.replace(/(\w+(?:<[^>]+>)?)\$/g, '$1');
    return expandTypeAbbreviations(text);
}

// Turn "object<ClassType>" into "<ClassType>"
export function cleanSignature(signature: string): string {
    if (!signature) return signature;
    let cleaned = cleanTypeNames(signature);
    return cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');
}

// Decode HTML entities for clean math display; clean type names and signatures (resolves issue #6)
export function cleanDocumentationText(text: string): string {
    if (!text) return text;

    // Decode HTML entities using 'he' library
    let cleaned = decodeHTML(text);

    // Clean type names
    cleaned = cleanTypeNames(cleaned);

    // Replace "object<ClassType>" with "<ClassType>" in descriptions
    cleaned = cleaned.replace(/\bobject<([^>]+)>/gi, '<$1>');

    // Convert HTML tags to markdown (preserve sub/sup tags)
    cleaned = cleaned
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        .replace(/<i>/gi, '*')
        .replace(/<\/i>/gi, '*')
        .replace(/<b>/gi, '**')
        .replace(/<\/b>/gi, '**')
        .replace(/<em>/gi, '*')
        .replace(/<\/em>/gi, '*')
        .replace(/<strong>/gi, '**')
        .replace(/<\/strong>/gi, '**');

    // Clean up multiple spaces
    return cleaned.replace(/\s{2,}/g, ' ');
}

export function removeStringsAndComments(line: string, shouldTrim: boolean = true): string {
    const strings: string[] = [];
    const codeWithPlaceholders = line.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
        strings.push(match);
        return `__STRING${strings.length - 1}__`;
    });

    const result = codeWithPlaceholders
        .replace(/\/\/.*$/, '')
        .replace(/\/\*.*?\*\//g, '');
    
    return shouldTrim ? result.trim() : result;
}

export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function countDelimiters(
    text: string, 
    open: string, 
    close: string
): { openCount: number; closeCount: number } {
    const openCount = (text.match(new RegExp(escapeRegex(open), 'g')) || []).length;
    const closeCount = (text.match(new RegExp(escapeRegex(close), 'g')) || []).length;
    return { openCount, closeCount };
}

export function countParens(text: string): { openCount: number; closeCount: number } {
    return countDelimiters(text, '(', ')');
}

export function countBraces(text: string): { openCount: number; closeCount: number } {
    return countDelimiters(text, '{', '}');
}

export function countCommasOutsideParens(text: string): number {
    const cleaned = removeStringsAndComments(text);
    
    let commaCount = 0;
    let parenDepth = 0;
    
    for (const char of cleaned) {
        if (char === '(') {
            parenDepth++;
        } else if (char === ')') {
            parenDepth--;
        } else if (char === ',' && parenDepth === 0) {
            commaCount++;
        }
    }
    
    return commaCount;
}

export function splitCodeAndComment(line: string): { code: string; comment: string } {
    const trimmed = line.trim();
    
    let inString = false;
    let stringChar = '';
    let commentIndex = -1;

    for (let i = 0; i < trimmed.length - 1; i++) {
        const char = trimmed[i];
        const nextChar = trimmed[i + 1];
        const prevChar = i > 0 ? trimmed[i - 1] : '';

        // Track string state
        if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
        }

        // Find comment outside of strings
        if (!inString && char === '/' && nextChar === '/') {
            commentIndex = i;
            break;
        }
    }

    if (commentIndex >= 0) {
        return {
            code: trimmed.substring(0, commentIndex).trim(),
            comment: ' ' + trimmed.substring(commentIndex),
        };
    }

    return { code: trimmed, comment: '' };
}