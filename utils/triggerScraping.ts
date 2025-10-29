/**
 * Helper functions to manually trigger scraping edge functions
 */

export async function triggerPowerOutageScraping() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL not configured');
    return { success: false, error: 'Backend not configured' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/scrape-power-outages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ Power outage scraping completed:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error triggering power outage scraping:', error);
    return { success: false, error };
  }
}

export async function triggerNewsScraping() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('VITE_SUPABASE_URL not configured');
    return { success: false, error: 'Backend not configured' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/scrape-news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('✅ News scraping completed:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error triggering news scraping:', error);
    return { success: false, error };
  }
}

export async function triggerAllScraping() {
  console.log('🚀 Starting all scraping tasks...');
  
  const [powerOutagesResult, newsResult] = await Promise.all([
    triggerPowerOutageScraping(),
    triggerNewsScraping(),
  ]);

  return {
    powerOutages: powerOutagesResult,
    news: newsResult,
    allSuccess: powerOutagesResult.success && newsResult.success,
  };
}
