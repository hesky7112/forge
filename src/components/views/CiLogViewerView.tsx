import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Server,
  Workflow,
  HardDrive,
  FileCode,
  ArrowRight,
  Check,
  Pause,
} from 'lucide-react';
import { CiJob, CiStep } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';

interface CiLogViewerViewProps {
  ciJobs: CiJob[];
}

export const CiLogViewerView: React.FC<CiLogViewerViewProps> = ({ ciJobs }) => {
  const { addToast } = useToast();
  const [selectedJob, setSelectedJob] = useState<CiJob>(ciJobs[0]);
  const [collapsedSteps, setCollapsedSteps] = useState<Record<string, boolean>>({
    's-1': false,
    's-2': false,
    's-3': false,
    's-4': false,
    's-5': false,
  });
  const [searchLog, setSearchLog] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string>('s-4');
  const [autoscroll, setAutoscroll] = useState(true);

  const toggleStep = (stepId: string) => {
    setCollapsedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleDownloadLogs = () => {
    addToast({
      type: 'info',
      title: 'Presigned S3 URL Generated',
      description: 'Downloading raw act ANSI logs from SeaweedFS S3 bucket `forge-ci-artifacts`',
    });
  };

  const handleReRun = () => {
    setIsRunning(true);
    addToast({
      type: 'info',
      title: 'CI Runner Dispatched',
      description: 'Spinning up local act container for Matrix-Test-and-Wasm',
    });
    setTimeout(() => {
      setIsRunning(false);
      addToast({
        type: 'success',
        title: 'CI Matrix Completed',
        description: 'All 18 Wasm integration tests passed in 02:44',
      });
    }, 2000);
  };

  const artifacts = [
    { name: 'matrix-ci/runs/9842/raw_console.log', size: '142.8 KB', type: 'text/plain' },
    { name: 'matrix-ci/runs/9842/wasm_test_results.json', size: '89.4 KB', type: 'application/json' },
    { name: 'wasm/forge_auth_bg.wasm', size: '1.84 MB', type: 'application/wasm' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#07090e]">
      {/* Top Controls Bar */}
      <div className="border-b border-[#21262d] bg-[#0d1117] px-4 py-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shrink-0 text-xs">
        {/* Left: Job Info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#f85149]/15 border border-[#f85149]/30 flex items-center justify-center text-[#f85149] shrink-0">
              <Terminal size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-[#f0f6fc] leading-tight">{selectedJob.workflowName}</span>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#8b949e]">
                <span>Ref: {selectedJob.branch}</span>
                <span>·</span>
                <span>Commit: {selectedJob.commitHash}</span>
              </div>
            </div>
            <Badge variant={selectedJob.status === 'running' ? 'warning' : 'success'} subtleBox className="ml-1">
              {selectedJob.status}
            </Badge>
          </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-40 sm:w-48 lg:w-56">
            <Input
              value={searchLog}
              onChange={(e) => setSearchLog(e.target.value)}
              placeholder="Search terminal logs..."
              icon={<Search size={12} />}
              onClear={() => setSearchLog('')}
            />
          </div>

          {/* Autoscroll Toggle Button */}
          <button
            onClick={() => setAutoscroll(!autoscroll)}
            className={`h-8 px-2.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 shadow-xs ${
              autoscroll
                ? 'bg-[#21262d] text-[#3fb950] border-[#30363d]'
                : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] border-[#30363d] hover:bg-[#21262d]'
            }`}
            title={autoscroll ? 'Autoscrolling active (Click to pause)' : 'Autoscrolling paused (Click to resume)'}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${autoscroll ? 'bg-[#3fb950] animate-pulse' : 'bg-[#484f58]'}`} />
            <span className="hidden sm:inline">Autoscroll</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                autoscroll
                  ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/30'
                  : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]/60'
              }`}
            >
              {autoscroll ? 'ON' : 'OFF'}
            </span>
          </button>

          <Button
            size="sm"
            variant="secondary"
            icon={<Download size={13} />}
            onClick={handleDownloadLogs}
          >
            Download Logs (S3)
          </Button>

          <Button
            size="sm"
            variant="primary"
            loading={isRunning}
            icon={<RotateCcw size={13} />}
            onClick={handleReRun}
          >
            Re-run Workflow
          </Button>
        </div>
      </div>

      {/* Visual DAG WorkflowStepper */}
      <div className="px-4 py-2.5 bg-[#161b22] border-b border-[#21262d] overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-max">
          <div className="text-[10px] uppercase font-mono text-[#8b949e] flex items-center gap-1.5 mr-2 shrink-0">
            <Workflow size={12} className="text-[#388bfd]" />
            <span>DAG Stages:</span>
          </div>

          {selectedJob.steps.map((step, idx) => {
            const isActive = activeStepId === step.id;
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    setActiveStepId(step.id);
                    setCollapsedSteps((prev) => ({ ...prev, [step.id]: false }));
                  }}
                  className={`flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-mono transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-[#388bfd] bg-[#21262d] text-[#f0f6fc] shadow-xs ring-1 ring-[#388bfd]/30 font-semibold'
                      : 'border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                  }`}
                >
                  {step.status === 'success' && <CheckCircle2 size={13} className="text-[#3fb950]" />}
                  {step.status === 'running' && (
                    <span className="w-3 h-3 border-2 border-[#d29922] border-t-transparent rounded-full animate-spin" />
                  )}
                  {step.status === 'queued' && <span className="w-2 h-2 rounded-full bg-[#484f58]" />}

                  <span className="truncate max-w-[140px]">{step.name.split('(')[0]}</span>
                  <span className="text-[10px] text-[#8b949e] font-mono tabular-nums">{step.duration}</span>
                </button>

                {idx < selectedJob.steps.length - 1 && (
                  <ArrowRight size={12} className="text-[#8b949e] shrink-0 opacity-70" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Viewport + Artifacts Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-[#f0f6fc] space-y-3 bg-[#07090e]">
          {/* Execution Environment Card */}
          <div className="p-3 bg-[#161b22] border border-[#21262d] rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Server size={15} className="text-[#388bfd]" />
              <div>
                <div className="font-semibold text-[#f0f6fc]">Host: act-runner-worker-04 (x86_64)</div>
                <div className="text-[11px] text-[#8b949e]">
                  Image: ghcr.io/catthehacker/ubuntu:act-22.04 · SpacetimeDB Channel: ci_logs
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8b949e]">
              <span className="text-[#3fb950] font-mono">Exit Code: 0</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={13} />
                {selectedJob.duration}
              </span>
            </div>
          </div>

          {/* Workflow Steps with Terminal Logs */}
          <div className="space-y-2">
            {selectedJob.steps.map((step) => {
              const isCollapsed = collapsedSteps[step.id];
              const filteredLogs = step.logs.filter((l) =>
                l.toLowerCase().includes(searchLog.toLowerCase())
              );

              return (
                <div
                  key={step.id}
                  className={`rounded-lg border bg-[#0d1117] overflow-hidden transition-colors ${
                    activeStepId === step.id ? 'border-[#388bfd]/60' : 'border-[#21262d]'
                  }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleStep(step.id)}
                    className="px-3 py-2 bg-[#161b22] hover:bg-[#21262d] cursor-pointer flex items-center justify-between border-b border-[#21262d] select-none transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight size={14} className="text-[#8b949e]" />
                      ) : (
                        <ChevronDown size={14} className="text-[#8b949e]" />
                      )}

                      {step.status === 'success' && (
                        <CheckCircle2 size={14} className="text-[#3fb950]" />
                      )}
                      {step.status === 'running' && (
                        <span className="w-3.5 h-3.5 border-2 border-[#d29922] border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === 'queued' && (
                        <span className="w-2 h-2 rounded-full bg-[#484f58]" />
                      )}

                      <span className="font-semibold text-xs text-[#f0f6fc]">{step.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#3fb950] font-mono bg-[#238636]/10 px-1.5 py-0.5 rounded">
                        exit: 0
                      </span>
                      <span className="text-[11px] text-[#8b949e] font-mono">{step.duration}</span>
                    </div>
                  </div>

                  {/* Terminal Log Lines */}
                  {!isCollapsed && (
                    <div className="p-3 bg-[#07090e] space-y-1 text-[11px] leading-relaxed overflow-x-auto">
                      {filteredLogs.length === 0 ? (
                        <div className="text-[#484f58] italic">No matching log lines found.</div>
                      ) : (
                        filteredLogs.map((log, i) => {
                          const isSuccess = log.includes('✓') || log.includes('ok');
                          const isInfo = log.includes('[act]') || log.includes('info:');
                          const isWarning = log.includes('conflict') || log.includes('Overlap');

                          return (
                            <div
                              key={i}
                              className={`flex gap-3 ${
                                isSuccess
                                  ? 'text-[#3fb950]'
                                  : isWarning
                                  ? 'text-[#d29922]'
                                  : isInfo
                                  ? 'text-[#58a6ff]'
                                  : 'text-[#8b949e]'
                              }`}
                            >
                              <span className="text-[#8b949e]/60 select-none w-6 text-right font-mono shrink-0">
                                {i + 1}
                              </span>
                              <span>{log}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Artifacts Download List (SeaweedFS S3) */}
        <div className="w-72 border-l border-[#21262d] bg-[#0d1117] flex flex-col shrink-0 text-xs">
          <div className="p-3 border-b border-[#21262d] bg-[#161b22] flex items-center justify-between">
            <span className="font-semibold text-[#f0f6fc] flex items-center gap-1.5">
              <HardDrive size={13} className="text-[#3fb950]" />
              SeaweedFS S3 Artifacts
            </span>
            <span className="text-[10px] font-mono text-[#8b949e]">{artifacts.length} files</span>
          </div>

          <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
            <div className="text-[11px] text-[#8b949e]">
              Downloadable assets and telemetry logs automatically uploaded to SeaweedFS S3 storage
              upon step completion.
            </div>

            {artifacts.map((art, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d] hover:border-[#388bfd]/50 space-y-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate font-mono text-xs text-[#58a6ff]" title={art.name}>
                    {art.name.split('/').pop()}
                  </div>
                  <span className="text-[10px] text-[#8b949e] font-mono shrink-0">{art.size}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#21262d] text-[10px]">
                  <span className="text-[#8b949e] font-mono">{art.type}</span>
                  <button
                    onClick={() => {
                      addToast({
                        type: 'success',
                        title: 'Presigned S3 Link Generated',
                        description: `Downloading ${art.name.split('/').pop()} via SeaweedFS S3`,
                      });
                    }}
                    className="text-[#3fb950] hover:underline flex items-center gap-1 font-mono"
                  >
                    <Download size={11} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
