import { decode as decodeHTML } from 'he';
import type { ParseState, ParseOptions } from '../config/types';

export type { ParseState, ParseOptions };

export function expandTypeAbbreviations(text: string): string {
    if (!text) return text;

    return text
        .replace(/\bNi\b/g, 'integer')
        .replace(/\bNl\b/g, 'logical')
        .replace(/\bNs\b/g, 'string')
        .replace(/\bNf\b/g, 'float')
        .replace(/\bNo<([^>]+)>/g, 'object<$1>')
        .replace(/\bNif\b/g, 'integer or float')
        .replace(/\bNis\b/g, 'integer or string')
        .replace(/\bis\b/g, 'integer or string');
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

// Decode HTML entities for clean math display; clean type names and signatures
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