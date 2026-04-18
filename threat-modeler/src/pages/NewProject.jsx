import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  FileText, LayoutTemplate, Brain, BarChart2, Shield, AlertTriangle,
  ChevronRight, ChevronLeft, CheckCircle2, Plus, X, Loader2, Sparkles,
  ArrowRight, GitBranch, Eye, TrendingDown, Network, Database, Globe,
  Server, Smartphone, Share2, Activity, AlertCircle,
} from 'lucide-react';
import { useThreatContext, STRIDE_CATEGORIES } from '../context/ThreatContext';
import ThreatModelCanvas from '../components/ThreatModelCanvas';
import { analyzeWithContext } from '../services/aiAnalysis';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: 1, label: 'Project Details',      icon: FileText },
  { id: 2, label: 'Diagram',              icon: LayoutTemplate },
  { id: 3, label: 'Compliance & Model',   icon: Shield },
  { id: 4, label: 'AI Analysis',          icon: Brain },
];

// ─── OT Constants ─────────────────────────────────────────────────────────────

const PURDUE_ZONES = [
  { level: '0',   name: 'Level 0 — Field Level',        desc: 'Sensors, actuators, field instruments, safety instrumented devices', color: '#dc2626', bgColor: '#fef2f2' },
  { level: '1',   name: 'Level 1 — Control Level',      desc: 'PLCs, RTUs, DCS controllers, safety controllers (SIS)', color: '#ea580c', bgColor: '#fff7ed' },
  { level: '2',   name: 'Level 2 — Supervisory Level',  desc: 'SCADA servers, HMI workstations, engineering workstations', color: '#d97706', bgColor: '#fffbeb' },
  { level: '3',   name: 'Level 3 — Operations Level',   desc: 'MES, Historian, process data servers, production scheduling', color: '#65a30d', bgColor: '#f7fee7' },
  { level: '3.5', name: 'Level 3.5 — Industrial DMZ',   desc: 'Data diodes, perimeter firewalls, jump servers, patch servers', color: '#0891b2', bgColor: '#ecfeff' },
  { level: '4',   name: 'Level 4 — Business Network',   desc: 'ERP systems, corporate IT, enterprise applications', color: '#4f46e5', bgColor: '#eef2ff' },
];

const IEC62443_LEVELS = [
  { sl: '0', label: 'SL-0', desc: 'No specific security requirements', color: '#6b7280', bg: '#f9fafb' },
  { sl: '1', label: 'SL-1', desc: 'Protects against casual or unintentional violation', color: '#16a34a', bg: '#f0fdf4' },
  { sl: '2', label: 'SL-2', desc: 'Protects against intentional violation using simple means', color: '#d97706', bg: '#fffbeb' },
  { sl: '3', label: 'SL-3', desc: 'Protects against sophisticated attack with moderate resources', color: '#ea580c', bg: '#fff7ed' },
  { sl: '4', label: 'SL-4', desc: 'Protects against state-sponsored / nation-state level attacks', color: '#dc2626', bg: '#fef2f2' },
];

const OT_PROTOCOLS = [
  'Modbus TCP/RTU', 'PROFINET', 'EtherNet/IP', 'DNP3', 'IEC 61850',
  'OPC-UA', 'OPC-DA', 'BACnet', 'PROFIBUS', 'DeviceNet',
  'Foundation Fieldbus', 'IEC 60870-5', 'Siemens S7', 'MQTT',
  'WirelessHART', 'HART', 'DDS',
];

const OT_REMOTE_ACCESS = [
  { v: 'none',         l: 'No Remote Access',       d: 'Fully air-gapped, no remote connectivity' },
  { v: 'vpn',          l: 'VPN / Secure Tunnel',     d: 'Encrypted VPN with MFA to jump host' },
  { v: 'jump-server',  l: 'Jump Server / Bastion',   d: 'Dedicated bastion host with logging' },
  { v: 'vendor-direct',l: 'Vendor Direct Access',    d: 'Vendor modem or direct connection' },
  { v: 'rdp-direct',   l: 'Direct RDP/VNC',          d: 'Direct remote desktop without VPN' },
];

const OT_PATCH_MANAGEMENT = [
  { v: 'never',     l: 'Never / Unknown',    d: 'Systems never or rarely patched' },
  { v: 'annual',    l: 'Annual',             d: 'Patched once per year during outage' },
  { v: 'quarterly', l: 'Quarterly',          d: 'Patched every 3 months on schedule' },
  { v: 'monthly',   l: 'Monthly',            d: 'Monthly patch cycles applied' },
  { v: 'continuous',l: 'Continuous',         d: 'Automated patching where feasible' },
];

const SIL_LEVELS = [
  { v: 'none',  l: 'No SIS',   d: 'No safety instrumented system' },
  { v: 'sil1',  l: 'SIL 1',   d: 'Low demand, minor injury risk' },
  { v: 'sil2',  l: 'SIL 2',   d: 'High demand, major injury risk' },
  { v: 'sil3',  l: 'SIL 3',   d: 'Continuous demand, multiple fatalities' },
  { v: 'sil4',  l: 'SIL 4',   d: 'Catastrophic consequences' },
];

const OT_STANDARDS = [
  { id: 'iec62443',      name: 'IEC 62443',       desc: 'Industrial cybersecurity standard series', color: '#dc2626' },
  { id: 'nerc-cip',      name: 'NERC CIP',         desc: 'Critical infrastructure protection (power grid)', color: '#7c3aed' },
  { id: 'aescsf',        name: 'AESCSF',           desc: 'Australian Energy Sector Cyber Security Framework', color: '#1d4ed8' },
  { id: 'nist-sp800-82', name: 'NIST SP 800-82',   desc: 'Guide to OT/ICS security (NIST)', color: '#15803d' },
  { id: 'isa-62443',     name: 'ISA/IEC 99',       desc: 'Industrial automation & control systems security', color: '#0891b2' },
  { id: 'soci',          name: 'SOCI Act',          desc: 'Security of Critical Infrastructure Act 2018', color: '#be123c' },
];

// ─── IT Constants ─────────────────────────────────────────────────────────────

const DEPLOYMENT_MODELS = [
  { v: 'cloud',      l: 'Cloud-only',    d: 'Fully hosted in public cloud(s)',       icon: Server },
  { v: 'on-prem',    l: 'On-premises',   d: 'Self-hosted in own data centre',        icon: Database },
  { v: 'hybrid',     l: 'Hybrid',        d: 'Mix of cloud and on-premises',          icon: Share2 },
  { v: 'saas',       l: 'SaaS Product',  d: 'Software delivered as a service',       icon: Globe },
  { v: 'edge',       l: 'Edge / CDN',    d: 'Distributed edge compute deployment',   icon: Network },
];

const CLOUD_PROVIDERS = [
  'Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud (GCP)',
  'Oracle Cloud', 'IBM Cloud', 'Alibaba Cloud', 'Private Cloud / OpenStack',
];

const IT_ARCH_PATTERNS = [
  { v: 'microservices', l: 'Microservices',   d: 'Independently deployable services' },
  { v: 'monolith',      l: 'Monolithic',      d: 'Single deployable unit' },
  { v: 'serverless',    l: 'Serverless',      d: 'Function-as-a-Service (Lambda etc.)' },
  { v: 'event-driven',  l: 'Event-driven',    d: 'Message queues and event streams' },
  { v: 'soa',           l: 'SOA / ESB',       d: 'Service-oriented architecture' },
  { v: 'jamstack',      l: 'Jamstack / SPA',  d: 'Static frontend + API backend' },
];

const CLOUD_SERVICES = [
  'Virtual Machines / EC2', 'Containers (ECS / AKS / GKE)', 'Kubernetes',
  'Serverless Functions', 'Managed Databases (RDS / CosmosDB / CloudSQL)',
  'Object Storage (S3 / Blob)', 'API Gateway', 'CDN / Edge',
  'Message Queue (SQS / Service Bus)', 'Data Warehouse / Analytics',
  'ML / AI Services', 'Key Management (KMS / Key Vault)',
];

const IDENTITY_PROVIDERS = [
  'Microsoft Active Directory', 'Azure AD / Entra ID', 'Okta',
  'Google Workspace', 'AWS IAM / Cognito', 'Auth0', 'Ping Identity', 'Custom LDAP',
];

