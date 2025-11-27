// Handler registration and initialization
import { InitializeResult, TextDocumentSyncKind, CompletionParams, CompletionItem } from 'vscode-languageserver/node';
import { registerHoverProvider } from '../providers/hover';
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
    const { connection, documents, validationService, completionService } = context;

    // Register document change handler
    documents.onDidChangeContent(async (change) => {
        const diagnostics = await validationService.validate(change.document);
        connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    });

    // Register hover provider
    registerHoverProvider(context);

    // Register completion providers using CompletionService
    connection.onCompletion((params: CompletionParams) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;
        return completionService.getCompletions(document, params.position);
    });

    connection.onCompletionResolve((item: CompletionItem) => {
        return completionService.resolveCompletion(item);
    });

    // Register signature help provider
    connection.onSignatureHelp(registerSignatureHelpProvider(context));

    // Register references provider
    connection.onReferences(registerReferencesProvider());

    // Register document symbol provider
    connection.onDocumentSymbol(registerDocumentSymbolsProvider(documents));
}

