import { User } from 'lucide-react';

export function ProfileHeader() {
  return (
    <div className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] rounded-2xl p-8 shadow-2xl">
      <div className="text-white">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-10 h-10" />
          <h1 className="text-5xl">My Profile</h1>
        </div>
        <p className="text-white/90 text-lg">Manage your account settings and preferences</p>
      </div>
    </div>
  );
}
