// ============================================================================
// INITIALIZATION RULES VALIDATION
// Validates initialization function order and required components
// ============================================================================

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utils/diagnostics';

/**
 * Tracks initialization function calls and their order
 */
interface InitializationTracking {
    modelTypeLine: number | null;
    slimOptionsLine: number | null;
    chromosomeLine: number | null;
    mutationTypeCalled: boolean;
    genomicElementTypeCalled: boolean;
    genomicElementCalled: boolean;
    mutationRateCalled: boolean;
    recombinationRateCalled: boolean;
    modelType: 'WF' | 'nonWF' | null;
    hasInitializeCallback: boolean;
    hasReproductionCallback: boolean;
    initializeCallbackLines: number[];
    reproductionCallbackLines: number[];
}

/**
 * Validates initialization rules across the entire document
 * @param _text - The full document text (unused, for consistency with other validators)
 * @param lines - Array of lines
 * @returns Array of diagnostic objects
 */
export function validateInitializationRules(_text: string, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const tracking: InitializationTracking = {
        modelTypeLine: null,
        slimOptionsLine: null,
        chromosomeLine: null,
        mutationTypeCalled: false,
        genomicElementTypeCalled: false,
        genomicElementCalled: false,
        mutationRateCalled: false,
        recombinationRateCalled: false,
        modelType: null,
        hasInitializeCallback: false,
        hasReproductionCallback: false,
        initializeCallbackLines: [],
        reproductionCallbackLines: []
    };
    
    // First pass: track all initialization calls and callbacks
    trackInitializationCalls(lines, tracking);
    
    // Validate initialization order
    diagnostics.push(...validateInitializationOrder(tracking, lines));
    
    // Validate required genetic components
    diagnostics.push(...validateRequiredGeneticComponents(tracking, lines));
    
    // Validate nonWF requirements
    diagnostics.push(...validateNonWFRequirements(tracking, lines));
    
    // Validate that sim/community aren't used in initialize()
    diagnostics.push(...validateInitializeScope(lines, tracking));
    
    return diagnostics;
}

/**
 * Tracks initialization function calls throughout the document
 */
function trackInitializationCalls(lines: string[], tracking: InitializationTracking): void {
    let inInitializeCallback = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Track callback definitions (these are global, not just in initialize)
        if (/\binitialize\s*\(/.test(line)) {
            tracking.hasInitializeCallback = true;
            tracking.initializeCallbackLines.push(i);
            inInitializeCallback = true;
        }
        
        // Track reproduction callback globally (it's defined outside initialize)
        // Must be a callback definition (optionally with generation/species prefix), not in a comment
        if (/^\s*(?:species\s+\w+\s+)?(?:s\d+\s+)?(?:\d+(?::\d+)?\s+)?reproduction\s*\(/.test(line)) {
            tracking.hasReproductionCallback = true;
            tracking.reproductionCallbackLines.push(i);
        }
        
        // Exit callback when we hit closing brace at start of line
        if (/^\s*\}/.test(line)) {
            inInitializeCallback = false;
        }
        
        // Skip non-initialize callbacks for tracking initialization calls
        if (!inInitializeCallback) continue;
        
        // Track specific initialization calls
        if (/initializeSLiMModelType\s*\(/.test(line)) {
            tracking.modelTypeLine = i;
            const match = line.match(/initializeSLiMModelType\s*\(\s*["'](\w+)["']/);
            if (match && (match[1] === 'WF' || match[1] === 'nonWF')) {
                tracking.modelType = match[1] as 'WF' | 'nonWF';
            }
        }
        if (/initializeSLiMOptions\s*\(/.test(line)) {
            tracking.slimOptionsLine = i;
        }
        if (/initializeChromosome\s*\(/.test(line)) {
            tracking.chromosomeLine = i;
        }
        if (/initializeMutationType/.test(line)) {
            tracking.mutationTypeCalled = true;
        }
        if (/initializeGenomicElementType\s*\(/.test(line)) {
            tracking.genomicElementTypeCalled = true;
        }
        if (/initializeGenomicElement\s*\(/.test(line)) {
            tracking.genomicElementCalled = true;
        }
        if (/initializeMutationRate\s*\(/.test(line)) {
            tracking.mutationRateCalled = true;
        }
        if (/initializeRecombinationRate\s*\(/.test(line)) {
            tracking.recombinationRateCalled = true;
        }
    }
}

/**
 * Validates the order of initialization function calls
 */
function validateInitializationOrder(tracking: InitializationTracking, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Check: initializeSLiMModelType must be first
    if (tracking.modelTypeLine !== null && tracking.slimOptionsLine !== null) {
        if (tracking.slimOptionsLine < tracking.modelTypeLine) {
            const line = lines[tracking.slimOptionsLine];
            const col = line.indexOf('initializeSLiMOptions');
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                tracking.slimOptionsLine,
                col,
                col + 'initializeSLiMOptions'.length,
                'initializeSLiMOptions() must be called after initializeSLiMModelType()'
            ));
        }
    }
    
    // Check: initializeSLiMOptions must be second (after modelType, before everything else)
    if (tracking.slimOptionsLine !== null && tracking.chromosomeLine !== null) {
        if (tracking.chromosomeLine < tracking.slimOptionsLine) {
            const line = lines[tracking.chromosomeLine];
            const col = line.indexOf('initializeChromosome');
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                tracking.chromosomeLine,
                col,
                col + 'initializeChromosome'.length,
                'initializeChromosome() must be called after initializeSLiMOptions()'
            ));
        }
    }
    
    return diagnostics;
}

/**
 * Validates that required genetic components are present
 */
function validateRequiredGeneticComponents(tracking: InitializationTracking, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // Skip if no initialize callback exists
    if (!tracking.hasInitializeCallback) {
        return diagnostics;
    }
    
    // Get the first initialize callback line for error reporting
    const initLine = tracking.initializeCallbackLines[0] || 0;
    
    // Warn about missing genetic components (these are required for genetics models)
    if (!tracking.mutationTypeCalled) {
        const line = lines[initLine];
        const col = line.indexOf('initialize');
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            initLine,
            col,
            col + 'initialize'.length,
            'Missing initializeMutationType() - required for genetics models'
        ));
    }
    
    if (!tracking.genomicElementTypeCalled) {
        const line = lines[initLine];
        const col = line.indexOf('initialize');
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            initLine,
            col,
            col + 'initialize'.length,
            'Missing initializeGenomicElementType() - required for genetics models'
        ));
    }
    
    if (!tracking.genomicElementCalled) {
        const line = lines[initLine];
        const col = line.indexOf('initialize');
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            initLine,
            col,
            col + 'initialize'.length,
            'Missing initializeGenomicElement() - required for genetics models'
        ));
    }
    
    if (!tracking.mutationRateCalled) {
        const line = lines[initLine];
        const col = line.indexOf('initialize');
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            initLine,
            col,
            col + 'initialize'.length,
            'Missing initializeMutationRate() - required for genetics models (unless nucleotide-based)'
        ));
    }
    
    if (!tracking.recombinationRateCalled) {
        const line = lines[initLine];
        const col = line.indexOf('initialize');
        diagnostics.push(createDiagnostic(
            DiagnosticSeverity.Warning,
            initLine,
            col,
            col + 'initialize'.length,
            'Missing initializeRecombinationRate() - required for genetics models'
        ));
    }
    
    return diagnostics;
}

