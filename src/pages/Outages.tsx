import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ExternalLink, MapPin, AlertTriangle, Compass } from "lucide-react";
import { outageGuides, DEFAULT_OUTAGE_LAST_VERIFIED } from "@/data/outages";
import usePageMetadata from "@/hooks/use-page-metadata";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalizedDateTime } from "@/lib/utils";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { LastVerifiedLabel } from "@/components/LastVerifiedLabel";
import { useNews } from "@/hooks/useNews";
import { useJsonLd } from "@/hooks/useJsonLd";
import { useOutages } from "@/hooks/useOutages";
import { PlannedBoard } from "@/components/outages/PlannedBoard";
import { LiveBoard } from "@/components/outages/LiveBoard";
import { NationalGridCard } from "@/components/outages/NationalGridCard";
import { OutageFilters, type OutageFiltersState } from "@/components/outages/OutageFilters";
import { OutageMap } from "@/components/outages/OutageMap";

const Outages = () => {
  const { t, language } = useLanguage();
  usePageMetadata("meta.outages.title", "meta.outages.description");
  const news = useNews();
  const outages = useOutages();
  const [filters, setFilters] = useState<OutageFiltersState>({
    state: "all",
    disco: "all",
    status: "all",
    source: "all",
    dateRange: "7days",
  });
  const filteredOutages = useMemo(() => {
    let filtered = outages.all;

    if (filters.state !== "all") {
      filtered = filtered.filter((item) =>
        item.affectedAreas?.some((area) => area.toLowerCase().includes(filters.state.toLowerCase()))
      );
    }

    if (filters.disco !== "all") {
      filtered = filtered.filter((item) =>
        (item.sourceName ?? item.source).toLowerCase().includes(filters.disco.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((item) => item.status === filters.status);
    }

    if (filters.source !== "all") {
      if (filters.source === "DISCO") {
        filtered = filtered.filter((item) => item.verifiedBy === "DISCO");
      } else if (filters.source === "TCN") {
        filtered = filtered.filter((item) => item.source === "TCN");
      } else if (filters.source === "MEDIA") {
        filtered = filtered.filter((item) => item.verifiedBy === "MEDIA");
      } else if (filters.source === "NERC") {
        filtered = filtered.filter((item) => item.verifiedBy === "REGULATORY");
      } else if (filters.source === "TWITTER") {
        filtered = filtered.filter((item) => item.source === "TWITTER");
      } else if (filters.source === "TELEGRAM") {
        filtered = filtered.filter((item) => item.source === "TELEGRAM");
      }
    }

    const now = new Date();
    if (filters.dateRange === "24h") {
      const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.publishedAt) >= since);
    } else if (filters.dateRange === "7days") {
      const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.publishedAt) >= since);
    } else if (filters.dateRange === "30days") {
      const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => new Date(item.publishedAt) >= since);
    }

    return filtered;
  }, [filters, outages.all]);
  const filteredLiveItems = useMemo(
    () => filteredOutages.filter((item) => item.status !== "PLANNED"),
    [filteredOutages]
  );
  const filteredPlannedItems = useMemo(
    () => filteredOutages.filter((item) => item.status === "PLANNED"),
    [filteredOutages]
  );
  const latestTcn = useMemo(
    () => outages.all.find((item) => item.source === "TCN"),
    [outages.all]
  );

  const nationalGuides = outageGuides.filter((guide) => guide.category === "national");
  const discoGuides = outageGuides.filter((guide) => guide.category === "disco");
  const howToGuides = outageGuides.filter((guide) => guide.category === "guide");
  const resourceGuides = outageGuides.filter((guide) => guide.category === "resource");

  const resolveSource = (guide: (typeof outageGuides)[number]) =>
    guide.primarySource ?? guide.officialLinks?.[0]?.label ?? t("outages.labels.pendingSource");

  const resolveLastVerified = (guide: (typeof outageGuides)[number]) =>
    formatLocalizedDateTime(guide.lastVerified ?? DEFAULT_OUTAGE_LAST_VERIFIED, language);

  const nationalHighlight = nationalGuides.find((guide) => guide.slug === "national-grid-status") ?? nationalGuides[0];
  const siteUrl = "https://naijainfo.ng";
  const outagesUrl = `${siteUrl}/outages`;
  const firstPowerOfficial = news.items.find((item) => item.domain === "POWER" && item.tier === "OFFICIAL");

  const newsArticleLd = useMemo(() => {
    if (!firstPowerOfficial) {
      return null;
    }
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: firstPowerOfficial.title,
      datePublished: firstPowerOfficial.publishedAt,
      dateModified: firstPowerOfficial.publishedAt,
      mainEntityOfPage: firstPowerOfficial.officialUrl,
      url: outagesUrl,
      articleSection: "Power",
      author: {
        "@type": "Organization",
        name: firstPowerOfficial.source
      },
      publisher: {
        "@type": "Organization",
        name: "NaijaInfo",
        url: siteUrl
      },
      description: firstPowerOfficial.summary ?? undefined
    };
  }, [firstPowerOfficial, outagesUrl, siteUrl]);

  const breadcrumbLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("common.home"),
          item: siteUrl
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("meta.outages.title"),
          item: outagesUrl
        }
      ]
    }),
    [outagesUrl, siteUrl, t]
  );

  const plannedEventsLd = useMemo(() => {
    const planned = outages.planned.filter((item) => item.start);
    if (planned.length === 0) {
      return null;
    }
    return planned.slice(0, 10).map((item) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: item.title,
      startDate: item.start,
      endDate: item.end ?? item.start,
      description: item.summary ?? undefined,
      url: item.officialUrl ?? outagesUrl,
      location: {
        "@type": "Place",
        name: item.affectedAreas?.join(", ") ?? "Nigeria"
      },
      organizer: {
        "@type": "Organization",
        name: item.sourceName ?? item.source
      }
    }));
  }, [outages.planned, outagesUrl]);

  useJsonLd("ld-json-outages-article", newsArticleLd);
  useJsonLd("ld-json-outages-events", plannedEventsLd);
  useJsonLd("ld-json-outages-breadcrumb", breadcrumbLd);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section 
          className="relative border-b bg-gradient-to-b from-accent/20 to-background overflow-hidden"
          style={{
            backgroundImage: 'url(/images/hero/power-grid.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
          <div className="container relative py-12 md:py-16">
            <ScrollReveal className="mx-auto max-w-3xl space-y-4">
              <Badge variant="outline" className="text-primary border-primary/60">{t('outages.hero.badge')}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {t('outages.hero.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('outages.hero.subtitle')}
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="container py-10 space-y-10">
          <OutageFilters
            onFilterChange={setFilters}
            activeFiltersCount={Object.values(filters).filter(
              (value) => value !== "all" && value !== "7days"
            ).length}
          />

          <OutageMap outages={filteredOutages} />

          <PlannedBoard items={filteredPlannedItems} lastUpdated={outages.lastIngest} />

          <LiveBoard items={filteredLiveItems} />

          <NationalGridCard item={latestTcn} />

          {nationalHighlight && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  {nationalHighlight.title}
                </CardTitle>
                <CardDescription>{nationalHighlight.heroDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link to={`/outages/${nationalHighlight.slug}`}>{t('outages.nationalCard.viewGuide')}</Link>
                  </Button>
                  <div className="space-y-1 text-xs text-muted-foreground md:text-sm">
                    <p>
                      <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(nationalHighlight)}
                    </p>
                    <p className="flex items-center gap-1">
                      <LastVerifiedLabel className="text-xs text-muted-foreground" />
                      <span>{resolveLastVerified(nationalHighlight)}</span>
                    </p>
                  </div>
                </div>
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
              {discoGuides.map((guide, idx) => (
                <ScrollReveal key={guide.slug} delay={idx * 50}>
                  <Card className="group h-full hover:shadow-lg hover:scale-105 transition-all">
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
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                        </p>
                        <p className="flex items-center gap-1">
                          <LastVerifiedLabel className="text-xs text-muted-foreground" />
                          <span>{resolveLastVerified(guide)}</span>
                        </p>
                      </div>
                      <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                        <Link to={`/outages/${guide.slug}`}>{t('outages.discoSection.openGuide')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
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
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                        </p>
                        <p className="flex items-center gap-1">
                          <LastVerifiedLabel className="text-xs text-muted-foreground" />
                          <span>{resolveLastVerified(guide)}</span>
                        </p>
                      </div>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/outages/${guide.slug}`}>{t('outages.howToSection.viewInstructions')}</Link>
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
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-semibold text-foreground">{t('common.officialSource')}:</span> {resolveSource(guide)}
                        </p>
                        <p className="flex items-center gap-1">
                          <LastVerifiedLabel className="text-xs text-muted-foreground" />
                          <span>{resolveLastVerified(guide)}</span>
                        </p>
                      </div>
                      <Button asChild variant="ghost" className="px-0 text-primary hover:text-primary">
                        <Link to={`/outages/${guide.slug}`}>{t('outages.resourceSection.explore')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <Alert className="border-primary/50 bg-primary/5">
            <AlertTitle>{t('outages.alert.title')}</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              {t('outages.alert.description')}
            </AlertDescription>
          </Alert>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                {t('outages.examCta.title')}
              </CardTitle>
              <CardDescription>
                {t('outages.examCta.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/results">{t('outages.examCta.goToResults')}</Link>
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
