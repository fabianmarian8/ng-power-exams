import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, ShieldCheck, GraduationCap } from "lucide-react";
import { resultGuides, DEFAULT_RESULT_LAST_VERIFIED } from "@/data/exams";
import usePageMetadata from "@/hooks/use-page-metadata";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalizedDateTime } from "@/lib/utils";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

const Results = () => {
  const { t, language } = useLanguage();
  usePageMetadata("meta.results.title", "meta.results.description");

  const jambGuides = resultGuides.filter((guide) => guide.category === "jamb");
  const waecGuides = resultGuides.filter((guide) => guide.category === "waec");
  const necoGuides = resultGuides.filter((guide) => guide.category === "neco");
  const resolveSource = (guide: (typeof resultGuides)[number]) =>
    guide.primarySource ?? guide.officialLinks[0]?.label ?? t('outages.labels.pendingSource');

  const resolveLastVerified = (guide: (typeof resultGuides)[number]) =>
    formatLocalizedDateTime(guide.lastVerified ?? DEFAULT_RESULT_LAST_VERIFIED, language);

  const highlighted = jambGuides.find((guide) => guide.slug === "check-jamb-result-2025") ?? jambGuides[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section 
          className="relative border-b bg-gradient-to-b from-accent/20 to-background overflow-hidden"
          style={{
            backgroundImage: 'url(/images/hero/exam-success.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
          <div className="container relative py-12 md:py-16">
            <ScrollReveal className="mx-auto max-w-3xl space-y-4">
              <Badge variant="outline" className="text-primary border-primary/60">{t('results.hero.badge')}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('results.hero.title')}</h1>
              <p className="text-lg text-muted-foreground">
                {t('results.hero.subtitle')}
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="container py-10 space-y-10">
          {highlighted && (
            <ScrollReveal>
              <Card className="border-2 border-hope-yellow bg-hope-yellow/5 animate-pulse-glow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-hope-yellow text-hope-yellow-dark animate-pulse-glow">FEATURED</Badge>
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary animate-bounce-subtle" />
                    {highlighted.title}
                  </CardTitle>
                  <CardDescription>{highlighted.heroDescription}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-col gap-3">
                    <Button asChild className="bg-nigeria-green hover:bg-nigeria-green/90">
                      <Link to={`/results/${highlighted.slug}`}>{t('results.highlightCard.readGuide')}</Link>
                    </Button>
                    <div className="space-y-1 text-xs text-muted-foreground md:text-sm">
                      <p>
                        <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(highlighted)}
                      </p>
                      <p>
                        <span className="font-semibold text-foreground">{t('common.lastVerified')}:</span> {resolveLastVerified(highlighted)}
                      </p>
                    </div>
                  </div>
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
            </ScrollReveal>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <ScrollReveal>
                <h2 className="text-2xl font-semibold">{t('results.jambSection.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('results.jambSection.subtitle')}
                </p>
              </ScrollReveal>
              <div className="grid gap-4">
                {jambGuides.map((guide, idx) => (
                  <ScrollReveal key={guide.slug} delay={idx * 100}>
                    <Card className="hover:shadow-lg hover:scale-105 transition-all h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.heroDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">{t('common.lastVerified')}:</span> {resolveLastVerified(guide)}
                          </p>
                        </div>
                        <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                          <Link to={`/results/${guide.slug}`}>{t('results.jambSection.openGuide')}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <ScrollReveal>
                <h2 className="text-2xl font-semibold">{t('results.waecSection.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('results.waecSection.subtitle')}
                </p>
              </ScrollReveal>
              <div className="grid gap-4">
                {waecGuides.map((guide, idx) => (
                  <ScrollReveal key={guide.slug} delay={idx * 100}>
                    <Card className="hover:shadow-lg hover:scale-105 transition-all h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.heroDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">{t('common.lastVerified')}:</span> {resolveLastVerified(guide)}
                          </p>
                        </div>
                        <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                          <Link to={`/results/${guide.slug}`}>{t('results.waecSection.openGuide')}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <ScrollReveal>
                <h2 className="text-2xl font-semibold">{t('results.necoSection.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('results.necoSection.subtitle')}
                </p>
              </ScrollReveal>
              <div className="grid gap-4">
                {necoGuides.map((guide, idx) => (
                  <ScrollReveal key={guide.slug} delay={idx * 100}>
                    <Card className="hover:shadow-lg hover:scale-105 transition-all h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <CardDescription>{guide.heroDescription}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">{t('common.lastVerified')}:</span> {resolveLastVerified(guide)}
                          </p>
                        </div>
                        <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                          <Link to={`/results/${guide.slug}`}>{t('results.necoSection.openGuide')}</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
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
