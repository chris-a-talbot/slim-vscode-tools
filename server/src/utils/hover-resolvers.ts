import { Hover } from 'vscode-languageserver';
import { WordContext, HoverContext } from '../config/types';
import { CLASS_NAMES } from '../config/config';
import { resolveClassName } from './type-resolving';
import {
    createMethodMarkdown,
    createPropertyMarkdown,
    createFunctionMarkdown,
    createCallbackMarkdown,
    createTypeMarkdown,
    createInstanceMarkdown,
    createEidosEventMarkdown
} from './markdown';
import { ClassInfo, CallbackInfo } from '../config/types';
import { EIDOS_EVENT_NAMES } from '../config/config';

/**
 * Creates a hover response with markdown content
 */
function createHoverResponse(markdown: string): Hover {
    return { contents: { kind: 'markdown', value: markdown } };
}

/**
 * Resolves the class name for a method or property lookup
 */
function resolveClassForHover(
    className: string | undefined,
    instanceDefinitions: Record<string, string>,
    classesData: Record<string, ClassInfo>
): string | null {
    if (!className) return null;
    
    const resolved = resolveClassName(className, instanceDefinitions) || className;
    return classesData[resolved] ? resolved : (classesData[className] ? className : null);
}

/**
 * Gets hover information for a method or property on a class instance
 */
function getClassMemberHover(
    word: string,
    className: string | null,
    classesData: Record<string, ClassInfo>
): Hover | null {
    if (!className) return null;
    
    const classInfo = classesData[className];
    if (!classInfo) return null;
    
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
function getLogFileMemberHover(
    word: string,
    classesData: Record<string, ClassInfo>
): Hover | null {
    if (!classesData[CLASS_NAMES.DICTIONARY]) return null;
    
    const dictClass = classesData[CLASS_NAMES.DICTIONARY];
    if (dictClass.methods?.[word]) {
        return createHoverResponse(createMethodMarkdown(CLASS_NAMES.LOGFILE, word, dictClass.methods[word]));
    }
    
    if (dictClass.properties?.[word]) {
        return createHoverResponse(createPropertyMarkdown(CLASS_NAMES.LOGFILE, word, dictClass.properties[word]));
    }
    
    // Search all classes for LogFile-specific methods
    for (const [, classInfo] of Object.entries(classesData)) {
        if (classInfo.methods?.[word] && classInfo.methods[word].description?.includes(CLASS_NAMES.LOGFILE)) {
            return createHoverResponse(createMethodMarkdown(CLASS_NAMES.LOGFILE, word, classInfo.methods[word]));
        }
    }
    
    return null;
}

/**
 * Gets hover information for a method or property in any class (fallback)
 */
function getAnyClassMemberHover(
    word: string,
    classesData: Record<string, ClassInfo>
): Hover | null {
    for (const className of Object.keys(classesData)) {
        const hover = getClassMemberHover(word, className, classesData);
        if (hover) return hover;
    }
    return null;
}

/**
 * Gets hover information for a callback
 */
function getCallbackHover(
    word: string,
    callbacksData: Record<string, CallbackInfo>
): Hover | null {
    // Check if it's an Eidos event
    if (EIDOS_EVENT_NAMES.includes(word) && callbacksData['Eidos events']) {
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
 * Type for hover resolver functions
 */
type HoverResolver = (word: string, context: WordContext, hoverContext: HoverContext) => Hover | null;

/**
 * Hover resolver configuration
 */
interface HoverResolverConfig {
    /** Test function to determine if this resolver should be used */
    test: (context: WordContext, hoverContext: HoverContext) => boolean;
    /** Resolver function to get hover information */
    resolve: HoverResolver;
    /** Priority (lower numbers = higher priority) */
    priority: number;
}

/**
 * Gets hover information for a word using a strategy-based lookup table.
 * This replaces the long if-else chain with a declarative configuration.
 * 
 * @param word - The word to get hover info for
 * @param context - Context information from position analysis
 * @param hoverContext - Full hover context with all data
 * @returns Hover response or null if not found
 */
export function getHoverForWord(
    word: string,
    context: WordContext,
    hoverContext: HoverContext
): Hover | null {
    const { classesData, instanceDefinitions } = hoverContext;
    
    // Define resolvers in priority order (lower priority number = checked first)
    const resolvers: HoverResolverConfig[] = [
        // Priority 1: Instance hover (highest priority)
        {
            test: (ctx) => !!ctx.instanceClass,
            resolve: (w, ctx) => createHoverResponse(createInstanceMarkdown(w, ctx.instanceClass!)),
            priority: 1
        },
        
        // Priority 2: Method/property on known instance
        {
            test: (ctx) => !!ctx.isMethodOrProperty && !!ctx.className,
            resolve: (w, ctx, _hCtx) => {
                const className = resolveClassForHover(ctx.className, instanceDefinitions, classesData);
                if (className === CLASS_NAMES.LOGFILE) {
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
            if (result) return result;
        }
    }
    
    return null;
}

