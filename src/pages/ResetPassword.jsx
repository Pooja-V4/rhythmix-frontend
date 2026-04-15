import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Music2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { resetPassword } from '../api/axios';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="bg-card rounded-xl p-10 text-center max-w-sm w-full">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Invalid Link</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This password reset link is invalid or has already been used.
          </p>
          <Link
            to="/forgot-password"
            className="block w-full h-11 bg-primary text-black font-bold rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = (password) => {
    if (!password) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Too short', color: 'bg-destructive', width: '25%' };
    if (password.length < 8) return { label: 'Weak', color: 'bg-amber-500', width: '50%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { label: 'Fair', color: 'bg-yellow-400', width: '75%' };
    }
    return { label: 'Strong', color: 'bg-primary', width: '100%' };
  };

  const strength = getStrength(form.newPassword);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-xl p-10 text-center max-w-sm w-full"
        >
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Password Reset!</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Your password has been changed successfully. Redirecting to login...
          </p>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Create new password</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Choose a strong password for your account
          </p>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-2xl">
          {error && (
            <p className="text-destructive text-sm text-center mb-4 bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  required
                  className="w-full h-11 px-3 pr-10 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />
                  }
                </button>
              </div>

              {/* Password strength bar */}
              {form.newPassword && (
                <div className="mt-2">
                  <div className="h-1 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className={`w-full h-11 px-3 rounded-md bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  form.confirmPassword && form.newPassword !== form.confirmPassword
                    ? 'border-destructive'
                    : 'border-border'
                }`}
              />
              {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || form.newPassword !== form.confirmPassword}
              className="w-full h-12 bg-primary text-black font-bold rounded-full text-base hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}