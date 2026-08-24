# Changelog 📝

All notable architectural changes and system designs for the SecureX platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning (although currently in an *Architecture & Design* state).

---

## [1.0.0-core] - 2026-08-24

### Added
- **Full Monorepo Structure**: Workspaces configured across `backend`, `frontend`, `sdk`, and `simulator`.
- **Enterprise Authentication & RBAC System (`backend/src/modules/auth/`)**: HMAC-SHA256 JWT tokens, multi-role RBAC (`SOC_LEAD`, `ANALYST_TIER_2`, `AUDITOR`), session validation, and password security.
- **Cyber SOC Login Portal (`frontend/src/components/LoginView.tsx`)**: High-tech analyst login portal with 1-click role presets, active user profile badge, and session logout.
- **Node.js Telemetry SDK (`@securex/sdk-node`)**: Zero-dependency client with automated batch buffering, retry safeguards, normalized event schemas, and Express audit middleware.
- **Fastify Core Ingestion Engine (`backend/`)**: High-throughput telemetry intake endpoint (`/api/v1/telemetry/ingest`) with Zod schema compilation, API key authentication, and Redis Stream / In-Memory EventBus queueing.
- **Automated PII Redaction & Data Sanitizer**: Recursive scrubbing of raw passwords, JWT tokens, credit cards, and SSNs before event persistence.
- **Dead Letter Queue (DLQ) & Poison Message Quarantine**: Error isolation, malformed JSON recovery, and 1-click re-injection into the live detection pipeline.
- **Multi-Stage Docker & Nginx Containerization**: Multi-stage `backend/Dockerfile` with non-root hardening, `frontend/Dockerfile` with Nginx reverse proxy, and multi-service `infrastructure/docker-compose.yml`.
- **Graceful Shutdown & Signal Handlers**: Clean disconnection of database pools and WebSockets on `SIGINT`/`SIGTERM`.
- **Detection & Correlation Engine**: Sliding time-window evaluator loaded with 8 pre-seeded MITRE ATT&CK rules. Multi-signal incident correlation hub with automated evidence binding.
- **Threat Intelligence & IOC Enrichment**: Real-time IP reputation scoring (0–100), Tor exit node classification, and threat actor attribution (`APT28`, `Mirai`, `LockBit 3.0`).
- **SOAR Automated Response Playbooks**: Pre-built playbooks (`PB-101` Perimeter Quarantine, `PB-102` Identity Invalidation, `PB-103` S3 Emergency Lockdown, `PB-104` SOC Escalation) with one-click dispatch and audit logging.
- **Explainable AI Investigation Copilot**: Evidence-grounded root cause analysis, entry vector hypothesis validation, and containment checklists.
- **Regulatory Compliance & Governance Matrix**: Continuous compliance tracking across SOC 2 Type II, ISO/IEC 27001:2022, HIPAA Security Rule, PCI-DSS v4.0, and NIST CSF 2.0 with 1-click executive audit report export.
- **MITRE D3FEND Defensive Matrix**: Countermeasure mapping and affirmative defense deployment (`D3-MFA`, `D3-PLA`, `D3-NTA`, `D3-FBA`, `D3-IPA`, `D3-TSR`).
- **Identity Threat Detection & Response (ITDR)**: Workload identity risk scoring, automated session containment, and identity stress-testing suite (MFA fatigue, Golden SAML, Kerberoasting).
- **Cloud Security Posture Management (CSPM)**: Multi-cloud posture assessment across AWS, Kubernetes, Azure, and GCP with 1-click auto-remediation.
- **Automated Malware Sandbox**: Dynamic behavioral detonation with process tree reconstruction, intercepted Win32/POSIX API calls, and C2 callback logging.
- **Asset Vulnerability & Exposure Scanner**: Continuous CVE enumeration with CVSS v3.1 scoring and active incident exposure correlation.
- **Outbound Webhook Delivery Engine**: HMAC-SHA256 authenticated event dispatcher to Slack, Discord, and PagerDuty.
- **Network Flow Anomaly Monitor**: NetFlow / IPFIX analysis, C2 beaconing heartbeat detector, and DNS tunneling exfiltration detector.
- **DevSecOps Supply Chain Security**: Committed secrets scanner (live API keys, tokens), Dockerfile root user checks, and branch deployment guardrails.
- **Tamper-Evident SHA-256 Chained Audit Trail**: Blockchain-style cryptographic audit logging with scoped API key governance.
- **Threat Hunting Workbench & Sigma Engine**: Proactive hypothesis testing, sub-second telemetry mining, and 1-click hunt-to-rule promotion.
- **Platform Observability & Diagnostics**: Real-time EPS throughput, queue lag, P99 detection latency, and automated self-healing diagnostic suite.
- **Universal Log Parsers & Ingestion Connectors (Grok / OCSF)**: Native support for Syslog RFC 5424/3164, Windows Event Logs (EVTX 4624/4625/4672/4688), AWS CloudTrail, and Okta System Log with live regex parsing studio and direct ingestion.
- **Threat Intelligence & Automated IOC Matching (CTI)**: Continuous threat feed correlation against AbuseIPDB, AlienVault OTX, Tor exit nodes, and Ransomware C2 indicators with reputation lookups and confidence scoring.
- **Interactive SIEM Query Console (SPL / KQL Engine)**: Piped query evaluator (`| stats count() by | where | top | sort`), 1-minute event distribution histogram, field discovery drawer, and query presets.
- **User & Entity Behavioral Analytics (UEBA)**: Rolling 30-day statistical baseline profiling with gaussian $Z$-score anomaly calculation ($Z > 3.0$) for abnormal login rates, impossible hours, and data egress spikes.
- **DevSecOps Supply Chain Finding Resolution**: Interactive 1-click finding remediation and suppression with real-time status updates and open metrics recalculation.
- **Dynamic Cloud Posture Management (CSPM)**: Live mathematical posture score calculation ($0\text{–}100\%$) across AWS, Kubernetes, Azure, and GCP that increases dynamically upon 1-click resource remediation.
- **Dynamic Global Geo-IP Threat Radar**: Live geospatial adversary origin mapping, Autonomous System (ASN) attribution, and cross-border blast radius analysis aggregated directly from PostgreSQL ingested telemetry and active incidents.
- **Data Lifecycle & Storage Tiering (ILM)**: Hot (PostgreSQL) $\rightarrow$ Warm (Parquet ZSTD) $\rightarrow$ Cold (AWS S3 Glacier) multi-tier storage with PCI-DSS 365-day compliance certification.
- **Production Docker Infrastructure (`docker-compose.yml`)**: Automated multi-container stack with PostgreSQL 16 (`pg_isready` healthchecks), Redis 7, Fastify production runner, and Nginx SPA reverse proxy with security headers.
- **Enterprise Minimalism (SaaS-Pro) UI/UX Design System**: Complete overhaul across all 18 platform modules with refined slate surfaces, high-contrast typography, crisp status badges, collapsible **Sidebar Navigation**, **TopHeader** breadcrumbs, and Command Palette (`⌘K`).
- **Adversary Threat Simulator (`simulator/`)**: Multi-stage APT campaigns, Ransomware bursts, Web API exploits, and custom campaign builder.

