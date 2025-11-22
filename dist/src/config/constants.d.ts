export declare const COMPLETION_KINDS: {
    readonly METHOD: 2;
    readonly FUNCTION: 3;
    readonly CLASS: 7;
    readonly PROPERTY: 10;
    readonly SYMBOL: 3;
};
export declare const SLIM_TYPES: readonly string[];
export declare const DIAGNOSTIC_SOURCE = "slim-tools";
export declare const CHAR_OFFSETS: {
    readonly AFTER_DOT: 1;
    readonly AFTER_OPEN_PAREN: 1;
    readonly AFTER_COMMA: 1;
    readonly QUOTE_LENGTH: 2;
    readonly SKIP_OPEN_QUOTE: 1;
    readonly SKIP_CLOSE_QUOTE: 1;
};
export declare const INDICES: {
    readonly FIRST: 0;
    readonly SECOND: 1;
    readonly THIRD: 2;
};
export declare const LOOKAHEAD_LIMITS: {
    readonly CONSTANT_VALUE: 3;
    readonly CONTEXT_WINDOW: 5;
};
export declare const DEFAULT_POSITIONS: {
    readonly START_OF_LINE: 0;
    readonly START_OF_FILE: 0;
    readonly INVALID: -1;
};
export declare const INITIAL_DEPTHS: {
    readonly PARENTHESIS: 0;
    readonly BRACE: 0;
    readonly ARGUMENT: 0;
    readonly FUNCTION_CALL: 1;
};
export declare const PARAMETER_INDEX_OFFSET = 1;
/**
 * SLiM/Eidos class names.
 */
export declare const CLASS_NAMES: {
    readonly SPECIES: "Species";
    readonly COMMUNITY: "Community";
    readonly INDIVIDUAL: "Individual";
    readonly HAPLOSOME: "Haplosome";
    readonly MUTATION: "Mutation";
    readonly CHROMOSOME: "Chromosome";
    readonly SUBPOPULATION: "Subpopulation";
    readonly MUTATION_TYPE: "MutationType";
    readonly GENOMIC_ELEMENT_TYPE: "GenomicElementType";
    readonly INTERACTION_TYPE: "InteractionType";
    readonly LOGFILE: "LogFile";
    readonly DICTIONARY: "Dictionary";
    readonly SLIMEIDOS_BLOCK: "SLiMEidosBlock";
};
/**
 * Type names for type inference and validation.
 */
export declare const TYPE_NAMES: {
    readonly INTEGER: "integer";
    readonly FLOAT: "float";
    readonly STRING: "string";
    readonly LOGICAL: "logical";
    readonly OBJECT: "object";
    readonly NUMERIC: "numeric";
    readonly NULL: "NULL";
    readonly INF: "INF";
    readonly VOID: "void";
};
/**
 * Control flow keywords.
 */
export declare const CONTROL_FLOW_KEYWORDS: readonly string[];
/**
 * SLiM callback names.
 */
export declare const CALLBACK_NAMES: readonly string[];
/**
 * Eidos event names.
 */
export declare const EIDOS_EVENT_NAMES: readonly string[];
/**
 * SLiM keywords that are reserved and cannot be used as identifiers.
 */
export declare const SLIM_KEYWORDS: readonly string[];
/**
 * Built-in SLiM/Eidos reserved identifiers.
 */
export declare const RESERVED_IDENTIFIERS: Set<string>;
/**
 * Common SLiM/Eidos function name prefixes.
 */
export declare const FUNCTION_PREFIXES: readonly string[];
/**
 * Type for class name values
 */
export type ClassName = typeof CLASS_NAMES[keyof typeof CLASS_NAMES];
/**
 * Type for type name values
 */
export type TypeName = typeof TYPE_NAMES[keyof typeof TYPE_NAMES];
/**
 * Error messages for validation diagnostics.
 */
export declare const ERROR_MESSAGES: {
    readonly UNEXPECTED_CLOSING_BRACE: "Unexpected closing brace";
    readonly UNCLOSED_BRACE: "Unclosed brace(s)";
    readonly MISSING_SEMICOLON: "Statement might be missing a semicolon";
    readonly UNCLOSED_STRING: "Unclosed string literal (missing closing quote)";
    readonly NO_EIDOS_EVENT: "No Eidos event found to start the simulation. At least one first(), early(), or late() event is required.";
    readonly OLD_SYNTAX: "Event type must be specified explicitly. Use \"1 early() { ... }\" instead of \"1 { ... }\"";
    readonly EVENT_PARAMETERS: (eventName: string) => string;
    readonly DUPLICATE_DEFINITION: (typeName: string, id: string, firstLine: number) => string;
    readonly RESERVED_IDENTIFIER: (id: string, context?: string) => string;
    readonly RESERVED_SPECIES_NAME: (name: string) => string;
    readonly METHOD_NOT_EXISTS: (methodName: string, className: string) => string;
    readonly PROPERTY_NOT_EXISTS: (propertyName: string, className: string) => string;
    readonly FUNCTION_NOT_FOUND: (funcName: string) => string;
    readonly NULL_TO_NON_NULLABLE: (paramName: string, typeName: string, context?: string) => string;
    readonly UNDEFINED_REFERENCE: (typeName: string, id: string) => string;
};
/**
 * Type names for error messages.
 */
export declare const TYPE_NAMES_FOR_ERRORS: {
    readonly MUTATION_TYPE: "Mutation type";
    readonly GENOMIC_ELEMENT_TYPE: "Genomic element type";
    readonly INTERACTION_TYPE: "Interaction type";
    readonly SUBPOPULATION: "Subpopulation";
    readonly SPECIES: "Species";
    readonly CONSTANT: "Constant";
    readonly SCRIPT_BLOCK: "Script block";
};
/**
 * Context strings for reserved identifier errors.
 */
export declare const RESERVED_IDENTIFIER_CONTEXTS: {
    readonly GLOBAL_CONSTANT: "a global constant";
    readonly SPECIES_NAME: "a species name";
};
/**
 * Tick cycle information for events and callbacks in WF and nonWF models.
 * This provides quick reference for when each event/callback executes.
 */
export interface TickCycleInfo {
    wf: string;
    nonwf: string;
}
/**
 * Pseudo-parameters available in each callback type.
 * These are special variables that SLiM provides within callback contexts.
 * Key format: callback name (e.g., "mutationEffect()", "reproduction()")
 * Value: object mapping parameter name to Eidos type
 */
export declare const CALLBACK_PSEUDO_PARAMETERS: Readonly<Record<string, Record<string, string>>>;
/**
 * Tick cycle information for events and callbacks in WF and nonWF models.
 * This provides quick reference for when each event/callback executes.
 */
export declare const TICK_CYCLE_INFO: Readonly<Record<string, TickCycleInfo>>;
//# sourceMappingURL=constants.d.ts.map