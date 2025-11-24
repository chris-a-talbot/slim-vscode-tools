# Change Log

All notable changes to the "slim-tools" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

### Initial release
- simple handling of coloring, sytax checking. 
- Run SLiM script command
- Status bar integration

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

## [0.0.2]

- Full, auto-parsed SLiM documentation now appears in an object-oriented aware way
- Hover / autocomplete for Classes, their properties and methods, etc. 

## [0.0.3]

- Documentation Tree view now shows the full hierarchy of classes, methods, properties, etc.
- Clicking on document item in the tree view opens the corresponding section of the slim documentation in a webview
- Improvements in semicolon handling to be more C++ like


## [0.0.4]

- this is only a number bump to include a better icon on the marketplace

## [0.0.5]
- Added GH action to auto-publish the extension to the marketplace
- altered the repo location in the package.json to point to the new location in the slim-community organization

## [0.0.6]
- Added better handling of semicolons in the editor

## [0.0.7] (CAT)
- Updated documentation to SLiM v5.1
- Improved language configuration (indentation rules, folding, etc.)
- Updated link in README
- Added test simulations
- Remove unused files

## [0.0.8] (CAT)
- Refactor the language server and extension from JavaScript to TypeScript
- Boilerplate for Vitest testing system
- Small updates to syntax (slim.tmLanguage.json)
- ESLint/Prettier installed for the project
- Update .gitignore

## [0.0.9] (CAT)
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

## [0.0.10] (CAT)
- Added completion service provider for code completion suggestions
- - Provider is stored in `completion.ts`
- - CompletionService (`completion-service.ts`) does the heavy lifting for suggesting completion options

## [0.0.11] (CAT)
- Added simple document symbols provider for document outline view
- - Provider and implementation is stored in `document-symbols.ts`
- Add go-to-definitions and find-references services
- - Provider and implementation stored in `definition.ts` and `references.ts` respectively

## [0.0.12] (CAT)
- Added basic validation service for checking scripts for errors
- - `validation-service.ts` implements all validators and runs a check when documents change
- - `definitions.ts` checks for duplicate definitions or reserved identifiers used in definitions
- - `function-calls.ts` checks for calls to unknown/undefined functions
- - `method-property.ts` checks for invalid methods or properties access on objects
- - `references.ts` ensures that references to objects are defined before use
- - `structure.ts` ensures that the overall structure of the simulation is valid
- Improved markdown formatting for hover info

## [0.0.13] (CAT)
- Extended the validation service with more SLiM-specific error checking
- - `null-assignments.ts` checks for errors involving NULL assignment to non-nullable fields
- - `context-restrictions.ts` checks for functions being used in the wrong context, e.g. the wrong callback or wrong WF/nonWF mode
- - `initialization-rules.ts` ensures the simulation is properly initialized
- - `interaction-queries.ts` ensures interactions are only used after they're evaluated

## [0.0.14] (CAT)
- Added the signature help provider (`signature-help.ts`) to provide hints on parameters in functions/methods
- Added the code actions provider (`code-actions.ts`) to provide quick fixes for common errors and simple refactorings
- Improved the validation service to avoid throwing errors while a line is being typed