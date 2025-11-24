"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostics_1 = require("../utils/diagnostics");
const document_symbols_1 = require("../providers/document-symbols");
const hover_1 = require("../providers/hover");
const completion_1 = require("../providers/completion");
const signature_help_1 = require("../providers/signature-help");
const formatting_1 = require("../providers/formatting");
const code_actions_1 = require("../providers/code-actions");
const definition_1 = require("../providers/definition");
const inlay_hints_1 = require("../providers/inlay-hints");
const references_1 = require("../providers/references");
const rename_1 = require("../providers/rename");
const workspace_symbols_1 = require("../providers/workspace-symbols");
const logger_1 = require("../utils/logger");
/**
 * Registers all language server handlers and providers.
 * @param context - The language server context containing all necessary data
 */
function registerHandlers(context) {
    const { connection, documents, validationService } = context;
    // Register initialize handler
    connection.onInitialize((_params) => {
        const result = {
            capabilities: {
                textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
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
            }
        };
        return result;
    });
    // Note: onInitialized handler is set up in index.ts to initialize logger
    // Register document change handler (for validation)
    documents.onDidChangeContent((change) => {
        validationService.validate(change.document).then((diagnostics) => {
            (0, diagnostics_1.sendDiagnostics)(connection, change.document.uri, diagnostics);
        }).catch((error) => {
            (0, logger_1.logErrorWithStack)(error, 'Error during validation');
            // Send empty diagnostics on error to clear previous errors
            (0, diagnostics_1.sendDiagnostics)(connection, change.document.uri, []);
        });
    });
    // Register all providers
    (0, document_symbols_1.registerDocumentSymbolsProvider)(context);
    (0, hover_1.registerHoverProvider)(context);
    (0, completion_1.registerCompletionProvider)(context);
    (0, signature_help_1.registerSignatureHelpProvider)(context);
    (0, formatting_1.registerFormattingProvider)(context);
    (0, code_actions_1.registerCodeActionProvider)(context);
    (0, definition_1.registerDefinitionProvider)(context);
    (0, inlay_hints_1.registerInlayHintsProvider)(context);
    (0, references_1.registerReferencesProvider)(context);
    (0, rename_1.registerRenameProvider)(context);
    (0, workspace_symbols_1.registerWorkspaceSymbolsProvider)(context);
}
//# sourceMappingURL=handlers.js.map