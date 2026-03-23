/**
 * ASD Essential Eight Maturity Model
 * Australian Signals Directorate – Essential Eight Strategies to Mitigate Cyber Security Incidents
 * Based on the ASD Essential Eight Maturity Model (November 2023)
 *
 * Maturity Levels:
 *  ML0 – Weaknesses in ML1 implementation (i.e., ML1 controls not yet met)
 *  ML1 – Partly aligned with the intent of the strategy
 *  ML2 – Mostly aligned with the intent of the strategy
 *  ML3 – Fully aligned with the intent of the strategy
 *
 * The framework targets two primary threat profiles:
 *  - Adversaries who use commodity tradecraft (ML1/ML2 target)
 *  - More sophisticated adversaries who invest resources (ML3 target)
 */

export const E8_MATURITY_LEVELS = {
  ML0: { id: 'ML0', label: 'Maturity Level 0', shortLabel: 'ML0', description: 'Not achieving ML1 – significant weaknesses in the strategy\'s implementation.', color: '#dc2626', bgColor: '#fef2f2', textColor: '#991b1b' },
  ML1: { id: 'ML1', label: 'Maturity Level 1', shortLabel: 'ML1', description: 'Partly aligned. Mitigates adversaries using common commodity tradecraft.', color: '#f97316', bgColor: '#fff7ed', textColor: '#9a3412' },
  ML2: { id: 'ML2', label: 'Maturity Level 2', shortLabel: 'ML2', description: 'Mostly aligned. Mitigates adversaries using more targeted tradecraft.', color: '#f59e0b', bgColor: '#fffbeb', textColor: '#92400e' },
  ML3: { id: 'ML3', label: 'Maturity Level 3', shortLabel: 'ML3', description: 'Fully aligned. Mitigates adversaries using advanced targeted tradecraft.', color: '#10b981', bgColor: '#f0fdf4', textColor: '#065f46' },
};

