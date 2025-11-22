"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandlers = registerHandlers;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostic_factory_1 = require("../utils/diagnostic-factory");
const document_symbols_1 = require("../providers/document-symbols");
const hover_1 = require("../providers/hover");
const completion_1 = require("../providers/completion");
const signature_help_1 = require("../providers/signature-help");
const formatting_1 = require("../providers/formatting");
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
                }
            }
        };
        return result;
    });
    // Note: onInitialized handler is set up in index.ts to initialize logger
    // Register document change handler (for validation)
    documents.onDidChangeContent((change) => {
        validationService.validate(change.document).then((diagnostics) => {
            (0, diagnostic_factory_1.sendDiagnostics)(connection, change.document.uri, diagnostics);
        }).catch((error) => {
            (0, logger_1.logErrorWithStack)(error, 'Error during validation');
            // Send empty diagnostics on error to clear previous errors
            (0, diagnostic_factory_1.sendDiagnostics)(connection, change.document.uri, []);
        });
    });
    // Register all providers
    (0, document_symbols_1.registerDocumentSymbolsProvider)(context);
    (0, hover_1.registerHoverProvider)(context);
    (0, completion_1.registerCompletionProvider)(context);
    (0, signature_help_1.registerSignatureHelpProvider)(context);
    (0, formatting_1.registerFormattingProvider)(context);
    // Register references handler (placeholder for future implementation)
    connection.onReferences((_params) => {
        // TODO: Implement reference finding
        const references = [];
        return references;
    });
}
//# sourceMappingURL=handlers.js.map