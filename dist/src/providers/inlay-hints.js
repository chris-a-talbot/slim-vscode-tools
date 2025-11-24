"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInlayHintsProvider = registerInlayHintsProvider;
const vscode_languageserver_1 = require("vscode-languageserver");
const instance_1 = require("../utils/instance");
const type_info_1 = require("../utils/type-info");
const config_1 = require("../config/config");
/**
 * Registers the inlay hints provider for type annotations
 */
function registerInlayHintsProvider(context) {
    const { connection, documents } = context;
    connection.languages.inlayHint.on((params) => {
        const document = documents.get(params.textDocument.uri);
        if (!document)
            return [];
        const text = document.getText();
        const hints = [];
        // Track all instance definitions in the document
        const trackingState = (0, instance_1.trackInstanceDefinitions)(document);
        // Get lines in the requested range
        const lines = text.split('\n');
        const startLine = params.range.start.line;
        const endLine = params.range.end.line;
        for (let lineIndex = startLine; lineIndex <= endLine && lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            // Add hints for variable assignments with inferred types
            hints.push(...getTypeHintsForLine(line, lineIndex, trackingState));
        }
        return hints;
    });
}
/**
 * Gets type hints for variables in a line
 */
function getTypeHintsForLine(line, lineIndex, trackingState) {
    const hints = [];
    // Pattern: variable = expression;
    const assignmentMatch = line.match(config_1.DEFINITION_PATTERNS.ASSIGNMENT);
    if (assignmentMatch) {
        const varName = assignmentMatch[1];
        const expression = assignmentMatch[2].trim();
        // Check if we have a tracked type for this variable
        const trackedType = trackingState.instanceDefinitions[varName];
        if (trackedType) {
            // Find position after the variable name
            const varIndex = line.indexOf(varName);
            if (varIndex !== -1) {
                hints.push({
                    position: vscode_languageserver_1.Position.create(lineIndex, varIndex + varName.length),
                    label: `: ${trackedType}`,
                    kind: vscode_languageserver_1.InlayHintKind.Type,
                    paddingLeft: false,
                    paddingRight: true
                });
            }
        }
        else {
            // Try to infer type from expression
            const inferredType = (0, type_info_1.inferTypeFromExpression)(expression);
            if (inferredType) {
                const varIndex = line.indexOf(varName);
                if (varIndex !== -1) {
                    hints.push({
                        position: vscode_languageserver_1.Position.create(lineIndex, varIndex + varName.length),
                        label: `: ${inferredType}`,
                        kind: vscode_languageserver_1.InlayHintKind.Type,
                        paddingLeft: false,
                        paddingRight: true
                    });
                }
            }
        }
    }
    // Pattern: for (x in collection)
    const forInMatch = line.match(/for\s*\(\s*(\w+)\s+in\s+([^)]+)\)/);
    if (forInMatch) {
        const varName = forInMatch[1];
        const collection = forInMatch[2].trim();
        // Try to infer element type from collection
        const collectionType = (0, type_info_1.inferTypeFromExpression)(collection);
        if (collectionType) {
            const varIndex = line.indexOf(varName);
            if (varIndex !== -1) {
                // Show hint for loop variable
                hints.push({
                    position: vscode_languageserver_1.Position.create(lineIndex, varIndex + varName.length),
                    label: `: ${collectionType}`,
                    kind: vscode_languageserver_1.InlayHintKind.Type,
                    paddingLeft: false,
                    paddingRight: true
                });
            }
        }
    }
    return hints;
}
//# sourceMappingURL=inlay-hints.js.map