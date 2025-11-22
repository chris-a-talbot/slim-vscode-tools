"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionService = void 0;
const position_utils_1 = require("../utils/position-utils");
const type_resolving_1 = require("../utils/type-resolving");
const instance_tracker_1 = require("../tracking/instance-tracker");
const markdown_builder_1 = require("../utils/markdown-builder");
const text_processing_1 = require("../utils/text-processing");
const constants_1 = require("../config/constants");
class CompletionService {
    constructor(documentationService) {
        this.documentationService = documentationService;
    }
    getCompletions(document, position) {
        const text = document.getText();
        const trackingState = (0, instance_tracker_1.trackInstanceDefinitions)(document);
        const completions = [];
        const wordInfo = (0, position_utils_1.getAutocompleteContextAtPosition)(text, position, {
            resolveClassName: type_resolving_1.resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions
        });
        if (wordInfo && wordInfo.context.isMethodOrProperty) {
            this.addMethodAndPropertyCompletions(wordInfo.context.className, completions);
        }
        else {
            this.addGlobalCompletions(completions);
        }
        return completions;
    }
    resolveCompletion(item) {
        const functionsData = this.documentationService.getFunctions();
        const classesData = this.documentationService.getClasses();
        const functionInfo = functionsData[item.label];
        if (functionInfo) {
            item.documentation = {
                kind: "markdown",
                value: (0, markdown_builder_1.createFunctionMarkdown)(item.label, functionInfo, functionInfo.source)
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
                value: (0, markdown_builder_1.createMethodMarkdown)(className, memberName, classInfo.methods[memberName])
            };
            return item;
        }
        if (memberName && classInfo.properties?.[memberName]) {
            item.documentation = {
                kind: "markdown",
                value: (0, markdown_builder_1.createPropertyMarkdown)(className, memberName, classInfo.properties[memberName])
            };
            return item;
        }
        return item;
    }
    addMethodAndPropertyCompletions(className, completions) {
        if (!className)
            return;
        const classesData = this.documentationService.getClasses();
        const classInfo = classesData[className];
        if (!classInfo)
            return;
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
    addGlobalCompletions(completions) {
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
    createCompletionItem(config) {
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
    createMethodCompletion(className, methodName, methodInfo) {
        return this.createCompletionItem({
            label: methodName,
            kind: constants_1.COMPLETION_KINDS.METHOD,
            detail: (0, text_processing_1.cleanSignature)(methodInfo.signature),
            documentation: (0, markdown_builder_1.createMethodMarkdown)(className, methodName, methodInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [`${className}.${methodName}`]
            }
        });
    }
    createPropertyCompletion(className, propertyName, propertyInfo) {
        const cleanedType = (0, text_processing_1.cleanTypeNames)(propertyInfo.type);
        return this.createCompletionItem({
            label: propertyName,
            kind: constants_1.COMPLETION_KINDS.PROPERTY,
            detail: `Type: ${cleanedType}`,
            documentation: (0, markdown_builder_1.createPropertyMarkdown)(className, propertyName, propertyInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showPropertyDoc',
                arguments: [`${className}.${propertyName}`]
            }
        });
    }
    createFunctionCompletion(functionName, functionInfo) {
        const cleanedSignature = (0, text_processing_1.cleanSignature)(functionInfo.signature || functionInfo.signatures?.[0] || '');
        return this.createCompletionItem({
            label: cleanedSignature,
            kind: constants_1.COMPLETION_KINDS.FUNCTION,
            detail: cleanedSignature,
            documentation: (0, markdown_builder_1.createFunctionMarkdown)(functionName, functionInfo, functionInfo.source),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [functionName]
            }
        });
    }
    createCallbackCompletion(callbackName, callbackInfo) {
        const cleanedSignature = (0, text_processing_1.cleanSignature)(callbackInfo.signature);
        return this.createCompletionItem({
            label: cleanedSignature,
            kind: constants_1.COMPLETION_KINDS.FUNCTION,
            detail: cleanedSignature,
            documentation: (0, markdown_builder_1.createCallbackMarkdown)(callbackName, callbackInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showFunctionDoc',
                arguments: [callbackName]
            }
        });
    }
    createConstructorCompletion(className, constructorInfo) {
        const cleanedSignature = (0, text_processing_1.cleanSignature)(constructorInfo.signature);
        return this.createCompletionItem({
            label: className,
            kind: constants_1.COMPLETION_KINDS.CLASS,
            detail: cleanedSignature,
            documentation: (0, markdown_builder_1.createConstructorMarkdown)(className, constructorInfo),
            command: {
                title: 'Show Documentation',
                command: 'slimTools.showConstructorDoc',
                arguments: [className]
            }
        });
    }
}
exports.CompletionService = CompletionService;
//# sourceMappingURL=completion-service.js.map