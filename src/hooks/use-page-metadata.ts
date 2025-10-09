import { useEffect } from "react";

const SITE_NAME = "NaijaInfo";

export const usePageMetadata = (title: string, description?: string) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${SITE_NAME}`;
    }

    if (description) {
      let meta = document.querySelector("meta[name='description']");

      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }

      meta.setAttribute("content", description);
    }
  }, [title, description]);
};

export default usePageMetadata;
