import * as path from 'path';
import * as fs from 'fs';
import {
    workspace,
    ExtensionContext,
    window,
    commands,
    ViewColumn
} from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

// Update paths for all documentation files
const slimFunctionsPath = path.join(__dirname, "../docs/slim_functions.json");
const eidosFunctionsPath = path.join(__dirname, "../docs/eidos_functions.json");
const slimClassesPath = path.join(__dirname, "../docs/slim_classes.json");
const eidosClassesPath = path.join(__dirname, "../docs/eidos_classes.json");

// Update type definitions to match the new documentation structure
interface MethodInfo {
    signature: string;
    description: string;
}

interface PropertyInfo {
    type: string;
    description: string;
}

interface ClassInfo {
    constructor: {
        signature?: string;
        description?: string;
    };
    methods: { [key: string]: MethodInfo };
    properties: { [key: string]: PropertyInfo };
}

// Update data stores
let functionsData: { [key: string]: { signature: string; description: string } } = {};
let classesData: { [key: string]: ClassInfo } = {};

// Load all documentation files
function loadDocumentation() {
    try {
        if (fs.existsSync(slimFunctionsPath)) {
            const slimFunctions = JSON.parse(fs.readFileSync(slimFunctionsPath, "utf8"));
            functionsData = { ...functionsData, ...slimFunctions };
        }
        if (fs.existsSync(eidosFunctionsPath)) {
            const eidosFunctions = JSON.parse(fs.readFileSync(eidosFunctionsPath, "utf8"));
            functionsData = { ...functionsData, ...eidosFunctions };
        }
        if (fs.existsSync(slimClassesPath)) {
            const slimClasses = JSON.parse(fs.readFileSync(slimClassesPath, "utf8"));
            classesData = { ...classesData, ...slimClasses };
        }
        if (fs.existsSync(eidosClassesPath)) {
            const eidosClasses = JSON.parse(fs.readFileSync(eidosClassesPath, "utf8"));
            classesData = { ...classesData, ...eidosClasses };
        }
        console.log("Extension loaded documentation successfully");
    } catch (error) {
        console.error("Error loading documentation:", error);
    }
}

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    // Load documentation first
    loadDocumentation();

    // Use TypeScript language server
    const serverModule = context.asAbsolutePath(path.join('dist', 'index.js'));

    // Verify the server file exists
    if (!fs.existsSync(serverModule)) {
        const errorMsg = `SLiM Language Server not found at: ${serverModule}. Please run 'npm run compile' to build the server.`;
        console.error(errorMsg);
        window.showErrorMessage(errorMsg);
        return;
    }

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // Runtime options to ensure the server can find node_modules
    // The cwd should be the extension root so node_modules can be resolved
    const runtimeOptions = {
        cwd: context.extensionPath,
        env: {
            ...process.env,
            NODE_PATH: path.join(context.extensionPath, 'node_modules')
        }
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { 
            module: serverModule, 
            transport: TransportKind.ipc,
            options: runtimeOptions
        },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { ...debugOptions, ...runtimeOptions }
        }
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for SLiM and Eidos files
        documentSelector: [
            { scheme: 'file', language: 'slim' },
            { scheme: 'file', language: 'eidos' }
        ],
        synchronize: {
            // Notify the server about file changes to '.slim' files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/*.{slim,eidos}')
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'slimLanguageServer',
        'SLiM Language Server',
        serverOptions,
        clientOptions
    );

    // Add error handling for the client
    client.onDidChangeState((event) => {
        if (event.newState === 1) { // Starting
            console.log('[SLiM Extension] Language server starting...');
        } else if (event.newState === 2) { // Running
            console.log('[SLiM Extension] Language server running');
        } else if (event.newState === 3) { // Failed
            console.error('[SLiM Extension] Language server failed to start');
            window.showErrorMessage('SLiM Language Server failed to start. Check the Output panel for details.');
        }
    });

    // Handle server errors
    client.onDidChangeState((event) => {
        if (event.newState === 3) { // Failed
            const outputChannel = window.createOutputChannel('SLiM Language Server');
            outputChannel.appendLine('Language server failed to start. Check the server logs for details.');
        }
    });

    // Register command to show function documentation
    let disposable = commands.registerCommand('slimTools.showFunctionDoc', (functionName: string) => {
        const functionInfo = functionsData[functionName];
        if (functionInfo) {
            const panel = window.createWebviewPanel(
                'functionDoc',
                `Documentation: ${functionName}`,
                window.activeTextEditor?.viewColumn || ViewColumn.Active,
                {}
            );

            panel.webview.html = `
                <h1>${functionName}</h1>
                <pre>${functionInfo.signature}</pre>
                <p>${functionInfo.description}</p>
            `;
        }
    });

    context.subscriptions.push(disposable);

    // Start the client. This will also launch the server
    client.start().catch((error) => {
        console.error('[SLiM Extension] Failed to start language client:', error);
        window.showErrorMessage(`Failed to start SLiM Language Server: ${error.message}`);
    });
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
