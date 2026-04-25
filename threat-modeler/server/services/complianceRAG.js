const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { embedText } = require('./vertexEmbeddings');

const db = getFirestore();
const COLLECTION = 'compliance_embeddings';
const TOP_K = 5;

const FRAMEWORK_LABELS = {
  AESCSF:        'Australian Energy Sector Cyber Security Framework (AESCSF)',
  ESSENTIAL_EIGHT: 'ASD Essential Eight',
  SOCI:          'Security of Critical Infrastructure (SOCI) Act',
  ASD_FORTIFY:   'ASD Fortify',
};

/**
 * Retrieve top-K compliance controls relevant to a query.
 * Optionally filter to a specific framework.
 */
async function retrieveControls(query, { framework, limit = TOP_K } = {}) {
  const queryVector = await embedText(query);

  let ref = db.collection(COLLECTION);
  if (framework) ref = ref.where('framework', '==', framework);

  const vectorQuery = ref.findNearest({
    vectorField: 'embedding',
    queryVector:  FieldValue.vector(queryVector),
    limit,
    distanceMeasure: 'COSINE',
  });

  const snapshot = await vectorQuery.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), embedding: undefined }));
}

/**
 * Build an augmented Claude prompt for a compliance question.
 * Returns the messages array ready for the Anthropic SDK.
 */
function buildRAGPrompt(query, retrievedControls, context = {}) {
  const controlContext = retrievedControls.map(c => {
    const fw = FRAMEWORK_LABELS[c.framework] || c.framework;
    return `--- ${fw} | Control ${c.controlId} ---\n${c.text}`;
  }).join('\n\n');

  const systemPrompt = `You are a cybersecurity compliance expert specialising in Australian frameworks: AESCSF, SOCI Act, ASD Essential Eight, and ASD Fortify.
You help organisations assess their compliance posture and implement controls effectively.
Answer questions accurately and concisely, citing specific control IDs. If a question is outside the retrieved context, say so.`;

  const userMessage = [
    context.organisationName ? `Organisation: ${context.organisationName}` : '',
    context.sector           ? `Sector: ${context.sector}` : '',
    context.currentStatus    ? `Current assessment status: ${context.currentStatus}` : '',
    context.evidence         ? `Evidence provided: ${context.evidence}` : '',
    '',
    'Relevant compliance controls from the knowledge base:',
    controlContext,
    '',
    `Question: ${query}`,
  ].filter(l => l !== undefined).join('\n');

  return { systemPrompt, userMessage };
}

/**
 * Full RAG pipeline: retrieve + generate answer via Claude.
 * Returns { answer, relevantControls }
 */
async function askComplianceQuestion(query, options = {}) {
  const { framework, organisationContext, anthropicClient } = options;

  const controls = await retrieveControls(query, { framework, limit: TOP_K });
  if (controls.length === 0) {
    return { answer: 'No relevant controls found for this query. Ensure the compliance embeddings have been generated.', relevantControls: [] };
  }

  const { systemPrompt, userMessage } = buildRAGPrompt(query, controls, organisationContext || {});

  const message = await anthropicClient.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   [{ role: 'user', content: userMessage }],
  });

  return {
    answer:           message.content[0].text,
    relevantControls: controls.map(c => ({
      controlId:    c.controlId,
      framework:    c.framework,
      frameworkLabel: FRAMEWORK_LABELS[c.framework] || c.framework,
      text:         c.text,
      metadata:     {
        strategyName:   c.strategyName,
        functionName:   c.functionName,
        obligationName: c.obligationName,
        maturityLevel:  c.maturityLevel,
        priority:       c.priority,
      },
    })),
  };
}

/**
 * Get implementation guidance for a specific control ID.
 */
async function getControlGuidance(controlId, anthropicClient, organisationContext = {}) {
  const doc = await db.collection(COLLECTION).doc(controlId).get();
  if (!doc.exists) {
    return { answer: `Control ${controlId} not found in knowledge base.`, relevantControls: [] };
  }

  const control = { id: doc.id, ...doc.data(), embedding: undefined };
  const query = `How should an organisation implement control ${controlId}? What evidence is needed to demonstrate compliance? What are the common pitfalls?`;

  return askComplianceQuestion(query, {
    framework: control.framework,
    organisationContext,
    anthropicClient,
  });
}

module.exports = { retrieveControls, askComplianceQuestion, getControlGuidance };
