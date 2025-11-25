// Type definitions for the SLiM Language Server

import { Connection, TextDocument, TextDocuments } from "vscode-languageserver";
import { DocumentationService } from "../services/documentation-service";
import { ValidationService } from "../services/validation-service";

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

export interface ClassInfo {
    constructor?: {
        signature?: string;
        description?: string;
    };
    methods?: { [key: string]: MethodInfo };
    properties?: { [key: string]: PropertyInfo };
}

export interface CallbackInfo {
    signature: string;
    description: string;
}

export interface TypeInfo {
    description: string;
}

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

export interface ConstructorInfo {
    signature: string;
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

// Parse state for tracking strings and comments
export interface ParseState {
    inString: boolean;
    stringChar: string | null;
    inSingleLineComment: boolean;
    inMultiLineComment: boolean;
}

// Options for parsing code
export interface ParseOptions {
    trackStrings?: boolean;
    trackComments?: boolean;
    trackMultiLineComments?: boolean;
}

// Parameter information extracted from signatures
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

// Tracking state for instance definitions and constants
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

// Callback context state
export interface CallbackState {
    currentCallback: string | null;
    braceDepth: number;
    callbackStartLine: number;
}

// Language server context
export interface LanguageServerContext {
    connection: Connection;
    documents: TextDocuments<TextDocument>;
    documentationService: DocumentationService;
    validationService: ValidationService;
}