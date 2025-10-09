import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const SITE_NAME = "NaijaInfo";

export const usePageMetadata = (titleKey: string, descriptionKey?: string) => {
  const { t, language } = useLanguage();
  
  useEffect(() => {
    const title = t(titleKey);
    const description = descriptionKey ? t(descriptionKey) : undefined;
    
    document.documentElement.lang = language;
    document.title = `${title} | ${SITE_NAME}`;
    
    if (description) {
      let meta = document.querySelector("meta[name='description']");
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
  }, [titleKey, descriptionKey, language, t]);
};

export default usePageMetadata;
