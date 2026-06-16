// spikes/latency/src/chunker.ts
const BOUNDARIES = new Set(["。", "！", "？", "!", "?"]);

export interface Chunker {
  /** Feed a streamed text delta; returns any complete sentences ready for TTS. */
  push(delta: string): string[];
  /** Stream ended: return whatever remains (trimmed), or null if nothing. */
  flush(): string | null;
}

export function createChunker(minLength = 6): Chunker {
  let buf = "";
  return {
    push(delta: string): string[] {
      buf += delta;
      const out: string[] = [];
      let start = 0;
      for (let i = 0; i < buf.length; i++) {
        if (!BOUNDARIES.has(buf[i])) continue;
        const candidate = buf.slice(start, i + 1);
        // Too short to TTS on its own — leave start in place so it merges
        // with the next sentence.
        if (candidate.trim().length < minLength) continue;
        out.push(candidate.trim());
        start = i + 1;
      }
      buf = buf.slice(start);
      return out;
    },
    flush(): string | null {
      const rest = buf.trim();
      buf = "";
      return rest.length > 0 ? rest : null;
    },
  };
}
