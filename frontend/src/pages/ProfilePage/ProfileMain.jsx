import { useState } from 'react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileCard } from '../components/profile/ProfileCard';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileInfoForm } from '../components/profile/ProfileInfoForm';
import { ProfilePreferences } from '../components/profile/ProfilePreferences';

export default function ProfilePage() {
  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop');
  const [userInfo, setUserInfo] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@voyago.com',
    location: 'San Francisco, CA',
    memberSince: 'January 2024',
    bio: 'Adventure seeker and travel enthusiast. Always looking for the next destination!',
  });

  const [editedInfo, setEditedInfo] = useState(userInfo);

  // Travel stats data
  const stats = [
    { label: 'Trips Completed', value: '12' },
    { label: 'Countries Visited', value: '8' },
    { label: 'Total Miles', value: '45,230' },
    { label: 'Travel Buddies', value: '15' },
  ];

  // Image upload handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes handler
  const handleSave = () => {
    setUserInfo(editedInfo);
    setIsEditing(false);
  };

  // Cancel editing handler
  const handleEditToggle = () => {
    if (isEditing) {
      // Revert changes if cancelling
      setEditedInfo(userInfo);
    }
    setIsEditing(!isEditing);
  };

  // Update edited info handler
  const handleInfoChange = (field, value) => {
    setEditedInfo({ ...editedInfo, [field]: value });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <ProfileHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card and Stats */}
        <div className="lg:col-span-1">
          <ProfileCard
            profileImage={profileImage}
            userInfo={userInfo}
            isEditing={isEditing}
            onImageUpload={handleImageUpload}
            onEditToggle={handleEditToggle}
          />
          <ProfileStats stats={stats} />
        </div>

        {/* Right Column - Profile Information and Preferences */}
        <div className="lg:col-span-2">
          <ProfileInfoForm
            editedInfo={editedInfo}
            isEditing={isEditing}
            onInfoChange={handleInfoChange}
            onSave={handleSave}
          />
          <ProfilePreferences />
        </div>
      </div>
    </div>
  );
}