"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInstanceDefinitions = trackInstanceDefinitions;
const constants_1 = require("../config/constants");
const expression_type_inference_1 = require("./expression-type-inference");
const constants_2 = require("../config/constants");
const regex_patterns_1 = require("../config/regex-patterns");
const constants_3 = require("../config/constants");
const constants_4 = require("../config/constants");
function createTrackingState() {
    return {
        instanceDefinitions: {},
        definedConstants: new Set(),
        definedMutationTypes: new Set(),
        definedGenomicElementTypes: new Set(),
        definedInteractionTypes: new Set(),
        definedSubpopulations: new Set(),
        definedScriptBlocks: new Set(),
        definedSpecies: new Set()
    };
}
function detectCallbackDefinition(line) {
    const callbackPattern = new RegExp(`(?:species\\s+\\w+\\s+)?(?:s\\d+\\s+)?(?:\\d+(?::\\d+)?\\s+)?(${constants_3.CALLBACK_NAMES.join('|')})\\s*\\([^)]*\\)\\s*\\{`, 'i');
    const match = line.match(callbackPattern);
    if (match) {
        const callbackName = match[1].toLowerCase();
        return callbackName + '()';
    }
    return null;
}
function updateCallbackState(line, lineIndex, state, callbackState) {
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
        const pseudoParams = constants_1.CALLBACK_PSEUDO_PARAMETERS[detectedCallback];
        if (pseudoParams) {
            // Object.entries loses the key/value typing, so we re-assert it here.
            for (const [paramName, paramType] of Object.entries(pseudoParams)) {
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
function trackConstant(line, lineIndex, lines, state) {
    const constantMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.DEFINE_CONSTANT);
    if (!constantMatch)
        return;
    const constName = constantMatch[1];
    if (!state.definedConstants.has(constName)) {
        state.definedConstants.add(constName);
    }
    // Try to infer type from the value in defineConstant("NAME", value)
    const constValueMatch = line.match(regex_patterns_1.DEFINITION_PATTERNS.CONSTANT_VALUE);
    if (constValueMatch) {
        // Single-line case: value is on the same line
        const valueExpr = constValueMatch[1].trim();
        const cleanValue = valueExpr.replace(/\)\s*$/, '').trim();
        const inferredType = (0, expression_type_inference_1.inferTypeFromExpression)(cleanValue);
        if (inferredType) {
            state.instanceDefinitions[constName] = inferredType;
        }
    }
    else {
        // Multi-line case: value might be on the next line(s)
        for (let lookAhead = constants_2.INDICES.SECOND; lookAhead <= constants_2.LOOKAHEAD_LIMITS.CONSTANT_VALUE && lineIndex + lookAhead < lines.length; lookAhead++) {
            const nextLine = lines[lineIndex + lookAhead].trim();
            if (!nextLine || nextLine.startsWith('//'))
                continue;
            if (nextLine.includes(')')) {
                const valuePart = nextLine.split(')')[0].trim();
                const inferredType = (0, expression_type_inference_1.inferTypeFromExpression)(valuePart);
                if (inferredType) {
                    state.instanceDefinitions[constName] = inferredType;
                }
                break;
            }
            else {
                const inferredType = (0, expression_type_inference_1.inferTypeFromExpression)(nextLine);
                if (inferredType) {
                    state.instanceDefinitions[constName] = inferredType;
                    break;
                }
            }
        }
    }
}
function trackTypeDefinitions(line, patterns, state) {
    let match;
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
function trackSubpopulations(line, patterns, state) {
    let match;
    if ((match = line.match(patterns.subpop)) !== null || (match = line.match(patterns.subpopSplit)) !== null) {
        const subpopName = match[constants_2.INDICES.SECOND];
        if (!state.definedSubpopulations.has(subpopName)) {
            state.definedSubpopulations.add(subpopName);
        }
        state.instanceDefinitions[subpopName] = constants_4.CLASS_NAMES.SUBPOPULATION;
    }
}
function trackScriptBlocks(line, patterns, state) {
    const scriptBlockPatterns = [
        patterns.earlyEvent, patterns.firstEvent, patterns.interactionCallback,
        patterns.lateEvent, patterns.fitnessEffectCallback, patterns.mateChoiceCallback,
        patterns.modifyChildCallback, patterns.mutationCallback, patterns.mutationEffectCallback,
        patterns.recombinationCallback, patterns.reproductionCallback, patterns.survivalCallback
    ];
    for (const pattern of scriptBlockPatterns) {
        const match = line.match(pattern);
        if (match !== null) {
            const blockId = match[constants_2.INDICES.SECOND];
            if (!state.definedScriptBlocks.has(blockId)) {
                state.definedScriptBlocks.add(blockId);
            }
            state.instanceDefinitions[blockId] = constants_4.CLASS_NAMES.SLIMEIDOS_BLOCK;
            break; // Only match one pattern per line
        }
    }
}
function createDefinitionPatterns() {
    return {
        instance: regex_patterns_1.DEFINITION_PATTERNS.INSTANCE,
        assignment: regex_patterns_1.DEFINITION_PATTERNS.ASSIGNMENT,
        subpop: regex_patterns_1.DEFINITION_PATTERNS.SUBPOP,
        subpopSplit: regex_patterns_1.DEFINITION_PATTERNS.SUBPOP_SPLIT,
        constant: regex_patterns_1.DEFINITION_PATTERNS.DEFINE_CONSTANT,
        mutationType: regex_patterns_1.DEFINITION_PATTERNS.MUTATION_TYPE,
        genomicElementType: regex_patterns_1.DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE,
        interactionType: regex_patterns_1.DEFINITION_PATTERNS.INTERACTION_TYPE,
        species: regex_patterns_1.DEFINITION_PATTERNS.SPECIES,
        earlyEvent: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT,
        firstEvent: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT,
        interactionCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK,
        lateEvent: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT,
        fitnessEffectCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK,
        mateChoiceCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK,
        modifyChildCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK,
        mutationCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK,
        mutationEffectCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK,
        recombinationCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK,
        reproductionCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK,
        survivalCallback: regex_patterns_1.CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK
    };
}
function trackInstanceAssignments(line, patterns, state) {
    let match;
    // Track instance definitions (new ClassName)
    if ((match = line.match(patterns.instance)) !== null) {
        state.instanceDefinitions[match[1]] = match[2];
    }
    // Track type inference from assignments
    if ((match = line.match(patterns.assignment)) !== null) {
        const rhs = match[2].trim();
        const inferredType = (0, expression_type_inference_1.inferTypeFromExpression)(rhs);
        if (inferredType) {
            state.instanceDefinitions[match[1]] = inferredType;
        }
    }
}
function processLine(line, lineIndex, lines, patterns, trackingState, callbackState) {
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
function trackInstanceDefinitions(document, state) {
    // Create fresh tracking state for this analysis, or use provided state
    const trackingState = state || createTrackingState();
    const text = document.getText();
    const lines = text.split('\n');
    const patterns = createDefinitionPatterns();
    // Track which callback we're currently in (for pseudo-parameter tracking)
    let callbackState = {
        currentCallback: null,
        braceDepth: 0,
        callbackStartLine: -1
    };
    lines.forEach((line, lineIndex) => {
        callbackState = processLine(line, lineIndex, lines, patterns, trackingState, callbackState);
    });
    return trackingState;
}
//# sourceMappingURL=instance-tracker.js.map