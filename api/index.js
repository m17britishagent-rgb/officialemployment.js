module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ 
      found: false, 
      error: 'Missing required query parameter: username' 
    });
  }

  const googleScriptUrl = `https://script.google.com/macros/s/AKfycbx1ZAmQ2N-e5MoNmO7pDgYwoPgYsCl9NMlg2BpCmT46WcKM00SRI7Xmd4oEvhTsnipr/exec?username=${encodeURIComponent(username)}`;

  try {
    const response = await fetch(googleScriptUrl, { 
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });
    
    const rawText = await response.text();

    // Check if Google returned an HTML page instead of JSON
    if (rawText.trim().startsWith('<')) {
      return res.status(502).json({
        found: false,
        error: 'Google Apps Script returned an HTML error page instead of JSON. Ensure deployment permission is set to "Anyone".'
      });
    }

    const json = JSON.parse(rawText);

    if (json.success && json.data) {
      return res.status(200).json({
        found: true,
        user: json.data.user || "N/A",
        agency: json.data.agency || "N/A",
        date: json.data.date || "N/A",
        type: json.data.type || "N/A"
      });
    }

    if (json.found !== undefined) {
      return res.status(200).json(json);
    }

    return res.status(200).json({
      found: false,
      message: "User not found on blacklist."
    });

  } catch (error) {
    return res.status(500).json({ 
      found: false, 
      error: 'Failed to parse endpoint response',
      details: error.message 
    });
  }
};
