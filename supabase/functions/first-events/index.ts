import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirstEvent {
  code: string;
  name: string;
  type: string;
  districtCode?: string;
  dateStart: string;
  dateEnd: string;
  address?: string;
  timezone?: string;
  website?: string;
  webcasts?: Array<{ type: string; channel: string; file?: string }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let season, search, eventType, district, startDate, endDate;
    
    // Handle cases where request body might be empty or invalid
    try {
      const body = await req.json();
      ({ season, search, eventType, district, startDate, endDate } = body);
    } catch (jsonError) {
      console.log('No JSON body provided, using default values');
      // Use defaults if no body is provided
      season = undefined;
      search = undefined;
      eventType = undefined;
      district = undefined;
      startDate = undefined;
      endDate = undefined;
    }
    
    // Default to current season if not provided
    const currentSeason = season || new Date().getFullYear();
    
    // Create the authorization header using base64 encoding
    const username = 'mageofshan';
    const authToken = '5ffdbfa6-7836-43ba-afb9-c5e056e8a387';
    const credentials = btoa(`${username}:${authToken}`);
    
    const baseUrl = 'https://frc-api.firstinspires.org';
    let apiUrl = `${baseUrl}/v3.0/${currentSeason}/events`;
    
    console.log(`Fetching events from: ${apiUrl}`);
    
    // Create headers using Headers constructor as per FIRST API documentation
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
      console.error(`API Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`FIRST API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Received ${data.Events?.length || 0} events from API`);
    
    let events: FirstEvent[] = data.Events || [];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter(event => 
        event.name?.toLowerCase().includes(searchLower) ||
        event.address?.toLowerCase().includes(searchLower) ||
        event.code?.toLowerCase().includes(searchLower) ||
        event.districtCode?.toLowerCase().includes(searchLower)
      );
    }

    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }

    if (district) {
      events = events.filter(event => event.districtCode === district);
    }

    if (startDate) {
      events = events.filter(event => event.dateStart >= startDate);
    }

    if (endDate) {
      events = events.filter(event => event.dateEnd <= endDate);
    }

    // Sort by date (upcoming events first)
    events.sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

    console.log(`Returning ${events.length} filtered events`);

    return new Response(
      JSON.stringify({ events }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in first-events function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch FIRST events', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});