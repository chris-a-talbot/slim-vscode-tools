// Signature help provider
import { SignatureHelp, MarkupKind, TextDocuments, SignatureHelpParams } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getWordAndContextAtPosition } from '../utils/positions';
import { functionsData } from '../config/config';

export function registerSignatureHelpProvider(documents: TextDocuments<TextDocument>) {
    return (params: SignatureHelpParams): SignatureHelp | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const word = getWordAndContextAtPosition(text, position);

        console.log('Signature Help Triggered for:', word);

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

