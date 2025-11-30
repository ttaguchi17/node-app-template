import React, { useState, useCallback } from 'react';
import { User, MapPin, Calendar, Edit2, X, Save, Camera, Mail, Globe, BookOpen } from 'lucide-react';

// --- UI Components (Simulated ShadCN/Tailwind Elements) ---

// Dummy Card component
const Card = ({ children, className }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow-lg ${className}`}>
    {children}
  </div>
);

// Dummy Button component
const Button = ({ children, onClick, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors h-10 px-4 py-2 
      ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
  >
    {children}
  </button>
);

// Dummy Input component
const Input = ({ id, type = 'text', value, onChange, disabled, className }) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
      file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground 
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
      disabled:cursor-not-allowed ${className}`}
  />
);

// Dummy Label component
const Label = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {children}
  </label>
);

// Avatar Components (Simplified)
const Avatar = ({ children, className }) => (
  <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);
const AvatarImage = ({ src, alt }) => <img src={src} alt={alt} className="aspect-square h-full w-full object-cover" />;
const AvatarFallback = ({ children, className }) => (
  <div className={`flex h-full w-full items-center justify-center bg-muted ${className}`}>
    {children}
  </div>
);

// --- Profile Components ---

function ProfileHeader() {
  return (
    <div className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] rounded-2xl p-8 shadow-2xl">
      <div className="text-white">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-10 h-10" />
          <h1 className="text-5xl font-extrabold tracking-tight">My Profile</h1>
        </div>
        <p className="text-white/90 text-lg">Manage your account settings and preferences</p>
      </div>
    </div>
  );
}

function ProfileStats({ stats }) {
  return (
    <Card className="p-6 border-0 shadow-xl bg-gradient-to-br from-[#4A6CF7] to-[#7BA5FF] mt-6">
      <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
        <Globe className="w-5 h-5" /> Travel Stats
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center transition-transform hover:scale-[1.02]"
          >
            <p className="text-white text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-white/80 text-sm font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProfileImageUploader({ profileImage, userName, onImageUpload }) {
  const initials = userName.split(' ').map(n => n[0]).join('');

  return (
    <div className="relative group mb-6">
      <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
        <AvatarImage src={profileImage} alt={userName} />
        <AvatarFallback className="bg-gradient-to-br from-[#4A6CF7] to-[#7BA5FF] text-white text-3xl">
          {initials}
        </AvatarFallback>
      </Avatar>
      <label
        htmlFor="profile-upload"
        className="absolute bottom-0 right-0 bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] text-white p-3 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border-2 border-white"
      >
        <Camera className="w-4 h-4" />
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImageUpload}
        />
      </label>
    </div>
  );
}

