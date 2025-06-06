// controllers/searchController.js


const { createClient } = require("@supabase/supabase-js");
const { VertexAI } = require('@google-cloud/vertexai');
const sdk = require('@google-cloud/aiplatform');
const { PredictionServiceClient } = sdk.v1;
const { helpers } = sdk;

const embedClient = new PredictionServiceClient({
  apiEndpoint: 'us-central1-aiplatform.googleapis.com'
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const bucket = process.env.SUPABASE_BUCKET;
// Initialize Vertex AI
const vertexai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT, 
  location: 'us-central1',                
});
async function embedTexts(project, location, model, texts) {
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${model}`;
  const instances = texts.map(t =>
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
    console.log("tags",tags);
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

      // normalize metadata whether it's a string or already an array
      keywords = data.flatMap(row => {
        if (typeof row.metadata === 'string') {
          // split comma-separated string into trimmed tags
          return row.metadata.split(',').map(tag => tag.trim());
        } else if (Array.isArray(row.metadata)) {
          // already an array of tags
          return row.metadata;
        } else {
          // unexpected type → skip
          return [];
        }
      });

      console.log('keywords:', keywords);
      if (keywords.length === 0) {
        return res
          .status(400)
          .json({ error: 'No metadata tags found for those docIds.' });
      }

      prompt = `Summarize these topics (do not quote them) as if you are describing a document containing: ${keywords.join(', ')}. Refer to it as "the selected file" in your summary.`;
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

    // 6) Extract the summary
    let summary = '';
    const candidate = gcResult.response?.candidates?.[0];
    if (candidate?.content?.parts) {
      summary = candidate.content.parts.map(p => p.text).join('');
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