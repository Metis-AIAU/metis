/**
 * Australian Energy Sector Cyber Security Framework (AESCSF)
 * Security Profiles: SP1 (Basic), SP2 (Intermediate), SP3 (Advanced)
 * Based on NIST CSF with OT/ICS-specific adaptations
 */

export const AESCSF_PROFILES = {
  SP1: { id: 'SP1', label: 'Security Profile 1', description: 'Foundational – Basic hygiene for lower-risk assets', color: '#3b82f6', bgColor: '#eff6ff' },
  SP2: { id: 'SP2', label: 'Security Profile 2', description: 'Intermediate – Enhanced controls for medium-risk assets', color: '#f59e0b', bgColor: '#fffbeb' },
  SP3: { id: 'SP3', label: 'Security Profile 3', description: 'Advanced – Comprehensive controls for high-risk/critical assets', color: '#ef4444', bgColor: '#fef2f2' },
};

export const AESCSF_FUNCTIONS = [
  {
    id: 'ID',
    name: 'Identify',
    description: 'Develop the organisational understanding to manage cybersecurity risk to systems, assets, data, and capabilities.',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    categories: [
      {
        id: 'ID.AM',
        name: 'Asset Management',
        description: 'The data, personnel, devices, systems, and facilities that enable the organisation to achieve business purposes are identified and managed consistent with their relative importance.',
        controls: [
          { id: 'ID.AM-1', description: 'Physical devices and systems within the organisation are inventoried.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.AM-2', description: 'Software platforms and applications within the organisation are inventoried.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.AM-3', description: 'Organisational communication and data flows are mapped.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.AM-4', description: 'External information systems are catalogued.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.AM-5', description: 'Resources (e.g., hardware, devices, data, time, and software) are prioritised based on their classification, criticality, and business value.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.AM-6', description: 'Cybersecurity roles and responsibilities for the entire workforce and third-party stakeholders are established.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'ID.AM-7', description: 'OT/ICS assets including PLCs, RTUs, HMIs, historians, and network equipment are inventoried and classified.', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'ID.AM-8', description: 'Safety systems and safety instrumented systems (SIS) are identified and documented separately.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'ID.BE',
        name: 'Business Environment',
        description: 'The organisation\'s mission, objectives, stakeholders, and activities are understood and prioritised.',
        controls: [
          { id: 'ID.BE-1', description: 'The organisation\'s role in the supply chain is identified and communicated.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.BE-2', description: 'The organisation\'s place in critical infrastructure and its industry sector is identified and communicated.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.BE-3', description: 'Priorities for organisational mission, objectives, and activities are established and communicated.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'ID.BE-4', description: 'Dependencies and critical functions for delivery of critical services are established.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.BE-5', description: 'Resilience requirements to support delivery of critical services are established for all operating states.', sp1: false, sp2: false, sp3: true, priority: 'high' },
        ],
      },
      {
        id: 'ID.GV',
        name: 'Governance',
        description: 'The policies, procedures, and processes to manage and monitor the organisation\'s regulatory, legal, risk, environmental, and operational requirements are understood and inform the management of cybersecurity risk.',
        controls: [
          { id: 'ID.GV-1', description: 'Organisational cybersecurity policy is established and communicated.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.GV-2', description: 'Cybersecurity roles and responsibilities are coordinated and aligned with internal roles and external partners.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.GV-3', description: 'Legal and regulatory requirements regarding cybersecurity, including privacy and civil liberties obligations, are understood and managed.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.GV-4', description: 'Governance and risk management processes address cybersecurity risks.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.GV-5', description: 'OT/ICS-specific security policies and procedures are documented and reviewed annually.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
      {
        id: 'ID.RA',
        name: 'Risk Assessment',
        description: 'The organisation understands the cybersecurity risk to organisational operations, assets, and individuals.',
        controls: [
          { id: 'ID.RA-1', description: 'Asset vulnerabilities are identified and documented.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.RA-2', description: 'Cyber threat intelligence is received from information sharing forums and sources.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RA-3', description: 'Threats, both internal and external, are identified and documented.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'ID.RA-4', description: 'Potential business impacts and likelihoods are identified.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RA-5', description: 'Threats, vulnerabilities, likelihoods, and impacts are used to determine risk.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RA-6', description: 'Risk responses are identified and prioritised.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RA-7', description: 'OT/ICS-specific risk assessments consider process safety, availability, and physical impacts.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'ID.RM',
        name: 'Risk Management Strategy',
        description: 'The organisation\'s priorities, constraints, risk tolerances, and assumptions are established and used to support operational risk decisions.',
        controls: [
          { id: 'ID.RM-1', description: 'Risk management processes are established, managed, and agreed to by organisational stakeholders.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RM-2', description: 'Organisational risk tolerance is determined and clearly expressed.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.RM-3', description: 'The organisation\'s determination of risk tolerance is informed by its role in critical infrastructure and sector specific risk analysis.', sp1: false, sp2: false, sp3: true, priority: 'high' },
        ],
      },
      {
        id: 'ID.SC',
        name: 'Supply Chain Risk Management',
        description: 'The organisation\'s priorities, constraints, risk tolerances, and assumptions are established to support risk decisions for managing supply chain risk.',
        controls: [
          { id: 'ID.SC-1', description: 'Cyber supply chain risk management processes are identified, established, assessed, managed, and agreed to by organisational stakeholders.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.SC-2', description: 'Suppliers and third party partners of information systems, components, and services are identified, prioritised, and assessed using a cyber supply chain risk assessment process.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'ID.SC-3', description: 'Contracts with suppliers and third-party partners are used to implement appropriate measures designed to meet the objectives of an organisation\'s cybersecurity program and Cyber Supply Chain Risk Management Plan.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'ID.SC-4', description: 'Suppliers and third-party partners are routinely assessed using audits, test results, or other forms of evaluations to confirm they are meeting their contractual obligations.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'ID.SC-5', description: 'Response and recovery planning and testing are conducted with suppliers and third-party providers.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'PR',
    name: 'Protect',
    description: 'Develop and implement the appropriate safeguards to ensure delivery of critical infrastructure services.',
    color: '#10b981',
    bgColor: '#f0fdf4',
    categories: [
      {
        id: 'PR.AC',
        name: 'Identity Management, Authentication and Access Control',
        description: 'Access to physical and logical assets and associated facilities is limited to authorised users, processes, and devices, and is managed consistent with the assessed risk of unauthorised access.',
        controls: [
          { id: 'PR.AC-1', description: 'Identities and credentials are issued, managed, verified, revoked, and audited for authorised devices, users, and processes.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.AC-2', description: 'Physical access to assets is managed and protected.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.AC-3', description: 'Remote access is managed.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.AC-4', description: 'Access permissions and authorisations are managed, incorporating the principles of least privilege and separation of duties.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AC-5', description: 'Network integrity is protected (e.g., network segregation, network segmentation).', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'PR.AC-6', description: 'Identities are proofed and bound to credentials and asserted in interactions.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'PR.AC-7', description: 'Users, devices, and other assets are authenticated (e.g., single-factor, multi-factor) commensurate with the risk of the transaction.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AC-8', description: 'OT/ICS systems maintain separate user accounts from corporate IT systems with role-based access control.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'PR.AC-9', description: 'Vendor/remote access to OT systems is controlled through jump servers or secure remote access solutions with MFA.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'PR.AT',
        name: 'Awareness and Training',
        description: 'The organisation\'s personnel and partners are provided cybersecurity awareness education and are trained to perform their cybersecurity-related duties and responsibilities consistent with related policies, procedures, and agreements.',
        controls: [
          { id: 'PR.AT-1', description: 'All users are informed and trained.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AT-2', description: 'Privileged users understand their roles and responsibilities.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AT-3', description: 'Third-party stakeholders (e.g., suppliers, customers, partners) understand their roles and responsibilities.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'PR.AT-4', description: 'Senior executives understand their roles and responsibilities.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AT-5', description: 'Physical and cybersecurity personnel understand their roles and responsibilities.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.AT-6', description: 'OT/ICS operations staff receive specific training on cybersecurity threats to industrial control systems.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
      {
        id: 'PR.DS',
        name: 'Data Security',
        description: 'Information and records (data) are managed consistent with the organisation\'s risk strategy to protect the confidentiality, integrity, and availability of information.',
        controls: [
          { id: 'PR.DS-1', description: 'Data-at-rest is protected.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.DS-2', description: 'Data-in-transit is protected.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.DS-3', description: 'Assets are formally managed throughout removal, transfers, and disposition.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'PR.DS-4', description: 'Adequate capacity to ensure availability is maintained.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.DS-5', description: 'Protections against data leaks are implemented.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'PR.DS-6', description: 'Integrity checking mechanisms are used to verify software, firmware, and information integrity.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.DS-7', description: 'The development and testing environment(s) are separate from the production environment.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.DS-8', description: 'Integrity checking mechanisms are used to verify hardware integrity.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
        ],
      },
      {
        id: 'PR.IP',
        name: 'Information Protection Processes and Procedures',
        description: 'Security policies (that address purpose, scope, roles, responsibilities, management commitment, and coordination among organisational entities), processes, and procedures are maintained and used to manage protection of information systems and assets.',
        controls: [
          { id: 'PR.IP-1', description: 'A baseline configuration of information technology/industrial control systems is created and maintained incorporating security principles (e.g. concept of least functionality).', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'PR.IP-2', description: 'A System Development Life Cycle to manage systems is implemented.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'PR.IP-3', description: 'Configuration change control processes are in place.', sp1: true, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.IP-4', description: 'Backups of information are conducted, maintained, and tested.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.IP-5', description: 'Policy and regulations regarding the physical operating environment for organisational assets are met.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.IP-6', description: 'Data is destroyed according to policy.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'PR.IP-7', description: 'Protection processes are improved.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'PR.IP-8', description: 'Effectiveness of protection technologies is shared.', sp1: false, sp2: false, sp3: true, priority: 'low' },
          { id: 'PR.IP-9', description: 'Response plans (Incident Response and Business Continuity) and recovery plans (Incident Recovery and Disaster Recovery) are in place and managed.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'PR.IP-10', description: 'Response and recovery plans are tested.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.IP-11', description: 'Cybersecurity is included in human resources practices (e.g., deprovisioning, personnel screening).', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'PR.IP-12', description: 'A vulnerability management plan is developed and implemented.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
      {
        id: 'PR.MA',
        name: 'Maintenance',
        description: 'Maintenance and repairs of industrial control and information system components are performed consistent with policies and procedures.',
        controls: [
          { id: 'PR.MA-1', description: 'Maintenance and repair of organisational assets are performed and logged, with approved and controlled tools.', sp1: true, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.MA-2', description: 'Remote maintenance of organisational assets is approved, logged, and performed in a manner that prevents unauthorised access.', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'PR.PT',
        name: 'Protective Technology',
        description: 'Technical security solutions are managed to ensure the security and resilience of systems and assets, consistent with related policies, procedures, and agreements.',
        controls: [
          { id: 'PR.PT-1', description: 'Audit/log records are determined, documented, implemented, and reviewed in accordance with policy.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'PR.PT-2', description: 'Removable media is protected and its use restricted according to policy.', sp1: true, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.PT-3', description: 'The principle of least functionality is incorporated by configuring systems to provide only essential capabilities.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.PT-4', description: 'Communications and control networks are protected.', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'PR.PT-5', description: 'Mechanisms (e.g., failsafe, load balancing, hot swap) are implemented to achieve resilience requirements in normal and adverse situations.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'PR.PT-6', description: 'OT/ICS network segmentation is implemented with demilitarized zones (DMZ) between IT and OT networks.', sp1: true, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
          { id: 'PR.PT-7', description: 'Industrial firewalls and unidirectional security gateways (data diodes) are used where appropriate.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
    ],
  },
  {
    id: 'DE',
    name: 'Detect',
    description: 'Develop and implement the appropriate activities to identify the occurrence of a cybersecurity event.',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    categories: [
      {
        id: 'DE.AE',
        name: 'Anomalies and Events',
        description: 'Anomalous activity is detected and the potential impact of events is understood.',
        controls: [
          { id: 'DE.AE-1', description: 'A baseline of network operations and expected data flows for users and systems is established and managed.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'DE.AE-2', description: 'Detected events are analysed to understand attack targets and methods.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'DE.AE-3', description: 'Event data are collected and correlated from multiple sources and sensors.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'DE.AE-4', description: 'Impact of events is determined.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'DE.AE-5', description: 'Incident alert thresholds are established.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.AE-6', description: 'OT/ICS-specific anomaly detection monitors for unexpected process variable changes, unusual commands, or deviations from operational baselines.', sp1: false, sp2: false, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
      {
        id: 'DE.CM',
        name: 'Security Continuous Monitoring',
        description: 'The information system and assets are monitored to identify cybersecurity events and verify the effectiveness of protective measures.',
        controls: [
          { id: 'DE.CM-1', description: 'The network is monitored to detect potential cybersecurity events.', sp1: true, sp2: true, sp3: true, priority: 'high' },
          { id: 'DE.CM-2', description: 'The physical environment is monitored to detect potential cybersecurity events.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.CM-3', description: 'Personnel activity is monitored to detect potential cybersecurity events.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'DE.CM-4', description: 'Malicious code is detected.', sp1: true, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'DE.CM-5', description: 'Unauthorised mobile code is detected.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.CM-6', description: 'External service provider activity is monitored to detect potential cybersecurity events.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'DE.CM-7', description: 'Monitoring for unauthorised personnel, connections, devices, and software is performed.', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
          { id: 'DE.CM-8', description: 'Vulnerability scans are performed (using passive scanning methods to avoid disruption to OT systems).', sp1: false, sp2: true, sp3: true, priority: 'high', otSpecific: true },
        ],
      },
      {
        id: 'DE.DP',
        name: 'Detection Processes',
        description: 'Detection processes and procedures are maintained and tested to ensure awareness of anomalous events.',
        controls: [
          { id: 'DE.DP-1', description: 'Roles and responsibilities for detection are well defined to ensure accountability.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.DP-2', description: 'Detection activities comply with all applicable requirements.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.DP-3', description: 'Detection processes are tested.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'DE.DP-4', description: 'Event detection information is communicated.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'DE.DP-5', description: 'Detection processes are continuously improved.', sp1: false, sp2: false, sp3: true, priority: 'low' },
        ],
      },
    ],
  },
  {
    id: 'RS',
    name: 'Respond',
    description: 'Develop and implement the appropriate activities to take action regarding a detected cybersecurity incident.',
    color: '#ef4444',
    bgColor: '#fef2f2',
    categories: [
      {
        id: 'RS.RP',
        name: 'Response Planning',
        description: 'Response processes and procedures are executed and maintained, to ensure response to detected cybersecurity incidents.',
        controls: [
          { id: 'RS.RP-1', description: 'Response plan is executed during or after an incident.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.RP-2', description: 'OT/ICS-specific incident response procedures account for operational continuity and safety system impacts.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'RS.CO',
        name: 'Communications',
        description: 'Response activities are coordinated with internal and external stakeholders (e.g. external support from law enforcement agencies).',
        controls: [
          { id: 'RS.CO-1', description: 'Personnel know their roles and order of operations when a response is needed.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.CO-2', description: 'Incidents are reported consistent with established criteria.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.CO-3', description: 'Information is shared consistent with response plans.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'RS.CO-4', description: 'Coordination with stakeholders occurs consistent with response plans.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'RS.CO-5', description: 'Voluntary information sharing occurs with external stakeholders to achieve broader cybersecurity situational awareness.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
        ],
      },
      {
        id: 'RS.AN',
        name: 'Analysis',
        description: 'Analysis is conducted to ensure effective response and support recovery activities.',
        controls: [
          { id: 'RS.AN-1', description: 'Notifications from detection systems are investigated.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.AN-2', description: 'The impact of the incident is understood.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'RS.AN-3', description: 'Forensics are performed.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
          { id: 'RS.AN-4', description: 'Incidents are categorised consistent with response plans.', sp1: false, sp2: true, sp3: true, priority: 'high' },
          { id: 'RS.AN-5', description: 'Processes are established to receive, analyse and respond to vulnerabilities disclosed to the organisation from internal and external sources.', sp1: false, sp2: false, sp3: true, priority: 'medium' },
        ],
      },
      {
        id: 'RS.MI',
        name: 'Mitigation',
        description: 'Activities are performed to prevent expansion of an event, mitigate its effects, and resolve the incident.',
        controls: [
          { id: 'RS.MI-1', description: 'Incidents are contained.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.MI-2', description: 'Incidents are mitigated.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RS.MI-3', description: 'Newly identified vulnerabilities are mitigated or documented as accepted risks.', sp1: false, sp2: true, sp3: true, priority: 'high' },
        ],
      },
      {
        id: 'RS.IM',
        name: 'Improvements',
        description: 'Organisational response activities are improved by incorporating lessons learned from current and previous detection/response activities.',
        controls: [
          { id: 'RS.IM-1', description: 'Response plans incorporate lessons learned.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'RS.IM-2', description: 'Response strategies are updated.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'RC',
    name: 'Recover',
    description: 'Develop and implement the appropriate activities to maintain plans for resilience and to restore any capabilities or services that were impaired due to a cybersecurity incident.',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    categories: [
      {
        id: 'RC.RP',
        name: 'Recovery Planning',
        description: 'Recovery processes and procedures are executed and maintained to ensure restoration of systems or assets affected by cybersecurity incidents.',
        controls: [
          { id: 'RC.RP-1', description: 'Recovery plan is executed during or after a cybersecurity incident.', sp1: true, sp2: true, sp3: true, priority: 'critical' },
          { id: 'RC.RP-2', description: 'OT/ICS recovery procedures include safe state restoration and process integrity validation before resuming operations.', sp1: false, sp2: true, sp3: true, priority: 'critical', otSpecific: true },
        ],
      },
      {
        id: 'RC.IM',
        name: 'Improvements',
        description: 'Recovery planning and processes are improved by incorporating lessons learned into future activities.',
        controls: [
          { id: 'RC.IM-1', description: 'Recovery plans incorporate lessons learned.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
          { id: 'RC.IM-2', description: 'Recovery strategies are updated.', sp1: false, sp2: true, sp3: true, priority: 'medium' },
        ],
      },
      {
        id: 'RC.CO',
        name: 'Communications',
        description: 'Restoration activities are coordinated with internal and external parties (e.g. coordinating centres, Internet Service Providers, owners of attacking systems, victims, other CSIRTs, and vendors).',
        controls: [
          { id: 'RC.CO-1', description: 'Public relations are managed.', sp1: false, sp2: false, sp3: true, priority: 'low' },
          { id: 'RC.CO-2', description: 'Reputation is repaired after an incident.', sp1: false, sp2: false, sp3: true, priority: 'low' },
          { id: 'RC.CO-3', description: 'Recovery activities are communicated to internal and external stakeholders as well as executive and management teams.', sp1: false, sp2: true, sp3: true, priority: 'high' },
        ],
      },
    ],
  },
];

export const COMPLIANCE_STATUS = {
  NOT_ASSESSED: { id: 'NOT_ASSESSED', label: 'Not Assessed', color: '#9ca3af', bgColor: '#f9fafb', icon: '○' },
  COMPLIANT: { id: 'COMPLIANT', label: 'Compliant', color: '#10b981', bgColor: '#f0fdf4', icon: '✓' },
  PARTIALLY_COMPLIANT: { id: 'PARTIALLY_COMPLIANT', label: 'Partially Compliant', color: '#f59e0b', bgColor: '#fffbeb', icon: '◑' },
  NON_COMPLIANT: { id: 'NON_COMPLIANT', label: 'Non-Compliant', color: '#ef4444', bgColor: '#fef2f2', icon: '✗' },
  NOT_APPLICABLE: { id: 'NOT_APPLICABLE', label: 'Not Applicable', color: '#6b7280', bgColor: '#f3f4f6', icon: 'N/A' },
};