function ProfileCard({ profileImage, userInfo, isEditing, onImageUpload, onEditToggle }) {
  return (
    <Card className="p-8 border-0 shadow-xl bg-white h-fit">
      <div className="flex flex-col items-center">
        <ProfileImageUploader
          profileImage={profileImage}
          userName={userInfo.name}
          onImageUpload={onImageUpload}
        />

        <h2 className="text-3xl font-bold mb-2 text-center">{userInfo.name}</h2>
        <p className="text-gray-600 mb-6 text-center flex items-center gap-1">
            <Mail className="w-4 h-4 text-[#4A6CF7]" />
            {userInfo.email}
        </p>

        <div className="w-full space-y-3 mb-8 border-t pt-4">
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="text-sm">{userInfo.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Member since {userInfo.memberSince}</span>
          </div>
          <div className="flex items-start gap-3 text-gray-700 pt-4">
            <BookOpen className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
            <p className="text-sm italic">{userInfo.bio}</p>
          </div>
        </div>

        <Button
          onClick={onEditToggle}
          className={`w-full font-semibold transition-colors duration-200 ${
            isEditing
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
              : 'bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] text-white shadow-xl hover:from-[#3A5CDC] hover:to-[#6AA5FF]'
          }`}
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

function ProfileInfoForm({ editedInfo, isEditing, onInfoChange, onSave }) {
  return (
    <Card className="p-8 border-0 shadow-xl bg-white">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-semibold">Profile Details</h2>
        {isEditing && (
          <Button
            onClick={onSave}
            disabled={!editedInfo.name || !editedInfo.email} // Basic validation
            className="bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all duration-300"
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
                : 'bg-gray-50 cursor-not-allowed border-gray-200'
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
                : 'bg-gray-50 cursor-not-allowed border-gray-200'
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
                : 'bg-gray-50 cursor-not-allowed border-gray-200'
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
            className={`w-full rounded-md border px-3 py-2 text-sm transition-all ${
              isEditing
                ? 'border-[#4A6CF7] focus:ring-[#4A6CF7] focus:outline-none focus:ring-2'
                : 'bg-gray-50 cursor-not-allowed border-gray-200'
            }`}
          />
        </div>

        {isEditing && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <p className="text-blue-800">
              <strong>Tip:</strong> Click "Save Changes" to finalize updates or "Cancel Editing" on the left to revert.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

const preferencesData = [
  {
    title: 'Email Notifications',
    description: 'Receive updates about your trips and bookings.',
    key: 'emailNotifications',
    defaultChecked: true,
  },
  {
    title: 'Trip Reminders',
    description: 'Get notified 24 hours before your scheduled trips.',
    key: 'tripReminders',
    defaultChecked: true,
  },
  {
    title: 'Newsletter Subscription',
    description: 'Receive monthly travel tips and inspiration.',
    key: 'newsletter',
    defaultChecked: false,
  },
];

function ProfilePreferences() {
  const [preferences, setPreferences] = useState(
    preferencesData.reduce((acc, pref) => ({ ...acc, [pref.key]: pref.defaultChecked }), {})
  );

  const handlePreferenceChange = useCallback((key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  return (
    <Card className="p-8 border-0 shadow-xl bg-white mt-6">
      <h2 className="text-2xl font-semibold mb-6 border-b pb-4">Preferences</h2>
      <div className="space-y-4">
        {preferencesData.map((pref, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-shadow hover:shadow-md border border-gray-100">
            <div>
              <p className="text-base font-medium mb-1">{pref.title}</p>
              <p className="text-xs text-gray-600">{pref.description}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences[pref.key]}
              onChange={() => handlePreferenceChange(pref.key)}
              className="w-5 h-5 text-[#4A6CF7] bg-white border-gray-300 rounded focus:ring-2 focus:ring-[#4A6CF7] cursor-pointer"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// --- Main App Component ---

const initialUserInfo = {
  name: 'Alex Johnson',
  email: 'alex.johnson@voyago.com',
  location: 'San Francisco, CA',
  memberSince: 'January 2024',
  bio: 'Adventure seeker and travel enthusiast. Always looking for the next destination!',
};

const initialStats = [
  { label: 'Trips Completed', value: '12' },
  { label: 'Countries Visited', value: '8' },
  { label: 'Total Miles', value: '45,230' },
  { label: 'Travel Buddies', value: '15' },
];

export default function App() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState('https://placehold.co/128x128/4A6CF7/FFFFFF?text=AJ');
  const [userInfo, setUserInfo] = useState(initialUserInfo);
  const [editedInfo, setEditedInfo] = useState(initialUserInfo);

  // Memoized handlers for stability and performance
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(() => {
    setUserInfo(editedInfo);
    setIsEditing(false);
    // In a real app, this is where you'd call an API to persist data
    console.log('Saved profile changes:', editedInfo);
  }, [editedInfo]);

  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Revert edited changes when canceling
      setEditedInfo(userInfo);
    }
    setIsEditing(prev => !prev);
  }, [isEditing, userInfo]);

  const handleInfoChange = useCallback((field, value) => {
    setEditedInfo(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      {/* Header */}
      <ProfileHeader />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
        {/* Left Column - Profile Card and Stats */}
        <div className="lg:col-span-1 space-y-8">
          <ProfileCard
            profileImage={profileImage}
            userInfo={userInfo}
            isEditing={isEditing}
            onImageUpload={handleImageUpload}
            onEditToggle={handleEditToggle}
          />
          <ProfileStats stats={initialStats} />
        </div>

        {/* Right Column - Profile Information and Preferences */}
        <div className="lg:col-span-2 space-y-8">
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
