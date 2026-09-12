const router = require('express').Router();
const pool   = require('../lib/db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const https  = require('https');
const http   = require('http');
const { URL } = require('url');

const DEFAULT_CHURCH_ID = () => process.env.DEFAULT_CHURCH_ID;

// ── Helpers ──────────────────────────────────────────────────

// Fetch a URL and return text (max 50KB, 5s timeout)
function fetchUrl(rawUrl) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(rawUrl); } catch { return reject(new Error('Invalid URL')); }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(rawUrl, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', (chunk) => { if (data.length < 50000) data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

// Extract basic org info from HTML
function parseOrgInfo(html, url) {
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch  = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const ogName     = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
                  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  const ogDesc     = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
                  || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);

  const name = (ogName?.[1] || titleMatch?.[1] || new URL(url).hostname).replace(/\s*[-|].*$/, '').trim();
  const description = strip(ogDesc?.[1] || descMatch?.[1] || '').slice(0, 400);

  return { name, description, website: url };
}

// Build letter content
function buildLetter({ letterType, applicantName, applicantStatus, dateJoined, additionalInfo,
  orgName, purpose, extraInfo, signatoryName, signatoryTitle, churchName, churchContact, logoUrl }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  // Choir letters: header and body reference only the choir, not the church name
  const choirName = `${churchName} Choir`;
  const entity = letterType === 'choir' ? choirName : churchName;
  const relationship = letterType === 'choir'
    ? `a valued member of the ${choirName}`
    : `a faithful member of ${churchName}`;

  return `${today}

The Admissions/Selection Committee
${orgName || '[Organization Name]'}

Dear Sir/Madam,

RE: LETTER OF RECOMMENDATION FOR ${applicantName.toUpperCase()}

It is with great pleasure and without reservation that I write this letter of recommendation on behalf of ${applicantName}, who has been ${relationship}${dateJoined ? ` since ${dateJoined}` : ''}.

${applicantName} has demonstrated exceptional character, dedication, and commitment throughout their time with us. ${applicantStatus ? `As ${applicantStatus}, they have consistently shown leadership, reliability, and a genuine desire to serve and contribute to our community.` : 'They have consistently shown leadership, reliability, and a genuine desire to serve and contribute to our community.'}

${additionalInfo ? additionalInfo + '\n\n' : ''}${letterType === 'choir'
  ? `Within our choir ministry, ${applicantName} has shown remarkable musical ability, discipline, and a collaborative spirit. Their dedication to rehearsals, performances, and the overall mission of our music ministry speaks volumes about their character and work ethic.`
  : `Within our church community, ${applicantName} has been an active and positive presence. Their integrity, faithfulness, and willingness to serve have made a meaningful impact on our congregation.`}

${purpose ? `I understand that ${applicantName} is applying to ${orgName || 'your organization'} for ${purpose}. I am confident that they will bring the same level of dedication, professionalism, and excellence that they have demonstrated here.` : `I am confident that ${applicantName} will bring the same level of dedication, professionalism, and excellence that they have demonstrated here.`}

${extraInfo ? extraInfo + '\n\n' : ''}I wholeheartedly recommend ${applicantName} for any opportunity your organization may offer. Please do not hesitate to contact us should you require any further information.

Yours sincerely,


____________________________
Signature

${signatoryName || '[Signatory Name]'}
${signatoryTitle || '[Title]'}
${entity}
${churchContact || ''}`;
}

  return `${today}

The Admissions/Selection Committee
${orgName || '[Organization Name]'}

Dear Sir/Madam,

RE: LETTER OF RECOMMENDATION FOR ${applicantName.toUpperCase()}

It is with great pleasure and without reservation that I write this letter of recommendation on behalf of ${applicantName}, who has been ${relationship}${dateJoined ? ` since ${dateJoined}` : ''}.

${applicantName} has demonstrated exceptional character, dedication, and commitment throughout their time with us. ${applicantStatus ? `As ${applicantStatus}, they have consistently shown leadership, reliability, and a genuine desire to serve and contribute to our community.` : 'They have consistently shown leadership, reliability, and a genuine desire to serve and contribute to our community.'}

${additionalInfo ? additionalInfo + '\n\n' : ''}${letterType === 'choir'
  ? `Within our choir ministry, ${applicantName} has shown remarkable musical ability, discipline, and a collaborative spirit. Their dedication to rehearsals, performances, and the overall mission of our music ministry speaks volumes about their character and work ethic.`
  : `Within our church community, ${applicantName} has been an active and positive presence. Their integrity, faithfulness, and willingness to serve have made a meaningful impact on our congregation.`}

${purpose ? `I understand that ${applicantName} is applying to ${orgName || 'your organization'} for ${purpose}. I am confident that they will bring the same level of dedication, professionalism, and excellence that they have demonstrated here.` : `I am confident that ${applicantName} will bring the same level of dedication, professionalism, and excellence that they have demonstrated here.`}

${extraInfo ? extraInfo + '\n\n' : ''}I wholeheartedly recommend ${applicantName} for any opportunity your organization may offer. Please do not hesitate to contact us should you require any further information.

Yours sincerely,


____________________________
Signature

${signatoryName || '[Signatory Name]'}
${signatoryTitle || '[Title]'}
${entity}
${churchContact || ''}`;
}

