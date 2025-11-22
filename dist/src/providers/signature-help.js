"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSignatureHelpProvider = registerSignatureHelpProvider;
const text_processing_1 = require("../utils/text-processing");
const position_utils_1 = require("../utils/position-utils");
const type_resolving_1 = require("../utils/type-resolving");
const instance_tracker_1 = require("../tracking/instance-tracker");
const expression_type_inference_1 = require("../tracking/expression-type-inference");
const regex_patterns_1 = require("../config/regex-patterns");
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
        const trackingState = (0, instance_tracker_1.trackInstanceDefinitions)(document); // Track instance definitions
        const wordInfo = (0, position_utils_1.getWordAndContextAtPosition)(text, position, {
            resolveClassName: type_resolving_1.resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            classesData,
            inferTypeFromExpression: expression_type_inference_1.inferTypeFromExpression
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
            const paramList = cleanedSignature.match(regex_patterns_1.TEXT_PROCESSING_PATTERNS.PARAMETER_LIST);
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