import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Shield, HelpCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const examBoards = [
  {
    name: "JAMB",
    fullName: "Joint Admissions and Matriculation Board",
    description: "Check UTME, Direct Entry results, and CAPS admission status",
    officialSite: "https://www.jamb.gov.ng",
    resultChecker: "https://www.jamb.gov.ng/efacility",
    slug: "jamb",
    services: [
      "UTME Results",
      "Direct Entry Results",
      "CAPS Admission Status",
      "Result Slip Printing"
    ]
  },
  {
    name: "WAEC",
    fullName: "West African Examinations Council",
    description: "Access SSCE results, verification, and certificate services",
    officialSite: "https://www.waecnigeria.org",
    resultChecker: "https://www.waecdirect.org",
    slug: "waec",
    services: [
      "SSCE Results (May/June)",
      "SSCE Results (Nov/Dec)",
      "Result Verification",
      "Certificate Attestation"
    ]
  },
  {
    name: "NECO",
    fullName: "National Examinations Council",
    description: "Check SSCE results and verify certificates online",
    officialSite: "https://www.neco.gov.ng",
    resultChecker: "https://results.neco.gov.ng",
    slug: "neco",
    services: [
      "SSCE Internal Results",
      "SSCE External Results",
      "e-Verify Service",
      "Token Purchase"
    ]
  }
];

const Results = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Nigeria Exam Results Hub
              </h1>
              <p className="text-lg text-muted-foreground">
                Official links and step-by-step guides to check your JAMB, WAEC, and NECO exam results safely.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Notice */}
        <section className="container py-8">
          <Alert className="border-info/50 bg-info/10">
            <Shield className="h-4 w-4 text-info" />
            <AlertTitle>Protect Your Personal Information</AlertTitle>
            <AlertDescription>
              Always check results on official portals. Never share your registration number, PINs, or tokens with third parties. We only provide links to official examination body websites.
            </AlertDescription>
          </Alert>
        </section>

        {/* Exam Boards */}
        <section className="container py-12">
          <h2 className="mb-8 text-2xl font-bold">Official Examination Boards</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {examBoards.map((board) => (
              <Card key={board.slug} className="group hover:shadow-lg hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{board.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs font-medium">{board.fullName}</CardDescription>
                  <CardDescription className="mt-2">{board.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Services:</p>
                    <ul className="space-y-1">
                      {board.services.map((service, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button variant="default" size="sm" asChild>
                      <a href={board.resultChecker} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Check Results
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={board.officialSite} target="_blank" rel="noopener noreferrer">
                        Official Website
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Guides */}
        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <h2 className="mb-8 text-2xl font-bold">Quick How-To Guides</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">JAMB Result Checking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Steps:</p>
                    <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Visit JAMB e-Facility portal</li>
                      <li>Login with your email and password</li>
                      <li>Navigate to 'Check UTME Result'</li>
                      <li>View and print your result</li>
                    </ol>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="https://www.jamb.gov.ng/efacility" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to JAMB Portal
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">WAEC Result Checking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Steps:</p>
                    <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Buy WAEC e-PIN (scratch card or online)</li>
                      <li>Visit waecdirect.org</li>
                      <li>Enter examination number and e-PIN</li>
                      <li>Select examination year and type</li>
                    </ol>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="https://www.waecdirect.org" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to WAEC Direct
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">NECO Result Checking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Steps:</p>
                    <ol className="space-y-1 list-decimal list-inside text-muted-foreground">
                      <li>Purchase NECO result token</li>
                      <li>Visit results.neco.gov.ng</li>
                      <li>Enter registration number and token</li>
                      <li>View and save your result</li>
                    </ol>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="https://results.neco.gov.ng" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Go to NECO Portal
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Common Issues & Solutions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Troubleshooting:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li className="flex items-start space-x-2">
                        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span>Invalid PIN: Verify you're using the correct year's PIN</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span>Portal slow: Try during off-peak hours</span>
                              </li>
                      <li className="flex items-start space-x-2">
                        <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                        <span>Result not ready: Check official announcements</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="container py-12">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Important Security Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Only purchase PINs and tokens from official sources</p>
              <p>• Beware of fake result checking websites - always verify the URL</p>
              <p>• Never pay to "upgrade" or "change" your results - these are scams</p>
              <p>• Keep your result slips and PINs safe for future verification</p>
              <p>• Contact official helplines for genuine assistance</p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
