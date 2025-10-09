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
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const { t } = useLanguage();
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
                {t('index.hero.title')}
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                {t('index.hero.subtitle')}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link to="/outages/national-grid-status">{t('index.hero.ctaPrimary')}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/results/check-jamb-result-2025">{t('index.hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('index.officialAlert.title')}</AlertTitle>
            <AlertDescription>
              {t('index.officialAlert.description')}
            </AlertDescription>
          </Alert>
        </section>

        <section className="container py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <InfoCard
              icon={Zap}
              title={t('index.powerCard.title')}
              description={t('index.powerCard.description')}
              href="/outages"
              items={[
                t('index.powerCard.item1'),
                t('index.powerCard.item2'),
                t('index.powerCard.item3'),
                t('index.powerCard.item4')
              ]}
            />
            <InfoCard
              icon={GraduationCap}
              title={t('index.examCard.title')}
              description={t('index.examCard.description')}
              href="/results"
              items={[
                t('index.examCard.item1'),
                t('index.examCard.item2'),
                t('index.examCard.item3'),
                t('index.examCard.item4')
              ]}
            />
          </div>
        </section>

        <section className="border-t bg-muted/40">
          <div className="container py-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t('index.quickLinks.title')}</h2>
              <Button asChild variant="ghost" className="text-primary hover:text-primary">
                <Link to="/outages">{t('index.quickLinks.viewAllDiscos')}</Link>
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
                      <Link to={`/outages/${guide.slug}`}>{t('common.viewDetails')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t('index.quickLinks.examShortcuts')}</h2>
            <Button asChild variant="ghost" className="text-primary hover:text-primary">
              <Link to="/results">{t('index.quickLinks.browseResultsHub')}</Link>
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
                      <Link to={`/results/${guide!.slug}`}>{t('common.openGuide')}</Link>
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
                      <Link to={`/outages/${guide.slug}`}>{t('common.readHowTo')}</Link>
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
                  {t('index.emergencyContact.title')}
                </h2>
                <p className="text-muted-foreground">
                  {t('index.emergencyContact.subtitle')}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/outages/outage-contacts-nigeria">{t('index.emergencyContact.cta')}</Link>
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
                  {t('index.knowledgeBase.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>{t('index.knowledgeBase.description')}</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/outages">{t('index.knowledgeBase.outagesButton')}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/results">{t('index.knowledgeBase.resultsButton')}</Link>
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