---

## [0.2.0-mvp] - 2026-08-24

### Added
- **Node.js Telemetry SDK** (`sdk/`): typed `TelemetrySDK` client with single + batch ingestion, event normalization, and API key support.
- **Backend Ingestion API** (`backend/`): Express server with event validation/normalization, Redis-backed queueing, and detection/correlation rule endpoints.
- **Detection Engine**: in-line rule matching (type, severity threshold, tags) publishing detections to the Redis detection queue.
- **Correlation Engine** (`backend/src/correlation.ts`): sequence-based correlation with time windows — converts multi-step attack chains into incidents (e.g. failed login → MFA failure → large data download = account compromise).
- **Investigator UI** (`frontend/public/index.html`): SOC analyst dashboard with incident list, detection feed, attack timeline, and live stats (auto-refresh).
- **Infrastructure** (`infrastructure/docker-compose.yml`, `backend/Dockerfile`): local prototype stack with Redis healthchecks.

### Verified
- End-to-end flow: SDK-style ingest → Redis queue → detection match → sequence correlation → incident creation → UI visibility.

---

## [0.1.0-architectural-draft] - 2026-05-19

### Added
- Created complete documentation hierarchy in `docs/` for 10 structural modules.
- Initialized local Git repository for version-tracked systems engineering.
- Created root structure files (`README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`).
- Drafted the primary high-level topology and Architectural Decision Record (ADR) framework.
