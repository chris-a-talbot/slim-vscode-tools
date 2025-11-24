"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMethodMarkdown = createMethodMarkdown;
exports.createPropertyMarkdown = createPropertyMarkdown;
exports.createFunctionMarkdown = createFunctionMarkdown;
exports.createCallbackMarkdown = createCallbackMarkdown;
exports.createTypeMarkdown = createTypeMarkdown;
exports.createOperatorMarkdown = createOperatorMarkdown;
exports.createInstanceMarkdown = createInstanceMarkdown;
exports.createEidosEventMarkdown = createEidosEventMarkdown;
exports.createConstructorMarkdown = createConstructorMarkdown;
exports.getHoverForWord = getHoverForWord;
const text_processing_1 = require("./text-processing");
const types_1 = require("./types");
const config_1 = require("../config/config");
// ============================================================================
// MARKDOWN BUILDERS
// ============================================================================
/**
 * Normalizes callback key for tick cycle lookup.
 */
function normalizeTickCycleKey(signature, callbackName) {
    let key = signature.replace(/\s+callbacks?$/i, '').trim();
    if (!key.includes('('))
        key += '()';
    if (!config_1.TICK_CYCLE_INFO[key]) {
        const altKey = callbackName.replace(/\s+callbacks?$/i, '').trim();
        if (altKey && config_1.TICK_CYCLE_INFO[altKey])
            return altKey;
    }
    return key;
}
/**
 * Creates tick cycle section for callbacks and events.
 */
function createTickCycleSection(tickCycleKey) {
    const info = config_1.TICK_CYCLE_INFO[tickCycleKey];
    return info ? `\n\n**Tick Cycle:**\n- **WF model:** ${info.wf}\n- **nonWF model:** ${info.nonwf}\n` : '';
}
/**
 * Creates markdown documentation for a method.
 */
function createMethodMarkdown(className, methodName, methodInfo) {
    return `**${className}.${methodName}** (method)\n\`\`\`slim\n${(0, text_processing_1.cleanSignature)(methodInfo.signature)}\n\`\`\`\n\n${(0, text_processing_1.cleanDocumentationText)(methodInfo.description)}`;
}
/**
 * Creates markdown documentation for a property.
 */
function createPropertyMarkdown(className, propertyName, propertyInfo) {
    return `**${className}.${propertyName}** (property)\nType: ${(0, text_processing_1.cleanTypeNames)(propertyInfo.type)}\n\n${(0, text_processing_1.cleanDocumentationText)(propertyInfo.description)}`;
}
/**
 * Creates markdown documentation for a function.
 */
function createFunctionMarkdown(functionName, functionInfo, source) {
    const sourceLabel = source || functionInfo.source || 'function';
    return `**${functionName}** (${sourceLabel} function)\n\n**Return Type:** \`${(0, text_processing_1.cleanTypeNames)(functionInfo.returnType || 'void')}\`\n\`\`\`slim\n${(0, text_processing_1.cleanSignature)(functionInfo.signature || '')}\n\`\`\`\n\n${(0, text_processing_1.cleanDocumentationText)(functionInfo.description)}`;
}
/**
 * Creates markdown documentation for a callback.
 */
function createCallbackMarkdown(callbackName, callbackInfo) {
    const signature = callbackInfo.signature || callbackName;
    const cleanedSignature = (0, text_processing_1.cleanSignature)(signature);
    const tickCycleSection = createTickCycleSection(normalizeTickCycleKey(cleanedSignature, callbackName));
    return `**${callbackName}** (callback)\n\n\`\`\`slim\n${cleanedSignature}\n\`\`\`${tickCycleSection}\n${(0, text_processing_1.cleanDocumentationText)(callbackInfo.description)}`;
}
/**
 * Creates markdown documentation for a type.
 */
function createTypeMarkdown(typeName, typeInfo) {
    return `**${typeName}** (type)\n\n${(0, text_processing_1.cleanDocumentationText)(typeInfo.description)}`;
}
/**
 * Creates markdown documentation for an operator.
 */
