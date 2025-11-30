import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';

export function AppearanceSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">Appearance Settings</h3>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <button className="p-4 border-2 border-[#4A6CF7] rounded-lg bg-white hover:shadow-lg transition-all">
                <div className="w-full h-20 bg-white border-2 border-gray-200 rounded mb-2" />
                <p className="text-sm">Light</p>
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:shadow-lg transition-all">
                <div className="w-full h-20 bg-gray-800 border-2 border-gray-700 rounded mb-2" />
                <p className="text-sm">Dark</p>
              </button>
              <button className="p-4 border-2 border-gray-200 rounded-lg bg-white hover:shadow-lg transition-all">
                <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 border-2 border-gray-400 rounded mb-2" />
                <p className="text-sm">Auto</p>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Compact Mode</p>
              <p className="text-sm text-gray-600">Display more content on screen</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Animations</p>
              <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="grid gap-2">
            <Label>Accent Color</Label>
            <div className="flex gap-3 mt-2">
              <button className="w-12 h-12 rounded-lg bg-[#4A6CF7] border-4 border-white shadow-lg ring-2 ring-[#4A6CF7]" />
              <button className="w-12 h-12 rounded-lg bg-purple-500 border-4 border-white shadow-lg hover:ring-2 hover:ring-purple-500 transition-all" />
              <button className="w-12 h-12 rounded-lg bg-[#5EC2E0] border-4 border-white shadow-lg hover:ring-2 hover:ring-[#5EC2E0] transition-all" />
              <button className="w-12 h-12 rounded-lg bg-green-500 border-4 border-white shadow-lg hover:ring-2 hover:ring-green-500 transition-all" />
              <button className="w-12 h-12 rounded-lg bg-orange-500 border-4 border-white shadow-lg hover:ring-2 hover:ring-orange-500 transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300">
          Save Appearance
        </Button>
      </div>
    </div>
  );
}