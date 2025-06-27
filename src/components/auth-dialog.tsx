"use client";

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Mail, Lock } from 'lucide-react';

const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email address already exists. Please log in or use a different email.';
        case 'auth/weak-password':
            return 'Your password is too weak. It should be at least 6 characters long.';
        case 'auth/invalid-email':
            return 'The email address is not valid. Please enter a valid email.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

export function AuthDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setOpen(false);
      toast({ title: 'Logged in successfully!' });
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!auth) return;
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setOpen(false);
      toast({ title: 'Registered successfully!' });
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  const onTabChange = () => {
    setError(null);
    setEmail('');
    setPassword('');
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: 'login' | 'register') => {
    if (e.key === 'Enter') {
        if (action === 'login') handleLogin();
        else handleRegister();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Login / Register</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!isFirebaseConfigured ? (
             <DialogHeader>
                <DialogTitle>Authentication Unavailable</DialogTitle>
                <DialogDescription className="pt-4">
                    Firebase is not configured on this project. Please add your Firebase project credentials to your .env file to enable user accounts and data persistence.
                </DialogDescription>
            </DialogHeader>
        ) : (
            <Tabs defaultValue="login" className="w-full" onValueChange={onTabChange}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <DialogHeader className="pt-4 text-center">
                    <DialogTitle className="text-2xl">Welcome Back</DialogTitle>
                    <DialogDescription>Sign in to access your profile.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-6">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => handleKeyPress(e, 'login')} className="pl-10" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => handleKeyPress(e, 'login')} className="pl-10" />
                    </div>
                </div>
                {error && <p className="text-sm text-destructive text-center pb-4">{error}</p>}
                <DialogFooter>
                    <Button onClick={handleLogin} className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login
                    </Button>
                </DialogFooter>
            </TabsContent>
            <TabsContent value="register">
                <DialogHeader className="pt-4 text-center">
                    <DialogTitle className="text-2xl">Create an Account</DialogTitle>
                    <DialogDescription>It's quick and easy to get started.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-6">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="register-email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => handleKeyPress(e, 'register')} className="pl-10" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="register-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => handleKeyPress(e, 'register')} className="pl-10" />
                    </div>
                </div>
                {error && <p className="text-sm text-destructive text-center pb-4">{error}</p>}
                <DialogFooter>
                    <Button onClick={handleRegister} className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Account
                    </Button>
                </DialogFooter>
            </TabsContent>
            </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
