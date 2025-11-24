import { Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from './documentation-service';
export declare class DocumentValidator {
    private document;
    private documentationService;
    private diagnostics;
    private braceCount;
    private lastOpenBraceLine;
    private parenBalance;
    private lines;
    private text;
    constructor(document: TextDocument, documentationService: DocumentationService);
    validate(): Diagnostic[];
    private validateLine;
    private validateBraceBalance;
    private validateSemanticAspects;
    private validateUnclosedBraces;
}
//# sourceMappingURL=validator.d.ts.map