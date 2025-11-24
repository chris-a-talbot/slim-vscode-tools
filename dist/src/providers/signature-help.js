"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
const text_processing_1 = require("../utils/text-processing");
const positions_1 = require("../utils/positions");
const type_resolving_1 = require("../utils/type-resolving");
const instance_1 = require("../utils/instance");
const type_info_1 = require("../utils/type-info");
const config_1 = require("../config/config");
/**
 * Registers the signature help provider handler.
 * Provides signature help (parameter hints) when the user types a function call.
 * @param context - The language server context
 */
function registerSignatureHelpProvider(context) {
    const { connection, documents, documentationService } = context;
    const functionsData = documentationService.getFunctions();
    const classesData = documentationService.getClasses();
    connection.onSignatureHelp((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const position = params.position;
        const text = document.getText();
        const trackingState = (0, instance_1.trackInstanceDefinitions)(document); // Track instance definitions
        const wordInfo = (0, positions_1.getWordAndContextAtPosition)(text, position, {
            resolveClassName: type_resolving_1.resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            classesData,
            inferTypeFromExpression: type_info_1.inferTypeFromExpression
        });
        if (!wordInfo)
            return null;
        const word = wordInfo.word;
        if (functionsData[word]) {
            const functionInfo = functionsData[word];
            const signature = functionInfo.signature || functionInfo.signatures?.[0] || '';
            if (!signature)
                return null;
            const cleanedSignature = (0, text_processing_1.cleanSignature)(signature);
            // Extract parameters from cleaned signature
            const paramList = cleanedSignature.match(config_1.TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
            const parameters = paramList ? paramList[1].split(",").map(p => p.trim()) : [];
            return {
                signatures: [
                    {
                        label: cleanedSignature,
                        documentation: {
                            kind: "markdown",
                            value: `${cleanedSignature}\n\n${(0, text_processing_1.cleanDocumentationText)(functionInfo.description)}`
                        },
                        parameters: parameters.map(param => ({ label: param }))
                    }
                ],
                activeSignature: 0,
                activeParameter: 0
            };
        }
        return null;
    });
}
//# sourceMappingURL=signature-help.js.map