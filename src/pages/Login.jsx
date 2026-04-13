import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, googleAuth } from '../api/axios';
import { setUserInfo } from '../lib/auth';
import { Music2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await loginUser(form);
      setUserInfo(response.data);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') setError(data);
      else if (data?.message) setError(data.message);
      else setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Google login success
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Send Google token to your backend
      const response = await googleAuth(credentialResponse.credential);
      setUserInfo(response.data);
      navigate('/');
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <Music2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Log in to Rhythmix</h1>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-2xl">
          {error && (
            <p className="text-destructive text-sm text-center mb-4 bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          {/* Google Sign In Button */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
              width="100%"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full h-11 px-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full h-11 px-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-black font-bold rounded-full text-base hover:scale-105 transition-transform disabled:opacity-50 mt-2"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <span className="text-muted-foreground text-sm">
              Don't have an account?{' '}
            </span>
            <a
              href="/signup"
              className="text-foreground font-semibold hover:text-primary text-sm underline"
            >
              Sign up for Rhythmix
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}