"use strict";
// ============================================================================
// REGEX PATTERNS
// Centralized regex patterns used throughout the language server.
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMATTING_PATTERNS = exports.TYPE_INFERENCE_PATTERNS = exports.TEXT_PROCESSING_PATTERNS = exports.CONTROL_FLOW_PATTERNS = exports.VALIDATION_PATTERNS = exports.CALLBACK_REGISTRATION_PATTERNS = exports.EVENT_PATTERNS = exports.DEFINITION_PATTERNS = exports.TYPE_PATTERNS = exports.IDENTIFIER_PATTERNS = void 0;
/**
 * Regex patterns for matching identifiers and code structures.
 */
exports.IDENTIFIER_PATTERNS = {
    // Word boundary identifier (starts with letter/underscore, followed by alphanumeric/underscore)
    WORD: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
    // Method call: object.method(
    METHOD_CALL: /\b(\w+)\s*\.\s*(\w+)\s*\(/g,
    // Property access: object.property (not followed by ( or word char)
    PROPERTY_ACCESS: /\b(\w+)\s*\.\s*(\w+)\b(?![\(\w])/g,
    // Function call: functionName(
    FUNCTION_CALL: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    // Dot pattern: instance.
    DOT_PATTERN: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*$/,
    // Dot with method/property: instance.method or instance.property
    DOT_WITH_MEMBER: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)?/g
};
/**
 * Regex patterns for SLiM type identifiers.
 */
exports.TYPE_PATTERNS = {
    // Subpopulation: p1, p2, p10, etc.
    SUBPOPULATION: /^p\d+$/,
    // Mutation type: m1, m2, m10, etc.
    MUTATION_TYPE: /^m\d+$/,
    // Genomic element type: g1, g2, g10, etc.
    GENOMIC_ELEMENT_TYPE: /^g\d+$/,
    // Interaction type: i1, i2, i10, etc.
    INTERACTION_TYPE: /^i\d+$/,
    // Match any type ID in context (surrounded by non-word chars)
    TYPE_ID_IN_CONTEXT: /[^a-zA-Z0-9_](p\d+|m\d+|g\d+|i\d+)[^a-zA-Z0-9_]/
};
/**
 * Regex patterns for SLiM definitions.
 */
exports.DEFINITION_PATTERNS = {
    // defineConstant("NAME", value)
    DEFINE_CONSTANT: /defineConstant\s*\(\s*"(\w+)"\s*,/,
    // initializeMutationType("m1", ...) or initializeMutationType(m1, ...)
    MUTATION_TYPE: /initializeMutationType\s*\(\s*"?(m\d+)"?/,
    // initializeGenomicElementType("g1", ...)
    GENOMIC_ELEMENT_TYPE: /initializeGenomicElementType\s*\(\s*"?(g\d+)"?/,
    // initializeInteractionType("i1", ...)
    INTERACTION_TYPE: /initializeInteractionType\s*\(\s*"?(i\d+)"?/,
    // sim.addSubpop("p1", size)
    SUBPOP: /sim\.addSubpop\("(\w+)"/,
    // sim.addSubpopSplit("p1", ...)
    SUBPOP_SPLIT: /sim\.addSubpopSplit\("(\w+)"/,
    // species NAME initialize
    SPECIES: /species\s+(\w+)\s+initialize/,
    // Script block: early("block1") { ... }
    SCRIPT_BLOCK: /(?:first|early|late|initialize|fitnessEffect|interaction|mateChoice|modifyChild|mutation|mutationEffect|recombination|reproduction|survival)\s*\(\s*"(\w+)"\s*\)/,
    // Instance definition: varName = new ClassName
    INSTANCE: /(\w+)\s*=\s*new\s+(\w+)/,
    // Assignment: varName = expression
    ASSIGNMENT: /(\w+)\s*=\s*([^;]+)/,
    // Constant value extraction: defineConstant("NAME", value)
    CONSTANT_VALUE: /defineConstant\s*\(\s*"[^"]+"\s*,\s*(.+?)(?:\)|$)/
};
/**
 * Regex patterns for SLiM events and callbacks.
 */
exports.EVENT_PATTERNS = {
    // Standard event: "1 early()" or "100 late()"
    STANDARD_EVENT: /^\s*\d+\s+(first|early|late)\s*\(/m,
    // Species event: "s1 1 early()"
    SPECIES_EVENT: /^\s*s\d+\s+\d+\s+(first|early|late)\s*\(/m,
    // SLiM block: "1 early()" or "s1 1 late()"
    SLIM_BLOCK: /^\d+\s+\w+\(\)/,
    SLIM_BLOCK_SPECIES: /^s\d+\s+\d+\s+\w+\(\)/,
    // Initialize callback
    INITIALIZE: /initialize\s*\(/,
    // Event with parameters (should be empty)
    EVENT_WITH_PARAMS: /(first|early|late)\s*\(\s*[^)]+\s*\)\s*\{/,
    // Event match for error reporting
    EVENT_MATCH: /(first|early|late)\s*\(/,
    // Old syntax: "1 { ... }" without event type
    OLD_SYNTAX: /^\s*(\d+)\s*\{/,
    // Callback definition detection
    CALLBACK_DEFINITION: /(?:species\s+\w+\s+)?(?:s\d+\s+)?(?:\d+(?::\d+)?\s+)?(initialize|mutationEffect|fitnessEffect|mateChoice|modifyChild|recombination|interaction|reproduction|mutation|survival|early|late|first)\s*\([^)]*\)\s*\{/i
};
/**
 * Regex patterns for callback registration.
 */
exports.CALLBACK_REGISTRATION_PATTERNS = {
    EARLY_EVENT: /community\.registerEarlyEvent\("(\w+)",\s*[^)]*\)/,
    FIRST_EVENT: /community\.registerFirstEvent\("(\w+)",\s*[^)]*\)/,
    INTERACTION_CALLBACK: /community\.registerInteractionCallback\("(\w+)",\s*[^)]*\)/,
    LATE_EVENT: /community\.registerLateEvent\("(\w+)",\s*[^)]*\)/,
    FITNESS_EFFECT_CALLBACK: /species\.registerFitnessEffectCallback\("(\w+)",\s*[^)]*\)/,
    MATE_CHOICE_CALLBACK: /species\.registerMateChoiceCallback\("(\w+)",\s*[^)]*\)/,
    MODIFY_CHILD_CALLBACK: /species\.registerModifyChildCallback\("(\w+)",\s*[^)]*\)/,
    MUTATION_CALLBACK: /species\.registerMutationCallback\("(\w+)",\s*[^)]*\)/,
    MUTATION_EFFECT_CALLBACK: /species\.registerMutationEffectCallback\("(\w+)",\s*[^)]*\)/,
    RECOMBINATION_CALLBACK: /species\.registerRecombinationCallback\("(\w+)",\s*[^)]*\)/,
    REPRODUCTION_CALLBACK: /species\.registerReproductionCallback\("(\w+)",\s*[^)]*\)/,
    SURVIVAL_CALLBACK: /species\.registerSurvivalCallback\("(\w+)",\s*[^)]*\)/
};
/**
 * Regex patterns for validation and references.
 */
