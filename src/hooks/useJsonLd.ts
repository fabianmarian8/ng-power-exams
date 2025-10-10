import { useEffect } from "react";

type JsonLdInput = Record<string, unknown> | Array<Record<string, unknown>> | null | undefined;

function setScriptContent(script: HTMLScriptElement, data: JsonLdInput) {
  if (!data) {
    script.textContent = "";
    return;
  }
  script.textContent = JSON.stringify(data);
}

export function useJsonLd(id: string, data: JsonLdInput) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const existing = document.head.querySelector<HTMLScriptElement>(`script#${id}`);

    if (!data) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    const script = existing ?? document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    setScriptContent(script, data);
    if (!existing) {
      document.head.appendChild(script);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [id, data]);
}
