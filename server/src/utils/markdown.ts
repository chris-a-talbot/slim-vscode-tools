import { cleanSignature, cleanTypeNames, cleanDocumentationText } from './text-processing';
import { TICK_CYCLE_INFO } from '../config/config';
import { MethodInfo, PropertyInfo, FunctionData, CallbackInfo, TypeInfo, OperatorInfo, ConstructorInfo } from '../config/types';

// Alias FunctionData as FunctionInfo for compatibility
type FunctionInfo = FunctionData;

/**
 * Normalizes callback key for tick cycle lookup.
 * @param signature - The callback signature
 * @param callbackName - The callback name
 * @returns Normalized key for tick cycle lookup
 */
function normalizeTickCycleKey(signature: string, callbackName: string): string {
    let key = signature.replace(/\s+callbacks?$/i, '').trim();
    if (!key.includes('(')) key += '()';
    if (!TICK_CYCLE_INFO[key]) {
        const altKey = callbackName.replace(/\s+callbacks?$/i, '').trim();
        if (altKey && TICK_CYCLE_INFO[altKey]) return altKey;
    }
    return key;
}

/**
 * Creates tick cycle section for callbacks and events.
 * @param tickCycleKey - The normalized callback key
 * @returns Markdown string with tick cycle information, or empty string if not found
 */
function createTickCycleSection(tickCycleKey: string): string {
    const info = TICK_CYCLE_INFO[tickCycleKey];
    return info ? `\n\n**Tick Cycle:**\n- **WF model:** ${info.wf}\n- **nonWF model:** ${info.nonwf}\n` : '';
}

/**
 * Creates markdown documentation for a method.
 * @param className - The class name
 * @param methodName - The method name
 * @param methodInfo - The method information
 * @returns Markdown string for the method
 */
export function createMethodMarkdown(className: string, methodName: string, methodInfo: MethodInfo): string {
    return `**${className}.${methodName}** (method)\n\`\`\`slim\n${cleanSignature(methodInfo.signature)}\n\`\`\`\n\n${cleanDocumentationText(methodInfo.description)}`;
}

/**
 * Creates markdown documentation for a property.
 * @param className - The class name
 * @param propertyName - The property name
 * @param propertyInfo - The property information
 * @returns Markdown string for the property
 */
export function createPropertyMarkdown(className: string, propertyName: string, propertyInfo: PropertyInfo): string {
    return `**${className}.${propertyName}** (property)\nType: ${cleanTypeNames(propertyInfo.type)}\n\n${cleanDocumentationText(propertyInfo.description)}`;
}

/**
 * Creates markdown documentation for a function.
 * @param functionName - The function name
 * @param functionInfo - The function information
 * @param source - Optional source override ('SLiM' or 'Eidos')
 * @returns Markdown string for the function
 */
export function createFunctionMarkdown(functionName: string, functionInfo: FunctionInfo, source?: 'SLiM' | 'Eidos'): string {
    const sourceLabel = source || functionInfo.source || 'function';
    return `**${functionName}** (${sourceLabel} function)\n\n**Return Type:** \`${cleanTypeNames(functionInfo.returnType || 'void')}\`\n\`\`\`slim\n${cleanSignature(functionInfo.signature || '')}\n\`\`\`\n\n${cleanDocumentationText(functionInfo.description)}`;
}

/**
 * Creates markdown documentation for a callback.
 * @param callbackName - The callback name
 * @param callbackInfo - The callback information
 * @returns Markdown string for the callback
 */
export function createCallbackMarkdown(callbackName: string, callbackInfo: CallbackInfo): string {
    const signature = callbackInfo.signature || callbackName;
    const cleanedSignature = cleanSignature(signature);
    const tickCycleSection = createTickCycleSection(normalizeTickCycleKey(cleanedSignature, callbackName));
    return `**${callbackName}** (callback)\n\n\`\`\`slim\n${cleanedSignature}\n\`\`\`${tickCycleSection}\n${cleanDocumentationText(callbackInfo.description)}`;
}

/**
 * Creates markdown documentation for a type.
 * @param typeName - The type name
 * @param typeInfo - The type information
 * @returns Markdown string for the type
 */
export function createTypeMarkdown(typeName: string, typeInfo: TypeInfo): string {
    return `**${typeName}** (type)\n\n${cleanDocumentationText(typeInfo.description)}`;
}

/**
 * Creates markdown documentation for an operator.
 * @param operator - The operator symbol
 * @param operatorInfo - The operator information
 * @returns Markdown string for the operator
 */
export function createOperatorMarkdown(operator: string, operatorInfo: OperatorInfo): string {
    return `**${operator}** (operator)\n\n${cleanDocumentationText(operatorInfo.description)}`;
}

/**
 * Creates markdown documentation for an instance.
 * @param instanceName - The instance name
 * @param instanceClass - The class name of the instance
 * @returns Markdown string for the instance
 */
export function createInstanceMarkdown(instanceName: string, instanceClass: string): string {
    return `**${instanceName}** (instance of ${instanceClass})`;
}

/**
 * Creates markdown documentation for an Eidos event.
 * @param eventName - The event name
 * @param eventInfo - The event information
 * @returns Markdown string for the event
 */
export function createEidosEventMarkdown(eventName: string, eventInfo: CallbackInfo): string {
    const fullEventName = eventName + '()';
    const tickCycleInfo = TICK_CYCLE_INFO[fullEventName];
    const tickCycleSection = tickCycleInfo ? `\n\n**Tick Cycle:**\n- **WF model:** ${tickCycleInfo.wf}\n- **nonWF model:** ${tickCycleInfo.nonwf}\n` : '';
    return `**${fullEventName}** (Eidos event)\n\n\`\`\`slim\n${fullEventName}\n\`\`\`${tickCycleSection}\n${cleanDocumentationText(eventInfo.description)}`;
}

/**
 * Creates markdown documentation for a constructor.
 * @param className - The class name
 * @param constructorInfo - The constructor information
 * @returns Markdown string for the constructor
 */
export function createConstructorMarkdown(className: string, constructorInfo: ConstructorInfo): string {
    return `**${className}** (constructor)\n\n\`\`\`slim\n${cleanSignature(constructorInfo.signature)}\n\`\`\`\n\n${cleanDocumentationText(constructorInfo.description)}`;
}
