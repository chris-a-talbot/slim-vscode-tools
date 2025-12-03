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
    interpreterPath: string
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
        console.log('Created temp file:', tmpFile);
        console.log('Modified script length:', modifiedScript.length);
        vscode.window.showInformationMessage(`Temp file: ${tmpFile}`, 'Copy Path').then(selection => {
            if (selection === 'Copy Path') {
                vscode.env.clipboard.writeText(tmpFile);
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create temp file: ${error}`);
        return;
    }
    
    // Step 4: Create and show visualization panel
    const vizPanel = new ContextAwareVisualizationPanel(simContext);
    vizPanel.show();
    
    // Step 5: Run SLiM process with progress tracking
    await runSlimProcess(tmpFile, interpreterPath, vizPanel);
    
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
    vizPanel: ContextAwareVisualizationPanel
): Promise<void> {
    
    // Create a terminal for showing SLiM output
    const terminal = vscode.window.createTerminal({
        name: 'SLiM Visualization',
        hideFromUser: false
    });
    terminal.show(true); // Show but don't steal focus
    
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
            let vizDataCount = 0;
            
            // ===== STDOUT HANDLER =====
            slimProcess.stdout.on('data', (data: Buffer) => {
                stdoutBuffer += data.toString();
                const lines = stdoutBuffer.split('\n');
                
                // Keep incomplete line in buffer
                stdoutBuffer = lines.pop() || '';
                
                lines.forEach(line => {
                    if (line.startsWith('VIZ_DATA::')) {
                        vizDataCount++;
                        // Extract and parse visualization data
                        const jsonData = line.substring(10);
                        
                        try {
                            const parsed = JSON.parse(jsonData);
                            
                            // Update visualization panel
                            vizPanel.updateData(jsonData);
                            
                            // Update progress notification
                            const gen = parsed.generation || 0;
                            progress.report({
                                message: `Gen ${gen} (${vizDataCount} updates)`,
                                increment: 0.1
                            });
                            
                        } catch (error) {
                            console.error('Failed to parse VIZ_DATA:', error);
                            console.error('Raw data:', jsonData);
                            terminal.sendText(`ERROR parsing VIZ_DATA: ${error}`, false);
                        }
                    } else if (line.trim()) {
                        // Regular SLiM output - log to console and terminal
                        console.log('[SLiM]', line);
                        terminal.sendText(line, false);
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
                        terminal.sendText(`ERROR: ${line}`, false);
                        vscode.window.showErrorMessage(`SLiM: ${line}`);
                    }
                });
            });
            
            // ===== PROCESS CLOSE HANDLER =====
            slimProcess.on('close', (code: number | null) => {
                // Flush any remaining buffered output
                if (stdoutBuffer.trim()) {
                    console.log('[SLiM]', stdoutBuffer);
                    terminal.sendText(stdoutBuffer, false);
                }
                if (stderrBuffer.trim()) {
                    console.error('[SLiM Error]', stderrBuffer);
                    terminal.sendText(`ERROR: ${stderrBuffer}`, false);
                }
                
                if (code === 0) {
                    terminal.sendText('\n✓ Simulation completed successfully!', false);
                    vscode.window.showInformationMessage(
                        '✓ SLiM simulation completed successfully!'
                    );
                    resolve();
                } else {
                    const errorMsg = `SLiM simulation exited with code ${code}`;
                    terminal.sendText(`\n✗ ${errorMsg}`, false);
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
    public show(): void {
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
            min-height: 200px;
            background: rgba(0,255,0,0.05);
        }
        
        .chart-container {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 2px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 15px;
            min-height: 350px;
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
            <div class="stat">
                <strong>Updates Received:</strong> <span id="updateCount">0</span>
            </div>
        </div>
        <div id="debugInfo" style="margin-top: 10px; padding: 10px; background: rgba(255,0,0,0.1); font-size: 0.9em; font-family: monospace;">
            Debug: Waiting for messages...
        </div>
    </div>
    
    <div class="grid" id="chartsContainer"></div>
    
    <script>
        // Check if Chart.js loaded
        if (typeof Chart === 'undefined') {
            document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Chart.js failed to load. Check internet connection.</div>';
            throw new Error('Chart.js not loaded');
        }
        
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
            div.innerHTML = '<h3>' + title + '</h3><canvas id="' + containerId + '"></canvas>';
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
                            type: 'linear',
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
                            beginAtZero: yAxisLabel.includes('Size') || yAxisLabel.includes('Count'),
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
                    label: pop + ' fitness',
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
            } else {
                document.getElementById('debugInfo').textContent = 'Debug: Created ' + Object.keys(charts).length + ' charts: ' + Object.keys(charts).join(', ');
            }
        }
        
        /**
         * Display simulation context metadata
         */
        function displayContextInfo(context) {
            let info = '<div>';
            
            // Model type
            info += '<span class="badge">Model: ' + (context.modelType || 'WF') + '</span>';
            
            // Multi-species indicator
            if (context.isMultiSpecies) {
                info += '<span class="badge">Multi-Species</span>';
            }
            
            info += '</div>';
            
            // Subpopulations
            if (context.subpopulations.length > 0) {
                info += '<div style="margin-top: 10px;">';
                info += '<strong>Subpopulations (' + context.subpopulations.length + '):</strong> ';
                info += context.subpopulations.map(function(p) {
                    return '<span class="badge">' + p + '</span>';
                }).join('');
                info += '</div>';
            }
            
            // Mutation types
            if (context.mutationTypes.length > 0) {
                info += '<div style="margin-top: 8px;">';
                info += '<strong>Mutation Types (' + context.mutationTypes.length + '):</strong> ';
                info += context.mutationTypes.map(function(m) {
                    return '<span class="badge">' + m + '</span>';
                }).join('');
                info += '</div>';
            }
            
            // Genomic element types
            if (context.genomicElementTypes.length > 0) {
                info += '<div style="margin-top: 8px;">';
                info += '<strong>Genomic Elements (' + context.genomicElementTypes.length + '):</strong> ';
                info += context.genomicElementTypes.map(function(g) {
                    return '<span class="badge">' + g + '</span>';
                }).join('');
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
            
            // Eidos wraps nested dictionaries in arrays, so unwrap them
            const popData = data.populations && data.populations[0] ? data.populations[0] : {};
            const mutData = data.mutations && data.mutations[0] ? data.mutations[0] : {};
            
            // Update population sizes chart
            if (charts.populationSizes && popData) {
                charts.populationSizes.data.labels.push(gen);
                
                let dataAdded = false;
                simContext.subpopulations.forEach((pop, idx) => {
                    const sizeArray = popData[pop + '_size'];
                    const size = sizeArray && sizeArray[0] !== undefined ? sizeArray[0] : 0;
                    charts.populationSizes.data.datasets[idx].data.push({x: gen, y: size});
                    if (size > 0) dataAdded = true;
                });
                
                if (gen % 50 == 0 && dataAdded) {
                    document.getElementById('debugInfo').textContent = 'Debug: Updated charts at gen ' + gen + ', ' + charts.populationSizes.data.datasets[0].data.length + ' data points';
                }
                
                // Keep only last N points for performance
                if (charts.populationSizes.data.labels.length > MAX_DATA_POINTS) {
                    charts.populationSizes.data.labels.shift();
                    charts.populationSizes.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.populationSizes.update('none');
            }
            
            // Update fitness chart
            if (charts.fitness && popData) {
                charts.fitness.data.labels.push(gen);
                
                simContext.subpopulations.forEach((pop, idx) => {
                    const fitnessArray = popData[pop + '_fitness'];
                    const fitness = fitnessArray && fitnessArray[0] !== undefined ? fitnessArray[0] : 0;
                    charts.fitness.data.datasets[idx].data.push({x: gen, y: fitness});
                });
                
                if (charts.fitness.data.labels.length > MAX_DATA_POINTS) {
                    charts.fitness.data.labels.shift();
                    charts.fitness.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.fitness.update('none');
            }
            
            // Update mutation chart
            if (charts.mutations && mutData) {
                charts.mutations.data.labels.push(gen);
                
                simContext.mutationTypes.forEach((mut, idx) => {
                    const countArray = mutData[mut + '_count'];
                    const count = countArray && countArray[0] !== undefined ? countArray[0] : 0;
                    charts.mutations.data.datasets[idx].data.push({x: gen, y: count});
                });
                
                if (charts.mutations.data.labels.length > MAX_DATA_POINTS) {
                    charts.mutations.data.labels.shift();
                    charts.mutations.data.datasets.forEach(ds => ds.data.shift());
                }
                
                charts.mutations.update('none');
            }
        }
        
        // =============================================
        // MESSAGE HANDLING
        // =============================================
        
        let updateCounter = 0;
        
        window.addEventListener('message', event => {
            const message = event.data;
            document.getElementById('debugInfo').textContent = 'Debug: Received message type: ' + message.type;
            
            switch (message.type) {
                case 'setContext':
                    // Initialize charts with simulation context
                    console.log('Received context:', message.context);
                    document.getElementById('debugInfo').textContent = 'Debug: Context received, ' + message.context.subpopulations.length + ' populations';
                    setupCharts(message.context);
                    break;
                    
                case 'updateData':
                    // Update charts with new data point
                    try {
                        updateCounter++;
                        document.getElementById('updateCount').textContent = updateCounter;
                        const data = JSON.parse(message.data);
                        console.log('Parsed data:', data);
                        document.getElementById('debugInfo').textContent = 'Debug: Update #' + updateCounter + ', gen=' + (data.generation ? data.generation[0] : 'unknown');
                        updateCharts(data);
                    } catch (error) {
                        console.error('Failed to parse visualization data:', error);
                        console.error('Raw message:', message.data);
                        document.getElementById('debugInfo').textContent = 'Debug: ERROR parsing data - ' + error.message;
                    }
                    break;
                    
                default:
                    console.warn('Unknown message type:', message.type);
                    document.getElementById('debugInfo').textContent = 'Debug: Unknown message type: ' + message.type;
            }
        });
    </script>
</body>
</html>`;
    }
}

