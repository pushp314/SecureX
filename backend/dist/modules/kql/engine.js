"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.siemQueryEngine = exports.SiemQueryLanguageEngine = void 0;
const client_1 = require("../../db/client");
class SiemQueryLanguageEngine {
    async executeQuery(kqlQuery) {
        const startTime = Date.now();
        const cleanQuery = kqlQuery.trim();
        // 1. Fetch recent telemetry records (up to 500)
        const rawEvents = await client_1.prisma.telemetryEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 500,
        });
        let dataset = rawEvents.map((evt) => ({
            id: evt.id,
            eventId: evt.eventId,
            timestamp: evt.timestamp.toISOString(),
            category: evt.category,
            eventType: evt.eventType,
            outcome: evt.outcome,
            severity: evt.severity,
            sourceService: evt.sourceService,
            sourceIp: evt.sourceIp || 'N/A',
            destinationIp: evt.destinationIp || 'N/A',
            userId: evt.userId || 'N/A',
            username: evt.username || 'N/A',
            action: evt.action || 'N/A',
        }));
        const pipes = cleanQuery.split('|').map((p) => p.trim()).filter(Boolean);
        let isAggregated = false;
        // Process initial filter (before first pipe)
        const initialFilter = pipes[0];
        if (initialFilter && !initialFilter.startsWith('stats') && !initialFilter.startsWith('where')) {
            dataset = this.applyFilter(dataset, initialFilter);
            pipes.shift();
        }
        // Process subsequent pipe stages
        for (const pipe of pipes) {
            if (pipe.startsWith('where ')) {
                const cond = pipe.replace('where ', '').trim();
                dataset = this.applyFilter(dataset, cond);
            }
            else if (pipe.startsWith('stats ') || pipe.startsWith('summarize ')) {
                isAggregated = true;
                dataset = this.applyStatsAggregation(dataset, pipe);
            }
            else if (pipe.startsWith('top ') || pipe.startsWith('limit ') || pipe.startsWith('take ')) {
                const limitStr = pipe.match(/\d+/);
                const limit = limitStr ? parseInt(limitStr[0]) : 10;
                dataset = dataset.slice(0, limit);
            }
            else if (pipe.startsWith('sort ') || pipe.startsWith('order by ')) {
                const sortExpr = pipe.replace(/sort |order by /, '').trim();
                dataset = this.applySort(dataset, sortExpr);
            }
        }
        // 2. Generate Time-Bucket Histogram
        const histogram = this.generateHistogram(rawEvents);
        // 3. Generate Discovered Fields Metadata
        const discoveredFields = this.extractDiscoveredFields(rawEvents);
        const duration = Date.now() - startTime;
        return {
            query: kqlQuery,
            executionDurationMs: duration,
            totalRecords: dataset.length,
            isAggregated,
            records: dataset,
            histogram,
            discoveredFields,
        };
    }
    applyFilter(dataset, filterStr) {
        const tokens = filterStr.split(/\s+and\s+|\s+AND\s+/);
        return dataset.filter((row) => {
            return tokens.every((tok) => {
                // equality match: field == "value" or field = "value"
                const eqMatch = tok.match(/([a-zA-Z0-9_\.]+)\s*(?:==|=)\s*["']?([^"']+)["']?/);
                if (eqMatch) {
                    const field = eqMatch[1];
                    const val = eqMatch[2];
                    return String(row[field] || '').toLowerCase() === val.toLowerCase();
                }
                // contains match: field contains "value" or field has "value"
                const containsMatch = tok.match(/([a-zA-Z0-9_\.]+)\s*(?:contains|has)\s*["']?([^"']+)["']?/i);
                if (containsMatch) {
                    const field = containsMatch[1];
                    const val = containsMatch[2];
                    return String(row[field] || '').toLowerCase().includes(val.toLowerCase());
                }
                // raw search across row
                return JSON.stringify(row).toLowerCase().includes(tok.replace(/["']/g, '').toLowerCase());
            });
        });
    }
    applyStatsAggregation(dataset, statsExpr) {
        // e.g. "stats count() by sourceIp" or "stats count() by eventType, severity"
        const byMatch = statsExpr.match(/by\s+([a-zA-Z0-9_,\s]+)/i);
        const byFields = byMatch
            ? byMatch[1].split(',').map((f) => f.trim())
            : ['eventType'];
        const groups = {};
        dataset.forEach((row) => {
            const key = byFields.map((f) => `${f}=${row[f] || 'N/A'}`).join(' | ');
            if (!groups[key]) {
                const initialSample = { count: 0 };
                byFields.forEach((f) => (initialSample[f] = row[f] || 'N/A'));
                groups[key] = { count: 0, sample: initialSample };
            }
            groups[key].count++;
            groups[key].sample.count = groups[key].count;
        });
        return Object.values(groups).map((g) => g.sample).sort((a, b) => b.count - a.count);
    }
    applySort(dataset, sortExpr) {
        const isDesc = sortExpr.startsWith('-') || sortExpr.endsWith(' desc') || sortExpr.endsWith(' DESC');
        const field = sortExpr.replace(/^[-+]/, '').replace(/\s+(asc|desc|ASC|DESC)$/, '').trim();
        return [...dataset].sort((a, b) => {
            const valA = a[field] ?? '';
            const valB = b[field] ?? '';
            if (typeof valA === 'number' && typeof valB === 'number') {
                return isDesc ? valB - valA : valA - valB;
            }
            return isDesc
                ? String(valB).localeCompare(String(valA))
                : String(valA).localeCompare(String(valB));
        });
    }
    generateHistogram(rawEvents) {
        const buckets = {};
        rawEvents.forEach((evt) => {
            const d = new Date(evt.timestamp);
            d.setSeconds(0, 0); // 1-minute bucket
            const key = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            buckets[key] = (buckets[key] || 0) + 1;
        });
        return Object.entries(buckets).map(([timeBucket, count]) => ({
            timeBucket,
            count,
        })).slice(-15);
    }
    extractDiscoveredFields(rawEvents) {
        const fields = [
            'category',
            'eventType',
            'severity',
            'outcome',
            'sourceService',
            'sourceIp',
            'destinationIp',
            'username',
        ];
        return fields.map((f) => {
            const values = Array.from(new Set(rawEvents.map((r) => r[f]).filter(Boolean)));
            return {
                name: f,
                type: 'string',
                distinctCount: values.length,
                sampleValues: values.slice(0, 5),
            };
        });
    }
}
exports.SiemQueryLanguageEngine = SiemQueryLanguageEngine;
exports.siemQueryEngine = new SiemQueryLanguageEngine();
