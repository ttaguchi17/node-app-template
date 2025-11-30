import { Button } from '../ui/button';
import { Switch } from '../ui/switch';

// The NotificationOption interface and notificationOptions array can be simplified
// in pure JavaScript by removing the type declarations.

const notificationOptions = [
  {
    title: 'Email Notifications',
    description: 'Receive email updates about your trips and events',
    defaultChecked: true,
  },
  {
    title: 'Push Notifications',
    description: 'Get push notifications on your devices',
    defaultChecked: true,
  },
  {
    title: 'Trip Reminders',
    description: 'Receive reminders before your trips start',
    defaultChecked: true,
  },
  {
    title: 'Event Updates',
    description: 'Get notified when events are added or changed',
    defaultChecked: true,
  },
  {
    title: 'Member Invitations',
    description: 'Notifications when someone invites you to a trip',
    defaultChecked: true,
  },
  {
    title: 'Newsletter',
    description: 'Monthly travel tips and destination highlights',
    defaultChecked: false,
  },
  {
    title: 'Marketing Emails',
    description: 'Promotional offers and updates',
    defaultChecked: false,
  },
];

export function NotificationSettings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {notificationOptions.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="mb-1">{option.title}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
              <Switch defaultChecked={option.defaultChecked} />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}