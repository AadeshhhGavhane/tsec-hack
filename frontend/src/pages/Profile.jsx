import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, Edit3 } from 'lucide-react';
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
    <div className="profile">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              <h2>{user?.name}</h2>
              <p>{user?.email}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <Calendar size={16} />
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="form-header">
              <h3>Account Information</h3>
              {!isEditing && (
                <button 
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  disabled={!isEditing}
                  required
                />
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner-small"></div>
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

        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-label">Account Status</div>
            <div className="stat-value active">Active</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Last Login</div>
            <div className="stat-value">Just now</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Account Type</div>
            <div className="stat-value">Standard</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
