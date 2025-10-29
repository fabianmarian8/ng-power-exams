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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const boardId = url.searchParams.get('board_id');

    let query = supabase
      .from('exam_guides')
      .select('*')
      .order('last_checked', { ascending: false });

    if (boardId) {
      query = query.eq('id', boardId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // If no data in database, return mock data
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify(getMockExamData()),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching exam status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getMockExamData() {
  return [
    {
      id: 'jamb',
      name: 'Joint Admissions and Matriculation Board',
      acronym: 'JAMB',
      description: 'JAMB UTME results checker and guide',
      status: 'AWAITING RELEASE',
      last_checked: new Date().toISOString(),
      portal_url: 'https://www.jamb.gov.ng/efacility/',
      quick_links: [
        { label: 'Check Result', url: 'https://www.jamb.gov.ng/efacility/CheckUTMEResults' },
        { label: 'Print Result Slip', url: 'https://www.jamb.gov.ng/efacility/PrintUTMEResultSlip' }
      ],
      steps: [
        'Visit the JAMB e-Facility portal',
        'Select "Check UTME Results"',
        'Enter your registration number',
        'Provide your exam year',
        'Click "Check Result"'
      ],
      common_issues: [
        'Portal may be slow during peak hours',
        'Results are typically released 2-3 weeks after exam'
      ],
      sms_guide: {
        format: 'RESULT [REGISTRATION_NUMBER]',
        send_to: '55019',
        example: 'RESULT 12345678AB'
      }
    },
    {
      id: 'waec',
      name: 'West African Examinations Council',
      acronym: 'WAEC',
      description: 'WAEC results checker for WASSCE/GCE',
      status: 'AWAITING RELEASE',
      last_checked: new Date().toISOString(),
      portal_url: 'https://www.waecdirect.org/',
      quick_links: [
        { label: 'Check Result', url: 'https://www.waecdirect.org/result-checker' }
      ],
      steps: [
        'Visit WAEC Direct portal',
        'Select examination type (WASSCE/GCE)',
        'Select examination year',
        'Enter your examination number',
        'Enter card serial number and PIN',
        'Click "Submit"'
      ],
      common_issues: [
        'Requires scratch card purchase',
        'Portal may timeout during high traffic'
      ],
      sms_guide: null
    },
    {
      id: 'neco',
      name: 'National Examinations Council',
      acronym: 'NECO',
      description: 'NECO SSCE results checker',
      status: 'AWAITING RELEASE',
      last_checked: new Date().toISOString(),
      portal_url: 'https://www.mynecoexams.com/',
      quick_links: [
        { label: 'Check Result', url: 'https://result.neco.gov.ng/' }
      ],
      steps: [
        'Visit NECO results portal',
        'Select examination type',
        'Enter your examination number',
        'Enter token from scratch card',
        'Click "Check Result"'
      ],
      common_issues: [
        'Requires result checking card',
        'Card must be purchased from authorized vendors'
      ],
      sms_guide: null
    }
  ];
}
