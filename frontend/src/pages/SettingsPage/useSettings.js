import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, Globe, Bell, Lock, Palette, Database, Shield } from 'lucide-react';

// --- MOCK UI COMPONENTS (Simplified versions of shadcn/ui components) ---

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`}>
    {children}
  </div>
);

const Tabs = ({ children, defaultValue, value, onValueChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = useCallback((val) => {
    setActiveTab(val);
    if (onValueChange) onValueChange(val);
  }, [onValueChange]);

  const contextValue = value || activeTab;

  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab: contextValue, onTabChange: handleTabChange });
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { activeTab: contextValue });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, onTabChange, className = '' }) => (
  <div className={`flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground ${className}`}>
    {React.Children.map(children, child => {
      if (child.type === TabsTrigger) {
        return React.cloneElement(child, { activeTab, onTabChange });
      }
      return child;
    })}
  </div>
);

const TabsTrigger = ({ children, value, activeTab, onTabChange, className = '' }) => {
  const isActive = activeTab === value;
  const activeClass = isActive
    ? 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white shadow-sm'
    : 'hover:bg-gray-100';

  return (
    <button
      onClick={() => onTabChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeClass} ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, activeTab, className = '' }) => {
  if (activeTab !== value) return null;
  return <div className={`mt-2 ${className}`}>{children}</div>;
};

const Button = ({ children, onClick, variant = 'default', className = '' }) => {
  let baseClass = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2';
  let variantClass = '';

  if (variant === 'default') {
    variantClass = 'bg-primary text-primary-foreground hover:bg-primary/90';
  } else if (variant === 'outline') {
    variantClass = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
  } else if (variant === 'destructive') {
    variantClass = 'bg-red-600 text-white hover:bg-red-700';
  }

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass} ${className}`}>
      {children}
    </button>
  );
};

