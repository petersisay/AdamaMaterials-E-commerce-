import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User as UserIcon, ArrowRight, Eye, EyeOff, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import BrandLogo from '../components/BrandLogo';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface LoginFormValues {
  identifier: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotLookup, setForgotLookup] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  const dashboardFor = (role: string) => {
    switch (role) {
      case 'ADMIN': return '/admin-dashboard';
      case 'STAFF': return '/staff-dashboard';
      case 'SELLER': return '/seller-dashboard';
      default: return '/buyer-dashboard';
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    const loggedInUser = await login(data.identifier, data.password);
    if (loggedInUser) {
      navigate(dashboardFor(loggedInUser.role), { replace: true });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotLookup.trim()) return;

    setIsSendingReset(true);
    try {
      const res = await api.post('/auth/forgotpassword', { identifier: forgotLookup.trim() });
      showToast(res.data.message || 'Password reset link sent to your email.', 'info');
      setShowForgotModal(false);
      setForgotLookup('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to send password reset.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
            <BrandLogo />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign In to Revola
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Access your buyer orders, seller depot, or management portal
          </p>
        </div>

        {/* Username/Email Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Username or Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoComplete="username"
                {...register('identifier', {
                  required: 'Please enter your username or email address',
                })}
                placeholder="petros123 or name@example.com"
                className={`pl-9 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.identifier ? 'border-rose-500' : ''
                }`}
              />
            </div>
            {errors.identifier && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.identifier.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                })}
                placeholder="••••••••"
                className={`pl-9 pr-10 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.password ? 'border-rose-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.password.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                'Signing In...'
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* 1-Click Google alternative */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
              Or 1-click Google Sign In
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleSignInButton text="signin_with" onSuccessRedirect="/buyer-dashboard" />
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Role-isolated access for Buyers, Sellers, Staff, and Admins.</span>
        </div>

        <div className="pt-1 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Recover Password</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your registered username or email address and we'll send you password recovery instructions.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                required
                value={forgotLookup}
                onChange={(e) => setForgotLookup(e.target.value)}
                placeholder="Username or email address"
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

