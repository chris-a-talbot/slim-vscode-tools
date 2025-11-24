import { CALLBACK_PSEUDO_PARAMETERS } from '../config/config';
import { inferTypeFromExpression } from './type-info';
import { LOOKAHEAD_LIMITS, INDICES } from '../config/config';
import { DEFINITION_PATTERNS, CALLBACK_REGISTRATION_PATTERNS } from '../config/config';
import { CALLBACK_NAMES } from '../config/config';
import { CLASS_NAMES } from '../config/config';
import { TrackingState, CallbackState } from '../config/types';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DefinitionPatterns } from '../config/types';

export function trackInstanceDefinitions(
    document: TextDocument,
    state?: TrackingState
): TrackingState {
    // Create fresh tracking state for this analysis, or use provided state
    const trackingState = state || {
        instanceDefinitions: {},
        definedConstants: new Set<string>(),
        definedMutationTypes: new Set<string>(),
        definedGenomicElementTypes: new Set<string>(),
        definedInteractionTypes: new Set<string>(),
        definedSubpopulations: new Set<string>(),
        definedScriptBlocks: new Set<string>(),
        definedSpecies: new Set<string>(),
        modelType: null,
        callbackContextByLine: new Map()
    };
    const text = document.getText();
    const lines = text.split('\n');
    const patterns: DefinitionPatterns = {
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
    
    // Track which callback we're currently in (for pseudo-parameter tracking)
    let callbackState: CallbackState = {
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
        const callbackPattern = new RegExp(
            `(?:species\\s+\\w+\\s+)?(?:s\\d+\\s+)?(?:\\d+(?::\\d+)?\\s+)?(${CALLBACK_NAMES.join('|')})\\s*\\([^)]*\\)\\s*\\{`,
            'i'
        );
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
            const pseudoParams = CALLBACK_PSEUDO_PARAMETERS[detectedCallback];
            if (pseudoParams && Object.keys(pseudoParams).length > 0) {
                // Object.entries loses the key/value typing, so we re-assert it here.
                for (const [paramName, paramType] of Object.entries(pseudoParams as Record<string, string>)) {
                    (trackingState.instanceDefinitions as Record<string, string>)[paramName] = paramType;
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
        const constantMatch = line.match(DEFINITION_PATTERNS.DEFINE_CONSTANT);
        if (constantMatch) {
            const constName = constantMatch[1];
            if (!trackingState.definedConstants.has(constName)) {
                trackingState.definedConstants.add(constName);
            }
            
            // Try to infer type from the value in defineConstant("NAME", value)
            const constValueMatch = line.match(DEFINITION_PATTERNS.CONSTANT_VALUE);
            if (constValueMatch) {
                // Single-line case: value is on the same line
                const valueExpr = constValueMatch[1].trim();
                const cleanValue = valueExpr.replace(/\)\s*$/, '').trim();
                const inferredType = inferTypeFromExpression(cleanValue);
                if (inferredType) {
                    (trackingState.instanceDefinitions as Record<string, string>)[constName] = inferredType;
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
                            (trackingState.instanceDefinitions as Record<string, string>)[constName] = inferredType;
                        }
                        break;
                    } else {
                        const inferredType = inferTypeFromExpression(nextLine);
                        if (inferredType) {
                            (trackingState.instanceDefinitions as Record<string, string>)[constName] = inferredType;
                            break;
                        }
                    }
                }
            }
        }
        
        // Track type definitions
        let typeMatch: RegExpMatchArray | null;
        
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
            const subpopName = typeMatch[INDICES.SECOND];
            if (!trackingState.definedSubpopulations.has(subpopName)) {
                trackingState.definedSubpopulations.add(subpopName);
            }
            (trackingState.instanceDefinitions as Record<string, string>)[subpopName] = CLASS_NAMES.SUBPOPULATION;
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
                const blockId = scriptMatch[INDICES.SECOND];
                if (!trackingState.definedScriptBlocks.has(blockId)) {
                    trackingState.definedScriptBlocks.add(blockId);
                }
                (trackingState.instanceDefinitions as Record<string, string>)[blockId] = CLASS_NAMES.SLIMEIDOS_BLOCK;
                break; // Only match one pattern per line
            }
        }
        
        // Track instance definitions and assignments
        // Track instance definitions (new ClassName)
        if ((typeMatch = line.match(patterns.instance)) !== null) {
            (trackingState.instanceDefinitions as Record<string, string>)[typeMatch[1]] = typeMatch[2];
        }
        
        // Track type inference from assignments
        if ((typeMatch = line.match(patterns.assignment)) !== null) {
            const rhs = typeMatch[2].trim();
            const inferredType = inferTypeFromExpression(rhs);
            if (inferredType) {
                (trackingState.instanceDefinitions as Record<string, string>)[typeMatch[1]] = inferredType;
            }
        }
    });
    
    return trackingState;
}
