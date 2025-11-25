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

## [0.0.7]
- Updated documentation to SLiM v5.1
- Improved language configuration (indentation rules, folding, etc.)
- Updated link in README
- Added test simulations (and moved the existing one) into `/test-sims`
- Remove unused files

## [0.0.8]
- Refactor the language server and extension from JavaScript to TypeScript
- Boilerplate for Vitest testing system
- Small updates to syntax (slim.tmLanguage.json)
- ESLint/Prettier installed for the project
- Update .gitignore

## [0.0.9]
- Refactor: Increase modularity of language server providers and utils for future expansion
- - `server/src` for all language server code
- - `server/src/config` for constants and types shared across the language server
- - - `config.ts` for constants
- - - `paths.ts` for paths
- - - `types.ts` for TypeScript types
- - `server/src/handlers` holds `handlers.ts` for implementing handlers that get sent to `server/index.ts`
- - `server/src/providers` for providers of individual language server features (fed into `handlers`)
- - - `completion.ts` for code completion 
- - - `document-symbols.ts` for outline view
- - - `hover.ts` for hover info
- - - `references.ts` for finding all references across the file (not yet implemented)
- - - `signature-help.ts` for hints about required & optional parameters for functions and methods
- - `server/src/services` for services used across the language server
- - - `documentation-service.ts` manages loading documentation
- - - `validation-service.ts` manages validating code files / checking for errors
- - `server/src/utils` for general utilities used across the language server
- - - `instance.ts` for tracking defined objects within the current file
- - - `positions.ts` for tracking positions in the file
- - `server/src/validation` for scripts used by the validation service to check for errors
- - - `structure.ts` for validating the structure of the script (e.g. semicolon-related errors)

## [0.0.10]
- Enhancements:
- - `server/src/utils/hover-resolvers.ts` for enhanced hover info displays and detection; cleans signatures and type names, adds tick cycle info to callbacks, handles LogFiles, detects Eidos events and callbacks, implements various helpers
- - `server/src/utils/markdown.ts` for generating markdown for hover info
- - `server/src/utils/text-processing.ts` for cleaning up text before generating markdown (uses `he` for HTML decoding)
- - `server/src/utils/type-manager.ts` for resolving class names and inferring types from patterns
- - `server/src/utils/logger.ts` for logging with awareness of current connection state
- - `server/src/utils/instance.ts` expanded with more comprehensive instance tracking for definitions, events, objects, etc.
- - `server/src/services/documentation-service.ts` turned into a service and expanded for future development
- - `server/src/services/validation-service.ts` turned into a service, added additional basic checks
- - Expand upon the instance to class names mapping
- - Add Eidos operators to the language server's context for hover info, completions, validation, etc.
