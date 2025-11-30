import { MapPin, Calendar, Edit2, X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ProfileImageUploader } from './ProfileImageUploader';

export function ProfileCard({ 
  profileImage, 
  userInfo, 
  isEditing, 
  onImageUpload, 
  onEditToggle 
}) {
  return (
    <Card className="p-8 border-0 shadow-xl bg-white">
      <div className="flex flex-col items-center">
        <ProfileImageUploader
          profileImage={profileImage}
          userName={userInfo.name}
          onImageUpload={onImageUpload}
        />

        <h2 className="text-2xl mb-2 text-center">{userInfo.name}</h2>
        <p className="text-gray-600 mb-6 text-center">{userInfo.email}</p>

        <div className="w-full space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{userInfo.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Member since {userInfo.memberSince}</span>
          </div>
        </div>

        <Button
          onClick={onEditToggle}
          className={`w-full ${
            isEditing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] text-white'
          } shadow-lg hover:shadow-xl transition-all duration-300`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel Editing
            </>
          ) : (
            <>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}