import React, { useState } from 'react';
import { Key, Server, Database, Shield, Check, Copy, Palette, Sun, Moon, Contrast } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';
import { useTheme } from '../../context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'ssh' | 'endpoints' | 'auth' | 'appearance'>('appearance');

  const [sshKey, setSshKey] = useState(
    'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGe8v9zR50cQ4uPZ+4vU9z5q7Q8a2J9f4n5k6L7m8p9q developer@forge.internal'
  );
  const [spacetimeUrl, setSpacetimeUrl] = useState('wss://spacetimedb.forge.internal/v1');
  const [seaweedUrl, setSeaweedUrl] = useState('https://s3.seaweedfs.forge.internal/artifacts');
  const [authProfile, setAuthProfile] = useState('Alex Vance (alex.vance@forge.dev)');

  const handleCopySsh = () => {
    navigator.clipboard.writeText(sshKey);
    addToast({
      type: 'info',
      title: 'SSH Key Copied',
      description: 'Ed25519 public key copied to clipboard for Russh gateway authentication',
    });
  };

  const handleSave = () => {
    addToast({
      type: 'success',
      title: 'Settings Saved',
      description: 'Updated endpoints and Russh credentials in local secure keychain',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forge Client Preferences"
      description="Tauri v2 / SvelteKit configuration & Russh Gateway credentials"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#21262d] gap-2 pb-2">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'appearance' ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Palette size={14} className="text-[#d29922]" />
            <span>Appearance & Theme</span>
          </button>
          <button
            onClick={() => setActiveTab('ssh')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ssh' ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Key size={14} className="text-[#388bfd]" />
            <span>Russh SSH Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'endpoints' ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Server size={14} className="text-[#3fb950]" />
            <span>Remote Gateways</span>
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'auth' ? 'bg-[#21262d] text-[#f0f6fc]' : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Shield size={14} className="text-[#a371f7]" />
            <span>OIDC Profile</span>
          </button>
        </div>

        {activeTab === 'appearance' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                Interface Color Scheme
              </label>
              <p className="text-[11px] text-[#8b949e] mb-3">
                Choose between the deep space dark slate cockpit, crisp PocketBase-inspired light studio, or pure pitch black OLED theme.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Dark Cockpit */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    theme === 'dark'
                      ? 'border-[#388bfd] bg-[#161b22] ring-1 ring-[#388bfd]'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                      <Moon size={14} className="text-[#388bfd]" />
                      Dark Cockpit
                    </span>
                    {theme === 'dark' && <Check size={14} className="text-[#388bfd]" />}
                  </div>
                  <div className="h-10 rounded border border-[#30363d] bg-[#07090e] p-1.5 flex gap-1">
                    <div className="w-2 h-full rounded bg-[#0d1117]" />
                    <div className="flex-1 h-full rounded bg-[#161b22] flex items-center px-1">
                      <div className="w-8 h-1.5 rounded bg-[#388bfd]" />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#8b949e] mt-2">
                    High contrast dark slate for low-light developer workflows.
                  </span>
                </button>

                {/* 2. PocketBase Light */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    theme === 'light'
                      ? 'border-[#0969da] bg-[#ffffff] ring-1 ring-[#0969da] shadow-sm'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-[#1f2328] flex items-center gap-1.5">
                      <Sun size={14} className="text-[#d29922]" />
                      PocketBase Light
                    </span>
                    {theme === 'light' && <Check size={14} className="text-[#0969da]" />}
                  </div>
                  <div className="h-10 rounded border border-[#d0d7de] bg-[#f6f8fa] p-1.5 flex gap-1">
                    <div className="w-2 h-full rounded bg-[#ffffff] border border-[#d0d7de]" />
                    <div className="flex-1 h-full rounded bg-[#ffffff] border border-[#d0d7de] flex items-center px-1">
                      <div className="w-8 h-1.5 rounded bg-[#0969da]" />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#57606a] mt-2">
                    Clean, high-legibility light theme for daytime and reviews.
                  </span>
                </button>

                {/* 3. OLED True Black */}
                <button
                  type="button"
                  onClick={() => setTheme('oled')}
                  className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    theme === 'oled'
                      ? 'border-[#ffffff] bg-[#050505] ring-1 ring-[#ffffff]'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-[#8b949e]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-[#ffffff] flex items-center gap-1.5">
                      <Contrast size={14} className="text-[#ffffff]" />
                      OLED True Black
                    </span>
                    {theme === 'oled' && <Check size={14} className="text-[#ffffff]" />}
                  </div>
                  <div className="h-10 rounded border border-[#222222] bg-[#000000] p-1.5 flex gap-1">
                    <div className="w-2 h-full rounded bg-[#000000] border border-[#1a1a1a]" />
                    <div className="flex-1 h-full rounded bg-[#080808] border border-[#1a1a1a] flex items-center px-1">
                      <div className="w-8 h-1.5 rounded bg-[#388bfd]" />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#9e9e9e] mt-2">
                    0% RGB #000000 true pitch black for OLED panels & battery life.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ssh' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                Russh Gateway Ed25519 Public Key
              </label>
              <p className="text-[11px] text-[#8b949e] mb-2">
                Used to sign Git packfile push operations and authenticate concurrent virtual branch heads.
              </p>
              <textarea
                value={sshKey}
                onChange={(e) => setSshKey(e.target.value)}
                rows={3}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-md p-2.5 font-mono text-[11px] text-[#58a6ff] focus:outline-none focus:border-[#388bfd]"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-[#3fb950] font-mono flex items-center gap-1">
                <Check size={13} />
                Key loaded from OS Keychain (Keychain Access / Secret Service)
              </span>
              <Button size="xs" variant="secondary" icon={<Copy size={12} />} onClick={handleCopySsh}>
                Copy Key
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'endpoints' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                SpacetimeDB WebSocket URL
              </label>
              <Input
                value={spacetimeUrl}
                onChange={(e) => setSpacetimeUrl(e.target.value)}
                icon={<Database size={13} className="text-[#388bfd]" />}
              />
              <span className="text-[10px] text-[#8b949e] mt-1 block">
                Broadcasts cursor positions, reviews, and virtual branch state.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                SeaweedFS S3 Storage Endpoint
              </label>
              <Input
                value={seaweedUrl}
                onChange={(e) => setSeaweedUrl(e.target.value)}
                icon={<Server size={13} className="text-[#3fb950]" />}
              />
              <span className="text-[10px] text-[#8b949e] mt-1 block">
                Direct presigned URL downloads for `graph.json` and raw act CI logs.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#f0f6fc] block mb-1">
                Active Developer Identity
              </label>
              <Input value={authProfile} onChange={(e) => setAuthProfile(e.target.value)} />
            </div>
            <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-md space-y-1 text-xs">
              <div className="text-[#f0f6fc] font-semibold">OIDC Token Status</div>
              <div className="text-[#3fb950] font-mono text-[11px]">Valid until: 2026-10-15 00:00 UTC (Active)</div>
              <div className="text-[#8b949e] text-[11px]">Issuer: https://auth.forge.internal/realms/engineering</div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
