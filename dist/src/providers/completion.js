"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompletionProvider = registerCompletionProvider;
function registerCompletionProvider(context) {
    const { connection, documents, completionService } = context;
    connection.onCompletion((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        return completionService.getCompletions(document, params.position);
    });
    connection.onCompletionResolve((item) => {
        return completionService.resolveCompletion(item);
    });
}
//# sourceMappingURL=completion.js.map