import { Save } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function ProfileInfoForm({ 
  editedInfo, 
  isEditing, 
  onInfoChange, 
  onSave 
}) {
  return (
    <Card className="p-8 border-0 shadow-xl bg-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">Profile Information</h2>
        {isEditing && (
          <Button
            onClick={onSave}
            className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={editedInfo.name}
            onChange={(e) => onInfoChange('name', e.target.value)}
            disabled={!isEditing}
            className={`${
              isEditing
                ? 'border-[#4A6CF7] focus:ring-[#4A6CF7]'
                : 'bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={editedInfo.email}
            onChange={(e) => onInfoChange('email', e.target.value)}
            disabled={!isEditing}
            className={`${
              isEditing
                ? 'border-[#4A6CF7] focus:ring-[#4A6CF7]'
                : 'bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={editedInfo.location}
            onChange={(e) => onInfoChange('location', e.target.value)}
            disabled={!isEditing}
            className={`${
              isEditing
                ? 'border-[#4A6CF7] focus:ring-[#4A6CF7]'
                : 'bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={editedInfo.bio}
            onChange={(e) => onInfoChange('bio', e.target.value)}
            disabled={!isEditing}
            rows={4}
            className={`w-full rounded-md border px-3 py-2 text-sm ${
              isEditing
                ? 'border-[#4A6CF7] focus:ring-[#4A6CF7] focus:outline-none focus:ring-2'
                : 'bg-gray-50 cursor-not-allowed border-gray-200'
            }`}
          />
        </div>

        {isEditing && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes will be saved when you click the "Save Changes" button.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}