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
import { useLanguage } from "@/contexts/LanguageContext";

const Results = () => {
  const { t } = useLanguage();
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
              <Badge variant="outline" className="text-primary border-primary/60">{t('results.hero.badge')}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('results.hero.title')}</h1>
              <p className="text-lg text-muted-foreground">
                {t('results.hero.subtitle')}
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
                  <Link to={`/results/${highlighted.slug}`}>{t('results.highlightCard.readGuide')}</Link>
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
              <h2 className="text-2xl font-semibold">{t('results.jambSection.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('results.jambSection.subtitle')}
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
                        <Link to={`/results/${guide.slug}`}>{t('results.jambSection.openGuide')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('results.waecSection.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('results.waecSection.subtitle')}
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
                        <Link to={`/results/${guide.slug}`}>{t('results.waecSection.openGuide')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{t('results.necoSection.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('results.necoSection.subtitle')}
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
                        <Link to={`/results/${guide.slug}`}>{t('results.necoSection.openGuide')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Alert className="border-primary/50 bg-primary/5">
            <AlertTitle>{t('results.alert.title')}</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {t('results.alert.description')}
            </AlertDescription>
          </Alert>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {t('results.outageCta.title')}
              </CardTitle>
              <CardDescription>
                {t('results.outageCta.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/outages">{t('results.outageCta.goToOutages')}</Link>
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
