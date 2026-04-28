import React, { useEffect, useState, useRef } from 'react';
import { AtSign, Lock, Eye, EyeOff, LogIn, ShieldCheck, Info, ArrowLeft, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MOCK_AUTH_USERS } from '../data/unifiedData';
import { clearActiveRole, setActiveRole } from '../utils/authSession';

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'login' | 'otp' | 'forgot-password-email' | 'forgot-password-otp' | 'forgot-password-reset' | 'forgot-password-success'>('login');
  
  // Login State
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    clearActiveRole();
  }, []);

  const applyMockCredentials = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
    setLoginError('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const user = MOCK_AUTH_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      setStep('otp');
    } else {
      setLoginError('Invalid email or password. Please use correct credentials.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      // Focus previous input on backspace if current is empty
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      // Allow any 6-digit OTP for mock purposes
      console.log('OTP Verified, logging in via mock account');
      const user = MOCK_AUTH_USERS.find(u => u.email === email);
      if (!user) {
        return;
      }

      setActiveRole(user.role, { email: user.email, name: user.name });

      if (user?.role === 'System Admin') {
        navigate('/system-admin');
        return;
      }

      if (user?.role === 'Agency') {
        navigate('/agency');
        return;
      }

      navigate('/case-manager');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      pastedData.forEach((char, index) => {
        if (index < 6) newOtp[index] = char;
      });
      setOtp(newOtp);
      otpRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
    }
  };

  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail) {
      setOtp(['', '', '', '', '', '']);
      setStep('forgot-password-otp');
    }
  };

  const handleForgotOtpSubmit = () => {
    const otpValue = otp.join('');
    if (otpValue.length === 6) {
      setStep('forgot-password-reset');
    }
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      setStep('forgot-password-success');
    } else {
      setLoginError('Passwords do not match.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7FA]">
      {/* Header */}
      <header className="flex w-full items-center bg-white px-8 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Bayanihan Logo" className="h-10 w-10 object-contain" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#005288]">Bayanihan One Window</h1>
            <span className="text-[10px] font-bold tracking-[0.1em] text-[#00A59B]">
              INTER-AGENCY REFERRAL AND TRACKING SYSTEM
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 lg:p-8">
        {step === 'login' && (
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-8 lg:flex-row lg:gap-4">
            {/* Left Column (Branding & Copy) */}
            <div className="flex w-full max-w-lg flex-col gap-4 lg:w-1/2">
              <div>
                <span className="inline-block rounded-full bg-[#A3F0E6] px-3 py-1 text-xs font-bold tracking-widest text-[#00625A]">
                  REGION VII
                </span>
              </div>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-[#003B5C] lg:text-[3.5rem]">
                Bayanihan<br />One Window
              </h1>
              <p className="text-base leading-relaxed text-gray-600 font-medium">
                Connecting government branches for seamless migrant worker assistance. Secure, unified, and efficient.
              </p>
            </div>

            {/* Right Column (Sign In Card) */}
            <div className="w-full max-w-md lg:w-1/2">
              <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
                <div className="mb-4">
                  <h2 className="mb-1 text-xl font-bold text-gray-900">Sign In</h2>
                  <p className="text-sm text-gray-500">
                    Please enter your credentials to access the referral system.
                  </p>
                </div>

                <div className="mb-4 flex flex-col gap-2 rounded-lg bg-blue-50 p-3 border border-blue-100">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Mock Accounts for Testing:</span>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => applyMockCredentials('admin@example.com', 'password123')}
                      className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors"
                      type="button"
                    >
                      Use System Admin
                    </button>
                    <button 
                      onClick={() => applyMockCredentials('manager@example.com', 'password123')}
                      className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors"
                      type="button"
                    >
                      Use Case Manager
                    </button>
                    <button 
                      onClick={() => applyMockCredentials('agency@example.com', 'password123')}
                      className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-50 transition-colors"
                      type="button"
                    >
                      Use Agency
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                  {loginError && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <h3 className="text-sm font-medium text-red-800">{loginError}</h3>
                      </div>
                    </div>
                  )}
                  {/* Email Address */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <AtSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="block w-full rounded-lg border-0 bg-gray-100 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-transparent placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#005288] sm:text-sm sm:leading-6 font-medium"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="password">
                        Password
                      </label>
                        <button 
                          type="button" 
                          onClick={() => setStep('forgot-password-email')}
                          className="text-[11px] font-bold text-[#00A59B] hover:text-[#008A82]">
                          Forgot Password?
                        </button>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full rounded-lg border-0 bg-gray-100 py-3.5 pl-11 pr-11 text-gray-900 ring-1 ring-inset ring-transparent placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#005288] sm:text-sm sm:leading-6 font-medium tracking-widest"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="mt-6 flex w-full relative items-center justify-center gap-2 rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004A77]"
                  >
                    <span className="flex-1 text-center">Sign In</span>
                    <LogIn className="h-5 w-5 absolute right-6" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 border border-gray-100">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#A3F0E6]">
                  <ShieldCheck className="h-7 w-7 text-[#00625A]" />
                </div>
              </div>
              
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Verify Your Identity</h2>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  For your security, we've sent a 6-digit verification code to your registered email address.
                </p>
              </div>

              <div className="mb-8 mt-2">
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="h-12 w-12 p-0 leading-[48px] sm:h-14 sm:w-14 sm:leading-[56px] rounded-lg bg-[#E2E8F0] text-center text-xl font-bold tabular-nums text-[#003B5C] ring-1 ring-inset ring-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005288]"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otp.join('').length < 6}
                className="flex w-full items-center justify-center rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004A77] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify Code
              </button>

              <div className="mt-6 text-center">
                <button type="button" className="text-sm font-bold text-[#00A59B] hover:text-[#008A82]">
                  Resend Code
                </button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resend available in 60s
                </p>
              </div>

              <div className="mt-8 flex gap-3 rounded-lg bg-[#F8FAFC] p-4 text-sm text-gray-600">
                <Info className="h-5 w-5 shrink-0 text-gray-400" />
                <p>Check your spam folder or contact your system administrator if you are still having trouble receiving the code.</p>
              </div>
            </div>

            <button 
              onClick={() => setStep('login')}
              className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </button>
          </div>
        )}

        {step === 'forgot-password-email' && (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 border border-gray-100">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                  <KeyRound className="h-7 w-7 text-blue-700" />
                </div>
              </div>
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Forgot Password</h2>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  Enter your email address and we'll send you an OTP to reset your password.
                </p>
              </div>
              <form onSubmit={handleForgotEmailSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="forgot-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <AtSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="block w-full rounded-lg border-0 bg-gray-100 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-transparent focus:bg-white focus:ring-2 focus:ring-inset focus:ring-[#005288] sm:text-sm sm:leading-6 font-medium"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C]"
                >
                  Send OTP
                </button>
              </form>
            </div>
            <button onClick={() => setStep('login')} className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Return to Login
            </button>
          </div>
        )}

        {step === 'forgot-password-otp' && (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 border border-gray-100">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#A3F0E6]">
                  <ShieldCheck className="h-7 w-7 text-[#00625A]" />
                </div>
              </div>
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Verify Password Reset</h2>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  We've sent a 6-digit verification code to <strong>{forgotEmail}</strong>.
                </p>
              </div>
              <div className="mb-8 mt-2">
                <div className="flex justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="h-12 w-12 p-0 leading-[48px] sm:h-14 sm:w-14 sm:leading-[56px] rounded-lg bg-[#E2E8F0] text-center text-xl font-bold tabular-nums text-[#003B5C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005288]"
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleForgotOtpSubmit}
                disabled={otp.join('').length < 6}
                className="flex w-full items-center justify-center rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C] disabled:opacity-50"
              >
                Verify Code
              </button>
            </div>
            <button onClick={() => setStep('forgot-password-email')} className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Email
            </button>
          </div>
        )}

        {step === 'forgot-password-reset' && (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 border border-gray-100">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
                  <Lock className="h-7 w-7 text-purple-700" />
                </div>
              </div>
              <div className="mb-8 text-center">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Create New Password</h2>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  Enter your current password and your new password below.
                </p>
              </div>
              <form onSubmit={handlePasswordResetSubmit} className="flex flex-col gap-5">
                {loginError && (
                  <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h3 className="text-sm font-medium text-red-800">{loginError}</h3>
                    </div>
                  </div>
                )}
                {/* Current Password - Requested by user */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="current-pw">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="current-pw"
                      placeholder="••••••••"
                      className="block w-full rounded-lg border-0 bg-gray-100 py-3.5 pl-11 pr-11 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#005288] sm:text-sm font-medium tracking-widest"
                    />
                  </div>
                </div>
                {/* New Password */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="new-pw">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="new-pw"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-lg border-0 bg-blue-50 py-3.5 pl-11 pr-11 text-gray-900 border-blue-100 focus:bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm font-medium tracking-widest"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {/* Confirm Password */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" htmlFor="confirm-pw">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm-pw"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-lg border-0 bg-blue-50 py-3.5 pl-11 pr-11 text-gray-900 border-blue-100 focus:bg-white focus:ring-2 focus:ring-blue-500 sm:text-sm font-medium tracking-widest"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C]">
                  Reset Password
                </button>
              </form>
            </div>
            <button onClick={() => setStep('login')} className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Cancel
            </button>
          </div>
        )}

        {step === 'forgot-password-success' && (
          <div className="flex w-full max-w-md flex-col items-center">
            <div className="w-full rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-10 border border-gray-100 text-center">
              <div className="mb-6 flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">Password Reset Successful</h2>
              <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">
                Your password has been successfully updated. You can now use your new password to login.
              </p>
              <button
                onClick={() => { setStep('login'); setLoginError(''); setNewPassword(''); setConfirmPassword(''); setForgotEmail(''); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#004A77] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#003B5C]"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#EAEDF1] py-8 border-t border-gray-200">    
        <div className="mx-auto flex flex-col items-center justify-center gap-4 px-4 text-center">
          <h3 className="text-sm font-bold text-[#002B49]">
            Bayanihan One Window - Department of Migrant Workers REGION VII     
          </h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-gray-500">            <a href="#" className="hover:text-gray-900">Privacy Policy</a>      
            <a href="#" className="hover:text-gray-900">Terms of Service</a>    
            <a href="#" className="hover:text-gray-900">Security Notice</a>
          </div>          <p className="text-xs text-gray-400 mt-2 max-w-3xl px-4 font-medium">
            © 2026 Bayanihan One Window. All activities are monitored and logged. This system complies with the Data Privacy Act of 2012 (RA 10173).
          </p>
        </div>
      </footer>
    </div>
  );
}
