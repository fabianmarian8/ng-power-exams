import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">{t('header.siteName')}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footer.powerOutages')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/outages/national-grid-status" className="text-muted-foreground hover:text-primary">
                  {t('footer.nationalGridStatus')}
                </Link>
              </li>
              <li>
                <Link to="/outages/outage-contacts-nigeria" className="text-muted-foreground hover:text-primary">
                  {t('footer.discoCustomerCare')}
                </Link>
              </li>
              <li>
                <Link to="/outages/safety-during-blackouts" className="text-muted-foreground hover:text-primary">
                  {t('footer.safetyDuringBlackouts')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footer.examResults')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/results/check-jamb-result-2025" className="text-muted-foreground hover:text-primary">
                  {t('footer.checkJambResult')}
                </Link>
              </li>
              <li>
                <Link to="/results/waec-result-checker" className="text-muted-foreground hover:text-primary">
                  {t('footer.waecResultChecker')}
                </Link>
              </li>
              <li>
                <Link to="/results/neco-result-checker" className="text-muted-foreground hover:text-primary">
                  {t('footer.necoResultChecker')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">{t('footer.quickResources')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/outages/report-outage-aedc-pors" className="text-muted-foreground hover:text-primary">
                  {t('footer.reportAedcOutage')}
                </Link>
              </li>
              <li>
                <Link to="/outages/prepaid-meter-balance" className="text-muted-foreground hover:text-primary">
                  {t('footer.checkPrepaidMeter')}
                </Link>
              </li>
              <li>
                <Link to="/results/neco-e-verify" className="text-muted-foreground hover:text-primary">
                  {t('footer.necoEverify')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 space-y-4">
          <Alert className="border-muted bg-muted/20">
            <AlertDescription className="text-xs text-muted-foreground">
              <strong>{t('footer.dataNotice.title')}:</strong> {t('footer.dataNotice.text')}
              <br />
              <span className="text-muted-foreground/80">{t('footer.lastVerified')}: 2025-10-09</span>
            </AlertDescription>
          </Alert>
          <p className="text-center text-sm text-muted-foreground">
            {t('footer.copyright').replace('{year}', currentYear.toString())}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