const NETWORK_SECURITY = [
  'WAF (Web Application Firewall)', 'DDoS Protection',
  'IDS / IPS', 'CASB', 'Zero Trust / ZTNA',
  'VPN / Site-to-Site', 'Network Segmentation / VPC',
  'Bastion / Jump Host', 'Service Mesh (Istio / Linkerd)',
];

const CICD_SECURITY = [
  'SAST (Static Analysis)', 'DAST (Dynamic Analysis)',
  'SCA (Software Composition Analysis)', 'Secrets Scanning',
  'Container Image Scanning', 'Infrastructure as Code Scanning',
  'Signed Commits / Release Signing', 'SBOM Generation',
];

// ─── Shared IT/OT constants ────────────────────────────────────────────────────

const SENSITIVE_DATA_TYPES = [
  'Personally Identifiable Information (PII)',
  'Financial / Payment Data',
  'Healthcare / Medical Records',
  'Intellectual Property',
  'Authentication Credentials',
  'OT / ICS Operational Data',
  'Government / Classified Data',
  'Legal / Contractual Data',
  'Biometric Data',
  'Cardholder Data (PCI)',
];

const INDUSTRIES = [
  'Energy & Utilities', 'Financial Services', 'Healthcare',
  'Government / Defence', 'Retail & E-Commerce', 'Education',
  'Transport & Logistics', 'Telecommunications', 'Critical Infrastructure',
  'Technology / SaaS', 'Manufacturing', 'Mining & Resources',
];

const AUTH_MECHANISMS = [
  'Username & Password', 'MFA (Password + OTP)', 'SSO / SAML',
  'OAuth 2.0 / OIDC', 'API Key', 'Certificate / mTLS', 'Passwordless',
  'Smart Card / PKI',
];

const COMPLIANCE_FRAMEWORKS = [
  // Australian-specific
  { id: 'essential-eight',  name: 'Essential Eight',      desc: 'ASD mandatory mitigation strategies',               region: 'AU', color: '#1d4ed8' },
  { id: 'aescsf',           name: 'AESCSF',               desc: 'Australian Energy Sector Cyber Security Framework', region: 'AU', color: '#7c3aed' },
  { id: 'soci',             name: 'SOCI Act',             desc: 'Security of Critical Infrastructure Act 2018',      region: 'AU', color: '#dc2626' },
  { id: 'asd-ism',          name: 'ASD ISM',              desc: 'Information Security Manual (ASD / Defence)',       region: 'AU', color: '#059669' },
  { id: 'apra-cps234',      name: 'APRA CPS 234',         desc: 'APRA information security for regulated entities',  region: 'AU', color: '#ea580c' },
  { id: 'privacy-act',      name: 'Privacy Act 1988',     desc: 'Australian Privacy Principles (APPs)',              region: 'AU', color: '#0891b2' },
  { id: 'notifiable-breach',name: 'NDB Scheme',           desc: 'Notifiable Data Breaches (OAIC)',                   region: 'AU', color: '#c026d3' },
  // International
  { id: 'pci-dss',          name: 'PCI-DSS v4',           desc: 'Payment Card Industry Data Security Standard',      region: 'INTL', color: '#b45309' },
  { id: 'iso27001',         name: 'ISO/IEC 27001',        desc: 'Information security management systems',           region: 'INTL', color: '#0369a1' },
  { id: 'nist-csf',         name: 'NIST CSF 2.0',         desc: 'NIST Cybersecurity Framework',                      region: 'INTL', color: '#15803d' },
  { id: 'sox',              name: 'SOX',                  desc: 'Sarbanes-Oxley Act (listed companies)',              region: 'INTL', color: '#92400e' },
  { id: 'gdpr',             name: 'GDPR',                 desc: 'General Data Protection Regulation (EU)',           region: 'INTL', color: '#6d28d9' },
];

const THREAT_MODELS = [
  { id: 'stride',  name: 'STRIDE',  desc: 'Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation' },
  { id: 'pasta',   name: 'PASTA',   desc: 'Process for Attack Simulation and Threat Analysis' },
  { id: 'linddun', name: 'LINDDUN', desc: 'Privacy-focused threat modelling' },
];

const RISK_COLORS = {
  CRITICAL: '#991b1b', HIGH: '#c2410c', MEDIUM: '#f59e0b', LOW: '#84cc16', MINIMAL: '#22c55e',
};
const RISK_BG = {
  CRITICAL: '#fee2e2', HIGH: '#ffedd5', MEDIUM: '#fef3c7', LOW: '#ecfccb', MINIMAL: '#dcfce7',
};

