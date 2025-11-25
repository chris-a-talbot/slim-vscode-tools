// Structure validation utilities

export function shouldHaveSemicolon(
    line: string,
    parenBalance: number = 0
): { shouldMark: boolean; parenBalance: number } {
    const strings: string[] = [];
    const codeWithPlaceholders = line.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
        strings.push(match);
        return `__STRING${strings.length - 1}__`;
    });

    const codeOnly = codeWithPlaceholders
        .replace(/\/\/.*$/, '')
        .replace(/\/\*.*?\*\//g, '')
        .trim();

    const restoredCode = strings.reduce(
        (code, str, i) => code.replace(`__STRING${i}__`, str),
        codeOnly
    );

    const openParens = (restoredCode.match(/\(/g) || []).length;
    const closeParens = (restoredCode.match(/\)/g) || []).length;
    const netParens = parenBalance + openParens - closeParens;

    const isDefinitelySafe =
        restoredCode.endsWith(';') ||
        restoredCode.endsWith('{') ||
        restoredCode.endsWith('}') ||
        netParens > 0 ||
        /^\s*(if|else|while|for|switch|case|default)\b.*\)?\s*{?\s*$/.test(restoredCode) ||
        /^(initialize|early|late|fitness)\s*\([^)]*\)\s*{?\s*$/.test(restoredCode) ||
        /^\s*(s\d+\s+)?\d+\s+(early|late|reproduction|fitness)\s*\(\)\s*$/.test(restoredCode) ||
        /^\s*\/[\/\*]/.test(line) ||
        /^\s*\*/.test(line) ||
        /^\s*$/.test(line);

    return {
        shouldMark: !isDefinitelySafe && netParens === 0,
        parenBalance: netParens,
    };
}

// Type inference patterns (for expression type detection)
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