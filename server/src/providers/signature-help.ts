import { SignatureHelpParams, SignatureHelp } from 'vscode-languageserver';
import { cleanSignature, cleanDocumentationText } from '../utils/text-processing';
import { getWordAndContextAtPosition } from '../utils/position-utils';
import { resolveClassName } from '../utils/type-resolving';
import { trackInstanceDefinitions } from '../tracking/instance-tracker';
import { inferTypeFromExpression } from '../tracking/expression-type-inference';
import { TEXT_PROCESSING_PATTERNS } from '../config/regex-patterns';
import { LanguageServerContext } from '../types';

/**
 * Registers the signature help provider handler.
 * Provides signature help (parameter hints) when the user types a function call.
 * @param context - The language server context
 */
export function registerSignatureHelpProvider(context: LanguageServerContext): void {
    const { connection, documents, documentationService } = context;
    const functionsData = documentationService.getFunctions();
    const classesData = documentationService.getClasses();

    connection.onSignatureHelp((params: SignatureHelpParams): SignatureHelp | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const trackingState = trackInstanceDefinitions(document); // Track instance definitions
        const wordInfo = getWordAndContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            classesData,
            inferTypeFromExpression
        });
        if (!wordInfo) return null;

        const word = wordInfo.word;
        if (functionsData[word]) {
            const functionInfo = functionsData[word];
            const signature = functionInfo.signature || functionInfo.signatures?.[0] || '';
            if (!signature) return null;
            const cleanedSignature = cleanSignature(signature);
            
            // Extract parameters from cleaned signature
            const paramList = cleanedSignature.match(TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
            const parameters = paramList ? paramList[1].split(",").map(p => p.trim()) : [];

            return {
                signatures: [
                    {
                        label: cleanedSignature,
                        documentation: {
                            kind: "markdown",
                            value: `${cleanedSignature}\n\n${cleanDocumentationText(functionInfo.description)}`
                        },
                        parameters: parameters.map(param => ({ label: param }))
                    }
                ],
                activeSignature: 0,
                activeParameter: 0
            };
        }

        return null;
    });
}
