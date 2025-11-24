import { SignatureHelpParams, SignatureHelp, SignatureInformation, ParameterInformation, MarkupKind } from 'vscode-languageserver';
import { cleanSignature, cleanDocumentationText } from '../utils/text-processing';
import { getWordAndContextAtPosition } from '../utils/positions';
import { resolveClassName, inferTypeFromExpression, extractParameterTypes } from '../utils/type-manager';
import { trackInstanceDefinitions } from '../utils/instance';
import { CALLBACK_PSEUDO_PARAMETERS, INITIALIZE_ONLY_FUNCTIONS } from '../config/config';
import { LanguageServerContext, FunctionData, MethodInfo } from '../config/types';

/**
 * Registers the signature help provider handler.
 * Provides signature help (parameter hints) when the user types a function call.
 * @param context - The language server context
 */
export function registerSignatureHelpProvider(context: LanguageServerContext): void {
    const { connection, documents, documentationService } = context;
    const functionsData = documentationService.getFunctions();
    const classesData = documentationService.getClasses();

    connection.onSignatureHelp((params: SignatureHelpParams): SignatureHelp | null => {
        const document = documents.get(params.textDocument.uri);
        if (!document) return null;

        const position = params.position;
        const text = document.getText();
        const lines = text.split('\n');
        const line = lines[position.line] || '';
        
        // Find the function/method call context
        const callContext = findCallContext(line, position.character);
        if (!callContext) return null;

        const trackingState = trackInstanceDefinitions(document);
        
        // Check if this is a callback with pseudo-parameters
        const callbackKey = `${callContext.functionName}()`;
        if (CALLBACK_PSEUDO_PARAMETERS[callbackKey]) {
            return createCallbackSignatureHelp(callbackKey, callContext.activeParameter);
        }

        // Try to get function or method signature help
        const wordInfo = getWordAndContextAtPosition(text, position, {
            resolveClassName,
            instanceDefinitions: trackingState.instanceDefinitions,
            classesData,
            inferTypeFromExpression
        });
        
        if (!wordInfo) return null;

        // Handle method calls
        if (wordInfo.context.isMethodOrProperty && wordInfo.context.className) {
            const classInfo = classesData[wordInfo.context.className];
            if (classInfo && classInfo.methods && classInfo.methods[callContext.functionName]) {
                return createMethodSignatureHelp(
                    callContext.functionName,
                    classInfo.methods[callContext.functionName],
                    callContext.activeParameter,
                    wordInfo.context.className
                );
            }
        }

        // Handle function calls
        if (functionsData[callContext.functionName]) {
            const functionInfo = functionsData[callContext.functionName];
            return createFunctionSignatureHelp(
                callContext.functionName,
                functionInfo,
                callContext.activeParameter,
                trackingState
            );
        }

        return null;
    });
}

interface CallContext {
    functionName: string;
    activeParameter: number;
    startPos: number;
}

function findCallContext(line: string, cursorPos: number): CallContext | null {
    // Find the nearest opening parenthesis before the cursor
    let parenDepth = 0;
    let lastOpenParen = -1;
    
    for (let i = cursorPos - 1; i >= 0; i--) {
        const char = line[i];
        if (char === ')') {
            parenDepth++;
        } else if (char === '(') {
            if (parenDepth === 0) {
                lastOpenParen = i;
                break;
            } else {
                parenDepth--;
            }
        }
    }
    
    if (lastOpenParen === -1) return null;
    
    // Extract function name before the opening parenthesis
    const beforeParen = line.substring(0, lastOpenParen);
    const functionMatch = beforeParen.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
    if (!functionMatch) return null;
    
    const functionName = functionMatch[1];
    
    // Count commas to determine active parameter (ignoring nested calls)
    const activeParameter = countActiveParameter(line, lastOpenParen, cursorPos);
    
    return {
        functionName,
        activeParameter,
        startPos: lastOpenParen
    };
}

function countActiveParameter(line: string, startPos: number, cursorPos: number): number {
    let paramIndex = 0;
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = startPos + 1; i < cursorPos; i++) {
        const char = line[i];
        const prevChar = i > 0 ? line[i - 1] : '';
        
        // Handle strings
        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        if (inString) continue;
        
        // Track parenthesis depth
        if (char === '(') {
            depth++;
        } else if (char === ')') {
            depth--;
        } else if (char === ',' && depth === 0) {
            paramIndex++;
        }
    }
    
    return paramIndex;
}