function createOperatorMarkdown(operator, operatorInfo) {
    return `**${operator}** (operator)\n\n${(0, text_processing_1.cleanDocumentationText)(operatorInfo.description)}`;
}
/**
 * Creates markdown documentation for an instance.
 */
function createInstanceMarkdown(instanceName, instanceClass) {
    return `**${instanceName}** (instance of ${instanceClass})`;
}
/**
 * Creates markdown documentation for an Eidos event.
 */
function createEidosEventMarkdown(eventName, eventInfo) {
    const fullEventName = eventName + '()';
    const tickCycleInfo = config_1.TICK_CYCLE_INFO[fullEventName];
    const tickCycleSection = tickCycleInfo ? `\n\n**Tick Cycle:**\n- **WF model:** ${tickCycleInfo.wf}\n- **nonWF model:** ${tickCycleInfo.nonwf}\n` : '';
    return `**${fullEventName}** (Eidos event)\n\n\`\`\`slim\n${fullEventName}\n\`\`\`${tickCycleSection}\n${(0, text_processing_1.cleanDocumentationText)(eventInfo.description)}`;
}
/**
 * Creates markdown documentation for a constructor.
 */
function createConstructorMarkdown(className, constructorInfo) {
    return `**${className}** (constructor)\n\n\`\`\`slim\n${(0, text_processing_1.cleanSignature)(constructorInfo.signature)}\n\`\`\`\n\n${(0, text_processing_1.cleanDocumentationText)(constructorInfo.description)}`;
}
// ============================================================================
// HOVER RESOLUTION
// ============================================================================
/**
 * Creates a hover response with markdown content
 */
function createHoverResponse(markdown) {
    return { contents: { kind: 'markdown', value: markdown } };
}
/**
 * Resolves the class name for a method or property lookup
 */
function resolveClassForHover(className, instanceDefinitions, classesData) {
    if (!className)
        return null;
    const resolved = (0, types_1.resolveClassName)(className, instanceDefinitions) || className;
    return classesData[resolved] ? resolved : (classesData[className] ? className : null);
}
/**
 * Gets hover information for a method or property on a class instance
 */
function getClassMemberHover(word, className, classesData) {
    if (!className)
        return null;
    const classInfo = classesData[className];
    if (!classInfo)
        return null;
    if (classInfo.methods?.[word]) {
        return createHoverResponse(createMethodMarkdown(className, word, classInfo.methods[word]));
    }
    if (classInfo.properties?.[word]) {
        return createHoverResponse(createPropertyMarkdown(className, word, classInfo.properties[word]));
    }
    return null;
}
/**
 * Gets hover information for LogFile members (LogFile extends Dictionary)
 */
function getLogFileMemberHover(word, classesData) {
    if (!classesData[config_1.CLASS_NAMES.DICTIONARY])
        return null;
    const dictClass = classesData[config_1.CLASS_NAMES.DICTIONARY];
    if (dictClass.methods?.[word]) {
        return createHoverResponse(createMethodMarkdown(config_1.CLASS_NAMES.LOGFILE, word, dictClass.methods[word]));
    }
    if (dictClass.properties?.[word]) {
        return createHoverResponse(createPropertyMarkdown(config_1.CLASS_NAMES.LOGFILE, word, dictClass.properties[word]));
    }
    // Search all classes for LogFile-specific methods
    for (const classInfo of Object.values(classesData)) {
        if (classInfo.methods?.[word] && classInfo.methods[word].description?.includes(config_1.CLASS_NAMES.LOGFILE)) {
            return createHoverResponse(createMethodMarkdown(config_1.CLASS_NAMES.LOGFILE, word, classInfo.methods[word]));
        }
    }
    return null;
}
/**
 * Gets hover information for a method or property in any class (fallback)
 */
