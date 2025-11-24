import { Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from '../utils/documentation-service';
export declare class ValidationService {
    private documentationService;
    constructor(documentationService: DocumentationService);
    validate(textDocument: TextDocument): Promise<Diagnostic[]>;
}
//# sourceMappingURL=validation-service.d.ts.map