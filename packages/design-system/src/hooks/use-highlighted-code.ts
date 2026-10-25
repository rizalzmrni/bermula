import { loadHighlighter } from "@bermula/design-system/lib/highlighter";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Highlighter = Awaited<ReturnType<typeof loadHighlighter>>;
type GrammarState = Parameters<NonNullable<Highlighter>["highlight"]>[1];

interface LoadedHighlighter {
  highlighter: Highlighter;
  language: string;
}

interface HighlightedLines {
  highlighter: Highlighter;
  lines: ReactNode[];
  state?: GrammarState;
  text: string;
}

export const useHighlightedCode = (value: string, language: string) => {
  // A trailing newline would render as an extra empty line.
  const code = value.endsWith("\n") ? value.slice(0, -1) : value;
  const [loaded, setLoaded] = useState<LoadedHighlighter | null>(null);
  const highlighter = loaded?.language === language ? loaded.highlighter : null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let next: Highlighter = null;
      try {
        next = await loadHighlighter(language);
      } catch {
        // Bahasa gagal dimuat (mis. chunk gagal diunduh): tampilkan teks polos.
        next = null;
      }
      if (!cancelled) {
        setLoaded({ highlighter: next, language });
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // The complete lines, highlighted. While the code streams, only the new
  // lines are tokenized, starting from the grammar state of the last one.
  const [done, setDone] = useState<HighlightedLines>({
    highlighter: null,
    lines: [],
    text: "",
  });

  let next = done;

  if (next.highlighter !== highlighter || !code.startsWith(next.text)) {
    next = { highlighter, lines: [], text: "" };
  }

  const end = code.lastIndexOf("\n") + 1;

  if (highlighter && end > next.text.length) {
    const result = highlighter.highlight(
      code.slice(next.text.length, end - 1),
      next.state
    );

    next = {
      highlighter,
      lines: [...next.lines, ...result.lines],
      state: result.state,
      text: code.slice(0, end),
    };
  }

  if (next !== done) {
    setDone(next);
  }

  // The last line is still being written, so it is tokenized on every render.
  const tail = code.slice(end);

  return useMemo(() => {
    if (!highlighter) {
      return code.split("\n");
    }

    return [...next.lines, highlighter.highlight(tail, next.state).lines[0]];
  }, [code, highlighter, next, tail]);
};
