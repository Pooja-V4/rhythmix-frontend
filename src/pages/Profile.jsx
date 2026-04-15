import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit2, Lock, Trash2, Check, X,
  Loader2, Mail, User, ChevronRight, Music, Heart, Library
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, deleteAccount } from '../api/axios';
import { getUserId, isLoggedIn, clearUserId } from '../lib/auth';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile(Number(userId));
      setProfile(res.data);
      setNewName(res.data.name);
      setIsGoogleUser(res.data.googleUser);
    } catch {
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
      toast.error('Passwords do not match');
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
      toast.error(err.response?.data?.message || 'Current password is incorrect');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(Number(userId));
      clearUserId();
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
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || '?';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pb-28 max-w-2xl mx-auto">

      {/* ===== HERO BANNER ===== */}
      <div className="relative h-44 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1a1035 0%,#0d2d1a 50%,#1a1035 100%)' }}
      >
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%,rgba(29,158,117,0.25) 0%,transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(83,74,183,0.2) 0%,transparent 60%)'
          }}
        />
        {/* Decorative music notes */}
        <div className="absolute top-5 right-16 text-5xl opacity-[0.07] rotate-12 select-none">♪</div>
        <div className="absolute bottom-3 right-36 text-3xl opacity-[0.06] -rotate-12 select-none">♫</div>
        <div className="absolute top-8 left-20 text-2xl opacity-[0.05] rotate-6 select-none">♩</div>
      </div>

      <div className="px-6">

        {/* ===== AVATAR + NAME ROW ===== */}
        <div className="flex items-end gap-5 -mt-14 mb-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative flex-shrink-0"
          >
            <div
              className="h-28 w-28 rounded-full flex items-center justify-center border-4 border-background"
              style={{
                background: 'linear-gradient(135deg,#1D9E75,#534AB7)',
                boxShadow: '0 0 0 2px rgba(29,158,117,0.4)',
              }}
            >
              <span className="text-4xl font-bold text-white">
                {getInitial(profile.name)}
              </span>
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-2 right-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
          </motion.div>

          {/* Name + Email */}
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                    className="text-2xl font-bold bg-surface text-foreground rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary border-none w-48"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={savingName}
                    className="text-primary hover:text-primary/80 cursor-pointer"
                  >
                    {savingName
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : <Check className="h-5 w-5" />
                    }
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNewName(profile.name); }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {profile.name}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title="Edit name"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full tracking-wide"
                style={{
                  background: 'rgba(29,158,117,0.15)',
                  color: '#1D9E75',
                  border: '1px solid rgba(29,158,117,0.3)',
                }}
              >
                {isGoogleUser ? 'GOOGLE' : 'VERIFIED'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {profile.email} · Member since {formatDate(profile.createdAt)}
            </p>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            {
              label: 'Playlists',
              value: profile.totalPlaylists,
              icon: <Music className="h-5 w-5" style={{ color: '#534AB7' }} />,
              color: '#534AB7',
              bg: 'rgba(83,74,183,0.15)',
              bar: 'linear-gradient(90deg,#534AB7,transparent)',
            },
            {
              label: 'Liked Songs',
              value: profile.totalFavorites,
              icon: <Heart className="h-5 w-5 fill-current" style={{ color: '#e94560' }} />,
              color: '#e94560',
              bg: 'rgba(233,69,96,0.15)',
              bar: 'linear-gradient(90deg,#e94560,transparent)',
            },
            {
              label: 'In Library',
              value: profile.totalSongs,
              icon: <Library className="h-5 w-5" style={{ color: '#1D9E75' }} />,
              color: '#1D9E75',
              bg: 'rgba(29,158,117,0.15)',
              bar: 'linear-gradient(90deg,#1D9E75,transparent)',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-2xl p-5 text-center overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: stat.bar }}
              />
              {/* Icon */}
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: stat.bg }}
              >
                {stat.icon}
              </div>
              <p className="text-3xl font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ===== ACCOUNT SETTINGS CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="font-semibold text-foreground text-sm tracking-wide">
              Account Settings
            </h2>
          </div>

          {/* Display Name row */}
          <button
            onClick={() => setEditingName(true)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Display Name</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.name}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Password row — hidden for Google users */}
          {isGoogleUser ? (
            <div
              className="flex items-center gap-4 px-6 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Google Account</p>
                <p className="text-xs text-muted-foreground mt-0.5">Password managed by Google</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              style={{ borderBottom: showPasswordForm ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Change Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your password</p>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${showPasswordForm ? 'rotate-90' : ''}`}
              />
            </button>
          )}

          {/* Password form */}
          <AnimatePresence>
            {showPasswordForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleChangePassword}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 space-y-3">
                  {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
                    <input
                      key={field}
                      type="password"
                      placeholder={
                        field === 'currentPassword' ? 'Current password'
                        : field === 'newPassword' ? 'New password (min 6 characters)'
                        : 'Confirm new password'
                      }
                      value={passwordForm[field]}
                      onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                      required
                      className="w-full h-10 px-4 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border-none"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="flex-1 h-10 bg-primary text-black font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                    >
                      {savingPassword
                        ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        : 'Update Password'
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }}
                      className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Email row */}
          <div
            className="flex items-center gap-4 px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Email Address</p>
              <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(29,158,117,0.12)',
                color: '#1D9E75',
                border: '1px solid rgba(29,158,117,0.25)',
              }}
            >
              Verified
            </span>
          </div>
        </motion.div>

        {/* ===== DANGER ZONE ===== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(233,69,96,0.04)',
            border: '1px solid rgba(233,69,96,0.15)',
          }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid rgba(233,69,96,0.1)' }}
          >
            <h2 className="font-semibold text-sm tracking-wide" style={{ color: '#e94560' }}>
              Danger Zone
            </h2>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-500/5 transition-colors cursor-pointer"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(233,69,96,0.1)' }}
              >
                <Trash2 className="h-4 w-4" style={{ color: '#e94560' }} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium" style={{ color: '#e94560' }}>
                  Delete Account
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your account and all data
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-6 py-5"
            >
              <p className="text-sm font-semibold text-foreground mb-1">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                This will permanently delete your account, all playlists, liked songs,
                and library. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 h-10 font-bold rounded-xl text-sm text-white cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: '#e94560' }}
                >
                  {deleting
                    ? <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    : 'Yes, delete everything'
                  }
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 h-10 rounded-xl text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}