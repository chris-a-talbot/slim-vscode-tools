import { InitializeParams, InitializeResult, ServerCapabilities, TextDocumentSyncKind, TextDocumentChangeEvent } from 'vscode-languageserver';
import { sendDiagnostics } from '../utils/diagnostics';
import { registerDocumentSymbolsProvider } from '../providers/document-symbols';
import { registerHoverProvider } from '../providers/hover';
import { registerCompletionProvider } from '../providers/completion';
import { registerDefinitionProvider } from '../providers/definition';
import { registerReferencesProvider } from '../providers/references';
import { LanguageServerContext } from '../config/types';
import { logErrorWithStack } from '../utils/logger';
import { registerSignatureHelpProvider } from '../providers/signature-help';
import { registerCodeActionProvider } from '../providers/code-actions';
import { registerFormattingProvider } from '../providers/formatting';
import { registerRenameProvider } from '../providers/rename';
import { registerWorkspaceSymbolsProvider } from '../providers/workspace-symbols';
import { registerInlayHintsProvider } from '../providers/inlay-hints';
import { registerCodeLensProvider } from '../providers/code-lens';
import { registerDocumentHighlightsProvider } from '../providers/document-highlights';
import { registerFoldingRangeProvider } from '../providers/folding-range';

export function registerHandlers(context: LanguageServerContext): void {
    const { connection, documents, validationService } = context;
    
    // Debounce timer for validation - waits for user to pause typing
    let validationTimer: NodeJS.Timeout | null = null;
    const VALIDATION_DELAY_MS = 350; // Wait 350ms after last keystroke
    
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
                documentFormattingProvider: true,
                documentRangeFormattingProvider: true,
                documentOnTypeFormattingProvider: {
                    firstTriggerCharacter: '\n',
                    moreTriggerCharacter: ['}']
                },
                renameProvider: {
                    prepareProvider: true
                },
                workspaceSymbolProvider: true,
                inlayHintProvider: true,
                codeLensProvider: {
                    resolveProvider: false
                },
                documentHighlightProvider: true,
                foldingRangeProvider: true,
            } as ServerCapabilities
        };
        return result;
    });

    // Note: onInitialized handler is set up in index.ts to initialize logger

    // Register document change handler (for validation with debouncing)
    documents.onDidChangeContent((change: TextDocumentChangeEvent<any>) => {
        // Clear any pending validation
        if (validationTimer) {
            clearTimeout(validationTimer);
        }
        
        // Schedule validation after user stops typing
        validationTimer = setTimeout(() => {
            validationService.validate(change.document).then((diagnostics) => {
                sendDiagnostics(connection, change.document.uri, diagnostics);
            }).catch((error: unknown) => {
                logErrorWithStack(error, 'Error during validation');
                // Send empty diagnostics on error to clear previous errors
                sendDiagnostics(connection, change.document.uri, []);
            });
        }, VALIDATION_DELAY_MS);
    });

    // Register all providers
    registerDocumentSymbolsProvider(context);
    registerHoverProvider(context);
    registerCompletionProvider(context);
    registerDefinitionProvider(context);
    registerReferencesProvider(context);
    registerSignatureHelpProvider(context);
    registerCodeActionProvider(context);
    registerFormattingProvider(context);
    registerRenameProvider(context);
    registerWorkspaceSymbolsProvider(context);
    registerInlayHintsProvider(context);
    registerCodeLensProvider(context);
    registerDocumentHighlightsProvider(context);
    registerFoldingRangeProvider(context);
}
