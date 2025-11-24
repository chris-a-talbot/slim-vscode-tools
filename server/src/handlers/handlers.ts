import { InitializeParams, InitializeResult, ServerCapabilities, TextDocumentSyncKind, TextDocumentChangeEvent } from 'vscode-languageserver';
import { sendDiagnostics } from '../utils/diagnostics';
import { registerDocumentSymbolsProvider } from '../providers/document-symbols';
import { registerHoverProvider } from '../providers/hover';
import { registerCompletionProvider } from '../providers/completion';
import { registerDefinitionProvider } from '../providers/definition';
import { registerReferencesProvider } from '../providers/references';
import { LanguageServerContext } from '../config/types';
import { logErrorWithStack } from '../utils/logger';

export function registerHandlers(context: LanguageServerContext): void {
    const { connection, documents, validationService } = context;
    
    // Register initialize handler
    connection.onInitialize((_params: InitializeParams): InitializeResult => {
        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: ['.'] // Add dot as a trigger character
                },
                hoverProvider: true,
                referencesProvider: true,
                documentSymbolProvider: true,
                definitionProvider: true,
            } as ServerCapabilities
        };
        return result;
    });

    // Note: onInitialized handler is set up in index.ts to initialize logger

    // Register document change handler (for validation)
    documents.onDidChangeContent((change: TextDocumentChangeEvent<any>) => {
        validationService.validate(change.document).then((diagnostics) => {
            sendDiagnostics(connection, change.document.uri, diagnostics);
        }).catch((error: unknown) => {
            logErrorWithStack(error, 'Error during validation');
            // Send empty diagnostics on error to clear previous errors
            sendDiagnostics(connection, change.document.uri, []);
        });
    });

    // Register all providers
    registerDocumentSymbolsProvider(context);
    registerHoverProvider(context);
    registerCompletionProvider(context);
    registerDefinitionProvider(context);
    registerReferencesProvider(context);
}
