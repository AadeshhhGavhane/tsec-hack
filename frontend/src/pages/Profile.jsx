import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, Edit3, KeySquare, Plus } from 'lucide-react';
import { passkeysAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passkeyMsg, setPasskeyMsg] = useState('');

  const b64urlToBytes = (b64url) => {
    const pad = (str) => str + '==='.slice((str.length + 3) % 4);
    const b64 = pad(String(b64url).replace(/-/g, '+').replace(/_/g, '/'));
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="h-full p-6 space-y-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar size={16} />
                <span>Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h3>
              {!isEditing && (
                <button 
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm inline-flex items-center gap-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!isEditing}
                  required
                />
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Account Status</div>
            <div className="mt-1 font-semibold text-green-600 dark:text-green-400">Active</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Last Login</div>
            <div className="mt-1 font-semibold text-gray-900 dark:text-white">Just now</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Account Type</div>
            <div className="mt-1 font-semibold text-gray-900 dark:text-white">Standard</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2">
              <KeySquare size={18} className="text-gray-700 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security: Passkeys</h3>
            </div>
            <button onClick={async ()=>{
              try {
                setPasskeyMsg('');
                const begin = await passkeysAPI.beginRegister();
                if (!begin.success) return setPasskeyMsg(begin.message||'Failed to start');
                const pub = begin.data.options.publicKey;
                const cred = await navigator.credentials.create({ publicKey: {
                  ...pub,
                  challenge: b64urlToBytes(pub.challenge),
                  user: { ...pub.user, id: b64urlToBytes(pub.user.id) }
                }});
                const attObj = cred.response.attestationObject ? btoa(String.fromCharCode(...new Uint8Array(cred.response.attestationObject))) : undefined;
                const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(cred.response.clientDataJSON)));
                const finish = await passkeysAPI.finishRegister({ id: cred.id, rawId: cred.id, type: cred.type, response: { attestationObject: attObj, clientDataJSON } });
                if (!finish.success) setPasskeyMsg(finish.message||'Failed to add passkey'); else setPasskeyMsg('Passkey added');
              } catch (e) { setPasskeyMsg('Passkey not supported or cancelled'); }
            }} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"><Plus size={14} /> Add Passkey</button>
          </div>
          {passkeyMsg && <div className="text-sm text-gray-700 dark:text-gray-300">{passkeyMsg}</div>}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Add a passkey to sign in with Face/Touch ID or Windows Hello.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
