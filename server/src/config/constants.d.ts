// Supplementary type declarations to ensure consumers can import newer constants
// even if compiled JS or older d.ts files are present.

export interface TickCycleInfo {
  wf: string;
  nonwf: string;
}

export const CALLBACK_PSEUDO_PARAMETERS: Readonly<Record<string, Readonly<Record<string, string>>>>;

export const TICK_CYCLE_INFO: Readonly<Record<string, TickCycleInfo>>;


