import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FtcEvent {
  eventId: string;
  code: string;
  divisionCode?: string;
  name: string;
  remote?: boolean;
  hybrid?: boolean;
  fieldCount?: number;
  published?: boolean;
  type: string;
  typeName?: string;
  regionCode?: string;
  leagueCode?: string;
  districtCode?: string;
  venue?: string;
  address?: string;
  city?: string;
  stateprov?: string;
  country?: string;
  website?: string;
  liveStreamUrl?: string;
  dateStart?: string;
  dateEnd?: string;
  timezone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let season, search, eventType, region, startDate, endDate, teamNumber;
    
    // Handle cases where request body might be empty or invalid
    try {
      const body = await req.json();
      ({ season, search, eventType, region, startDate, endDate, teamNumber } = body);
    } catch (jsonError) {
      console.log('No JSON body provided, using default values');
      // Use defaults if no body is provided
      season = undefined;
      search = undefined;
      eventType = undefined;
      region = undefined;
      startDate = undefined;
      endDate = undefined;
      teamNumber = undefined;
    }
    
    // Default to current season if not provided
    const currentSeason = season || new Date().getFullYear();
    
    // Create the authorization header using base64 encoding
    const username = 'mageofshan';
    const authToken = '063D04A9-18FF-4A83-9E22-4E733BDD3BA5';
    const credentials = btoa(`${username}:${authToken}`);
    
    const baseUrl = 'http://ftc-api.firstinspires.org';
    let apiUrl = `${baseUrl}/v2.0/${currentSeason}/events`;
    
    // Add query parameters if specified
    const queryParams = new URLSearchParams();
    if (teamNumber) {
      queryParams.append('teamNumber', teamNumber.toString());
    }
    
    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`;
    }
    
    console.log(`Fetching FTC events from: ${apiUrl}`);
    
    // Create headers using Headers constructor as per FTC API documentation
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Basic ${credentials}`);
    myHeaders.append("If-Modified-Since", "");
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect
    };
    
    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      console.error(`FTC API Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`FTC API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.events?.length || 0} FTC events from API`);
    
    let events: FtcEvent[] = data.events || [];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(event => 
        event.name?.toLowerCase().includes(searchLower) ||
        event.address?.toLowerCase().includes(searchLower) ||
        event.code?.toLowerCase().includes(searchLower) ||
        event.regionCode?.toLowerCase().includes(searchLower) ||
        event.city?.toLowerCase().includes(searchLower) ||
        event.venue?.toLowerCase().includes(searchLower)
      );
    }

    if (eventType) {
      events = events.filter(event => event.type === eventType || event.typeName === eventType);
    }

    if (region) {
      events = events.filter(event => event.regionCode === region);
    }

    if (startDate && events[0]?.dateStart) {
      events = events.filter(event => event.dateStart && event.dateStart >= startDate);
    }

    if (endDate && events[0]?.dateEnd) {
      events = events.filter(event => event.dateEnd && event.dateEnd <= endDate);
    }

    // Sort by event code (since we don't have dates in all events)
    events.sort((a, b) => (a.dateStart || a.code).localeCompare(b.dateStart || b.code));

    console.log(`Returning ${events.length} filtered FTC events`);

    return new Response(
      JSON.stringify({ events }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ftc-events function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch FTC events', 
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});