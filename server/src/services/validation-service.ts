import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from '../services/documentation-service';
import { shouldHaveSemicolon } from '../validation/structure';

export class ValidationService {
    private diagnostics: Diagnostic[] = [];
    private braceCount = 0;
    private lastOpenBraceLine = -1;
    private parenBalance = 0;
    private lines: string[] = [];
    private text = '';

    constructor(documentationService: DocumentationService) {
        void documentationService;
    }

    public async validate(textDocument: TextDocument): Promise<Diagnostic[]> {
        this.text = textDocument.getText();
        this.lines = this.text.split('\n');
        this.diagnostics = [];
        this.braceCount = 0;
        this.lastOpenBraceLine = -1;
        this.parenBalance = 0;

        this.lines.forEach((line, lineIndex) => {
            this.validateLine(line, lineIndex);
        });

        this.validateUnclosedBraces();

        return this.diagnostics;
    }

    private validateLine(line: string, lineIndex: number): void {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//')) return;

        const isSlimBlock =
            /^\d+\s+\w+\(\)/.test(trimmedLine) || /^s\d+\s+\d+\s+\w+\(\)/.test(trimmedLine);

        // Validate brace balance
        this.validateBraceBalance(line, lineIndex, isSlimBlock);

        // Validate semicolon requirement
        const semicolonResult = shouldHaveSemicolon(trimmedLine, this.parenBalance);
        this.parenBalance = semicolonResult.parenBalance;

        // Only show semicolon warnings if the line looks "complete"
        if (semicolonResult.shouldMark && !this.lineAppearsIncomplete(trimmedLine)) {
            this.diagnostics.push({
                severity: DiagnosticSeverity.Warning,
                range: {
                    start: { line: lineIndex, character: 0 },
                    end: { line: lineIndex, character: line.length },
                },
                message: 'Statement might be missing a semicolon',
                source: 'slim-tools',
            });
        }
    }

    private validateBraceBalance(line: string, lineIndex: number, isSlimBlock: boolean): void {
        const openBracesInLine = (line.match(/{/g) || []).length;
        const closeBracesInLine = (line.match(/}/g) || []).length;

        this.braceCount += openBracesInLine - closeBracesInLine;
        if (openBracesInLine > 0) {
            this.lastOpenBraceLine = lineIndex;
        }

        if (this.braceCount < 0 && !isSlimBlock) {
            this.diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: { line: lineIndex, character: 0 },
                    end: { line: lineIndex, character: line.length },
                },
                message: 'Unexpected closing brace',
                source: 'slim-tools',
            });
        }
    }

    private validateUnclosedBraces(): void {
        // Early return if braces are balanced or no opening brace found
        if (this.braceCount <= 0 || this.lastOpenBraceLine < 0) {
            return;
        }

        const lastLine = this.lines[this.lines.length - 1].trim();
        if (lastLine === '}') {
            return;
        }

        this.diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: { line: this.lastOpenBraceLine, character: 0 },
                end: {
                    line: this.lastOpenBraceLine,
                    character: this.lines[this.lastOpenBraceLine].length,
                },
            },
            message: 'Unclosed brace(s)',
            source: 'slim-tools',
        });
    }

    /**
     * Check if a line appears incomplete (still being typed)
     * This helps avoid false warnings on partially-typed code
     */
    private lineAppearsIncomplete(line: string): boolean {
        // Line ends with an operator (likely continuing on next line or still typing)
        if (/[+\-*/%=<>!&|,]\s*$/.test(line)) {
            return true;
        }

        // Line ends with a dot (method chaining in progress)
        if (/\.\s*$/.test(line)) {
            return true;
        }

        // Line has unclosed parentheses or brackets
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;

        if (openParens > closeParens || openBrackets > closeBrackets) {
            return true;
        }

        // Line looks like it's starting a declaration/assignment but incomplete
        if (/^\s*\w+\s*=\s*$/.test(line)) {
            return true;
        }

        // Line ends with function call opening but no closing paren
        if (/\w+\s*\(\s*$/.test(line)) {
            return true;
        }

        return false;
    }
}


