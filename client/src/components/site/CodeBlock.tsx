import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";

type CopyState = "idle" | "copied" | "failed";

export function CodeBlock({ code, label }: { code: string; label: string }) {
  const [state, setState] = useState<CopyState>("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);
  return (
    <figure className="code-block">
      <figcaption>
        <span>{label}</span>
        <button
          type="button"
          className="copy-button"
          onClick={async () =>
            setState((await copyText(code)) ? "copied" : "failed")
          }
          aria-label={`Copy ${label}`}
        >
          {state === "copied" ? <Check size={14} /> : <Copy size={14} />}
          {state === "copied"
            ? "Copied"
            : state === "failed"
              ? "Copy failed"
              : "Copy"}
        </button>
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
      <span className="sr-only" role="status">
        {state === "copied"
          ? `${label} copied to clipboard`
          : state === "failed"
            ? "Copy failed. Select the code and copy it manually."
            : ""}
      </span>
    </figure>
  );
}
