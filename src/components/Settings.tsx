import React from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Key,
  Save,
  Check
} from 'lucide-react';
import { Card, Button } from './ui/Common';

interface SettingsProps {
  user: any;
}

export default function Settings({ user }: SettingsProps) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account, preferences, and API configurations.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Profile Information</h3>
              <p className="text-sm text-gray-500">Update your personal details and avatar.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Display Name</label>
              <input 
                type="text" 
                defaultValue={user?.displayName || ''}
                className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Email Address</label>
              <input 
                type="email" 
                disabled
                defaultValue={user?.email || ''}
                className="w-full px-4 py-3 bg-gray-100 border border-black/5 rounded-xl outline-none text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        {/* API Configuration */}
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Key className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">API Configuration</h3>
              <p className="text-sm text-gray-500">Manage your Gemini and external service keys.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-gray-500">Gemini API Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  defaultValue="••••••••••••••••"
                  disabled
                  className="w-full pl-4 pr-12 py-3 bg-gray-100 border border-black/5 rounded-xl outline-none text-gray-500"
                />
                <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-400 italic">Managed via AI Studio Secrets Panel.</p>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Choose how you want to be notified of market changes.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Email Alerts', desc: 'Receive daily summaries of competitor activity.' },
              { label: 'Real-time Push', desc: 'Get notified instantly when a price change is detected.' },
              { label: 'Weekly Reports', desc: 'Receive a comprehensive market intelligence report every Monday.' },
            ].map((pref, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold">{pref.label}</p>
                  <p className="text-xs text-gray-500">{pref.desc}</p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            size="lg" 
            className="px-12" 
            onClick={handleSave}
            isLoading={saving}
          >
            {saved ? <Check className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {saved ? 'Settings Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
