import { Card } from '../components/ui/card';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { SettingsHeader } from '../components/settings/SettingsHeader';
import { SettingsTabs } from '../components/settings/SettingsTabs';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { PrivacySettings } from '../components/settings/PrivacySettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <SettingsHeader />

      <Card className="border-0 shadow-xl bg-white">
        <Tabs defaultValue="general" className="w-full">
          {/* Tab Navigation */}
          <SettingsTabs />

          {/* General Settings Tab */}
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
