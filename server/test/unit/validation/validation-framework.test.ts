import { describe, it, expect } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver';
import {
  validatePattern,
  validateMultiplePatterns,
  createStandardDiagnostic,
  type MatchContext,
} from '../../../src/validation/validation-framework';

describe('validation framework', () => {
  it('validatePattern produces diagnostics for matching identifiers', () => {
    const line = 'foo(bar); baz(qux);';
    const pattern = /(\w+)\(/g;

    const diagnostics = validatePattern<null>(
      line,
      3,
      {
        pattern,
        extractIdentifier: (m) => m[1],
        shouldValidate: (id) => id === 'baz',
        createDiagnostic: (id, ctx) =>
          createStandardDiagnostic(
            DiagnosticSeverity.Warning,
            id,
            ctx,
            `Unknown function ${id}`,
          ),
      },
      null,
    );

    expect(diagnostics).toHaveLength(1);
    const d = diagnostics[0];
    expect(d.range.start.line).toBe(3);
    expect(d.range.start.character).toBe(line.indexOf('baz'));
    expect(d.message).toBe('Unknown function baz');
  });

  it('validatePattern respects shouldSkip', () => {
    const line = 'skip(me); keep(me);';
    const pattern = /(\w+)\(/g;

    const diagnostics = validatePattern(
      line,
      0,
      {
        pattern,
        extractIdentifier: (m) => m[1],
        shouldSkip: (ctx: MatchContext) => ctx.match[1] === 'skip',
        shouldValidate: () => true,
        createDiagnostic: (id, ctx) =>
          createStandardDiagnostic(
            DiagnosticSeverity.Error,
            id,
            ctx,
            'bad',
          ),
      },
      {},
    );

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toBe('bad');
  });

  it('validateMultiplePatterns aggregates diagnostics from multiple configs', () => {
    const line = 'foo(); bar();';
    const pattern = /(\w+)\(/g;

    const configs = [
      {
        pattern,
        extractIdentifier: (m: RegExpMatchArray) => m[1],
        shouldValidate: (id: string) => id === 'foo',
        createDiagnostic: (id: string, ctx: MatchContext) =>
          createStandardDiagnostic(
            DiagnosticSeverity.Warning,
            id,
            ctx,
            'first',
          ),
      },
      {
        pattern,
        extractIdentifier: (m: RegExpMatchArray) => m[1],
        shouldValidate: (id: string) => id === 'bar',
        createDiagnostic: (id: string, ctx: MatchContext) =>
          createStandardDiagnostic(
            DiagnosticSeverity.Warning,
            id,
            ctx,
            'second',
          ),
      },
    ];

    const diagnostics = validateMultiplePatterns(line, 1, configs as any, {});
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.map((d) => d.message).sort()).toEqual(['first', 'second']);
  });
});

