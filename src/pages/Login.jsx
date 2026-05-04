import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/axios';
import { setUserInfo } from '../lib/auth';
import { Music2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { googleAuth } from '../api/axios';
import { toast } from 'sonner';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUnverified(false);
    setResentSuccess(false);

    try {
      const response = await loginUser(form);
      setUserInfo(response.data);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.unverified === true) {
        // Show unverified state with resend button
        setUnverified(true);
        setError(data.message || 'Please verify your email before logging in.');
      } else if (typeof data === 'string') {
        setError(data);
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  // resend handler
  const handleResendVerification = async () => {
    if (!form.email) {
      toast.error('Please enter your email address first');
      return;
    }
    setResending(true);
    setResentSuccess(false);
    try {
      await axios.post(`${BASE_URL}/auth/resend-verification` , {
        email: form.email
      });
      setResentSuccess(true);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.message || 'Could not resend email. Try again.');
    } finally {
      setResending(false);
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

          {/* Error message */}
          {error && (
            <div className="mb-4">
              <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg py-2 px-3">
                {error}
              </p>

              {/* Resend button shown only when unverified */}
              {unverified && (
                <div className="mt-3 text-center">
                  {resentSuccess ? (
                    <div className="flex items-center justify-center gap-2 text-primary text-sm">
                      <Mail className="h-4 w-4" />
                      <span>Verification email sent! Check your inbox.</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-sm text-primary underline cursor-pointer hover:text-primary/80 disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : '📧 Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Google Sign In */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed.')}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              size="large"
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
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full h-11 px-3 rounded-md bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {/* Forgot password link */}
              <div className="flex justify-end mt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
            <span className="text-muted-foreground text-sm">Don't have an account? </span>
            <a href="/signup" className="text-foreground font-semibold hover:text-primary text-sm underline">
              Sign up for Rhythmix
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
