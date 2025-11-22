// ============================================================================
// SHARED TYPE DEFINITIONS
// This file contains type definitions used across the TypeScript codebase.
// ============================================================================

import { Connection, TextDocument, TextDocuments } from 'vscode-languageserver';
import { CompletionService } from '../services/completion-service';
import { ValidationService } from '../services/validation-service';
import { DocumentationService } from '../services/documentation-service';

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Function documentation data structure
 */
export interface FunctionData {
    signatures: string[];
    description: string;
    source?: 'SLiM' | 'Eidos';
    returnType?: string;
    signature?: string; // Primary signature (first from signatures array)
}

/**
 * Method information
 */
export interface MethodInfo {
    signature: string;
    description: string;
}

/**
 * Property information
 */
export interface PropertyInfo {
    type: string;
    description: string;
}

/**
 * Class documentation structure
 */
export interface ClassInfo {
    constructor?: {
        signature?: string;
        description?: string;
    };
    methods: Record<string, MethodInfo>;
    properties: Record<string, PropertyInfo>;
}

/**
 * Callback information
 */
export interface CallbackInfo {
    signature: string;
    description: string;
    // Add other callback properties as needed
}

/**
 * Type information
 */
export interface TypeInfo {
    description: string;
    // Add other type properties as needed
}

/**
 * Operator information
 */
export interface OperatorInfo {
    signature: string;
    description: string;
    symbol?: string;
    // Add other operator properties as needed
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Context passed to validation functions
 */
export interface ValidationContext {
    trackInstanceDefinitions: (document: import('vscode-languageserver-textdocument').TextDocument, state?: TrackingState) => TrackingState;
    functionsData: Record<string, FunctionData>;
    classesData: Record<string, ClassInfo>;
    callbacksData: Record<string, CallbackInfo>;
}

/**
 * State for tracking instance definitions and constants
 */
export interface TrackingState {
    instanceDefinitions: Record<string, string>;
    definedConstants: Set<string>;
    definedMutationTypes: Set<string>;
    definedGenomicElementTypes: Set<string>;
    definedInteractionTypes: Set<string>;
    definedSubpopulations: Set<string>;
    definedScriptBlocks: Set<string>;
    definedSpecies: Set<string>;
}

/**
 * State for tracking callback context
 */
export interface CallbackState {
    currentCallback: string | null;
    braceDepth: number;
    callbackStartLine: number;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

/**
 * Context for completion provider
 */
export interface CompletionContext {
    position: import('vscode-languageserver').Position;
    document: import('vscode-languageserver-textdocument').TextDocument;
    instanceDefinitions: Record<string, string>;
}

/**
 * Context for hover provider
 */
export interface HoverContext {
    functionsData: Record<string, FunctionData>;
    classesData: Record<string, ClassInfo>;
    callbacksData: Record<string, CallbackInfo>;
    typesData: Record<string, TypeInfo>;
    operatorsData: Record<string, OperatorInfo>;
    instanceDefinitions: Record<string, string>;
}

/**
 * Word context information
 */
export interface WordContext {
    isMethodOrProperty: boolean;
    className?: string;
    instanceName?: string;
    instanceClass?: string;
}

// ============================================================================
// UTILS TYPES
// Type definitions for utility modules.
// ============================================================================

/**
 * Parse state for tracking strings and comments
 */
export interface ParseState {
    inString: boolean;
    stringChar: string | null;
    inSingleLineComment: boolean;
    inMultiLineComment: boolean;
}

/**
 * Options for parsing code
 */
export interface ParseOptions {
    trackStrings?: boolean;
    trackComments?: boolean;
    trackMultiLineComments?: boolean;
}

/**
 * Brace/parenthesis counts
 */
export interface BraceCounts {
    openCount: number;
    closeCount: number;
}

/**
 * Parameter information extracted from signatures
 */
export interface ParameterInfo {
    name: string | null;
    type: string;
    isOptional: boolean;
    defaultValue?: string;
}

/**
 * Constructor information
 */
export interface ConstructorInfo {
    signature: string;
    description: string;
}

// ============================================================================
// VALIDATION TYPES
// Type definitions for validation modules.
// ============================================================================

/**
 * Result of semicolon checking
 */
export interface SemicolonResult {
    shouldMark: boolean;
    parenBalance: number;
}

/**
 * Mutable number wrapper for brace counting
 */
export interface MutableNumber {
    value: number;
}

/**
 * Argument information for function calls
 */
export interface ArgumentInfo {
    value: string;
    start: number;
    end: number;
}

// ============================================================================
// TRACKING TYPES
// Type definitions for tracking modules.
// ============================================================================

/**
 * Type pattern for matching expressions
 */
export interface TypePattern {
    pattern: RegExp;
    type: string;
}

/**
 * Definition patterns for tracking
 */
export interface DefinitionPatterns {
    instance: RegExp;
    assignment: RegExp;
    subpop: RegExp;
    subpopSplit: RegExp;
    constant: RegExp;
    mutationType: RegExp;
    genomicElementType: RegExp;
    interactionType: RegExp;
    species: RegExp;
    earlyEvent: RegExp;
    firstEvent: RegExp;
    interactionCallback: RegExp;
    lateEvent: RegExp;
    fitnessEffectCallback: RegExp;
    mateChoiceCallback: RegExp;
    modifyChildCallback: RegExp;
    mutationCallback: RegExp;
    mutationEffectCallback: RegExp;
    recombinationCallback: RegExp;
    reproductionCallback: RegExp;
    survivalCallback: RegExp;
}

// ============================================================================
// PROVIDER TYPES
// Type definitions for provider modules.
// ============================================================================

/**
 * Token information for formatting
 */
export interface Token {
    type: 'comment' | 'string' | 'number' | 'operator' | 'keyword' | 'identifier';
    value: string;
    start: number;
}

/**
 * Formatting options
 */
export interface FormattingOptions {
    tabSize?: number;
    insertSpaces?: boolean;
}

/**
 * Centralized context for language server operations.
 */
export interface LanguageServerContext {
    connection: Connection;
    documents: TextDocuments<TextDocument>;
    documentationService: DocumentationService;
    validationService: ValidationService;
    completionService: CompletionService;
}