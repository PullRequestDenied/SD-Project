// controllers/searchController.js


const { createClient } = require("@supabase/supabase-js");
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const bucket = process.env.SUPABASE_BUCKET;
// Initialize Vertex AI
const vertexai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT, // e.g. 'copper-moon-387900'
  location: 'us-central1',                   // your region
});
const isValidDate = (s) => {
  // Date.parse returns NaN for invalid strings
  const t = Date.parse(s);
  return typeof s === 'string' && !isNaN(t);
};
/**
 * GET /api/search
 * Query params: term, from, to, page, perPage
 */
// controllers/searchController.js
exports.searchFiles = async (req, res) => {
  try {
    const {
      term = '',       // only "term" now
      from,
      to,
      fileType,
      sort = 'created_at',
      order = 'desc',  // "asc" or "desc"
      page = '1',
      perPage = '20',
    } = req.query;

    const pageNum    = Math.max(1, parseInt(page,   10));
    const perPageNum = Math.min(100, parseInt(perPage,10));
    const offset     = (pageNum - 1) * perPageNum;

    // 1) Build base
    let query = supabase
      .from('files')
      .select('*', { count: 'exact' });

    // 2) Full‐text search on "term"
    if (term.trim()) {
      query = query.textSearch('document', term, {
        config: 'english',
        type: 'websearch',
      });
    }

    // 3) Date filters
    if (isValidDate(from) && isValidDate(to)) {
      query = query.gte('created_at', from).lte('created_at', to);
    }

    // 4) File-type filter
    if (fileType) {
      query = query.eq('type', fileType);
    }

    // 5) Sorting & pagination
    query = query
      .order(sort,    { ascending: order.toLowerCase() === 'asc' })
      .range(offset, offset + perPageNum - 1);

    // 6) Execute
    const { data, count, error } = await query;
    if (error) throw error;

    // 7) Enrich with publicUrl (skip in tests)
    const skipEnrichment = process.env.NODE_ENV === 'test';
    const results = data.map((row) => {
      if (skipEnrichment) {
        return { ...row, publicUrl: null };
      }
      const { data: urlData, error: urlErr } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(row.path);
      if (urlErr) console.error('getPublicUrl error', urlErr);
      return { ...row, publicUrl: urlData?.publicUrl || null };
    });

    // 8) Response
    res.json({
      total:   count,
      page:    pageNum,
      perPage: perPageNum,
      results,
    });
  } catch (err) {
    console.error('💥 searchFiles error:', err);
    res.status(500).json({ error: err.message });
  }
};


/**
 * GET /api/search/suggestions
 * Query params: term
 */
exports.getSuggestions = async (req, res, next) => {
  try {
    const { term = "" } = req.query;
    const { data, error } = await supabase
      .from("files")
      .select("filename")
      .ilike("filename", `${term}%`)
      .limit(10);

    if (error) throw error;
    res.json(data.map((row) => row.filename));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/search/summarize
 * Body: { docIds: [uuid], rawText: string }
 */
 
exports.summarizeText = async (req, res, next) => {
  try {
    const { rawText, docIds } = req.body;
    let prompt;
    let keywords = [];

    // 1) If rawText was sent, summarise that
    if (typeof rawText === 'string' && rawText.trim().length > 0) {
      prompt = rawText.trim();
    }
    // 2) Otherwise, if docIds array, fetch metadata arrays
    else if (Array.isArray(docIds) && docIds.length > 0) {
      const { data, error } = await supabase
        .from('files')
        .select('metadata')
        .in('id', docIds);

      if (error) throw error;
console.log('data:', data);
      // metadata is assumed to be an array of strings
const keywords = data.flatMap(row => {
  // join all the chunks into one JSON string…
  const jsonString = row.metadata.join('');
  try {
    // …then parse it back into a real array
    return JSON.parse(jsonString);
  } catch {
    // fallback: if parsing fails, just return the raw strings
    return row.metadata;
  }
});


      if (keywords.length === 0) {
        return res
          .status(400)
          .json({ error: 'No metadata tags found for those docIds.' });
      }

      prompt = `Summarize these topics do not include them with quotes in your answer and type
      as if you describing and image or document containing these topics,do not include what you 
      are doing in your answer,make it a forma,do not reference it as an image,rather say,"the selected file": ${keywords.join(', ')}`;
    } 
    // 3) Neither rawText nor docIds → error
    else {
      return res
        .status(400)
        .json({ error: 'No input text or docIds provided.' });
    }


    // 4) Instantiate your Vertex AI generative model
    const model = vertexai.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: { maxOutputTokens: 512, temperature: 0.2 },
    });

    // 5) Generate
    const gcResult = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `Summarize the following content:\n\n${prompt}` }],
        },
      ],
      candidateCount: 1,
    });
    console.log(
      '🔍 generateContent result:',
      JSON.stringify(gcResult, null, 2)
    );

    // 6) Extract the summary from whichever field is populated
    let summary = '';
    const candidate = gcResult.response?.candidates?.[0];
    if (candidate?.content?.parts) {
      summary = candidate.content.parts.map((p) => p.text).join('');
    } else if (typeof gcResult.response?.text === 'string') {
      summary = gcResult.response.text;
    }

    return res.json({ summary });
  } catch (err) {
    console.error('💥 summarizeText error:', err);
    next(err);
  }
};
