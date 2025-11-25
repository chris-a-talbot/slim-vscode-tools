// Main entry point for the SLiM Language Server
import { createConnection, TextDocuments, ProposedFeatures } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from './src/services/documentation-service';
import { ValidationService } from './src/services/validation-service';
import { getInitializeResult, registerHandlers } from './src/handlers/handlers';
import { initializeLogger, log, logErrorWithStack } from './src/utils/logger';

// Create the connection and text document manager
const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

log('Starting...');

process.on('uncaughtException', (error) => {
    logErrorWithStack(error, 'Uncaught exception');
});

process.on('unhandledRejection', (reason) => {
    logErrorWithStack(reason, 'Unhandled rejection');
});

// Load all documentation on startup
const documentationService = new DocumentationService();
const validationService = new ValidationService(documentationService);

// Listen to document changes
documents.listen(connection);

// Handle initialization
connection.onInitialize(() => {
    return getInitializeResult();
});

// Register all handlers
registerHandlers({ connection, documents, documentationService, validationService });

connection.onInitialized(() => {
    initializeLogger(connection);
    log('SLiM Language Server initialized');
});

// Start listening for messages
connection.listen();
