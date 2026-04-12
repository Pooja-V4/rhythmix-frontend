import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Music2, ListMusic, Heart,
  Edit2, Lock, Trash2, Check, X, Loader2
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../api/axios';
import { getUserId, isLoggedIn, clearUserId, getUserName } from '../lib/auth';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile(Number(userId));
      setProfile(res.data);
      setNewName(res.data.name);
    } catch (err) {
      console.error(err);
      toast.error('Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(Number(userId), { name: newName });
      // Update localStorage
      localStorage.setItem('userName', newName);
      setProfile((prev) => ({ ...prev, name: newName }));
      setEditingName(false);
      toast.success('Name updated!');
    } catch {
      toast.error('Could not update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(Number(userId), {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data || 'Current password is incorrect');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(Number(userId));
      clearUserId();
      toast.success('Account deleted');
      navigate('/login');
    } catch {
      toast.error('Could not delete account');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pb-28 px-6 pt-4 max-w-2xl mx-auto">

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 mb-8 p-6 bg-card rounded-2xl"
      >
        {/* Avatar */}
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center flex-shrink-0">
          <span className="text-4xl font-bold text-black">
            {profile.name?.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                className="text-2xl font-bold bg-surface text-foreground rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary border-none w-full"
              />
              <button
                onClick={handleUpdateName}
                disabled={savingName}
                className="text-primary hover:text-primary/80 cursor-pointer flex-shrink-0"
              >
                {savingName
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Check className="h-5 w-5" />
                }
              </button>
              <button
                onClick={() => { setEditingName(false); setNewName(profile.name); }}
                className="text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {profile.name}
              </h1>
              <button
                onClick={() => setEditingName(true)}
                className="text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                title="Edit name"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground text-sm">{profile.email}</p>
          <p className="text-muted-foreground text-xs mt-1">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-card rounded-xl p-5 text-center">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <ListMusic className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{profile.totalPlaylists}</p>
          <p className="text-xs text-muted-foreground mt-1">Playlists</p>
        </div>

        <div className="bg-card rounded-xl p-5 text-center">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <Heart className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{profile.totalFavorites}</p>
          <p className="text-xs text-muted-foreground mt-1">Liked Songs</p>
        </div>

        <div className="bg-card rounded-xl p-5 text-center">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Music2 className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{profile.totalSongs}</p>
          <p className="text-xs text-muted-foreground mt-1">In Library</p>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl overflow-hidden mb-6"
      >
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Account Settings</h2>
        </div>

        {/* Change Password */}
        <div className="px-6 py-4 border-b border-border">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-surface flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your password</p>
              </div>
            </div>
            <span className={`text-muted-foreground transition-transform ${showPasswordForm ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {/* Password Form */}
          {showPasswordForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleChangePassword}
              className="mt-4 space-y-3"
            >
              <input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm, currentPassword: e.target.value
                })}
                required
                className="w-full h-10 px-3 rounded-md bg-surface border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm, newPassword: e.target.value
                })}
                required
                className="w-full h-10 px-3 rounded-md bg-surface border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({
                  ...passwordForm, confirmPassword: e.target.value
                })}
                required
                className="w-full h-10 px-3 rounded-md bg-surface border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 h-10 bg-primary text-black font-bold rounded-md text-sm hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  ) : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      currentPassword: '', newPassword: '', confirmPassword: ''
                    });
                  }}
                  className="px-4 h-10 bg-surface text-muted-foreground rounded-md text-sm cursor-pointer hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Delete Account */}
        <div className="px-6 py-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-destructive">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-destructive/10 rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-foreground mb-1">
                Are you sure?
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                This will permanently delete your account, playlists, and favorites.
                This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-9 bg-destructive text-white font-bold rounded-md text-sm cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {deleting
                    ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    : 'Yes, delete my account'
                  }
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 h-9 bg-surface text-muted-foreground rounded-md text-sm cursor-pointer hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}