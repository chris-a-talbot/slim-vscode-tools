// Handler registration and initialization
import { InitializeResult, TextDocumentSyncKind } from 'vscode-languageserver/node';
import { registerHoverProvider } from '../providers/hover';
import { registerCompletionProvider, registerCompletionResolveProvider } from '../providers/completion';
import { registerSignatureHelpProvider } from '../providers/signature-help';
import { registerReferencesProvider } from '../providers/references';
import { registerDocumentSymbolsProvider } from '../providers/document-symbols';
import { LanguageServerContext } from '../config/types';

export function getInitializeResult(): InitializeResult {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.'],
            },
            hoverProvider: true,
            referencesProvider: true,
            documentSymbolProvider: true,
            documentFormattingProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(', ',', ' '],
                retriggerCharacters: [',', ')'],
            },
        },
    };
}

export function registerHandlers(
    context: LanguageServerContext
): void {
    const { connection, documents, validationService } = context;

    // Register document change handler
    documents.onDidChangeContent(async (change) => {
        const diagnostics = await validationService.validate(change.document);
        connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    });

    // Register hover provider
    registerHoverProvider(context);

    // Register completion providers
    connection.onCompletion(registerCompletionProvider(documents));
    connection.onCompletionResolve(registerCompletionResolveProvider());

    // Register signature help provider
    connection.onSignatureHelp(registerSignatureHelpProvider(documents));

    // Register references provider
    connection.onReferences(registerReferencesProvider());

    // Register document symbol provider
    connection.onDocumentSymbol(registerDocumentSymbolsProvider(documents));
}