const Switch = ({ checked, onCheckedChange, id, className = '' }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-[#4A6CF7]' : 'bg-gray-300'} ${className}`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const Label = ({ children, htmlFor, className = '' }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);

const Select = ({ defaultValue, value, onValueChange, children, className = '' }) => {
    // In a real app, this would be complex. Here, we simplify state management.
    const [open, setOpen] = useState(false);
    const contextValue = value !== undefined ? value : defaultValue;

    return (
        <div className={`relative ${className}`}>
            <div onClick={() => setOpen(!open)}>
                {React.Children.map(children, child => {
                    if (child.type === SelectTrigger) {
                        return React.cloneElement(child, {
                            currentValue: contextValue,
                            setOpen,
                            open,
                            items: React.Children.toArray(child.props.children).filter(item => item.type === SelectValue)[0].props.placeholder
                        });
                    }
                    return null;
                })}
            </div>
            {open && (
                <div className="absolute z-10 w-full mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                    {React.Children.map(children, child => {
                        if (child.type === SelectContent) {
                            return React.Children.map(child.props.children, item => {
                                if (item.type === SelectItem) {
                                    return React.cloneElement(item, {
                                        onClick: () => {
                                            onValueChange(item.props.value);
                                            setOpen(false);
                                        },
                                        isActive: item.props.value === contextValue
                                    });
                                }
                                return null;
                            });
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

const SelectTrigger = ({ children, className = '', currentValue, setOpen, open, items }) => (
    <button
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setOpen(!open)}
    >
        {React.Children.map(children, child => {
            if (child.type === SelectValue) {
                const selected = React.Children.toArray(items).find(item => item.value === currentValue)?.children || currentValue || child.props.placeholder;
                return <span className="truncate">{selected}</span>;
            }
            return child;
        })}
        <svg className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
    </button>
);

const SelectValue = ({ placeholder }) => <>{placeholder}</>; // Placeholder component

const SelectContent = ({ children }) => <>{children}</>;

const SelectItem = ({ children, value, onClick, isActive, className = '' }) => (
    <div
        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${isActive ? 'bg-gray-100 text-primary font-semibold' : 'hover:bg-gray-50'} ${className}`}
        onClick={onClick}
    >
        {isActive && (
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
        )}
        {children}
    </div>
);

// --- COMPONENT DEFINITIONS ---

function SettingsHeader() {
  return (
    <div className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] rounded-2xl p-8 shadow-2xl">
      <div className="text-white">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-10 h-10" />
          <h1 className="text-5xl">Settings</h1>
        </div>
        <p className="text-white/90 text-lg">Customize your Voyago experience</p>
      </div>
    </div>
  );
}

function SettingsTabs() {
  return (
    <div className="border-b px-6">
      <TabsList className="bg-transparent">
        <TabsTrigger
          value="general"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Globe className="w-4 h-4 mr-2" />
          General
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Lock className="w-4 h-4 mr-2" />
          Privacy
        </TabsTrigger>
        <TabsTrigger
          value="appearance"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4A6CF7] data-[state=active]:to-[#7BA5FF] data-[state=active]:text-white"
        >
          <Palette className="w-4 h-4 mr-2" />
          Appearance
        </TabsTrigger>
      </TabsList>
    </div>
  );
}

function GeneralSettings({ generalSettings, setGeneralSettings }) {

  const handleSelectChange = (key, value) => {
    setGeneralSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving General Settings:', generalSettings);
    // Simulate API call success
    alert('General settings saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">General Settings</h3>
        <div className="space-y-4">
          
          <div className="grid gap-2">
            <Label htmlFor="language">Language</Label>
            <Select 
              value={generalSettings.language} 
              onValueChange={(val) => handleSelectChange('language', val)}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              value={generalSettings.timezone} 
              onValueChange={(val) => handleSelectChange('timezone', val)}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
                <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
                <SelectItem value="cet">Central European Time (CET)</SelectItem>
                <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateformat">Date Format</Label>
            <Select 
              value={generalSettings.dateFormat} 
              onValueChange={(val) => handleSelectChange('dateFormat', val)}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="currency">Default Currency</Label>
            <Select 
              value={generalSettings.currency} 
              onValueChange={(val) => handleSelectChange('currency', val)}
            >
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="jpy">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}


const initialNotificationOptions = [
  { key: 'email', title: 'Email Notifications', description: 'Receive email updates about your trips and events', checked: true },
  { key: 'push', title: 'Push Notifications', description: 'Get push notifications on your devices', checked: true },
  { key: 'reminders', title: 'Trip Reminders', description: 'Receive reminders before your trips start', checked: true },
  { key: 'events', title: 'Event Updates', description: 'Get notified when events are added or changed', checked: true },
  { key: 'invitations', title: 'Member Invitations', description: 'Notifications when someone invites you to a trip', checked: true },
  { key: 'newsletter', title: 'Newsletter', description: 'Monthly travel tips and destination highlights', checked: false },
  { key: 'marketing', title: 'Marketing Emails', description: 'Promotional offers and updates', checked: false },
];

function NotificationSettings({ notificationSettings, setNotificationSettings }) {

  const handleToggle = (key) => {
    setNotificationSettings(prevOptions =>
      prevOptions.map(option =>
        option.key === key ? { ...option, checked: !option.checked } : option
      )
    );
  };

  const handleSave = () => {
    console.log('Saving Notification Settings:', notificationSettings);
    // Simulate API call success
    alert('Notification preferences saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {notificationSettings.map((option) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <p className="mb-1">{option.title}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
              <Switch 
                checked={option.checked} 
                onCheckedChange={() => handleToggle(option.key)} 
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

function PrivacySettings({ privacySettings, setPrivacySettings }) {

  const handleToggle = (key) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    console.log('Saving Privacy Settings:', privacySettings);
    // Simulate API call success
    alert('Privacy settings saved successfully!');
  };

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
            <Switch 
              checked={privacySettings.profileVisibility} 
              onCheckedChange={() => handleToggle('profileVisibility')} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Show Trip History</p>
              <p className="text-sm text-gray-600">Display your past trips on your profile</p>
            </div>
            <Switch 
              checked={privacySettings.showTripHistory} 
              onCheckedChange={() => handleToggle('showTripHistory')} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <Switch 
              checked={privacySettings.twoFactorAuth} 
              onCheckedChange={() => handleToggle('twoFactorAuth')} 
            />
          </div>

          {/* Action buttons (simulating modal/external actions) */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <p className="mb-1">Change Password</p>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <Button variant="outline" className="hover:bg-white" onClick={() => alert('Change password flow initiated.')}>
              <Lock className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <p className="mb-1">Data Export</p>
              <p className="text-sm text-gray-600">Download all your data from Voyago</p>
            </div>
            <Button variant="outline" className="hover:bg-white" onClick={() => alert('Data export started. You will be notified when complete.')}>
              <Database className="w-4 h-4 mr-2" />
              Export My Data
            </Button>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="mb-3">
              <p className="text-red-800 mb-1">Delete Account</p>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" onClick={() => alert('Account deletion confirmation modal would appear here.')}>
              <Shield className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Save Security Settings
        </Button>
      </div>
    </div>
  );
}

const ACCENT_COLORS = [
    '#4A6CF7', // Blue
    '#9B59B6', // Purple
    '#5EC2E0', // Cyan
    '#2ECC71', // Green
    '#E67E22', // Orange
];


function AppearanceSettings({ appearanceSettings, setAppearanceSettings }) {

  const handleSettingChange = (key, value) => {
    setAppearanceSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving Appearance Settings:', appearanceSettings);
    // Simulate API call success
    alert('Appearance settings saved successfully!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-xl mb-4">Appearance Settings</h3>
        <div className="space-y-4">
          
          <div className="grid gap-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {['light', 'dark', 'auto'].map((theme) => (
                <button 
                  key={theme}
                  onClick={() => handleSettingChange('theme', theme)}
                  className={`p-4 border-2 rounded-lg bg-white hover:shadow-lg transition-all ${
                    appearanceSettings.theme === theme 
                    ? 'border-[#4A6CF7] shadow-xl' 
                    : 'border-gray-200'
                  }`}
                >
                  <div className={`w-full h-20 rounded mb-2 border-2 ${
                    theme === 'light' ? 'bg-white border-gray-200' :
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' :
                    'bg-gradient-to-r from-white to-gray-800 border-gray-400'
                  }`} />
                  <p className="text-sm capitalize">{theme}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Compact Mode</p>
              <p className="text-sm text-gray-600">Display more content on screen</p>
            </div>
            <Switch 
              checked={appearanceSettings.compactMode} 
              onCheckedChange={(val) => handleSettingChange('compactMode', val)} 
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <p className="mb-1">Animations</p>
              <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
            </div>
            <Switch 
              checked={appearanceSettings.animations} 
              onCheckedChange={(val) => handleSettingChange('animations', val)} 
            />
          </div>

          <div className="grid gap-2">
            <Label>Accent Color</Label>
            <div className="flex gap-3 mt-2">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleSettingChange('accentColor', color)}
                  className={`w-12 h-12 rounded-lg border-4 border-white shadow-lg transition-all`}
                  style={{ backgroundColor: color, 
                           ...(appearanceSettings.accentColor === color && { ring: `2px solid ${color}`, boxShadow: `0 0 0 3px ${color}` })
                          }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-[#4A6CF7] to-[#7BA5FF] shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Save Appearance
        </Button>
      </div>
    </div>
  );
}


// --- MAIN APP COMPONENT ---

const initialGeneral = {
  language: 'en',
  timezone: 'pst',
  dateFormat: 'mdy',
  currency: 'usd',
};

const initialPrivacy = {
  profileVisibility: true,
  showTripHistory: true,
  twoFactorAuth: false,
};

const initialAppearance = {
  theme: 'light',
  compactMode: false,
  animations: true,
  accentColor: '#4A6CF7',
};

export default function App() {
  // Global State for all setting categories
  const [generalSettings, setGeneralSettings] = useState(initialGeneral);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationOptions);
  const [privacySettings, setPrivacySettings] = useState(initialPrivacy);
  const [appearanceSettings, setAppearanceSettings] = useState(initialAppearance);

  // You can optionally add a useEffect to simulate loading data from a server here:
  /*
  useEffect(() => {
    // Simulated data fetch
    const fetchSettings = () => {
      // API call...
      // setGeneralSettings(fetchedGeneralData);
      // setNotificationSettings(fetchedNotificationData);
      // ...
    };
    fetchSettings();
  }, []);
  */

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <style>{`
        .font-sans {
          font-family: Inter, sans-serif;
        }
      `}</style>
      
      {/* Header */}
      <SettingsHeader />

      <Card className="border-0 shadow-xl bg-white mt-8 max-w-4xl mx-auto">
        <Tabs defaultValue="general" className="w-full">
          {/* Tab Navigation */}
          <SettingsTabs />

          {/* General Settings Tab */}
          <TabsContent value="general">
            <GeneralSettings 
              generalSettings={generalSettings} 
              setGeneralSettings={setGeneralSettings} 
            />
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications">
            <NotificationSettings 
              notificationSettings={notificationSettings} 
              setNotificationSettings={setNotificationSettings} 
            />
          </TabsContent>

          {/* Privacy Settings Tab */}
          <TabsContent value="privacy">
            <PrivacySettings 
              privacySettings={privacySettings} 
              setPrivacySettings={setPrivacySettings} 
            />
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance">
            <AppearanceSettings 
              appearanceSettings={appearanceSettings} 
              setAppearanceSettings={setAppearanceSettings} 
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}