// ── ROUTES ───────────────────────────────────────────────────

// POST /api/rec-letters/lookup-org — fetch org info from URL
router.post('/lookup-org', authenticate, requireAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const html = await fetchUrl(url);
    const info = parseOrgInfo(html, url);
    res.json({ success: true, org: info });
  } catch (err) {
    res.json({ success: false, error: err.message, org: null });
  }
});

// GET /api/rec-letters — list all letters (admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const churchId = req.churchId || DEFAULT_CHURCH_ID();
    const { rows } = await pool.query(
      `SELECT rl.*, u.email AS generated_by_email,
              m.first_name AS generated_by_first, m.last_name AS generated_by_last
       FROM recommendation_letters rl
       LEFT JOIN users u ON u.id = rl.generated_by
       LEFT JOIN members m ON m.user_id = u.id
       WHERE rl.church_id = $1
       ORDER BY rl.created_at DESC`,
      [churchId]
    );
    res.json({ letters: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/rec-letters — create + generate letter
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const churchId = req.churchId || DEFAULT_CHURCH_ID();
    const {
      applicant_name, applicant_status, date_joined, additional_info,
      org_name, org_website, org_type, org_description, purpose, extra_info,
      letter_type,
    } = req.body;

    if (!applicant_name) return res.status(400).json({ error: 'Applicant name is required' });
    if (!letter_type || !['church','choir'].includes(letter_type))
      return res.status(400).json({ error: 'letter_type must be "church" or "choir"' });

    // Fetch church info from CMS
    const { rows: cmsRows } = await pool.query(
      `SELECT key, value FROM cms_settings WHERE church_id = $1 AND key IN ('footer_church_name','site_logo_url','contact_phone','contact_email','footer_address')`,
      [churchId]
    );
    const cms = Object.fromEntries(cmsRows.map((r) => [r.key, r.value]));
    const churchName    = cms.footer_church_name || 'LUS4G Church';
    const churchContact = [cms.footer_address, cms.contact_phone, cms.contact_email].filter(Boolean).join(' | ');
    const logoUrl       = cms.site_logo_url || '';

    // Fetch signatory from leadership
    const signatoryPattern = letter_type === 'choir'
      ? /choir\s*director|music\s*director/i
      : /pastor|overseer|bishop|senior\s*pastor/i;

    const { rows: leaders } = await pool.query(
      `SELECT name, title FROM leadership WHERE church_id = $1 AND is_active = TRUE ORDER BY sort_order ASC`,
      [churchId]
    );
    const signatory = leaders.find((l) => signatoryPattern.test(l.title)) || leaders[0] || null;

    // Generate letter content
    const letterContent = buildLetter({
      letterType: letter_type,
      applicantName: applicant_name,
      applicantStatus: applicant_status,
      dateJoined: date_joined,
      additionalInfo: additional_info,
      orgName: org_name,
      purpose,
      extraInfo: extra_info,
      signatoryName: signatory?.name,
      signatoryTitle: signatory?.title,
      churchName,
      churchContact,
      logoUrl,
    });

    const { rows: [letter] } = await pool.query(
      `INSERT INTO recommendation_letters
        (church_id, applicant_name, applicant_status, date_joined, additional_info,
         org_name, org_website, org_type, org_description, purpose, extra_info,
         letter_type, letter_content, signatory_name, signatory_title,
         generated_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'generated')
       RETURNING *`,
      [
        churchId, applicant_name, applicant_status || null, date_joined || null, additional_info || null,
        org_name || null, org_website || null, org_type || null, org_description || null,
        purpose || null, extra_info || null,
        letter_type, letterContent, signatory?.name || null, signatory?.title || null,
        req.user.id,
      ]
    );

    res.status(201).json({
      letter,
      church_name: churchName,
      logo_url: logoUrl,
      church_contact: churchContact,
    });
  } catch (err) {
    console.error('[POST /rec-letters]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/rec-letters/:id — get single letter
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { rows: [letter] } = await pool.query(
      `SELECT rl.*, u.email AS generated_by_email,
              m.first_name AS generated_by_first, m.last_name AS generated_by_last
       FROM recommendation_letters rl
       LEFT JOIN users u ON u.id = rl.generated_by
       LEFT JOIN members m ON m.user_id = u.id
       WHERE rl.id = $1`,
      [req.params.id]
    );
    if (!letter) return res.status(404).json({ error: 'Letter not found' });

    // Also return church info for rendering
    const churchId = letter.church_id;
    const { rows: cmsRows } = await pool.query(
      `SELECT key, value FROM cms_settings WHERE church_id = $1 AND key IN ('footer_church_name','site_logo_url','contact_phone','contact_email','footer_address')`,
      [churchId]
    );
    const cms = Object.fromEntries(cmsRows.map((r) => [r.key, r.value]));

    res.json({
      letter,
      church_name: cms.footer_church_name || 'LUS4G Church',
      logo_url: cms.site_logo_url || '',
      church_contact: [cms.footer_address, cms.contact_phone, cms.contact_email].filter(Boolean).join(' | '),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/rec-letters/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM recommendation_letters WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
