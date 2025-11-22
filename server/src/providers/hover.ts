import { getOperatorAtPosition, getWordAndContextAtPosition } from '../utils/position-utils';
import { trackInstanceDefinitions } from '../tracking/instance-tracker';
import { inferTypeFromExpression } from '../tracking/expression-type-inference';
import { resolveClassName } from '../utils/type-resolving';
import { createOperatorMarkdown } from '../utils/markdown-builder';
import { HoverContext } from '../types';
import { LanguageServerContext } from '../types';
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
    
    connection.onHover((params) => {
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
