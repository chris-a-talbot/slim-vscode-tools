// References provider
import { Location, ReferenceParams } from 'vscode-languageserver/node';

export function registerReferencesProvider() {
    return (_params: ReferenceParams): Location[] => {
        // TODO: Implement references functionality
        return [];
    };
}

