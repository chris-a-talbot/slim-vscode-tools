# slim-vscode-tools README

`slim-vscode-tools` is a Visual Studio Code extension designed to provide comprehensive support for the SLiM simulation package. This extension includes features such as syntax highlighting, snippets, IntelliSense, and commands to enhance the development experience for SLiM scripts.

## ✨ Features

### Syntax Highlighting
Provides syntax highlighting for SLiM scripts using a TextMate grammar. This includes:
- Line and block comments
- Double and single-quoted strings with escape sequences
- Control keywords (`if`, `else`, `for`, `while`, `function`, `return`, `break`, `continue`)
- SLiM-specific keywords (`initialize`, `sim`, `initializeSLiMOptions`, etc.)
- Numeric constants
- Language variables (`this`, `self`)
- Function definitions and parameters

![Syntax Highlighting](./images/syntax_colors.png)

### Hover Information

Will show a tooltip with the function signature and complete documentation for the function for the SLiM help system.

![Hover Information](./images/hover_over_docs.png)

### Auto-completion

Provides auto-completion for SLiM keywords, functions, and variables.
Will show a tooltip with the function signature and description.

![Auto-completion](./images/autocomplete.png)

### Syntax Checking
Provides real-time syntax validation for SLiM scripts:
- Brace matching and block structure validation
- Semicolon checking for statements
- SLiM-specific block structure validation (initialize, early, late, fitness)
- Generation-prefixed block validation (e.g., "1000 late()")
- Function parameter validation
- Smart error reporting with inline diagnostics
- Support for multi-line code blocks

### Snippets
Includes a set of useful snippets to speed up the development process. For example:
- `initWF`: Initializes a basic Wright-Fisher model.
- `initSel`: Initializes a model with selection.

### IntelliSense
Provides basic IntelliSense features such as auto-completion for keywords, functions, and variables.

### Commands
Adds a custom view in the activity bar with a command to run SLiM scripts:
- **Run SLiM**: Executes the currently open SLiM script using the SLiM interpreter.

### Documentation Tree View
Offers a tree view to the sidebar that shows the full hierarchy of classes, methods, properties, etc.,
as presented in the native `SLiMgui` help system.
The documentation pages are displayed in a heirarchical, tree view format, where opening
subsequent tabs shows the documentation for the selected item.
Clicking on indivual items in the tree view such as methods or properties opens the corresponding
section of the slim documentation in a webview.

![Documentation Tree View](./images/doc_view.png)

### Status Bar Integration
Adds a status bar button to quickly run the SLiM script in the active editor.
Also adds a command to run the SLiM script in Activity Bar.

![Status Bar Integration](./images/run_slim.png)

## Requirements

- Visual Studio Code version 1.98.0 or higher
- SLiM interpreter installed and accessible in your system's PATH or configured in the extension settings

## Installation

Currently this extension is not published to the marketplace, so you will need to install it manually.

There are a few ways to do this:

