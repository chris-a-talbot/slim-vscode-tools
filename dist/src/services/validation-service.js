"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const diagnostic_factory_1 = require("../utils/diagnostic-factory");
const definitions_1 = require("../validation/definitions");
const structure_1 = require("../validation/structure");
const references_1 = require("../validation/references");
const method_property_1 = require("../validation/method-property");
const function_calls_1 = require("../validation/function-calls");
const null_assignments_1 = require("../validation/null-assignments");
const text_processing_1 = require("../utils/text-processing");
const constants_1 = require("../config/constants");
const regex_patterns_1 = require("../config/regex-patterns");
const constants_2 = require("../config/constants");
const instance_tracker_1 = require("../tracking/instance-tracker");
class ValidationService {
    constructor(documentationService) {
        this.documentationService = documentationService;
    }
    async validate(textDocument) {
        const validator = new DocumentValidator(textDocument, this.documentationService);
        return validator.validate();
    }
}
exports.ValidationService = ValidationService;
class DocumentValidator {
    constructor(document, documentationService) {
        this.document = document;
        this.documentationService = documentationService;
        this.diagnostics = [];
        this.braceCount = constants_1.INITIAL_DEPTHS.BRACE;
        this.lastOpenBraceLine = -1;
        this.parenBalance = constants_1.INITIAL_DEPTHS.PARENTHESIS;
        this.text = document.getText();
        this.lines = this.text.split('\n');
    }
    validate() {
        // Track instance definitions for validation
        let currentInstanceDefinitions = null;
        const trackingState = (0, instance_tracker_1.trackInstanceDefinitions)(this.document);
        currentInstanceDefinitions = trackingState.instanceDefinitions;
        // Create versions of lines with comments and strings removed for validation
        // This prevents false positives from code-like content in comments/strings
        const linesWithoutCommentsAndStrings = this.lines.map(line => (0, text_processing_1.removeCommentsAndStringsFromLine)(line));
        const textWithoutCommentsAndStrings = linesWithoutCommentsAndStrings.join('\n');
        // Validate document-level issues (using cleaned versions)
        this.diagnostics.push(...(0, definitions_1.validateDefinitions)(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings), ...(0, structure_1.validateScriptStructure)(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings), ...(0, references_1.validateUndefinedReferences)(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings));
        // Validate each line
        this.lines.forEach((line, lineIndex) => {
            this.validateLine(line, lineIndex, currentInstanceDefinitions);
        });
        // Validate unclosed braces
        this.validateUnclosedBraces();
        return this.diagnostics;
    }
    validateLine(line, lineIndex, instanceDefinitions) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//'))
            return;
        const isSlimBlock = regex_patterns_1.EVENT_PATTERNS.SLIM_BLOCK.test(trimmedLine) ||
            regex_patterns_1.EVENT_PATTERNS.SLIM_BLOCK_SPECIES.test(trimmedLine);
        // Validate brace balance
        this.validateBraceBalance(line, lineIndex, isSlimBlock);
        // Validate semicolon requirement
        const semicolonResult = (0, structure_1.shouldHaveSemicolon)(trimmedLine, this.parenBalance);
        this.parenBalance = semicolonResult.parenBalance;
        if (semicolonResult.shouldMark) {
            this.diagnostics.push((0, diagnostic_factory_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Warning, lineIndex, 0, line.length, constants_2.ERROR_MESSAGES.MISSING_SEMICOLON));
        }
        // Validate semantic aspects
        this.validateSemanticAspects(line, lineIndex, instanceDefinitions);
    }
    validateBraceBalance(line, lineIndex, isSlimBlock) {
        const braceCounts = (0, text_processing_1.countBracesIgnoringStringsAndComments)(line);
        this.braceCount += braceCounts.openCount - braceCounts.closeCount;
        if (braceCounts.openCount > 0)
            this.lastOpenBraceLine = lineIndex;
        if (this.braceCount < 0 && !isSlimBlock) {
            this.diagnostics.push((0, diagnostic_factory_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, lineIndex, constants_1.DEFAULT_POSITIONS.START_OF_LINE, line.length, constants_2.ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE));
        }
    }
    validateSemanticAspects(line, lineIndex, instanceDefinitions) {
        // Remove comments and strings from line before validation to avoid false positives
        const lineWithoutCommentsAndStrings = (0, text_processing_1.removeCommentsAndStringsFromLine)(line);
        // Skip validation if the entire line is now empty (was a comment)
        if (!lineWithoutCommentsAndStrings.trim()) {
            return;
        }
        const functionsData = this.documentationService.getFunctions();
        const classesData = this.documentationService.getClasses();
        const callbacksData = this.documentationService.getCallbacks();
        // Validate method/property calls if instance definitions are available
        if (instanceDefinitions && classesData) {
            this.diagnostics.push(...(0, method_property_1.validateMethodOrPropertyCall)(lineWithoutCommentsAndStrings, lineIndex, instanceDefinitions, classesData));
        }
        // Validate function calls if callbacks data is available
        if (callbacksData) {
            this.diagnostics.push(...(0, function_calls_1.validateFunctionCalls)(lineWithoutCommentsAndStrings, lineIndex, functionsData, callbacksData));
        }
        // Validate null assignments if all required data is available
        if (instanceDefinitions) {
            this.diagnostics.push(...(0, null_assignments_1.validateNullAssignments)(lineWithoutCommentsAndStrings, lineIndex, functionsData, classesData, instanceDefinitions));
        }
    }
    validateUnclosedBraces() {
        // Early return if braces are balanced or no opening brace found
        if (this.braceCount <= 0 || this.lastOpenBraceLine < 0) {
            return;
        }
        // Early return if last line closes the brace
        const lastLine = this.lines[this.lines.length - 1].trim();
        if (lastLine === '}') {
            return;
        }
        // Create diagnostic for unclosed brace
        this.diagnostics.push((0, diagnostic_factory_1.createDiagnostic)(vscode_languageserver_1.DiagnosticSeverity.Error, this.lastOpenBraceLine, 0, this.lines[this.lastOpenBraceLine].length, constants_2.ERROR_MESSAGES.UNCLOSED_BRACE));
    }
}
//# sourceMappingURL=validation-service.js.map