import { FunctionData, ClassInfo, CallbackInfo, TypeInfo, OperatorInfo, TickCycleInfo } from './types';

// ============================================================================
// Documentation data stores
// ============================================================================

export let functionsData: { [key: string]: FunctionData } = {};
export let classesData: { [key: string]: ClassInfo } = {};
export let callbacksData: { [key: string]: CallbackInfo } = {};
export let typesData: { [key: string]: TypeInfo } = {};
export let operatorsData: { [key: string]: OperatorInfo } = {};

// ============================================================================
// Class and type names
// ============================================================================

export const CLASS_NAMES: Readonly<Record<string, string>> = {
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
    SLIMEIDOS_BLOCK: 'SLiMEidosBlock',
} as const;

export const TYPE_NAMES = {
    INTEGER: 'integer',
    FLOAT: 'float',
    STRING: 'string',
    LOGICAL: 'logical',
    OBJECT: 'object',
    NUMERIC: 'numeric',
    NULL: 'NULL',
    INF: 'INF',
    VOID: 'void',
} as const;

export const INSTANCE_TO_CLASS_MAP: Readonly<Record<string, string>> = {
    sim: CLASS_NAMES.SPECIES,
    community: CLASS_NAMES.COMMUNITY,
    species: CLASS_NAMES.SPECIES,
    ind: CLASS_NAMES.INDIVIDUAL,
    genome: CLASS_NAMES.HAPLOSOME,
    mut: CLASS_NAMES.MUTATION,
    muts: CLASS_NAMES.MUTATION,
    mutations: CLASS_NAMES.MUTATION,
    mutation: CLASS_NAMES.MUTATION,
    chromosome: CLASS_NAMES.CHROMOSOME,
    chr: CLASS_NAMES.CHROMOSOME,
};

// ============================================================================
// Callback-related constants
// ============================================================================

export const EIDOS_EVENT_NAMES: readonly string[] = ['early', 'late', 'first'];

export const CALLBACK_NAMES: readonly string[] = [
    'initialize',
    'mutationEffect',
    'fitnessEffect',
    'mateChoice',
    'modifyChild',
    'recombination',
    'interaction',
    'reproduction',
    'mutation',
    'survival',
    ...EIDOS_EVENT_NAMES,
];

