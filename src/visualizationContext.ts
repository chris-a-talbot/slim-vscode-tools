/**
 * visualizationContext.ts
 * 
 * Analyzes SLiM scripts to detect populations, mutations, species, etc.
 * Generates context-aware visualization code based on what's found.
 */

export interface SimulationContext {
    // Core entities detected in the script
    species: string[];              // e.g., ['species1', 'species2']
    subpopulations: string[];       // e.g., ['p1', 'p2', 'p3']
    mutationTypes: string[];        // e.g., ['m1', 'm2']
    genomicElementTypes: string[];  // e.g., ['g1', 'g2']
    interactionTypes: string[];     // e.g., ['i1']
    
    // Simulation properties
    modelType: 'WF' | 'nonWF' | null;
    isMultiSpecies: boolean;
    
    // Dynamic events tracking
    subpopulationEvents: Array<{
        generation: string;  // e.g., "1", "1000:2000", "late"
        action: 'add' | 'remove';
        subpop: string;
    }>;
}

/**
 * Analyzes a SLiM script and extracts simulation context
 * 
 * @param scriptContent - Full text content of the .slim file
 * @returns SimulationContext object with all detected entities
 */
export function analyzeSimulationContext(scriptContent: string): SimulationContext {
    const context: SimulationContext = {
        species: [],
        subpopulations: [],
        mutationTypes: [],
        genomicElementTypes: [],
        interactionTypes: [],
        modelType: null,
        isMultiSpecies: false,
        subpopulationEvents: []
    };
    
    const lines = scriptContent.split('\n');
    
    // Track callback context for generation detection
    let currentCallback = '';
    let braceDepth = 0;
    
    lines.forEach((line) => {
        // Skip comments
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//')) return;
        
        // Track callback context
        const callbackMatch = line.match(/^(\d+(?::\d+)?|initialize|early|late|fitness|mateChoice|modifyChild|recombination|mutation)\s*\(/);
        if (callbackMatch) {
            currentCallback = callbackMatch[1];
            braceDepth = 0;
        }
        
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        
        if (braceDepth <= 0) {
            currentCallback = '';
        }
        
        // ===== DETECTION PATTERNS =====
        
        // Detect model type
        const modelTypeMatch = line.match(/initializeSLiMModelType\s*\(\s*["'](\w+)["']/);
        if (modelTypeMatch) {
            context.modelType = modelTypeMatch[1] as 'WF' | 'nonWF';
        }
        
        // Detect species (multi-species model)
        const speciesMatch = line.match(/species\s+(\w+)\s+initialize/);
        if (speciesMatch) {
            const speciesName = speciesMatch[1];
            if (!context.species.includes(speciesName)) {
                context.species.push(speciesName);
                context.isMultiSpecies = true;
            }
        }
        
        // Detect mutation types: initializeMutationType("m1", ...)
        if (line.includes('initializeMutationType')) {
            // Handle both quoted and unquoted IDs
            const mutTypeMatch = line.match(/initializeMutationType\s*\(\s*["']?([a-zA-Z]\w*)["']?/);
            if (mutTypeMatch && !context.mutationTypes.includes(mutTypeMatch[1])) {
                context.mutationTypes.push(mutTypeMatch[1]);
            }
        }
        
        // Detect genomic element types: initializeGenomicElementType("g1", ...)
        if (line.includes('initializeGenomicElementType')) {
            const genomicMatch = line.match(/initializeGenomicElementType\s*\(\s*["']?([a-zA-Z]\w*)["']?/);
            if (genomicMatch && !context.genomicElementTypes.includes(genomicMatch[1])) {
                context.genomicElementTypes.push(genomicMatch[1]);
            }
        }
        
        // Detect interaction types: initializeInteractionType("i1", ...)
        if (line.includes('initializeInteractionType')) {
            const interactionMatch = line.match(/initializeInteractionType\s*\(\s*["']?([a-zA-Z]\w*)["']?/);
            if (interactionMatch && !context.interactionTypes.includes(interactionMatch[1])) {
                context.interactionTypes.push(interactionMatch[1]);
            }
        }
        
        // Detect subpopulation additions
        if (line.includes('addSubpop')) {
            let generation = currentCallback || 'initialize';
            
            // Match quoted string: addSubpop("p1", ...)
            let subpopMatch = line.match(/addSubpop(?:Split)?\s*\(\s*["']([a-zA-Z]\w*)["']/);
            if (subpopMatch) {
                const subpop = subpopMatch[1];
                if (!context.subpopulations.includes(subpop)) {
                    context.subpopulations.push(subpop);
                    context.subpopulationEvents.push({
                        generation,
                        action: 'add',
                        subpop
                    });
                }
            }
            
            // Match numeric ID: addSubpop(1, ...) -> creates p1
            subpopMatch = line.match(/addSubpop(?:Split)?\s*\(\s*(\d+)\s*,/);
            if (subpopMatch) {
                const subpop = `p${subpopMatch[1]}`;
                if (!context.subpopulations.includes(subpop)) {
                    context.subpopulations.push(subpop);
                    context.subpopulationEvents.push({
                        generation,
                        action: 'add',
                        subpop
                    });
                }
            }
        }
        
        // Detect subpopulation removal: p1.setSubpopulationSize(0)
        if (line.match(/\.setSubpopulationSize\s*\(\s*0\s*\)/)) {
            const subpopMatch = line.match(/([a-zA-Z]\w+)\.setSubpopulationSize/);
            if (subpopMatch) {
                context.subpopulationEvents.push({
                    generation: currentCallback || 'unknown',
                    action: 'remove',
                    subpop: subpopMatch[1]
                });
            }
        }
    });
    
    return context;
}

/**
 * Generates SLiM code that tracks and outputs visualization data
 * 
 * The generated code is a late() callback that:
 * - Collects data for all detected entities
 * - Packages it into a Dictionary
 * - Outputs as JSON via catn()
 * 
 * @param context - SimulationContext from analyzeSimulationContext()
 * @returns String of SLiM code to inject
 */
export function generateContextAwareVisualizationCode(context: SimulationContext): string {
    const parts: string[] = [];
    
    // Header comment
    parts.push(`
// ============================================================================
// AUTO-INJECTED CONTEXT-AWARE VISUALIZATION CODE
// ============================================================================
// This code was automatically generated by the SLiM VSCode extension.
// It tracks simulation state and outputs data for real-time visualization.
//
// Detected entities:
//   - ${context.subpopulations.length} subpopulation(s): ${context.subpopulations.join(', ') || 'none'}
//   - ${context.mutationTypes.length} mutation type(s): ${context.mutationTypes.join(', ') || 'none'}
//   - ${context.genomicElementTypes.length} genomic element type(s): ${context.genomicElementTypes.join(', ') || 'none'}
//   - ${context.interactionTypes.length} interaction type(s): ${context.interactionTypes.join(', ') || 'none'}
//   - Model type: ${context.modelType || 'default (WF)'}
${context.isMultiSpecies ? `//   - Multi-species model with ${context.species.length} species: ${context.species.join(', ')}` : ''}
// ============================================================================
`);
    
    // Start of late() callback - use 1: to cover all generations
    parts.push(`
1: late() {
    // For WF models, we need to recalculate fitness in late() events
    ${context.modelType === 'WF' || context.modelType === null ? 'sim.recalculateFitness();' : ''}
    
    // Create root data structure
    vizData = Dictionary();
    vizData.setValue("generation", sim.cycle);
    vizData.setValue("modelType", "${context.modelType || 'WF'}");
    vizData.setValue("isMultiSpecies", ${context.isMultiSpecies ? 'T' : 'F'});
`);
    
    // ===== SUBPOPULATION TRACKING =====
    if (context.subpopulations.length > 0) {
        parts.push(`    
    // ========================================
    // Track subpopulations
    // ========================================
    popData = Dictionary();
`);
        
        context.subpopulations.forEach(subpop => {
            parts.push(`
    // Subpopulation: ${subpop}
    if (exists("${subpop}")) {
        popData.setValue("${subpop}_size", ${subpop}.individualCount);
        
        // Calculate mean fitness (handle empty population)
        if (${subpop}.individualCount > 0) {
            fitness_values = ${subpop}.cachedFitness(NULL);
            popData.setValue("${subpop}_fitness", mean(fitness_values));
        } else {
            popData.setValue("${subpop}_fitness", 0.0);
        }
    } else {
        // Population doesn't exist yet (will be added later)
        popData.setValue("${subpop}_size", 0);
        popData.setValue("${subpop}_fitness", 0.0);
    }
`);
        });
        
        parts.push(`
    vizData.setValue("populations", popData);
`);
    }
    
    // ===== MUTATION TRACKING =====
    if (context.mutationTypes.length > 0) {
        parts.push(`
    
    // ========================================
    // Track mutations
    // ========================================
    mutData = Dictionary();
`);
        
        context.mutationTypes.forEach(mutType => {
            parts.push(`
    // Mutation type: ${mutType}
    ${mutType}_muts = sim.mutationsOfType(${mutType});
    mutData.setValue("${mutType}_count", size(${mutType}_muts));
    
    if (size(${mutType}_muts) > 0) {
        // Calculate mean frequency across all populations
        mutData.setValue("${mutType}_freq", mean(sim.mutationFrequencies(NULL, ${mutType}_muts)));
    } else {
        mutData.setValue("${mutType}_freq", 0.0);
    }
`);
        });
        
        parts.push(`
    vizData.setValue("mutations", mutData);
`);
    }
    
    // ===== SPECIES TRACKING (Multi-species models) =====
    if (context.isMultiSpecies && context.species.length > 0) {
        parts.push(`
    
    // ========================================
    // Track species (multi-species model)
    // ========================================
    speciesData = Dictionary();
`);
        
        context.species.forEach(species => {
            parts.push(`
    // Species: ${species}
    if (exists("${species}")) {
        speciesData.setValue("${species}_active", ${species}.active);
        speciesData.setValue("${species}_cycle", ${species}.cycle);
    }
`);
        });
        
        parts.push(`
    vizData.setValue("species", speciesData);
`);
    }
    
    // ===== OUTPUT =====
    parts.push(`
    
    // ========================================
    // Output data for visualization
    // ========================================
    // Format: VIZ_DATA::<JSON>
    catn("VIZ_DATA::" + vizData.serialize("json"));
}
`);
    
    // Footer
    parts.push(`
// ============================================================================
// END AUTO-INJECTED VISUALIZATION CODE
// ============================================================================
`);
    
    return parts.join('');
}

/**
 * Checks if a script already has visualization code injected
 * Prevents double-injection if user runs visualization twice
 */
export function hasVisualizationCode(scriptContent: string): boolean {
    return scriptContent.includes('AUTO-INJECTED CONTEXT-AWARE VISUALIZATION CODE') ||
           scriptContent.includes('VIZ_DATA::');
}

/**
 * Validates that the simulation context makes sense
 * Returns array of warnings (empty if all good)
 */
export function validateContext(context: SimulationContext): string[] {
    const warnings: string[] = [];
    
    if (context.subpopulations.length === 0) {
        warnings.push('No subpopulations detected. Visualization will be empty.');
    }
    
    if (context.mutationTypes.length === 0) {
        warnings.push('No mutation types detected. Mutation tracking will be unavailable.');
    }
    
    if (context.isMultiSpecies && context.species.length < 2) {
        warnings.push('Multi-species model detected but only found ' + context.species.length + ' species.');
    }
    
    return warnings;
}

