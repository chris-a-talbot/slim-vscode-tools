"use strict";
// ============================================================================
// SLIM LANGUAGE SERVER CONFIGURATION
// Consolidated configuration merging constants and regex patterns
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TICK_CYCLE_INFO = exports.CALLBACK_SPECIFIC_PSEUDO_PARAMS = exports.METHODS_REQUIRING_EVALUATE = exports.CALLBACKS_BLOCKING_EVALUATE = exports.WF_ONLY_CALLBACKS = exports.NONWF_ONLY_CALLBACKS = exports.NONWF_ONLY_METHODS = exports.REPRODUCTION_ONLY_METHODS = exports.INITIALIZE_ONLY_FUNCTIONS = exports.CALLBACK_PSEUDO_PARAMETERS = exports.RESERVED_IDENTIFIER_CONTEXTS = exports.TYPE_NAMES_FOR_ERRORS = exports.ERROR_MESSAGES = exports.PARAMETER_INDEX_OFFSET = exports.LOOKAHEAD_LIMITS = exports.INITIAL_DEPTHS = exports.DEFAULT_POSITIONS = exports.CHAR_OFFSETS = exports.INDICES = exports.FORMATTING_PATTERNS = exports.TYPE_INFERENCE_PATTERNS = exports.TEXT_PROCESSING_PATTERNS = exports.CONTROL_FLOW_PATTERNS = exports.VALIDATION_PATTERNS = exports.CALLBACK_REGISTRATION_PATTERNS = exports.EVENT_PATTERNS = exports.DEFINITION_PATTERNS = exports.TYPE_PATTERNS = exports.IDENTIFIER_PATTERNS = exports.FUNCTION_PREFIXES = exports.RESERVED_IDENTIFIERS = exports.SLIM_KEYWORDS = exports.EIDOS_EVENT_NAMES = exports.CALLBACK_NAMES = exports.CONTROL_FLOW_KEYWORDS = exports.TYPE_NAMES = exports.CLASS_NAMES = exports.SLIM_TYPES = exports.DIAGNOSTIC_SOURCE = exports.COMPLETION_KINDS = void 0;
const node_1 = require("vscode-languageserver/node");
// ============================================================================
// COMPLETION & DIAGNOSTICS
// ============================================================================
exports.COMPLETION_KINDS = {
    METHOD: node_1.CompletionItemKind.Method,
    FUNCTION: node_1.CompletionItemKind.Function,
    CLASS: node_1.CompletionItemKind.Class,
    PROPERTY: node_1.CompletionItemKind.Property,
    SYMBOL: node_1.CompletionItemKind.Function
};
exports.DIAGNOSTIC_SOURCE = 'slim-tools';
// ============================================================================
// SLIM/EIDOS TYPE SYSTEM
// ============================================================================
exports.SLIM_TYPES = [
    'void', 'integer', 'float', 'string', 'logical',
    'object', 'numeric', 'NULL', 'INF'
];
exports.CLASS_NAMES = {
    SPECIES: 'Species',
    COMMUNITY: 'Community',
    INDIVIDUAL: 'Individual',
    HAPLOSOME: 'Haplosome',
    MUTATION: 'Mutation',
    CHROMOSOME: 'Chromosome',
    SUBPOPULATION: 'Subpopulation',
    MUTATION_TYPE: 'MutationType',
    GENOMIC_ELEMENT_TYPE: 'GenomicElementType',
    INTERACTION_TYPE: 'InteractionType',
    LOGFILE: 'LogFile',
    DICTIONARY: 'Dictionary',
    SLIMEIDOS_BLOCK: 'SLiMEidosBlock'
};
exports.TYPE_NAMES = {
    INTEGER: 'integer',
    FLOAT: 'float',
    STRING: 'string',
    LOGICAL: 'logical',
    OBJECT: 'object',
    NUMERIC: 'numeric',
    NULL: 'NULL',
    INF: 'INF',
    VOID: 'void'
};
// ============================================================================
// KEYWORDS & IDENTIFIERS
// ============================================================================
exports.CONTROL_FLOW_KEYWORDS = [
    'if', 'else', 'while', 'for', 'do', 'return', 'break', 'continue',
    'switch', 'case', 'default', 'function', 'in', 'next'
];
exports.CALLBACK_NAMES = [
    'initialize', 'mutationEffect', 'fitnessEffect', 'mateChoice',
    'modifyChild', 'recombination', 'interaction', 'reproduction',
    'mutation', 'survival', 'early', 'late', 'first'
];
exports.EIDOS_EVENT_NAMES = ['early', 'late', 'first'];
exports.SLIM_KEYWORDS = [
    'initialize', 'early', 'late', 'fitness', 'interaction',
    'mateChoice', 'modifyChild', 'mutation', 'recombination'
];
exports.RESERVED_IDENTIFIERS = new Set([
    'sim', 'community', 'species', 'function', 'void', 'integer', 'float',
    'string', 'logical', 'object', 'numeric', 'NULL', 'INF', 'T', 'F',
    'if', 'else', 'while', 'for', 'return', 'break', 'continue', 'switch',
    'case', 'default', 'initialize', 'early', 'late', 'fitness', 'interaction',
    'mateChoice', 'modifyChild', 'mutation', 'recombination', 'reproduction',
    'survival', 'first', 'this', 'self'
]);
exports.FUNCTION_PREFIXES = [
    'initialize', 'mm', 'nucleotide', 'codon', 'remove', 'define', 'sample',
    'point', 'deviate', 'parallel', 'read', 'write', 'output', 'treeSeq',
    'get', 'is', 'as', 'set', 'add', 'spatialMap', 'calc'
];
// ============================================================================
// REGEX PATTERNS
// ============================================================================
// Identifier patterns
exports.IDENTIFIER_PATTERNS = {
    WORD: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
    METHOD_CALL: /\b(\w+)\s*\.\s*(\w+)\s*\(/g,
    PROPERTY_ACCESS: /\b(\w+)\s*\.\s*(\w+)\b(?![\(\w])/g,
    FUNCTION_CALL: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    DOT_PATTERN: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*$/,
    DOT_WITH_MEMBER: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)?/g
};
// Type patterns
exports.TYPE_PATTERNS = {
    SUBPOPULATION: /^p\d+$/,
    MUTATION_TYPE: /^m\d+$/,
    GENOMIC_ELEMENT_TYPE: /^g\d+$/,
    INTERACTION_TYPE: /^i\d+$/,
    TYPE_ID_IN_CONTEXT: /[^a-zA-Z0-9_](p\d+|m\d+|g\d+|i\d+)[^a-zA-Z0-9_]/
};
// Definition patterns
exports.DEFINITION_PATTERNS = {
    DEFINE_CONSTANT: /defineConstant\s*\(\s*"(\w+)"\s*,/,
    MUTATION_TYPE: /initializeMutationType\s*\(\s*"?(m\d+)"?/,
    GENOMIC_ELEMENT_TYPE: /initializeGenomicElementType\s*\(\s*"?(g\d+)"?/,
    INTERACTION_TYPE: /initializeInteractionType\s*\(\s*"?(i\d+)"?/,
    SUBPOP: /sim\.addSubpop\("(\w+)"/,
    SUBPOP_SPLIT: /sim\.addSubpopSplit\("(\w+)"/,
    SPECIES: /species\s+(\w+)\s+initialize/,
    SCRIPT_BLOCK: /(?:first|early|late|initialize|fitnessEffect|interaction|mateChoice|modifyChild|mutation|mutationEffect|recombination|reproduction|survival)\s*\(\s*"(\w+)"\s*\)/,
    INSTANCE: /(\w+)\s*=\s*new\s+(\w+)/,
    ASSIGNMENT: /(\w+)\s*=\s*([^;]+)/,
    CONSTANT_VALUE: /defineConstant\s*\(\s*"[^"]+"\s*,\s*(.+?)(?:\)|$)/
};
// Event and callback patterns
exports.EVENT_PATTERNS = {
    STANDARD_EVENT: /^\s*\d+\s+(first|early|late)\s*\(/m,
    SPECIES_EVENT: /^\s*s\d+\s+\d+\s+(first|early|late)\s*\(/m,
    SLIM_BLOCK: /^\d+\s+\w+\(\)/,
    SLIM_BLOCK_SPECIES: /^s\d+\s+\d+\s+\w+\(\)/,
    INITIALIZE: /initialize\s*\(/,
    EVENT_WITH_PARAMS: /(first|early|late)\s*\(\s*[^)]+\s*\)\s*\{/,
    EVENT_MATCH: /(first|early|late)\s*\(/,
    OLD_SYNTAX: /^\s*(\d+)\s*\{/,
    CALLBACK_DEFINITION: /(?:species\s+\w+\s+)?(?:s\d+\s+)?(?:\d+(?::\d+)?\s+)?(initialize|mutationEffect|fitnessEffect|mateChoice|modifyChild|recombination|interaction|reproduction|mutation|survival|early|late|first)\s*\([^)]*\)\s*\{/i
};
// Callback registration patterns
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
// Validation patterns
exports.VALIDATION_PATTERNS = {
    MUTATION_TYPE_REF: /\b(m\d+)\b/g,
    GENOMIC_ELEMENT_TYPE_REF: /\b(g\d+)\b/g,
    SUBPOPULATION_REF: /\b(p\d+)\b/g,
    DYNAMIC_MUT_TYPE: /initializeMutationType(?:Nuc)?\s*\(\s*[^"']/,
    DYNAMIC_MUT_TYPE_CONCAT: /initializeMutationType(?:Nuc)?\s*\(\s*[^"']*\+/,
    DYNAMIC_GEN_ELEM_TYPE: /initializeGenomicElementType\s*\(\s*[^"']/,
    DYNAMIC_GEN_ELEM_TYPE_CONCAT: /initializeGenomicElementType\s*\(\s*[^"']*\+/,
    DYNAMIC_SUBPOP: /(sim\.)?(addSubpop|addSubpopSplit)\s*\(\s*[^"']/
};
// Control flow patterns
exports.CONTROL_FLOW_PATTERNS = {
    CONTROL_FLOW_KEYWORDS: /\b(if|else|while|for|function|return|break|continue|switch|case|default)\s*\(/,
    CONTROL_FLOW_STATEMENT: /^\s*(if|else|while|for|switch|case|default)\b.*\)?\s*{?\s*$/,
    CALLBACK_DEFINITION_STATEMENT: /^(initialize|early|late|fitness)\s*\([^)]*\)\s*{?\s*$/,
    SLIM_EVENT_BLOCK: /^\s*(s\d+\s+)?\d+\s+(early|late|reproduction|fitness)\s*\(\)\s*$/
};
// Text processing patterns
exports.TEXT_PROCESSING_PATTERNS = {
    WHITESPACE: /\s/,
    DIGIT: /\d/,
    NUMBER: /[\d.eE+-]/,
    IDENTIFIER_START: /[a-zA-Z_$]/,
    IDENTIFIER_CHAR: /[a-zA-Z0-9_$]/,
    OPERATOR_PUNCTUATION: /[+\-*/%=<>?:!.,;()[\]{}]/,
    KEYWORD: /^(if|else|for|while|do|return|break|continue|function|in|next)$/,
    WORD_CHAR: /^\w/,
    VALID_TERMINATOR: /^[\s\.,;:\)\]\}\+\-\*\/\%\<\>\=\!\&\|\?]/,
    OPEN_PAREN_AFTER_WS: /^\s*\(/,
    NULL_KEYWORD: /\b(NULL|null)\b/,
    RETURN_TYPE: /^\(([^)]+)\)/,
    PARAMETER_LIST: /\(([^)]*(?:\([^)]*\))?[^)]*)\)$/,
    OPTIONAL_PARAMETER: /^\[([^\]]+)\]/,
    TYPE_NAME_PARAM: /^([\w<>]+(?:\$)?)\s+(\w+)(?:\s*=\s*(.+))?$/,
    TYPE_ONLY: /^([\w<>]+(?:\$)?)/,
    NULLABLE_TYPE: /^N[^<]*/,
    NULLABLE_OBJECT_TYPE: /^No</,
    DOLLAR_SUFFIX: /\$$/,
    COMMENT_LINE: /^\s*\/[\/\*]/,
    COMMENT_CONTINUATION: /^\s*\*/,
    EMPTY_LINE: /^\s*$/,
    SINGLE_LINE_COMMENT: /\/\/.*$/,
    MULTILINE_COMMENT: /\/\*.*?\*\//g
};
// Type inference patterns (for expression type detection)
exports.TYPE_INFERENCE_PATTERNS = {
    NUMERIC_FUNCTIONS: /^(sum|mean|min|max|abs|sqrt|log|exp|sin|cos|tan|round|floor|ceil|length|size|sd|var)\s*\(/,
    ARITHMETIC_OPERATORS: /[+\-*\/%]/,
    LOGICAL_OPERATORS: /^(==|!=|<|>|<=|>=|&&|\|\||!)/,
    LOGICAL_FUNCTIONS: /^(all|any|isNULL|isNAN|isFinite|isInfinite)\s*\(/,
    SUBPOPULATION_METHODS: /\.(addSubpop|addSubpopSplit|subpopulations|subpopulationsWithIDs|subpopulationsWithNames|subpopulationByID)\(/,
    INDIVIDUAL_METHODS: /\.(individuals|sampleIndividuals|individualsWithPedigreeIDs)(\[|$|\()/,
    HAPLOSOME_METHODS: /\.(genomes|haplosomesForChromosomes|genome1|genome2)(\[|$|\()/,
    MUTATION_METHODS: /\.(mutations|mutationsOfType|mutationsFromHaplosomes|uniqueMutationsOfType)(\[|$|\()/,
    MUTATION_TYPE_METHODS: /(initializeMutationType|initializeMutationTypeNuc|\.mutationTypesWithIDs)\(/,
    GENOMIC_ELEMENT_TYPE_METHODS: /(initializeGenomicElementType|\.genomicElementTypesWithIDs)\(/,
    INTERACTION_TYPE_METHODS: /(initializeInteractionType|\.interactionTypesWithIDs)\(/,
    CHROMOSOME_METHODS: /(initializeChromosome|\.chromosomesWithIDs|\.chromosomesOfType)\(/,
    LOGFILE_METHODS: /\.createLogFile\(/
};
// Formatting patterns
exports.FORMATTING_PATTERNS = {
    TWO_CHAR_OPS: ['==', '!=', '<=', '>=', '&&', '||', '<-', '->'],
    SINGLE_CHAR_OPS: [':', '[', ']', '+', '-', '*', '/', '%', '^', '|', '&', '!', '<', '>', '=', '?', '(', ')', '.']
};
// ============================================================================
// UTILITY CONSTANTS (kept for compatibility, can be inlined in future)
// ============================================================================
exports.INDICES = {
    FIRST: 0,
    SECOND: 1,
    THIRD: 2
};
exports.CHAR_OFFSETS = {
    AFTER_DOT: 1,
    AFTER_OPEN_PAREN: 1,
    AFTER_COMMA: 1,
    QUOTE_LENGTH: 2,
    SKIP_OPEN_QUOTE: 1,
    SKIP_CLOSE_QUOTE: 1
};
exports.DEFAULT_POSITIONS = {
    START_OF_LINE: 0,
    START_OF_FILE: 0,
    INVALID: -1
};
exports.INITIAL_DEPTHS = {
    PARENTHESIS: 0,
    BRACE: 0,
    ARGUMENT: 0,
    FUNCTION_CALL: 1
};
exports.LOOKAHEAD_LIMITS = {
    CONSTANT_VALUE: 3,
    CONTEXT_WINDOW: 5
};
exports.PARAMETER_INDEX_OFFSET = 1;
// ============================================================================
// ERROR MESSAGES
// ============================================================================
exports.ERROR_MESSAGES = {
    // Brace errors
    UNEXPECTED_CLOSING_BRACE: 'Unexpected closing brace',
    UNCLOSED_BRACE: 'Unclosed brace(s)',
    // Semicolon warnings
    MISSING_SEMICOLON: 'Statement might be missing a semicolon',
    // String errors
    UNCLOSED_STRING: 'Unclosed string literal (missing closing quote)',
    // Event errors
    NO_EIDOS_EVENT: 'No Eidos event found to start the simulation. At least one first(), early(), or late() event is required.',
    OLD_SYNTAX: 'Event type must be specified explicitly. Use "1 early() { ... }" instead of "1 { ... }"',
    EVENT_PARAMETERS: (eventName) => `${eventName}() event needs 0 parameters`,
    // Definition errors
    DUPLICATE_DEFINITION: (typeName, id, firstLine) => `${typeName} ${id} already defined (first defined at line ${firstLine})`,
    RESERVED_IDENTIFIER: (id, context) => `Identifier '${id}' is reserved and cannot be used${context ? ` for ${context}` : ''}`,
    RESERVED_SPECIES_NAME: (name) => `Species name '${name}' is reserved and cannot be used`,
    // Method and property errors
    METHOD_NOT_EXISTS: (methodName, className) => `Method '${methodName}' does not exist on ${className}`,
    PROPERTY_NOT_EXISTS: (propertyName, className) => `Property '${propertyName}' does not exist on ${className}`,
    // Function call errors
    FUNCTION_NOT_FOUND: (funcName) => `Function '${funcName}' not found in SLiM/Eidos documentation`,
    // NULL assignment errors
    NULL_TO_NON_NULLABLE: (paramName, typeName, context) => {
        const contextStr = context ? ` in ${context}` : '';
        return `NULL cannot be passed to non-nullable parameter '${paramName}' of type '${typeName}'${contextStr}`;
    },
    // Reference warnings
    UNDEFINED_REFERENCE: (typeName, id) => `${typeName} ${id} may not be defined in the focal species`
};
exports.TYPE_NAMES_FOR_ERRORS = {
    MUTATION_TYPE: 'Mutation type',
    GENOMIC_ELEMENT_TYPE: 'Genomic element type',
    INTERACTION_TYPE: 'Interaction type',
    SUBPOPULATION: 'Subpopulation',
    SPECIES: 'Species',
    CONSTANT: 'Constant',
    SCRIPT_BLOCK: 'Script block'
};
exports.RESERVED_IDENTIFIER_CONTEXTS = {
    GLOBAL_CONSTANT: 'a global constant',
    SPECIES_NAME: 'a species name'
};
exports.CALLBACK_PSEUDO_PARAMETERS = {
    'initialize()': {},
    'mutationEffect()': {
        'mut': exports.CLASS_NAMES.MUTATION,
        'homozygous': exports.TYPE_NAMES.LOGICAL,
        'effect': exports.TYPE_NAMES.FLOAT
    },
    'fitnessEffect()': {
        'individual': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'mateChoice()': {
        'sourceSubpop': exports.CLASS_NAMES.SUBPOPULATION,
        'weights': exports.TYPE_NAMES.FLOAT,
        'individual': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'modifyChild()': {
        'child': exports.CLASS_NAMES.INDIVIDUAL,
        'isCloning': exports.TYPE_NAMES.LOGICAL,
        'isSelfing': exports.TYPE_NAMES.LOGICAL,
        'parent1': exports.CLASS_NAMES.INDIVIDUAL,
        'parent2': exports.CLASS_NAMES.INDIVIDUAL,
        'sourceSubpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'recombination()': {
        'haplosome1': exports.CLASS_NAMES.HAPLOSOME,
        'haplosome2': exports.CLASS_NAMES.HAPLOSOME,
        'breakpoints': exports.TYPE_NAMES.INTEGER,
        'individual': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'interaction()': {
        'distance': exports.TYPE_NAMES.FLOAT,
        'strength': exports.TYPE_NAMES.FLOAT,
        'receiver': exports.CLASS_NAMES.INDIVIDUAL,
        'exerter': exports.CLASS_NAMES.INDIVIDUAL
    },
    'reproduction()': {
        'individual': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'mutation()': {
        'mut': exports.CLASS_NAMES.MUTATION,
        'haplosome': exports.CLASS_NAMES.HAPLOSOME,
        'element': 'GenomicElement',
        'originalNuc': exports.TYPE_NAMES.INTEGER,
        'parent': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    },
    'survival()': {
        'surviving': exports.TYPE_NAMES.LOGICAL,
        'fitness': exports.TYPE_NAMES.FLOAT,
        'draw': exports.TYPE_NAMES.FLOAT,
        'individual': exports.CLASS_NAMES.INDIVIDUAL,
        'subpop': exports.CLASS_NAMES.SUBPOPULATION
    }
};
exports.INITIALIZE_ONLY_FUNCTIONS = [
    'initializeMutationType',
    'initializeMutationTypeNuc',
    'initializeAncestralNucleotides',
    'initializeChromosome',
    'initializeGeneConversion',
    'initializeGenomicElement',
    'initializeGenomicElementType',
    'initializeHotspotMap',
    'initializeInteractionType',
    'initializeMutationRate',
    'initializeRecombinationRate',
    'initializeSLiMModelType',
    'initializeSpecies',
    'initializeSLiMOptions'
];
exports.REPRODUCTION_ONLY_METHODS = [
    'addCloned',
    'addCrossed',
    'addSelfed',
    'addRecombinant',
    'addMultiRecombinant',
    'addEmpty'
];
exports.NONWF_ONLY_METHODS = [
    'addCloned',
    'addCrossed',
    'addSelfed',
    'addRecombinant',
    'addMultiRecombinant',
    'addEmpty',
    'takeMigrants',
    'removeSubpopulation',
    'killIndividuals'
];
exports.NONWF_ONLY_CALLBACKS = [
    'reproduction',
    'survival'
];
exports.WF_ONLY_CALLBACKS = [
    'mateChoice'
];
exports.CALLBACKS_BLOCKING_EVALUATE = [
    'reproduction()',
    'matechoice()',
    'mutation()',
    'recombination()',
    'modifychild()',
    'survival()'
];
exports.METHODS_REQUIRING_EVALUATE = [
    'clippedIntegral',
    'distance',
    'distanceFromPoint',
    'drawByStrength',
    'interactingNeighborCount',
    'interactionDistance',
    'localPopulationDensity',
    'nearestNeighbors',
    'nearestNeighborsOfPoint',
    'nearestInteractingNeighbors',
    'neighborCount',
    'strength',
    'totalOfNeighborStrengths'
];
exports.CALLBACK_SPECIFIC_PSEUDO_PARAMS = {
    'effect': ['mutationEffect()'],
    'originalNuc': ['mutation()'],
    'surviving': ['survival()'],
    'draw': ['survival()']
};
exports.TICK_CYCLE_INFO = {
    'first()': {
        wf: 'Step 0: Executes first in the tick cycle',
        nonwf: 'Step 0: Executes first in the tick cycle'
    },
    'early()': {
        wf: 'Step 1: Executes early in the tick cycle (after first(), before offspring generation)',
        nonwf: 'Step 2: Executes after offspring generation, before fitness calculation'
    },
    'late()': {
        wf: 'Step 5: Executes late in the tick cycle (after offspring become parents)',
        nonwf: 'Step 6: Executes late in the tick cycle (after selection and mutation removal)'
    },
    'initialize()': {
        wf: 'Pre-simulation: Executes before the simulation starts (not part of tick cycle)',
        nonwf: 'Pre-simulation: Executes before the simulation starts (not part of tick cycle)'
    },
    'mutationEffect()': {
        wf: 'Step 3: Called during fitness recalculation (at end of tick, for next tick)',
        nonwf: 'Step 3: Called during fitness recalculation (same tick)'
    },
    'fitnessEffect()': {
        wf: 'Step 3: Called during fitness recalculation (at end of tick, for next tick)',
        nonwf: 'Step 3: Called during fitness recalculation (same tick)'
    },
    'mateChoice()': {
        wf: 'Step 2.3: Called during offspring generation when choosing parent 2',
        nonwf: 'N/A: Not used in nonWF models (mating is script-controlled)'
    },
    'modifyChild()': {
        wf: 'Step 2.5: Called during offspring generation to suppress/modify child',
        nonwf: 'Step 1.4: Called during offspring generation to suppress/modify child'
    },
    'mutation()': {
        wf: 'Step 2.4: Called during offspring generation when mutations are created',
        nonwf: 'Step 1.3: Called during offspring generation when mutations are created'
    },
    'recombination()': {
        wf: 'Step 2.4: Called during offspring generation when gametes are created',
        nonwf: 'Step 1.3: Called during offspring generation when gametes are created'
    },
    'reproduction()': {
        wf: 'N/A: Not used in WF models (reproduction is automatic)',
        nonwf: 'Step 1.1: Called to trigger reproduction (script-controlled)'
    },
    'survival()': {
        wf: 'N/A: Not used in WF models (parents always die)',
        nonwf: 'Step 4: Called during selection phase to determine survival'
    },
    'interaction()': {
        wf: 'On-demand: Called when interaction strengths are evaluated (various points)',
        nonwf: 'On-demand: Called when interaction strengths are evaluated (various points)'
    }
};
//# sourceMappingURL=config.js.map