function createCallbackSignatureHelp(callbackKey: string, activeParameter: number): SignatureHelp {
    const pseudoParams = CALLBACK_PSEUDO_PARAMETERS[callbackKey];
    const paramNames = Object.keys(pseudoParams);
    const paramDescriptions = Object.entries(pseudoParams).map(([name, type]) => 
        `**${name}** (\`${type}\`)`
    );
    
    const callbackName = callbackKey.replace('()', '');
    const signature = `${callbackName}()`;
    
    // Build parameter documentation
    const paramDocs = Object.entries(pseudoParams).map(([name, type]) => 
        `- \`${name}\`: ${type}`
    ).join('\n');
    
    const documentation = `Callback with implicit parameters:\n\n${paramDocs}\n\nThese parameters are available within the callback block without declaration.`;
    
    return {
        signatures: [
            {
                label: signature,
                documentation: {
                    kind: MarkupKind.Markdown,
                    value: documentation
                },
                parameters: paramNames.map((name, index) => ({
                    label: name,
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: paramDescriptions[index]
                    }
                }))
            }
        ],
        activeSignature: 0,
        activeParameter: Math.min(activeParameter, paramNames.length - 1)
    };
}

function createMethodSignatureHelp(
    methodName: string,
    methodInfo: MethodInfo,
    activeParameter: number,
    className: string
): SignatureHelp {
    const signature = methodInfo.signature || '';
    const cleanedSignature = cleanSignature(signature);
    
    const params = extractParameterTypes(cleanedSignature);
    const paramInfos: ParameterInformation[] = params.map(param => {
        const optionalMarker = param.isOptional ? ' (optional)' : '';
        const defaultValue = param.defaultValue ? ` = ${param.defaultValue}` : '';
        const paramLabel = param.name ? `${param.type} ${param.name}${defaultValue}` : param.type;
        
        return {
            label: paramLabel,
            documentation: {
                kind: MarkupKind.Markdown,
                value: `Type: \`${param.type}\`${optionalMarker}`
            }
        };
    });
    
    const documentation = `**${className}.${methodName}**\n\n${cleanDocumentationText(methodInfo.description)}`;
    
    return {
        signatures: [
            {
                label: cleanedSignature,
                documentation: {
                    kind: MarkupKind.Markdown,
                    value: documentation
                },
                parameters: paramInfos
            }
        ],
        activeSignature: 0,
        activeParameter: Math.min(activeParameter, params.length - 1)
    };
}

function createFunctionSignatureHelp(
    functionName: string,
    functionInfo: FunctionData,
    activeParameter: number,
    _trackingState: any
): SignatureHelp {
    const signatures: SignatureInformation[] = [];
    
    // Get all available signatures (handle multiple overloads)
    const allSignatures = functionInfo.signatures && functionInfo.signatures.length > 0
        ? functionInfo.signatures
        : functionInfo.signature ? [functionInfo.signature] : [];
    
    if (allSignatures.length === 0) return { signatures: [], activeSignature: 0, activeParameter: 0 };
    
    // Create signature information for each overload
    for (const sig of allSignatures) {
        const cleanedSig = cleanSignature(sig);
        const params = extractParameterTypes(cleanedSig);
        
        const paramInfos: ParameterInformation[] = params.map(param => {
            const optionalMarker = param.isOptional ? ' (optional)' : '';
            const defaultValue = param.defaultValue ? ` = ${param.defaultValue}` : '';
            const paramLabel = param.name ? `${param.type} ${param.name}${defaultValue}` : param.type;
            
            return {
                label: paramLabel,
                documentation: {
                    kind: MarkupKind.Markdown,
                    value: `Type: \`${param.type}\`${optionalMarker}${defaultValue ? `\n\nDefault: \`${param.defaultValue}\`` : ''}`
                }
            };
        });
        
        // Add context warnings
        let contextWarning = '';
        if (INITIALIZE_ONLY_FUNCTIONS.includes(functionName)) {
            contextWarning = '\n\n⚠️ **This function can only be called in initialize() callbacks**';
        }
        
        const documentation = `${cleanDocumentationText(functionInfo.description)}${contextWarning}`;
        
        signatures.push({
            label: cleanedSig,
            documentation: {
                kind: MarkupKind.Markdown,
                value: documentation
            },
            parameters: paramInfos
        });
    }
    
    // Determine which signature is most appropriate based on parameter count
    const activeSignature = findBestSignature(signatures, activeParameter);
    
    return {
        signatures,
        activeSignature,
        activeParameter: Math.min(activeParameter, signatures[activeSignature]?.parameters?.length || 0)
    };
}

function findBestSignature(signatures: SignatureInformation[], activeParameter: number): number {
    if (signatures.length <= 1) return 0;
    
    // Find the signature that best matches the parameter count
    for (let i = 0; i < signatures.length; i++) {
        const paramCount = signatures[i].parameters?.length || 0;
        if (activeParameter < paramCount) {
            return i;
        }
    }
    
    // Default to the last signature (usually has the most parameters)
    return signatures.length - 1;
}
