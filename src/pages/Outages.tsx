import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, MapPin, AlertTriangle, Compass } from "lucide-react";
import { outageGuides } from "@/data/outages";
import usePageMetadata from "@/hooks/use-page-metadata";
import { useLanguage } from "@/contexts/LanguageContext";

const Outages = () => {
  const { t } = useLanguage();
  usePageMetadata("meta.outages.title", "meta.outages.description");

  const nationalGuides = outageGuides.filter((guide) => guide.category === "national");
  const discoGuides = outageGuides.filter((guide) => guide.category === "disco");
  const howToGuides = outageGuides.filter((guide) => guide.category === "guide");
  const resourceGuides = outageGuides.filter((guide) => guide.category === "resource");

  const nationalHighlight = nationalGuides.find((guide) => guide.slug === "national-grid-status") ?? nationalGuides[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <div className="mx-auto max-w-3xl space-y-4">
              <Badge variant="outline" className="text-primary border-primary/60">{t('outages.hero.badge')}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('outages.hero.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('outages.hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        <section className="container py-10 space-y-10">
          {nationalHighlight && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  {nationalHighlight.title}
                </CardTitle>
                <CardDescription>{nationalHighlight.heroDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Button asChild>
                  <Link to={`/outages/${nationalHighlight.slug}`}>{t('outages.nationalCard.cta')}</Link>
                </Button>
                <div className="flex flex-wrap gap-3">
                  {nationalHighlight.officialLinks?.slice(0, 2).map((link) => (
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

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold">{t('outages.discoSection.title')}</h2>
              <Badge variant="secondary" className="rounded-full">{t('outages.discoSection.badge')}</Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {discoGuides.map((guide) => (
                <Card key={guide.slug} className="group h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.heroDescription}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {guide.coverage && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {guide.coverage.map((state) => (
                          <span key={state} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                            <MapPin className="h-3 w-3 text-primary" />
                            {state}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                      <Link to={`/outages/${guide.slug}`}>{t('common.openGuide')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('outages.howToSection.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('outages.howToSection.description')}
              </p>
              <div className="grid gap-4">
                {howToGuides.map((guide) => (
                  <Card key={guide.slug} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.heroDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/outages/${guide.slug}`}>{t('outages.howToSection.cta')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('outages.resourceSection.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('outages.resourceSection.description')}
              </p>
              <div className="grid gap-4">
                {resourceGuides.map((guide) => (
                  <Card key={guide.slug}>
                    <CardHeader>
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                      <CardDescription>{guide.heroDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/outages/${guide.slug}`}>{t('outages.resourceSection.cta')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Alert className="border-primary/50 bg-primary/5">
            <AlertTitle>{t('outages.stayInformed.title')}</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {t('outages.stayInformed.text')}
            </AlertDescription>
          </Alert>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                {t('outages.needExamSupport.title')}
              </CardTitle>
              <CardDescription>
                {t('outages.needExamSupport.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/results">{t('outages.needExamSupport.cta')}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Outages;
