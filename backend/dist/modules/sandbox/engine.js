"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMalwareSample = analyzeMalwareSample;
exports.getPastSandboxAnalyses = getPastSandboxAnalyses;
const crypto_1 = __importDefault(require("crypto"));
const PAST_ANALYSES = [];
function analyzeMalwareSample(sampleName, fileHash) {
    const hash = fileHash || crypto_1.default.createHash('sha256').update(sampleName + Date.now()).digest('hex');
    const isRansomware = sampleName.toLowerCase().includes('lockbit') || sampleName.toLowerCase().includes('ransom') || sampleName.toLowerCase().includes('enc');
    const isBeacon = sampleName.toLowerCase().includes('beacon') || sampleName.toLowerCase().includes('c2') || sampleName.toLowerCase().includes('rat');
    let verdict = 'MALICIOUS';
    let threatScore = 96;
    let malwareFamily = isRansomware ? 'LockBit 3.0 Ransomware' : isBeacon ? 'Cobalt Strike HTTPS Beacon' : 'Trojan.Generic.Downloader';
    let mitreTactics = isRansomware
        ? ['Defense Evasion (T1562)', 'Inhibit System Recovery (T1490)', 'Impact: Data Encrypted for Impact (T1486)']
        : ['Process Injection (T1055)', 'Command and Control (T1071)', 'Credential Dumping (T1003)'];
    const processTree = isRansomware
        ? [
            { pid: 4812, parentPid: 1024, processName: 'cmd.exe', commandLine: 'cmd.exe /c lockbit.exe --pass-shadows', integrityLevel: 'High' },
            { pid: 4816, parentPid: 4812, processName: 'vssadmin.exe', commandLine: 'vssadmin.exe delete shadows /all /quiet', integrityLevel: 'High' },
            { pid: 4820, parentPid: 4812, processName: 'wbadmin.exe', commandLine: 'wbadmin.exe delete catalog -quiet', integrityLevel: 'High' },
        ]
        : [
            { pid: 2104, parentPid: 1024, processName: 'explorer.exe', commandLine: 'C:\\Windows\\explorer.exe', integrityLevel: 'Medium' },
            { pid: 3340, parentPid: 2104, processName: 'powershell.exe', commandLine: 'powershell.exe -w hidden -enc JABzACAAPQAgAE4AZQB3...', integrityLevel: 'Medium' },
            { pid: 5124, parentPid: 3340, processName: 'rundll32.exe', commandLine: 'rundll32.exe shell32.dll,Control_RunDLL', integrityLevel: 'High' },
        ];
    const interceptedApiCalls = [
        { apiName: 'VirtualAllocEx', dll: 'KERNEL32.dll', category: 'Memory Allocation', arguments: 'AllocationType=MEM_COMMIT|MEM_RESERVE, Protect=PAGE_EXECUTE_READWRITE', threatWeight: 'CRITICAL' },
        { apiName: 'WriteProcessMemory', dll: 'KERNEL32.dll', category: 'Process Injection', arguments: 'TargetPid=5124, Bytes=65536', threatWeight: 'CRITICAL' },
        { apiName: 'CreateRemoteThread', dll: 'KERNEL32.dll', category: 'Execution', arguments: 'ThreadRoutine=0x7ffb12340000', threatWeight: 'CRITICAL' },
        { apiName: 'RegSetValueExA', dll: 'ADVAPI32.dll', category: 'Persistence', arguments: 'Key=HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', threatWeight: 'HIGH' },
        { apiName: 'InternetOpenA', dll: 'WININET.dll', category: 'C2 Communication', arguments: 'UserAgent=Mozilla/5.0 (Windows NT 10.0)', threatWeight: 'MEDIUM' },
    ];
    const networkCallbacks = [
        { destinationIp: '198.51.100.77', destinationPort: 443, protocol: 'HTTPS', domain: 'api.c2-command-gateway.net', bytesSent: 12480 },
        { destinationIp: '185.220.101.5', destinationPort: 8080, protocol: 'TCP', domain: 'relay.tor-exit-proxy.org', bytesSent: 4096 },
    ];
    const droppedFiles = [
        { filePath: 'C:\\Users\\Victim\\AppData\\Local\\Temp\\payload.dll', sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', sizeBytes: 147456 },
        { filePath: 'C:\\ProgramData\\readme_restore_files.txt', sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', sizeBytes: 1024 },
    ];
    const analysis = {
        analysisId: `sbx-${Date.now()}`,
        sampleName,
        fileHashSha256: hash,
        fileSizeBytes: 245760,
        verdict,
        threatScore,
        malwareFamily,
        detonationDurationMs: 1420,
        analyzedAt: new Date().toISOString(),
        mitreTactics,
        processTree,
        interceptedApiCalls,
        networkCallbacks,
        droppedFiles,
    };
    PAST_ANALYSES.unshift(analysis);
    return analysis;
}
function getPastSandboxAnalyses() {
    if (PAST_ANALYSES.length === 0) {
        analyzeMalwareSample('LockBit3_Payload_Sample.exe', 'a7f3c8e192bd481234567890abcdef1234567890abcdef1234567890abcdef12');
    }
    return PAST_ANALYSES;
}
