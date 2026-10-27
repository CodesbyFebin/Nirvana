/**
 * MetaPen claw catalog — conceptual tool roster for the control-center UI.
 * `activeConcept` and swarm map numbers are TARGET/CONCEPT state, not live worker telemetry.
 * Named tools are real OSS/security tools; remaining slots are explicitly unassigned.
 */

function padTools(named, masteryHints = {}) {
  const tools = named.map((name, i) => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    assigned: true,
    mastery: masteryHints[name] || `Mastery note: lab-only use of ${name}; scope.yaml is law.`,
    slot: i + 1,
  }));
  while (tools.length < 50) {
    const slot = tools.length + 1;
    tools.push({
      id: `unassigned-${slot}`,
      name: `Unassigned slot ${slot}`,
      assigned: false,
      mastery: 'Empty agent slot — not a live worker. Fill only when a real tool adapter exists.',
      slot,
    });
  }
  return tools;
}

export const SWARM_CONCEPT = Object.freeze({
  supervisors: 10,
  specialists: 500,
  active: 32,
  idle: 468,
  label: 'concept / target — not live telemetry',
});

export const CLAWS = Object.freeze([
  {
    id: 'claw-01',
    code: 'CLAW 01',
    domain: 'RECON',
    activeConcept: 4,
    capacity: 50,
    tools: padTools(
      [
        'nmap', 'masscan', 'amass', 'subfinder', 'dnsenum', 'httpx', 'gau', 'shodan', 'censys', 'truffleHog',
        'theHarvester', 'fierce', 'naabu', 'assetfinder', 'findomain', 'rustscan', 'waybackurls', 'katana',
        'hakrawler', 'gospider', 'dnsx', 'puredns', 'shuffledns', 'tlsx', 'asnmap', 'mapcidr', 'alterx',
        'ffuf', 'gobuster', 'dirsearch', 'aquatone', 'spiderfoot', 'recon-ng', 'netdiscover', 'arp-scan',
        'dnstwist', 'chaos', 'urlfinder', 'whatweb', 'wafw00f', 'nuclei-templates', 'crt.sh', 'whois',
      ],
      {
        nmap: 'Network discovery & port/service fingerprinting (owned-lab only).',
        masscan: 'High-speed port sweep within authorized CIDR.',
        amass: 'Attack-surface mapping / subdomain intel.',
        subfinder: 'Passive subdomain enumeration.',
        truffleHog: 'Secret leakage hunting in repos/history.',
      },
    ),
  },
  {
    id: 'claw-02',
    code: 'CLAW 02',
    domain: 'WEB',
    activeConcept: 5,
    capacity: 50,
    tools: padTools(
      [
        'burpsuite', 'zap', 'nikto', 'wpscan', 'whatwaf', 'sqlmap', 'xsstrike', 'ssrfmap', 'tplmap', 'jwt-tool',
        'commix', 'dalfox', 'wfuzz', 'dirb', 'feroxbuster', 'arjun', 'hakrawler', 'qsreplace', 'uro',
        'httpx', 'nuclei', 'jaeles', 'corsy', 'smuggler', 'h2csmuggler', 'ghauri', 'nosqlmap', 'graphql-cop',
        'jwt_tool', 'testssl.sh', 'sslyze', 'sslscan', 'wapiti', 'skipfish', 'cadaver', 'davtest',
        'dotdotpwn', 'fimap', 'joomscan', 'droopescan', 'cmsmap', 'whatweb', 'webtech', 'retire.js',
      ],
      {
        burpsuite: 'Interactive proxy for manual web review (lab targets).',
        zap: 'OWASP ZAP automated + manual web testing.',
        sqlmap: 'SQL injection probe — never against unscoped hosts.',
        xsstrike: 'XSS payload generation / detection aid.',
      },
    ),
  },
  {
    id: 'claw-03',
    code: 'CLAW 03',
    domain: 'API',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'arjun', 'kiterunner', 'linkfinder', 'secretfinder', 'postman', 'swagger', 'graphql', 'paramspider',
        'ffuf', 'httpie', 'curl', 'insomnia', 'mitmproxy2swagger', 'openapi-generator', 'schemathesis',
        'dredd', 'restler', 'apisec', 'jwt-cli', 'authz0', 'graphee', 'inql', 'graphql-path-enum',
        'batchql', 'clairvoyance', 'api-fuzzer', 'fuzzapi', 'gotestwaf', 'waf-bypass', 'cors-scanner',
        'hakrawler', 'waybackurls', 'gau', 'uro', 'qsreplace', 'kxss', 'x8', 'tomnomnom-unfurl',
      ],
      {
        arjun: 'HTTP parameter discovery for APIs.',
        kiterunner: 'API route bruteforce from wordlists.',
        linkfinder: 'Endpoint extraction from JS bundles.',
      },
    ),
  },
  {
    id: 'claw-04',
    code: 'CLAW 04',
    domain: 'IDENTITY',
    activeConcept: 4,
    capacity: 50,
    tools: padTools(
      [
        'bloodhound', 'mimikatz', 'impacket', 'rubeus', 'certify', 'evil-winrm', 'kerbrute', 'responder',
        'crackmapexec', 'netexec', 'ldapdomaindump', 'enum4linux', 'rpcclient', 'smbclient', 'smbmap',
        'nxc', 'lsassy', 'donpapi', 'certipy', 'bloodyAD', 'pywhisker', 'pkinittools', 'krbrelayx',
        'ntlmrelayx', 'hashcat', 'john', 'hydra', 'medusa', 'crowbar', 'sprayhound', 'kerberoast',
        'asreproast', 'secretsdump', 'GetNPUsers', 'GetUserSPNs', 'psexec', 'wmiexec', 'atexec',
      ],
      {
        bloodhound: 'AD path analysis for owned-lab domains.',
        mimikatz: 'Credential research — lab VMs only; never production.',
        impacket: 'Python protocol toolkit for AD/SMB labs.',
        rubeus: 'Kerberos abuse research in authorized labs.',
      },
    ),
  },
  {
    id: 'claw-05',
    code: 'CLAW 05',
    domain: 'SOURCE',
    activeConcept: 4,
    capacity: 50,
    tools: padTools(
      [
        'slither', 'ghidra', 'radare2', 'semgrep', 'bandit', 'hardhat', 'brownie', 'solc', 'vyper',
        'mythril', 'echidna', 'manticore', 'binary-ninja-free', 'objdump', 'gdb', 'pwndbg', 'gef',
        'ida-free', 'apktool', 'jadx', 'dex2jar', 'frida', 'objection', 'angr', 'hopper',
        'codeql', 'sonarqube', 'eslint-security', 'gosec', 'brakeman', 'spotbugs', 'find-sec-bugs',
        'cargo-audit', 'pip-audit', 'safety', 'trufflehog', 'gitleaks', 'bearer', 'horusec',
      ],
      {
        slither: 'Solidity static analysis.',
        ghidra: 'NSA open-source reverse engineering.',
        semgrep: 'Semantic pattern scanning for source.',
        bandit: 'Python security lint.',
      },
    ),
  },
  {
    id: 'claw-06',
    code: 'CLAW 06',
    domain: 'DEPENDENCIES',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'trivy', 'grype', 'syft', 'osv-scanner', 'snyk', 'retire.js', 'npm-audit', 'checkov',
        'dependabot', 'renovate', 'pip-audit', 'safety', 'cargo-audit', 'bundler-audit', 'nancy',
        'owasp-dependency-check', 'maven-dependency-plugin', 'gradle-versions', 'pnpm-audit',
        'yarn-audit', 'composer-audit', 'govulncheck', 'dotnet-list-vulnerable', 'scoop-audit',
        'docker-scout', 'clair', 'anchore', 'harbor-scanner', 'quay-clair', 'cosign', 'syft-spdx',
        'cdxgen', 'cyclonedx-cli', 'ort', 'fossa', 'license-finder', 'scancode', 'tern',
      ],
      {
        trivy: 'Container / FS / repo vulnerability scan.',
        grype: 'SBOM-driven vuln matching.',
        'osv-scanner': 'OSV database client for lockfiles.',
      },
    ),
  },
  {
    id: 'claw-07',
    code: 'CLAW 07',
    domain: 'CONFIG',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'git-secrets', 'detect-secrets', 'whispers', 'credential-digger', 'tfsec', 'cfn-nag', 'policy-sentry',
        'checkov', 'terrascan', 'kics', 'kube-linter', 'kubeconform', 'conftest', 'opa', 'gatekeeper',
        'hadolint', 'dockle', 'trivy-config', 'spectral', 'spectral-owasp', 'infracost', 'tflint',
        'tfsec-sarif', 'cfn-lint', 'yamllint', 'ansible-lint', 'puppet-lint', 'chef-inspec',
        'gitleaks', 'trufflehog', 'shhgit', 'noseyparker', 'kingfisher', 'talisman', 'pre-commit',
      ],
      {
        'git-secrets': 'Prevent committing secrets to git.',
        'detect-secrets': 'Baseline + scan for high-entropy secrets.',
        tfsec: 'Terraform misconfiguration scanner.',
      },
    ),
  },
  {
    id: 'claw-08',
    code: 'CLAW 08',
    domain: 'CLOUD',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'pacu', 'prowler', 'scoutSuite', 'cloudsploit', 'cartography', 'kube-hunter', 'kube-bench', 'cloudmapper',
        'cloudsplaining', 'principalmapper', 'enumerate-iam', 'aws-vault', 'steampipe', 'cloudquery',
        'aqua-trivy', 'kubesec', 'kubescape', 'popeye', 'polaris', 'rakkess', 'kdigger', 'peirates',
        'azucar', 'roadtools', 'ROADtools', 'MicroBurst', 'PowerZure', 'Sparrow', 'gcp-iam-collector',
        'gcloud', 'aws-cli', 'az-cli', 'terraform', 'pulumi', 'cdk-nag', 'cloudformation-guard',
      ],
      {
        pacu: 'AWS exploitation framework — owned accounts only.',
        prowler: 'Multi-cloud security assessment.',
        'kube-hunter': 'Kubernetes attack-surface discovery (lab clusters).',
      },
    ),
  },
  {
    id: 'claw-09',
    code: 'CLAW 09',
    domain: 'DEFENSE',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'wireshark', 'suricata', 'osquery', 'lynis', 'falco', 'yara', 'volatility', 'aircrack-ng', 'kismet',
        'tcpdump', 'zeek', 'snort', 'wazuh', 'ossec', 'auditd', 'aide', 'rkhunter', 'chkrootkit',
        'fail2ban', 'crowdsec', 'sigma', 'elastalert', 'velociraptor', 'grr', 'osquery-fleet',
        'sysmon', 'auditbeat', 'filebeat', 'packetbeat', 'thehive', 'cortex', 'misp', 'opencti',
        'clamav', 'capa', 'pe-sieve', 'hollows-hunter', 'thor-lite', 'loki', 'fenrir',
      ],
      {
        wireshark: 'Packet capture analysis.',
        suricata: 'IDS/IPS rule evaluation.',
        falco: 'Runtime threat detection for containers/k8s.',
        yara: 'Malware pattern matching.',
      },
    ),
  },
  {
    id: 'claw-10',
    code: 'CLAW 10',
    domain: 'EVIDENCE',
    activeConcept: 3,
    capacity: 50,
    tools: padTools(
      [
        'foundry-forge', 'foundry-cast', 'anvil', 'echidna', 'mythril', 'hevm', 'hashcat', 'john', 'gophish',
        'dune-analytics', 'defillama', 'slither', 'manticore', 'surya', 'tenderly', 'etherscan-api',
        'cast', 'chisel', 'forge-std', 'halmos', 'kontrol', 'certora', 'smtchecker', 'aderyn',
        '4naly3er', 'reportgen', 'pandoc', 'eviden', 'timesketch', 'plaso', 'autopsy', 'volatility3',
        'bulk-extractor', 'exiftool', 'binwalk', 'foremost', 'scalpel', 'sleuthkit', 'regripper',
      ],
      {
        'foundry-forge': 'Solidity test + fuzz evidence generation.',
        echidna: 'Property-based smart-contract fuzzer.',
        hashcat: 'Offline hash recovery in authorized labs.',
        'dune-analytics': 'On-chain evidence queries (read-only).',
      },
    ),
  },
]);

export function clawById(id) {
  return CLAWS.find((c) => c.id === id) || null;
}

export function coverageMatrix() {
  // Conceptual coverage weights for heatmap (0–100), not measured telemetry.
  return CLAWS.map((c) => ({
    id: c.id,
    domain: c.domain,
    coverage: Math.round((c.activeConcept / c.capacity) * 100),
    namedTools: c.tools.filter((t) => t.assigned).length,
    concept: true,
  }));
}
