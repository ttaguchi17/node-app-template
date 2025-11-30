import { Settings as SettingsIcon } from 'lucide-react';

export function SettingsHeader() {
  return (
    <div className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] rounded-2xl p-8 shadow-2xl">
      <div className="text-white">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-10 h-10" />
          <h1 className="text-5xl">Settings</h1>
        </div>
        <p className="text-white/90 text-lg">Customize your Voyago experience</p>
      </div>
    </div>
  );
}