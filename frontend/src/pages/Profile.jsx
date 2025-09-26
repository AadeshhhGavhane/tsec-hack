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
      <div className="h-full p-4 space-y-6 overflow-y-auto" style={{ backgroundColor: 'var(--gray-light)' }}>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-3 uppercase tracking-wider">Profile Settings</h1>
        <p className="text-black font-bold text-base">Manage your account information and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="brutal-card p-4">
          <div className="flex items-center gap-4 pb-4 mb-4 brutal-border-b-3">
            <div className="w-16 h-16 bg-orange-500 brutal-border brutal-shadow flex items-center justify-center">
              <User size={32} className="text-black font-bold" />
            </div>
            <div>
              <h2 className="text-lg font-black text-black uppercase tracking-wide">{user?.name}</h2>
              <p className="text-black font-bold text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-black font-bold">
                <Calendar size={16} />
                <span>Member since {new Date(user?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-black text-black uppercase tracking-wide">Account Information</h3>
              {!isEditing && (
                <button 
                  className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce inline-flex items-center gap-2 text-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            {message && (
              <div className={`px-4 py-3 brutal-card text-sm font-bold ${message.includes('success') ? 'bg-green-50 dark:bg-green-100 text-black' : 'bg-red-50 dark:bg-red-100 text-black'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-black text-black uppercase tracking-wide inline-flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 brutal-input font-bold focus-ring text-sm"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-black text-black uppercase tracking-wide inline-flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 brutal-input font-bold focus-ring text-sm"
                  disabled={!isEditing}
                  required
                />
              </div>

              {isEditing && (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-white text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce disabled:opacity-50 text-sm w-full sm:w-auto"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce inline-flex items-center gap-2 disabled:opacity-50 text-sm w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="w-4 h-4 bg-orange-500 brutal-border brutal-shadow animate-brutal-pulse"></div>
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
          <div className="brutal-card p-4 bg-green-50 dark:bg-green-100">
            <div className="text-sm font-black text-black uppercase tracking-wide">Account Status</div>
            <div className="mt-1 text-lg font-black text-green-600">Active</div>
          </div>
          <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
            <div className="text-sm font-black text-black uppercase tracking-wide">Last Login</div>
            <div className="mt-1 text-lg font-black text-black">Just now</div>
          </div>
          <div className="brutal-card p-4 bg-orange-50 dark:bg-orange-100">
            <div className="text-sm font-black text-black uppercase tracking-wide">Account Type</div>
            <div className="mt-1 text-lg font-black text-black">Standard</div>
          </div>
        </div>

        <div className="brutal-card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2">
              <KeySquare size={20} className="text-black font-bold" />
              <h3 className="text-lg font-black text-black uppercase tracking-wide">Security: Passkeys</h3>
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
            }} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-black font-black uppercase tracking-wide brutal-button brutal-shadow-hover animate-brutal-bounce text-sm"><Plus size={16} /> Add Passkey</button>
          </div>
          {passkeyMsg && <div className="text-sm font-bold text-black mb-3">{passkeyMsg}</div>}
          <p className="text-sm font-bold text-black">Add a passkey to sign in with Face/Touch ID or Windows Hello.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
