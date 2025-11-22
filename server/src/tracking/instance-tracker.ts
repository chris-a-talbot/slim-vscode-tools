import { CALLBACK_PSEUDO_PARAMETERS } from '../config/constants';
import { inferTypeFromExpression } from './expression-type-inference';
import { LOOKAHEAD_LIMITS, INDICES } from '../config/constants';
import { DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/regex-patterns';
import { CALLBACK_NAMES } from '../config/constants';
import { CLASS_NAMES } from '../config/constants';
import { TrackingState, CallbackState } from '../types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DefinitionPatterns } from '../types';

function createTrackingState(): TrackingState {
    return {
        instanceDefinitions: {},
        definedConstants: new Set<string>(),
        definedMutationTypes: new Set<string>(),
        definedGenomicElementTypes: new Set<string>(),
        definedInteractionTypes: new Set<string>(),
        definedSubpopulations: new Set<string>(),
        definedScriptBlocks: new Set<string>(),
        definedSpecies: new Set<string>()
    };
}

function detectCallbackDefinition(line: string): string | null {
    const callbackPattern = new RegExp(
        `(?:species\\s+\\w+\\s+)?(?:s\\d+\\s+)?(?:\\d+(?::\\d+)?\\s+)?(${CALLBACK_NAMES.join('|')})\\s*\\([^)]*\\)\\s*\\{`,
        'i'
    );
    
    const match = line.match(callbackPattern);
    if (match) {
        const callbackName = match[1].toLowerCase();
        return callbackName + '()';
    }
    
    return null;
}

function updateCallbackState(
    line: string,
    lineIndex: number,
    state: TrackingState,
    callbackState: CallbackState
): CallbackState {
    const { currentCallback, braceDepth, callbackStartLine } = callbackState;
    let newCallback = currentCallback;
    let newBraceDepth = braceDepth;
    let newCallbackStartLine = callbackStartLine;
    
    // Check if we're entering a new callback block
    const detectedCallback = detectCallbackDefinition(line);
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    if (detectedCallback && openBraces > 0) {
        // We're entering a new callback
        newCallback = detectedCallback;
        newCallbackStartLine = lineIndex;
        newBraceDepth = 0; // Reset brace depth for this callback block
        
        // Add pseudo-parameters for this callback
        const pseudoParams = CALLBACK_PSEUDO_PARAMETERS[detectedCallback];
        if (pseudoParams) {
            // Object.entries loses the key/value typing, so we re-assert it here.
            for (const [paramName, paramType] of Object.entries(pseudoParams) as [string, string][]) {
                state.instanceDefinitions[paramName] = paramType;
            }
        }
    }
    
    // Track brace depth to know when we exit a callback block
    if (newCallback) {
        newBraceDepth += openBraces - closeBraces;
        
        // Check if we've exited the callback block
        if (newBraceDepth <= 0 && closeBraces > 0) {
            // We've exited the callback block
            newCallback = null;
            newCallbackStartLine = -1;
            newBraceDepth = 0;
        }
    }
    
    return {
        currentCallback: newCallback,
        braceDepth: newBraceDepth,
        callbackStartLine: newCallbackStartLine
    };
}

function trackConstant(line: string, lineIndex: number, lines: string[], state: TrackingState): void {
    const constantMatch = line.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
    if (!constantMatch) return;
    
    const constName = constantMatch[1];
    if (!state.definedConstants.has(constName)) {
        state.definedConstants.add(constName);
    }
    
    // Try to infer type from the value in defineConstant("NAME", value)
    const constValueMatch = line.match(DEFINITION_PATTERNS.CONSTANT_VALUE);
    if (constValueMatch) {
        // Single-line case: value is on the same line
        const valueExpr = constValueMatch[1].trim();
        const cleanValue = valueExpr.replace(/\)\s*$/, '').trim();
        const inferredType = inferTypeFromExpression(cleanValue);
        if (inferredType) {
            state.instanceDefinitions[constName] = inferredType;
        }
    } else {
        // Multi-line case: value might be on the next line(s)
        for (let lookAhead = INDICES.SECOND; lookAhead <= LOOKAHEAD_LIMITS.CONSTANT_VALUE && lineIndex + lookAhead < lines.length; lookAhead++) {
            const nextLine = lines[lineIndex + lookAhead].trim();
            if (!nextLine || nextLine.startsWith('//')) continue;
            
            if (nextLine.includes(')')) {
                const valuePart = nextLine.split(')')[0].trim();
                const inferredType = inferTypeFromExpression(valuePart);
                if (inferredType) {
                    state.instanceDefinitions[constName] = inferredType;
                }
                break;
            } else {
                const inferredType = inferTypeFromExpression(nextLine);
                if (inferredType) {
                    state.instanceDefinitions[constName] = inferredType;
                    break;
                }
            }
        }
    }
}

