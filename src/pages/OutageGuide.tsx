import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Phone } from "lucide-react";
import { Navigate, Link, useParams } from "react-router-dom";
import { outageGuides } from "@/data/outages";
import usePageMetadata from "@/hooks/use-page-metadata";

const categoryLabels: Record<string, string> = {
  national: "National Update",
  disco: "Distribution Company",
  guide: "How-To Guide",
  resource: "Resource"
};

const OutageGuide = () => {
  const { slug } = useParams();
  const guide = outageGuides.find((item) => item.slug === slug);

  if (!guide) {
    return <Navigate to="/outages" replace />;
  }

  usePageMetadata(guide.title, guide.metaDescription);

  const related = outageGuides
    .filter((item) => item.slug !== guide.slug && (item.category === guide.category || guide.category === "disco"))
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <div className="space-y-4 max-w-3xl">
              <Badge variant="outline" className="text-primary border-primary/60">
                {categoryLabels[guide.category] ?? "Guide"}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{guide.heroTitle}</h1>
              <p className="text-lg text-muted-foreground">{guide.heroDescription}</p>

              {guide.coverage && guide.coverage.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {guide.coverage.map((state) => (
                    <Badge key={state} variant="secondary" className="rounded-full">
                      {state}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="container py-12 space-y-12">
          {guide.quickFacts && guide.quickFacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Facts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {guide.quickFacts.map((fact, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {guide.reportChannels && guide.reportChannels.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>How to Reach Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {guide.reportChannels.map((channel) => (
                      <div key={channel.label} className="rounded-lg border bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Phone className="h-4 w-4 text-primary" />
                          {channel.label}
                        </div>
                        <p className="mt-2 text-sm font-mono">{channel.value}</p>
                        {channel.note && (
                          <p className="mt-1 text-xs text-muted-foreground">{channel.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {guide.officialLinks && guide.officialLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Official Links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {guide.officialLinks.map((link) => (
                  <div key={link.href} className="rounded-lg border bg-background p-4 shadow-sm">
                    <h3 className="text-sm font-semibold">{link.label}</h3>
                    {link.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>
                    )}
                    <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        Visit Site
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {guide.steps && guide.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                  {guide.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <div className="space-y-10">
            {guide.sections.map((section) => (
              <article key={section.heading} className="space-y-4">
                <h2 className="text-2xl font-semibold">{section.heading}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    {section.bullets.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                )}
                <Separator className="mt-6" />
              </article>
            ))}
          </div>

          {guide.faq && guide.faq.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {guide.faq.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-semibold">{item.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {related.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Related Guides</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {related.map((item) => (
                  <Card key={item.slug} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{item.heroDescription}</p>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/outages/${item.slug}`}>Read Guide</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Alert className="border-primary/50 bg-primary/5">
            <AlertDescription className="text-sm text-muted-foreground">
              Always rely on official DisCo channels for outage confirmation. This guide summarizes public information to help you act faster during interruptions.
            </AlertDescription>
          </Alert>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OutageGuide;