You can build from source:
1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run package` to package the extension
4. Install the resulting package with `code --install-extension slim-vscode-tools-<current-version-number>-.vsix` (this assumes you've installed the `vscode` command line tool)

You can use the prepackaged package from the releases:
1. get the latest version from the [GitHub repository](https://github.com/slim-community/slim-tools/releases)
2. Install the `.vsix` file manually with `code --install-extension slim-vscode-tools-<current-version-number>-.vsix`

Optionally you can install the `.vsix` file from within `vscode` by:
1. Open `vscode`.
2. Go to Extensions View by pressing Ctrl+Shift+X (Windows/Linux) or Cmd+Shift+X (Mac).
3. Click on the More Actions (⋮) menu at the top right of the Extensions panel.
4. Select "Install from VSIX...".
5. Locate and select the .vsix file from your system.
6. Click Install and wait for it to complete.

## Extension Settings

This extension contributes the following settings:

* `slimTools.slimInterpreterPath`: Path to the SLiM interpreter (e.g., `/usr/local/bin/slim` or `C:\\Users\\YourName\\slim.exe`).

### Inlay Hints Settings
* `slimTools.inlayHints.enabled`: Enable/disable inlay hints to show inferred types for variables (default: `true`)
* `slimTools.inlayHints.showVariableTypes`: Show type hints for variable assignments (default: `true`)
* `slimTools.inlayHints.showLoopVariableTypes`: Show type hints for loop variables (default: `true`)

### Code Lens Settings
* `slimTools.codeLens.enabled`: Enable/disable code lens to show reference counts and tick information (default: `true`)
* `slimTools.codeLens.showReferences`: Show reference counts for functions, constants, and definitions (default: `true`)
* `slimTools.codeLens.showCallbackInfo`: Show tick information for callbacks (default: `true`)

## Diagnostic Features

The extension provides real-time diagnostic feedback for:
- Syntax errors (mismatched braces, missing semicolons)
- SLiM-specific block structure issues
- Function parameter validation
- Code style recommendations

Diagnostics are displayed as:
- 🔴 Errors: Critical issues that need to be fixed
- 🟡 Warnings: Potential issues or style recommendations

## Known Issues

- None at the moment. Please report any issues on the [GitHub repository](https://github.com/slim-community/slim-vscode-tools/issues).

## Release Notes

### 0.0.1-beta
Added new features:
- Real-time syntax checking and validation
- SLiM-specific block structure validation
- Enhanced error reporting with inline diagnostics
- Support for generation-prefixed blocks

### 0.0.1
Initial release of `slim-tools` with the following features:
- Syntax highlighting for SLiM scripts
- Snippets for common SLiM patterns
- Basic IntelliSense support
- Custom view and command to run SLiM scripts
- Status bar integration

### 0.0.2
- Full, auto-parsed SLiM documentation now appears in an object-oriented aware way
- Hover / autocomplete for Classes, their properties and methods, etc. 

### 0.0.3
- Documentation Tree view now shows the full hierarchy of classes, methods, properties, etc.
- Clicking on document item in the tree view opens the corresponding section of the slim documentation in a webview
- Improvements in semicolon handling to be more C++ like

### 0.0.4
- this is only a number bump to include a better icon on the marketplace

## [0.0.5]
- Added GH action to auto-publish the extension to the marketplace
- altered the repo location in the package.json to point to the new location in the slim-community organization

## [0.0.6]
- Added better handling of semicolons in the editor

## [0.0.7]
- Updated documentation to SLiM v5.1
- Improved language configuration (indentation rules, folding, etc.)
- Updated link in README
- Added test simulations
- Remove unused files

## [0.0.8]
- Refactor the language server and extension from JavaScript to TypeScript
- Boilerplate for Vitest testing system
- Small updates to syntax (slim.tmLanguage.json)
- ESLint/Prettier installed for the project
- Update .gitignore

## [0.0.9]
- Added `logger.ts` with improved logging features
- Update language server `index.ts` to use external services and handlers
- Added `diagnostics.ts` for managing diagnostics information
- Added `text-processing.ts` for general text manipulation
- Added `documentation-service.ts` for loading documentation data
- Added `hover.ts` - implementation of hover info service, plus various util files
- - `positions.ts` - manages positions of objects in code files
- - `instance.ts` - manages objects over the 'lifespan' of a file
- - `type-manager.ts` - infers object types using various rules
- - `markdown.ts` - manages the creation of markdown hover info
- - `hover-resolvers.ts` - attempts to resolve what hover info to show
- Added tests for new functionality

## [0.0.10]
- Added completion service provider for code completion suggestions
- - Provider is stored in `completion.ts`
- - CompletionService (`completion-service.ts`) does the heavy lifting for suggesting completion options

## [0.0.11]
- Added simple document symbols provider for document outline view
- - Provider and implementation is stored in `document-symbols.ts`
- Add go-to-definitions and find-references services
- - Provider and implementation stored in `definition.ts` and `references.ts` respectively

## [0.0.12]
- Added basic validation service for checking scripts for errors
- - `validation-service.ts` implements all validators and runs a check when documents change
- - `definitions.ts` checks for duplicate definitions or reserved identifiers used in definitions
- - `function-calls.ts` checks for calls to unknown/undefined functions
- - `method-property.ts` checks for invalid methods or properties access on objects
- - `references.ts` ensures that references to objects are defined before use
- - `structure.ts` ensures that the overall structure of the simulation is valid
- Improved markdown formatting for hover info

## [0.0.13]
- Extended the validation service with more SLiM-specific error checking
- - `null-assignments.ts` checks for errors involving NULL assignment to non-nullable fields
- - `context-restrictions.ts` checks for functions being used in the wrong context, e.g. the wrong callback or wrong WF/nonWF mode
- - `initialization-rules.ts` ensures the simulation is properly initialized
- - `interaction-queries.ts` ensures interactions are only used after they're evaluated

## [0.0.14]
- Added the signature help provider (`signature-help.ts`) to provide hints on parameters in functions/methods
- Added the code actions provider (`code-actions.ts`) to provide quick fixes for common errors and simple refactorings
- Improved the validation service to avoid throwing errors while a line is being typed

## [0.0.15]
- Added the rename provider (`rename.ts`) to manage refactoring in large documents/codebases
- Added the formatting provider (`formatting.ts`) for formatting of documents and code chunks

## [0.0.16]
- Added workspace symbol provider (`workspace-symbols.ts`) to allow for navigation across whole workspaces
- Added inlay hints provider (`inlay-hints.ts`) for type hints inlayed alongside code (toggleable via settings)
- Added code lens provider (`code-lens.ts`) for inline, clickable annotations above certain items (toggleable via settings)
- Added document highlighting provider (`document-highlights.ts`) to highlight occurrences of the currently highlighted object
- Added folding range provider (`folding-range.ts`) to allow SLiM-aware folding of callbacks and other code blocks

## Development notes

1. First install the dependencies with `npm install`
2. Build the project with `npm run compile`
3. If you want to clean up and remove the compiled files, run `npm run clean`
4. To build the `.vsix` file, run `npm run package`
5. To run the extension in development mode, press `F5` to open a new VS Code window with the extension loaded.

**Enjoy!**
