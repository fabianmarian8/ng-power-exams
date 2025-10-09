import { useEffect } from "react";

const SITE_NAME = "NaijaInfo";

export const usePageMetadata = (title: string, description?: string, lang?: string) => {
  useEffect(() => {
    // Update document language
    if (lang) {
      document.documentElement.lang = lang;
    }

    // Update page title
    if (title) {
      document.title = `${title} | ${SITE_NAME}`;
    }

    // Update meta description
    if (description) {
      let meta = document.querySelector("meta[name='description']");

      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", description);
    }
  }, [title, description, lang]);
};

export default usePageMetadata;
