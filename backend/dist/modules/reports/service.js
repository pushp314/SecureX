"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIncidentForensicReport = generateIncidentForensicReport;
const client_1 = require("../../db/client");
const service_1 = require("../timeline/service");
const service_2 = require("../threatintel/service");
async function generateIncidentForensicReport(incidentId) {
    const incident = await client_1.prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
            alerts: true,
            evidences: true,
            notes: true,
        },
    });
    if (!incident) {
        throw new Error(`Incident not found: ${incidentId}`);
    }
    const timeline = await (0, service_1.reconstructIncidentTimeline)(incidentId);
    const threatIntel = (0, service_2.lookupThreatIntelligence)(incident.entityKey.replace('ip:', '').replace('user:', ''));
    const generatedAt = new Date().toISOString();
    // Construct structured Markdown
    const markdown = `# FORENSIC SECURITY INCIDENT INVESTIGATION REPORT
**Platform:** SecureX Threat Investigation Engine  
**Report Generated:** ${generatedAt}  
**Classification:** STRICTLY CONFIDENTIAL // TLP:AMBER

---

## 1. EXECUTIVE SUMMARY

| Field | Value |
|---|---|
| **Incident Identifier** | \`${incident.incidentId}\` |
| **Case Title** | ${incident.title} |
| **Correlated Entity** | \`${incident.entityKey}\` |
| **Severity Classification** | **${incident.severity.toUpperCase()}** |
| **Incident Status** | \`${incident.status}\` |
| **Total Correlated Signals** | ${incident.alerts.length} Detection Alerts |
| **MITRE ATT&CK Tactics** | ${incident.mitreTactics} |

### Investigation Narrative
${incident.summary}

---

## 2. THREAT INTELLIGENCE & ATTRIBUTION PROFILE

* **Threat Score:** \`${threatIntel.threatScore} / 100\` (${threatIntel.isMalicious ? 'MALICIOUS ADVERSARY' : 'NEUTRAL'})
* **Attributed Threat Actor:** ${threatIntel.threatActor || 'Unclassified Threat Group'}
* **Infrastructure Classification:** ${threatIntel.threatType || 'Standard IP Address'}
* **Geographical Origin / ASN:** ${threatIntel.country || 'N/A'} - ${threatIntel.asn || 'N/A'}
* **Intelligence Tags:** ${threatIntel.tags.map((t) => `\`${t}\``).join(', ')}
* **Reputation Assessment:** ${threatIntel.reputationSummary}

---

## 3. CORRELATED DETECTION SIGNALS

${incident.alerts.map((a, i) => `### Signal ${i + 1}: ${a.ruleName}
* **Alert ID:** \`${a.alertId}\`
* **Timestamp:** \`${a.timestamp.toISOString()}\`
* **Severity:** \`${a.severity.toUpperCase()}\`
* **MITRE ATT&CK Mapping:** \`${a.mitreTactic}\` (\`${a.mitreTechnique}\`)
* **Description:** ${a.description}
`).join('\n')}

---

## 4. FORENSIC EVIDENCE & CHAIN OF CUSTODY

| Evidence Type | Identifier / Title | Extracted Artifact / Value | Added At |
|---|---|---|---|
${incident.evidences.map((e) => `| \`${e.type}\` | ${e.title} | \`${e.value}\` | ${e.addedAt.toISOString()} |`).join('\n')}

---

## 5. CHRONOLOGICAL ATTACK TIMELINE RECONSTRUCTION

\`\`\`text
${timeline.map((t) => `[${t.timestamp}] [${t.type.toUpperCase()}] ${t.title} - ${t.description}`).join('\n')}
\`\`\`

---

## 6. ANALYST FINDINGS & CONTAINMENT AUDIT TRAIL

${incident.notes.length === 0 ? '_No analyst findings recorded yet._' : incident.notes.map((n) => `* **[${n.createdAt.toISOString()}] (${n.author}):** ${n.content}`).join('\n')}

---
*Report certified by SecureX Automated Threat Investigation Subsystem.*
`;
    return {
        markdown,
        json: {
            incident,
            threatIntel,
            timeline,
            generatedAt,
        },
    };
}
