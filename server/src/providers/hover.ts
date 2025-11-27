import { HoverParams } from 'vscode-languageserver';
import { getOperatorAtPosition, getWordAndContextAtPosition } from '../utils/positions';
import { trackInstanceDefinitions } from '../utils/instance';
import { inferTypeFromExpression, resolveClassName } from '../utils/type-manager';
import { LanguageServerContext } from '../config/types';
import { getHoverForWord, getOperatorHover } from '../utils/hover-resolvers';
import { getLanguageModeFromDocument } from '../utils/language-mode';

export function registerHoverProvider(context: LanguageServerContext): void {
    const { connection, documents, documentationService } = context;

    connection.onHover((params: HoverParams) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const trackingState = trackInstanceDefinitions(document);
        const languageMode = getLanguageModeFromDocument(document);

        // Get documentation data filtered by language mode
        const functionsData = documentationService.getFunctions(languageMode);
        const classesData = documentationService.getClasses(languageMode);
        const callbacksData = documentationService.getCallbacks(languageMode);
        const typesData = documentationService.getTypes();
        const operatorsData = documentationService.getOperators();

        // Check for operators first
        const operator = getOperatorAtPosition(text, position);
        if (operator) {
            const operatorHover = getOperatorHover(operator, operatorsData);
            if (operatorHover) return operatorHover;
        }

        const wordInfo = getWordAndContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            inferTypeFromExpression,
        });
        if (!wordInfo) return null;

        return getHoverForWord(
            wordInfo.word,
            wordInfo.context,
            functionsData,
            classesData,
            callbacksData,
            typesData,
            trackingState.instanceDefinitions
        );
    });
}