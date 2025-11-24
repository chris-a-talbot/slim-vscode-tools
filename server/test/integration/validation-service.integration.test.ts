import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ValidationService } from '../../src/services/validation-service';
import type { DocumentationService } from '../../src/utils/documentation-service';

class MockDocumentationService implements Partial<DocumentationService> {
  getFunctions() { return {}; }
  getClasses() { return {} as any; }
  getCallbacks() { return {} as any; }
}

describe('ValidationService integration', () => {
  it('produces diagnostics for missing semicolons', async () => {
    const text = ['x = 1', 'y = 2'].join('\n');

    const document = TextDocument.create('file:///test.slim', 'slim', 1, text);
    const validationService = new ValidationService(new MockDocumentationService() as DocumentationService);

    const diagnostics = await validationService.validate(document);
    const messages = diagnostics.map((d) => d.message.toLowerCase());
    expect(messages.some((m) => m.includes('semicolon'))).toBe(true);
  });
});

