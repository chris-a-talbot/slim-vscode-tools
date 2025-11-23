import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from './documentation-service';
import { createDiagnostic } from '../utils/diagnostic-factory';
import { validateDefinitions } from '../validation/definitions';
import { validateScriptStructure, shouldHaveSemicolon } from '../validation/structure';
import { validateUndefinedReferences } from '../validation/references';
import { validateMethodOrPropertyCall } from '../validation/method-property';
import { validateFunctionCalls } from '../validation/function-calls';
import { validateNullAssignments } from '../validation/null-assignments';
import { countBracesIgnoringStringsAndComments, removeCommentsAndStringsFromLine } from '../utils/text-processing';
import { DEFAULT_POSITIONS, INITIAL_DEPTHS } from '../config/constants';
import { EVENT_PATTERNS } from '../config/regex-patterns';
import { ERROR_MESSAGES } from '../config/constants';
import { trackInstanceDefinitions } from '../tracking/instance-tracker';
import { TrackingState } from '../types';

export class ValidationService {
    constructor(private documentationService: DocumentationService) {}

    public async validate(textDocument: TextDocument): Promise<Diagnostic[]> {
        const validator = new DocumentValidator(textDocument, this.documentationService);
        return validator.validate();
    }
}

class DocumentValidator {
    private diagnostics: Diagnostic[] = [];
    private braceCount: number = INITIAL_DEPTHS.BRACE;
    private lastOpenBraceLine: number = -1;
    private parenBalance: number = INITIAL_DEPTHS.PARENTHESIS;
    private lines: string[];
    private text: string;

    constructor(
        private document: TextDocument,
        private documentationService: DocumentationService
    ) {
        this.text = document.getText();
        this.lines = this.text.split('\n');
    }

    public validate(): Diagnostic[] {
        // Track instance definitions for validation
        let currentInstanceDefinitions: Record<string, string> | null = null;
        const trackingState: TrackingState = trackInstanceDefinitions(this.document);
        currentInstanceDefinitions = trackingState.instanceDefinitions;

        // Create versions of lines with comments and strings removed for validation
        // This prevents false positives from code-like content in comments/strings
        const linesWithoutCommentsAndStrings = this.lines.map(line => removeCommentsAndStringsFromLine(line));
        const textWithoutCommentsAndStrings = linesWithoutCommentsAndStrings.join('\n');

        // Validate document-level issues (using cleaned versions)
        this.diagnostics.push(
            ...validateDefinitions(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings),
            ...validateScriptStructure(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings),
            ...validateUndefinedReferences(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings)
        );

        // Validate each line
        this.lines.forEach((line, lineIndex) => {
            this.validateLine(line, lineIndex, currentInstanceDefinitions);
        });

        // Validate unclosed braces
        this.validateUnclosedBraces();

        return this.diagnostics;
    }

    private validateLine(
        line: string,
        lineIndex: number,
        instanceDefinitions: Record<string, string> | null
    ): void {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//')) return;

        const isSlimBlock = EVENT_PATTERNS.SLIM_BLOCK.test(trimmedLine) || 
                           EVENT_PATTERNS.SLIM_BLOCK_SPECIES.test(trimmedLine);

        // Validate brace balance
        this.validateBraceBalance(line, lineIndex, isSlimBlock);

        // Validate semicolon requirement
        const semicolonResult = shouldHaveSemicolon(trimmedLine, this.parenBalance);
        this.parenBalance = semicolonResult.parenBalance;
        if (semicolonResult.shouldMark) {
            this.diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Warning,
                lineIndex,
                0,
                line.length,
                ERROR_MESSAGES.MISSING_SEMICOLON
            ));
        }
        
        // Validate semantic aspects
        this.validateSemanticAspects(line, lineIndex, instanceDefinitions);
    }

    private validateBraceBalance(line: string, lineIndex: number, isSlimBlock: boolean): void {
        const braceCounts = countBracesIgnoringStringsAndComments(line);
        this.braceCount += braceCounts.openCount - braceCounts.closeCount;
        if (braceCounts.openCount > 0) this.lastOpenBraceLine = lineIndex;
        
        if (this.braceCount < 0 && !isSlimBlock) {
            this.diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                DEFAULT_POSITIONS.START_OF_LINE,
                line.length,
                ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE
            ));
        }
    }

    private validateSemanticAspects(
        line: string,
        lineIndex: number,
        instanceDefinitions: Record<string, string> | null
    ): void {
        // Remove comments and strings from line before validation to avoid false positives
        const lineWithoutCommentsAndStrings = removeCommentsAndStringsFromLine(line);
        
        // Skip validation if the entire line is now empty (was a comment)
        if (!lineWithoutCommentsAndStrings.trim()) {
            return;
        }
        
        const functionsData = this.documentationService.getFunctions();
        const classesData = this.documentationService.getClasses();
        const callbacksData = this.documentationService.getCallbacks();
        
        // Validate method/property calls if instance definitions are available
        if (instanceDefinitions && classesData) {
            this.diagnostics.push(...validateMethodOrPropertyCall(lineWithoutCommentsAndStrings, lineIndex, instanceDefinitions, classesData));
        }
        
        // Validate function calls if callbacks data is available
        if (callbacksData) {
            this.diagnostics.push(...validateFunctionCalls(lineWithoutCommentsAndStrings, lineIndex, functionsData, callbacksData));
        }
        
        // Validate null assignments if all required data is available
        if (instanceDefinitions) {
            this.diagnostics.push(...validateNullAssignments(lineWithoutCommentsAndStrings, lineIndex, functionsData, classesData, instanceDefinitions));
        }
    }

    private validateUnclosedBraces(): void {
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
        this.diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Error,
            this.lastOpenBraceLine,
            0,
            this.lines[this.lastOpenBraceLine].length,
            ERROR_MESSAGES.UNCLOSED_BRACE
        ));
    }
}