const ATTACK_PATH_TEMPLATES = [
  { id: 'credential-compromise', name: 'Credential Compromise', color: '#8b5cf6', steps: ['S', 'I', 'E'],
    description: 'Attacker spoofs identity → extracts credentials → escalates privileges' },
  { id: 'data-exfiltration',     name: 'Data Exfiltration',    color: '#ef4444', steps: ['S', 'T', 'I'],
    description: 'Attacker gains entry → tampers with access controls → exfiltrates data' },
  { id: 'service-disruption',    name: 'Service Disruption',   color: '#ec4899', steps: ['D', 'T', 'R'],
    description: 'Attacker disrupts service → tampers with backups → hides actions' },
  { id: 'insider-threat',        name: 'Insider Threat',       color: '#f59e0b', steps: ['R', 'I', 'E'],
    description: 'Insider denies actions → accesses sensitive info → escalates privileges' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localRiskLevel(score) {
  if (score >= 20) return 'CRITICAL';
  if (score >= 15) return 'HIGH';
  if (score >= 10) return 'MEDIUM';
  if (score >= 5)  return 'LOW';
  return 'MINIMAL';
}

function cellColor(l, i) {
  const s = l * i;
  if (s >= 20) return { bg: '#991b1b', text: '#fee2e2' };
  if (s >= 15) return { bg: '#c2410c', text: '#ffedd5' };
  if (s >= 10) return { bg: '#f59e0b', text: '#1f2937' };
  if (s >= 5)  return { bg: '#84cc16', text: '#1f2937' };
  return { bg: '#22c55e', text: '#1f2937' };
}

function controlEffectivenessReduction(effectiveness) {
  if (effectiveness === 'HIGH')   return 0.55;
  if (effectiveness === 'MEDIUM') return 0.30;
  return 0.12;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StepIndicator({ stages, current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {stages.map((stage, i) => {
        const done   = current > stage.id;
        const active = current === stage.id;
        const Icon   = stage.icon;
        return (
          <div key={stage.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? 'bg-blue-600 border-blue-600 text-white' :
                active ? 'bg-white border-blue-600 text-blue-600' :
                         'bg-white border-gray-300 text-gray-400'
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${
                active ? 'text-blue-600' : done ? 'text-blue-500' : 'text-gray-400'
              }`}>{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className={`w-16 h-0.5 mb-4 mx-1 ${current > stage.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RiskBadge({ level }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: RISK_BG[level] || '#f3f4f6', color: RISK_COLORS[level] || '#374151' }}>
      {level}
    </span>
  );
}

// ─── Stage 1: Project Details ─────────────────────────────────────────────────

function TagChip({ label, selected, color = 'blue', onClick }) {
  const colors = {
    blue:   { on: 'bg-blue-600 text-white border-blue-600',   off: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400' },
    purple: { on: 'bg-purple-600 text-white border-purple-600', off: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400' },
    red:    { on: 'bg-red-600 text-white border-red-600',     off: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400' },
    amber:  { on: 'bg-amber-600 text-white border-amber-600', off: 'bg-white text-gray-600 border-gray-300 hover:border-gray-400' },
  };
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${selected ? colors[color].on : colors[color].off}`}>
      {label}
    </button>
  );
}

function SectionLabel({ children, badge }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</span>
      {badge && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">{badge}</span>}
    </div>
  );
}

// ── OT-specific form ──────────────────────────────────────────────────────────

function OTForm({ form, setForm }) {
  const toggle = (field, value) => {
    const arr = form[field] || [];
    setForm(f => ({ ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }));
  };

  return (
    <div className="space-y-8">
      {/* Purdue Model Zones */}
      <div>
        <SectionLabel badge="IEC 62443 / Purdue">Purdue Model Zones in Scope</SectionLabel>
        <p className="text-xs text-gray-500 mb-4">Select all network zones that fall within this project's scope</p>
        <div className="space-y-2">
          {PURDUE_ZONES.map(zone => {
            const selected = (form.purdueZones || []).includes(zone.level);
            return (
              <button key={zone.level} type="button"
                onClick={() => toggle('purdueZones', zone.level)}
                className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 text-left transition-all"
                style={selected
                  ? { borderColor: zone.color, background: zone.bgColor }
                  : { borderColor: '#e5e7eb', background: '#fff' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: selected ? zone.color : '#9ca3af' }}>
                  {zone.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{zone.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{zone.desc}</p>
                </div>
                {selected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: zone.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* IEC 62443 Security Level */}
      <div>
        <SectionLabel badge="IEC 62443">Target Security Level (SL)</SectionLabel>
        <p className="text-xs text-gray-500 mb-4">The security level the system must achieve against adversarial threats</p>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {IEC62443_LEVELS.map(sl => {
            const selected = form.iec62443SL === sl.sl;
            return (
              <button key={sl.sl} type="button"
                onClick={() => setForm(f => ({ ...f, iec62443SL: sl.sl }))}
                className="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all"
                style={selected
                  ? { borderColor: sl.color, background: sl.bg }
                  : { borderColor: '#e5e7eb', background: '#fff' }}>
                <span className="text-lg font-black mb-1" style={{ color: selected ? sl.color : '#9ca3af' }}>{sl.label}</span>
                <p className="text-xs text-gray-500 leading-tight">{sl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* OT Protocols */}
      <div>
        <SectionLabel>OT / ICS Protocols in Use</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {OT_PROTOCOLS.map(p => (
            <TagChip key={p} label={p} color="red"
              selected={(form.otProtocols || []).includes(p)}
              onClick={() => toggle('otProtocols', p)} />
          ))}
        </div>
      </div>

      {/* Remote Access */}
      <div>
        <SectionLabel>Remote Access Method</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OT_REMOTE_ACCESS.map(({ v, l, d }) => (
            <button key={v} type="button"
              onClick={() => setForm(f => ({ ...f, otRemoteAccess: v }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.otRemoteAccess === v ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <p className="font-semibold text-sm text-gray-900">{l}</p>
              <p className="text-xs text-gray-500 mt-0.5">{d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Safety Systems + Patch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <SectionLabel badge="IEC 61511">Safety Instrumented System (SIL)</SectionLabel>
          <div className="space-y-2">
            {SIL_LEVELS.map(({ v, l, d }) => (
              <button key={v} type="button"
                onClick={() => setForm(f => ({ ...f, silLevel: v }))}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  form.silLevel === v ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <span className="text-sm font-bold w-10 flex-shrink-0 text-center"
                  style={{ color: form.silLevel === v ? '#dc2626' : '#9ca3af' }}>{l}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{d}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <SectionLabel>Patch Management Capability</SectionLabel>
          <div className="space-y-2">
            {OT_PATCH_MANAGEMENT.map(({ v, l, d }) => (
              <button key={v} type="button"
                onClick={() => setForm(f => ({ ...f, otPatchCadence: v }))}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  form.otPatchCadence === v ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <span className="text-xs font-bold w-16 flex-shrink-0"
                  style={{ color: form.otPatchCadence === v ? '#d97706' : '#9ca3af' }}>{l}</span>
                <p className="text-xs text-gray-500">{d}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legacy systems & air gap toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { field: 'otLegacySystems', label: 'Legacy / End-of-Life Systems Present', sub: 'Systems running beyond vendor support lifecycle' },
          { field: 'otAirGap',        label: 'Network Air-Gap or Segmentation in Place', sub: 'Physical or logical separation from IT/internet' },
          { field: 'otAssetInventory',label: 'Comprehensive OT Asset Inventory Exists', sub: 'All OT assets documented and tracked' },
          { field: 'otVendorAccess',  label: 'Third-Party / Vendor Remote Access', sub: 'External vendors have remote access to OT systems' },
        ].map(({ field, label, sub }) => (
          <label key={field} className="flex items-start justify-between p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex-1 mr-3">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
            <div
              onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${form[field] ? 'bg-blue-500' : 'bg-gray-200'}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[field] ? 'left-5' : 'left-1'}`} />
            </div>
          </label>
        ))}
      </div>

      {/* OT Standards */}
      <div>
        <SectionLabel>Applicable OT Standards & Frameworks</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OT_STANDARDS.map(std => {
            const selected = (form.otStandards || []).includes(std.id);
            return (
              <button key={std.id} type="button"
                onClick={() => toggle('otStandards', std.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ background: std.color }}>{std.name.slice(0,3)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{std.name}</p>
                  <p className="text-xs text-gray-500 truncate">{std.desc}</p>
                </div>
                {selected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sensitive data */}
      <div>
        <SectionLabel>Sensitive / Operational Data Handled</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {SENSITIVE_DATA_TYPES.map(type => (
            <TagChip key={type} label={type} color="purple"
              selected={(form.sensitiveData || []).includes(type)}
              onClick={() => toggle('sensitiveData', type)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── IT-specific form ──────────────────────────────────────────────────────────

function ITForm({ form, setForm }) {
  const toggle = (field, value) => {
    const arr = form[field] || [];
    setForm(f => ({ ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }));
  };

  return (
    <div className="space-y-8">
      {/* Deployment model */}
      <div>
        <SectionLabel>Deployment Model</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DEPLOYMENT_MODELS.map(({ v, l, d, icon: Icon }) => (
            <button key={v} type="button"
              onClick={() => setForm(f => ({ ...f, deploymentModel: v }))}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                form.deploymentModel === v ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <Icon className={`w-5 h-5 ${form.deploymentModel === v ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <p className="font-semibold text-sm text-gray-900">{l}</p>
                <p className="text-xs text-gray-500 mt-0.5">{d}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cloud providers */}
      {['cloud', 'hybrid', 'saas'].includes(form.deploymentModel) && (
        <div>
          <SectionLabel>Cloud Provider(s)</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {CLOUD_PROVIDERS.map(p => (
              <TagChip key={p} label={p} color="blue"
                selected={(form.cloudProviders || []).includes(p)}
                onClick={() => toggle('cloudProviders', p)} />
            ))}
          </div>
        </div>
      )}

      {/* Architecture pattern */}
      <div>
        <SectionLabel>Architecture Pattern</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {IT_ARCH_PATTERNS.map(({ v, l, d }) => (
            <button key={v} type="button"
              onClick={() => setForm(f => ({ ...f, itArchPattern: v }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.itArchPattern === v ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <p className="font-semibold text-sm text-gray-900">{l}</p>
              <p className="text-xs text-gray-500 mt-0.5">{d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cloud services used */}
      <div>
        <SectionLabel>Cloud / Infrastructure Services Used</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CLOUD_SERVICES.map(s => (
            <TagChip key={s} label={s} color="blue"
              selected={(form.cloudServices || []).includes(s)}
              onClick={() => toggle('cloudServices', s)} />
          ))}
        </div>
      </div>

      {/* Network exposure */}
      <div>
        <SectionLabel>Network Exposure</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { v: 'internet',   l: 'Internet-facing', d: 'Accessible by public' },
            { v: 'internal',   l: 'Internal Only',   d: 'Corporate / VPN only' },
            { v: 'air-gapped', l: 'Air-gapped',      d: 'No external network' },
            { v: 'hybrid',     l: 'Hybrid',          d: 'Mix of exposure zones' },
          ].map(({ v, l, d }) => (
            <button key={v} type="button"
              onClick={() => setForm(f => ({ ...f, networkExposure: v }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                form.networkExposure === v ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <p className="font-semibold text-sm text-gray-900">{l}</p>
              <p className="text-xs text-gray-500 mt-0.5">{d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Identity provider */}
      <div>
        <SectionLabel>Identity Provider / IAM</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {IDENTITY_PROVIDERS.map(p => (
            <TagChip key={p} label={p} color="blue"
              selected={(form.identityProvider || []).includes(p)}
              onClick={() => toggle('identityProvider', p)} />
          ))}
        </div>
      </div>

      {/* Authentication */}
      <div>
        <SectionLabel>Authentication Mechanisms</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {AUTH_MECHANISMS.map(m => (
            <TagChip key={m} label={m} color="blue"
              selected={(form.authMechanism || []).includes(m)}
              onClick={() => toggle('authMechanism', m)} />
          ))}
        </div>
      </div>

      {/* Network security */}
      <div>
        <SectionLabel>Network Security Controls</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {NETWORK_SECURITY.map(n => (
            <TagChip key={n} label={n} color="purple"
              selected={(form.networkSecurity || []).includes(n)}
              onClick={() => toggle('networkSecurity', n)} />
          ))}
        </div>
      </div>

      {/* CI/CD security */}
      <div>
        <SectionLabel>CI/CD Pipeline Security</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CICD_SECURITY.map(c => (
            <TagChip key={c} label={c} color="amber"
              selected={(form.cicdSecurity || []).includes(c)}
              onClick={() => toggle('cicdSecurity', c)} />
          ))}
        </div>
      </div>

      {/* Technology stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Technology Stack</label>
          <input type="text" value={form.technologyStack || ''}
            onChange={e => setForm(f => ({ ...f, technologyStack: e.target.value }))}
            className="input" placeholder="e.g., React, Node.js, PostgreSQL, AWS Lambda" />
        </div>
        <div>
          <label className="label">Data Residency</label>
          <select value={form.dataResidency || ''}
            onChange={e => setForm(f => ({ ...f, dataResidency: e.target.value }))} className="input">
            <option value="">Select…</option>
            <option value="australia">Australia only</option>
            <option value="multi-region">Multi-region</option>
            <option value="on-premises">On-premises</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Sensitive data */}
      <div>
        <SectionLabel>Sensitive Data Handled</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {SENSITIVE_DATA_TYPES.map(type => (
            <TagChip key={type} label={type} color="purple"
              selected={(form.sensitiveData || []).includes(type)}
              onClick={() => toggle('sensitiveData', type)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stage 1 wrapper ───────────────────────────────────────────────────────────

function Stage1({ form, setForm }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Project Details
        </h2>
        <p className="text-gray-500 mt-1">Tell us about the system you want to threat model</p>
      </div>

      {/* ── Common fields ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label">Project Name *</label>
          <input type="text" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="input" placeholder="e.g., SCADA Control System or Payment Gateway API" required />
        </div>
        <div className="md:col-span-2">
          <label className="label">System Description</label>
          <textarea value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="input min-h-[80px]" rows={3}
            placeholder="Describe the system, its purpose, key components, and any known risks…" />
        </div>
        <div>
          <label className="label">Owner / Team</label>
          <input type="text" value={form.owner}
            onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
            className="input" placeholder="e.g., Security Engineering" />
        </div>
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="label">Industry Sector</label>
          <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="input">
            <option value="">Select industry…</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="label">System Criticality</label>
          <select value={form.criticality} onChange={e => setForm(f => ({ ...f, criticality: e.target.value }))} className="input">
            <option value="low">Low – minor business impact</option>
            <option value="medium">Medium – moderate impact</option>
            <option value="high">High – significant impact</option>
            <option value="critical">Critical – essential / safety-of-life</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Tags (comma-separated)</label>
          <input type="text" value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
            className="input" placeholder="e.g., scada, iec62443, internet-facing, pci-dss" />
        </div>
      </div>

      {/* ── Project Type selector ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Environment Type</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OT Card */}
          <button type="button" onClick={() => setForm(f => ({ ...f, projectType: 'OT' }))}
            className={`relative flex flex-col text-left p-6 rounded-2xl border-2 transition-all overflow-hidden group ${
              form.projectType === 'OT'
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50'
                : 'border-gray-200 hover:border-orange-300 bg-white'
            }`}>
            {/* Background decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-opacity group-hover:opacity-15"
              style={{ background: 'radial-gradient(circle, #ea580c, transparent)' }} />
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                form.projectType === 'OT' ? 'bg-orange-500' : 'bg-gray-200'
              }`}>
                <Activity className={`w-5 h-5 ${form.projectType === 'OT' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'var(--font-display)' }}>OT / ICS</p>
                <p className="text-xs text-gray-500">Operational Technology</p>
              </div>
              {form.projectType === 'OT' && <CheckCircle2 className="w-5 h-5 text-orange-500 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Industrial control systems, SCADA, DCS, PLCs, RTUs and critical infrastructure. Covers Purdue Model zones, IEC 62443 security levels, and OT-specific protocols.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Purdue Model', 'IEC 62443', 'NERC CIP', 'AESCSF', 'SIL Rating'].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: form.projectType === 'OT' ? '#fff7ed' : '#f9fafb', color: form.projectType === 'OT' ? '#c2410c' : '#6b7280', border: '1px solid', borderColor: form.projectType === 'OT' ? '#fed7aa' : '#e5e7eb' }}>
                  {t}
                </span>
              ))}
            </div>
          </button>

          {/* IT Card */}
          <button type="button" onClick={() => setForm(f => ({ ...f, projectType: 'IT' }))}
            className={`relative flex flex-col text-left p-6 rounded-2xl border-2 transition-all overflow-hidden group ${
              form.projectType === 'IT'
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                : 'border-gray-200 hover:border-blue-300 bg-white'
            }`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-opacity group-hover:opacity-15"
              style={{ background: 'radial-gradient(circle, #2563eb, transparent)' }} />
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                form.projectType === 'IT' ? 'bg-blue-600' : 'bg-gray-200'
              }`}>
                <Server className={`w-5 h-5 ${form.projectType === 'IT' ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'var(--font-display)' }}>IT / Cloud</p>
                <p className="text-xs text-gray-500">Information Technology</p>
              </div>
              {form.projectType === 'IT' && <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Web applications, APIs, cloud infrastructure, SaaS products and enterprise IT. Covers cloud providers, deployment models, CI/CD security and modern architecture patterns.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['AWS / Azure / GCP', 'Microservices', 'Zero Trust', 'OWASP', 'ISO 27001'].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: form.projectType === 'IT' ? '#eff6ff' : '#f9fafb', color: form.projectType === 'IT' ? '#1d4ed8' : '#6b7280', border: '1px solid', borderColor: form.projectType === 'IT' ? '#bfdbfe' : '#e5e7eb' }}>
                  {t}
                </span>
              ))}
            </div>
          </button>
        </div>
      </div>

      {/* ── Conditional form ── */}
      <AnimatePresence mode="wait">
        {form.projectType === 'OT' && (
          <motion.div key="ot"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-3 mb-6 pt-2">
              <div className="h-px flex-1 bg-orange-200" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 border border-orange-200">
                <Activity className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-bold text-orange-700">OT / ICS Environment Questions</span>
              </div>
              <div className="h-px flex-1 bg-orange-200" />
            </div>
            <OTForm form={form} setForm={setForm} />
          </motion.div>
        )}
        {form.projectType === 'IT' && (
          <motion.div key="it"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-3 mb-6 pt-2">
              <div className="h-px flex-1 bg-blue-200" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">IT / Cloud Environment Questions</span>
              </div>
              <div className="h-px flex-1 bg-blue-200" />
            </div>
            <ITForm form={form} setForm={setForm} />
          </motion.div>
        )}
        {!form.projectType && (
          <motion.div key="none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Select an environment type above</p>
            <p className="text-xs text-gray-400 mt-1">The form will adapt to show relevant security questions</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stage 2: Diagram ─────────────────────────────────────────────────────────

function Stage2({ diagramData, onDiagramChange }) {
  return (
    <div className="flex flex-col">
      <div className="px-8 pt-7 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">System Diagram</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Drag components from the palette onto the canvas, connect them with arrows.
          The diagram components will be used to tailor the AI threat analysis.
        </p>
      </div>
      <div style={{ height: 'calc(100vh - 320px)', minHeight: 580 }}>
        <ThreatModelCanvas value={diagramData} onChange={onDiagramChange} />
      </div>
    </div>
  );
}

// ─── Stage 3: Compliance & Model ──────────────────────────────────────────────

function Stage3({ form, setForm }) {
  const toggleFramework = id => {
    const arr = form.complianceFrameworks || [];
    setForm(f => ({
      ...f,
      complianceFrameworks: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id],
    }));
  };

  const auFrameworks   = COMPLIANCE_FRAMEWORKS.filter(f => f.region === 'AU');
  const intlFrameworks = COMPLIANCE_FRAMEWORKS.filter(f => f.region === 'INTL');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Compliance & Threat Model</h2>
        <p className="text-gray-500 mt-1">Select the frameworks and methodology to apply to this analysis</p>
      </div>

      {/* Australian frameworks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-gray-700">Australian Frameworks</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Recommended</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {auFrameworks.map(fw => {
            const selected = (form.complianceFrameworks || []).includes(fw.id);
            return (
              <button key={fw.id} type="button" onClick={() => toggleFramework(fw.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: fw.color }}>
                    {fw.name.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{fw.name}</p>
                    <p className="text-xs text-gray-500 truncate">{fw.desc}</p>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* International frameworks */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">International Frameworks</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {intlFrameworks.map(fw => {
            const selected = (form.complianceFrameworks || []).includes(fw.id);
            return (
              <button key={fw.id} type="button" onClick={() => toggleFramework(fw.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ background: fw.color }}>
                    {fw.name.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{fw.name}</p>
                    <p className="text-xs text-gray-500 truncate">{fw.desc}</p>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat model methodology */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Threat Modelling Methodology</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {THREAT_MODELS.map(tm => {
            const selected = form.threatModel === tm.id;
            return (
              <button key={tm.id} type="button" onClick={() => setForm(f => ({ ...f, threatModel: tm.id }))}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">{tm.name}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-xs text-gray-500">{tm.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STRIDE legend */}
      {(!form.threatModel || form.threatModel === 'stride') && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">STRIDE Categories Applied</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(STRIDE_CATEGORIES).map(([key, cat]) => (
              <div key={key} className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5"
                  style={{ background: cat.color }}>
                  {key}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                  <p className="text-xs text-gray-500 leading-tight">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage 4: AI Analysis ─────────────────────────────────────────────────────

const ANALYSIS_STEPS = [
  'Analysing system characteristics and attack surface',
  'Selecting and scoring applicable threat scenarios',
  'Generating risk rationale and control recommendations',
  'Compiling threat register and risk summary',
];

function Stage4({ project, form, diagramData, onSave }) {
  const [status, setStatus]             = useState('idle');
  const [progress, setProgress]         = useState({ step: 0, total: 4, message: '' });
  const [results, setResults]           = useState(null);
  const [error, setError]               = useState(null);
  const [userControls, setUserControls] = useState({}); // { threatId: [{ id, name, type, effectiveness }] }
  const [addingFor, setAddingFor]       = useState(null);
  const [newCtrl, setNewCtrl]           = useState({ name: '', type: 'Preventive', effectiveness: 'MEDIUM' });
  const [activeTab, setActiveTab]       = useState('threats');
  const [expandedThreat, setExpandedThreat] = useState(null);

  useEffect(() => {
    if (status === 'idle' && project?.id) runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const runAnalysis = async () => {
    setStatus('analyzing');
    setError(null);
    try {
      const result = await analyzeWithContext(
        project,
        {
          projectType:        form?.projectType,
          networkExposure:    form?.networkExposure,
          sensitiveData:      form?.sensitiveData,
          industry:           form?.industry,
          criticality:        form?.criticality,
          // OT context
          purdueZones:        form?.purdueZones,
          iec62443SL:         form?.iec62443SL,
          otProtocols:        form?.otProtocols,
          otRemoteAccess:     form?.otRemoteAccess,
          silLevel:           form?.silLevel,
          otPatchCadence:     form?.otPatchCadence,
          otLegacySystems:    form?.otLegacySystems,
          otAirGap:           form?.otAirGap,
          otVendorAccess:     form?.otVendorAccess,
          otStandards:        form?.otStandards,
          // IT context
          deploymentModel:    form?.deploymentModel,
          cloudProviders:     form?.cloudProviders,
          itArchPattern:      form?.itArchPattern,
          cloudServices:      form?.cloudServices,
          identityProvider:   form?.identityProvider,
          authMechanism:      form?.authMechanism,
          networkSecurity:    form?.networkSecurity,
          cicdSecurity:       form?.cicdSecurity,
          technologyStack:    form?.technologyStack,
          dataResidency:      form?.dataResidency,
        },
        diagramData?.elements || [],
        p => setProgress(p),
      );
      if (result.success) {
        setResults(result);
        setStatus('done');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (e) {
      setError(e.message || 'Unexpected error during analysis');
      setStatus('error');
    }
  };

  // ── Residual risk calculation ──────────────────────────────────────────────

  const getResidual = (threat) => {
    const controls = userControls[threat.id] || [];
    if (!controls.length) return null;
    const totalReduction = Math.min(
      controls.reduce((acc, c) => acc + controlEffectivenessReduction(c.effectiveness), 0),
      0.85,
    );
    const residualScore = Math.max(Math.round(threat.riskScore * (1 - totalReduction)), 1);
    return { score: residualScore, level: localRiskLevel(residualScore) };
  };

  const addControl = (threatId) => {
    if (!newCtrl.name.trim()) return;
    setUserControls(prev => ({
      ...prev,
      [threatId]: [...(prev[threatId] || []), { ...newCtrl, id: uuidv4() }],
    }));
    setNewCtrl({ name: '', type: 'Preventive', effectiveness: 'MEDIUM' });
    setAddingFor(null);
  };

  const removeControl = (threatId, ctrlId) => {
    setUserControls(prev => ({
      ...prev,
      [threatId]: (prev[threatId] || []).filter(c => c.id !== ctrlId),
    }));
  };

  // ── Overall scores ─────────────────────────────────────────────────────────

  const threats = results?.threats || [];

  const overallInitial = threats.length
    ? Math.round(threats.reduce((s, t) => s + (t.riskScore || 0), 0) / threats.length)
    : 0;

  const overallResidual = threats.length
    ? Math.round(threats.reduce((s, t) => {
        const r = getResidual(t);
        return s + (r ? r.score : (t.riskScore || 0));
      }, 0) / threats.length)
    : 0;

  const reductionPct = overallInitial > 0
    ? Math.round(((overallInitial - overallResidual) / overallInitial) * 100)
    : 0;

  // ── Analyzing state ────────────────────────────────────────────────────────

  if (status === 'analyzing') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Threat Analysis</h2>
          <p className="text-gray-500 mt-1">Analysing your project for security threats…</p>
        </div>
        <div className="space-y-3">
          {ANALYSIS_STEPS.map((label, i) => {
            const stepNum = i + 1;
            const done    = progress.step > stepNum;
            const current = progress.step === stepNum;
            return (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                done ? 'bg-green-50' : current ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-green-500' : current ? 'bg-blue-500' : 'bg-gray-200'
                }`}>
                  {done    ? <CheckCircle2 className="w-5 h-5 text-white" /> :
                   current ? <Loader2 className="w-5 h-5 text-white animate-spin" /> :
                             <span className="text-gray-400 text-sm font-bold">{stepNum}</span>}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${done ? 'text-green-700' : current ? 'text-blue-700' : 'text-gray-400'}`}>
                    {label}
                  </p>
                  {current && progress.message && (
                    <p className="text-xs text-blue-500 mt-0.5">{progress.message}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-blue-600">{Math.round((progress.step / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{ width: `${(progress.step / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>AI is analysing your system for security threats…</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={runAnalysis} className="btn-primary">
          <Loader2 className="w-4 h-4 mr-2" /> Retry Analysis
        </button>
      </div>
    );
  }

  if (status === 'idle' || !results) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'threats',      label: 'Threat Table',   icon: AlertTriangle },
    { id: 'matrix',       label: 'Risk Matrix',    icon: BarChart2 },
    { id: 'attack-paths', label: 'Attack Paths',   icon: GitBranch },
    { id: 'visual',       label: 'Visual Threats', icon: Eye },
  ];

  const ScoreBox = ({ label, score, max = 25, suffix }) => {
    const lvl = localRiskLevel(score);
    return (
      <div className="flex-1 bg-white rounded-xl p-4 border border-gray-200 text-center">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-4xl font-black mb-1" style={{ color: RISK_COLORS[lvl] }}>
          {score}{suffix}
        </p>
        <RiskBadge level={lvl} />
        <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min((score / max) * 100, 100)}%`, background: RISK_COLORS[lvl] }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">out of {max}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Analysis Results</h2>
          <p className="text-gray-500 mt-1">
            {threats.length} threats identified · Add controls to reduce residual risk
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
          <CheckCircle2 className="w-4 h-4" />
          Analysis complete
        </div>
      </div>

      {/* Risk score summary */}
      <div className="flex gap-3">
        <ScoreBox label="Initial Risk Score" score={overallInitial} />
        <div className="flex items-center justify-center w-10 flex-shrink-0">
          <TrendingDown className="w-6 h-6 text-gray-300" />
        </div>
        <ScoreBox label="Residual Risk Score" score={overallResidual} />
        <div className="flex-1 bg-white rounded-xl p-4 border border-gray-200 text-center">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Risk Reduction</p>
          <p className="text-4xl font-black mb-1 text-green-600">{reductionPct}%</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
            After your controls
          </span>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${reductionPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Object.values(userControls).flat().length} control{Object.values(userControls).flat().length !== 1 ? 's' : ''} applied
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Threat Table ───────────────────────────────────────────────────── */}
      {activeTab === 'threats' && (
        <div className="space-y-3">
          {/* Simulation mode banner */}
          {threats.length > 0 && threats[0]?.aiModel === 'simulation' && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Simulation mode — not using Claude AI</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  The backend is not running or <code className="font-mono bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> is not set.
                  Threats come from a local template database and do not reflect your specific project context.
                  Start the server with the API key for real contextual analysis.
                </p>
              </div>
            </div>
          )}

          {threats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No threats identified. Try adding more project details.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">STRIDE</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Threat</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-24">Initial Risk</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Mitigation</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Controls</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">Residual Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.map((threat, idx) => {
                    const controls   = userControls[threat.id] || [];
                    const residual   = getResidual(threat);
                    const isAdding   = addingFor === threat.id;
                    const isExpanded = expandedThreat === threat.id;
                    const recs       = threat.recommendations || [];
                    const topRec     = typeof recs[0] === 'string' ? recs[0] : recs[0]?.name;

                    return (
                      <React.Fragment key={threat.id}>
                        {/* ── Main row ── */}
                        <tr
                          onClick={() => setExpandedThreat(isExpanded ? null : threat.id)}
                          className={`border-b border-gray-100 transition-colors cursor-pointer ${
                            isAdding ? 'bg-green-50' : isExpanded ? 'bg-blue-50/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* # */}
                          <td className="px-3 py-3 text-gray-400 font-mono text-xs align-top">{idx + 1}</td>

                          {/* STRIDE */}
                          <td className="px-3 py-3 align-top">
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                style={{ background: STRIDE_CATEGORIES[threat.strideCategory]?.color || '#6b7280' }}>
                                {threat.strideCategory}
                              </div>
                              <span className="text-xs text-gray-500 hidden xl:block">
                                {STRIDE_CATEGORIES[threat.strideCategory]?.name}
                              </span>
                            </div>
                          </td>

                          {/* Threat name + description + chevron */}
                          <td className="px-3 py-3 align-top max-w-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm leading-snug">{threat.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-1">{threat.description}</p>
                                {controls.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {controls.map(ctrl => (
                                      <div key={ctrl.id}
                                        className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 text-xs text-green-700">
                                        <Shield className="w-2.5 h-2.5" />
                                        <span className="font-medium truncate max-w-[80px]">{ctrl.name}</span>
                                        <button onClick={e => { e.stopPropagation(); removeControl(threat.id, ctrl.id); }}
                                          className="hover:text-red-500 transition-colors">
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform text-gray-300 ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} />
                            </div>
                          </td>

                          {/* Initial risk */}
                          <td className="px-3 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <RiskBadge level={threat.riskLevel} />
                              <span className="text-xs text-gray-400 font-mono">
                                {threat.riskScore ?? '–'} (L{threat.likelihood}×I{threat.impact})
                              </span>
                            </div>
                          </td>

                          {/* Top mitigation */}
                          <td className="px-3 py-3 align-top max-w-xs">
                            {topRec ? (
                              <div>
                                <p className="text-xs text-gray-700 line-clamp-2">{topRec}</p>
                                {recs.length > 1 && (
                                  <p className="text-xs text-blue-500 mt-0.5">+{recs.length - 1} more — click to expand</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* Controls button */}
                          <td className="px-3 py-3 align-top text-center" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setAddingFor(isAdding ? null : threat.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isAdding
                                  ? 'bg-green-600 text-white border-green-600'
                                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              }`}>
                              <Shield className="w-3 h-3" />
                              Controls
                              {controls.length > 0 && (
                                <span className={`rounded-full w-4 h-4 flex items-center justify-center text-xs ${isAdding ? 'bg-white text-green-700' : 'bg-green-600 text-white'}`}>
                                  {controls.length}
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Residual risk */}
                          <td className="px-3 py-3 align-top">
                            {residual ? (
                              <div className="flex flex-col gap-1">
                                <RiskBadge level={residual.level} />
                                <span className="text-xs text-gray-400 font-mono">score {residual.score}</span>
                              </div>
                            ) : threat.residualRiskLevel ? (
                              <div className="flex flex-col gap-1">
                                <RiskBadge level={threat.residualRiskLevel} />
                                <span className="text-xs text-gray-400 font-mono">score {threat.residualRiskScore}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>

                        {/* ── Expanded detail row ── */}
                        {isExpanded && (
                          <tr className="bg-blue-50/40 border-b border-blue-100">
                            <td colSpan={7} className="px-5 py-5">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Risk breakdown */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Risk Breakdown</p>
                                  <div className="flex items-stretch gap-2 mb-4">
                                    {[
                                      { label: 'Likelihood', val: threat.likelihood },
                                      { label: '×', val: null },
                                      { label: 'Impact', val: threat.impact },
                                      { label: '=', val: null },
                                      { label: threat.riskLevel, val: threat.riskScore, isFinal: true },
                                    ].map((item, i) =>
                                      item.val === null ? (
                                        <div key={i} className="flex items-center text-gray-400 font-bold text-lg">{item.label}</div>
                                      ) : (
                                        <div key={i} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border text-center ${item.isFinal ? '' : 'bg-white border-gray-200'}`}
                                          style={item.isFinal ? { background: RISK_BG[threat.riskLevel], borderColor: RISK_COLORS[threat.riskLevel] } : {}}>
                                          <span className="text-2xl font-black" style={{ color: item.isFinal ? RISK_COLORS[threat.riskLevel] : '#374151' }}>{item.val}</span>
                                          <span className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: item.isFinal ? RISK_COLORS[threat.riskLevel] : '#9ca3af' }}>{item.label}</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                  {/* Affected components */}
                                  {(threat.affectedComponents || []).length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Affected Components</p>
                                      <div className="flex flex-wrap gap-1">
                                        {threat.affectedComponents.map((c, i) => (
                                          <span key={i} className="text-xs px-2 py-0.5 bg-white rounded-full border border-gray-200 text-gray-600">{c}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {/* Residual risk after AI mitigations */}
                                  {(threat.residualRiskScore || residual) && (
                                    <div className="p-3 rounded-xl border border-green-200 bg-green-50">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-green-700 mb-1">Residual Risk (after mitigations)</p>
                                      <div className="flex items-center gap-2">
                                        <RiskBadge level={residual ? residual.level : threat.residualRiskLevel} />
                                        <span className="text-xs text-green-700 font-mono">score {residual ? residual.score : threat.residualRiskScore}</span>
                                      </div>
                                      {threat.residualRationale && (
                                        <p className="text-xs text-green-700 mt-2 leading-relaxed">{threat.residualRationale}</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Description + Rationale */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</p>
                                  <p className="text-sm text-gray-700 leading-relaxed mb-4">{threat.description}</p>
                                  {threat.rationale && (
                                    <>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Why This Risk Level?</p>
                                      <p className="text-sm text-gray-700 leading-relaxed">{threat.rationale}</p>
                                    </>
                                  )}
                                </div>

                                {/* Recommendations */}
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Recommendations ({recs.length})</p>
                                  <ol className="space-y-2.5">
                                    {recs.map((rec, i) => {
                                      const name = typeof rec === 'string' ? rec : rec.name;
                                      const desc = typeof rec === 'object' ? rec.description : null;
                                      return (
                                        <li key={i} className="flex gap-2.5">
                                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold mt-0.5">{i + 1}</span>
                                          <div>
                                            <p className="text-sm font-semibold text-gray-800 leading-snug">{name}</p>
                                            {desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ol>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}

                        {/* ── Add-control row ── */}
                        {isAdding && (
                          <tr className="bg-green-50 border-b border-green-100">
                            <td colSpan={7} className="px-4 py-3">
                              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
                                Add Control for: {threat.name}
                              </p>
                              <div className="flex gap-2 flex-wrap items-end">
                                <input type="text" value={newCtrl.name}
                                  onChange={e => setNewCtrl(n => ({ ...n, name: e.target.value }))}
                                  placeholder="Control name (e.g. MFA enforcement, Rate limiting)"
                                  className="input text-sm py-1.5 flex-1 min-w-[220px]"
                                  onKeyDown={e => e.key === 'Enter' && addControl(threat.id)} />
                                <select value={newCtrl.type}
                                  onChange={e => setNewCtrl(n => ({ ...n, type: e.target.value }))}
                                  className="input text-sm py-1.5 w-36">
                                  <option>Preventive</option>
                                  <option>Detective</option>
                                  <option>Corrective</option>
                                  <option>Deterrent</option>
                                </select>
                                <select value={newCtrl.effectiveness}
                                  onChange={e => setNewCtrl(n => ({ ...n, effectiveness: e.target.value }))}
                                  className="input text-sm py-1.5 w-32">
                                  <option value="HIGH">High (−55%)</option>
                                  <option value="MEDIUM">Medium (−30%)</option>
                                  <option value="LOW">Low (−12%)</option>
                                </select>
                                <button onClick={() => addControl(threat.id)} className="btn-primary text-sm py-1.5">
                                  <Plus className="w-4 h-4 mr-1" /> Add Control
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Risk Matrix ──────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex gap-6 items-start">
            {/* 5×5 grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[320px]">
                <p className="text-xs font-semibold text-gray-500 text-center mb-2">RISK MATRIX (Likelihood × Impact)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 4 }}>
                  {/* Column headers */}
                  <div />
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="text-center text-xs font-semibold text-gray-500 py-1">I={i}</div>
                  ))}
                  {/* Rows */}
                  {[5,4,3,2,1].map(l => (
                    <>
                      <div key={`l${l}`} className="flex items-center justify-end pr-2 text-xs font-semibold text-gray-500">L={l}</div>
                      {[1,2,3,4,5].map(i => {
                        const { bg } = cellColor(l, i);
                        const initialHere  = threats.filter(t => t.likelihood === l && t.impact === i);
                        const residualHere = threats.filter(t => {
                          const r = getResidual(t);
                          if (!r) return false;
                          const rL = Math.max(1, Math.round(t.likelihood * (r.score / t.riskScore)));
                          return rL === l && t.impact === i;
                        });
                        return (
                          <div key={i}
                            className="rounded-md flex items-center justify-center relative"
                            style={{ background: bg, aspectRatio: '1', minHeight: 48, minWidth: 48 }}>
                            {initialHere.map((_, di) => (
                              <div key={di}
                                className="w-3 h-3 rounded-full bg-red-600 border-2 border-white absolute shadow-sm"
                                style={{ top: 4 + di * 7, right: 4 }}
                                title="Initial risk" />
                            ))}
                            {residualHere.map((_, di) => (
                              <div key={di}
                                className="w-3 h-3 rounded-full bg-green-600 border-2 border-white absolute shadow-sm"
                                style={{ bottom: 4 + di * 7, left: 4 }}
                                title="Residual risk" />
                            ))}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">Impact (1=Low → 5=Critical)</p>
              </div>
            </div>

            {/* Legend + list */}
            <div className="w-60 space-y-4 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Legend</p>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-white shadow" />
                    <span className="text-gray-600">Initial risk position</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-green-600 border-2 border-white shadow" />
                    <span className="text-gray-600">Residual (after controls)</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {[
                    { bg: '#991b1b', l: 'Critical (≥20)' },
                    { bg: '#c2410c', l: 'High (15-19)' },
                    { bg: '#f59e0b', l: 'Medium (10-14)' },
                    { bg: '#84cc16', l: 'Low (5-9)' },
                    { bg: '#22c55e', l: 'Minimal (1-4)' },
                  ].map(r => (
                    <div key={r.l} className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-3 rounded" style={{ background: r.bg }} />
                      <span className="text-gray-600">{r.l}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3 max-h-72 overflow-y-auto">
                <p className="text-sm font-semibold text-gray-700 mb-2">Threats</p>
                <div className="space-y-2">
                  {threats.map(t => {
                    const residual = getResidual(t);
                    return (
                      <div key={t.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: STRIDE_CATEGORIES[t.strideCategory]?.color }}>
                          {t.strideCategory}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 truncate">{t.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <RiskBadge level={t.riskLevel} />
                            {residual && (
                              <>
                                <ArrowRight className="w-2 h-2 text-gray-400" />
                                <RiskBadge level={residual.level} />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attack Paths ──────────────────────────────────────────────────────── */}
      {activeTab === 'attack-paths' && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>Attack Path Analysis</strong> — The paths below show how an attacker can chain multiple threat types to achieve their objective.
            Each node represents a STRIDE category. Threats identified in your project are listed under each path.
          </div>

          {ATTACK_PATH_TEMPLATES.map((path, pi) => {
            const related = threats.filter(t => path.steps.includes(t.strideCategory));
            return (
              <motion.div key={path.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pi * 0.08 }}
                className="bg-white rounded-xl border-2 overflow-hidden"
                style={{ borderColor: path.color + '40' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b"
                  style={{ background: path.color + '10', borderColor: path.color + '25' }}>
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 flex-shrink-0" style={{ color: path.color }} />
                    <div>
                      <p className="font-bold text-gray-900">{path.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{path.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    related.length > 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {related.length} threat{related.length !== 1 ? 's' : ''} matched
                  </span>
                </div>

                <div className="p-5">
                  {/* Visual attack chain */}
                  <div className="flex items-start gap-0 mb-5 overflow-x-auto pb-2">
                    {path.steps.map((step, si) => {
                      const stepThreats = threats.filter(t => t.strideCategory === step);
                      const hasThreats  = stepThreats.length > 0;
                      return (
                        <div key={si} className="flex items-start">
                          {/* Node */}
                          <div className="flex flex-col items-center min-w-[120px]">
                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-sm border-2 ${hasThreats ? 'border-red-300' : 'border-transparent opacity-50'}`}
                              style={{ background: STRIDE_CATEGORIES[step]?.color }}>
                              <span className="text-xl font-black">{step}</span>
                              <span className="text-xs opacity-80 mt-0.5">{hasThreats ? `${stepThreats.length}` : '0'}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 font-medium text-center px-1 leading-tight">
                              {STRIDE_CATEGORIES[step]?.name}
                            </p>
                            {hasThreats && (
                              <div className="mt-1.5 space-y-1 w-full px-1">
                                {stepThreats.slice(0, 2).map(t => (
                                  <div key={t.id} className="text-center">
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                      style={{ background: RISK_BG[t.riskLevel], color: RISK_COLORS[t.riskLevel] }}>
                                      {t.riskLevel}
                                    </span>
                                  </div>
                                ))}
                                {stepThreats.length > 2 && (
                                  <p className="text-xs text-gray-400 text-center">+{stepThreats.length - 2} more</p>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Arrow connector */}
                          {si < path.steps.length - 1 && (
                            <div className="flex items-center mt-7 flex-shrink-0 mx-1">
                              <div className="w-6 h-0.5" style={{ background: path.color + '60' }} />
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: path.color }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Matched threats table */}
                  {related.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Threats involved in this attack path
                      </p>
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">STRIDE</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Threat</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Initial</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Residual</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Controls</th>
                            </tr>
                          </thead>
                          <tbody>
                            {related.map(t => {
                              const residual  = getResidual(t);
                              const ctrlCount = (userControls[t.id] || []).length;
                              return (
                                <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <td className="px-3 py-2">
                                    <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: STRIDE_CATEGORIES[t.strideCategory]?.color }}>
                                      {t.strideCategory}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <p className="font-medium text-gray-900 text-xs">{t.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
                                  </td>
                                  <td className="px-3 py-2"><RiskBadge level={t.riskLevel} /></td>
                                  <td className="px-3 py-2">
                                    {residual
                                      ? <RiskBadge level={residual.level} />
                                      : <span className="text-xs text-gray-400">—</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    {ctrlCount > 0
                                      ? <span className="flex items-center gap-1 text-xs text-green-700"><Shield className="w-3 h-3" />{ctrlCount}</span>
                                      : <span className="text-xs text-gray-400">None</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-400">
                      No threats matched this path in your project — this attack vector may be low risk.
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Visual Threats ────────────────────────────────────────────────────── */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Threats grouped by risk level. Cards show initial and residual risk after applied controls.
          </p>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'MINIMAL'].map(level => {
            const group = threats.filter(t => t.riskLevel === level);
            if (!group.length) return null;
            return (
              <div key={level}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1" style={{ background: RISK_COLORS[level] }} />
                  <RiskBadge level={level} />
                  <span className="text-sm text-gray-500">{group.length} threat{group.length > 1 ? 's' : ''}</span>
                  <div className="h-px flex-1" style={{ background: RISK_COLORS[level] }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.map((threat, ti) => {
                    const residual = getResidual(threat);
                    const ctrlCount = (userControls[threat.id] || []).length;
                    const recs = threat.recommendations || [];
                    return (
                      <motion.div key={threat.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: ti * 0.05 }}
                        className="rounded-xl border-2 p-4 relative overflow-hidden"
                        style={{ borderColor: RISK_COLORS[level], background: RISK_BG[level] }}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ background: STRIDE_CATEGORIES[threat.strideCategory]?.color }}>
                            {threat.strideCategory}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 mb-0.5 text-sm">{threat.name}</p>
                            <p className="text-xs text-gray-600 mb-2 leading-relaxed">{threat.description}</p>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="text-gray-500">
                                Score: <strong>{threat.riskScore}</strong>
                                {' '}(L{threat.likelihood}×I{threat.impact})
                              </span>
                              {residual && (
                                <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                  <TrendingDown className="w-3 h-3" />
                                  Residual: {residual.level} (score {residual.score})
                                </span>
                              )}
                              {ctrlCount > 0 && (
                                <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                  <Shield className="w-3 h-3" /> {ctrlCount} control{ctrlCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {recs.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="font-semibold">Key mitigation: </span>
                                {recs[0]?.name}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Risk score bar */}
                        <div className="mt-3 w-full bg-white/60 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(((threat.riskScore || 0) / 25) * 100, 100)}%`,
                              background: RISK_COLORS[level],
                            }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save / Re-run */}
      <div className="pt-4 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => { setResults(null); setExpandedThreat(null); runAnalysis(); }}
          className="btn-secondary py-3 px-5 flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Re-Run Analysis
        </button>
        <button onClick={() => onSave(results, userControls)} className="btn-primary flex-1 text-base py-3">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Save Project &amp; View Results
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewProject() {
  const navigate = useNavigate();
  const { addProjectWithId, setCurrentProject, updateProject } = useThreatContext();

  const [stage,       setStage]       = useState(1);
  const [project,     setProject]     = useState(null);
  const [diagramData, setDiagramData] = useState({ elements: [], connections: [] });
  const [form,    setForm]    = useState({
    name:                 '',
    description:          '',
    owner:                '',
    status:               'active',
    tags:                 '',
    industry:             '',
    criticality:          'medium',
    // OT / IT type
    projectType:          '',
    // OT fields
    purdueZones:          [],
    iec62443SL:           '',
    otProtocols:          [],
    otRemoteAccess:       '',
    silLevel:             '',
    otPatchCadence:       '',
    otLegacySystems:      false,
    otAirGap:             false,
    otAssetInventory:     false,
    otVendorAccess:       false,
    otStandards:          [],
    // IT fields
    deploymentModel:      '',
    cloudProviders:       [],
    itArchPattern:        '',
    cloudServices:        [],
    networkExposure:      '',
    identityProvider:     [],
    authMechanism:        [],
    networkSecurity:      [],
    cicdSecurity:         [],
    technologyStack:      '',
    dataResidency:        '',
    // Shared
    sensitiveData:        [],
    complianceFrameworks: [],
    threatModel:          'stride',
  });

  const canNext = () => {
    if (stage === 1) return form.name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (stage === 1) {
      const newProject = {
        id:                   project?.id || uuidv4(),
        name:                 form.name,
        description:          form.description,
        owner:                form.owner,
        status:               form.status,
        tags:                 form.tags.split(',').map(t => t.trim()).filter(Boolean),
        industry:             form.industry,
        criticality:          form.criticality,
        // OT / IT
        projectType:          form.projectType,
        // OT fields
        purdueZones:          form.purdueZones,
        iec62443SL:           form.iec62443SL,
        otProtocols:          form.otProtocols,
        otRemoteAccess:       form.otRemoteAccess,
        silLevel:             form.silLevel,
        otPatchCadence:       form.otPatchCadence,
        otLegacySystems:      form.otLegacySystems,
        otAirGap:             form.otAirGap,
        otAssetInventory:     form.otAssetInventory,
        otVendorAccess:       form.otVendorAccess,
        otStandards:          form.otStandards,
        // IT fields
        deploymentModel:      form.deploymentModel,
        cloudProviders:       form.cloudProviders,
        itArchPattern:        form.itArchPattern,
        cloudServices:        form.cloudServices,
        networkExposure:      form.networkExposure,
        identityProvider:     form.identityProvider,
        authMechanism:        form.authMechanism,
        networkSecurity:      form.networkSecurity,
        cicdSecurity:         form.cicdSecurity,
        technologyStack:      form.technologyStack,
        dataResidency:        form.dataResidency,
        // Shared
        sensitiveData:        form.sensitiveData,
        complianceFrameworks: form.complianceFrameworks,
        threatModel:          form.threatModel,
        createdAt:            new Date().toISOString(),
      };
      if (!project) {
        addProjectWithId(newProject);
        setProject(newProject);
      }
    }
    if (stage === 3) {
      setProject(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          complianceFrameworks: form.complianceFrameworks,
          threatModel:          form.threatModel,
        };
        updateProject(updated); // persist to ThreatContext too
        return updated;
      });
    }
    setStage(s => s + 1);
  };

  const handleSave = (results, userControls) => {
    if (!project) {
      navigate('/projects');
      return;
    }

    // Convert wizard-added controls into proper context objects
    const userControlObjects = Object.entries(userControls || {}).flatMap(
      ([threatId, ctrls]) =>
        ctrls.map(c => ({
          id:            c.id,
          projectId:     project.id,
          name:          c.name,
          type:          c.type,
          effectiveness: c.effectiveness,
          status:        'IMPLEMENTED',
          linkedThreats: [threatId],
          createdAt:     new Date().toISOString(),
        }))
    );

    const finalResults = results ? {
      ...results,
      controls: [...(results.controls || []), ...userControlObjects],
    } : null;

    // Persist project to context immediately
    updateProject(project);
    setCurrentProject(project);

    // Navigate, carrying results in router state.
    // ProjectDetail will import them on mount — this bypasses any React 18
    // batching race between dispatch and navigation.
    navigate(`/projects/${project.id}`, {
      state: { pendingAIResults: finalResults },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Projects
        </button>

        {/* Stepper */}
        <StepIndicator stages={STAGES} current={stage} />

        {/* Content card — no padding on stage 2 so canvas is flush edge-to-edge */}
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${stage !== 2 ? 'p-8' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div key={stage}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}>
              {stage === 1 && <Stage1 form={form} setForm={setForm} />}
              {stage === 2 && <Stage2 diagramData={diagramData} onDiagramChange={setDiagramData} />}
              {stage === 3 && <Stage3 form={form} setForm={setForm} />}
              {stage === 4 && <Stage4 project={project} form={form} diagramData={diagramData} onSave={handleSave} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons — hidden on stage 4 (has its own save) */}
        {stage < 4 && (
          <div className="flex items-center justify-between mt-6">
            <button onClick={stage === 1 ? () => navigate('/projects') : () => setStage(s => s - 1)}
              className="btn-secondary">
              <ChevronLeft className="w-4 h-4 mr-1" />
              {stage === 1 ? 'Cancel' : 'Back'}
            </button>
            <button onClick={handleNext} disabled={!canNext()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {stage === 3 ? (
                <><Sparkles className="w-4 h-4 mr-2" />Run AI Analysis</>
              ) : (
                <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
