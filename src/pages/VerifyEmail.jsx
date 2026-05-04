import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { setUserInfo } from '../lib/auth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/auth/verify-email?token=${token}`
    );
      // Auto login after verification
      setUserInfo(response.data);
      setStatus('success');
      setMessage('Your email has been verified! Redirecting...');
      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setStatus('error');
      const data = err.response?.data;
      setMessage(data?.message || 'Verification failed. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <div className="bg-card rounded-xl p-10 shadow-2xl">
          <Music2 className="h-10 w-10 text-primary mx-auto mb-6" />

          {status === 'loading' && (
            <>
              <Loader2 className="h-14 w-14 text-primary animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground">Verifying your email...</h2>
              <p className="text-muted-foreground text-sm mt-2">Please wait a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Email Verified!</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <div className="mt-6 h-1 bg-surface rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Verification Failed</h2>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <button
                onClick={() => navigate('/signup')}
                className="w-full h-11 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform"
              >
                Back to Sign Up
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}