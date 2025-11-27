// Signature help provider
import { SignatureHelp, MarkupKind, SignatureHelpParams } from 'vscode-languageserver/node';
import { getWordAndContextAtPosition } from '../utils/positions';
import { getLanguageModeFromDocument } from '../utils/language-mode';
import { LanguageServerContext } from '../config/types';

export function registerSignatureHelpProvider(context: LanguageServerContext) {
    const { documents, documentationService } = context;
    
    return (params: SignatureHelpParams): SignatureHelp | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const word = getWordAndContextAtPosition(text, position);
        const languageMode = getLanguageModeFromDocument(document);

        console.log('Signature Help Triggered for:', word);

        // Get functions filtered by language mode
        const functionsData = documentationService.getFunctions(languageMode);

        if (word && functionsData[word.word]) {
            const functionInfo = functionsData[word.word];
            const signature = functionInfo.signature;

            // Extract parameters from signature
            const paramList = signature?.match(/\((.*?)\)/);
            const parameters = paramList ? paramList[1].split(',').map((p) => p.trim()) : [];

            return {
                signatures: [
                    {
                        label: signature || '',
                        documentation: {
                            kind: MarkupKind.Markdown,
                            value: `${functionInfo.signature}\n\n${functionInfo.description}`,
                        },
                        parameters: parameters.map((param) => ({ label: param })),
                    },
                ],
                activeSignature: 0,
                activeParameter: 0,
            };
        }

        return null;
    };
}

