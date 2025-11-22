import { CompletionItem, CompletionList, TextDocument, Position, CompletionItemKind } from 'vscode-languageserver';
import { DocumentationService } from './documentation-service';
import { getAutocompleteContextAtPosition } from '../utils/position-utils';
import { resolveClassName } from '../utils/type-resolving';
import { trackInstanceDefinitions } from '../tracking/instance-tracker';
import { createFunctionMarkdown, createMethodMarkdown, createPropertyMarkdown, createCallbackMarkdown, createConstructorMarkdown } from '../utils/markdown-builder';
import { FunctionData, MethodInfo, PropertyInfo, CallbackInfo } from '../types';
import { ConstructorInfo } from '../types';
import { cleanSignature, cleanTypeNames } from '../utils/text-processing';
import { COMPLETION_KINDS } from '../config/constants';

interface CompletionItemConfig {
    label: string;
    kind: CompletionItemKind;
    detail: string;
    documentation: string;
    command: {
        title: string;
        command: string;
        arguments: string[];
    };
}

export class CompletionService {
    constructor(private documentationService: DocumentationService) {}

    public getCompletions(
        document: TextDocument,
        position: Position
    ): CompletionItem[] | CompletionList | null {
        const text = document.getText();
        const trackingState = trackInstanceDefinitions(document);

        const completions: CompletionItem[] = [];
        const wordInfo = getAutocompleteContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions
        });

        if (wordInfo && wordInfo.context.isMethodOrProperty) {
            this.addMethodAndPropertyCompletions(
                wordInfo.context.className,
                completions
            );
        } else {
            this.addGlobalCompletions(completions);
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
        completions: CompletionItem[]
    ): void {
        if (!className) return;

        const classesData = this.documentationService.getClasses();
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

    private addGlobalCompletions(completions: CompletionItem[]): void {
        const functionsData = this.documentationService.getFunctions();
        const classConstructors = this.documentationService.getClassConstructors();
        const callbacksData = this.documentationService.getCallbacks();

        for (const [funcName, funcInfo] of Object.entries(functionsData)) {
            completions.push(this.createFunctionCompletion(funcName, funcInfo));
        }

        for (const [className, constructorInfo] of Object.entries(classConstructors)) {
            completions.push(this.createConstructorCompletion(className, constructorInfo));
        }

        for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
            completions.push(this.createCallbackCompletion(callbackName, callbackInfo));
        }
    }

    private createCompletionItem(config: CompletionItemConfig): CompletionItem {
        return {
            label: config.label,
            kind: config.kind,
            detail: config.detail,
            documentation: {
                kind: 'markdown',
                value: config.documentation
            },
            command: config.command
        };
    }

    private createMethodCompletion(
        className: string,
        methodName: string,
        methodInfo: MethodInfo
    ): CompletionItem {
        return this.createCompletionItem({
            label: methodName,
            kind: COMPLETION_KINDS.METHOD,
            detail: cleanSignature(methodInfo.signature),
            documentation: createMethodMarkdown(className, methodName, methodInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [`${className}.${methodName}`]
            }
        });
    }

    private createPropertyCompletion(
        className: string,
        propertyName: string,
        propertyInfo: PropertyInfo
    ): CompletionItem {
        const cleanedType = cleanTypeNames(propertyInfo.type);
        return this.createCompletionItem({
            label: propertyName,
            kind: COMPLETION_KINDS.PROPERTY,
            detail: `Type: ${cleanedType}`,
            documentation: createPropertyMarkdown(className, propertyName, propertyInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showPropertyDoc',
                arguments: [`${className}.${propertyName}`]
            }
        });
    }

    private createFunctionCompletion(
        functionName: string,
        functionInfo: FunctionData
    ): CompletionItem {
        const cleanedSignature = cleanSignature(
            functionInfo.signature || functionInfo.signatures?.[0] || ''
        );
        return this.createCompletionItem({
            label: cleanedSignature,
            kind: COMPLETION_KINDS.FUNCTION,
            detail: cleanedSignature,
            documentation: createFunctionMarkdown(functionName, functionInfo, functionInfo.source),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [functionName]
            }
        });
    }

    private createCallbackCompletion(
        callbackName: string,
        callbackInfo: CallbackInfo
    ): CompletionItem {
        const cleanedSignature = cleanSignature(callbackInfo.signature);
        return this.createCompletionItem({
            label: cleanedSignature,
            kind: COMPLETION_KINDS.FUNCTION,
            detail: cleanedSignature,
            documentation: createCallbackMarkdown(callbackName, callbackInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [callbackName]
            }
        });
    }

    private createConstructorCompletion(
        className: string,
        constructorInfo: ConstructorInfo
    ): CompletionItem {
        const cleanedSignature = cleanSignature(constructorInfo.signature);
        return this.createCompletionItem({
            label: className,
            kind: COMPLETION_KINDS.CLASS,
            detail: cleanedSignature,
            documentation: createConstructorMarkdown(className, constructorInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showConstructorDoc',
                arguments: [className]
            }
        });
    }
}
