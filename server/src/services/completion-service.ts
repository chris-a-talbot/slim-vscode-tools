import { CompletionItem, CompletionItemKind, CompletionList, Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentationService } from './documentation-service';
import { getAutocompleteContextAtPosition } from '../utils/positions';
import { resolveClassName } from '../utils/type-manager';
import { trackInstanceDefinitions } from '../utils/instance';
import { createFunctionMarkdown, createMethodMarkdown, createPropertyMarkdown, createCallbackMarkdown, createConstructorMarkdown, createOperatorMarkdown } from '../utils/markdown';
import { FunctionData, MethodInfo, PropertyInfo, CallbackInfo, OperatorInfo, ConstructorInfo } from '../config/types';
import { cleanSignature, cleanTypeNames } from '../utils/text-processing';
import { getLanguageModeFromDocument } from '../utils/language-mode';

export class CompletionService {
    constructor(private documentationService: DocumentationService) {}

    public getCompletions(
        document: TextDocument,
        position: Position
    ): CompletionItem[] | CompletionList | null {
        const text = document.getText();
        const trackingState = trackInstanceDefinitions(document);
        const languageMode = getLanguageModeFromDocument(document);

        const completions: CompletionItem[] = [];
        const wordInfo = getAutocompleteContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions
        });

        if (wordInfo && wordInfo.context.isMethodOrProperty) {
            this.addMethodAndPropertyCompletions(
                wordInfo.context.className,
                completions,
                languageMode
            );
        } else {
            this.addGlobalCompletions(completions, languageMode);
        }

        return completions;
    }

    public resolveCompletion(item: CompletionItem): CompletionItem {
        const functionsData = this.documentationService.getFunctions();
        const classesData = this.documentationService.getClasses();

        const functionInfo = functionsData[item.label];
        if (functionInfo) {
            item.documentation = {
                kind: "markdown",
                value: createFunctionMarkdown(item.label, functionInfo, functionInfo.source)
            };
            return item;
        }

        const parts = item.label.split('.');
        if (parts.length < 2) {
            return item;
        }

        const className = parts[0];
        const memberName = parts[1];
        const classInfo = classesData[className];
        
        if (!classInfo) {
            return item;
        }

        if (memberName && classInfo.methods?.[memberName]) {
            item.documentation = {
                kind: "markdown",
                value: createMethodMarkdown(className, memberName, classInfo.methods[memberName])
            };
            return item;
        }

        if (memberName && classInfo.properties?.[memberName]) {
            item.documentation = {
                kind: "markdown",
                value: createPropertyMarkdown(className, memberName, classInfo.properties[memberName])
            };
            return item;
        }

        return item;
    }

    private addMethodAndPropertyCompletions(
        className: string | undefined,
        completions: CompletionItem[],
        languageMode: 'eidos' | 'slim'
    ): void {
        if (!className) return;

        const classesData = this.documentationService.getClasses(languageMode);
        const classInfo = classesData[className];

        if (!classInfo) return;

        if (classInfo.methods) {
            for (const [methodName, methodInfo] of Object.entries(classInfo.methods)) {
                completions.push(this.createMethodCompletion(className, methodName, methodInfo));
            }
        }

        if (classInfo.properties) {
            for (const [propName, propInfo] of Object.entries(classInfo.properties)) {
                completions.push(this.createPropertyCompletion(className, propName, propInfo));
            }
        }
    }

    private addGlobalCompletions(completions: CompletionItem[], languageMode: 'eidos' | 'slim'): void {
        const functionsData = this.documentationService.getFunctions(languageMode);
        const classConstructors = this.documentationService.getClassConstructors(languageMode);
        const callbacksData = this.documentationService.getCallbacks(languageMode);
        const operatorsData = this.documentationService.getOperators();

        for (const [funcName, funcInfo] of Object.entries(functionsData)) {
            completions.push(this.createFunctionCompletion(funcName, funcInfo));
        }

        for (const [className, constructorInfo] of Object.entries(classConstructors)) {
            completions.push(this.createConstructorCompletion(className, constructorInfo));
        }

        for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
            completions.push(this.createCallbackCompletion(callbackName, callbackInfo));
        }

        for (const [operatorName, operatorInfo] of Object.entries(operatorsData)) {
            completions.push(this.createOperatorCompletion(operatorName, operatorInfo));
        }
    }

    private createMethodCompletion(
        className: string,
        methodName: string,
        methodInfo: MethodInfo
    ): CompletionItem {
        return {
            label: methodName,
            kind: CompletionItemKind.Method,
            detail: cleanSignature(methodInfo.signature),
            documentation: {
                kind: 'markdown',
                value: createMethodMarkdown(className, methodName, methodInfo)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [`${className}.${methodName}`]
            }
        };
    }

    private createPropertyCompletion(
        className: string,
        propertyName: string,
        propertyInfo: PropertyInfo
    ): CompletionItem {
        const cleanedType = cleanTypeNames(propertyInfo.type);
        return {
            label: propertyName,
            kind: CompletionItemKind.Property,
            detail: `Type: ${cleanedType}`,
            documentation: {
                kind: 'markdown',
                value: createPropertyMarkdown(className, propertyName, propertyInfo)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showPropertyDoc',
                arguments: [`${className}.${propertyName}`]
            }
        };
    }

    private createFunctionCompletion(
        functionName: string,
        functionInfo: FunctionData
    ): CompletionItem {
        const cleanedSignature = cleanSignature(
            functionInfo.signature || functionInfo.signatures?.[0] || ''
        );
        return {
            label: cleanedSignature,
            kind: CompletionItemKind.Function,
            detail: cleanedSignature,
            documentation: {
                kind: 'markdown',
                value: createFunctionMarkdown(functionName, functionInfo, functionInfo.source)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [functionName]
            }
        };
    }

    private createCallbackCompletion(
        callbackName: string,
        callbackInfo: CallbackInfo
    ): CompletionItem {
        const cleanedSignature = cleanSignature(callbackInfo.signature);
        return {
            label: cleanedSignature,
            kind: CompletionItemKind.Function,
            detail: cleanedSignature,
            documentation: {
                kind: 'markdown',
                value: createCallbackMarkdown(callbackName, callbackInfo)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [callbackName]
            }
        };
    }

    private createConstructorCompletion(
        className: string,
        constructorInfo: ConstructorInfo
    ): CompletionItem {
        const cleanedSignature = cleanSignature(constructorInfo.signature);
        return {
            label: className,
            kind: CompletionItemKind.Class,
            detail: cleanedSignature,
            documentation: {
                kind: 'markdown',
                value: createConstructorMarkdown(className, constructorInfo)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showConstructorDoc',
                arguments: [className]
            }
        };
    }

    private createOperatorCompletion(
        operatorName: string,
        operatorInfo: OperatorInfo
    ): CompletionItem {
        const cleanedSignature = cleanSignature(operatorInfo.signature);
        return {
            label: cleanedSignature,
            kind: CompletionItemKind.Operator,
            detail: operatorName,
            documentation: {
                kind: 'markdown',
                value: createOperatorMarkdown(operatorName, operatorInfo)
            },
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showOperatorDoc',
                arguments: [operatorName]
            }
        };
    }
}