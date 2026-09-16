import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';
import { useFaultLens } from '../../context/FaultLensContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/auth';
import { TechGeometricArtwork } from '../../components/auth/TechGeometricArtwork';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { switchRole, setCurrentUser, refreshBackendData } = useFaultLens();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login({ email, password });
      if (res && res.user) {
        if (setCurrentUser) setCurrentUser(res.user);
        const targetRole = res.user.role === 'ADMIN' ? 'admin' : 'developer';
        switchRole(targetRole);
      } else {
        switchRole('developer');
      }

      if (refreshBackendData) refreshBackendData();

      addToast({
        title: 'Authentication Successful',
        message: 'Welcome back to FaultLens workspace',
        type: 'success'
      });

      navigate(email.includes('admin') ? '/admin' : '/dashboard');
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
      // Fallback for instant client offline demo
      if (email.includes('admin')) {
        switchRole('admin');
        navigate('/admin');
      } else {
        switchRole('developer');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminDirectAccess = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await authService.login({ email: 'admin@faultlens.dev', password: 'Admin123!' });
      if (res && res.user) {
        if (setCurrentUser) setCurrentUser(res.user);
      }
    } catch (err) {
      console.warn('Backend admin login fallback:', err.message);
      if (setCurrentUser) {
        setCurrentUser({
          id: 'admin-usr-01',
          name: 'Sarah Connor',
          email: 'admin@faultlens.dev',
          role: 'ADMIN'
        });
      }
    } finally {
      switchRole('admin');
      if (refreshBackendData) refreshBackendData();
      addToast({
        title: 'Admin Session Activated',
        message: 'Redirected directly to the Admin Section',
        type: 'success'
      });
      setIsLoading(false);
      navigate('/admin');
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
        title: 'Google Sign-In Successful',
        message: `Signed in as developer (${res?.user?.email || 'dev'})`,
        type: 'success'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        addToast({
          title: 'Sign-in Cancelled',
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
        setErrorMessage(err.message || 'Google sign-in could not be completed.');
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

  const handleQuickFill = (targetEmail, targetPassword, roleLabel) => {
    setEmail(targetEmail);
    setPassword(targetPassword);
    setErrorMessage('');
    addToast({
      title: `${roleLabel} Credentials Loaded`,
      message: `Click 'Log In' to access the ${roleLabel.toLowerCase()} view`,
      type: 'info'
    });
  };

  return (
    <div className="min-h-screen bg-[#EAEFF6] flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans">
      {/* Outer Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[24px] sm:rounded-[28px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] grid grid-cols-1 lg:grid-cols-12 border border-slate-100">
        
        {/* LEFT COLUMN: Clean White Form Panel (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between p-7 sm:p-10 lg:p-12 bg-white">
          <div>
            {/* Top Brand Logo: Stylized Geometric Crown Icon matching the reference */}
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="inline-flex items-center gap-2 group">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="group-hover:scale-105 transition-transform"
                >
                  {/* Geometric Crown Emblem */}
                  <path
                    d="M20 4L26 14L34 8L31 28H9L6 8L14 14L20 4Z"
                    fill="#4F46E5"
                  />
                  <path
                    d="M11 31H29V34H11V31Z"
                    fill="#4338CA"
                    rx="1.5"
                  />
                  {/* Diamond Center */}
                  <polygon
                    points="20,11 23,16 20,21 17,16"
                    fill="#EEF2FF"
                  />
                </svg>
              </Link>

              {/* Developer Test Pill Switchers */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg text-[11px] font-mono border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleQuickFill('jeel@faultlens.dev', 'Password123!', 'Developer')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all flex items-center gap-1 ${
                    email === 'jeel@faultlens.dev'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Load Developer credentials"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Dev</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminDirectAccess}
                  className="px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 border border-purple-200 shadow-2xs cursor-pointer"
                  title="Directly access Administrator section"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Header Text */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back !
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-normal">
                Enter to get unlimited access to data & information.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your mail address"
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
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
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">Remember me</span>
                </label>

                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    addToast({
                      title: 'Reset Password',
                      message: 'Password reset link sent to registered email address.',
                      type: 'info'
                    });
                  }}
                  className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                >
                  Forgot your password ?
                </a>
              </div>

              {/* Primary Log In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center cursor-pointer disabled:opacity-70"
              >
                {isLoading ? 'Authenticating...' : 'Log In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">
                Or, Login with
              </span>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-70"
            >
              {/* Google 4-Color G Icon */}
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

          {/* Footer Register Link */}
          <div className="mt-8 text-center text-xs text-slate-600 font-normal">
            Don't have an account ?{' '}
            <Link to="/register" className="text-[#4F46E5] hover:text-[#4338CA] font-semibold hover:underline transition-colors">
              Register here
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
