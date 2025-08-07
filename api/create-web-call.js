// Vercel Serverless Function for Retell.AI
import Retell from 'retell-sdk';

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});

// Your agent IDs - update these with your actual agent IDs
const AGENTS = {
  support: process.env.SUPPORT_AGENT_ID,
  sales: process.env.SALES_AGENT_ID,
  consultant: process.env.CONSULTANT_AGENT_ID,
};

export default async function handler(req, res) {
  // Enable CORS
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
    const { agent_type = 'support', user_id, metadata = {} } = req.body;

    const agent_id = AGENTS[agent_type];
    if (!agent_id) {
      res.status(400).json({ 
        error: 'Invalid agent type',
        available_types: Object.keys(AGENTS)
      });
      return;
    }

    const webCallResponse = await retell.call.createWebCall({
      agentId: agent_id,
      metadata: {
        user_id: user_id || 'anonymous',
        agent_type: agent_type,
        session_start: new Date().toISOString(),
        deployment: 'vercel',
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
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
