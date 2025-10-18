import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, RefreshCw } from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { formatLocalizedDateTime } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function LiveNewsBoard() {
  const { items, official, media, isLoading, isRefetching, data } = useNews();
  const { language } = useLanguage();

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `pred ${seconds}s`;
    if (seconds < 3600) return `pred ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `pred ${Math.floor(seconds / 3600)}h`;
    return `pred ${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">📰 Aktuálne správy</h2>
          {isRefetching && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Aktualizované: {formatLocalizedDateTime(data.generatedAt, language)}</span>
        </div>
      </div>

      {items.length === 0 && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Žiadne správy</AlertTitle>
          <AlertDescription>
            Momentálne nie sú k dispozícii žiadne nové správy. Skontrolujte neskôr.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {official.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-nigeria-green">Oficiálne zdroje</Badge>
              <span className="text-sm text-muted-foreground">({official.length})</span>
            </div>
            <div className="space-y-4">
              {official.map((item, idx) => (
                <ScrollReveal key={item.id} delay={idx * 50}>
                  <Card className="border-l-4 border-l-nigeria-green hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{item.source}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(item.publishedAt)}
                            </span>
                          </div>
                          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription className="text-sm line-clamp-3">
                        {item.summary}
                      </CardDescription>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
                          Čítať viac
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}

        {media.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Médiá</Badge>
              <span className="text-sm text-muted-foreground">({media.length})</span>
            </div>
            <div className="space-y-4">
              {media.map((item, idx) => (
                <ScrollReveal key={item.id} delay={idx * 50}>
                  <Card className="border-l-4 border-l-muted hover:shadow-lg transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">{item.source}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(item.publishedAt)}
                            </span>
                          </div>
                          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription className="text-sm line-clamp-3">
                        {item.summary}
                      </CardDescription>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
                          Čítať viac
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
