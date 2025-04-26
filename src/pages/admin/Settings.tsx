import React from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { 
  Store, 
  CreditCard, 
  Bell, 
  Mail, 
  Printer, 
  Shield, 
  Smartphone,
  Save,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface EmailSettings {
  id?: string;
  adminEmail: string;
  businessInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  notifications: {
    logins: boolean;
    transactions: boolean;
    inventory: boolean;
  };
}

const Settings: React.FC = () => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    id: undefined,
    adminEmail: 'admin@decube.com',
    businessInfo: {
      name: 'DECUBE Bar & Restaurant',
      email: 'contact@decube.com',
      phone: '+1 (555) 123-4567',
      address: '123 Restaurant Street'
    },
    notifications: {
      logins: true,
      transactions: true,
      inventory: true
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: existingSettings, error: fetchError } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (fetchError) throw fetchError;

      setEmailSettings({
        id: existingSettings.id,
        adminEmail: existingSettings.admin_email,
        businessInfo: existingSettings.business_info,
        notifications: existingSettings.notifications
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSaveError('Failed to load settings');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSettings(prev => ({
      ...prev,
      adminEmail: e.target.value
    }));
  };

  const handleBusinessInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        [name]: value
      }
    }));
  };

  const handleNotificationToggle = (type: keyof EmailSettings['notifications']) => {
    setEmailSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Always update the existing row
      const { error } = await supabase
        .from('settings')
        .update({
          admin_email: emailSettings.adminEmail,
          business_info: emailSettings.businessInfo,
          notifications: emailSettings.notifications
        })
        .eq('id', emailSettings.id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSaveError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Business Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Store size={24} className="text-teal-600 dark:text-teal-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Business Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={emailSettings.businessInfo.name}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={emailSettings.businessInfo.email}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={emailSettings.businessInfo.phone}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={emailSettings.businessInfo.address}
                  onChange={handleBusinessInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <CreditCard size={24} className="text-teal-600 dark:text-teal-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-teal-600" defaultChecked />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Accept Cash</span>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400">Configure</button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-teal-600" defaultChecked />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Accept Credit Cards</span>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400">Configure</button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-teal-600" defaultChecked />
                  <span className="ml-3 text-gray-700 dark:text-gray-300">Accept Digital Payments</span>
                </div>
                <button className="text-sm text-teal-600 dark:text-teal-400">Configure</button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Bell size={24} className="text-teal-600 dark:text-teal-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                value={emailSettings.adminEmail}
                onChange={handleEmailChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="admin@example.com"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All notifications will be sent to this email address
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.notifications.logins}
                  onChange={() => handleNotificationToggle('logins')}
                  className="h-4 w-4 text-teal-600 rounded"
                />
                <Mail size={16} className="ml-3 mr-2 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Staff Login Notifications</span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.notifications.transactions}
                  onChange={() => handleNotificationToggle('transactions')}
                  className="h-4 w-4 text-teal-600 rounded"
                />
                <CreditCard size={16} className="ml-3 mr-2 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Transaction Notifications</span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={emailSettings.notifications.inventory}
                  onChange={() => handleNotificationToggle('inventory')}
                  className="h-4 w-4 text-teal-600 rounded"
                />
                <AlertCircle size={16} className="ml-3 mr-2 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Low Inventory Alerts</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Shield size={24} className="text-teal-600 dark:text-teal-500 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
            </div>
            
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Change Password</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Update your account password</div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</div>
              </button>
              
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">API Keys</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Manage API access</div>
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 bg-gray-50 dark:bg-gray-700">
            {saveError && (
              <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-200">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 border border-green-200">
                Settings saved successfully!
              </div>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save size={20} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;