export const E8_STRATEGIES = [
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S1',
    number: 1,
    name: 'Application Control',
    shortName: 'App Control',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    icon: '🔒',
    objective: 'Prevent execution of unapproved/malicious programs including executables, software libraries, scripts, installers, compiled HTML, HTML applications, and control panel applets.',
    why: 'Malicious code execution is the starting point for most attacks. Application control prevents untrusted code from running, disrupting the initial access and execution phases of an attack chain.',
    controls: [
      // ML1
      { id: 'E8S1-ML1-1', maturity: 'ML1', description: 'Application control is implemented on workstations to restrict the execution of executables to an organisation-approved set.', guidance: 'Use tools such as Windows Defender Application Control (WDAC), AppLocker, or third-party equivalents.', testMethod: 'Attempt to run an unsigned/unapproved executable on a workstation and confirm it is blocked.' },
      { id: 'E8S1-ML1-2', maturity: 'ML1', description: 'Application control is implemented on internet-facing servers to restrict the execution of executables to an organisation-approved set.', guidance: 'Internet-facing servers are high-risk targets; application control limits blast radius if a server is compromised.', testMethod: 'Attempt to drop and execute an unapproved binary on an internet-facing server.' },
      { id: 'E8S1-ML1-3', maturity: 'ML1', description: 'Allowed and blocked application control events are logged.', guidance: 'Event logs must be retained and protected for later analysis and incident response.', testMethod: 'Check event logs for application control events after a blocked execution attempt.' },
      // ML2
      { id: 'E8S1-ML2-1', maturity: 'ML2', description: 'Application control is implemented on all servers to restrict the execution of executables to an organisation-approved set.', guidance: 'Extends ML1 coverage from internet-facing servers to all servers.', testMethod: 'Confirm application control policy is deployed to non-internet-facing servers.' },
      { id: 'E8S1-ML2-2', maturity: 'ML2', description: 'Application control restricts the execution of software libraries (e.g. DLLs) to an organisation-approved set.', guidance: 'DLL hijacking is a common technique; restricting DLLs prevents these attacks.', testMethod: 'Attempt to load an unapproved DLL via a controlled test tool.' },
      { id: 'E8S1-ML2-3', maturity: 'ML2', description: 'Application control restricts the execution of scripts (e.g. PowerShell, JavaScript) to an organisation-approved set.', guidance: 'Script-based attacks are prolific; restricting script execution is a high-value control.', testMethod: 'Execute an unapproved PowerShell or JavaScript payload and confirm it is blocked.' },
      { id: 'E8S1-ML2-4', maturity: 'ML2', description: 'Application control restricts the execution of installers to an organisation-approved set.', guidance: 'Attackers commonly use installers to deploy malware.', testMethod: 'Attempt to run an unapproved installer package.' },
      { id: 'E8S1-ML2-5', maturity: 'ML2', description: 'Allowed and blocked application control events are centralised and protected from unauthorised modification and deletion, and monitored for signs of compromise.', guidance: 'Central SIEM collection prevents attackers from clearing local logs.', testMethod: 'Verify logs are forwarded to a SIEM and confirm retention/tamper protection.' },
      // ML3
      { id: 'E8S1-ML3-1', maturity: 'ML3', description: 'Application control uses cryptographic hash rules, publisher certificate rules, or other rules that are difficult to circumvent.', guidance: 'Path-based rules can be bypassed by moving files. Hash or certificate-based rules are more robust.', testMethod: 'Attempt to bypass application control using path manipulation techniques.' },
      { id: 'E8S1-ML3-2', maturity: 'ML3', description: 'Application control is implemented on workstations and servers and covers all user-accessible locations including temporary folders and user profile locations.', guidance: 'Attackers commonly write malware to writable user-accessible locations (e.g., %TEMP%).', testMethod: 'Attempt execution from %TEMP%, user Desktop, and Downloads folders.' },
      { id: 'E8S1-ML3-3', maturity: 'ML3', description: 'Microsoft\'s recommended driver blocklist is implemented to prevent known vulnerable driver abuse.', guidance: 'Vulnerable drivers can be used for kernel-level exploitation (BYOVD attacks).', testMethod: 'Verify the driver blocklist policy is deployed and up to date.' },
      { id: 'E8S1-ML3-4', maturity: 'ML3', description: 'Application control events are reviewed at least monthly.', guidance: 'Regular review identifies anomalous execution patterns and policy bypass attempts.', testMethod: 'Review application control event log review procedures and evidence of recent reviews.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S2',
    number: 2,
    name: 'Patch Applications',
    shortName: 'Patch Apps',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: '🩹',
    objective: 'Patch/mitigate computers with extreme risk security vulnerabilities in applications within 48 hours, high risk within 2 weeks, and other risk within one month. Remove unsupported applications.',
    why: 'Unpatched application vulnerabilities are the most common initial access vector. Timely patching closes the window of opportunity for attackers.',
    controls: [
      // ML1
      { id: 'E8S2-ML1-1', maturity: 'ML1', description: 'A vulnerability scanner is used at least fortnightly to identify missing patches or updates for applications.', guidance: 'Regular scanning identifies vulnerability exposure before attackers can exploit it.', testMethod: 'Review scan schedules and recent scan reports.' },
      { id: 'E8S2-ML1-2', maturity: 'ML1', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in online services are applied within two weeks of release, or within 48 hours if an exploit exists.', guidance: 'Online services are the highest-risk exposure; faster patching is required.', testMethod: 'Compare patch release dates against deployment dates for recent critical patches.' },
      { id: 'E8S2-ML1-3', maturity: 'ML1', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in office productivity suites, web browsers and their extensions, email clients, PDF software, and security products are applied within one month.', guidance: 'These user-facing applications are common attack vectors via phishing and drive-by downloads.', testMethod: 'Verify patch status for Office, browsers, Acrobat, and AV products.' },
      { id: 'E8S2-ML1-4', maturity: 'ML1', description: 'Applications that are no longer supported by vendors are removed.', guidance: 'End-of-life applications receive no security updates, creating permanent unpatched vulnerabilities.', testMethod: 'Audit installed applications for EOL versions.' },
      // ML2
      { id: 'E8S2-ML2-1', maturity: 'ML2', description: 'A vulnerability scanner with an up-to-date vulnerability database is used at least fortnightly to identify missing patches or updates for applications on internet-facing systems.', guidance: 'Internet-facing systems face direct attack and require the most diligent scanning.', testMethod: 'Confirm scanner database is current and internet-facing systems are in scope.' },
      { id: 'E8S2-ML2-2', maturity: 'ML2', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in internet-facing services are applied within two weeks of release, or within 48 hours if an exploit exists.', guidance: 'Stricter timeframes for internet-exposed services.', testMethod: 'Validate patching SLA compliance for internet-facing services.' },
      { id: 'E8S2-ML2-3', maturity: 'ML2', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in applications on workstations are applied within one month.', guidance: 'Workstation applications are targeted via user interaction; prompt patching reduces exposure.', testMethod: 'Check patch status across workstation fleet for common applications.' },
      // ML3
      { id: 'E8S2-ML3-1', maturity: 'ML3', description: 'A vulnerability scanner with an up-to-date vulnerability database is used daily to identify missing patches on all systems.', guidance: 'Daily scanning at ML3 ensures near-real-time visibility of vulnerability exposure.', testMethod: 'Confirm daily scan schedule and verify scan coverage across all systems.' },
      { id: 'E8S2-ML3-2', maturity: 'ML3', description: 'Patches for extreme risk vulnerabilities in all applications are applied within 48 hours of release.', guidance: 'Extreme risk vulnerabilities (CVSS 9.0+) present immediate exploitation risk.', testMethod: 'Review recent extreme risk CVEs and verify 48-hour patching SLA compliance.' },
      { id: 'E8S2-ML3-3', maturity: 'ML3', description: 'The latest releases (or previous release) of applications are used.', guidance: 'Using current releases ensures access to security features and vendor support.', testMethod: 'Audit application version currency across the fleet.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S3',
    number: 3,
    name: 'Configure Microsoft Office Macro Settings',
    shortName: 'Office Macros',
    color: '#d97706',
    bgColor: '#fffbeb',
    icon: '📄',
    objective: 'Block macros in Microsoft Office files from the internet. Only allow vetted macros either in trusted locations with limited write access or that are digitally signed with a trusted certificate.',
    why: 'Malicious macros embedded in Office documents are a primary delivery mechanism for malware. Controlling macros disrupts this initial access and execution vector.',
    controls: [
      // ML1
      { id: 'E8S3-ML1-1', maturity: 'ML1', description: 'Microsoft Office macros are disabled for users that do not have a demonstrated business requirement.', guidance: 'Most users do not need to run macros; disabling by default reduces attack surface significantly.', testMethod: 'Confirm macro settings for standard user accounts via Group Policy.' },
      { id: 'E8S3-ML1-2', maturity: 'ML1', description: 'Microsoft Office macros in files originating from the internet are blocked.', guidance: 'Internet-originated documents are the primary delivery mechanism for macro malware.', testMethod: 'Open an Office file with macros downloaded from the internet and confirm macros are blocked.' },
      { id: 'E8S3-ML1-3', maturity: 'ML1', description: 'Microsoft Office macro antivirus scanning is enabled.', guidance: 'AV scanning of macros provides an additional detection layer.', testMethod: 'Confirm macro scanning is enabled in Office Trust Center or equivalent policy.' },
      { id: 'E8S3-ML1-4', maturity: 'ML1', description: 'Microsoft Office macro security settings cannot be changed by users.', guidance: 'User-modifiable settings can be changed by malware or social engineering.', testMethod: 'Attempt to change macro security settings as a standard user and confirm this is blocked.' },
      // ML2
      { id: 'E8S3-ML2-1', maturity: 'ML2', description: 'Only Microsoft Office macros running from within Trusted Locations or that are digitally signed by trusted publishers are allowed to execute.', guidance: 'This allows legitimate business macros while blocking unsigned/untrusted ones.', testMethod: 'Attempt to run an unsigned macro outside of a trusted location and confirm it is blocked.' },
      { id: 'E8S3-ML2-2', maturity: 'ML2', description: 'Trusted Locations are limited to business-critical locations only, with network paths not used as Trusted Locations.', guidance: 'Network paths as trusted locations can be exploited via UNC path injection.', testMethod: 'Audit Trusted Locations list for the presence of network paths.' },
      { id: 'E8S3-ML2-3', maturity: 'ML2', description: 'Trusted Locations are limited to locations to which standard users cannot write to.', guidance: 'Writable trusted locations allow any user to place malicious files in a trusted path.', testMethod: 'Check write permissions on all configured Trusted Locations.' },
      // ML3
      { id: 'E8S3-ML3-1', maturity: 'ML3', description: 'Only Microsoft Office macros that are digitally signed by trusted publishers are allowed to execute; macros signed by untrusted publishers and all unsigned macros are blocked.', guidance: 'Certificate-based signing provides strong assurance of macro origin and integrity.', testMethod: 'Attempt to run a macro signed by a non-trusted certificate and confirm it is blocked.' },
      { id: 'E8S3-ML3-2', maturity: 'ML3', description: 'The list of trusted publishers is limited to genuine business requirements.', guidance: 'A large trusted publisher list increases attack surface via compromised certificates.', testMethod: 'Audit the trusted publishers list for unnecessary entries.' },
      { id: 'E8S3-ML3-3', maturity: 'ML3', description: 'Allowed and blocked Microsoft Office macro events are centralised and protected from modification and deletion, and monitored for signs of compromise.', guidance: 'Centralised logging enables detection of macro policy bypass attempts.', testMethod: 'Verify macro block/allow events are forwarded to SIEM.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S4',
    number: 4,
    name: 'User Application Hardening',
    shortName: 'App Hardening',
    color: '#0891b2',
    bgColor: '#ecfeff',
    icon: '🛡️',
    objective: 'Configure web browsers to block Flash (obsolete), ads, and Java on the internet. Disable unneeded features in Microsoft Office, web browsers, and PDF viewers.',
    why: 'Internet-exposed applications (browsers, PDF viewers, Office) are primary delivery points for malware. Reducing functionality reduces attack surface.',
    controls: [
      // ML1
      { id: 'E8S4-ML1-1', maturity: 'ML1', description: 'Web browsers do not process Java from the internet.', guidance: 'Java browser plugins have a long history of critical vulnerabilities and should be disabled.', testMethod: 'Navigate to a Java-enabled site and confirm Java content does not execute.' },
      { id: 'E8S4-ML1-2', maturity: 'ML1', description: 'Web browsers do not process web advertisements from the internet.', guidance: 'Malvertising is a significant initial access vector; ad blocking disrupts this.', testMethod: 'Navigate to a known ad-serving page and confirm advertisements are blocked.' },
      { id: 'E8S4-ML1-3', maturity: 'ML1', description: 'Internet Explorer 11 is disabled or removed from workstations.', guidance: 'IE11 reached end-of-support and contains unpatched vulnerabilities.', testMethod: 'Confirm IE11 is not accessible on workstations.' },
      { id: 'E8S4-ML1-4', maturity: 'ML1', description: 'Web browser security settings cannot be changed by users.', guidance: 'Preventing users from changing security settings stops social-engineering bypass attempts.', testMethod: 'Attempt to disable ad/Java blocking as a standard user.' },
      // ML2
      { id: 'E8S4-ML2-1', maturity: 'ML2', description: 'Web browsers are hardened using ASD or vendor-provided guidance and hardening baselines are updated at least annually.', guidance: 'Browser hardening baselines address common misconfigurations and attack vectors.', testMethod: 'Compare browser configuration against ASD or CIS hardening benchmarks.' },
      { id: 'E8S4-ML2-2', maturity: 'ML2', description: 'Microsoft Office is hardened using ASD or vendor-provided guidance and hardening baselines are updated at least annually.', guidance: 'Office hardening baselines address OLE, object linking, and DDE attack vectors.', testMethod: 'Compare Office configuration against ASD or DISA STIG for Office.' },
      { id: 'E8S4-ML2-3', maturity: 'ML2', description: 'PDF software is hardened using ASD or vendor-provided guidance and hardening baselines are updated at least annually.', guidance: 'PDF readers have a significant attack surface via embedded JavaScript and streams.', testMethod: 'Review PDF reader configuration against hardening guidance.' },
      { id: 'E8S4-ML2-4', maturity: 'ML2', description: '.NET Framework 3.5 (or earlier) is disabled or removed from workstations.', guidance: 'Legacy .NET versions contain unpatched vulnerabilities and are commonly abused by attackers.', testMethod: 'Confirm .NET 3.5 is not present or not enabled on workstations.' },
      // ML3
      { id: 'E8S4-ML3-1', maturity: 'ML3', description: 'Web browser extensions are limited to a set of approved extensions.', guidance: 'Malicious extensions can harvest credentials, intercept sessions, and exfiltrate data.', testMethod: 'Attempt to install an unapproved browser extension and confirm it is blocked.' },
      { id: 'E8S4-ML3-2', maturity: 'ML3', description: 'PowerShell is configured to use Constrained Language Mode on workstations.', guidance: 'Constrained Language Mode restricts PowerShell capabilities, making it much harder to use offensively.', testMethod: 'Run a PowerShell command that requires Full Language Mode and confirm it is blocked.' },
      { id: 'E8S4-ML3-3', maturity: 'ML3', description: 'PowerShell module, script block, and transcription logging is enabled on workstations.', guidance: 'PowerShell logging provides invaluable forensic data for incident investigations.', testMethod: 'Run a PowerShell command and confirm it is captured in ScriptBlock/Transcription logs.' },
      { id: 'E8S4-ML3-4', maturity: 'ML3', description: 'Command line process creation events are captured in Windows event logs.', guidance: 'Process creation logging enables detection of suspicious process chains.', testMethod: 'Confirm Sysmon or Audit Process Creation policy is enabled and events are logged.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S5',
    number: 5,
    name: 'Restrict Administrative Privileges',
    shortName: 'Admin Privileges',
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: '👑',
    objective: 'Restrict administrative privileges to operating systems and applications based on user duties. Regularly revalidate the need for privileges. Do not use privileged accounts for reading email or browsing the web.',
    why: 'Compromised privileged accounts allow attackers to move laterally, deploy ransomware, establish persistence, and exfiltrate data with minimal resistance.',
    controls: [
      // ML1
      { id: 'E8S5-ML1-1', maturity: 'ML1', description: 'Requests for privileged access to systems and applications are validated when first requested.', guidance: 'Access requests must be reviewed and approved based on demonstrated business need.', testMethod: 'Review the access request process for evidence of validation steps.' },
      { id: 'E8S5-ML1-2', maturity: 'ML1', description: 'Users are not permitted to install unapproved software on workstations.', guidance: 'Restricting software installation prevents users from introducing malware or unapproved tools.', testMethod: 'Attempt to install unapproved software as a standard user.' },
      { id: 'E8S5-ML1-3', maturity: 'ML1', description: 'Privileged access to systems and applications is limited to that required for users to undertake their authorised duties.', guidance: 'Least privilege minimises the damage from compromised privileged accounts.', testMethod: 'Review privileged user group memberships and compare to job roles.' },
      { id: 'E8S5-ML1-4', maturity: 'ML1', description: 'Privileged accounts are not used for reading email and web browsing.', guidance: 'Email and web browsing are primary attack vectors; using privileged accounts for these activities is extremely risky.', testMethod: 'Confirm privileged accounts cannot access email clients or standard internet browsing.' },
      // ML2
      { id: 'E8S5-ML2-1', maturity: 'ML2', description: 'Privileged access to systems and applications is automatically disabled after 45 days of inactivity.', guidance: 'Dormant privileged accounts are a common attack target; automatic disablement reduces risk.', testMethod: 'Identify accounts inactive for 45+ days and confirm they are disabled.' },
      { id: 'E8S5-ML2-2', maturity: 'ML2', description: 'Privileged users use separate privileged and unprivileged operating environments.', guidance: 'Using the same workstation for privileged and unprivileged tasks increases the risk of credential theft.', testMethod: 'Confirm privileged users have dedicated PAW or jump server for admin tasks.' },
      { id: 'E8S5-ML2-3', maturity: 'ML2', description: 'Unprivileged accounts cannot logon to privileged operating environments and vice versa.', guidance: 'Logical separation between privileged and unprivileged environments limits lateral movement.', testMethod: 'Attempt to log in with a standard user account to a PAW or privileged server.' },
      { id: 'E8S5-ML2-4', maturity: 'ML2', description: 'Privileged access events are centralised and protected from modification and deletion, and monitored for signs of compromise.', guidance: 'Centralised privileged access logs enable anomaly detection and incident response.', testMethod: 'Verify privileged access events are forwarded to SIEM and access-protected.' },
      // ML3
      { id: 'E8S5-ML3-1', maturity: 'ML3', description: 'Requests for privileged access to systems and applications are revalidated at least annually.', guidance: 'Annual revalidation ensures that stale or unnecessary privileges are removed.', testMethod: 'Review evidence of annual revalidation cycles for privileged accounts.' },
      { id: 'E8S5-ML3-2', maturity: 'ML3', description: 'Just-in-time (JIT) administration is used for privileged access to systems and applications.', guidance: 'JIT ensures privileges are only granted for the duration of a task, minimising standing privilege.', testMethod: 'Confirm a JIT PAM solution is in use and that privileged sessions are time-bound.' },
      { id: 'E8S5-ML3-3', maturity: 'ML3', description: 'Windows local administrator accounts are disabled or their credentials are unique and unpredictable on each workstation.', guidance: 'Shared local admin passwords enable lateral movement via pass-the-hash. LAPS or equivalent should be used.', testMethod: 'Confirm LAPS or equivalent is deployed and local admin passwords are unique per workstation.' },
      { id: 'E8S5-ML3-4', maturity: 'ML3', description: 'Privileged operating environments are not virtualised within unprivileged operating environments.', guidance: 'Virtualising privileged environments within unprivileged hosts exposes them to VM escape and hypervisor attacks.', testMethod: 'Confirm PAW/privileged environments are not running as VMs on standard workstations.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S6',
    number: 6,
    name: 'Patch Operating Systems',
    shortName: 'Patch OS',
    color: '#059669',
    bgColor: '#f0fdf4',
    icon: '💻',
    objective: 'Patch/mitigate computers with extreme risk security vulnerabilities in operating systems within 48 hours, high risk within 2 weeks, other risk within one month. Remove unsupported operating systems.',
    why: 'OS vulnerabilities exploited via remote code execution or local privilege escalation allow attackers to gain initial access or escalate to SYSTEM/root.',
    controls: [
      // ML1
      { id: 'E8S6-ML1-1', maturity: 'ML1', description: 'A vulnerability scanner is used at least fortnightly to identify missing patches or updates for operating systems.', guidance: 'Regular scanning provides visibility of patch gaps before attackers can exploit them.', testMethod: 'Review OS patch scan schedules and recent scan reports.' },
      { id: 'E8S6-ML1-2', maturity: 'ML1', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in operating systems of internet-facing servers and internet-facing network devices are applied within two weeks of release, or within 48 hours if an exploit exists.', guidance: 'Internet-facing OS vulnerabilities are rapidly exploited; stricter patching timelines are required.', testMethod: 'Compare OS patch release dates against deployment dates for internet-facing systems.' },
      { id: 'E8S6-ML1-3', maturity: 'ML1', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in operating systems of workstations are applied within one month.', guidance: 'Workstation patching within a month reduces the window of exposure for local exploits.', testMethod: 'Check OS patch currency across the workstation fleet.' },
      { id: 'E8S6-ML1-4', maturity: 'ML1', description: 'Operating systems that are no longer supported by vendors are removed or, where removal is not possible, are isolated and hardened with compensating controls.', guidance: 'End-of-life OS versions receive no security updates. Isolation and hardening are required if removal is impossible.', testMethod: 'Audit OS versions across the fleet for EOL versions.' },
      // ML2
      { id: 'E8S6-ML2-1', maturity: 'ML2', description: 'A vulnerability scanner with an up-to-date vulnerability database is used at least fortnightly to identify missing patches on internet-facing systems.', guidance: 'Current vulnerability definitions are essential for accurate patch gap identification.', testMethod: 'Confirm scanner definition currency and internet-facing system coverage.' },
      { id: 'E8S6-ML2-2', maturity: 'ML2', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in operating systems of all servers and network devices are applied within one month.', guidance: 'Extends ML1 patch coverage to all servers, not just internet-facing ones.', testMethod: 'Verify OS patch status for all servers, including internal/backend systems.' },
      { id: 'E8S6-ML2-3', maturity: 'ML2', description: 'Patches, updates, or vendor mitigations for security vulnerabilities in operating systems of workstations, non-internet-facing servers, and non-internet-facing network devices are applied within one month.', guidance: 'Comprehensive patching coverage across the entire estate.', testMethod: 'Check patch currency for workstations and non-internet-facing infrastructure.' },
      // ML3
      { id: 'E8S6-ML3-1', maturity: 'ML3', description: 'A vulnerability scanner with an up-to-date vulnerability database is used daily to identify missing patches on all systems.', guidance: 'Daily scanning at ML3 ensures near-real-time visibility of OS vulnerability exposure.', testMethod: 'Confirm daily scan schedule and verify all systems are included in scope.' },
      { id: 'E8S6-ML3-2', maturity: 'ML3', description: 'Patches for extreme risk OS vulnerabilities are applied within 48 hours of release.', guidance: 'Extreme risk OS vulnerabilities (CVSS 9.0+) are typically weaponised rapidly.', testMethod: 'Review recent extreme risk OS CVEs and confirm 48-hour SLA compliance.' },
      { id: 'E8S6-ML3-3', maturity: 'ML3', description: 'The latest releases (or previous release) of operating systems are used.', guidance: 'Current OS versions provide access to modern security features (e.g., VBS, Credential Guard).', testMethod: 'Audit OS version currency and confirm alignment with vendor-supported versions.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S7',
    number: 7,
    name: 'Multi-Factor Authentication',
    shortName: 'MFA',
    color: '#7c3aed',
    bgColor: '#faf5ff',
    icon: '🔐',
    objective: 'Use multi-factor authentication for all users on all services, especially remote access, privileged access, and important data repositories.',
    why: 'Passwords alone are frequently compromised through phishing, credential stuffing, and data breaches. MFA is the single most effective control for preventing account compromise.',
    controls: [
      // ML1
      { id: 'E8S7-ML1-1', maturity: 'ML1', description: 'Multi-factor authentication is used by all users of online services that process, store, or communicate their organisation\'s sensitive data or that of its customers.', guidance: 'Online services with sensitive data are high-value targets for credential attacks.', testMethod: 'Attempt to authenticate to online services with just a username/password and confirm MFA is required.' },
      { id: 'E8S7-ML1-2', maturity: 'ML1', description: 'Multi-factor authentication is used to authenticate users to their organisation\'s internet-facing services.', guidance: 'Internet-facing services are directly exposed to credential spray and phishing attacks.', testMethod: 'Attempt access to internet-facing services without MFA and confirm it is blocked.' },
      { id: 'E8S7-ML1-3', maturity: 'ML1', description: 'Multi-factor authentication (where available) is enabled by default for non-organisational users (e.g. customers, suppliers, citizens) accessing online services.', guidance: 'Third-party accounts accessing your services are outside your direct security control.', testMethod: 'Confirm MFA is required for external/third-party accounts on online services.' },
      // ML2
      { id: 'E8S7-ML2-1', maturity: 'ML2', description: 'Multi-factor authentication is used to authenticate privileged users when they access an organisation\'s systems and applications.', guidance: 'Privileged user accounts are the highest-value targets; MFA is essential.', testMethod: 'Attempt privileged access without MFA and confirm it is blocked.' },
      { id: 'E8S7-ML2-2', maturity: 'ML2', description: 'Multi-factor authentication is used to authenticate all users when they remotely access an organisation\'s systems and applications.', guidance: 'Remote access is a primary attack vector for ransomware and espionage groups.', testMethod: 'Attempt VPN/RDP/remote access without MFA and confirm it is required.' },
      { id: 'E8S7-ML2-3', maturity: 'ML2', description: 'Successful and unsuccessful MFA events are centralised and protected from modification and deletion, and monitored for signs of compromise.', guidance: 'MFA log monitoring enables detection of MFA fatigue/push bombing attacks.', testMethod: 'Verify MFA events are forwarded to SIEM and monitored for anomalies.' },
      // ML3
      { id: 'E8S7-ML3-1', maturity: 'ML3', description: 'Multi-factor authentication is used to authenticate all users when they access all of an organisation\'s systems and applications.', guidance: 'Full MFA coverage leaves no unprotected authentication paths for attackers.', testMethod: 'Attempt to authenticate to any internal system without MFA and confirm it is blocked.' },
      { id: 'E8S7-ML3-2', maturity: 'ML3', description: 'Multi-factor authentication uses either: something users have and something users know, or something users have that is unlocked by something users know or are.', guidance: 'True two-factor authentication (possession + knowledge/biometric) is required.', testMethod: 'Confirm the MFA factors in use meet the possession+knowledge or possession+biometric requirement.' },
      { id: 'E8S7-ML3-3', maturity: 'ML3', description: 'Multi-factor authentication is phishing-resistant (e.g., FIDO2 security keys, certificate-based authentication) for privileged users and for sensitive systems.', guidance: 'SMS/TOTP MFA can be defeated by real-time phishing. Phishing-resistant MFA (FIDO2) eliminates this vector.', testMethod: 'Confirm FIDO2 or certificate-based MFA is deployed for privileged accounts and sensitive systems.' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'E8S8',
    number: 8,
    name: 'Regular Backups',
    shortName: 'Backups',
    color: '#0369a1',
    bgColor: '#f0f9ff',
    icon: '💾',
    objective: 'Perform regular backups of important data, software, and configuration settings. Store backups disconnected from the network. Test restoration from backups.',
    why: 'Ransomware and destructive attacks rely on the inability to recover without paying. Tested, offline backups are the primary defence against ransomware-driven extortion.',
    controls: [
      // ML1
      { id: 'E8S8-ML1-1', maturity: 'ML1', description: 'Backups of important data, software, and configuration settings are performed and retained with a frequency and retention period in accordance with business continuity requirements.', guidance: 'Backup frequency and retention must be defined based on RTO/RPO requirements.', testMethod: 'Review backup schedules and retention policies against documented RTO/RPO.' },
      { id: 'E8S8-ML1-2', maturity: 'ML1', description: 'Backups are stored offline or in an online storage service that is non-internet-connected and inaccessible to users (other than backup administrators).', guidance: 'Internet-connected or user-accessible backups can be deleted by ransomware. Offline/air-gapped backups are essential.', testMethod: 'Confirm backup storage is offline or isolated from production networks.' },
      { id: 'E8S8-ML1-3', maturity: 'ML1', description: 'Unprivileged accounts cannot access backups belonging to other accounts and cannot delete or modify backups.', guidance: 'Restricting backup access prevents ransomware from destroying backups using compromised user accounts.', testMethod: 'Attempt to access or delete another account\'s backups with a standard user account.' },
      // ML2
      { id: 'E8S8-ML2-1', maturity: 'ML2', description: 'Backups are stored offline at an alternate location (e.g., offsite, cloud storage).', guidance: 'Offsite backups protect against site-wide disasters and physical threats.', testMethod: 'Confirm backup copies are stored at a geographically separate or cloud-based location.' },
      { id: 'E8S8-ML2-2', maturity: 'ML2', description: 'Backups of important data, software, and configuration settings are synchronised to enable restoration to a common point in time.', guidance: 'Synchronised backups ensure consistent recovery across interdependent systems.', testMethod: 'Review backup synchronisation configuration to confirm consistent recovery points.' },
      { id: 'E8S8-ML2-3', maturity: 'ML2', description: 'Privileged accounts (excluding those specifically for performing backups) cannot access backups belonging to other accounts and cannot delete or modify backups.', guidance: 'Even privileged accounts should not have unnecessary backup access, limiting blast radius.', testMethod: 'Confirm privileged accounts other than backup service accounts cannot access or modify backups.' },
      // ML3
      { id: 'E8S8-ML3-1', maturity: 'ML3', description: 'Restoration of backups is tested at least once per year to recover data and verify integrity.', guidance: 'Untested backups frequently fail when needed most. Annual restoration tests are required.', testMethod: 'Review documentation of the most recent annual restoration test and outcomes.' },
      { id: 'E8S8-ML3-2', maturity: 'ML3', description: 'Backups of important data are tested at least once when initially implemented and each time when fundamental information technology infrastructure changes occur.', guidance: 'Infrastructure changes can silently break backup processes; testing after changes catches these issues.', testMethod: 'Review change management procedures to confirm backup testing is triggered by infrastructure changes.' },
      { id: 'E8S8-ML3-3', maturity: 'ML3', description: 'The restoration process meets the organisation\'s recovery time objective and recovery point objective, and has been tested against a ransomware scenario.', guidance: 'Ransomware simulation tests validate that backup recovery processes actually work under attack conditions.', testMethod: 'Review evidence of a ransomware tabletop or recovery exercise testing RTO/RPO compliance.' },
    ],
  },
];

/** Compute the achieved maturity level for a given strategy based on current assessments */
export function computeAchievedMaturity(strategy, assessments) {
  const ml1Controls = strategy.controls.filter(c => c.maturity === 'ML1');
  const ml2Controls = strategy.controls.filter(c => c.maturity === 'ML2');
  const ml3Controls = strategy.controls.filter(c => c.maturity === 'ML3');

  const allCompliantOrNA = (controls) => controls.length > 0 && controls.every(c => {
    const s = assessments[c.id]?.status;
    return s === 'COMPLIANT' || s === 'NOT_APPLICABLE';
  });

  if (allCompliantOrNA(ml3Controls) && allCompliantOrNA(ml2Controls) && allCompliantOrNA(ml1Controls)) return 'ML3';
  if (allCompliantOrNA(ml2Controls) && allCompliantOrNA(ml1Controls)) return 'ML2';
  if (allCompliantOrNA(ml1Controls)) return 'ML1';
  return 'ML0';
}
