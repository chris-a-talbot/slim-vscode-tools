import {
    InitializeParams,
    InitializeResult,
    ServerCapabilities,
    TextDocumentSyncKind,
} from 'vscode-languageserver';
import { registerHoverProvider } from '../providers/hover';
import { LanguageServerContext } from '../config/types';
import { registerCompletionProvider } from '../providers/completion';
import { registerDocumentSymbolsProvider } from '../providers/document-symbols';
import { registerDefinitionProvider } from '../providers/definition';
import { registerReferencesProvider } from '../providers/references';

export function registerHandlers(context: LanguageServerContext): void {
    const { connection } = context;

    // Register initialize handler
    connection.onInitialize((_params: InitializeParams): InitializeResult => {
        const result: InitializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                hoverProvider: true,
                completionProvider: {
                    resolveProvider: true,
                    triggerCharacters: ['.'],
                },
                documentSymbolProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                // TODO: Implement additional providers
                // signatureHelpProvider: {
                //     triggerCharacters: ['(', ',', ' '],
                //     retriggerCharacters: [',', ')'],
                // },
                // codeActionProvider: {
                //     codeActionKinds: ['quickfix', 'refactor'],
                // },
                // inlayHintProvider: true,
                // renameProvider: {
                //     prepareProvider: true,
                // },
                // workspaceSymbolProvider: true,
                // codeLensProvider: {
                //     resolveProvider: false,
                // },
                // documentHighlightProvider: true,
            } as ServerCapabilities,
        };
        return result;
    });

    // Register all providers
    registerHoverProvider(context);
    registerCompletionProvider(context);
    registerDocumentSymbolsProvider(context);
    registerDefinitionProvider(context);
    registerReferencesProvider(context);
}
