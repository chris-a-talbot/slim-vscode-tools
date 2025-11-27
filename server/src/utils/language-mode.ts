import { TextDocument } from 'vscode-languageserver-textdocument';
import { LanguageMode } from '../config/types';

export function getLanguageModeFromUri(uri: string): LanguageMode {
    if (uri.endsWith('.eidos')) {
        return 'eidos';
    }
    return 'slim';
}

export function getLanguageModeFromDocument(document: TextDocument): LanguageMode {
    if (document.languageId === 'eidos') {
        return 'eidos';
    }
    if (document.languageId === 'slim') {
        return 'slim';
    }
    
    return getLanguageModeFromUri(document.uri);
}

export function isSourceAvailableInMode(
    source: 'SLiM' | 'Eidos' | undefined,
    mode: LanguageMode
): boolean {
    // Eidos source is always available
    if (source === 'Eidos') {
        return true;
    }
    
    // SLiM-specific features only in slim mode
    if (source === 'SLiM') {
        return mode === 'slim';
    }
    
    return true;
}

