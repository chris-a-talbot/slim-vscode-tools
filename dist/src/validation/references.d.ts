import { Diagnostic } from 'vscode-languageserver';
/**
 * Validates undefined references to SLiM types (mutation types, genomic element types, subpopulations).
 * @param text - The full source text
 * @param lines - Array of source lines
 * @returns Array of diagnostic objects
 */
export declare function validateUndefinedReferences(_text: string, lines: string[]): Diagnostic[];
//# sourceMappingURL=references.d.ts.map