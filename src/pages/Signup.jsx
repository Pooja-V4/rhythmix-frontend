import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/axios';
import { Music2, Mail, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth } from '../api/axios';
import { setUserInfo } from '../lib/auth';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false); // ← show success screen

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser(form);
      // ✅ Show "check your email" screen instead of redirecting
      setRegistered(true);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'string') setError(data);
      else if (data?.message) setError(data.message);
      else setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await googleAuth(credentialResponse.credential);
      setUserInfo(response.data);
      navigate('/');
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  };

  // Show success screen after registration
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="bg-card rounded-xl p-10 shadow-2xl">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Check your email!
            </h2>
            <p className="text-muted-foreground text-sm mb-2">
              We sent a verification link to:
            </p>
            <p className="text-foreground font-semibold mb-6">{form.email}</p>
            <p className="text-muted-foreground text-sm mb-8">
              Click the link in the email to verify your account.
              The link expires in 24 hours.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
            >
              Go to Login
            </button>
            <p className="text-muted-foreground text-xs mt-4">
              Didn't receive it? Check your spam folder.
            </p>
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
          <h1 className="text-3xl font-bold text-foreground">
            Sign up for Rhythmix
          </h1>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-2xl">
          {error && (
            <p className="text-destructive text-sm text-center mb-4 bg-destructive/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed.')}
              theme="filled_black"
              shape="pill"
              text="signup_with"
              size="large"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Full Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-11 px-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1 block">Email</label>
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
              <label className="text-sm font-semibold text-foreground mb-1 block">Password</label>
              <input
                type="password"
                placeholder="Create a password"
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground text-sm">Already have an account? </span>
            <a href="/login" className="text-foreground font-semibold hover:text-primary text-sm underline">
              Log in
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}