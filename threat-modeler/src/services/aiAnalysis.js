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
function generateDataFlowsForProject(projectId, assets, characteristics) {
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
