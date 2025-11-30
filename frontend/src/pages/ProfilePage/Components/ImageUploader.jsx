import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function ProfileImageUploader({ profileImage, userName, onImageUpload }) {
  return (
    <div className="relative group mb-6">
      <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
        <AvatarImage src={profileImage} alt={userName} />
        <AvatarFallback className="bg-gradient-to-br from-[#4A6CF7] to-[#7BA5FF] text-white text-3xl">
          {userName.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <label
        htmlFor="profile-upload"
        className="absolute bottom-0 right-0 bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] text-white p-2 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
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