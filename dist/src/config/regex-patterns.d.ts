/**
 * Regex patterns for matching identifiers and code structures.
 */
export declare const IDENTIFIER_PATTERNS: {
    readonly WORD: RegExp;
    readonly METHOD_CALL: RegExp;
    readonly PROPERTY_ACCESS: RegExp;
    readonly FUNCTION_CALL: RegExp;
    readonly DOT_PATTERN: RegExp;
    readonly DOT_WITH_MEMBER: RegExp;
};
/**
 * Regex patterns for SLiM type identifiers.
 */
export declare const TYPE_PATTERNS: {
    readonly SUBPOPULATION: RegExp;
    readonly MUTATION_TYPE: RegExp;
    readonly GENOMIC_ELEMENT_TYPE: RegExp;
    readonly INTERACTION_TYPE: RegExp;
    readonly TYPE_ID_IN_CONTEXT: RegExp;
};
/**
 * Regex patterns for SLiM definitions.
 */
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
/**
 * Regex patterns for SLiM events and callbacks.
 */
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
/**
 * Regex patterns for callback registration.
 */
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
/**
 * Regex patterns for validation and references.
 */
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
/**
 * Regex patterns for control flow and language constructs.
 */
export declare const CONTROL_FLOW_PATTERNS: {
    readonly CONTROL_FLOW_KEYWORDS: RegExp;
    readonly CONTROL_FLOW_STATEMENT: RegExp;
    readonly CALLBACK_DEFINITION_STATEMENT: RegExp;
    readonly SLIM_EVENT_BLOCK: RegExp;
};
/**
 * Regex patterns for text processing and parsing.
 */
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
/**
 * Regex patterns for type inference.
 */
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
/**
 * Regex patterns for formatting.
 */
export declare const FORMATTING_PATTERNS: {
    readonly TWO_CHAR_OPS: readonly ["==", "!=", "<=", ">=", "&&", "||", "<-", "->"];
    readonly SINGLE_CHAR_OPS: readonly [":", "[", "]", "+", "-", "*", "/", "%", "^", "|", "&", "!", "<", ">", "=", "?", "(", ")", "."];
};
//# sourceMappingURL=regex-patterns.d.ts.map