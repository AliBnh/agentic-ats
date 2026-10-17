import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  UserCheck,
  Cpu,
  LogIn,
  UserPlus,
  CheckCircle2,
  Zap,
  Bot
} from 'lucide-react';

export const LoginModal = () => {
  const { login, register, loginDemoUser } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('demo@agenticats.com');
  const [password, setPassword] = useState('Password123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    if (newMode === 'register') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('demo@agenticats.com');
      setPassword('Password123!');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email, password, fullName.trim() || undefined);
      setSuccessMsg('Account created successfully! Launching studio...');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create account. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginDemoUser();
    } catch (err) {
      setError('Failed to authenticate demo user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Background Tech Grid & Luminous Glows */}
      <div className="tech-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none" />

      {/* Main Elevated Glass Card */}
      <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 p-6 sm:p-8 space-y-6 transition-all duration-300">
        
        {/* Header with Pulsing Live Swarm Status */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-mono tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold">6 AGENTS ACTIVE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">LANGGRAPH SWARM</span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6 text-brand-600" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AgenticATS Career Studio
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic Multi-Agent Resume Optimization & Career Intelligence
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleToggleMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all duration-200 ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-brand-600" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all duration-200 ${
              mode === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-600" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {mode === 'login' && (
          <div className="space-y-4">
            {/* 1-Click Demo Login Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/90 to-sky-50/70 border border-brand-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-brand-900">
                <span className="flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-brand-600" />
                  <span>Pre-Seeded Demo Candidate</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-100 text-[10px] text-brand-700 font-mono">
                  10 Audits Ready
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono space-y-0.5 bg-white/70 p-2 rounded-lg border border-brand-100">
                <div>Email: <span className="font-bold text-slate-800">demo@agenticats.com</span></div>
                <div>Password: <span className="font-bold text-slate-800">Password123!</span></div>
              </div>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>1-Click Launch as Demo Candidate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-3 text-slate-300">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] uppercase font-bold text-slate-400">or sign in with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
              </button>
            </form>
          </div>
        )}

        {/* MODE 2: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ali Benhima"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/20 active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Launch Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>Groq LPU Fast Inference</span>
          </span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Fact-Locked HITL Gate</span>
          </span>
        </div>
      </div>
    </div>
  );
};
