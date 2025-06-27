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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from 'lucide-react';

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
      setError(err.message.replace('Firebase: ', ''));
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
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };
  
  const onTabChange = () => {
    setError(null);
    setEmail('');
    setPassword('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Login / Register</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
                <DialogHeader className="pt-2">
                <DialogTitle>Login</DialogTitle>
                <DialogDescription>Access your saved health profile.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="login-email" className="text-right">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="login-password" className="text-right">Password</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
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
                <DialogHeader className="pt-2">
                <DialogTitle>Register</DialogTitle>
                <DialogDescription>Create an account to save your profile.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="register-email" className="text-right">Email</Label>
                    <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="register-password" className="text-right">Password</Label>
                    <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
                </div>
                </div>
                {error && <p className="text-sm text-destructive text-center pb-4">{error}</p>}
                <DialogFooter>
                <Button onClick={handleRegister} className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register
                </Button>
                </DialogFooter>
            </TabsContent>
            </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
