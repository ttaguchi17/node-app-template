import { Globe, Bell, Lock, Palette } from 'lucide-react';
import { TabsList, TabsTrigger } from '../ui/tabs';

export function SettingsTabs() {
  return (
    <div className="border-b px-6">
      <TabsList className="bg-transparent">
        <TabsTrigger
          value="general"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Globe className="w-4 h-4 mr-2" />
          General
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Lock className="w-4 h-4 mr-2" />
          Privacy
        </TabsTrigger>
        <TabsTrigger
          value="appearance"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Palette className="w-4 h-4 mr-2" />
          Appearance
        </TabsTrigger>
      </TabsList>
    </div>
  );
}