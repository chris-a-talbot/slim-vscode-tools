import { Hover } from 'vscode-languageserver';
import { WordContext, HoverContext, MethodInfo, PropertyInfo, FunctionData, CallbackInfo, TypeInfo, OperatorInfo, ConstructorInfo } from '../types';
/**
 * Creates markdown documentation for a method.
 */
export declare function createMethodMarkdown(className: string, methodName: string, methodInfo: MethodInfo): string;
/**
 * Creates markdown documentation for a property.
 */
export declare function createPropertyMarkdown(className: string, propertyName: string, propertyInfo: PropertyInfo): string;
/**
 * Creates markdown documentation for a function.
 */
export declare function createFunctionMarkdown(functionName: string, functionInfo: FunctionData, source?: 'SLiM' | 'Eidos'): string;
/**
 * Creates markdown documentation for a callback.
 */
export declare function createCallbackMarkdown(callbackName: string, callbackInfo: CallbackInfo): string;
/**
 * Creates markdown documentation for a type.
 */
export declare function createTypeMarkdown(typeName: string, typeInfo: TypeInfo): string;
/**
 * Creates markdown documentation for an operator.
 */
export declare function createOperatorMarkdown(operator: string, operatorInfo: OperatorInfo): string;
/**
 * Creates markdown documentation for an instance.
 */
export declare function createInstanceMarkdown(instanceName: string, instanceClass: string): string;
/**
 * Creates markdown documentation for an Eidos event.
 */
export declare function createEidosEventMarkdown(eventName: string, eventInfo: CallbackInfo): string;
/**
 * Creates markdown documentation for a constructor.
 */
export declare function createConstructorMarkdown(className: string, constructorInfo: ConstructorInfo): string;
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
export declare function getHoverForWord(word: string, context: WordContext, hoverContext: HoverContext): Hover | null;
//# sourceMappingURL=hover.d.ts.map