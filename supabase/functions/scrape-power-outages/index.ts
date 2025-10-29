/// <reference lib="deno.ns" />
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting power outages scraping...');

    // Scrape Ikeja Electric
    const ikejaOutages = await scrapeIkejaElectric();
    console.log(`✅ Scraped ${ikejaOutages.length} Ikeja outages`);

    // Scrape IBEDC
    const ibedcOutages = await scrapeIBEDC();
    console.log(`✅ Scraped ${ibedcOutages.length} IBEDC outages`);

    // Combine all outages
    const allOutages = [...ikejaOutages, ...ibedcOutages];

    // Delete old outages (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('power_outages')
      .delete()
      .lt('created_at', sevenDaysAgo);

    // Delete existing outages to avoid duplicates
    await supabase.from('power_outages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert new outages
    if (allOutages.length > 0) {
      const { error } = await supabase
        .from('power_outages')
        .insert(allOutages);

      if (error) {
        console.error('Error inserting outages:', error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: allOutages.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error scraping power outages:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapeIkejaElectric() {
  const PROXY_URL = 'https://api.allorigins.win/raw?url=';
  const FAULT_LOG_URL = 'https://www.ikejaelectric.com/fault-log';
  
  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(FAULT_LOG_URL)}`);
    if (!response.ok) {
      console.log('Ikeja Electric website not accessible');
      return [];
    }
    
    const html = await response.text();
    const outages = parseIkejaHTML(html);
    
    return outages.map(outage => ({
      disco_id: 'IKEDC',
      affected_area: outage.location || 'Unknown Area',
      type: determineOutageType(outage.fault || ''),
      reason: outage.fault || 'Power outage reported',
      start_time: outage.dateReported ? new Date(outage.dateReported).toISOString() : new Date().toISOString(),
      estimated_restore_time: outage.estimatedRestoration ? new Date(outage.estimatedRestoration).toISOString() : null,
      restored_time: null,
      source: FAULT_LOG_URL,
      source_type: 'OFFICIAL',
      metadata: {
        faultType: outage.faultType,
        rawData: outage
      }
    }));
  } catch (error) {
    console.error('Error scraping Ikeja Electric:', error);
    return [];
  }
}

async function scrapeIBEDC() {
  const PROXY_URL = 'https://api.allorigins.win/raw?url=';
  const OUTAGE_URL = 'https://www.ibedc.com/outage-information';
  
  try {
    const response = await fetch(`${PROXY_URL}${encodeURIComponent(OUTAGE_URL)}`);
    if (!response.ok) {
      console.log('IBEDC website not accessible');
      return [];
    }
    
    const html = await response.text();
    const outages = parseIBEDCHTML(html);
    
    return outages.map(outage => ({
      disco_id: 'IBEDC',
      affected_area: outage.area || 'Unknown Area',
      type: outage.type || 'UNPLANNED',
      reason: outage.reason || 'Power outage reported',
      start_time: outage.startTime ? new Date(outage.startTime).toISOString() : new Date().toISOString(),
      estimated_restore_time: outage.estimatedRestore ? new Date(outage.estimatedRestore).toISOString() : null,
      restored_time: null,
      source: OUTAGE_URL,
      source_type: 'OFFICIAL',
      metadata: {
        rawData: outage
      }
    }));
  } catch (error) {
    console.error('Error scraping IBEDC:', error);
    return [];
  }
}

function parseIkejaHTML(html: string) {
  const outages: any[] = [];
  
  try {
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 4) {
        const getText = (cell: string) => cell.replace(/<[^>]*>/g, '').trim();
        
        outages.push({
          location: getText(cells[0]),
          fault: getText(cells[1]),
          dateReported: getText(cells[2]),
          estimatedRestoration: getText(cells[3]),
          faultType: 'Equipment Fault'
        });
      }
    }
  } catch (error) {
    console.error('Error parsing Ikeja HTML:', error);
  }
  
  return outages;
}

function parseIBEDCHTML(html: string) {
  const outages: any[] = [];
  
  try {
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    
    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (cells.length >= 3) {
        const getText = (cell: string) => cell.replace(/<[^>]*>/g, '').trim();
        
        outages.push({
          area: getText(cells[0]),
          reason: getText(cells[1]),
          startTime: getText(cells[2]),
          type: 'UNPLANNED'
        });
      }
    }
  } catch (error) {
    console.error('Error parsing IBEDC HTML:', error);
  }
  
  return outages;
}

function determineOutageType(fault: string): string {
  const lowerFault = fault.toLowerCase();
  
  if (lowerFault.includes('planned') || lowerFault.includes('scheduled')) {
    return 'PLANNED';
  }
  
  if (lowerFault.includes('restored') || lowerFault.includes('fixed')) {
    return 'RESTORED';
  }
  
  return 'UNPLANNED';
}
