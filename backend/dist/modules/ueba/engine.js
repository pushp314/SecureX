"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uebaEngine = exports.UebaAnalyticsEngine = void 0;
class UebaAnalyticsEngine {
    profiles = [
        {
            id: 'UEBA-USR-01',
            entityName: 'alex.chen@enterprise.corp',
            entityType: 'user',
            department: 'Cloud Infrastructure',
            baseline: {
                avgDailyLogins: 4.2,
                stdDevDailyLogins: 1.1,
                normalWorkingHours: '09:00 - 18:00 UTC',
                avgDailyEgressMb: 45.0,
                stdDevDailyEgressMb: 12.5,
                typicalLocations: ['US-East', 'US-West'],
            },
            observedCurrent: {
                loginsToday: 28,
                egressMbToday: 1250.0,
                lastActiveHour: 3, // 3 AM
                currentLocation: 'Sofia, Bulgaria (Tor Exit Node)',
            },
            zScore: {
                loginZScore: 21.6, // (28 - 4.2) / 1.1
                egressZScore: 96.4, // (1250 - 45) / 12.5
                timeZScore: 4.5,
                compositeAnomalyScore: 99,
            },
            anomalyFlag: true,
            anomalyReason: 'Massive Z-Score spike: 28 logins (>21σ deviation) and 1.25 GB S3 download at 3:00 AM from atypical foreign IP.',
            riskTier: 'CRITICAL',
        },
        {
            id: 'UEBA-USR-02',
            entityName: 'sarah.connor@corp.internal',
            entityType: 'user',
            department: 'DevOps Security',
            baseline: {
                avgDailyLogins: 6.0,
                stdDevDailyLogins: 1.5,
                normalWorkingHours: '08:00 - 17:00 UTC',
                avgDailyEgressMb: 80.0,
                stdDevDailyEgressMb: 20.0,
                typicalLocations: ['US-Central'],
            },
            observedCurrent: {
                loginsToday: 7,
                egressMbToday: 95.0,
                lastActiveHour: 14,
                currentLocation: 'US-Central',
            },
            zScore: {
                loginZScore: 0.67,
                egressZScore: 0.75,
                timeZScore: 0.1,
                compositeAnomalyScore: 12,
            },
            anomalyFlag: false,
            riskTier: 'NORMAL',
        },
        {
            id: 'UEBA-HOST-01',
            entityName: 'prod-k8s-worker-node-04',
            entityType: 'host',
            department: 'Kubernetes Cluster',
            baseline: {
                avgDailyLogins: 0,
                stdDevDailyLogins: 0.1,
                normalWorkingHours: '24/7 Automated',
                avgDailyEgressMb: 350.0,
                stdDevDailyEgressMb: 45.0,
                typicalLocations: ['AWS us-east-1'],
            },
            observedCurrent: {
                loginsToday: 1, // Interactive shell login on headless worker node!
                egressMbToday: 2100.0,
                lastActiveHour: 2,
                currentLocation: 'Moscow, Russia (C2 Direct Pivot)',
            },
            zScore: {
                loginZScore: 10.0,
                egressZScore: 38.8,
                timeZScore: 3.2,
                compositeAnomalyScore: 97,
            },
            anomalyFlag: true,
            anomalyReason: 'Interactive SSH session detected on headless production container node with 2.1 GB outbound transmission.',
            riskTier: 'CRITICAL',
        },
        {
            id: 'UEBA-SVC-01',
            entityName: 'github-actions-deployer',
            entityType: 'service_account',
            department: 'CI/CD Automation',
            baseline: {
                avgDailyLogins: 12.0,
                stdDevDailyLogins: 2.0,
                normalWorkingHours: '24/7 Automated',
                avgDailyEgressMb: 120.0,
                stdDevDailyEgressMb: 30.0,
                typicalLocations: ['GitHub IP Range'],
            },
            observedCurrent: {
                loginsToday: 15,
                egressMbToday: 135.0,
                lastActiveHour: 11,
                currentLocation: 'GitHub IP Range',
            },
            zScore: {
                loginZScore: 1.5,
                egressZScore: 0.5,
                timeZScore: 0.0,
                compositeAnomalyScore: 18,
            },
            anomalyFlag: false,
            riskTier: 'NORMAL',
        },
    ];
    getProfiles() {
        return this.profiles;
    }
    getAnomalousProfiles() {
        return this.profiles.filter((p) => p.anomalyFlag);
    }
}
exports.UebaAnalyticsEngine = UebaAnalyticsEngine;
exports.uebaEngine = new UebaAnalyticsEngine();
