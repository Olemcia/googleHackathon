"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Ban,
  Pill,
  Stethoscope,
  Loader2,
  Info,
  HeartPulse,
  Upload,
  X,
  Search,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { TagList } from '@/components/tag-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  checkItemCompatibility,
  type CheckItemCompatibilityInput,
  type CheckItemCompatibilityOutput,
} from '@/ai/flows/check-item-compatibility';
import {
  suggestAlternatives,
  type SuggestAlternativesInput,
  type SuggestAlternativesOutput,
} from '@/ai/flows/suggest-alternatives';
import {
  getPostIngestionAdvice,
  type GetPostIngestionAdviceInput,
  type GetPostIngestionAdviceOutput,
} from '@/ai/flows/get-post-ingestion-advice';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AuthDialog } from '@/components/auth-dialog';

interface UserProfile {
  allergies: string[];
  medications: string[];
  conditions: string[];
}

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    allergies: [],
    medications: [],
    conditions: [],
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [itemName, setItemName] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [result, setResult] = useState<CheckItemCompatibilityOutput | null>(null);
  const [alternatives, setAlternatives] = useState<SuggestAlternativesOutput | null>(null);
  const [advice, setAdvice] = useState<GetPostIngestionAdviceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAdvising, setIsAdvising] = useState(false);
  const { toast } = useToast();
  const [analyzedItemName, setAnalyzedItemName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && db) {
        setProfileLoading(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create a profile for a new user
            const initialProfile: UserProfile = { allergies: [], medications: [], conditions: [] };
            await setDoc(docRef, initialProfile);
            setProfile(initialProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({
            title: "Error",
            description: "Could not fetch your profile. Please try again.",
            variant: "destructive",
          });
        } finally {
          setProfileLoading(false);
        }
      } else {
        // If no user, use a default empty profile
        setProfile({ allergies: [], medications: [], conditions: [] });
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user, toast]);

  const riskDisplayConfig = {
    None: {
      label: 'Safe',
      Icon: ShieldCheck,
      cardClass: 'border-green-500/50 bg-green-500/5',
      textClass: 'text-green-700 dark:text-green-400',
    },
    Low: {
      label: 'Low Risk',
      Icon: ShieldAlert,
      cardClass: 'border-yellow-500/50 bg-yellow-500/5',
      textClass: 'text-yellow-700 dark:text-yellow-400',
    },
    Moderate: {
      label: 'Moderate Risk',
      Icon: ShieldAlert,
      cardClass: 'border-orange-500/50 bg-orange-500/5',
      textClass: 'text-orange-600 dark:text-orange-400',
    },
    High: {
      label: 'High Risk',
      Icon: ShieldX,
      cardClass: 'border-destructive/50 bg-destructive/10',
      textClass: 'text-destructive',
    },
  };

  const handleProfileChange = (field: keyof UserProfile) => async (items: string[]) => {
    const newProfile = { ...profile, [field]: items };
    setProfile(newProfile);

    // Only persist if user is logged in and firebase is configured
    if (user && db) {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, newProfile, { merge: true });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: `Could not save your ${field}.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (imagePreviews.length + files.length > 5) {
        toast({ title: "Upload limit reached", description: "You can upload a maximum of 5 photos.", variant: "destructive" });
        return;
      }
      const fileReaders: FileReader[] = [];
      const newPreviews: string[] = [];
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        fileReaders.push(reader);
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === files.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
     const fileInput = document.getElementById('item-photo') as HTMLInputElement;
     if(fileInput) fileInput.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckCompatibility = async () => {
    const currentItemName = itemName.trim();
    if (!currentItemName && imagePreviews.length === 0) {
      toast({
        title: 'Item details required',
        description: 'Please enter an item name or upload a photo to check.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setAlternatives(null);
    setAdvice(null);
    setAnalyzedItemName(currentItemName);

    const input: CheckItemCompatibilityInput = {
      userProfile: profile,
      itemName: currentItemName,
      photoDataUris: imagePreviews.length > 0 ? imagePreviews : undefined,
    };

    try {
      const response = await checkItemCompatibility(input);
      if (!response.isValidItem) {
        toast({
          title: 'Invalid Item',
          description: 'Please enter a valid drug, food, or supplement name.',
          variant: 'destructive',
        });
        setResult(null);
      } else {
        setResult(response);
      }
    } catch (error) {
      console.error('Compatibility check failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not get a compatibility analysis. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'Logged out successfully.' });
  }

  const handleSuggestAlternatives = async () => {
    if (!analyzedItemName) return;
    setIsSuggesting(true);
    setAlternatives(null);

    const input: SuggestAlternativesInput = {
      userProfile: profile,
      itemName: analyzedItemName,
    };

    try {
      const response = await suggestAlternatives(input);
      setAlternatives(response);
    } catch (error) {
      console.error('Suggest alternatives failed:', error);
      toast({
        title: 'Suggestion Failed',
        description: 'Could not get suggestions. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGetPostIngestionAdvice = async () => {
    if (!analyzedItemName) return;
    setIsAdvising(true);
    setAdvice(null);

    const input: GetPostIngestionAdviceInput = {
      userProfile: profile,
      itemName: analyzedItemName,
    };

    try {
      const response = await getPostIngestionAdvice(input);
      setAdvice(response);
    } catch (error) {
      console.error('Get advice failed:', error);
      toast({
        title: 'Advice Failed',
        description: 'Could not get advice. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsAdvising(false);
    }
  };

  const showActionButtons = result && result.riskLevel && ['Low', 'Moderate', 'High'].includes(result.riskLevel);
  const isAppDisabled = profileLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background text-foreground">
       <header className="absolute top-4 right-4 z-50 flex items-center gap-4">
        {user ? (
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium flex items-center gap-2"><UserIcon className="h-4 w-4" /> {user.email}</span>
                <Button variant="outline" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
            </div>
        ) : (
            <AuthDialog />
        )}
        <ThemeToggle />
      </header>
      <main className="p-4 py-8 md:p-8 md:py-12 lg:p-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <section className="text-center mb-12 md:mb-16">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <HeartPulse className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              MediMatch AI
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
              Instantly check if a new food or drug is compatible with your personal health profile.
            </p>
            <Alert variant="default" className="max-w-2xl mx-auto mt-6 text-left border-accent/50 bg-accent/10">
              <Info className="h-4 w-4 text-accent" />
              <AlertTitle className="font-semibold text-accent">Important Disclaimer</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                This app is not a substitute for medical advice. Always consult with a qualified healthcare professional before making any decisions about your health, medication, or diet.
              </AlertDescription>
            </Alert>
          </section>

          <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12", isAppDisabled && "opacity-50 pointer-events-none")}>
            
            <section id="profile" aria-labelledby="profile-heading" className="space-y-6">
              <div>
                <h2 id="profile-heading" className="text-3xl font-bold tracking-tight">Your Health Profile</h2>
                <p className="text-muted-foreground mt-2">
                  {isFirebaseConfigured
                    ? user
                      ? 'Your health details are saved to your account.'
                      : 'Log in to save your profile. Currently, data is stored for this session only.'
                    : 'Configure Firebase in your .env file to enable user accounts and data persistence.'}
                </p>
              </div>
              {profileLoading ? (
                 <div className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                 </div>
              ): (
                <div className="space-y-4">
                  <TagList
                    id="allergies-input"
                    title="Allergies"
                    Icon={Ban}
                    items={profile.allergies}
                    setItems={handleProfileChange('allergies')}
                    placeholder="e.g., Penicillin"
                    category="allergies"
                    disabled={isAppDisabled}
                  />
                  <TagList
                    id="medications-input"
                    title="Current Medications"
                    Icon={Pill}
                    items={profile.medications}
                    setItems={handleProfileChange('medications')}
                    placeholder="e.g., Metformin 500mg"
                    category="medications"
                    disabled={isAppDisabled}
                  />
                  <TagList
                    id="conditions-input"
                    title="Medical Conditions"
                    Icon={Stethoscope}
                    items={profile.conditions}
                    setItems={handleProfileChange('conditions')}
                    placeholder="e.g., Type 2 Diabetes"
                    category="conditions"
                    disabled={isAppDisabled}
                  />
                </div>
              )}
            </section>

            <aside id="checker" aria-labelledby="checker-heading" className="lg:sticky top-8 self-start">
               <Card className="shadow-xl shadow-primary/5 border-primary/20 dark:shadow-primary/10">
                <CardHeader>
                  <CardTitle id="checker-heading" className="text-3xl font-bold tracking-tight">Compatibility Checker</CardTitle>
                  <CardDescription>Enter an item's details to check against your profile.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                     <div className="space-y-2">
                      <Label htmlFor="item-photo" className="font-semibold">Item Photo(s) (Optional, up to 5)</Label>
                      <div className="flex items-start gap-4">
                        <label htmlFor="item-photo" className="flex-shrink-0 flex flex-col items-center justify-center h-28 w-28 rounded-lg border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:bg-accent/10 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1 text-center">Upload Photo(s)</span>
                        </label>
                        <Input id="item-photo" type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                         <div className="flex flex-wrap gap-2 flex-1">
                          {imagePreviews.map((preview, index) => (
                             <div key={index} className="relative flex-shrink-0">
                              <Image src={preview} alt={`Item preview ${index + 1}`} width={80} height={80} className="h-20 w-20 object-cover rounded-lg border-2 border-border" data-ai-hint="medication product" />
                              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md" onClick={() => removeImage(index)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-name-input" className="font-semibold">Item Name</Label>
                      <Input
                        id="item-name-input"
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="e.g., Tylenol 500mg, Coffee"
                        className="flex-grow text-base"
                        aria-label="Item to check"
                      />
                    </div>
                    
                    <Button onClick={handleCheckCompatibility} disabled={isLoading} className="w-full text-base py-6 font-bold">
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <HeartPulse className="mr-2 h-5 w-5" /> }
                      {isLoading ? 'Checking...' : 'Check Compatibility'}
                    </Button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {isLoading && (
                       <Card>
                         <CardHeader>
                           <Skeleton className="h-6 w-3/4" />
                         </CardHeader>
                         <CardContent className="space-y-2 pt-6">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-5/6" />
                         </CardContent>
                       </Card>
                    )}

                    {result && result.riskLevel && (() => {
                      const riskConfig = riskDisplayConfig[result.riskLevel!];
                      const title = analyzedItemName || (imagePreviews.length > 0 ? "the uploaded item" : "the item");
                      return (
                        <Card className={cn("animate-in fade-in-50 duration-500", riskConfig.cardClass)}>
                          <CardHeader>
                            <CardTitle className={cn("flex items-center gap-2 text-xl", riskConfig.textClass)}>
                              <riskConfig.Icon className="h-6 w-6" /> {riskConfig.label}
                            </CardTitle>
                            <CardDescription>
                              Analysis for "{title}"
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{result.analysis}</p>
                            {showActionButtons && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Button onClick={handleSuggestAlternatives} disabled={isSuggesting} variant="secondary">
                                  {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                  {isSuggesting ? 'Thinking...' : 'Suggest Alternatives'}
                                </Button>
                                <Button onClick={handleGetPostIngestionAdvice} disabled={isAdvising} variant="destructive">
                                  {isAdvising ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-2 h-4 w-4" />}
                                  {isAdvising ? 'Checking...' : 'Advice if Already Taken'}
                                </Button>
                              </div>
                            )}
                            <Alert variant="default" className="mt-6 border-accent/50 bg-transparent">
                              <Info className="h-4 w-4 text-accent" />
                              <AlertTitle className="text-accent">Medical Disclaimer</AlertTitle>
                              <AlertDescription className="text-muted-foreground">
                                {result.disclaimer}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      );
                    })()}
                    
                    {isSuggesting && (
                      <Card><CardContent className="pt-6 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                    )}
                    {alternatives && (
                       <Card className="animate-in fade-in-50 duration-500">
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-accent">
                             <Lightbulb/> Suggested Alternatives
                           </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                            {alternatives.alternatives.map((alt, index) => (
                              <div key={index} className="p-3 rounded-md border bg-background">
                                <p className="font-semibold">{alt.name}</p>
                                <p className="text-sm text-muted-foreground">{alt.reason}</p>
                              </div>
                            ))}
                         </CardContent>
                       </Card>
                    )}

                    {isAdvising && (
                       <Card><CardContent className="pt-6 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>
                    )}
                    {advice && (
                       <Card className="border-destructive/50 bg-destructive/10 animate-in fade-in-50 duration-500">
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-destructive">
                             <HelpCircle/> Post-Ingestion Info
                           </CardTitle>
                         </CardHeader>
                         <CardContent>
                            <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{advice.advice}</p>
                            <Alert variant="destructive" className="mt-4 bg-transparent">
                              <Info className="h-4 w-4" />
                              <AlertTitle>Urgent Disclaimer</AlertTitle>
                              <AlertDescription>
                                {advice.disclaimer}
                              </AlertDescription>
                            </Alert>
                         </CardContent>
                       </Card>
                    )}

                    {!isLoading && !result && (
                       <div className="flex items-center justify-center text-center h-[200px] py-10 px-4 border-2 border-dashed rounded-lg">
                         <p className="text-muted-foreground">
                          {user ? 'Your compatibility report will appear here.' : 'Log in or fill out your profile to get started.'}
                         </p>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
