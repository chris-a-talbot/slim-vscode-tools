// Completion provider
import * as fs from 'fs';
import {
    CompletionItem,
    CompletionItemKind,
    MarkupKind,
    TextDocuments,
    CompletionParams,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getAutocompleteContextAtPosition } from '../utils/positions';
import { trackInstanceDefinitions } from '../utils/instance';
import { functionsData, classesData, callbacksData, operatorsData } from '../config/config';
import { ClassInfo } from '../config/types';
import { slimClassesPath, eidosClassesPath } from '../config/paths';
import { extractClassConstructors } from '../services/documentation-service';

// Load class constructors
const eidosClassesData: { [key: string]: ClassInfo } = JSON.parse(
    fs.readFileSync(eidosClassesPath, 'utf8')
);
const eidosClassConstructors = extractClassConstructors(eidosClassesData);

const slimClassesData: { [key: string]: ClassInfo } = JSON.parse(
    fs.readFileSync(slimClassesPath, 'utf8')
);
const slimClassConstructors = extractClassConstructors(slimClassesData);

export function registerCompletionProvider(documents: TextDocuments<TextDocument>) {
    return (params: CompletionParams): CompletionItem[] => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return [];

        const position = params.position;
        const text = document.getText();
        trackInstanceDefinitions(document);

        const completions: CompletionItem[] = [];
        const wordInfo = getAutocompleteContextAtPosition(text, position);

        if (wordInfo && wordInfo.context.isMethodOrProperty && wordInfo.context.className) {
            const className = wordInfo.context.className;

            if (classesData[className]) {
                const classInfo = classesData[className];

                // Add methods
                if (classInfo.methods) {
                    for (const methodName in classInfo.methods) {
                        const methodInfo = classInfo.methods[methodName];
                        completions.push({
                            label: methodName,
                            kind: CompletionItemKind.Method,
                            detail: methodInfo.signature,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `**${className}.${methodName}** (method)\n\n\`\`\`slim\n${methodInfo.signature}\n\`\`\`\n\n${methodInfo.description}`,
                            },
                            command: {
                                title: 'Show Documentation',
                                command: 'slimTools.showFunctionDoc',
                                arguments: [`${className}.${methodName}`],
                            },
                        });
                    }
                }

                // Add properties
                if (classInfo.properties) {
                    for (const propName in classInfo.properties) {
                        const propInfo = classInfo.properties[propName];
                        completions.push({
                            label: propName,
                            kind: CompletionItemKind.Property,
                            detail: `Type: ${propInfo.type}`,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `**${className}.${propName}** (property)\nType: ${propInfo.type}\n\n${propInfo.description}`,
                            },
                            command: {
                                title: 'Show Documentation',
                                command: 'slimTools.showPropertyDoc',
                                arguments: [`${className}.${propName}`],
                            },
                        });
                    }
                }
            }
        } else {
            // Add standalone functions
            for (const funcName in functionsData) {
                const functionInfo = functionsData[funcName];
                completions.push({
                    label: functionInfo.signature || '',
                    kind: CompletionItemKind.Function,
                    detail: functionInfo.signature || '',
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `**${funcName}**\n\n\`\`\`slim\n${functionInfo.signature}\n\`\`\`\n\n${functionInfo.description}`,
                    },
                    command: {
                        title: 'Show Documentation',
                        command: 'slimTools.showFunctionDoc',
                        arguments: [funcName],
                    },
                });
            }

            // Add Eidos class constructors
            for (const className in eidosClassConstructors) {
                const constructorInfo = eidosClassConstructors[className];
                completions.push({
                    label: className,
                    kind: CompletionItemKind.Class,
                    detail: constructorInfo.signature,
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `**${className}** (constructor)\n\n\`\`\`slim\n${constructorInfo.signature}\n\`\`\`\n\n${constructorInfo.description}`,
                    },
                    command: {
                        title: 'Show Documentation',
                        command: 'slimTools.showConstructorDoc',
                        arguments: [className],
                    },
                });
            }

            // Add SLiM class constructors
            for (const className in slimClassConstructors) {
                const constructorInfo = slimClassConstructors[className];
                completions.push({
                    label: className,
                    kind: CompletionItemKind.Class,
                    detail: constructorInfo.signature,
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `**${className}** (constructor)\n\n\`\`\`slim\n${constructorInfo.signature}\n\`\`\`\n\n${constructorInfo.description}`,
                    },
                    command: {
                        title: 'Show Documentation',
                        command: 'slimTools.showConstructorDoc',
                        arguments: [className],
                    },
                });
            }

            // Add SLiM callbacks
            for (const callbackName in callbacksData) {
                const callbackInfo = callbacksData[callbackName];
                completions.push({
                    label: callbackInfo.signature,
                    kind: CompletionItemKind.Function,
                    detail: callbackInfo.signature,
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `**${callbackName}**\n\n\`\`\`slim\n${callbackInfo.signature}\n\`\`\`\n\n${callbackInfo.description}`,
                    },
                    command: {
                        title: 'Show Documentation',
                        command: 'slimTools.showFunctionDoc',
                        arguments: [callbackName],
                    },
                });
            }

            // Add Eidos operators
            for (const operatorName in operatorsData) {
                const operatorInfo = operatorsData[operatorName];
                completions.push({
                    label: operatorInfo.signature,
                    kind: CompletionItemKind.Operator,
                    detail: operatorName,
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `**${operatorName}** (operator)\n\n\`\`\`slim\n${operatorInfo.signature}\n\`\`\`\n\n${operatorInfo.description}`,
                    },
                    command: {
                        title: 'Show Documentation',
                        command: 'slimTools.showOperatorDoc',
                        arguments: [operatorName],
                    },
                });
            }
        }

        return completions;
    };
}

export function registerCompletionResolveProvider() {
    return (item: CompletionItem): CompletionItem => {
        const [className, memberName] = item.label.split('.');

        if (functionsData[item.label]) {
            const functionInfo = functionsData[item.label];
            item.documentation = {
                kind: MarkupKind.Markdown,
                value: `**${item.label}**\n\n\`\`\`slim\n${functionInfo.signature}\n\`\`\`\n\n${functionInfo.description}`,
            };
        } else if (classesData[className]) {
            const classInfo = classesData[className];

            if (classInfo.methods && classInfo.methods[memberName]) {
                const methodInfo = classInfo.methods[memberName];
                item.documentation = {
                    kind: MarkupKind.Markdown,
                    value: `**${className}.${memberName}** (method)\n\n\`\`\`slim\n${methodInfo.signature}\n\`\`\`\n\n${methodInfo.description}`,
                };
            } else if (classInfo.properties && classInfo.properties[memberName]) {
                const propInfo = classInfo.properties[memberName];
                item.documentation = {
                    kind: MarkupKind.Markdown,
                    value: `**${className}.${memberName}** (property)\nType: ${propInfo.type}\n\n${propInfo.description}`,
                };
            }
        }

        return item;
    };
}