function trackTypeDefinitions(line: string, patterns: DefinitionPatterns, state: TrackingState): void {
    let match: RegExpMatchArray | null;
    
    if ((match = line.match(patterns.mutationType)) !== null) {
        const mutTypeId = match[1];
        if (!state.definedMutationTypes.has(mutTypeId)) {
            state.definedMutationTypes.add(mutTypeId);
        }
    }
    
    if ((match = line.match(patterns.genomicElementType)) !== null) {
        const genElemTypeId = match[1];
        if (!state.definedGenomicElementTypes.has(genElemTypeId)) {
            state.definedGenomicElementTypes.add(genElemTypeId);
        }
    }
    
    if ((match = line.match(patterns.interactionType)) !== null) {
        const intTypeId = match[1];
        if (!state.definedInteractionTypes.has(intTypeId)) {
            state.definedInteractionTypes.add(intTypeId);
        }
    }
    
    if ((match = line.match(patterns.species)) !== null) {
        const speciesName = match[1];
        if (!state.definedSpecies.has(speciesName)) {
            state.definedSpecies.add(speciesName);
        }
    }
}

function trackSubpopulations(line: string, patterns: DefinitionPatterns, state: TrackingState): void {
    let match: RegExpMatchArray | null;
    
    if ((match = line.match(patterns.subpop)) !== null || (match = line.match(patterns.subpopSplit)) !== null) {
        const subpopName = match[INDICES.SECOND];
        if (!state.definedSubpopulations.has(subpopName)) {
            state.definedSubpopulations.add(subpopName);
        }
        state.instanceDefinitions[subpopName] = CLASS_NAMES.SUBPOPULATION;
    }
}

function trackScriptBlocks(line: string, patterns: DefinitionPatterns, state: TrackingState): void {
    const scriptBlockPatterns = [
        patterns.earlyEvent, patterns.firstEvent, patterns.interactionCallback,
        patterns.lateEvent, patterns.fitnessEffectCallback, patterns.mateChoiceCallback,
        patterns.modifyChildCallback, patterns.mutationCallback, patterns.mutationEffectCallback,
        patterns.recombinationCallback, patterns.reproductionCallback, patterns.survivalCallback
    ];
    
    for (const pattern of scriptBlockPatterns) {
        const match = line.match(pattern);
        if (match !== null) {
            const blockId = match[INDICES.SECOND];
            if (!state.definedScriptBlocks.has(blockId)) {
                state.definedScriptBlocks.add(blockId);
            }
            state.instanceDefinitions[blockId] = CLASS_NAMES.SLIMEIDOS_BLOCK;
            break; // Only match one pattern per line
        }
    }
}

function createDefinitionPatterns(): DefinitionPatterns {
    return {
        instance: DEFINITION_PATTERNS.INSTANCE,
        assignment: DEFINITION_PATTERNS.ASSIGNMENT,
        subpop: DEFINITION_PATTERNS.SUBPOP,
        subpopSplit: DEFINITION_PATTERNS.SUBPOP_SPLIT,
        constant: DEFINITION_PATTERNS.DEFINE_CONSTANT,
        mutationType: DEFINITION_PATTERNS.MUTATION_TYPE,
        genomicElementType: DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE,
        interactionType: DEFINITION_PATTERNS.INTERACTION_TYPE,
        species: DEFINITION_PATTERNS.SPECIES,
        earlyEvent: CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT,
        firstEvent: CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT,
        interactionCallback: CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK,
        lateEvent: CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT,
        fitnessEffectCallback: CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK,
        mateChoiceCallback: CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK,
        modifyChildCallback: CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK,
        mutationCallback: CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK,
        mutationEffectCallback: CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK,
        recombinationCallback: CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK,
        reproductionCallback: CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK,
        survivalCallback: CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK
    };
}

function trackInstanceAssignments(line: string, patterns: DefinitionPatterns, state: TrackingState): void {
    let match: RegExpMatchArray | null;
    
    // Track instance definitions (new ClassName)
    if ((match = line.match(patterns.instance)) !== null) {
        state.instanceDefinitions[match[1]] = match[2];
    }
    
    // Track type inference from assignments
    if ((match = line.match(patterns.assignment)) !== null) {
        const rhs = match[2].trim();
        const inferredType = inferTypeFromExpression(rhs);
        if (inferredType) {
            state.instanceDefinitions[match[1]] = inferredType;
        }
    }
}

function processLine(
    line: string,
    lineIndex: number,
    lines: string[],
    patterns: DefinitionPatterns,
    trackingState: TrackingState,
    callbackState: CallbackState
): CallbackState {
    // Update callback tracking state
    const updatedCallbackState = updateCallbackState(line, lineIndex, trackingState, callbackState);
    
    // Track constants and infer their types
    trackConstant(line, lineIndex, lines, trackingState);
    
    // Track type definitions
    trackTypeDefinitions(line, patterns, trackingState);
    
    // Track subpopulations
    trackSubpopulations(line, patterns, trackingState);
    
    // Track script blocks
    trackScriptBlocks(line, patterns, trackingState);
    
    // Track instance definitions and assignments
    trackInstanceAssignments(line, patterns, trackingState);
    
    return updatedCallbackState;
}

export function trackInstanceDefinitions(
    document: TextDocument,
    state?: TrackingState
): TrackingState {
    // Create fresh tracking state for this analysis, or use provided state
    const trackingState = state || createTrackingState();
    const text = document.getText();
    const lines = text.split('\n');
    const patterns = createDefinitionPatterns();
    
    // Track which callback we're currently in (for pseudo-parameter tracking)
    let callbackState: CallbackState = {
        currentCallback: null,
        braceDepth: 0,
        callbackStartLine: -1
    };

    lines.forEach((line, lineIndex) => {
        callbackState = processLine(line, lineIndex, lines, patterns, trackingState, callbackState);
    });
    
    return trackingState;
}
