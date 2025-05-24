// controllers/searchController.js


const { createClient } = require("@supabase/supabase-js");
const { VertexAI } = require('@google-cloud/vertexai');
const sdk = require('@google-cloud/aiplatform');
const { PredictionServiceClient } = sdk.v1;
const { helpers } = sdk;

const embedClient = new PredictionServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com'
});


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

async function embedTexts(project, location, model, texts) {
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;
  // Use helpers.toValue from the root import!
  const instances = texts.map(t =>
    // NOTE: use SEMANTIC_SIMILARITY instead of TEXT_EMBEDDING
    helpers.toValue({ content: t, task_type: 'SEMANTIC_SIMILARITY' })
  );
  const [response] = await embedClient.predict({ endpoint, instances });
  return response.predictions.map(p =>
    p.structValue
     .fields.embeddings
     .structValue
     .fields.values
     .listValue.values
     .map(v => v.numberValue)
  );
}
/**
 * 
 * GET /api/search
 * Query params: term, from, to, page, perPage
 */
// controllers/searchController.js
exports.askQuestion = async (req, res, next) => {
  try {
    const {
      question = '',
      folderPath = '',
      startDate,      // ISO string, e.g. "2025-05-20T00:00:00.000Z"
      endDate,        // same
      fileType,       // e.g. "application/pdf"
      sortField = 'created_at',
      sortOrder = 'desc'
    } = req.body;
    if (!question.trim()) {
      return res.status(400).json({ error: 'Please provide a question.' });
    }

    // 1) Embed the user’s question
    const [qVector] = await embedTexts(
      process.env.GOOGLE_CLOUD_PROJECT,
      'us-central1',
      'text-embedding-005',
      [question]
    );

    let rpc = supabase
      .rpc('match_embedding', {
        query_embedding: qVector,
        match_count:     5
      });

    // 3) Only apply a path filter if folderPath was provided
    if (folderPath) {
      // match anything under that folder
      rpc = rpc.ilike('path', `${folderPath}%`);
    }
    // 4) Execute
    const { data: matches, error: matchError } = await rpc;
    if (matchError) throw matchError;

    if (!matches || matches.length === 0) {
      return res.json({ answer: 'No related documents found.', related: [] });
    }
    let qry = supabase
      .from('files')
      .select('id, filename, path, type, created_at, metadata')
      .in('id', matches.map(m => m.id));
    if (startDate) {
      qry = qry.gte('created_at', startDate);
    }
    if (endDate) {
      qry = qry.lte('created_at', endDate);
    }
    if (fileType) {
      qry = qry.eq('type', fileType);
    }

    qry = qry.order(sortField, { ascending: sortOrder === 'asc' });

    // 3) Fetch metadata/snippets for those docs
    const { data: docs, error: docsErr } = await qry;
    if (docsErr) throw docsErr;
    if (!docs.length) {
      return res.json({ answer: 'No documents match your filters.', related: [] });
    }
    

    // 4) Build a prompt with their filenames & tags
const context = docs
  .map(d => {
    // Normalize metadata into an array of strings
    let tags = [];
    if (Array.isArray(d.metadata)) {
      tags = d.metadata;
    } else if (typeof d.metadata === 'string') {
      try {
        const parsed = JSON.parse(d.metadata);
        if (Array.isArray(parsed)) {
          tags = parsed;
        }
      } catch {
        // not JSON, fall back to comma-split
        tags = d.metadata.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    // Build the line safely
    return `• ${d.filename} (tags: ${tags.join(', ')})`;
  })
  .join('\n');
  console.log(context);
    const systemPrompt = `
You are an assistant helping a user find documents.  
The user asked: “${question}”  
Here are some relevant files and their tags:
${context}

Please answer the question based only on these documents you should also give your own interpretation or your own comments on the users question. If the answer isn’t in them, say “I’m not sure based on available documents but i will provide documents that might assist you.” and interpret it on your own,giving your own info.
`.trim();

    // 5) Ask Gemini (chat‐bison) to generate the answer
const chatModel = vertexai.getGenerativeModel({
  model: 'gemini-2.0-flash-lite',
  generationConfig: {
    temperature:      0.2,
    maxOutputTokens: 512
  }
});

// Use generateContent (non-streaming) to get a single response
const genResult = await chatModel.generateContent({
  contents: [
    { 
      role: 'user',
      parts: [{ text: systemPrompt }]
    }
  ],
  candidateCount: 1
});
// genResult.response.candidates is the array of responses
const candidate = genResult.response.candidates?.[0];
let answer = '';

// Extract text from the returned `parts`
if (candidate?.content?.parts) {
  answer = candidate.content.parts.map(p => p.text).join('');
} else if (typeof genResult.response.text === 'string') {
  // Some models return a plain `response.text`
  answer = genResult.response.text;
}

// 6) Return answer + related files
return res.json({
  answer: answer.trim(),
  related: docs.map(d => ({        id: d.id,
        name: d.filename,
        path: d.path,
        type: d.type,
        created_at: d.created_at }))
    });
  } catch (err) {
    console.error('askQuestion error:', err);
    return next(err);
  }
};
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
exports.download = async (req, res,data) => {
  try {

  const item = req.body;

  const fileId = item.docIds || null;

    const selectedFileId = fileId;
    if (!selectedFileId) {
      return res.status(400).json({ error: 'Error please try again' });
    }


   
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .select('path,filename')
      .eq('id', String(selectedFileId))
      .single();


    if (dbError || !fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = fileRecord.path;

    const { data: fileStream, error: downloadError } = await supabase
      .storage
      .from(bucket)
      .download(filePath);

    if (downloadError || !fileStream) {
      return res.status(500).json({ error: 'Error downloading file' });
    }
    const arrayBuffer = await fileStream.arrayBuffer();                
    const buffer      = Buffer.from(arrayBuffer);  


    const fileName = fileRecord.filename;




    res.attachment(fileName);

res.send(buffer);
  } catch (err) {
    console.error('Download Controller Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};