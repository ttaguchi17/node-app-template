import { Card } from '../ui/card';

const preferences = [
  {
    title: 'Email Notifications',
    description: 'Receive updates about your trips',
    defaultChecked: true,
  },
  {
    title: 'Trip Reminders',
    description: 'Get notified before your trips',
    defaultChecked: true,
  },
  {
    title: 'Newsletter',
    description: 'Receive travel tips and inspiration',
    defaultChecked: false,
  },
];

export function ProfilePreferences() {
  return (
    <Card className="p-8 border-0 shadow-xl bg-white mt-6">
      <h2 className="text-2xl mb-6">Preferences</h2>
      <div className="space-y-4">
        {preferences.map((pref, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm mb-1">{pref.title}</p>
              <p className="text-xs text-gray-600">{pref.description}</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={pref.defaultChecked}
              className="w-5 h-5 text-[#4A6CF7] rounded focus:ring-[#4A6CF7]"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}