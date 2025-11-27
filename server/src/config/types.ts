import { Connection, TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { DocumentationService } from "../services/documentation-service";
import { ValidationService } from "../services/validation-service";
import { CompletionService } from "../services/completion-service";

// ============================================================================
// Language mode
// ============================================================================

export type LanguageMode = 'eidos' | 'slim';

// ============================================================================
// Documentation types
// ============================================================================

export interface FunctionData {
    signatures: string[];
    description: string;
    source?: 'SLiM' | 'Eidos';
    returnType?: string;
    signature?: string; // Primary signature (first from signatures array)
}

export interface MethodInfo {
    signature: string;
    description: string;
}

export interface PropertyInfo {
    type: string;
    description: string;
}

export interface ConstructorInfo {
    signature: string;
    description: string;
}

export interface ClassInfo {
    constructor?: {
        signature?: string;
        description?: string;
    };
    methods?: { [key: string]: MethodInfo };
    properties?: { [key: string]: PropertyInfo };
    source?: 'SLiM' | 'Eidos';
}

export interface CallbackInfo {
    signature: string;
    description: string;
    source?: 'SLiM' | 'Eidos';
}

export interface TypeInfo {
    description: string;
}

export interface OperatorInfo {
    signature: string;
    description: string;
}

export interface TickCycleInfo {
    wf: string;
    nonwf: string;
}

// ============================================================================
// Word and context analysis
// ============================================================================

export interface WordContext {
    isMethodOrProperty: boolean;
    className?: string;
    instanceName?: string;
    instanceClass?: string;
}

export interface WordInfo {
    word: string;
    context: WordContext;
}

// ============================================================================
// Parsing types
// ============================================================================

export interface ParseState {
    inString: boolean;
    stringChar: string | null;
    inSingleLineComment: boolean;
    inMultiLineComment: boolean;
}

export interface ParseOptions {
    trackStrings?: boolean;
    trackComments?: boolean;
    trackMultiLineComments?: boolean;
}

export interface ParameterInfo {
    name: string | null;
    type: string;
    isOptional: boolean;
    defaultValue?: string;
}

export interface PositionOptions {
    resolveClassName?: (
        instanceName: string,
        instanceDefinitions: Record<string, string>
    ) => string | null;
    instanceDefinitions?: Record<string, string>;
    classesData?: Record<string, unknown>;
    inferTypeFromExpression?: (expr: string) => string | null;
}

// ============================================================================
// State tracking
// ============================================================================

export interface TrackingState {
    instanceDefinitions: Record<string, string>;
    definedConstants: Set<string>;
    definedMutationTypes: Set<string>;
    definedGenomicElementTypes: Set<string>;
    definedInteractionTypes: Set<string>;
    definedSubpopulations: Set<string>;
    definedScriptBlocks: Set<string>;
    definedSpecies: Set<string>;
    modelType: 'WF' | 'nonWF' | null;
    callbackContextByLine: Map<number, string | null>;
}

export interface CallbackState {
    currentCallback: string | null;
    braceDepth: number;
    callbackStartLine: number;
}

// ============================================================================
// Language server
// ============================================================================

export interface LanguageServerContext {
    connection: Connection;
    documents: TextDocuments<TextDocument>;
    documentationService: DocumentationService;
    validationService: ValidationService;
    completionService: CompletionService;
}