function getAnyClassMemberHover(word, classesData) {
    for (const className of Object.keys(classesData)) {
        const hover = getClassMemberHover(word, className, classesData);
        if (hover)
            return hover;
    }
    return null;
}
/**
 * Gets hover information for a callback
 */
function getCallbackHover(word, callbacksData) {
    // Check if it's an Eidos event
    if (config_1.EIDOS_EVENT_NAMES.includes(word) && callbacksData['Eidos events']) {
        return createHoverResponse(createEidosEventMarkdown(word, callbacksData['Eidos events']));
    }
    // Check other callbacks
    for (const [callbackName, callbackInfo] of Object.entries(callbacksData)) {
        if (callbackInfo.signature === word + '()' ||
            callbackInfo.signature === word ||
            callbackName.startsWith(word + '(') ||
            callbackName.startsWith(word + '()')) {
            return createHoverResponse(createCallbackMarkdown(callbackName, callbackInfo));
        }
    }
    return null;
}
/**
 * Gets hover information for a word using a strategy-based lookup.
 * Resolves hover information in priority order:
 * 1. Instance definitions (highest priority)
 * 2. Method/property on known instance
 * 3. Method in any class (fallback)
 * 4. Standalone function
 * 5. Callback
 * 6. Type (lowest priority)
 *
 * @param word - The word to get hover info for
 * @param context - Context information from position analysis
 * @param hoverContext - Full hover context with all documentation data
 * @returns Hover response or null if not found
 */
function getHoverForWord(word, context, hoverContext) {
    const { classesData, instanceDefinitions } = hoverContext;
    // Define resolvers in priority order
    const resolvers = [
        // Priority 1: Instance hover (highest priority)
        {
            test: (ctx) => !!ctx.instanceClass,
            resolve: (w, ctx) => createHoverResponse(createInstanceMarkdown(w, ctx.instanceClass)),
            priority: 1
        },
        // Priority 2: Method/property on known instance
        {
            test: (ctx) => !!ctx.isMethodOrProperty && !!ctx.className,
            resolve: (w, ctx) => {
                const className = resolveClassForHover(ctx.className, instanceDefinitions, classesData);
                if (className === config_1.CLASS_NAMES.LOGFILE) {
                    return getLogFileMemberHover(w, classesData);
                }
                return getClassMemberHover(w, className, classesData);
            },
            priority: 2
        },
        // Priority 3: Method in any class (fallback for non-method context)
        {
            test: (ctx) => !ctx.isMethodOrProperty,
            resolve: (w, _, hCtx) => getAnyClassMemberHover(w, hCtx.classesData),
            priority: 3
        },
        // Priority 4: Standalone function
        {
            test: (_, hCtx) => {
                const funcInfo = hCtx.functionsData[word];
                return !!(funcInfo && typeof funcInfo === 'object' && 'signature' in funcInfo);
            },
            resolve: (w, _, hCtx) => {
                const functionInfo = hCtx.functionsData[w];
                const source = functionInfo.source || undefined;
                return createHoverResponse(createFunctionMarkdown(w, functionInfo, source));
            },
            priority: 4
        },
        // Priority 5: Callback
        {
            test: () => true, // Always try callbacks as fallback
            resolve: (w, _, hCtx) => getCallbackHover(w, hCtx.callbacksData),
            priority: 5
        },
        // Priority 6: Type (lowest priority)
        {
            test: (_, hCtx) => !!hCtx.typesData[word],
            resolve: (w, _, hCtx) => {
                const typeInfo = hCtx.typesData[w];
                return createHoverResponse(createTypeMarkdown(w, typeInfo));
            },
            priority: 6
        }
    ];
    // Sort by priority and try each resolver
    const sortedResolvers = resolvers.sort((a, b) => a.priority - b.priority);
    for (const resolver of sortedResolvers) {
        if (resolver.test(context, hoverContext)) {
            const result = resolver.resolve(word, context, hoverContext);
            if (result)
                return result;
        }
    }
    return null;
}
//# sourceMappingURL=hover.js.map