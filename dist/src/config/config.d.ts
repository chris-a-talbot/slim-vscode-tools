export declare const COMPLETION_KINDS: {
    readonly METHOD: 2;
    readonly FUNCTION: 3;
    readonly CLASS: 7;
    readonly PROPERTY: 10;
    readonly SYMBOL: 3;
};
export declare const DIAGNOSTIC_SOURCE = "slim-tools";
export declare const SLIM_TYPES: readonly string[];
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
export type ClassName = typeof CLASS_NAMES[keyof typeof CLASS_NAMES];
export type TypeName = typeof TYPE_NAMES[keyof typeof TYPE_NAMES];
export declare const CONTROL_FLOW_KEYWORDS: readonly string[];
export declare const CALLBACK_NAMES: readonly string[];
export declare const EIDOS_EVENT_NAMES: readonly string[];
export declare const SLIM_KEYWORDS: readonly string[];
export declare const RESERVED_IDENTIFIERS: Set<string>;
export declare const FUNCTION_PREFIXES: readonly string[];
export declare const IDENTIFIER_PATTERNS: {
    readonly WORD: RegExp;
    readonly METHOD_CALL: RegExp;
    readonly PROPERTY_ACCESS: RegExp;
    readonly FUNCTION_CALL: RegExp;
    readonly DOT_PATTERN: RegExp;
    readonly DOT_WITH_MEMBER: RegExp;
};
export declare const TYPE_PATTERNS: {
    readonly SUBPOPULATION: RegExp;
    readonly MUTATION_TYPE: RegExp;
    readonly GENOMIC_ELEMENT_TYPE: RegExp;
    readonly INTERACTION_TYPE: RegExp;
    readonly TYPE_ID_IN_CONTEXT: RegExp;
};
export declare const DEFINITION_PATTERNS: {
    readonly DEFINE_CONSTANT: RegExp;
    readonly MUTATION_TYPE: RegExp;
    readonly GENOMIC_ELEMENT_TYPE: RegExp;
    readonly INTERACTION_TYPE: RegExp;
    readonly SUBPOP: RegExp;
    readonly SUBPOP_SPLIT: RegExp;
    readonly SPECIES: RegExp;
    readonly SCRIPT_BLOCK: RegExp;
    readonly INSTANCE: RegExp;
    readonly ASSIGNMENT: RegExp;
    readonly CONSTANT_VALUE: RegExp;
};
export declare const EVENT_PATTERNS: {
    readonly STANDARD_EVENT: RegExp;
    readonly SPECIES_EVENT: RegExp;
    readonly SLIM_BLOCK: RegExp;
    readonly SLIM_BLOCK_SPECIES: RegExp;
    readonly INITIALIZE: RegExp;
    readonly EVENT_WITH_PARAMS: RegExp;
    readonly EVENT_MATCH: RegExp;
    readonly OLD_SYNTAX: RegExp;
    readonly CALLBACK_DEFINITION: RegExp;
};
export declare const CALLBACK_REGISTRATION_PATTERNS: {
    readonly EARLY_EVENT: RegExp;
    readonly FIRST_EVENT: RegExp;
    readonly INTERACTION_CALLBACK: RegExp;
    readonly LATE_EVENT: RegExp;
    readonly FITNESS_EFFECT_CALLBACK: RegExp;
    readonly MATE_CHOICE_CALLBACK: RegExp;
    readonly MODIFY_CHILD_CALLBACK: RegExp;
    readonly MUTATION_CALLBACK: RegExp;
    readonly MUTATION_EFFECT_CALLBACK: RegExp;
    readonly RECOMBINATION_CALLBACK: RegExp;
    readonly REPRODUCTION_CALLBACK: RegExp;
    readonly SURVIVAL_CALLBACK: RegExp;
};
export declare const VALIDATION_PATTERNS: {
    readonly MUTATION_TYPE_REF: RegExp;
    readonly GENOMIC_ELEMENT_TYPE_REF: RegExp;
    readonly SUBPOPULATION_REF: RegExp;
    readonly DYNAMIC_MUT_TYPE: RegExp;
    readonly DYNAMIC_MUT_TYPE_CONCAT: RegExp;
    readonly DYNAMIC_GEN_ELEM_TYPE: RegExp;
    readonly DYNAMIC_GEN_ELEM_TYPE_CONCAT: RegExp;
    readonly DYNAMIC_SUBPOP: RegExp;
};
export declare const CONTROL_FLOW_PATTERNS: {
    readonly CONTROL_FLOW_KEYWORDS: RegExp;
    readonly CONTROL_FLOW_STATEMENT: RegExp;
    readonly CALLBACK_DEFINITION_STATEMENT: RegExp;
    readonly SLIM_EVENT_BLOCK: RegExp;
};
export declare const TEXT_PROCESSING_PATTERNS: {
    readonly WHITESPACE: RegExp;
    readonly DIGIT: RegExp;
    readonly NUMBER: RegExp;
    readonly IDENTIFIER_START: RegExp;
    readonly IDENTIFIER_CHAR: RegExp;
    readonly OPERATOR_PUNCTUATION: RegExp;
    readonly KEYWORD: RegExp;
    readonly WORD_CHAR: RegExp;
    readonly VALID_TERMINATOR: RegExp;
    readonly OPEN_PAREN_AFTER_WS: RegExp;
    readonly NULL_KEYWORD: RegExp;
    readonly RETURN_TYPE: RegExp;
    readonly PARAMETER_LIST: RegExp;
    readonly OPTIONAL_PARAMETER: RegExp;
    readonly TYPE_NAME_PARAM: RegExp;
    readonly TYPE_ONLY: RegExp;
    readonly NULLABLE_TYPE: RegExp;
    readonly NULLABLE_OBJECT_TYPE: RegExp;
    readonly DOLLAR_SUFFIX: RegExp;
    readonly COMMENT_LINE: RegExp;
    readonly COMMENT_CONTINUATION: RegExp;
    readonly EMPTY_LINE: RegExp;
    readonly SINGLE_LINE_COMMENT: RegExp;
    readonly MULTILINE_COMMENT: RegExp;
};
export declare const TYPE_INFERENCE_PATTERNS: {
    readonly NUMERIC_FUNCTIONS: RegExp;
    readonly ARITHMETIC_OPERATORS: RegExp;
    readonly LOGICAL_OPERATORS: RegExp;
    readonly LOGICAL_FUNCTIONS: RegExp;
    readonly SUBPOPULATION_METHODS: RegExp;
    readonly INDIVIDUAL_METHODS: RegExp;
    readonly HAPLOSOME_METHODS: RegExp;
    readonly MUTATION_METHODS: RegExp;
    readonly MUTATION_TYPE_METHODS: RegExp;
    readonly GENOMIC_ELEMENT_TYPE_METHODS: RegExp;
    readonly INTERACTION_TYPE_METHODS: RegExp;
    readonly CHROMOSOME_METHODS: RegExp;
    readonly LOGFILE_METHODS: RegExp;
};
export declare const FORMATTING_PATTERNS: {
    readonly TWO_CHAR_OPS: readonly ["==", "!=", "<=", ">=", "&&", "||", "<-", "->"];
    readonly SINGLE_CHAR_OPS: readonly [":", "[", "]", "+", "-", "*", "/", "%", "^", "|", "&", "!", "<", ">", "=", "?", "(", ")", "."];
};
export declare const INDICES: {
    readonly FIRST: 0;
    readonly SECOND: 1;
    readonly THIRD: 2;
};
export declare const CHAR_OFFSETS: {
    readonly AFTER_DOT: 1;
    readonly AFTER_OPEN_PAREN: 1;
    readonly AFTER_COMMA: 1;
    readonly QUOTE_LENGTH: 2;
    readonly SKIP_OPEN_QUOTE: 1;
    readonly SKIP_CLOSE_QUOTE: 1;
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
export declare const LOOKAHEAD_LIMITS: {
    readonly CONSTANT_VALUE: 3;
    readonly CONTEXT_WINDOW: 5;
};
export declare const PARAMETER_INDEX_OFFSET = 1;
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
export declare const TYPE_NAMES_FOR_ERRORS: {
    readonly MUTATION_TYPE: "Mutation type";
    readonly GENOMIC_ELEMENT_TYPE: "Genomic element type";
    readonly INTERACTION_TYPE: "Interaction type";
    readonly SUBPOPULATION: "Subpopulation";
    readonly SPECIES: "Species";
    readonly CONSTANT: "Constant";
    readonly SCRIPT_BLOCK: "Script block";
};
export declare const RESERVED_IDENTIFIER_CONTEXTS: {
    readonly GLOBAL_CONSTANT: "a global constant";
    readonly SPECIES_NAME: "a species name";
};
export interface TickCycleInfo {
    wf: string;
    nonwf: string;
}
export declare const CALLBACK_PSEUDO_PARAMETERS: Readonly<Record<string, Record<string, string>>>;
export declare const INITIALIZE_ONLY_FUNCTIONS: readonly string[];
export declare const REPRODUCTION_ONLY_METHODS: readonly string[];
export declare const NONWF_ONLY_METHODS: readonly string[];
export declare const NONWF_ONLY_CALLBACKS: readonly string[];
export declare const WF_ONLY_CALLBACKS: readonly string[];
export declare const CALLBACKS_BLOCKING_EVALUATE: readonly string[];
export declare const METHODS_REQUIRING_EVALUATE: readonly string[];
export declare const CALLBACK_SPECIFIC_PSEUDO_PARAMS: Readonly<Record<string, readonly string[]>>;
export declare const TICK_CYCLE_INFO: Readonly<Record<string, TickCycleInfo>>;
//# sourceMappingURL=config.d.ts.map