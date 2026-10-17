import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Loader2,
  UserCheck,
  Cpu,
  LogIn,
  UserPlus,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="min-h-screen w-full bg-background relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Soft Ambient Light Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

      {/* Main Elevated shadcn Card */}
      <Card className="relative z-10 max-w-md w-full shadow-lg border-border">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="flex justify-center">
            <Badge variant="success" className="gap-1.5 py-1 px-3 text-[11px] font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>6 Autonomous Agents Active</span>
              <span className="opacity-50">•</span>
              <span>LangGraph Swarm</span>
            </Badge>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <CardTitle className="text-2xl font-extrabold tracking-tight">
              AgenticATS Career Studio
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Deterministic Multi-Agent Resume Optimization & Career Intelligence
            </CardDescription>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <Tabs value={mode} onValueChange={handleToggleMode} className="w-full pt-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-1.5 text-xs">
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-1.5 text-xs">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error / Success Notifications */}
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert variant="success" className="py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-xs font-medium">
                {successMsg}
              </AlertDescription>
            </Alert>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* 1-Click Demo Login Card */}
              <div className="p-4 rounded-xl bg-accent/60 border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span>Pre-Seeded Demo Candidate</span>
                  </span>
                  <Badge variant="brand" className="font-mono text-[10px]">
                    10 Audits Ready
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono space-y-0.5 bg-background p-2.5 rounded-lg border border-border">
                  <div>Email: <span className="font-semibold text-foreground">demo@agenticats.com</span></div>
                  <div>Password: <span className="font-semibold text-foreground">Password123!</span></div>
                </div>
                <Button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  variant="brand"
                  className="w-full font-bold text-xs gap-1.5 py-2.5 h-auto shadow-sm"
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
                </Button>
              </div>

              <div className="flex items-center space-x-3 text-muted-foreground">
                <Separator className="flex-1" />
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  or sign in with email
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Standard Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-xs font-bold py-2.5 h-auto"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                </Button>
              </form>
            </div>
          )}

          {/* MODE 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ali Benhima"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="brand"
                className="w-full text-xs font-bold py-2.5 h-auto gap-1.5"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Launch Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-muted-foreground" />
            <span>Groq LPU Inference</span>
          </span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-muted-foreground" />
            <span>Fact-Locked Truth Gate</span>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
};
