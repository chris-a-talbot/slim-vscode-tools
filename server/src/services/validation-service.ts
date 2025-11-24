import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from '../services/documentation-service';
import { createDiagnostic } from '../utils/diagnostics';
import { validateDefinitions } from '../validation/definitions';
import { validateScriptStructure, shouldHaveSemicolon } from '../validation/structure';
import { validateUndefinedReferences } from '../validation/references';
import { validateMethodOrPropertyCall } from '../validation/method-property';
import { validateFunctionCalls } from '../validation/function-calls';
import { countBracesIgnoringStringsAndComments, removeCommentsAndStringsFromLine } from '../utils/text-processing';
import { EVENT_PATTERNS, DEFINITION_PATTERNS } from '../config/config';
import { ERROR_MESSAGES } from '../config/config';
import { trackInstanceDefinitions } from '../utils/instance';
import { TrackingState } from '../config/types';

export class ValidationService {
    private diagnostics: Diagnostic[] = [];
    private braceCount: number = 0;
    private lastOpenBraceLine: number = -1;
    private parenBalance: number = 0;
    private lines: string[] = [];
    private text: string = '';
    private document!: TextDocument;

    constructor(private documentationService: DocumentationService) {}

    public async validate(textDocument: TextDocument): Promise<Diagnostic[]> {
        this.document = textDocument;
        this.text = textDocument.getText();
        this.lines = this.text.split('\n');
        this.diagnostics = [];
        this.braceCount = 0;
        this.lastOpenBraceLine = -1;
        this.parenBalance = 0;
        // Track instance definitions, callback contexts, and model type for validation
        const trackingState: TrackingState = trackInstanceDefinitions(this.document);
        const currentInstanceDefinitions = trackingState.instanceDefinitions;

        // Create versions of lines with comments and strings removed for validation
        // This prevents false positives from code-like content in comments/strings
        const linesWithoutCommentsAndStrings = this.lines.map(line => removeCommentsAndStringsFromLine(line));
        const textWithoutCommentsAndStrings = linesWithoutCommentsAndStrings.join('\n');

        // Track user-defined functions
        const userDefinedFunctions = this.trackUserDefinedFunctions(linesWithoutCommentsAndStrings);

        // Validate document-level issues (using cleaned versions)
        // Note: validateInitializationRules uses original text/lines to detect callbacks
        this.diagnostics.push(
            ...validateDefinitions(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings),
            ...validateScriptStructure(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings),
            ...validateUndefinedReferences(textWithoutCommentsAndStrings, linesWithoutCommentsAndStrings),
        );

        // Validate each line
        this.lines.forEach((line, lineIndex) => {
            this.validateLine(line, lineIndex, currentInstanceDefinitions, userDefinedFunctions);
        });

        // Validate unclosed braces
        this.validateUnclosedBraces();

        return this.diagnostics;
    }

    private validateLine(
        line: string,
        lineIndex: number,
        instanceDefinitions: Record<string, string> | null,
        userDefinedFunctions: Set<string>,
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
        this.validateSemanticAspects(line, lineIndex, instanceDefinitions, userDefinedFunctions);
    }

    private validateBraceBalance(line: string, lineIndex: number, isSlimBlock: boolean): void {
        const braceCounts = countBracesIgnoringStringsAndComments(line);
        this.braceCount += braceCounts.openCount - braceCounts.closeCount;
        if (braceCounts.openCount > 0) this.lastOpenBraceLine = lineIndex;
        
        if (this.braceCount < 0 && !isSlimBlock) {
            this.diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                lineIndex,
                0,
                line.length,
                ERROR_MESSAGES.UNEXPECTED_CLOSING_BRACE
            ));
        }
    }

    private validateSemanticAspects(
        line: string,
        lineIndex: number,
        instanceDefinitions: Record<string, string> | null,
        userDefinedFunctions: Set<string>,
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
            this.diagnostics.push(...validateFunctionCalls(lineWithoutCommentsAndStrings, lineIndex, functionsData, callbacksData, userDefinedFunctions));
        }
    }
    
    private trackUserDefinedFunctions(lines: string[]): Set<string> {
        const userFunctions = new Set<string>();
        const pattern = DEFINITION_PATTERNS.USER_FUNCTION;
        
        for (const line of lines) {
            pattern.lastIndex = 0;
            const match = pattern.exec(line);
            if (match) {
                userFunctions.add(match[1]);
            }
        }
        
        return userFunctions;
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

