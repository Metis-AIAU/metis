/**
 * One-time script: embeds all compliance controls via Vertex AI and stores in Firestore.
 * Re-run whenever framework data files change.
 *
 * Usage:
 *   node server/scripts/embedCompliance.js
 *
 * Prerequisites:
 *   1. Firebase Admin credentials configured (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in server/.env,
 *      or gcloud auth application-default login for local dev)
 *   2. Firestore vector index created (run once):
 *      gcloud firestore indexes composite create \
 *        --collection-group=compliance_embeddings \
 *        --query-scope=COLLECTION \
 *        --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":{}}' \
 *        --project=metis-ai-1551
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const { pathToFileURL } = require('url');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const admin = require('../firebase-admin');
const { embedBatch } = require('../services/vertexEmbeddings');

const db = getFirestore();
const COLLECTION = 'compliance_embeddings';
const BATCH_SIZE = 100;

// ── Chunk builders per framework ─────────────────────────────────────────────

function chunksFromAESCSF(functions) {
  const chunks = [];
  for (const fn of functions) {
    for (const cat of fn.categories || []) {
      for (const ctrl of cat.controls || []) {
        const profiles = [ctrl.sp1 && 'SP1', ctrl.sp2 && 'SP2', ctrl.sp3 && 'SP3'].filter(Boolean).join(', ');
        const text = [
          `Framework: AESCSF | Function: ${fn.name} | Category: ${cat.name}`,
          `Control ID: ${ctrl.id} | Security Profiles: ${profiles} | Priority: ${ctrl.priority || 'medium'}${ctrl.otSpecific ? ' | OT-Specific: Yes' : ''}`,
          `Description: ${ctrl.description}`,
          cat.description ? `Category context: ${cat.description}` : '',
        ].filter(Boolean).join('\n');

        chunks.push({
          id: ctrl.id,
          framework: 'AESCSF',
          text,
          metadata: {
            controlId: ctrl.id, framework: 'AESCSF',
            functionId: fn.id, functionName: fn.name,
            categoryId: cat.id, categoryName: cat.name,
            priority: ctrl.priority || 'medium',
            profiles, otSpecific: ctrl.otSpecific || false,
          },
        });
      }
    }
  }
  return chunks;
}

function chunksFromEssentialEight(strategies) {
  const chunks = [];
  for (const strategy of strategies) {
    for (const ctrl of strategy.controls || []) {
      const text = [
        `Framework: Essential Eight | Strategy: ${strategy.name}`,
        `Control ID: ${ctrl.id} | Maturity Level: ${ctrl.maturity}`,
        `Objective: ${strategy.objective}`,
        `Description: ${ctrl.description}`,
        ctrl.guidance    ? `Implementation guidance: ${ctrl.guidance}` : '',
        ctrl.testMethod  ? `Test method: ${ctrl.testMethod}` : '',
        strategy.why     ? `Why this matters: ${strategy.why}` : '',
      ].filter(Boolean).join('\n');

      chunks.push({
        id: ctrl.id,
        framework: 'ESSENTIAL_EIGHT',
        text,
        metadata: {
          controlId: ctrl.id, framework: 'ESSENTIAL_EIGHT',
          strategyId: strategy.id, strategyName: strategy.name,
          maturityLevel: ctrl.maturity,
        },
      });
    }
  }
  return chunks;
}

function chunksFromSOCI(obligations) {
  const chunks = [];
  for (const obligation of obligations) {
    for (const ctrl of obligation.controls || []) {
      const text = [
        `Framework: SOCI Act | Obligation: ${obligation.name} | ${obligation.part || ''}`,
        `Control ID: ${ctrl.id} | Obligation type: ${ctrl.obligation || 'Mandatory'} | Priority: ${ctrl.priority || 'high'}`,
        `Description: ${ctrl.description}`,
        ctrl.applicability    ? `Applicability: ${ctrl.applicability}` : '',
        ctrl.timeframe        ? `Timeframe: ${ctrl.timeframe}` : '',
        ctrl.legislativeRef   ? `Legislative reference: ${ctrl.legislativeRef}` : '',
        ctrl.consequence      ? `Consequence of non-compliance: ${ctrl.consequence}` : '',
        obligation.description ? `Obligation context: ${obligation.description}` : '',
      ].filter(Boolean).join('\n');

      chunks.push({
        id: ctrl.id,
        framework: 'SOCI',
        text,
        metadata: {
          controlId: ctrl.id, framework: 'SOCI',
          obligationId: obligation.id, obligationName: obligation.name,
          obligationType: ctrl.obligation || 'Mandatory',
          priority: ctrl.priority || 'high',
          legislativeRef: ctrl.legislativeRef || '',
        },
      });
    }
  }
  return chunks;
}

function chunksFromASDFortify(strategies) {
  const chunks = [];
  for (const strategy of strategies) {
    for (const ctrl of strategy.controls || []) {
      const text = [
        `Framework: ASD Fortify | Strategy: ${strategy.name} | Category: ${strategy.category || 'OT/ICS'}`,
        `Control ID: ${ctrl.id} | Maturity Level: ${ctrl.maturityLevel}${ctrl.otApplicable ? ' | OT Applicable: Yes' : ''}`,
        strategy.description ? `Strategy description: ${strategy.description}` : '',
        `Description: ${ctrl.description}`,
        strategy.otNotes     ? `OT/ICS notes: ${strategy.otNotes}` : '',
        ctrl.implementationNotes ? `Implementation notes: ${ctrl.implementationNotes}` : '',
      ].filter(Boolean).join('\n');

      chunks.push({
        id: ctrl.id,
        framework: 'ASD_FORTIFY',
        text,
        metadata: {
          controlId: ctrl.id, framework: 'ASD_FORTIFY',
          strategyId: strategy.id, strategyName: strategy.name,
          maturityLevel: ctrl.maturityLevel,
          otApplicable: ctrl.otApplicable || false,
        },
      });
    }
  }
  return chunks;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[embedCompliance] Loading framework data...');

  const dataDir = path.join(__dirname, '../../src/data');
  const [
    { AESCSF_FUNCTIONS },
    { E8_STRATEGIES },
    { SOCI_OBLIGATIONS },
    { ASD_FORTIFY_STRATEGIES },
  ] = await Promise.all([
    import(pathToFileURL(path.join(dataDir, 'aescsf.js')).href),
    import(pathToFileURL(path.join(dataDir, 'essentialEight.js')).href),
    import(pathToFileURL(path.join(dataDir, 'soci.js')).href),
    import(pathToFileURL(path.join(dataDir, 'asdFortify.js')).href),
  ]);

  const chunks = [
    ...chunksFromAESCSF(AESCSF_FUNCTIONS),
    ...chunksFromEssentialEight(E8_STRATEGIES),
    ...chunksFromSOCI(SOCI_OBLIGATIONS),
    ...chunksFromASDFortify(ASD_FORTIFY_STRATEGIES),
  ];

  console.log(`[embedCompliance] ${chunks.length} controls to embed across 4 frameworks`);

  // Embed in batches of BATCH_SIZE
  let embedded = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`[embedCompliance] Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} controls)...`);

    const vectors = await embedBatch(batch.map(c => c.text));

    // Write to Firestore in a batch write
    const firestoreBatch = db.batch();
    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const ref = db.collection(COLLECTION).doc(chunk.id);
      firestoreBatch.set(ref, {
        ...chunk.metadata,
        text:       chunk.text,
        embedding:  FieldValue.vector(vectors[j]),
        embeddedAt: FieldValue.serverTimestamp(),
      });
    }
    await firestoreBatch.commit();
    embedded += batch.length;
    console.log(`[embedCompliance] ${embedded}/${chunks.length} stored`);

    // Brief pause to respect Vertex AI rate limits
    if (i + BATCH_SIZE < chunks.length) await new Promise(r => setTimeout(r, 500));
  }

  console.log('[embedCompliance] Done. All controls embedded and stored in Firestore.');
  console.log(`[embedCompliance] Collection: ${COLLECTION} (${chunks.length} documents)`);
  process.exit(0);
}

main().catch(err => {
  console.error('[embedCompliance] Fatal error:', err);
  process.exit(1);
});
