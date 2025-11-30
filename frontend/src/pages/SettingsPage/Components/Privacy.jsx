import { Lock, Database, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

export function PrivacySettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">Privacy & Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Profile Visibility</p>
              <p className="text-sm text-gray-600">Make your profile visible to other users</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Show Trip History</p>
              <p className="text-sm text-gray-600">Display your past trips on your profile</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <Switch />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <p className="mb-1">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <Button variant="outline" className="hover:bg-white">
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <p className="mb-1">Data Export</p>
              <p className="text-sm text-gray-600">Download all your data from Voyago</p>
            </div>
            <Button variant="outline" className="hover:bg-white">
              <Database className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="mb-3">
              <p className="text-red-800 mb-1">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive">
              <Shield className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}