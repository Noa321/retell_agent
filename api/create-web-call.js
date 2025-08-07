import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { user_id, metadata = {} } = req.body;

    const webCallResponse = await retell.call.createWebCall({
      agentId: process.env.AGENT_ID,
      metadata: {
        user_id: user_id || 'anonymous',
        session_start: new Date().toISOString(),
        ...metadata
      }
    });

    res.status(200).json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id
    });

  } catch (error) {
    console.error('Error creating web call:', error);
    res.status(500).json({
      error: 'Failed to create call',
      details: error.message
    });
  }
}
