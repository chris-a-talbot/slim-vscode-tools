"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackInstanceDefinitions = trackInstanceDefinitions;
const config_1 = require("../config/config");
const type_info_1 = require("./type-info");
const config_2 = require("../config/config");
const config_3 = require("../config/config");
const config_4 = require("../config/config");
const config_5 = require("../config/config");
function trackInstanceDefinitions(document, state) {
    // Create fresh tracking state for this analysis, or use provided state
    const trackingState = state || {
        instanceDefinitions: {},
        definedConstants: new Set(),
        definedMutationTypes: new Set(),
        definedGenomicElementTypes: new Set(),
        definedInteractionTypes: new Set(),
        definedSubpopulations: new Set(),
        definedScriptBlocks: new Set(),
        definedSpecies: new Set(),
        modelType: null,
        callbackContextByLine: new Map()
    };
    const text = document.getText();
    const lines = text.split('\n');
    const patterns = {
        instance: config_3.DEFINITION_PATTERNS.INSTANCE,
        assignment: config_3.DEFINITION_PATTERNS.ASSIGNMENT,
        subpop: config_3.DEFINITION_PATTERNS.SUBPOP,
        subpopSplit: config_3.DEFINITION_PATTERNS.SUBPOP_SPLIT,
        constant: config_3.DEFINITION_PATTERNS.DEFINE_CONSTANT,
        mutationType: config_3.DEFINITION_PATTERNS.MUTATION_TYPE,
        genomicElementType: config_3.DEFINITION_PATTERNS.GENOMIC_ELEMENT_TYPE,
        interactionType: config_3.DEFINITION_PATTERNS.INTERACTION_TYPE,
        species: config_3.DEFINITION_PATTERNS.SPECIES,
        earlyEvent: config_3.CALLBACK_REGISTRATION_PATTERNS.EARLY_EVENT,
        firstEvent: config_3.CALLBACK_REGISTRATION_PATTERNS.FIRST_EVENT,
        interactionCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.INTERACTION_CALLBACK,
        lateEvent: config_3.CALLBACK_REGISTRATION_PATTERNS.LATE_EVENT,
        fitnessEffectCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.FITNESS_EFFECT_CALLBACK,
        mateChoiceCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.MATE_CHOICE_CALLBACK,
        modifyChildCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.MODIFY_CHILD_CALLBACK,
        mutationCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.MUTATION_CALLBACK,
        mutationEffectCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.MUTATION_EFFECT_CALLBACK,
        recombinationCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.RECOMBINATION_CALLBACK,
        reproductionCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.REPRODUCTION_CALLBACK,
        survivalCallback: config_3.CALLBACK_REGISTRATION_PATTERNS.SURVIVAL_CALLBACK
    };
    // Track which callback we're currently in (for pseudo-parameter tracking)
    let callbackState = {
        currentCallback: null,
        braceDepth: 0,
        callbackStartLine: -1
    };
    lines.forEach((line, lineIndex) => {
        // Update callback tracking state
        const { currentCallback, braceDepth, callbackStartLine } = callbackState;
        let newCallback = currentCallback;
        let newBraceDepth = braceDepth;
        let newCallbackStartLine = callbackStartLine;
        // Check if we're entering a new callback block
        const callbackPattern = new RegExp(`(?:species\\s+\\w+\\s+)?(?:s\\d+\\s+)?(?:\\d+(?::\\d+)?\\s+)?(${config_4.CALLBACK_NAMES.join('|')})\\s*\\([^)]*\\)\\s*\\{`, 'i');
        const callbackMatch = line.match(callbackPattern);
        const detectedCallback = callbackMatch ? callbackMatch[1].toLowerCase() + '()' : null;
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        if (detectedCallback && openBraces > 0) {
            // We're entering a new callback
            newCallback = detectedCallback;
            newCallbackStartLine = lineIndex;
            newBraceDepth = 0; // Reset brace depth for this callback block
            // Add pseudo-parameters for this callback
            const pseudoParams = config_1.CALLBACK_PSEUDO_PARAMETERS[detectedCallback];
            if (pseudoParams && Object.keys(pseudoParams).length > 0) {
                // Object.entries loses the key/value typing, so we re-assert it here.
                for (const [paramName, paramType] of Object.entries(pseudoParams)) {
                    trackingState.instanceDefinitions[paramName] = paramType;
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
        callbackState = {
            currentCallback: newCallback,
            braceDepth: newBraceDepth,
            callbackStartLine: newCallbackStartLine
        };
        // Store callback context for this line (using Map.set())
        trackingState.callbackContextByLine.set(lineIndex, callbackState.currentCallback);
        // Detect model type from initializeSLiMModelType()
        const modelTypeMatch = line.match(/initializeSLiMModelType\s*\(\s*["'](\w+)["']\s*\)/);
        if (modelTypeMatch) {
            const type = modelTypeMatch[1];
            if (type === 'WF' || type === 'nonWF') {
                trackingState.modelType = type;
            }
        }
        // Track constants and infer their types
        const constantMatch = line.match(config_3.DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch) {
            const constName = constantMatch[1];
            if (!trackingState.definedConstants.has(constName)) {
                trackingState.definedConstants.add(constName);
            }
            // Try to infer type from the value in defineConstant("NAME", value)
            const constValueMatch = line.match(config_3.DEFINITION_PATTERNS.CONSTANT_VALUE);
            if (constValueMatch) {
                // Single-line case: value is on the same line
                const valueExpr = constValueMatch[1].trim();
                const cleanValue = valueExpr.replace(/\)\s*$/, '').trim();
                const inferredType = (0, type_info_1.inferTypeFromExpression)(cleanValue);
                if (inferredType) {
                    trackingState.instanceDefinitions[constName] = inferredType;
                }
            }
            else {
                // Multi-line case: value might be on the next line(s)
                for (let lookAhead = config_2.INDICES.SECOND; lookAhead <= config_2.LOOKAHEAD_LIMITS.CONSTANT_VALUE && lineIndex + lookAhead < lines.length; lookAhead++) {
                    const nextLine = lines[lineIndex + lookAhead].trim();
                    if (!nextLine || nextLine.startsWith('//'))
                        continue;
                    if (nextLine.includes(')')) {
                        const valuePart = nextLine.split(')')[0].trim();
                        const inferredType = (0, type_info_1.inferTypeFromExpression)(valuePart);
                        if (inferredType) {
                            trackingState.instanceDefinitions[constName] = inferredType;
                        }
                        break;
                    }
                    else {
                        const inferredType = (0, type_info_1.inferTypeFromExpression)(nextLine);
                        if (inferredType) {
                            trackingState.instanceDefinitions[constName] = inferredType;
                            break;
                        }
                    }
                }
            }
        }
        // Track type definitions
        let typeMatch;
        if ((typeMatch = line.match(patterns.mutationType)) !== null) {
            const mutTypeId = typeMatch[1];
            if (!trackingState.definedMutationTypes.has(mutTypeId)) {
                trackingState.definedMutationTypes.add(mutTypeId);
            }
        }
        if ((typeMatch = line.match(patterns.genomicElementType)) !== null) {
            const genElemTypeId = typeMatch[1];
            if (!trackingState.definedGenomicElementTypes.has(genElemTypeId)) {
                trackingState.definedGenomicElementTypes.add(genElemTypeId);
            }
        }
        if ((typeMatch = line.match(patterns.interactionType)) !== null) {
            const intTypeId = typeMatch[1];
            if (!trackingState.definedInteractionTypes.has(intTypeId)) {
                trackingState.definedInteractionTypes.add(intTypeId);
            }
        }
        if ((typeMatch = line.match(patterns.species)) !== null) {
            const speciesName = typeMatch[1];
            if (!trackingState.definedSpecies.has(speciesName)) {
                trackingState.definedSpecies.add(speciesName);
            }
        }
        // Track subpopulations
        if ((typeMatch = line.match(patterns.subpop)) !== null || (typeMatch = line.match(patterns.subpopSplit)) !== null) {
            const subpopName = typeMatch[config_2.INDICES.SECOND];
            if (!trackingState.definedSubpopulations.has(subpopName)) {
                trackingState.definedSubpopulations.add(subpopName);
            }
            trackingState.instanceDefinitions[subpopName] = config_5.CLASS_NAMES.SUBPOPULATION;
        }
        // Track script blocks
        const scriptBlockPatterns = [
            patterns.earlyEvent, patterns.firstEvent, patterns.interactionCallback,
            patterns.lateEvent, patterns.fitnessEffectCallback, patterns.mateChoiceCallback,
            patterns.modifyChildCallback, patterns.mutationCallback, patterns.mutationEffectCallback,
            patterns.recombinationCallback, patterns.reproductionCallback, patterns.survivalCallback
        ];
        for (const pattern of scriptBlockPatterns) {
            const scriptMatch = line.match(pattern);
            if (scriptMatch !== null) {
                const blockId = scriptMatch[config_2.INDICES.SECOND];
                if (!trackingState.definedScriptBlocks.has(blockId)) {
                    trackingState.definedScriptBlocks.add(blockId);
                }
                trackingState.instanceDefinitions[blockId] = config_5.CLASS_NAMES.SLIMEIDOS_BLOCK;
                break; // Only match one pattern per line
            }
        }
        // Track instance definitions and assignments
        // Track instance definitions (new ClassName)
        if ((typeMatch = line.match(patterns.instance)) !== null) {
            trackingState.instanceDefinitions[typeMatch[1]] = typeMatch[2];
        }
        // Track type inference from assignments
        if ((typeMatch = line.match(patterns.assignment)) !== null) {
            const rhs = typeMatch[2].trim();
            const inferredType = (0, type_info_1.inferTypeFromExpression)(rhs);
            if (inferredType) {
                trackingState.instanceDefinitions[typeMatch[1]] = inferredType;
            }
        }
    });
    return trackingState;
}
//# sourceMappingURL=instance.js.map