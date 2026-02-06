// Netlify Function: update-puppies.js
// Requires environment variables set in Netlify:
// - GITHUB_TOKEN : Personal access token with repo access (securely stored on Netlify)
// - ADMIN_PASSWORD : admin panel password to authenticate requests from admin UI

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { password, owner, repo, branch: requestedBranch, path = 'site/puppies.js', content, commitMessage = 'Update puppies.js via admin panel' } = body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    if (!process.env.GITHUB_TOKEN) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfigured: missing GITHUB_TOKEN' }) };
    }

    if (!owner || !repo || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required parameters' }) };
    }

    const token = process.env.GITHUB_TOKEN;
    const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' };

    // Get repo info to determine default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      const text = await repoRes.text();
      return { statusCode: 400, body: JSON.stringify({ error: 'Unable to access repo: ' + text }) };
    }
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || 'main';

    const branch = requestedBranch && requestedBranch.trim() !== '' ? requestedBranch.trim() : `admin-updates-${Date.now()}`;

    // Get default branch ref
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${defaultBranch}`, { headers });
    if (!refRes.ok) {
      const text = await refRes.text();
      return { statusCode: 400, body: JSON.stringify({ error: 'Failed to get base branch ref: ' + text }) };
    }
    const refData = await refRes.json();
    const sha = refData.object.sha;

    // Create new branch if it doesn't exist
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha })
    });

    if (![201,422].includes(createRefRes.status)) {
      const text = await createRefRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create branch: ' + text }) };
    }

    // Check if file exists to get sha
    const getFileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`, { headers });
    let existingSha = null;
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      existingSha = fileData.sha;
    }

    // Create or update the file
    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: commitMessage, content: Buffer.from(content).toString('base64'), branch, sha: existingSha })
    });

    if (!putRes.ok) {
      const text = await putRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create/update file: ' + text }) };
    }
    const putData = await putRes.json();

    // Create PR against default branch
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Admin panel updates: puppies.js', head: branch, base: defaultBranch, body: 'Automated update from admin panel' })
    });

    if (!prRes.ok) {
      const text = await prRes.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create PR: ' + text }) };
    }
    const prData = await prRes.json();

    return { statusCode: 200, body: JSON.stringify({ ok: true, pr: prData.html_url, commit: putData.content.html_url }) };

  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
