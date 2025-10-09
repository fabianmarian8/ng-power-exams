import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">NaijaInfo</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted source for power outage updates and exam results in Nigeria.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Power Outages</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/outages/national-grid-status" className="text-muted-foreground hover:text-primary">
                  National Grid Status
                </Link>
              </li>
              <li>
                <Link to="/outages/outage-contacts-nigeria" className="text-muted-foreground hover:text-primary">
                  DisCo Customer Care List
                </Link>
              </li>
              <li>
                <Link to="/outages/safety-during-blackouts" className="text-muted-foreground hover:text-primary">
                  Safety During Blackouts
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Exam Results</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/results/check-jamb-result-2025" className="text-muted-foreground hover:text-primary">
                  Check JAMB Result
                </Link>
              </li>
              <li>
                <Link to="/results/waec-result-checker" className="text-muted-foreground hover:text-primary">
                  WAEC Result Checker
                </Link>
              </li>
              <li>
                <Link to="/results/neco-result-checker" className="text-muted-foreground hover:text-primary">
                  NECO Result Checker
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Quick Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/outages/report-outage-aedc-pors" className="text-muted-foreground hover:text-primary">
                  Report AEDC Outage (PORS)
                </Link>
              </li>
              <li>
                <Link to="/outages/prepaid-meter-balance" className="text-muted-foreground hover:text-primary">
                  Check Prepaid Meter Balance
                </Link>
              </li>
              <li>
                <Link to="/results/neco-e-verify" className="text-muted-foreground hover:text-primary">
                  NECO e-Verify Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} NaijaInfo. All official links redirect to government portals.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
