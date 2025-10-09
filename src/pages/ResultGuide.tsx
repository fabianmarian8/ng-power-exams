import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, HelpCircle } from "lucide-react";
import { Navigate, Link, useParams } from "react-router-dom";
import { resultGuides } from "@/data/exams";
import usePageMetadata from "@/hooks/use-page-metadata";
import { useLanguage } from "@/contexts/LanguageContext";

const ResultGuide = () => {
  const { slug } = useParams();
  const { t } = useLanguage();
  const guide = resultGuides.find((item) => item.slug === slug);

  if (!guide) {
    return <Navigate to="/results" replace />;
  }

  usePageMetadata(guide.title, guide.metaDescription);

  const related = resultGuides
    .filter((item) => item.slug !== guide.slug && item.category === guide.category)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-accent/20 to-background">
          <div className="container py-12 md:py-16">
            <Breadcrumb items={[
              { label: t('header.examResults'), href: '/results' },
              { label: guide.title }
            ]} />
            <div className="space-y-4 max-w-3xl">
              <Badge variant="outline" className="text-primary border-primary/60">
                {t(`guidePages.categories.${guide.category}`) || t('guidePages.categories.general')}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{guide.heroTitle}</h1>
              <p className="text-lg text-muted-foreground">{guide.heroDescription}</p>
              <p className="text-sm text-muted-foreground">{guide.examBody}</p>
            </div>
          </div>
        </section>

        <section className="container py-12 space-y-12">
          {guide.steps && guide.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('guidePages.followSteps')}</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>{t('guidePages.officialLinks')}</CardTitle>
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
                      {t('guidePages.visitSite')}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

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

          {guide.tips && guide.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('guidePages.quickTips')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {guide.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <HelpCircle className="mt-1 h-4 w-4 text-primary" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {guide.faq && guide.faq.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('guidePages.faq')}</CardTitle>
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
              <h2 className="text-2xl font-semibold">{t('guidePages.relatedGuides')}</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {related.map((item) => (
                  <Card key={item.slug} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{item.heroDescription}</p>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/results/${item.slug}`}>{t('guidePages.readGuide')}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Alert className="border-primary/50 bg-primary/5">
            <AlertDescription className="text-sm text-muted-foreground">
              {t('guidePages.disclaimers.result')}
            </AlertDescription>
          </Alert>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ResultGuide;
