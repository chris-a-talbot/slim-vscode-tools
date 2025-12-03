import {
    Connection,
    TextDocuments,
    InitializeResult,
    TextDocumentSyncKind,
    CodeActionKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from '../services/documentation-service';
import { CompletionService } from '../services/completion-service';
import { ValidationService } from '../services/validation-service';
import { LanguageServerContext } from '../config/types';
import { registerHoverProvider } from '../providers/hover';
import { onCompletion, onCompletionResolve } from '../providers/completion';
import { onSignatureHelp } from '../providers/signature-help';
import { onReferences } from '../providers/references';
import { onDocumentSymbol } from '../providers/document-symbols';
import { documentCache } from '../utils/document-cache';
import { registerDefinitionProvider } from '../providers/definitions';
import { registerCodeActionProvider } from '../providers/code-actions';
import { registerFormattingProvider } from '../providers/formatting';

export function setupHandlers(
    connection: Connection,
    documents: TextDocuments<TextDocument>
): InitializeResult {
    const documentationService = new DocumentationService();
    const completionService = new CompletionService(documentationService);
    const validationService = new ValidationService(documentationService);

    // Create language server context
    const context: LanguageServerContext = {
        connection,
        documents,
        documentationService,
        completionService,
        validationService,
    };
    
    // Initialize handler
    const initializeResult: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['.'],
            },
            hoverProvider: true,
            referencesProvider: true,
            documentSymbolProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(', ',', ' '],
                retriggerCharacters: [',', ')'],
            },
            definitionProvider: true,
            codeActionProvider: {
                codeActionKinds: [CodeActionKind.QuickFix],
            },
            documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            documentOnTypeFormattingProvider: {
                firstTriggerCharacter: '}',
                moreTriggerCharacter: ['\n'],
            },
        },
    };

    // Document change handler - use ValidationService
    documents.onDidChangeContent(async (change) => {
        const diagnostics = await validationService.validate(change.document);
        connection.sendDiagnostics({ uri: change.document.uri, diagnostics });
    });

    // Document close handler - clear cache to free memory
    documents.onDidClose((event) => {
        documentCache.delete(event.document.uri);
    });

    registerHoverProvider(context);
    registerDefinitionProvider(context);
    registerCodeActionProvider(context);
    registerFormattingProvider(context);

    // Completion handler
    connection.onCompletion((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];
        return onCompletion(params, document, context);
    });

    // Completion resolve handler
    connection.onCompletionResolve((item) => {
        return onCompletionResolve(item, context);
    });

    // Signature help handler
    connection.onSignatureHelp((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;
        return onSignatureHelp(params, document, context);
    });

    // References handler
    connection.onReferences(() => {
        return onReferences();
    });

    // Document symbol handler
    connection.onDocumentSymbol((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];
        return onDocumentSymbol(params, document);
    });

    return initializeResult;
}

