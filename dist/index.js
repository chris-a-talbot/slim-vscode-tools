"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const node_2 = require("vscode-languageserver/node");
const handlers_1 = require("./src/handlers/handlers");
const logger_1 = require("./src/utils/logger");
const documentation_service_1 = require("./src/services/documentation-service");
const validation_service_1 = require("./src/services/validation-service");
const completion_service_1 = require("./src/services/completion-service");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_2.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
(0, logger_1.log)('Starting...');
process.on('uncaughtException', (error) => {
    (0, logger_1.logErrorWithStack)(error, 'Uncaught exception');
});
process.on('unhandledRejection', (reason) => {
    (0, logger_1.logErrorWithStack)(reason, 'Unhandled rejection');
});
// Initialize services
const documentationService = new documentation_service_1.DocumentationService();
const validationService = new validation_service_1.ValidationService(documentationService);
const completionService = new completion_service_1.CompletionService(documentationService);
documents.listen(connection);
(0, handlers_1.registerHandlers)({
    connection,
    documents,
    documentationService,
    validationService,
    completionService
});
connection.onInitialized(() => {
    (0, logger_1.initializeLogger)(connection);
    (0, logger_1.log)('SLiM Language Server initialized');
});
connection.listen();
//# sourceMappingURL=index.js.map