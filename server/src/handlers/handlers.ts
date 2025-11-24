import { InitializeParams, InitializeResult, ServerCapabilities, TextDocumentSyncKind, TextDocumentChangeEvent } from 'vscode-languageserver';
import { sendDiagnostics } from '../utils/diagnostics';
import { registerDocumentSymbolsProvider } from '../providers/document-symbols';
import { registerHoverProvider } from '../providers/hover';
import { registerCompletionProvider } from '../providers/completion';
import { registerSignatureHelpProvider } from '../providers/signature-help';
import { registerFormattingProvider } from '../providers/formatting';
import { registerCodeActionProvider } from '../providers/code-actions';
import { registerDefinitionProvider } from '../providers/definition';
import { registerInlayHintsProvider } from '../providers/inlay-hints';
import { registerReferencesProvider } from '../providers/references';
import { registerRenameProvider } from '../providers/rename';
import { registerWorkspaceSymbolsProvider } from '../providers/workspace-symbols';
import { LanguageServerContext } from '../config/types';
import { logErrorWithStack } from '../utils/logger';

/**
 * Registers all language server handlers and providers.
 * @param context - The language server context containing all necessary data
 */
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
                documentFormattingProvider: true,
                signatureHelpProvider: {   
                    triggerCharacters: ["(", ",", " "],
                    retriggerCharacters: [",", ")"]
                },
                codeActionProvider: {
                    codeActionKinds: [
                        'quickfix',
                        'refactor'
                    ]
                },
                definitionProvider: true,
                inlayHintProvider: true,
                renameProvider: {
                    prepareProvider: true
                },
                workspaceSymbolProvider: true
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
    registerSignatureHelpProvider(context);
    registerFormattingProvider(context);
    registerCodeActionProvider(context);
    registerDefinitionProvider(context);
    registerInlayHintsProvider(context);
    registerReferencesProvider(context);
    registerRenameProvider(context);
    registerWorkspaceSymbolsProvider(context);
}