exports.VALIDATION_PATTERNS = {
    // Mutation type reference: m1, m2, etc.
    MUTATION_TYPE_REF: /\b(m\d+)\b/g,
    // Genomic element type reference: g1, g2, etc.
    GENOMIC_ELEMENT_TYPE_REF: /\b(g\d+)\b/g,
    // Subpopulation reference: p1, p2, etc.
    SUBPOPULATION_REF: /\b(p\d+)\b/g,
    // Dynamic mutation type creation (not with string literals)
    DYNAMIC_MUT_TYPE: /initializeMutationType(?:Nuc)?\s*\(\s*[^"']/,
    DYNAMIC_MUT_TYPE_CONCAT: /initializeMutationType(?:Nuc)?\s*\(\s*[^"']*\+/,
    // Dynamic genomic element type creation
    DYNAMIC_GEN_ELEM_TYPE: /initializeGenomicElementType\s*\(\s*[^"']/,
    DYNAMIC_GEN_ELEM_TYPE_CONCAT: /initializeGenomicElementType\s*\(\s*[^"']*\+/,
    // Dynamic subpopulation creation
    DYNAMIC_SUBPOP: /(sim\.)?(addSubpop|addSubpopSplit)\s*\(\s*[^"']/
};
/**
 * Regex patterns for control flow and language constructs.
 */
exports.CONTROL_FLOW_PATTERNS = {
    // Control flow keywords that look like function calls
    CONTROL_FLOW_KEYWORDS: /\b(if|else|while|for|function|return|break|continue|switch|case|default)\s*\(/,
    // Control flow statements (for semicolon checking)
    CONTROL_FLOW_STATEMENT: /^\s*(if|else|while|for|switch|case|default)\b.*\)?\s*{?\s*$/,
    // Callback definitions
    CALLBACK_DEFINITION_STATEMENT: /^(initialize|early|late|fitness)\s*\([^)]*\)\s*{?\s*$/,
    // SLiM event blocks
    SLIM_EVENT_BLOCK: /^\s*(s\d+\s+)?\d+\s+(early|late|reproduction|fitness)\s*\(\)\s*$/
};
/**
 * Regex patterns for text processing and parsing.
 */
exports.TEXT_PROCESSING_PATTERNS = {
    // Whitespace
    WHITESPACE: /\s/,
    // Digits
    DIGIT: /\d/,
    // Number pattern (including decimals and scientific notation)
    NUMBER: /[\d.eE+-]/,
    // Identifier start (letter or underscore)
    IDENTIFIER_START: /[a-zA-Z_$]/,
    // Identifier character (alphanumeric, underscore, dollar)
    IDENTIFIER_CHAR: /[a-zA-Z0-9_$]/,
    // Operators and punctuation
    OPERATOR_PUNCTUATION: /[+\-*/%=<>?:!.,;()[\]{}]/,
    // Keywords (for tokenization)
    KEYWORD: /^(if|else|for|while|do|return|break|continue|function|in|next)$/,
    // Word character (for partial identifier detection)
    WORD_CHAR: /^\w/,
    // Valid terminator characters (whitespace, punctuation, operators, brackets)
    VALID_TERMINATOR: /^[\s\.,;:\)\]\}\+\-\*\/\%\<\>\=\!\&\|\?]/,
    // Opening parenthesis after whitespace
    OPEN_PAREN_AFTER_WS: /^\s*\(/,
    // NULL/null keyword
    NULL_KEYWORD: /\b(NULL|null)\b/,
    // Return type extraction from signature: (returnType) functionName(...)
    RETURN_TYPE: /^\(([^)]+)\)/,
    // Parameter list extraction: functionName(param1, param2)
    // Uses non-greedy match followed by $ to get the LAST set of parentheses (not the return type)
    PARAMETER_LIST: /\(([^)]*(?:\([^)]*\))?[^)]*)\)$/,
    // Optional parameter: [type name = default]
    OPTIONAL_PARAMETER: /^\[([^\]]+)\]/,
    // Type and name from parameter: type name or type$ name or type<Generic> name
    TYPE_NAME_PARAM: /^([\w<>]+(?:\$)?)\s+(\w+)(?:\s*=\s*(.+))?$/,
    // Type only: type or type$ or type<Generic>
    TYPE_ONLY: /^([\w<>]+(?:\$)?)/,
    // Nullable type check: starts with N
    NULLABLE_TYPE: /^N[^<]*/,
    NULLABLE_OBJECT_TYPE: /^No</,
    // Dollar suffix (singleton type indicator)
    // In SLiM/Eidos: $ = singleton (single value), no $ = vector (multiple values)
    DOLLAR_SUFFIX: /\$$/,
    // Comment line
    COMMENT_LINE: /^\s*\/[\/\*]/,
    // Multi-line comment continuation
    COMMENT_CONTINUATION: /^\s*\*/,
    // Empty line
    EMPTY_LINE: /^\s*$/,
    // Single-line comment
    SINGLE_LINE_COMMENT: /\/\/.*$/,
    // Multi-line comment on same line
    MULTILINE_COMMENT: /\/\*.*?\*\//g
};
/**
 * Regex patterns for type inference.
 */
exports.TYPE_INFERENCE_PATTERNS = {
    // Numeric functions
    NUMERIC_FUNCTIONS: /^(sum|mean|min|max|abs|sqrt|log|exp|sin|cos|tan|round|floor|ceil|length|size|sd|var)\s*\(/,
    // Arithmetic operators
    ARITHMETIC_OPERATORS: /[+\-*\/%]/,
    // Logical operators
    LOGICAL_OPERATORS: /^(==|!=|<|>|<=|>=|&&|\|\||!)/,
    // Logical functions
    LOGICAL_FUNCTIONS: /^(all|any|isNULL|isNAN|isFinite|isInfinite)\s*\(/,
    // Subpopulation patterns
    SUBPOPULATION_METHODS: /\.(addSubpop|addSubpopSplit|subpopulations|subpopulationsWithIDs|subpopulationsWithNames|subpopulationByID)\(/,
    // Individual patterns
    INDIVIDUAL_METHODS: /\.(individuals|sampleIndividuals|individualsWithPedigreeIDs)(\[|$|\()/,
    // Haplosome/Genome patterns
    HAPLOSOME_METHODS: /\.(genomes|haplosomesForChromosomes|genome1|genome2)(\[|$|\()/,
    // Mutation patterns
    MUTATION_METHODS: /\.(mutations|mutationsOfType|mutationsFromHaplosomes|uniqueMutationsOfType)(\[|$|\()/,
    // MutationType patterns
    MUTATION_TYPE_METHODS: /(initializeMutationType|initializeMutationTypeNuc|\.mutationTypesWithIDs)\(/,
    // GenomicElementType patterns
    GENOMIC_ELEMENT_TYPE_METHODS: /(initializeGenomicElementType|\.genomicElementTypesWithIDs)\(/,
    // InteractionType patterns
    INTERACTION_TYPE_METHODS: /(initializeInteractionType|\.interactionTypesWithIDs)\(/,
    // Chromosome patterns
    CHROMOSOME_METHODS: /(initializeChromosome|\.chromosomesWithIDs|\.chromosomesOfType)\(/,
    // LogFile patterns
    LOGFILE_METHODS: /\.createLogFile\(/
};
/**
 * Regex patterns for formatting.
 */
exports.FORMATTING_PATTERNS = {
    // Two-character operators
    TWO_CHAR_OPS: ['==', '!=', '<=', '>=', '&&', '||', '<-', '->'],
    // Single-character operators
    SINGLE_CHAR_OPS: [':', '[', ']', '+', '-', '*', '/', '%', '^', '|', '&', '!', '<', '>', '=', '?', '(', ')', '.']
};
//# sourceMappingURL=regex-patterns.js.map