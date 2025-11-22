import { Hover } from 'vscode-languageserver';
import { WordContext, HoverContext } from '../types';
/**
 * Gets hover information for a word using a strategy-based lookup table.
 * This replaces the long if-else chain with a declarative configuration.
 *
 * @param word - The word to get hover info for
 * @param context - Context information from position analysis
 * @param hoverContext - Full hover context with all data
 * @returns Hover response or null if not found
 */
export declare function getHoverForWord(word: string, context: WordContext, hoverContext: HoverContext): Hover | null;
//# sourceMappingURL=hover-resolvers.d.ts.map