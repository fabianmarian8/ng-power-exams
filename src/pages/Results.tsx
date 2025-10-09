import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, ShieldCheck, GraduationCap } from "lucide-react";
import { resultGuides } from "@/data/exams";
import usePageMetadata from "@/hooks/use-page-metadata";

const Results = () => {
  usePageMetadata("meta.results.title", "meta.results.description");

  const jambGuides = resultGuides.filter((guide) => guide.category === "jamb");
  const waecGuides = resultGuides.filter((guide) => guide.category === "waec");
  const necoGuides = resultGuides.filter((guide) => guide.category === "neco");
  const highlighted = jambGuides.find((guide) => guide.slug === "check-jamb-result-2025") ?? jambGuides[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl space-y-4">
              <Badge variant="outline" className="text-primary border-primary/60">Results Hub</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Nigeria Exam Results Hub</h1>
              <p className="text-lg text-muted-foreground">
                Use official portals to check your scores, print slips, and verify results. Each guide includes trusted links, fees, and troubleshooting steps.
              </p>
            </div>
          </div>
        </section>

        <section className="container py-10 space-y-10">
          {highlighted && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {highlighted.title}
                </CardTitle>
                <CardDescription>{highlighted.heroDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Button asChild>
                  <Link to={`/results/${highlighted.slug}`}>Read Step-by-Step Guide</Link>
                </Button>
                <div className="flex flex-wrap gap-3">
                  {highlighted.officialLinks.slice(0, 2).map((link) => (
                    <Button key={link.href} asChild variant="outline" size="sm">
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">JAMB Guides</h2>
              <p className="text-sm text-muted-foreground">
                Access UTME results, admission status, and official SMS options on the e-Facility portal.
              </p>
              <div className="grid gap-4">
                {jambGuides.map((guide) => (
                  <Card key={guide.slug}>
                    <CardHeader>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.heroDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/results/${guide.slug}`}>Open JAMB Guide</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">WAEC Guides</h2>
              <p className="text-sm text-muted-foreground">
                Learn how to use WAEC e-PINs, fix common errors, and verify candidate results securely.
              </p>
              <div className="grid gap-4">
                {waecGuides.map((guide) => (
                  <Card key={guide.slug}>
                    <CardHeader>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.heroDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/results/${guide.slug}`}>Open WAEC Guide</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">NECO Guides</h2>
              <p className="text-sm text-muted-foreground">
                Buy NECO tokens, check SSCE results, and authenticate certificates with e-Verify.
              </p>
              <div className="grid gap-4">
                {necoGuides.map((guide) => (
                  <Card key={guide.slug}>
                    <CardHeader>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.heroDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/results/${guide.slug}`}>Open NECO Guide</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Alert className="border-primary/50 bg-primary/5">
            <AlertTitle>Protect Your Credentials</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              Only enter registration numbers, PINs, or tokens on the official portals linked above. Avoid third-party sites that claim to improve scores or collect payments without receipts.
            </AlertDescription>
          </Alert>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Need Power Outage Updates?
              </CardTitle>
              <CardDescription>
                Explore DisCo-specific outage trackers, contact lists, and safety tips across Nigeria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/outages">Go to Outage Hub</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Results;
