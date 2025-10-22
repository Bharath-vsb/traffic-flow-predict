import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { videoData } = await req.json();
    
    console.log('Analyzing traffic video...');

    // Call Lovable AI for traffic analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI traffic management expert. Analyze traffic video data and provide signal timing recommendations.
            
            Return a JSON response with this exact structure:
            {
              "signals": [
                {"direction": "North", "state": "green", "timing": 45},
                {"direction": "South", "state": "red", "timing": 60},
                {"direction": "East", "state": "yellow", "timing": 15},
                {"direction": "West", "state": "red", "timing": 60}
              ],
              "congestionLevel": "medium",
              "vehicleCount": 87,
              "analysis": "Detailed analysis of traffic patterns"
            }
            
            - state must be one of: "red", "yellow", "green"
            - congestionLevel must be one of: "low", "medium", "high"
            - timing is in seconds (15-90 range)
            - Only one direction should have green at a time
            - Adjust timings based on congestion: higher congestion = longer green times for busy directions
            `
          },
          {
            role: 'user',
            content: `Analyze this traffic scenario: ${videoData || 'Standard 4-way intersection with moderate traffic flow from all directions'}. Provide optimal signal timings based on vehicle density and traffic patterns.`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI analysis failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response from AI
    let analysisResult;
    try {
      // Extract JSON from response (handle both pure JSON and markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to default analysis
      analysisResult = {
        signals: [
          { direction: 'North', state: 'green', timing: 45 },
          { direction: 'South', state: 'red', timing: 60 },
          { direction: 'East', state: 'yellow', timing: 15 },
          { direction: 'West', state: 'red', timing: 60 }
        ],
        congestionLevel: 'medium',
        vehicleCount: 72,
        analysis: 'Standard traffic pattern detected with moderate congestion.'
      };
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-traffic function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
