import { CompletionItem, CompletionList, TextDocument, Position } from 'vscode-languageserver';
import { DocumentationService } from './documentation-service';
export declare class CompletionService {
    private documentationService;
    constructor(documentationService: DocumentationService);
    getCompletions(document: TextDocument, position: Position): CompletionItem[] | CompletionList | null;
    resolveCompletion(item: CompletionItem): CompletionItem;
    private addMethodAndPropertyCompletions;
    private addGlobalCompletions;
    private createCompletionItem;
    private createMethodCompletion;
    private createPropertyCompletion;
    private createFunctionCompletion;
    private createCallbackCompletion;
    private createConstructorCompletion;
}
//# sourceMappingURL=completion-service.d.ts.map