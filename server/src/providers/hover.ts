import { HoverParams } from 'vscode-languageserver';
import { getOperatorAtPosition, getWordAndContextAtPosition } from '../utils/positions';
import { trackInstanceDefinitions } from '../utils/instance';
import { inferTypeFromExpression } from '../utils/type-info';
import { resolveClassName } from '../utils/type-resolving';
import { createOperatorMarkdown } from '../utils/markdown';
import { HoverContext } from '../config/types';
import { LanguageServerContext } from '../config/types';
import { getHoverForWord } from '../utils/hover-resolvers';

/**
 * Registers the hover provider handler.
 * @param context - The language server context
 */
export function registerHoverProvider(context: LanguageServerContext): void {
    const { connection, documents, documentationService } = context;
    const functionsData = documentationService.getFunctions();
    const classesData = documentationService.getClasses();
    const callbacksData = documentationService.getCallbacks();
    const typesData = documentationService.getTypes();
    const operatorsData = documentationService.getOperators();
    
    connection.onHover((params: HoverParams) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const trackingState = trackInstanceDefinitions(document);
        
        // Check for operators first
        const operator = getOperatorAtPosition(text, position);
        if (operator && operatorsData[operator]) {
            return { contents: { kind: 'markdown', value: createOperatorMarkdown(operator, operatorsData[operator]) } };
        }
        
        const wordInfo = getWordAndContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            inferTypeFromExpression
        });
        if (!wordInfo) return null;

        const hoverContext: HoverContext = {
            functionsData,
            classesData,
            callbacksData,
            typesData,
            operatorsData,
            instanceDefinitions: trackingState.instanceDefinitions
        };
        
        return getHoverForWord(wordInfo.word, wordInfo.context, hoverContext);
    });
}
