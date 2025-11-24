import { MethodInfo, PropertyInfo, FunctionData, CallbackInfo, TypeInfo, OperatorInfo, ConstructorInfo } from '../config/types';
type FunctionInfo = FunctionData;
/**
 * Creates markdown documentation for a method.
 * @param className - The class name
 * @param methodName - The method name
 * @param methodInfo - The method information
 * @returns Markdown string for the method
 */
export declare function createMethodMarkdown(className: string, methodName: string, methodInfo: MethodInfo): string;
/**
 * Creates markdown documentation for a property.
 * @param className - The class name
 * @param propertyName - The property name
 * @param propertyInfo - The property information
 * @returns Markdown string for the property
 */
export declare function createPropertyMarkdown(className: string, propertyName: string, propertyInfo: PropertyInfo): string;
/**
 * Creates markdown documentation for a function.
 * @param functionName - The function name
 * @param functionInfo - The function information
 * @param source - Optional source override ('SLiM' or 'Eidos')
 * @returns Markdown string for the function
 */
export declare function createFunctionMarkdown(functionName: string, functionInfo: FunctionInfo, source?: 'SLiM' | 'Eidos'): string;
/**
 * Creates markdown documentation for a callback.
 * @param callbackName - The callback name
 * @param callbackInfo - The callback information
 * @returns Markdown string for the callback
 */
export declare function createCallbackMarkdown(callbackName: string, callbackInfo: CallbackInfo): string;
/**
 * Creates markdown documentation for a type.
 * @param typeName - The type name
 * @param typeInfo - The type information
 * @returns Markdown string for the type
 */
export declare function createTypeMarkdown(typeName: string, typeInfo: TypeInfo): string;
/**
 * Creates markdown documentation for an operator.
 * @param operator - The operator symbol
 * @param operatorInfo - The operator information
 * @returns Markdown string for the operator
 */
export declare function createOperatorMarkdown(operator: string, operatorInfo: OperatorInfo): string;
/**
 * Creates markdown documentation for an instance.
 * @param instanceName - The instance name
 * @param instanceClass - The class name of the instance
 * @returns Markdown string for the instance
 */
export declare function createInstanceMarkdown(instanceName: string, instanceClass: string): string;
/**
 * Creates markdown documentation for an Eidos event.
 * @param eventName - The event name
 * @param eventInfo - The event information
 * @returns Markdown string for the event
 */
export declare function createEidosEventMarkdown(eventName: string, eventInfo: CallbackInfo): string;
/**
 * Creates markdown documentation for a constructor.
 * @param className - The class name
 * @param constructorInfo - The constructor information
 * @returns Markdown string for the constructor
 */
export declare function createConstructorMarkdown(className: string, constructorInfo: ConstructorInfo): string;
export {};
//# sourceMappingURL=markdown-builder.d.ts.map