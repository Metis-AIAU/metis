// AI Analysis Service for Threat Modeling
// This service can be connected to any AI backend (OpenAI, Anthropic, Azure OpenAI, etc.)

import { v4 as uuidv4 } from 'uuid';

// Configuration for AI provider
const AI_CONFIG = {
  // Set your AI provider: 'openai', 'anthropic', 'azure', or 'simulation'
  provider: 'simulation',
  // API endpoints (update these for your provider)
  endpoints: {
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages',
    azure: '', // Your Azure OpenAI endpoint
  },
  // API key should be stored securely (environment variable or backend)
  apiKey: '', // process.env.REACT_APP_AI_API_KEY
};

// STRIDE threat templates for AI-assisted generation
const STRIDE_TEMPLATES = {
  S: {
    name: 'Spoofing',
    threats: [
      'Identity spoofing through stolen credentials',
      'Session hijacking via token theft',
      'Man-in-the-middle impersonation',
      'Phishing attacks targeting users',
      'API key impersonation',
    ],
  },
  T: {
    name: 'Tampering',
    threats: [
      'SQL injection attacks',
      'Cross-site scripting (XSS)',
      'Data manipulation in transit',
      'Configuration file tampering',
      'Log tampering to hide attacks',
    ],
  },
  R: {
    name: 'Repudiation',
    threats: [
      'Users denying transactions',
      'Insufficient audit logging',
      'Log deletion by attackers',
      'Untraceable administrative actions',
      'Missing digital signatures',
    ],
  },
  I: {
    name: 'Information Disclosure',
    threats: [
      'Sensitive data exposure in logs',
      'Unencrypted data transmission',
      'Database information leakage',
      'Error messages revealing system info',
      'Unauthorized API data access',
    ],
  },
  D: {
    name: 'Denial of Service',
    threats: [
      'DDoS attacks on public endpoints',
      'Resource exhaustion attacks',
      'Application-layer DoS',
      'Database connection exhaustion',
      'API rate limit bypass',
    ],
  },
  E: {
    name: 'Elevation of Privilege',
    threats: [
      'Privilege escalation via IDOR',
      'JWT token manipulation',
      'Role bypass vulnerabilities',
      'Admin account takeover',
      'Container escape attacks',
    ],
  },
};

