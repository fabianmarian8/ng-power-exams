/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RSS_FEEDS = [
  { url: 'https://punchng.com/category/business/feed/', source: 'Punch Nigeria', category: 'ENERGY' },
  { url: 'https://www.premiumtimesng.com/category/news/feed', source: 'Premium Times', category: 'ENERGY' },
  { url: 'https://guardian.ng/category/news/feed/', source: 'Guardian Nigeria', category: 'ENERGY' },
  { url: 'https://www.vanguardngr.com/category/business/feed/', source: 'Vanguard', category: 'ENERGY' },
  { url: 'https://www.channelstv.com/feed/', source: 'Channels TV', category: 'ENERGY' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📰 Starting news scraping...');

    const allNews: any[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const news = await fetchRSSFeed(feed.url, feed.source, feed.category);
        allNews.push(...news);
        console.log(`✅ Scraped ${news.length} articles from ${feed.source}`);
      } catch (error) {
        console.error(`Error scraping ${feed.source}:`, error);
      }
    }

    // Delete old news (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('news_items')
      .delete()
      .lt('created_at', thirtyDaysAgo);

    // Delete existing news to avoid duplicates
    await supabase.from('news_items').delete().neq('id', 0);

    // Insert new news
    if (allNews.length > 0) {
      const { error } = await supabase
        .from('news_items')
        .insert(allNews);

      if (error) {
        console.error('Error inserting news:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: allNews.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error scraping news:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchRSSFeed(url: string, source: string, category: string) {
  const PROXY_URL = 'https://api.allorigins.win/raw?url=';
  
  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
    if (!response.ok) {
      console.log(`RSS feed ${source} not accessible`);
      return [];
    }
    
    const xml = await response.text();
    return parseRSSFeed(xml, source, category);
  } catch (error) {
    console.error(`Error fetching RSS feed ${source}:`, error);
    return [];
  }
}

function parseRSSFeed(xml: string, source: string, category: string) {
  const items: any[] = [];
  
  try {
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 20)) {
      const title = extractTag(itemXml, 'title');
      const link = extractTag(itemXml, 'link');
      const description = extractTag(itemXml, 'description');
      const pubDate = extractTag(itemXml, 'pubDate');
      
      if (title && link) {
        items.push({
          category,
          title: cleanText(title),
          summary: cleanText(description),
          url: link,
          source,
          timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          metadata: {
            rawPubDate: pubDate
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
  }
  
  return items;
}

function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function cleanText(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}