export const CALLBACK_PSEUDO_PARAMETERS: Readonly<Record<string, Record<string, string>>> = {
    'initialize()': {},
    'mutationEffect()': {
        mut: CLASS_NAMES.MUTATION,
        homozygous: TYPE_NAMES.LOGICAL,
        effect: TYPE_NAMES.FLOAT,
    },
    'fitnessEffect()': {
        individual: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
    'mateChoice()': {
        sourceSubpop: CLASS_NAMES.SUBPOPULATION,
        weights: TYPE_NAMES.FLOAT,
        individual: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
    'modifyChild()': {
        child: CLASS_NAMES.INDIVIDUAL,
        isCloning: TYPE_NAMES.LOGICAL,
        isSelfing: TYPE_NAMES.LOGICAL,
        parent1: CLASS_NAMES.INDIVIDUAL,
        parent2: CLASS_NAMES.INDIVIDUAL,
        sourceSubpop: CLASS_NAMES.SUBPOPULATION,
    },
    'recombination()': {
        haplosome1: CLASS_NAMES.HAPLOSOME,
        haplosome2: CLASS_NAMES.HAPLOSOME,
        breakpoints: TYPE_NAMES.INTEGER,
        individual: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
    'interaction()': {
        distance: TYPE_NAMES.FLOAT,
        strength: TYPE_NAMES.FLOAT,
        receiver: CLASS_NAMES.INDIVIDUAL,
        exerter: CLASS_NAMES.INDIVIDUAL,
    },
    'reproduction()': {
        individual: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
    'mutation()': {
        mut: CLASS_NAMES.MUTATION,
        haplosome: CLASS_NAMES.HAPLOSOME,
        element: 'GenomicElement',
        originalNuc: TYPE_NAMES.INTEGER,
        parent: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
    'survival()': {
        surviving: TYPE_NAMES.LOGICAL,
        fitness: TYPE_NAMES.FLOAT,
        draw: TYPE_NAMES.FLOAT,
        individual: CLASS_NAMES.INDIVIDUAL,
        subpop: CLASS_NAMES.SUBPOPULATION,
    },
} as const;

export const CALLBACK_REGISTRATION_PATTERNS = {
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
    SURVIVAL_CALLBACK: /species\.registerSurvivalCallback\("(\w+)",\s*[^)]*\)/,
} as const;

export const TICK_CYCLE_INFO: Readonly<Record<string, TickCycleInfo>> = {
    'first()': {
        wf: 'Step 0: Executes first in the tick cycle',
        nonwf: 'Step 0: Executes first in the tick cycle',
    },
    'early()': {
        wf: 'Step 1: Executes early in the tick cycle (after first(), before offspring generation)',
        nonwf: 'Step 2: Executes after offspring generation, before fitness calculation',
    },
    'late()': {
        wf: 'Step 5: Executes late in the tick cycle (after offspring become parents)',
        nonwf: 'Step 6: Executes late in the tick cycle (after selection and mutation removal)',
    },
    'initialize()': {
        wf: 'Pre-simulation: Executes before the simulation starts (not part of tick cycle)',
        nonwf: 'Pre-simulation: Executes before the simulation starts (not part of tick cycle)',
    },
    'mutationEffect()': {
        wf: 'Step 3: Called during fitness recalculation (at end of tick, for next tick)',
        nonwf: 'Step 3: Called during fitness recalculation (same tick)',
    },
    'fitnessEffect()': {
        wf: 'Step 3: Called during fitness recalculation (at end of tick, for next tick)',
        nonwf: 'Step 3: Called during fitness recalculation (same tick)',
    },
    'mateChoice()': {
        wf: 'Step 2.3: Called during offspring generation when choosing parent 2',
        nonwf: 'N/A: Not used in nonWF models (mating is script-controlled)',
    },
    'modifyChild()': {
        wf: 'Step 2.5: Called during offspring generation to suppress/modify child',
        nonwf: 'Step 1.4: Called during offspring generation to suppress/modify child',
    },
    'mutation()': {
        wf: 'Step 2.4: Called during offspring generation when mutations are created',
        nonwf: 'Step 1.3: Called during offspring generation when mutations are created',
    },
    'recombination()': {
        wf: 'Step 2.4: Called during offspring generation when gametes are created',
        nonwf: 'Step 1.3: Called during offspring generation when gametes are created',
    },
    'reproduction()': {
        wf: 'N/A: Not used in WF models (reproduction is automatic)',
        nonwf: 'Step 1.1: Called to trigger reproduction (script-controlled)',
    },
    'survival()': {
        wf: 'N/A: Not used in WF models (parents always die)',
        nonwf: 'Step 4: Called during selection phase to determine survival',
    },
    'interaction()': {
        wf: 'On-demand: Called when interaction strengths are evaluated (various points)',
        nonwf: 'On-demand: Called when interaction strengths are evaluated (various points)',
    },
} as const;

// ============================================================================
// Regex patterns
// ============================================================================

export const TEXT_PROCESSING_PATTERNS = {
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
    MULTILINE_COMMENT: /\/\*.*?\*\//g,
} as const;

export const TYPE_PATTERNS = {
    SUBPOPULATION: /^p\d+$/,
    MUTATION_TYPE: /^m\d+$/,
    GENOMIC_ELEMENT_TYPE: /^g\d+$/,
    INTERACTION_TYPE: /^i\d+$/,
    TYPE_ID_IN_CONTEXT: /[^a-zA-Z0-9_](p\d+|m\d+|g\d+|i\d+)[^a-zA-Z0-9_]/,
} as const;

export const TYPE_INFERENCE_PATTERNS = {
    NUMERIC_FUNCTIONS:
        /^(sum|mean|min|max|abs|sqrt|log|exp|sin|cos|tan|round|floor|ceil|length|size|sd|var)\s*\(/,
    ARITHMETIC_OPERATORS: /[+\-*\/%]/,
    LOGICAL_OPERATORS: /^(==|!=|<|>|<=|>=|&&|\|\||!)/,
    LOGICAL_FUNCTIONS: /^(all|any|isNULL|isNAN|isFinite|isInfinite)\s*\(/,
    SUBPOPULATION_METHODS:
        /\.(addSubpop|addSubpopSplit|subpopulations|subpopulationsWithIDs|subpopulationsWithNames|subpopulationByID)\(/,
    INDIVIDUAL_METHODS: /\.(individuals|sampleIndividuals|individualsWithPedigreeIDs)(\[|$|\()/,
    HAPLOSOME_METHODS: /\.(genomes|haplosomesForChromosomes|genome1|genome2)(\[|$|\()/,
    MUTATION_METHODS:
        /\.(mutations|mutationsOfType|mutationsFromHaplosomes|uniqueMutationsOfType)(\[|$|\()/,
    MUTATION_TYPE_METHODS:
        /(initializeMutationType|initializeMutationTypeNuc|\.mutationTypesWithIDs)\(/,
    GENOMIC_ELEMENT_TYPE_METHODS: /(initializeGenomicElementType|\.genomicElementTypesWithIDs)\(/,
    INTERACTION_TYPE_METHODS: /(initializeInteractionType|\.interactionTypesWithIDs)\(/,
    CHROMOSOME_METHODS: /(initializeChromosome|\.chromosomesWithIDs|\.chromosomesOfType)\(/,
    LOGFILE_METHODS: /\.createLogFile\(/,
} as const;

export const IDENTIFIER_PATTERNS = {
    WORD: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
    METHOD_CALL: /\b(\w+)\s*\.\s*(\w+)\s*\(/g,
    PROPERTY_ACCESS: /\b(\w+)\s*\.\s*(\w+)\b(?![\(\w])/g,
    FUNCTION_CALL: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
    DOT_PATTERN: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*$/,
    DOT_WITH_MEMBER: /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)?/g,
} as const;

export const DEFINITION_PATTERNS = {
    DEFINE_CONSTANT: /defineConstant\s*\(\s*"(\w+)"\s*,/,
    MUTATION_TYPE: /initializeMutationType\s*\(\s*"?(m\d+)"?/,
    GENOMIC_ELEMENT_TYPE: /initializeGenomicElementType\s*\(\s*"?(g\d+)"?/,
    INTERACTION_TYPE: /initializeInteractionType\s*\(\s*"?(i\d+)"?/,
    SUBPOP: /sim\.addSubpop\("(\w+)"/,
    SUBPOP_SPLIT: /sim\.addSubpopSplit\("(\w+)"/,
    SPECIES: /species\s+(\w+)\s+initialize/,
    SCRIPT_BLOCK:
        /(?:first|early|late|initialize|fitnessEffect|interaction|mateChoice|modifyChild|mutation|mutationEffect|recombination|reproduction|survival)\s*\(\s*"(\w+)"\s*\)/,
    INSTANCE: /(\w+)\s*=\s*new\s+(\w+)/,
    ASSIGNMENT: /(\w+)\s*=\s*([^;]+)/,
    CONSTANT_VALUE: /defineConstant\s*\(\s*"[^"]+"\s*,\s*(.+?)(?:\)|$)/,
    USER_FUNCTION: /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/,
} as const;

// ============================================================================
// Operators
// ============================================================================

export const TWO_CHAR_OPS = ['==', '!=', '<=', '>=', '&&', '||', '<-', '->'];
export const SINGLE_CHAR_OPS = [
    ':',
    '[',
    ']',
    '+',
    '-',
    '*',
    '/',
    '%',
    '^',
    '|',
    '&',
    '!',
    '<',
    '>',
    '=',
    '?',
    '(',
    ')',
    '.',
];
