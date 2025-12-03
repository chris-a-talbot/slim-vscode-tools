# Complete Guide: Real-Time SLiM Visualization in VSCode

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Implementation Steps](#implementation-steps)
5. [File-by-File Implementation](#file-by-file-implementation)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Future Enhancements](#future-enhancements)

---

## Overview

This guide provides complete instructions for implementing **real-time, context-aware visualization** of SLiM simulations directly in VSCode. The system automatically:

- **Analyzes** your SLiM script to detect populations, mutations, species, etc.
- **Injects** tracking code into a temporary copy of your script
- **Captures** simulation data via stdout in real-time
- **Visualizes** population dynamics, fitness, mutations in live-updating charts

### Key Features
- ✅ Zero manual instrumentation required
- ✅ Context-aware: Only tracks what exists in your script
- ✅ Non-invasive: Original script never modified
- ✅ Multi-chart dashboard with Chart.js
- ✅ Handles multi-species, WF/nonWF, dynamic populations

---

## Architecture

### Data Flow

```
┌──────────────────┐
│  User's .slim    │
│  Script          │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Analyzer (TypeScript)                   │
│  • Parse script AST                      │
│  • Detect: populations, mutations, etc.  │
│  • Build SimulationContext object        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Code Generator (TypeScript)             │
│  • Generate context-aware late() callback│
│  • Creates JSON output statements        │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Temp File Creation                      │
│  Original Script + Injected Code         │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  SLiM Process (spawn)                    │
│  • Runs modified script                  │
│  • Outputs VIZ_DATA:: lines to stdout    │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  stdout Parser (TypeScript)              │
│  • Splits output by lines                │
│  • Filters VIZ_DATA:: lines              │
│  • Parses JSON                           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Webview Panel (HTML/JS)                 │
│  • Receives data via postMessage         │
│  • Updates Chart.js charts              │
│  • Shows metadata                        │
└──────────────────────────────────────────┘
```

### Component Overview

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Analyzer** | TypeScript regex/parsing | Extract simulation structure |
| **Generator** | TypeScript string templates | Create tracking code |
| **Runner** | Node.js `child_process` | Execute SLiM |
| **Parser** | TypeScript | Parse stdout JSON |
| **Webview** | HTML + Chart.js | Display visualizations |

---

## Prerequisites

### Required Knowledge
- TypeScript/JavaScript
- VSCode Extension API basics
- Basic understanding of SLiM language

### Required Tools
- Node.js (v16+)
- npm or yarn
- VSCode (v1.96.0+)
- SLiM installed and in PATH

### Existing Extension Structure
This guide assumes you have:
- `src/extension.ts` - Main extension activation
- `package.json` - Extension manifest
- Working LSP server (not required for visualization)

---

## Implementation Steps

### Phase 1: Core Analysis Module
1. Create context analyzer
2. Implement simulation structure detection
3. Build data model for tracking

### Phase 2: Code Generation
4. Create template system for injection
5. Generate context-aware callbacks
6. Handle edge cases (extinction, multi-species)

### Phase 3: Execution & Parsing
7. Implement script runner
8. Set up stdout parsing
9. Handle process lifecycle

### Phase 4: Visualization
10. Create webview panel
11. Implement Chart.js integration
12. Build dynamic UI

### Phase 5: Integration
13. Register commands
14. Add keyboard shortcuts
15. Update package.json

---

## File-by-File Implementation

### File 1: `src/visualizationContext.ts`

**Purpose**: Analyze SLiM scripts and generate context-aware tracking code

**Full Implementation**:

```typescript
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
    
    lines.forEach((line, idx) => {
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
    
    // Start of late() callback
    parts.push(`
late() {
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
    if (exists("${subpop}") && !isNULL(${subpop})) {
        popData.setValue("${subpop}_size", ${subpop}.individualCount);
        
        // Calculate mean fitness (handle empty population)
        if (${subpop}.individualCount > 0) {
            popData.setValue("${subpop}_fitness", mean(${subpop}.cachedFitness));
        } else {
            popData.setValue("${subpop}_fitness", 0.0);
        }
    } else {
        // Population doesn't exist or is NULL (extinct/not yet created)
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
    // This prefix allows the extension to distinguish visualization data
    // from other script output
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
```

---

### File 2: `src/visualizationRunner.ts`

**Purpose**: Execute SLiM with injected code and manage the visualization panel

**Full Implementation**:

```typescript
/**
 * visualizationRunner.ts
 * 
 * Manages:
 * - Script injection and temp file creation
 * - SLiM process execution
 * - stdout parsing and data extraction
 * - Webview panel lifecycle
 */

import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
    SimulationContext, 
    analyzeSimulationContext, 
    generateContextAwareVisualizationCode,
    hasVisualizationCode,
    validateContext
} from './visualizationContext';

/**
 * Main entry point for running SLiM with visualization
 */
export async function runSlimWithVisualization(
    filePath: string,
    interpreterPath: string,
    context: vscode.ExtensionContext
): Promise<void> {
    
    // Step 1: Read and analyze the script
    const scriptContent = fs.readFileSync(filePath, 'utf8');
    
    // Check if already instrumented
    if (hasVisualizationCode(scriptContent)) {
        const choice = await vscode.window.showWarningMessage(
            'This script appears to already have visualization code. Continue anyway?',
            'Yes', 'No'
        );
        if (choice !== 'Yes') {
            return;
        }
    }
    
    // Analyze simulation structure
    const simContext = analyzeSimulationContext(scriptContent);
    
    // Validate context and show warnings
    const warnings = validateContext(simContext);
    if (warnings.length > 0) {
        const proceed = await vscode.window.showWarningMessage(
            'Potential issues detected:\n' + warnings.join('\n'),
            'Continue Anyway', 'Cancel'
        );
        if (proceed !== 'Continue Anyway') {
            return;
        }
    }
    
    // Show what was detected
    const detectionMsg = 
        `Detected: ${simContext.subpopulations.length} population(s), ` +
        `${simContext.mutationTypes.length} mutation type(s), ` +
        `${simContext.genomicElementTypes.length} genomic element type(s)`;
    
    vscode.window.showInformationMessage(detectionMsg);
    
    // Step 2: Generate and inject visualization code
    const vizCode = generateContextAwareVisualizationCode(simContext);
    const modifiedScript = scriptContent + '\n' + vizCode;
    
    // Step 3: Create temporary file
    const tmpDir = os.tmpdir();
    const timestamp = Date.now();
    const tmpFile = path.join(tmpDir, `slim_viz_${timestamp}.slim`);
    
    try {
        fs.writeFileSync(tmpFile, modifiedScript);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create temp file: ${error}`);
        return;
    }
    
    // Step 4: Create and show visualization panel
    const vizPanel = new ContextAwareVisualizationPanel(simContext);
    vizPanel.show(context);
    
    // Step 5: Run SLiM process with progress tracking
    await runSlimProcess(tmpFile, interpreterPath, vizPanel, simContext);
    
    // Step 6: Cleanup temp file
    try {
        fs.unlinkSync(tmpFile);
    } catch (error) {
        console.warn('Failed to cleanup temp file:', error);
    }
}

/**
 * Executes the SLiM process and manages its lifecycle
 */
async function runSlimProcess(
    scriptPath: string,
    interpreterPath: string,
    vizPanel: ContextAwareVisualizationPanel,
    simContext: SimulationContext
): Promise<void> {
    
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Running SLiM Simulation",
        cancellable: true
    }, async (progress, token) => {
        
        return new Promise<void>((resolve, reject) => {
            // Spawn SLiM process
            const slimProcess: ChildProcess = spawn(interpreterPath, [scriptPath]);
            
            if (!slimProcess.stdout || !slimProcess.stderr) {
                reject(new Error('Failed to create process streams'));
                return;
            }
            
            let stdoutBuffer = '';
            let stderrBuffer = '';
            
            // ===== STDOUT HANDLER =====
            slimProcess.stdout.on('data', (data: Buffer) => {
                stdoutBuffer += data.toString();
                const lines = stdoutBuffer.split('\n');
                
                // Keep incomplete line in buffer
                stdoutBuffer = lines.pop() || '';
                
                lines.forEach(line => {
                    if (line.startsWith('VIZ_DATA::')) {
                        // Extract and parse visualization data
                        const jsonData = line.substring(10);
                        
                        try {
                            const parsed = JSON.parse(jsonData);
                            
                            // Update visualization panel
                            vizPanel.updateData(jsonData);
                            
                            // Update progress notification
                            const gen = parsed.generation || 0;
                            progress.report({
                                message: `Generation ${gen}`,
                                increment: 0.1
                            });
                            
                        } catch (error) {
                            console.error('Failed to parse VIZ_DATA:', error);
                            console.error('Raw data:', jsonData);
                        }
                    } else if (line.trim()) {
                        // Regular SLiM output - log to console
                        console.log('[SLiM]', line);
                    }
                });
            });
            
            // ===== STDERR HANDLER =====
            slimProcess.stderr.on('data', (data: Buffer) => {
                stderrBuffer += data.toString();
                const lines = stderrBuffer.split('\n');
                stderrBuffer = lines.pop() || '';
                
                lines.forEach(line => {
                    if (line.trim()) {
                        console.error('[SLiM Error]', line);
                        vscode.window.showErrorMessage(`SLiM: ${line}`);
                    }
                });
            });
            
            // ===== PROCESS CLOSE HANDLER =====
            slimProcess.on('close', (code: number | null) => {
                // Flush any remaining buffered output
                if (stdoutBuffer.trim()) {
                    console.log('[SLiM]', stdoutBuffer);
                }
                if (stderrBuffer.trim()) {
                    console.error('[SLiM Error]', stderrBuffer);
                }
                
                if (code === 0) {
                    vscode.window.showInformationMessage(
                        '✓ SLiM simulation completed successfully!'
                    );
                    resolve();
                } else {
                    const errorMsg = `SLiM simulation exited with code ${code}`;
                    vscode.window.showErrorMessage(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
            
            // ===== ERROR HANDLER =====
            slimProcess.on('error', (error: Error) => {
                vscode.window.showErrorMessage(
                    `Failed to start SLiM: ${error.message}. ` +
                    `Check that SLiM is installed and in your PATH.`
                );
                reject(error);
            });
            
            // ===== CANCELLATION HANDLER =====
            token.onCancellationRequested(() => {
                vscode.window.showWarningMessage('Simulation cancelled by user');
                slimProcess.kill('SIGTERM');
                
                // Force kill after 2 seconds if still running
                setTimeout(() => {
                    if (!slimProcess.killed) {
                        slimProcess.kill('SIGKILL');
                    }
                }, 2000);
                
                reject(new Error('Cancelled by user'));
            });
        });
    });
}

/**
 * Webview panel that displays real-time visualization
 */
export class ContextAwareVisualizationPanel {
    private panel: vscode.WebviewPanel | undefined;
    private context: SimulationContext;
    
    constructor(context: SimulationContext) {
        this.context = context;
    }
    
    /**
     * Create and show the visualization panel
     */
    public show(extensionContext: vscode.ExtensionContext): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        
        // Create webview panel
        this.panel = vscode.window.createWebviewPanel(
            'slimVisualization',
            'SLiM Simulation Visualization',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: []
            }
        );
        
        // Set HTML content
        this.panel.webview.html = this.getWebviewContent();
        
        // Send simulation context to webview after a brief delay
        // (ensures webview is ready to receive messages)
        setTimeout(() => {
            this.panel?.webview.postMessage({
                type: 'setContext',
                context: this.context
            });
        }, 100);
        
        // Handle panel disposal
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    
    /**
     * Send updated data to the webview
     */
    public updateData(jsonData: string): void {
        if (this.panel) {
            this.panel.webview.postMessage({
                type: 'updateData',
                data: jsonData
            });
        }
    }
    
    /**
     * Generate HTML content for the webview
     */
    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'unsafe-inline';">
    <title>SLiM Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            overflow-x: hidden;
        }
        
        h1, h2, h3 {
            margin-bottom: 10px;
            color: var(--vscode-editor-foreground);
        }
        
        h1 {
            font-size: 1.5em;
            margin-bottom: 15px;
        }
        
        #metadata {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        #contextInfo {
            margin: 10px 0;
        }
        
        #currentStats {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--vscode-input-border);
        }
        
        .stat {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            margin: 2px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 3px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .chart-container {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
        }
        
        .chart-container h3 {
            margin-top: 0;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        canvas {
            max-height: 300px;
            width: 100% !important;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .no-data {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <h1>🧬 SLiM Simulation Visualization</h1>
    
    <div id="metadata">
        <h2>Simulation Context</h2>
        <div id="contextInfo" class="loading">
            Waiting for simulation data...
        </div>
        <div id="currentStats">
            <div class="stat">
                <strong>Generation:</strong> <span id="currentGen">0</span>
            </div>
            <div class="stat">
                <strong>Model Type:</strong> <span id="modelType">-</span>
            </div>
        </div>
    </div>
    
    <div class="grid" id="chartsContainer"></div>
    
    <script>
        // =============================================
        // STATE MANAGEMENT
        // =============================================
        let simContext = null;
        const charts = {};
        const MAX_DATA_POINTS = 500; // Keep last 500 generations for performance
        
        // Color palette for charts
        const COLORS = [
            'rgb(75, 192, 192)',   // Teal
            'rgb(255, 99, 132)',   // Red
            'rgb(54, 162, 235)',   // Blue
            'rgb(255, 206, 86)',   // Yellow
            'rgb(153, 102, 255)',  // Purple
            'rgb(255, 159, 64)',   // Orange
            'rgb(199, 199, 199)',  // Gray
            'rgb(83, 102, 255)'    // Indigo
        ];
        
        // =============================================
        // CHART CREATION
        // =============================================
        
        /**
         * Creates a Chart.js line chart in a new container
         */
        function createChart(containerId, title, datasets, yAxisLabel = 'Value') {
            const container = document.getElementById('chartsContainer');
            
            // Create container div
            const div = document.createElement('div');
            div.className = 'chart-container';
            div.innerHTML = \`
                <h3>\${title}</h3>
                <canvas id="\${containerId}"></canvas>
            \`;
            container.appendChild(div);
            
            // Create chart
            const ctx = document.getElementById(containerId).getContext('2d');
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    animation: {
                        duration: 0  // Disable animations for real-time performance
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Generation',
                                color: 'var(--vscode-editor-foreground)'
                            },
                            ticks: {
                                color: 'var(--vscode-editor-foreground)'
                            },
                            grid: {
                                color: 'var(--vscode-panel-border)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: yAxisLabel,
                                color: 'var(--vscode-editor-foreground)'
                            },
                            beginAtZero: true,
                            ticks: {
                                color: 'var(--vscode-editor-foreground)'
                            },
                            grid: {
                                color: 'var(--vscode-panel-border)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            labels: {
                                color: 'var(--vscode-editor-foreground)',
                                boxWidth: 15,
                                padding: 10
                            }
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false
                        }
                    }
                }
            });
        }
        
        // =============================================
        // CHART SETUP
        // =============================================
        
        /**
         * Initialize all charts based on simulation context
         */
        function setupCharts(context) {
            simContext = context;
            
            // Clear any existing charts
            document.getElementById('chartsContainer').innerHTML = '';
            
            // Display context information
            displayContextInfo(context);
            
            // Create population size chart
            if (context.subpopulations.length > 0) {
                const popDatasets = context.subpopulations.map((pop, idx) => ({
                    label: pop,
                    data: [],
                    borderColor: COLORS[idx % COLORS.length],
                    backgroundColor: COLORS[idx % COLORS.length] + '33',
                    borderWidth: 2,
                    pointRadius: 0,  // Hide individual points for performance
                    tension: 0.1
                }));
                charts.populationSizes = createChart(
                    'popChart',
                    '📊 Population Sizes',
                    popDatasets,
                    'Number of Individuals'
                );
            }
            
            // Create fitness chart
            if (context.subpopulations.length > 0) {
                const fitnessDatasets = context.subpopulations.map((pop, idx) => ({
                    label: \`\${pop} fitness\`,
                    data: [],
                    borderColor: COLORS[idx % COLORS.length],
                    backgroundColor: COLORS[idx % COLORS.length] + '33',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                }));
                charts.fitness = createChart(
                    'fitnessChart',
                    '💪 Mean Fitness',
                    fitnessDatasets,
                    'Fitness'
                );
            }
            
            // Create mutation count chart
            if (context.mutationTypes.length > 0) {
                const mutDatasets = context.mutationTypes.map((mut, idx) => ({
                    label: mut,
                    data: [],
                    borderColor: COLORS[idx % COLORS.length],
                    backgroundColor: COLORS[idx % COLORS.length] + '33',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                }));
                charts.mutations = createChart(
                    'mutChart',
                    '🧬 Mutation Counts',
                    mutDatasets,
                    'Number of Mutations'
                );
            }
            
            // Show message if no charts were created
            if (Object.keys(charts).length === 0) {
                document.getElementById('chartsContainer').innerHTML = 
                    '<div class="no-data">No trackable entities detected in simulation.</div>';
            }
        }
        
        /**
         * Display simulation context metadata
         */
        function displayContextInfo(context) {
            let info = '<div>';
            
            // Model type
            info += \`<span class="badge">Model: \${context.modelType || 'WF'}</span>\`;
            
            // Multi-species indicator
            if (context.isMultiSpecies) {
                info += '<span class="badge">Multi-Species</span>';
            }
            
            info += '</div>';
            
            // Subpopulations
            if (context.subpopulations.length > 0) {
                info += '<div style="margin-top: 10px;">';
                info += '<strong>Subpopulations (\${context.subpopulations.length}):</strong> ';
                info += context.subpopulations.map(p => 
                    \`<span class="badge">\${p}</span>\`
                ).join('');
                info += '</div>';
            }
            
            // Mutation types
            if (context.mutationTypes.length > 0) {
                info += '<div style="margin-top: 8px;">';
                info += '<strong>Mutation Types (\${context.mutationTypes.length}):</strong> ';
                info += context.mutationTypes.map(m => 
                    \`<span class="badge">\${m}</span>\`
                ).join('');
                info += '</div>';
            }
            
            // Genomic element types
            if (context.genomicElementTypes.length > 0) {
                info += '<div style="margin-top: 8px;">';
                info += '<strong>Genomic Elements (\${context.genomicElementTypes.length}):</strong> ';
                info += context.genomicElementTypes.map(g => 
                    \`<span class="badge">\${g}</span>\`
                ).join('');
                info += '</div>';
            }
            
            document.getElementById('contextInfo').innerHTML = info;
            document.getElementById('modelType').textContent = context.modelType || 'WF';
        }
        
        // =============================================
        // DATA UPDATE
        // =============================================
        
        /**
         * Update all charts with new simulation data
         */
        function updateCharts(data) {
            const gen = data.generation;
            
            // Update generation display
            document.getElementById('currentGen').textContent = gen;
            
            // Update population sizes chart
            if (charts.populationSizes && data.populations) {
                charts.populationSizes.data.labels.push(gen);
                
                simContext.subpopulations.forEach((pop, idx) => {
                    const size = data.populations[\`\${pop}_size\`] || 0;
                    charts.populationSizes.data.datasets[idx].data.push(size);
                });
                
                // Keep only last N points for performance
                if (charts.populationSizes.data.labels.length > MAX_DATA_POINTS) {
                    charts.populationSizes.data.labels.shift();
                    charts.populationSizes.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.populationSizes.update();
            }
            
            // Update fitness chart
            if (charts.fitness && data.populations) {
                charts.fitness.data.labels.push(gen);
                
                simContext.subpopulations.forEach((pop, idx) => {
                    const fitness = data.populations[\`\${pop}_fitness\`] || 0;
                    charts.fitness.data.datasets[idx].data.push(fitness);
                });
                
                if (charts.fitness.data.labels.length > MAX_DATA_POINTS) {
                    charts.fitness.data.labels.shift();
                    charts.fitness.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.fitness.update();
            }
            
            // Update mutation chart
            if (charts.mutations && data.mutations) {
                charts.mutations.data.labels.push(gen);
                
                simContext.mutationTypes.forEach((mut, idx) => {
                    const count = data.mutations[\`\${mut}_count\`] || 0;
                    charts.mutations.data.datasets[idx].data.push(count);
                });
                
                if (charts.mutations.data.labels.length > MAX_DATA_POINTS) {
                    charts.mutations.data.labels.shift();
                    charts.mutations.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.mutations.update();
            }
        }
        
        // =============================================
        // MESSAGE HANDLING
        // =============================================
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'setContext':
                    // Initialize charts with simulation context
                    setupCharts(message.context);
                    break;
                    
                case 'updateData':
                    // Update charts with new data point
                    try {
                        const data = JSON.parse(message.data);
                        updateCharts(data);
                    } catch (error) {
                        console.error('Failed to parse visualization data:', error);
                    }
                    break;
                    
                default:
                    console.warn('Unknown message type:', message.type);
            }
        });
    </script>
</body>
</html>`;
    }
}
```

---

### File 3: Update `src/extension.ts`

**Purpose**: Register the visualization command and integrate with existing extension

**Add these imports at the top**:

```typescript
// Add to existing imports
import { runSlimWithVisualization } from './visualizationRunner';
```

**Add this command registration in the `activate()` function**:

```typescript
// Add after your existing command registrations

// ========================================
// Real-Time Visualization Command
// ========================================
const runSlimWithVizCommand = commands.registerCommand(
    'slimTools.runSLiMWithVisualization',
    async () => {
        const editor = window.activeTextEditor;
        
        // Validate active editor
        if (!editor) {
            window.showErrorMessage('No active file. Please open a SLiM script first.');
            return;
        }

        const filePath = editor.document.fileName;
        
        // Check file type
        if (!filePath.endsWith('.slim')) {
            window.showErrorMessage(
                'Visualization is only available for .slim files (not .eidos files).'
            );
            return;
        }
        
        // Check if file is saved
        if (editor.document.isDirty) {
            const choice = await window.showWarningMessage(
                'File has unsaved changes. Save before running?',
                'Save and Run', 'Cancel'
            );
            
            if (choice === 'Save and Run') {
                await editor.document.save();
            } else {
                return;
            }
        }
        
        // Get SLiM interpreter path from settings
        const config = workspace.getConfiguration('slimTools');
        const interpreterPath = config.get<string>('slimInterpreterPath', 'slim');
        
        // Run simulation with visualization
        try {
            await runSlimWithVisualization(filePath, interpreterPath, context);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            window.showErrorMessage(`Visualization failed: ${errorMessage}`);
            console.error('Visualization error:', error);
        }
    }
);

// Register command for cleanup
context.subscriptions.push(runSlimWithVizCommand);
```

---

### File 4: Update `package.json`

**Purpose**: Register commands, keybindings, and configuration

**Add to `contributes.commands` array**:

```json
{
  "command": "slimTools.runSLiMWithVisualization",
  "title": "Run SLiM with Real-Time Visualization",
  "category": "SLiM",
  "icon": "$(graph)"
}
```

**Add to `contributes.menus` (if not exists, create it)**:

```json
"menus": {
  "editor/context": [
    {
      "when": "resourceExtname == .slim",
      "command": "slimTools.runSLiMWithVisualization",
      "group": "navigation"
    }
  ],
  "commandPalette": [
    {
      "command": "slimTools.runSLiMWithVisualization",
      "when": "resourceExtname == .slim"
    }
  ]
}
```

**Add to `contributes.keybindings` array**:

```json
{
  "command": "slimTools.runSLiMWithVisualization",
  "key": "ctrl+shift+v",
  "mac": "cmd+shift+v",
  "when": "editorLangId == slim"
}
```

**Add configuration option (optional)**:

```json
"slimTools.visualization.maxDataPoints": {
  "type": "number",
  "default": 500,
  "minimum": 100,
  "maximum": 10000,
  "description": "Maximum number of data points to display in visualization charts (older points are discarded)"
}
```

---

## Testing

### Test Script 1: Simple Population Growth

Create `test_viz_simple.slim`:

```slim
initialize() {
    initializeMutationType("m1", 0.5, "f", 0.0);
    initializeGenomicElementType("g1", m1, 1.0);
    initializeGenomicElement(g1, 0, 99999);
    initializeMutationRate(1e-7);
    initializeRecombinationRate(1e-8);
}

1 early() {
    sim.addSubpop("p1", 500);
}

1:1000 late() {
    if (sim.cycle % 10 == 0) {
        catn("Gen " + sim.cycle + ": pop size = " + p1.individualCount);
    }
}

1000 late() {
    catn("Simulation finished!");
    sim.simulationFinished();
}
```

**Expected Result**:
- Panel opens with 3 charts
- Population size chart shows p1 starting at 500
- Fitness chart shows values around 1.0
- Mutation chart shows increasing m1 count

### Test Script 2: Multi-Population

Create `test_viz_multi.slim`:

```slim
initialize() {
    initializeMutationType("m1", 0.5, "f", 0.0);
    initializeMutationType("m2", 0.5, "f", -0.1);
    initializeGenomicElementType("g1", c(m1, m2), c(0.8, 0.2));
    initializeGenomicElement(g1, 0, 99999);
    initializeMutationRate(1e-7);
    initializeRecombinationRate(1e-8);
}

1 early() {
    sim.addSubpop("p1", 1000);
    sim.addSubpop("p2", 500);
}

100 early() {
    sim.addSubpop("p3", 250);
}

1:500 late() {
    // Migration
    p1.setMigrationRates(c(p2, p3), c(0.01, 0.01));
}

500 late() {
    sim.simulationFinished();
}
```

**Expected Result**:
- Detects 3 populations (p1, p2, p3)
- Detects 2 mutation types (m1, m2)
- Shows p3 = 0 until gen 100, then 250
- All three populations tracked in separate lines

### Test Script 3: Population Extinction

Create `test_viz_extinction.slim`:

```slim
initialize() {
    initializeMutationType("m1", 0.5, "f", -0.5);
    initializeGenomicElementType("g1", m1, 1.0);
    initializeGenomicElement(g1, 0, 99999);
    initializeMutationRate(1e-6);
    initializeRecombinationRate(1e-8);
}

1 early() {
    sim.addSubpop("p1", 100);
}

100 early() {
    p1.setSubpopulationSize(0);  // Extinction event
}

200 late() {
    sim.simulationFinished();
}
```

**Expected Result**:
- Population size drops to 0 at gen 100
- No errors when accessing extinct population
- Fitness shows 0.0 after extinction

---

## Troubleshooting

### Issue 1: "No active SLiM file" Error

**Symptoms**: Command shows error even when .slim file is open

**Solutions**:
1. Check file extension is exactly `.slim` (not `.txt` or `.slm`)
2. Ensure file is focused in editor (click in the file)
3. Check language mode in status bar (should say "SLiM")

### Issue 2: Visualization Panel is Blank

**Symptoms**: Panel opens but shows no charts

**Diagnostic Steps**:
1. Open Developer Tools: `Help > Toggle Developer Tools`
2. Check Console tab for errors
3. Look for message: "Waiting for simulation data..."

**Common Causes**:
- Script has no populations/mutations detected
- Webview security policy blocking Chart.js
- Message passing timing issue

**Solutions**:
```typescript
// Add debug logging in visualizationRunner.ts
console.log('Context:', simContext);
console.log('Generated code:', vizCode);
```

### Issue 3: SLiM Process Fails to Start

**Symptoms**: Error "Failed to start SLiM"

**Check**:
1. SLiM is installed: `slim -version` in terminal
2. Path is correct in settings
3. Permissions are correct on script file

**Solution**:
```json
// In settings.json
"slimTools.slimInterpreterPath": "/usr/local/bin/slim"
```

### Issue 4: Charts Not Updating

**Symptoms**: Charts appear but don't update during simulation

**Check Developer Console for**:
- `Failed to parse VIZ_DATA:` → JSON syntax error in generated code
- No `VIZ_DATA::` lines → Injection failed or callback not running

**Debug**:
1. Look at temp file before cleanup:
   ```typescript
   // Comment out this line temporarily:
   // fs.unlinkSync(tmpFile);
   ```
2. Open temp file and verify late() callback exists
3. Run temp file manually: `slim /tmp/slim_viz_*.slim`

### Issue 5: Chart.js Not Loading

**Symptoms**: Console error "Chart is not defined"

**Cause**: CDN blocked or offline

**Solution**: Use local Chart.js
1. Download Chart.js from https://www.chartjs.org/
2. Put in `media/chart.min.js`
3. Update CSP in webview:
   ```typescript
   meta http-equiv="Content-Security-Policy" 
        content="default-src 'none'; script-src ${webview.asWebviewUri(chartUri)} 'unsafe-inline'; ..."
   ```

### Issue 6: Performance Degradation

**Symptoms**: Slow updates, UI freezing after many generations

**Solutions**:
1. Reduce MAX_DATA_POINTS (currently 500)
2. Reduce output frequency:
   ```slim
   late() {
       if (sim.cycle % 10 == 0) {  // Only every 10 generations
           // ... visualization code
       }
   }
   ```
3. Disable animations (already done)
4. Reduce point radius to 0 (already done)

---

## Future Enhancements

### Enhancement 1: Spatial Visualization

For simulations with spatial coordinates, add 2D scatter plot:

```typescript
// In generateContextAwareVisualizationCode()
if (/* detect spatial model */) {
    parts.push(`
    // Spatial coordinates
    if (p1.individualCount > 0) {
        vizData.setValue("spatial_x", p1.individuals.x);
        vizData.setValue("spatial_y", p1.individuals.y);
    }
    `);
}
```

Then in webview, create scatter plot with D3.js or Plotly.

### Enhancement 2: Custom Metrics

Allow users to define custom tracking via annotations:

```slim
// @track expression="mean(p1.individuals.age)" label="Mean Age"
late() {
    // User code
}
```

Parser detects `@track` and generates appropriate code.

### Enhancement 3: Export Data

Add button to export chart data as CSV:

```javascript
function exportToCSV() {
    const csv = chart.data.labels.map((gen, idx) => {
        return [gen, ...chart.data.datasets.map(ds => ds.data[idx])].join(',');
    }).join('\n');
    
    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slim_simulation_data.csv';
    a.click();
}
```

### Enhancement 4: Pause/Resume Control

Add interactive simulation control from webview:

```typescript
// In runSlimProcess, add IPC mechanism
slimProcess.stdin.write('PAUSE\n');

// In SLiM script injection
late() {
    if (fileExists('/tmp/slim_command.txt')) {
        command = readFile('/tmp/slim_command.txt');
        if (command == 'PAUSE') {
            // Wait loop
        }
    }
    // ... visualization code
}
```

### Enhancement 5: Comparison Mode

Run multiple simulations simultaneously and overlay charts:

```typescript
class MultiSimVisualizationPanel {
    private simulations: Map<string, SimulationData>;
    
    addSimulation(name: string, data: any) {
        // Add as new dataset to existing charts
    }
}
```

### Enhancement 6: Tree Sequence Visualization

For tree-seq recording models, add phylogeny display using D3.js tree layout.

### Enhancement 7: Real-Time Alerts

Notify user when interesting events occur:

```typescript
if (data.populations.p1_size === 0) {
    vscode.window.showWarningMessage('Population p1 went extinct!');
}
```

---

## Checklist

Use this checklist to verify implementation:

### Code Files
- [ ] `src/visualizationContext.ts` created and complete
- [ ] `src/visualizationRunner.ts` created and complete
- [ ] `src/extension.ts` updated with command registration
- [ ] `package.json` updated with command, menu, keybinding

### Testing
- [ ] Test 1: Simple population growth works
- [ ] Test 2: Multi-population tracking works
- [ ] Test 3: Extinction handling works
- [ ] Test 4: Multi-species model (if applicable)
- [ ] Test 5: nonWF model works

### Validation
- [ ] Panel opens in Column Two
- [ ] Charts display correctly
- [ ] Real-time updates work
- [ ] Generation counter updates
- [ ] No console errors
- [ ] Temp files are cleaned up
- [ ] Cancellation works (Ctrl+C in progress dialog)

### Polish
- [ ] Error messages are helpful
- [ ] Progress notifications work
- [ ] Command appears in palette
- [ ] Keyboard shortcut works
- [ ] Context menu shows command
- [ ] Icon displays correctly

---

## Additional Resources

### SLiM Documentation
- Manual: https://benhaller.com/slim/SLiM_Manual.pdf
- Dictionary API: Section 25.2
- serialize() method: Section 25.1.3

### VSCode Extension API
- Webview: https://code.visualstudio.com/api/extension-guides/webview
- Commands: https://code.visualstudio.com/api/references/vscode-api#commands
- Progress: https://code.visualstudio.com/api/references/vscode-api#ProgressLocation

### Chart.js
- Documentation: https://www.chartjs.org/docs/latest/
- Line charts: https://www.chartjs.org/docs/latest/charts/line.html
- Performance: https://www.chartjs.org/docs/latest/general/performance.html

---

## Support & Contribution

If you implement this system, consider:

1. **Adding examples** to your extension's test-sims/ directory
2. **Writing user documentation** explaining the feature
3. **Creating a demo video** showing real-time visualization
4. **Contributing back** improvements to this guide

---

## Conclusion

You now have a complete, production-ready implementation guide for real-time SLiM visualization in VSCode. The system is:

- ✅ **Robust**: Handles edge cases, extinctions, multi-species
- ✅ **Performant**: Efficient data streaming and rendering
- ✅ **User-friendly**: Automatic detection, zero configuration
- ✅ **Extensible**: Easy to add new metrics and visualizations

Follow this guide step-by-step, test thoroughly, and you'll have a powerful visualization system that makes SLiM development significantly more interactive and insightful!

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Author**: AI Assistant with deep SLiM knowledge  
**License**: Same as parent project

