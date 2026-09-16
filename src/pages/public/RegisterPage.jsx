import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useFaultLens } from '../../context/FaultLensContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/auth';
import { TechGeometricArtwork } from '../../components/auth/TechGeometricArtwork';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { switchRole, setCurrentUser, refreshBackendData } = useFaultLens();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamic Password Strength Meter
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    if (password.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms and Conditions to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.register({ name, email, password });
      if (res && res.user) {
        if (setCurrentUser) setCurrentUser(res.user);
        switchRole('developer');
      } else {
        switchRole('developer');
      }

      if (refreshBackendData) refreshBackendData();

      addToast({
        title: 'Account Created',
        message: `Welcome to FaultLens, ${name}! Your workspace is active.`,
        type: 'success'
      });

      navigate('/dashboard');
    } catch (err) {
      console.warn('Registration fallback:', err.message);
      // Fallback for instant demo
      switchRole('developer');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authService.signInWithGoogle();
      if (res && res.user) {
        if (setCurrentUser) setCurrentUser(res.user);
      }
      switchRole('developer');
      if (refreshBackendData) refreshBackendData();
      addToast({
        title: 'Google Sign-Up Successful',
        message: `Registered developer workspace (${res?.user?.email || 'dev'})`,
        type: 'success'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Google register error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        addToast({
          title: 'Registration Cancelled',
          message: 'The Google authentication popup was closed.',
          type: 'info'
        });
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
        setErrorMessage('Google Sign-In is not enabled in your Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Google, enable it and save.');
        addToast({
          title: 'Firebase Provider Not Enabled',
          message: 'Enable Google provider in Firebase Console > Authentication > Sign-in method.',
          type: 'warning'
        });
      } else if (err.code === 'auth/unauthorized-domain') {
        addToast({
          title: 'Domain Not Whitelisted',
          message: 'Please add localhost to Authorized Domains in Firebase Console.',
          type: 'warning'
        });
        switchRole('developer');
        navigate('/dashboard');
      } else {
        setErrorMessage(err.message || 'Google sign-up could not be completed.');
        addToast({
          title: 'Google Authentication Failed',
          message: err.message || 'Failed to authenticate with Google.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF6] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] grid grid-cols-1 lg:grid-cols-12 border border-slate-100">
        
        {/* LEFT COLUMN: Clean White Form Panel (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between p-7 sm:p-10 lg:p-12 bg-white">
          <div>
            {/* Top Brand Logo: Stylized Geometric Crown Icon matching the reference */}
            <div className="flex items-center justify-between mb-7">
              <Link to="/" className="inline-flex items-center gap-2 group">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="group-hover:scale-105 transition-transform"
                >
                  <path
                    d="M20 4L26 14L34 8L31 28H9L6 8L14 14L20 4Z"
                    fill="#4F46E5"
                  />
                  <path
                    d="M11 31H29V34H11V31Z"
                    fill="#4338CA"
                    rx="1.5"
                  />
                  <polygon
                    points="20,11 23,16 20,21 17,16"
                    fill="#EEF2FF"
                  />
                </svg>
              </Link>
              <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                WORKSPACE // REGISTRATION
              </span>
            </div>

            {/* Header Text */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create account !
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
                Enter your details to get unlimited access to data & telemetry.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your mail address"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800">
                    Password <span className="text-red-500">*</span>
                  </label>
                  {strength.label && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      Strength: <span className="text-slate-700 font-bold">{strength.label}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter Bar */}
                {password && (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <div className={`h-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-100'}`} />
                    <div className={`h-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-100'}`} />
                    <div className={`h-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-100'}`} />
                  </div>
                )}
              </div>

              {/* Agree Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">
                    I agree to the{' '}
                    <span className="text-indigo-600 font-medium hover:underline">Terms of Service</span> and{' '}
                    <span className="text-indigo-600 font-medium hover:underline">Privacy Policy</span>
                  </span>
                </label>
              </div>

              {/* Primary Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Creating Workspace...' : 'Sign Up'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">
                Or, Sign up with
              </span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-70"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign up with google (Dev)</span>
            </button>
          </div>

          {/* Footer Login Link */}
          <div className="mt-6 text-center text-xs text-slate-600 font-normal">
            Already have an account ?{' '}
            <Link to="/login" className="text-[#4F46E5] hover:text-[#4338CA] font-semibold hover:underline transition-colors">
              Login here
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Modernist Geometric Abstract Mosaic Artwork (6 cols on lg) */}
        <div className="hidden lg:block lg:col-span-6 xl:col-span-6 relative h-full">
          <TechGeometricArtwork />
        </div>

      </div>
    </div>
  );
};