/**
 * Validates nonWF-specific requirements
 */
function validateNonWFRequirements(tracking: InitializationTracking, lines: string[]): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    // If reproduction() callback exists without nonWF declaration, warn
    if (tracking.hasReproductionCallback && tracking.modelType === 'WF') {
        if (tracking.reproductionCallbackLines.length > 0) {
            const line = lines[tracking.reproductionCallbackLines[0]];
            const col = line.indexOf('reproduction');
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                tracking.reproductionCallbackLines[0],
                col,
                col + 'reproduction'.length,
                'reproduction() callback requires nonWF model (call initializeSLiMModelType("nonWF"))'
            ));
        }
    }
    
    return diagnostics;
}

/**
 * Validates that sim and community are not used in initialize() callbacks
 */
function validateInitializeScope(lines: string[], tracking: InitializationTracking): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    
    if (!tracking.hasInitializeCallback) {
        return diagnostics;
    }
    
    let inInitializeCallback = false;
    let braceDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip comments
        if (line.trim().startsWith('//')) continue;
        
        // Track when we enter initialize()
        if (/\binitialize\s*\(.*\{/.test(line)) {
            inInitializeCallback = true;
            braceDepth = 1; // The opening brace is on the same line
            continue;
        } else if (/\binitialize\s*\(/.test(line)) {
            inInitializeCallback = true;
            braceDepth = 0; // Opening brace might be on next line
            continue;
        }
        
        if (inInitializeCallback) {
            // Track brace depth
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;
            
            // Exit when we've closed all braces
            if (braceDepth <= 0) {
                inInitializeCallback = false;
                continue;
            }
        }
        
        if (!inInitializeCallback) continue;
        
        // Check for sim usage (but not in comments)
        if (/\bsim\b/.test(line) && !/^\s*\/\//.test(line)) {
            const col = line.indexOf('sim');
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                i,
                col,
                col + 3,
                'The "sim" symbol is not defined within initialize() callbacks'
            ));
        }
        
        // Check for community usage (but not in comments)
        if (/\bcommunity\b/.test(line) && !/^\s*\/\//.test(line)) {
            const col = line.indexOf('community');
            diagnostics.push(createDiagnostic(
                DiagnosticSeverity.Error,
                i,
                col,
                col + 9,
                'The "community" symbol is not defined within initialize() callbacks'
            ));
        }
    }
    
    return diagnostics;
}

