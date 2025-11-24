"use strict";
// ============================================================================
// INTERACTION QUERY VALIDATION
// Validates that InteractionType query methods are only called after evaluate()
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInteractionQueries = validateInteractionQueries;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostics_1 = require("../utils/diagnostics");
const config_1 = require("../config/config");
/**
 * Validates that InteractionType query methods are called after evaluate()
 * Uses brace tracking to identify individual event blocks
 * @param lines - All lines of code
 * @param trackingState - The tracking state with callback context
 * @returns Array of diagnostic objects
 */
function validateInteractionQueries(lines, trackingState) {
    const diagnostics = [];
    // Identify event blocks by tracking braces
    const eventBlocks = [];
    let currentBlock = null;
    let braceDepth = 0;
    lines.forEach((line, lineIndex) => {
        const currentCallback = trackingState.callbackContextByLine.get(lineIndex);
        // Start a new block when entering a callback
        if (currentCallback && !currentBlock && line.includes('{')) {
            currentBlock = {
                startLine: lineIndex,
                endLine: lineIndex,
                hasEvaluate: false
            };
            braceDepth = 1;
        }
        else if (currentBlock) {
            // Track brace depth
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;
            currentBlock.endLine = lineIndex;
            // Check for evaluate() in this block
            if (/\.evaluate\s*\(/.test(line)) {
                currentBlock.hasEvaluate = true;
            }
            // End the block when braces close
            if (braceDepth === 0) {
                eventBlocks.push(currentBlock);
                currentBlock = null;
            }
        }
    });
    // Check query methods within each event block
    eventBlocks.forEach(block => {
        const evaluateLineInBlock = block.hasEvaluate ?
            lines.slice(block.startLine, block.endLine + 1)
                .findIndex(line => /\.evaluate\s*\(/.test(line)) + block.startLine : -1;
        for (let lineIndex = block.startLine; lineIndex <= block.endLine; lineIndex++) {
            const line = lines[lineIndex];
            // Check for query method calls
            for (const methodName of config_1.METHODS_REQUIRING_EVALUATE) {
                const pattern = new RegExp(`\\.${methodName}\\s*\\(`, 'g');
                let match;
                while ((match = pattern.exec(line)) !== null) {
                    // Check if evaluate() was called earlier in this block
                    const hasEvaluateBefore = block.hasEvaluate && evaluateLineInBlock >= 0 && evaluateLineInBlock < lineIndex;
                    if (!hasEvaluateBefore) {
                        const startCol = match.index + 1; // Skip the dot
                        const endCol = startCol + methodName.length;
                        diagnostics.push((0, diagnostics_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, startCol, endCol, `InteractionType.${methodName}() requires evaluate() to be called first for the receiver and exerter subpopulations`));
                    }
                }
            }
        }
    });
    return diagnostics;
}
//# sourceMappingURL=interaction-queries.js.map