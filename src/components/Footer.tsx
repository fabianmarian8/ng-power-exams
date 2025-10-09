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
                <Link to="/outages/ikeja" className="text-muted-foreground hover:text-primary">
                  Ikeja Electric
                </Link>
              </li>
              <li>
                <Link to="/outages/eko" className="text-muted-foreground hover:text-primary">
                  Eko Disco
                </Link>
              </li>
              <li>
                <Link to="/outages/abuja" className="text-muted-foreground hover:text-primary">
                  Abuja (AEDC)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Exam Results</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/results/jamb" className="text-muted-foreground hover:text-primary">
                  JAMB Results
                </Link>
              </li>
              <li>
                <Link to="/results/waec" className="text-muted-foreground hover:text-primary">
                  WAEC Results
                </Link>
              </li>
              <li>
                <Link to="/results/neco" className="text-muted-foreground hover:text-primary">
                  NECO Results
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Important Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://jamb.gov.ng" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  JAMB Official
                </a>
              </li>
              <li>
                <a 
                  href="https://waecdirect.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  WAEC Direct
                </a>
              </li>
              <li>
                <a 
                  href="https://results.neco.gov.ng" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  NECO Results
                </a>
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
