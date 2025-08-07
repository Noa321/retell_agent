// api/create-web-call.js - Fixed Vercel Serverless Function

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Check environment variables
    const RETELL_API_KEY = process.env.RETELL_API_KEY;
    const AGENT_ID = process.env.AGENT_ID;

    if (!RETELL_API_KEY) {
      console.error('RETELL_API_KEY environment variable is missing');
      res.status(500).json({ 
        error: 'Server configuration error: RETELL_API_KEY not set',
        details: 'Environment variable RETELL_API_KEY is required'
      });
      return;
    }

    if (!AGENT_ID) {
      console.error('AGENT_ID environment variable is missing');
      res.status(500).json({ 
        error: 'Server configuration error: AGENT_ID not set',
        details: 'Environment variable AGENT_ID is required'
      });
      return;
    }

    const { user_id, metadata = {} } = req.body;

    console.log('Creating web call for agent:', AGENT_ID);

    // Call Retell API directly using fetch (no SDK needed)
    const retellResponse = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: AGENT_ID,
        metadata: {
          user_id: user_id || 'anonymous',
          session_start: new Date().toISOString(),
          deployment: 'vercel',
          ...metadata
        }
      })
    });

    if (!retellResponse.ok) {
      const errorText = await retellResponse.text();
      console.error('Retell API error:', retellResponse.status, errorText);
      
      res.status(500).json({
        error: 'Retell API error',
        details: `Retell API returned ${retellResponse.status}: ${errorText}`,
        retell_status: retellResponse.status
      });
      return;
    }

    const retellData = await retellResponse.json();

    console.log('Successfully created web call:', retellData.call_id);

    // Return the access token and call ID
    res.status(200).json({
      access_token: retellData.access_token,
      call_id: retellData.call_id,
      success: true
    });

  } catch (error) {
    console.error('Unexpected error in create-web-call:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      type: error.name || 'UnknownError'
    });
  }
}
