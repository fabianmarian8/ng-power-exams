import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfoCard from "@/components/InfoCard";
import { Zap, GraduationCap, MapPin, Phone, AlertCircle, Compass } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { outageGuides } from "@/data/outages";
import { resultGuides } from "@/data/exams";
import usePageMetadata from "@/hooks/use-page-metadata";

const Index = () => {
  usePageMetadata("meta.homepage.title", "meta.homepage.description");

  const featuredOutages = outageGuides.filter((guide) => guide.category === "disco").slice(0, 6);
  const highlightedHowTos = outageGuides.filter((guide) => guide.category !== "disco").slice(0, 3);
  const jambHighlights = resultGuides.filter((guide) => guide.category === "jamb").slice(0, 2);
  const waecHighlight = resultGuides.find((guide) => guide.slug === "waec-result-checker");
  const necoHighlight = resultGuides.find((guide) => guide.slug === "neco-result-checker");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Nigeria Power & Exam Results Hub
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Real-time outage intelligence, official reporting channels, and verified steps to check JAMB, WAEC, and NECO results without compromising your data.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/outages/national-grid-status">Check National Grid Status</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/results/check-jamb-result-2025">Check JAMB Result</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Official Sources Only</AlertTitle>
            <AlertDescription>
              All exam results and power outage information link directly to official government and DisCo portals. We do not store or process personal data.
            </AlertDescription>
          </Alert>
        </section>

        <section className="container py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <InfoCard
              icon={Zap}
              title="Power Outage Updates"
              description="Track outages and planned maintenance across Nigeria's DisCos with direct reporting steps."
              href="/outages"
              items={[
                "National grid status from TCN",
                "Contact lists for 12 DisCos and Aba Power",
                "How to report faults via phone, SMS, or apps",
                "Safety tips for generators and inverters"
              ]}
            />
            <InfoCard
              icon={GraduationCap}
              title="Exam Results Checker"
              description="Step-by-step guides to check official JAMB, WAEC, and NECO results and verifications."
              href="/results"
              items={[
                "JAMB e-Facility, CAPS, and SMS results",
                "WAEC e-PIN purchases and verification",
                "NECO tokens and e-Verify portal",
                "Troubleshooting common result errors"
              ]}
            />
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="container py-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Quick Access by Location</h2>
              <Button asChild variant="ghost" className="text-primary hover:text-primary">
                <Link to="/outages">View all DisCos</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredOutages.map((guide) => (
                <Card key={guide.slug} className="rounded-lg border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{guide.heroDescription}</p>
                    {guide.coverage && (
                      <div className="flex flex-wrap gap-2">
                        {guide.coverage.slice(0, 4).map((state) => (
                          <span key={state} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {state}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/outages/${guide.slug}`}>See outage guide</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Exam Result Shortcuts</h2>
            <Button asChild variant="ghost" className="text-primary hover:text-primary">
              <Link to="/results">Browse results hub</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[...(jambHighlights ?? []), waecHighlight, necoHighlight]
              .filter(Boolean)
              .map((guide) => (
                <Card key={guide!.slug} className="rounded-lg border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{guide!.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{guide!.heroDescription}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/results/${guide!.slug}`}>Open guide</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {highlightedHowTos.map((guide) => (
                <Card key={guide.slug} className="rounded-lg border bg-card">
                  <CardHeader>
                    <CardTitle className="text-lg">{guide.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{guide.heroDescription}</p>
                    <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                      <Link to={`/outages/${guide.slug}`}>Read how-to</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12">
          <div className="rounded-lg border bg-card p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2 max-w-2xl">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Phone className="h-6 w-6 text-primary" />
                  Need Emergency Help?
                </h2>
                <p className="text-muted-foreground">
                  For urgent power issues, contact your local DisCo customer care. For exam result issues, reach out to the official examination body helplines.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/outages/outage-contacts-nigeria">Save customer care numbers</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <Card className="bg-gradient-to-r from-primary/10 via-accent/20 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  Explore the Full Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>More than 30 guides cover outage reporting, prepaid meters, blackout safety, and exam verification steps.</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/outages">Power Outage Guides</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/results">Exam Results Guides</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
