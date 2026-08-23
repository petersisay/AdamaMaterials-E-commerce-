import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Store,
  Eye,
  EyeOff,
  AtSign,
} from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';
import BrandLogo from '../components/BrandLogo';

interface RegisterFormValues {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'BUYER' | 'SELLER';
}

const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER'>('BUYER');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      role: 'BUYER',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    const newUser = await registerUser(
      data.name,
      data.email,
      data.password,
      selectedRole,
      data.username
    );

    if (newUser) {
      if (selectedRole === 'SELLER') {
        navigate('/seller-dashboard', { replace: true });
      } else {
        navigate('/buyer-dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex flex-col items-center gap-2 mb-3 group">
            <BrandLogo />
          </Link>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Create Your Revola Account
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Join the circular construction materials marketplace in Adama
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedRole('BUYER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'BUYER'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            I'm a Buyer
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('SELLER')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === 'SELLER'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            I'm a Seller
          </button>
        </div>

        {/* Registration Form */}
        <form className="space-y-3.5" onSubmit={handleSubmit(onSubmit)}>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                {...register('name', { required: 'Full name is required' })}
                placeholder="e.g. Petros Sisay"
                className={`pl-9 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.name ? 'border-rose-500' : ''
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.name.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                {...register('username', {
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' },
                  pattern: {
                    value: /^[a-zA-Z0-9_.-]+$/,
                    message: 'Username can only contain letters, numbers, and underscores',
                  },
                })}
                placeholder="e.g. petros123"
                className={`pl-9 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.username ? 'border-rose-500' : ''
                }`}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                placeholder="petros@example.com"
                className={`pl-9 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.email ? 'border-rose-500' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
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

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
                placeholder="••••••••"
                className={`pl-9 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-hidden ${
                  errors.confirmPassword ? 'border-rose-500' : ''
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] text-rose-500 font-semibold">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                'Creating Account...'
              ) : (
                <>
                  <span>Create {selectedRole === 'SELLER' ? 'Seller' : 'Buyer'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-semibold">
              Or 1-click Google Sign Up
            </span>
          </div>
        </div>

        {/* Google Sign-up alternative */}
        <div className="flex justify-center">
          <GoogleSignInButton text="signup_with" onSuccessRedirect="/role-selection" />
        </div>

        {/* Trust Badge */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Encrypted credentials & Adama service area verified.</span>
        </div>

        {/* Existing Account Footer */}
        <div className="pt-1 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

