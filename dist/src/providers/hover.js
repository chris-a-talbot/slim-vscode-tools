"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHoverProvider = registerHoverProvider;
const positions_1 = require("../utils/positions");
const instance_1 = require("../utils/instance");
const type_info_1 = require("../utils/type-info");
const type_resolving_1 = require("../utils/type-resolving");
const markdown_builder_1 = require("../utils/markdown-builder");
const hover_resolvers_1 = require("../utils/hover-resolvers");
/**
 * Registers the hover provider handler.
 * @param context - The language server context
 */
function registerHoverProvider(context) {
    const { connection, documents, documentationService } = context;
    const functionsData = documentationService.getFunctions();
    const classesData = documentationService.getClasses();
    const callbacksData = documentationService.getCallbacks();
    const typesData = documentationService.getTypes();
    const operatorsData = documentationService.getOperators();
    connection.onHover((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return null;
        const position = params.position;
        const text = document.getText();
        const trackingState = (0, instance_1.trackInstanceDefinitions)(document);
        // Check for operators first
        const operator = (0, positions_1.getOperatorAtPosition)(text, position);
        if (operator && operatorsData[operator]) {
            return { contents: { kind: 'markdown', value: (0, markdown_builder_1.createOperatorMarkdown)(operator, operatorsData[operator]) } };
        }
        const wordInfo = (0, positions_1.getWordAndContextAtPosition)(text, position, {
            resolveClassName: type_resolving_1.resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            inferTypeFromExpression: type_info_1.inferTypeFromExpression
        });
        if (!wordInfo)
            return null;
        const hoverContext = {
            functionsData,
            classesData,
            callbacksData,
            typesData,
            operatorsData,
            instanceDefinitions: trackingState.instanceDefinitions
        };
        return (0, hover_resolvers_1.getHoverForWord)(wordInfo.word, wordInfo.context, hoverContext);
    });
}
//# sourceMappingURL=hover.js.map