// Control templates for different threat types
const CONTROL_TEMPLATES = {
  authentication: [
    { name: 'Multi-Factor Authentication', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'Strong Password Policy', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Account Lockout Policy', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Session Timeout Controls', type: 'PREVENTIVE', priority: 'MEDIUM' },
  ],
  dataProtection: [
    { name: 'Data Encryption at Rest', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'TLS 1.3 for Data in Transit', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'Data Masking for Sensitive Fields', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Database Access Controls', type: 'PREVENTIVE', priority: 'HIGH' },
  ],
  inputValidation: [
    { name: 'Input Validation and Sanitization', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'Parameterized Queries', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'Content Security Policy', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Output Encoding', type: 'PREVENTIVE', priority: 'HIGH' },
  ],
  monitoring: [
    { name: 'Comprehensive Audit Logging', type: 'DETECTIVE', priority: 'HIGH' },
    { name: 'Security Information and Event Management (SIEM)', type: 'DETECTIVE', priority: 'HIGH' },
    { name: 'Intrusion Detection System', type: 'DETECTIVE', priority: 'MEDIUM' },
    { name: 'Real-time Alerting', type: 'DETECTIVE', priority: 'HIGH' },
  ],
  availability: [
    { name: 'DDoS Protection Service', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Rate Limiting', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Auto-scaling Infrastructure', type: 'CORRECTIVE', priority: 'MEDIUM' },
    { name: 'Load Balancing', type: 'PREVENTIVE', priority: 'MEDIUM' },
  ],
  accessControl: [
    { name: 'Role-Based Access Control (RBAC)', type: 'PREVENTIVE', priority: 'CRITICAL' },
    { name: 'Principle of Least Privilege', type: 'PREVENTIVE', priority: 'HIGH' },
    { name: 'Regular Access Reviews', type: 'DETECTIVE', priority: 'MEDIUM' },
    { name: 'Privileged Access Management', type: 'PREVENTIVE', priority: 'HIGH' },
  ],
};

// Keywords to identify project characteristics
const KEYWORD_PATTERNS = {
  web: ['web', 'website', 'portal', 'frontend', 'browser', 'html', 'spa', 'react', 'angular', 'vue'],
  api: ['api', 'rest', 'graphql', 'endpoint', 'microservice', 'backend', 'service'],
  mobile: ['mobile', 'ios', 'android', 'app', 'smartphone', 'tablet'],
  cloud: ['cloud', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'container', 'serverless'],
  database: ['database', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'data store'],
  payment: ['payment', 'transaction', 'credit card', 'pci', 'financial', 'banking', 'money'],
  healthcare: ['health', 'medical', 'patient', 'hipaa', 'phi', 'hospital', 'clinic'],
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'cart', 'checkout', 'order'],
  iot: ['iot', 'sensor', 'device', 'embedded', 'smart', 'industrial'],
  auth: ['login', 'authentication', 'auth', 'sso', 'oauth', 'identity', 'user account'],
};

// Analyze project description to identify characteristics
function analyzeProjectCharacteristics(name, description, tags = []) {
  const text = `${name} ${description} ${tags.join(' ')}`.toLowerCase();
  const characteristics = [];

  Object.entries(KEYWORD_PATTERNS).forEach(([category, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      characteristics.push(category);
    }
  });

  // Default characteristics if none detected
  if (characteristics.length === 0) {
    characteristics.push('web', 'api');
  }

  return characteristics;
}

// Generate threats based on project characteristics
function generateThreatsForProject(projectId, characteristics) {
  const threats = [];
  const usedThreats = new Set();

  // Determine which STRIDE categories are most relevant
  const relevantCategories = {
    web: ['S', 'T', 'I', 'E'],
    api: ['S', 'T', 'I', 'D', 'E'],
    mobile: ['S', 'T', 'I', 'E'],
    cloud: ['S', 'T', 'I', 'D', 'E'],
    database: ['T', 'I', 'E'],
    payment: ['S', 'T', 'R', 'I'],
    healthcare: ['S', 'I', 'R'],
    ecommerce: ['S', 'T', 'R', 'I', 'D'],
    iot: ['S', 'T', 'I', 'D'],
    auth: ['S', 'R', 'E'],
  };

  // Collect relevant STRIDE categories
  const categories = new Set();
  characteristics.forEach((char) => {
    (relevantCategories[char] || ['S', 'T', 'I']).forEach((cat) => categories.add(cat));
  });

  // Generate 2-3 threats per relevant category
  categories.forEach((category) => {
    const categoryThreats = STRIDE_TEMPLATES[category].threats;
    const numThreats = Math.min(2 + Math.floor(Math.random() * 2), categoryThreats.length);

    for (let i = 0; i < numThreats; i++) {
      const threatIndex = Math.floor(Math.random() * categoryThreats.length);
      const threatName = categoryThreats[threatIndex];

      if (!usedThreats.has(threatName)) {
        usedThreats.add(threatName);

        // Calculate risk based on category and characteristics
        const likelihood = Math.floor(Math.random() * 3) + 2; // 2-4
        const impact = Math.floor(Math.random() * 3) + 3; // 3-5
        const riskScore = likelihood * impact;

        let riskLevel;
        if (riskScore >= 20) riskLevel = 'CRITICAL';
        else if (riskScore >= 15) riskLevel = 'HIGH';
        else if (riskScore >= 10) riskLevel = 'MEDIUM';
        else if (riskScore >= 5) riskLevel = 'LOW';
        else riskLevel = 'MINIMAL';

        threats.push({
          id: uuidv4(),
          projectId,
          name: threatName,
          description: generateThreatDescription(threatName, characteristics),
          strideCategory: category,
          likelihood,
          impact,
          riskLevel,
          attackVector: 'Network',
          prerequisites: 'Access to system or network',
          createdAt: new Date().toISOString(),
          aiGenerated: true,
        });
      }
    }
  });

  return threats;
}

// Generate threat description based on context
function generateThreatDescription(threatName, characteristics) {
  const contexts = characteristics.join(', ');
  const descriptions = {
    'Identity spoofing through stolen credentials': `Attackers may attempt to steal user credentials to impersonate legitimate users in the ${contexts} system.`,
    'Session hijacking via token theft': `Session tokens could be intercepted or stolen, allowing attackers to take over user sessions.`,
    'SQL injection attacks': `Malicious SQL queries could be injected through input fields to access or modify database contents.`,
    'Cross-site scripting (XSS)': `Attackers may inject malicious scripts that execute in users' browsers to steal data or perform actions.`,
    'Sensitive data exposure in logs': `Application logs may inadvertently contain sensitive information that could be accessed by attackers.`,
    'DDoS attacks on public endpoints': `Distributed denial of service attacks could overwhelm the system and make it unavailable to legitimate users.`,
    'Privilege escalation via IDOR': `Insecure direct object references could allow users to access resources belonging to other users.`,
  };

  return descriptions[threatName] || `This threat could impact the ${contexts} components of the system, potentially compromising security and data integrity.`;
}

// Generate controls based on threats and characteristics
function generateControlsForProject(projectId, threats, characteristics) {
  const controls = [];
  const usedControls = new Set();

  // Map characteristics to control categories
  const charToControls = {
    web: ['inputValidation', 'monitoring'],
    api: ['authentication', 'inputValidation', 'accessControl'],
    mobile: ['authentication', 'dataProtection'],
    cloud: ['accessControl', 'monitoring', 'availability'],
    database: ['dataProtection', 'accessControl'],
    payment: ['dataProtection', 'authentication', 'monitoring'],
    healthcare: ['dataProtection', 'accessControl', 'monitoring'],
    ecommerce: ['authentication', 'inputValidation', 'availability'],
    iot: ['authentication', 'dataProtection'],
    auth: ['authentication', 'accessControl', 'monitoring'],
  };

  // Collect relevant control categories
  const controlCategories = new Set();
  characteristics.forEach((char) => {
    (charToControls[char] || ['authentication', 'monitoring']).forEach((cat) => controlCategories.add(cat));
  });

  // Generate controls for each category
  controlCategories.forEach((category) => {
    const categoryControls = CONTROL_TEMPLATES[category] || [];

    categoryControls.forEach((controlTemplate) => {
      if (!usedControls.has(controlTemplate.name)) {
        usedControls.add(controlTemplate.name);

        // Find related threats to link
        const relatedThreats = threats
          .filter((t) => {
            if (category === 'authentication') return ['S', 'E'].includes(t.strideCategory);
            if (category === 'dataProtection') return ['I', 'T'].includes(t.strideCategory);
            if (category === 'inputValidation') return ['T', 'I'].includes(t.strideCategory);
            if (category === 'monitoring') return ['R', 'I'].includes(t.strideCategory);
            if (category === 'availability') return ['D'].includes(t.strideCategory);
            if (category === 'accessControl') return ['S', 'E'].includes(t.strideCategory);
            return false;
          })
          .map((t) => t.id);

        controls.push({
          id: uuidv4(),
          projectId,
          name: controlTemplate.name,
          description: generateControlDescription(controlTemplate.name),
          type: controlTemplate.type,
          status: 'NOT_STARTED',
          priority: controlTemplate.priority,
          linkedThreats: relatedThreats.slice(0, 3), // Link up to 3 threats
          owner: 'Security Team',
          dueDate: generateDueDate(controlTemplate.priority),
          createdAt: new Date().toISOString(),
          aiGenerated: true,
        });
      }
    });
  });

  return controls;
}

// Generate control description
function generateControlDescription(controlName) {
  const descriptions = {
    'Multi-Factor Authentication': 'Implement MFA for all user accounts to add an extra layer of security beyond passwords.',
    'Strong Password Policy': 'Enforce complex passwords with minimum length, special characters, and regular rotation requirements.',
    'Data Encryption at Rest': 'Encrypt all sensitive data stored in databases and file systems using AES-256 or stronger encryption.',
    'TLS 1.3 for Data in Transit': 'Ensure all network communications use TLS 1.3 with strong cipher suites.',
    'Input Validation and Sanitization': 'Validate and sanitize all user inputs to prevent injection attacks.',
    'Parameterized Queries': 'Use prepared statements and parameterized queries for all database operations.',
    'Comprehensive Audit Logging': 'Log all security-relevant events including authentication, authorization, and data access.',
    'Role-Based Access Control (RBAC)': 'Implement RBAC to ensure users only have access to resources required for their role.',
    'DDoS Protection Service': 'Deploy cloud-based DDoS protection to absorb and mitigate volumetric attacks.',
    'Rate Limiting': 'Implement rate limiting on APIs and endpoints to prevent abuse and resource exhaustion.',
  };

  return descriptions[controlName] || `Implement ${controlName} to enhance the security posture of the application.`;
}

// Generate due date based on priority
function generateDueDate(priority) {
  const today = new Date();
  const daysToAdd = priority === 'CRITICAL' ? 7 : priority === 'HIGH' ? 14 : priority === 'MEDIUM' ? 30 : 60;
  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split('T')[0];
}

// Generate assets based on characteristics
function generateAssetsForProject(projectId, characteristics) {
  const assets = [];
  const assetTemplates = {
    web: [
      { name: 'Web Application Server', type: 'SERVICE', sensitivity: 'HIGH' },
      { name: 'CDN/Load Balancer', type: 'SERVICE', sensitivity: 'MEDIUM' },
    ],
    api: [
      { name: 'API Gateway', type: 'SERVICE', sensitivity: 'HIGH' },
      { name: 'Microservices Cluster', type: 'SERVICE', sensitivity: 'HIGH' },
    ],
    database: [
      { name: 'Primary Database', type: 'DATA_STORE', sensitivity: 'CRITICAL' },
      { name: 'Cache Layer', type: 'DATA_STORE', sensitivity: 'MEDIUM' },
    ],
    auth: [
      { name: 'Identity Provider', type: 'EXTERNAL_SERVICE', sensitivity: 'CRITICAL' },
      { name: 'Session Store', type: 'DATA_STORE', sensitivity: 'HIGH' },
    ],
    payment: [
      { name: 'Payment Gateway', type: 'EXTERNAL_SERVICE', sensitivity: 'CRITICAL' },
      { name: 'Transaction Database', type: 'DATA_STORE', sensitivity: 'CRITICAL' },
    ],
  };

  // Add user actor
  assets.push({
    id: uuidv4(),
    projectId,
    name: 'End Users',
    type: 'USER',
    description: 'External users accessing the system',
    sensitivity: 'MEDIUM',
    owner: 'Product Team',
    aiGenerated: true,
  });

  // Add assets based on characteristics
  characteristics.forEach((char) => {
    (assetTemplates[char] || []).forEach((template) => {
      assets.push({
        id: uuidv4(),
        projectId,
        name: template.name,
        type: template.type,
        description: `${template.name} component for the system`,
        sensitivity: template.sensitivity,
        owner: 'Infrastructure Team',
        aiGenerated: true,
      });
    });
  });

  return assets;
}

// Generate data flows based on assets
function generateDataFlowsForProject(projectId, assets, _characteristics) {
  const dataFlows = [];
  const userAsset = assets.find((a) => a.type === 'USER');
  const serviceAssets = assets.filter((a) => a.type === 'SERVICE');
  const dataStores = assets.filter((a) => a.type === 'DATA_STORE');

  // User to service flows
  if (userAsset && serviceAssets.length > 0) {
    dataFlows.push({
      id: uuidv4(),
      projectId,
      name: 'User to Application',
      source: userAsset.name,
      destination: serviceAssets[0].name,
      protocol: 'HTTPS',
      dataClassification: 'CONFIDENTIAL',
      description: 'User requests to the main application',
      aiGenerated: true,
    });
  }

  // Service to database flows
  serviceAssets.forEach((service) => {
    dataStores.forEach((store) => {
      dataFlows.push({
        id: uuidv4(),
        projectId,
        name: `${service.name} to ${store.name}`,
        source: service.name,
        destination: store.name,
        protocol: 'PostgreSQL/TLS',
        dataClassification: store.sensitivity === 'CRITICAL' ? 'RESTRICTED' : 'CONFIDENTIAL',
        description: `Data flow from ${service.name} to ${store.name}`,
        aiGenerated: true,
      });
    });
  });

  return dataFlows;
}

// Main AI Analysis function
export async function analyzeProject(project, onProgress) {
  const { id: projectId, name, description, tags } = project;

  try {
    // Step 1: Analyze characteristics
    onProgress?.({ step: 1, total: 5, message: 'Analyzing project characteristics...' });
    await simulateDelay(800);
    const characteristics = analyzeProjectCharacteristics(name, description, tags);

    // Step 2: Generate threats
    onProgress?.({ step: 2, total: 5, message: 'Identifying potential threats using STRIDE...' });
    await simulateDelay(1200);
    const threats = generateThreatsForProject(projectId, characteristics);

    // Step 3: Generate controls
    onProgress?.({ step: 3, total: 5, message: 'Recommending security controls...' });
    await simulateDelay(1000);
    const controls = generateControlsForProject(projectId, threats, characteristics);

    // Step 4: Generate assets
    onProgress?.({ step: 4, total: 5, message: 'Mapping system assets...' });
    await simulateDelay(800);
    const assets = generateAssetsForProject(projectId, characteristics);

    // Step 5: Generate data flows
    onProgress?.({ step: 5, total: 5, message: 'Creating data flow diagram...' });
    await simulateDelay(600);
    const dataFlows = generateDataFlowsForProject(projectId, assets, characteristics);

    // Calculate summary statistics
    const summary = {
      characteristics,
      threatCount: threats.length,
      criticalThreats: threats.filter((t) => t.riskLevel === 'CRITICAL').length,
      highThreats: threats.filter((t) => t.riskLevel === 'HIGH').length,
      controlCount: controls.length,
      assetCount: assets.length,
      dataFlowCount: dataFlows.length,
      riskScore: calculateOverallRiskScore(threats),
    };

    return {
      success: true,
      threats,
      controls,
      assets,
      dataFlows,
      summary,
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Calculate overall risk score
function calculateOverallRiskScore(threats) {
  if (threats.length === 0) return 0;
  const totalScore = threats.reduce((acc, t) => acc + t.likelihood * t.impact, 0);
  return Math.round(totalScore / threats.length);
}

// Simulate network delay for realistic UX
function simulateDelay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export configuration for external AI integration
export function configureAI(config) {
  Object.assign(AI_CONFIG, config);
}

export { AI_CONFIG, STRIDE_TEMPLATES, CONTROL_TEMPLATES };

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced workspace analysis — returns detailed threat table rows with
// rationale, recommended controls, and residual risk per threat.
// ─────────────────────────────────────────────────────────────────────────────

const RESIDUAL_FACTOR = {
  // How much risk remains after implementing the recommended controls (0–1)
  S: 0.25, T: 0.20, R: 0.30, I: 0.20, D: 0.25, E: 0.20,
};

const DETAILED_THREAT_DB = [
  // ── Spoofing ───────────────────────────────────────────────────────────────
  {
    key: 'cred_stuffing', category: 'S', name: 'Credential Stuffing Attack',
    description: 'Automated use of leaked username/password pairs from external breaches to gain unauthorised access to user accounts.',
    likelihoodBase: 4, impactBase: 4,
    getRationale: (f) => `Likelihood is HIGH because credential databases are widely available on darknet markets and automated tools make attacks trivial. Impact is HIGH because successful account takeover exposes all user data and actions.${f.networkExposure === 'internet' ? ' The internet-facing nature of this system significantly increases exposure.' : ''} The use of ${f.authMechanism || 'standard username/password'} authentication without additional controls amplifies this risk.`,
    getResidualRationale: () => 'After implementing MFA, the overwhelming majority of credential stuffing attempts are blocked — NIST estimates >99.9% effectiveness. Rate limiting prevents automated attempts. Residual risk stems from sophisticated targeted attacks that may bypass these controls.',
    recommendations: [
      { name: 'Multi-Factor Authentication (MFA)', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Require TOTP, push notification, or hardware key as a second factor. Eliminates ~99.9% of credential stuffing success.' },
      { name: 'Rate Limiting & Account Lockout', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Limit login attempts to 5 per minute per IP with exponential back-off. Lockout accounts after 10 failed attempts and alert the user.' },
      { name: 'Pwned Password Check', type: 'DETECTIVE', effort: 'LOW', effectiveness: 'MEDIUM', description: 'Integrate HaveIBeenPwned API at registration and password reset to reject known-compromised passwords.' },
    ],
    applicableTo: ['web', 'api', 'auth', 'ecommerce', 'payment', 'healthcare'],
  },
  {
    key: 'session_hijack', category: 'S', name: 'Session Token Hijacking',
    description: 'An attacker intercepts or steals session tokens via network sniffing, XSS, or browser storage attacks to impersonate an authenticated user.',
    likelihoodBase: 3, impactBase: 4,
    getRationale: (f) => `Likelihood is MEDIUM-HIGH because session tokens transmitted without strict transport security or stored insecurely in browser localStorage are exposed to interception.${f.architectureTypes?.includes('web') ? ' Web application context increases XSS exposure.' : ''} Impact is HIGH as successful session hijacking grants full access to the user's account.`,
    getResidualRationale: () => 'HTTPS enforcement and secure cookie attributes (HttpOnly, Secure, SameSite) remove the majority of interception vectors. Short session lifetimes limit the window of exploitation. Residual risk from sophisticated XSS-based attacks on complex web applications remains LOW.',
    recommendations: [
      { name: 'Enforce HTTPS / HSTS', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Redirect all HTTP to HTTPS. Set Strict-Transport-Security header with includeSubDomains and preload.' },
      { name: 'Secure Cookie Attributes', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Set session cookies with HttpOnly, Secure, and SameSite=Strict. Never expose session tokens in URLs or localStorage.' },
      { name: 'Short Session Lifetimes', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'MEDIUM', description: 'Expire idle sessions after 15 minutes and absolute sessions after 8 hours. Re-authenticate for sensitive operations.' },
    ],
    applicableTo: ['web', 'mobile', 'auth'],
  },
  // ── Tampering ─────────────────────────────────────────────────────────────
  {
    key: 'sql_injection', category: 'T', name: 'SQL Injection',
    description: 'Malicious SQL payloads injected through unsanitised input fields allow attackers to read, modify, or delete database contents, or execute OS-level commands.',
    likelihoodBase: 3, impactBase: 5,
    getRationale: (f) => `Likelihood is MEDIUM because SQL injection vulnerabilities, while well-understood, still appear in ${f.technologyStack || 'modern'} applications — particularly in dynamic query construction. Impact is CRITICAL because successful exploitation grants full database access including ${f.sensitiveData?.join(', ') || 'sensitive records'}.`,
    getResidualRationale: () => 'Parameterised queries eliminate the SQL injection vector entirely when applied consistently. A WAF provides an additional detection layer. Residual risk is MINIMAL and primarily relates to second-order injections or stored procedures that bypass standard parameterisation.',
    recommendations: [
      { name: 'Parameterised Queries / ORMs', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Use prepared statements or a query-safe ORM for all database interactions. Never concatenate user input into SQL strings.' },
      { name: 'Input Validation & Allowlisting', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Validate and allowlist all user inputs against expected type, length, and format before processing.' },
      { name: 'Web Application Firewall (WAF)', type: 'DETECTIVE', effort: 'LOW', effectiveness: 'MEDIUM', description: 'Deploy a WAF with SQLi rule sets to detect and block injection attempts at the network boundary.' },
    ],
    applicableTo: ['web', 'api', 'database', 'ecommerce', 'payment', 'healthcare'],
  },
  {
    key: 'xss', category: 'T', name: 'Cross-Site Scripting (XSS)',
    description: 'Attackers inject malicious scripts into web pages viewed by other users, enabling session theft, credential harvesting, and malware distribution.',
    likelihoodBase: 3, impactBase: 4,
    getRationale: (f) => `Likelihood is MEDIUM — XSS remains in the OWASP Top 10 and is present wherever user-controlled data is rendered without proper escaping. Impact is HIGH because attackers can steal session tokens, redirect users to phishing sites, or perform actions as the victim.${f.architectureTypes?.includes('web') ? ' Rich web application UIs have a larger XSS attack surface.' : ''}`,
    getResidualRationale: () => 'Output encoding eliminates the primary XSS vector. A strict CSP policy prevents inline script execution even if an XSS vulnerability is introduced. Combined, these controls reduce risk to MINIMAL for most attack patterns.',
    recommendations: [
      { name: 'Output Encoding', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'HTML-encode all user-supplied data before rendering. Use framework-provided encoding functions — never render raw user input.' },
      { name: 'Content Security Policy (CSP)', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: "Deploy a strict CSP that prohibits inline scripts and restricts script sources to trusted CDNs. Use nonces for legitimate inline scripts." },
      { name: 'DOM-based XSS Review', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'MEDIUM', description: 'Conduct targeted code review of JavaScript that assigns to innerHTML, document.write, or location. Replace with textContent or safe DOM APIs.' },
    ],
    applicableTo: ['web', 'ecommerce'],
  },
  // ── Repudiation ───────────────────────────────────────────────────────────
  {
    key: 'audit_gaps', category: 'R', name: 'Insufficient Audit Logging',
    description: 'Missing or incomplete audit logs prevent detection of malicious activity and make it impossible to attribute actions to specific users, undermining forensic investigations.',
    likelihoodBase: 3, impactBase: 3,
    getRationale: (f) => `Likelihood is MEDIUM because audit logging is frequently deprioritised and logging frameworks often miss security-critical events. Impact is MEDIUM because while the threat does not directly compromise data, it conceals other attacks and creates compliance exposure${f.sensitiveData?.includes('Healthcare Records') || f.sensitiveData?.includes('Financial Data') ? ' — particularly significant given the regulated data types in scope.' : '.'}`,
    getResidualRationale: () => 'A centralised, tamper-evident SIEM with alerting reduces this to LOW. Logs are forwarded in real time so local deletion does not destroy evidence. Residual risk arises from gaps in logging coverage and alert fatigue.',
    recommendations: [
      { name: 'Centralised Audit Logging (SIEM)', type: 'DETECTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Forward all authentication, authorisation, and data-access events to a centralised SIEM in real time. Retain for minimum 12 months.' },
      { name: 'Tamper-Evident Log Storage', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Write logs to an append-only, separately permissioned store. Use WORM storage or cryptographic log chaining to detect deletion.' },
      { name: 'Alerting on Anomalous Patterns', type: 'DETECTIVE', effort: 'MEDIUM', effectiveness: 'MEDIUM', description: 'Create alerts for failed login spikes, bulk data exports, off-hours admin access, and other suspicious patterns.' },
    ],
    applicableTo: ['web', 'api', 'cloud', 'database', 'payment', 'healthcare'],
  },
  // ── Information Disclosure ────────────────────────────────────────────────
  {
    key: 'data_exposure', category: 'I', name: 'Sensitive Data Exposure',
    description: 'Personal, financial, or health data stored or transmitted without adequate encryption or access controls is exposed to unauthorised parties through breaches, misconfiguration, or insider threats.',
    likelihoodBase: 3, impactBase: 5,
    getRationale: (f) => `Likelihood is MEDIUM because misconfigurations, insufficient access controls, and insecure storage are common. Impact is CRITICAL because exposure of ${f.sensitiveData?.join(', ') || 'sensitive data'} carries severe regulatory penalties${f.sensitiveData?.includes('Healthcare Records') ? ' (Privacy Act, My Health Records Act)' : f.sensitiveData?.includes('Financial Data') ? ' (PCI-DSS, Privacy Act)' : ''} and reputational damage.`,
    getResidualRationale: () => 'Encryption at rest and in transit ensures data is unreadable without the keys even in the event of a breach. Column-level encryption for PII fields limits blast radius. Residual risk is LOW, primarily from key management weaknesses or insider threats with legitimate key access.',
    recommendations: [
      { name: 'Encryption at Rest (AES-256)', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Encrypt all sensitive data at rest using AES-256 or stronger. Apply column-level encryption for PII and financial fields. Store keys in a dedicated KMS.' },
      { name: 'TLS 1.3 for All Transport', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Require TLS 1.3 with strong cipher suites for all API and web traffic. Disable TLS 1.0/1.1 and weak ciphers.' },
      { name: 'Data Classification & Minimisation', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'MEDIUM', description: 'Classify all data assets by sensitivity. Apply minimisation — collect and retain only what is necessary. Anonymise or pseudonymise for analytics.' },
    ],
    applicableTo: ['web', 'api', 'database', 'mobile', 'cloud', 'payment', 'healthcare'],
  },
  {
    key: 'error_disclosure', category: 'I', name: 'Verbose Error Message Disclosure',
    description: 'Detailed error messages including stack traces, database queries, or internal paths are exposed to end users, providing attackers with reconnaissance information.',
    likelihoodBase: 2, impactBase: 3,
    getRationale: () => `Likelihood is LOW-MEDIUM — default framework configurations frequently include verbose error output. Impact is MEDIUM because revealed stack traces, connection strings, and library versions accelerate targeted attack planning.`,
    getResidualRationale: () => 'After implementing generic error messages in production and routing internal errors to a structured log, this risk drops to MINIMAL. Attackers receive no useful information from error responses.',
    recommendations: [
      { name: 'Generic Error Responses', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Return user-friendly generic error messages in production. Log the full error server-side with a correlation ID for debugging.' },
      { name: 'Error Monitoring (Sentry / Datadog)', type: 'DETECTIVE', effort: 'LOW', effectiveness: 'MEDIUM', description: 'Route all application exceptions to an error tracking service with alerting. Never expose raw exceptions to end users.' },
    ],
    applicableTo: ['web', 'api'],
  },
  // ── Denial of Service ─────────────────────────────────────────────────────
  {
    key: 'ddos', category: 'D', name: 'Distributed Denial-of-Service (DDoS)',
    description: 'Volumetric or application-layer attacks overwhelm the system with traffic, making it unavailable to legitimate users and causing operational disruption.',
    likelihoodBase: 3, impactBase: 4,
    getRationale: (f) => `Likelihood is MEDIUM — DDoS-for-hire services have lowered the barrier for targeted attacks significantly.${f.networkExposure === 'internet' ? ' Internet-facing systems are particularly exposed.' : ''} Impact is HIGH because service unavailability directly affects ${f.userTypes || 'end users'} and can result in SLA breaches and revenue loss.`,
    getResidualRationale: () => 'Cloud-based DDoS scrubbing absorbs volumetric attacks. Rate limiting protects application-layer resources. Auto-scaling ensures capacity can expand under load. Residual risk is LOW, primarily from sophisticated slow-rate application attacks.',
    recommendations: [
      { name: 'Cloud DDoS Scrubbing (Cloudflare / AWS Shield)', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Route traffic through a cloud scrubbing service that absorbs volumetric attacks before they reach origin infrastructure.' },
      { name: 'API Rate Limiting', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Implement per-IP and per-user rate limits on all public endpoints. Return 429 with Retry-After headers.' },
      { name: 'Auto-scaling & Load Balancing', type: 'CORRECTIVE', effort: 'MEDIUM', effectiveness: 'MEDIUM', description: 'Configure horizontal auto-scaling groups to respond to traffic spikes. Use load balancers with health checks to redistribute traffic.' },
    ],
    applicableTo: ['web', 'api', 'cloud', 'ecommerce'],
  },
  // ── Elevation of Privilege ────────────────────────────────────────────────
  {
    key: 'idor', category: 'E', name: 'Insecure Direct Object Reference (IDOR)',
    description: 'Predictable object identifiers in API endpoints allow authenticated users to access or modify resources belonging to other users without authorisation.',
    likelihoodBase: 3, impactBase: 4,
    getRationale: (f) => `Likelihood is MEDIUM because IDOR vulnerabilities are prevalent in REST APIs and are often introduced during rapid feature development. Impact is HIGH as exploitation can expose all user records in ${f.architectureTypes?.includes('api') ? 'the API' : 'the system'}, enabling mass data extraction or account modification.`,
    getResidualRationale: () => 'Enforcing object-level authorisation checks on every API request eliminates the IDOR vector. Automated integration tests that verify cross-user access prevention catch regressions. Residual risk is LOW from complex multi-step authorisation bypasses.',
    recommendations: [
      { name: 'Object-Level Authorisation on Every Endpoint', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Verify the requesting user owns or has explicit permission to access the requested resource on every API handler. Never rely solely on authentication.' },
      { name: 'UUID / Opaque Resource IDs', type: 'PREVENTIVE', effort: 'LOW', effectiveness: 'MEDIUM', description: 'Replace sequential integer IDs in URLs with UUIDs or other unpredictable identifiers to reduce enumeration ease.' },
      { name: 'Authorisation Integration Tests', type: 'DETECTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Add automated tests for each endpoint that verify cross-user access attempts are rejected. Include in CI/CD pipeline.' },
    ],
    applicableTo: ['web', 'api', 'mobile'],
  },
  {
    key: 'privilege_escalation', category: 'E', name: 'Privilege Escalation via Role Bypass',
    description: 'Weaknesses in role-based access control logic allow lower-privileged users to perform admin actions or access resources above their clearance level.',
    likelihoodBase: 2, impactBase: 5,
    getRationale: (f) => `Likelihood is LOW-MEDIUM because privilege escalation requires knowledge of the authorisation model and typically involves chaining multiple weaknesses. Impact is CRITICAL because a successful attack grants admin-level access, enabling full system compromise including ${f.sensitiveData?.join(', ') || 'all data'}.`,
    getResidualRationale: () => 'Server-side enforcement of RBAC with no client-side trust eliminates most escalation paths. Privileged access management and regular entitlement reviews catch accidental over-permissioning. Residual risk is LOW.',
    recommendations: [
      { name: 'Server-Side RBAC Enforcement', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Enforce all role checks server-side. Never trust client-supplied role claims. Use a centralised authorisation service or middleware.' },
      { name: 'Principle of Least Privilege', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Grant each service account and user role only the minimum permissions required. Audit and remove unused permissions quarterly.' },
      { name: 'Privileged Access Management (PAM)', type: 'PREVENTIVE', effort: 'HIGH', effectiveness: 'HIGH', description: 'Require just-in-time privileged access with approval workflows for admin operations. Log all privileged sessions.' },
    ],
    applicableTo: ['web', 'api', 'cloud', 'database'],
  },
  // ── OT/ICS specific ────────────────────────────────────────────────────────
  {
    key: 'ot_lateral', category: 'T', name: 'IT-to-OT Lateral Movement',
    description: 'Attackers gain a foothold in the corporate IT network and use it to pivot into OT/ICS networks, potentially manipulating industrial control systems.',
    likelihoodBase: 3, impactBase: 5,
    getRationale: () => `Likelihood is MEDIUM because IT/OT convergence creates pathways that are difficult to fully segment. Impact is CRITICAL for an OT environment because successful compromise of industrial control systems can result in physical damage, safety incidents, and prolonged operational shutdown.`,
    getResidualRationale: () => 'Network segmentation with strict jump-server access reduces lateral movement significantly. After implementing a DMZ between IT and OT with application-layer inspection, residual risk drops to MEDIUM — sophisticated nation-state actors can still bridge well-designed segmentation.',
    recommendations: [
      { name: 'IT/OT Network Segmentation & DMZ', type: 'PREVENTIVE', effort: 'HIGH', effectiveness: 'HIGH', description: 'Place a demilitarised zone between IT and OT networks with stateful inspection firewalls. Allow only necessary protocols through the DMZ.' },
      { name: 'Unidirectional Security Gateways (Data Diodes)', type: 'PREVENTIVE', effort: 'HIGH', effectiveness: 'HIGH', description: 'Deploy hardware data diodes for connections from OT to IT where bidirectional communication is not required.' },
      { name: 'OT Asset Inventory & Patch Management', type: 'PREVENTIVE', effort: 'HIGH', effectiveness: 'MEDIUM', description: 'Maintain a complete inventory of OT assets. Apply vendor security patches as feasible; document risk-acceptance for unpatchable legacy devices.' },
    ],
    applicableTo: ['iot'],
  },
  {
    key: 'supply_chain', category: 'S', name: 'Third-Party / Supply Chain Compromise',
    description: 'A trusted third-party vendor, library, or cloud service is compromised, providing attackers with a trusted path into the target environment.',
    likelihoodBase: 2, impactBase: 5,
    getRationale: (f) => `Likelihood is LOW-MEDIUM because supply chain attacks (e.g., SolarWinds, Log4Shell, XZ Utils) have increased significantly in frequency. Impact is CRITICAL because the attack leverages existing trust relationships, bypassing perimeter defences entirely.${f.externalDependencies ? ` External dependencies include: ${f.externalDependencies}.` : ''}`,
    getResidualRationale: () => 'Software composition analysis (SCA) reduces the library risk vector. Vendor security assessments and strict change-control processes reduce integration-level risk. Residual risk remains MEDIUM as some supply chain attacks are not detectable until post-compromise.',
    recommendations: [
      { name: 'Software Composition Analysis (SCA)', type: 'DETECTIVE', effort: 'LOW', effectiveness: 'HIGH', description: 'Integrate SCA tooling (e.g., Snyk, OWASP Dependency-Check) in CI/CD to detect known-vulnerable or malicious third-party libraries.' },
      { name: 'Third-Party Vendor Security Assessment', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'MEDIUM', description: 'Require critical vendors to complete security questionnaires (CAIQ, SIG) annually. Review SOC 2 reports and penetration test results.' },
      { name: 'Zero-Trust for Third-Party Integrations', type: 'PREVENTIVE', effort: 'MEDIUM', effectiveness: 'HIGH', description: 'Treat all third-party service interactions as untrusted. Validate responses, restrict network access to minimum required, and monitor for anomalous behaviour.' },
    ],
    applicableTo: ['cloud', 'api', 'payment', 'healthcare'],
  },
];

function riskLevelFromScore(score) {
  if (score >= 20) return 'CRITICAL';
  if (score >= 15) return 'HIGH';
  if (score >= 10) return 'MEDIUM';
  if (score >= 5)  return 'LOW';
  return 'MINIMAL';
}

/**
 * Enhanced analysis that uses form data and canvas elements to produce a
 * detailed threat table with rationale, recommendations, and residual risk.
 */
export async function analyzeWithContext(project, formData = {}, canvasElements = [], onProgress) {
  // ── Try real Claude API via backend proxy first ──────────────────────────
  onProgress?.({ step: 1, total: 4, message: 'Sending system context to Claude AI...' });
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, formData, canvasElements }),
      signal: AbortSignal.timeout(60_000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        onProgress?.({ step: 2, total: 4, message: 'Claude is analysing attack surface...' });
        await simulateDelay(400);
        onProgress?.({ step: 3, total: 4, message: 'Scoring threats and generating mitigations...' });
        await simulateDelay(400);
        onProgress?.({ step: 4, total: 4, message: 'Compiling threat register...' });
        await simulateDelay(200);
        return data;
      }
      // Server-side error (e.g. missing API key)
      throw new Error(data.error || 'AI analysis failed on server');
    }

    // Non-2xx from server — parse body for the real error message
    let serverError = `Server error ${response.status}`;
    try {
      const errBody = await response.json();
      serverError = errBody.error || serverError;
    } catch { /* body not JSON */ }

    // Detect invalid/expired API key — surface clearly instead of silent fallback
    if (serverError.includes('authentication_error') || serverError.includes('invalid x-api-key') || serverError.includes('invalid_api_key')) {
      throw new Error('INVALID_API_KEY: The ANTHROPIC_API_KEY in server/.env is invalid or expired. Update it and restart the server.');
    }
    // Missing key configured on server
    if (serverError.includes('ANTHROPIC_API_KEY')) {
      throw new Error('API key not configured on server — set ANTHROPIC_API_KEY in server/.env and restart.');
    }
    throw new Error(serverError);
  } catch (err) {
    // Network errors (backend not running) → fall through to simulation
    // API key / auth errors → re-throw so Stage4 shows the real error
    if (err.message && (
      err.message.includes('INVALID_API_KEY') ||
      err.message.includes('API key not configured') ||
      err.message.includes('authentication_error')
    )) {
      throw err;
    }
    console.info('[AI] Backend unreachable, using simulation mode:', err.message);
  }

  // ── Simulation fallback (no API key or backend unavailable) ─────────────
  const { id: projectId, name, description, tags } = project;
  const combined = `${name} ${description} ${tags?.join(' ')} ${formData.technologyStack || ''} ${(formData.otProtocols || []).join(' ')} ${(formData.cloudProviders || []).join(' ')}`.toLowerCase();

  onProgress?.({ step: 1, total: 4, message: 'Analysing system characteristics and attack surface...' });
  await simulateDelay(900);

  const characteristics = analyzeProjectCharacteristics(name, description, tags);
  // Map new OT/IT form fields to characteristic tags for threat selection
  const extraChars = [];
  if (formData.projectType === 'OT') extraChars.push('iot');
  if (formData.projectType === 'IT') extraChars.push('web', 'api');
  if ((formData.cloudProviders || []).length > 0) extraChars.push('cloud');
  if ((formData.deploymentModel || '').includes('cloud')) extraChars.push('cloud');
  if ((formData.itArchPattern || '').includes('microservice')) extraChars.push('api');
  if ((formData.authMechanism || []).length > 0) extraChars.push('auth');
  const allChars = [...new Set([...characteristics, ...extraChars])];

  onProgress?.({ step: 2, total: 4, message: 'Selecting and scoring applicable threat scenarios...' });
  await simulateDelay(1200);

  const applicable = DETAILED_THREAT_DB.filter(t =>
    t.applicableTo.some(a => allChars.includes(a) || combined.includes(a))
  );
  const pool = applicable.length >= 5 ? applicable : DETAILED_THREAT_DB.slice(0, 8);

  onProgress?.({ step: 3, total: 4, message: 'Generating risk rationale and control recommendations...' });
  await simulateDelay(1100);

  const componentNames = canvasElements
    .filter(e => e.type !== 'trust_boundary')
    .map(e => e.label || ELEMENT_DEFS_FALLBACK[e.type] || e.type)
    .filter(Boolean);

  const threatRows = pool.map(tDef => {
    const exposureMod = formData.networkExposure === 'internet' ? 1 : formData.networkExposure === 'internal' ? -1 : 0;
    const likelihood  = Math.min(5, Math.max(1, tDef.likelihoodBase + exposureMod + (Math.random() > 0.5 ? 1 : 0)));
    const impact      = Math.min(5, Math.max(1, tDef.impactBase));
    const riskScore   = likelihood * impact;
    const riskLevel   = riskLevelFromScore(riskScore);
    const residualFactor = RESIDUAL_FACTOR[tDef.category] ?? 0.25;
    const residualRiskScore = Math.max(1, Math.round(riskScore * residualFactor));
    const residualRiskLevel = riskLevelFromScore(residualRiskScore);
    const affected = componentNames.length > 0 ? componentNames.slice(0, 3) : ['System'];

    // recommendations from DETAILED_THREAT_DB are objects — normalise to strings
    const recs = (tDef.recommendations || []).map(r =>
      typeof r === 'string' ? r : (r.name ? `${r.name}${r.description ? ': ' + r.description : ''}` : String(r))
    );

    return {
      id: uuidv4(), projectId,
      name: tDef.name,
      strideCategory: tDef.category,
      description: tDef.description,
      affectedComponents: affected,
      likelihood, impact, riskScore, riskLevel,
      rationale: tDef.getRationale(formData),
      recommendations: recs,
      residualRiskScore, residualRiskLevel,
      residualRationale: tDef.getResidualRationale(formData),
      attackVector: 'Network',
      aiGenerated: true,
      aiModel: 'simulation',
      createdAt: new Date().toISOString(),
    };
  });

  threatRows.sort((a, b) => b.riskScore - a.riskScore);

  onProgress?.({ step: 4, total: 4, message: 'Compiling threat register and risk summary...' });
  await simulateDelay(600);

  const assets    = generateAssetsForProject(projectId, allChars);
  const controls  = generateControlsForProject(projectId, threatRows, allChars);
  const dataFlows = generateDataFlowsForProject(projectId, assets, allChars);

  return {
    success: true,
    threatRows,
    threats: threatRows,
    controls, assets, dataFlows,
    summary: {
      characteristics: allChars,
      threatCount: threatRows.length,
      criticalThreats: threatRows.filter(t => t.riskLevel === 'CRITICAL').length,
      highThreats: threatRows.filter(t => t.riskLevel === 'HIGH').length,
      controlCount: controls.length,
      assetCount: assets.length,
      riskScore: calculateOverallRiskScore(threatRows),
    },
  };
}

// Fallback label map for canvas element types
const ELEMENT_DEFS_FALLBACK = {
  actor: 'Actor', process: 'Process', data_store: 'Data Store', external: 'External System',
};
