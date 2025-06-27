"use client";

import { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';

interface UserProfile {
  allergies: string[];
  medications: string[];
  conditions: string[];
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile>({
    allergies: ['Peanuts', 'Aspirin'],
    medications: ['Lisinopril 10mg'],
    conditions: ['High Blood Pressure'],
  });
  const [itemName, setItemName] = useState('Ibuprofen 200mg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<CheckItemCompatibilityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [analyzedItemName, setAnalyzedItemName] = useState('');

  const handleProfileChange = (field: keyof UserProfile) => (items: string[]) => {
    setProfile((prev) => ({ ...prev, [field]: items }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    const fileInput = document.getElementById('item-photo') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  const handleCheckCompatibility = async () => {
    const currentItemName = itemName.trim();
    if (!currentItemName && !imagePreview) {
      toast({
        title: 'Item details required',
        description: 'Please enter an item name or upload a photo to check.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setResult(null);

    const input: CheckItemCompatibilityInput = {
      userProfile: profile,
      itemName: currentItemName,
      photoDataUri: imagePreview || undefined,
    };

    try {
      const response = await checkItemCompatibility(input);
      setResult(response);
      setAnalyzedItemName(currentItemName);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background text-foreground">
      <header className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </header>
      <main className="p-4 py-8 md:p-8 md:py-12 lg:p-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <section className="text-center mb-12 md:mb-16">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <HeartPulse className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter">
              Health Harmony AI
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-muted-foreground">
              Instantly check if a new food or drug is compatible with your personal health profile.
            </p>
            <Alert variant="default" className="max-w-2xl mx-auto mt-6 text-left border-accent/50 bg-accent/10">
              <Info className="h-4 w-4 text-accent" />
              <AlertTitle className="font-semibold text-accent-foreground">Important Disclaimer</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                This app is not a substitute for medical advice. Always consult with a qualified healthcare professional before making any decisions about your health, medication, or diet.
              </AlertDescription>
            </Alert>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            <section id="profile" aria-labelledby="profile-heading" className="space-y-6">
              <div>
                <h2 id="profile-heading" className="text-3xl font-bold tracking-tight">Your Health Profile</h2>
                <p className="text-muted-foreground mt-2">
                  Add your current health details for an accurate compatibility analysis. This information is processed in your browser and is not stored.
                </p>
              </div>
              <div className="space-y-4">
                <TagList
                  id="allergies-input"
                  title="Allergies"
                  Icon={Ban}
                  items={profile.allergies}
                  setItems={handleProfileChange('allergies')}
                  placeholder="e.g., Penicillin"
                />
                <TagList
                  id="medications-input"
                  title="Current Medications"
                  Icon={Pill}
                  items={profile.medications}
                  setItems={handleProfileChange('medications')}
                  placeholder="e.g., Metformin 500mg"
                />
                <TagList
                  id="conditions-input"
                  title="Medical Conditions"
                  Icon={Stethoscope}
                  items={profile.conditions}
                  setItems={handleProfileChange('conditions')}
                  placeholder="e.g., Type 2 Diabetes"
                />
              </div>
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
                      <Label htmlFor="item-photo" className="font-semibold">Item Photo (Optional)</Label>
                      <div className="flex items-start gap-4">
                        {imagePreview ? (
                          <div className="relative flex-shrink-0">
                            <Image src={imagePreview} alt="Item preview" width={112} height={112} className="h-28 w-28 object-cover rounded-lg border-2 border-border" data-ai-hint="medication product" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md" onClick={removeImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="item-photo" className="flex-shrink-0 flex flex-col items-center justify-center h-28 w-28 rounded-lg border-2 border-dashed border-muted-foreground/50 cursor-pointer hover:bg-accent/10 transition-colors">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Upload Photo</span>
                          </label>
                        )}
                        <Input id="item-photo" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <p className="text-sm text-muted-foreground pt-2">
                          For best results, upload a clear photo of the item, such as the product packaging or the pill itself.
                        </p>
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
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        'Check Compatibility'
                      )}
                    </Button>
                  </div>

                  <div className="mt-6 space-y-4 min-h-[300px]">
                    {isLoading && (
                       <Card>
                         <CardHeader>
                           <Skeleton className="h-6 w-3/4" />
                         </CardHeader>
                         <CardContent className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-5/6" />
                         </CardContent>
                       </Card>
                    )}

                    {result && (
                      <Card className="border-primary/30 bg-primary/5 animate-in fade-in-50 duration-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-primary">
                            <HeartPulse/> Analysis for "{analyzedItemName || 'Uploaded Item'}"
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{result.analysis}</p>
                          <Alert variant="default" className="mt-6 border-accent/50 bg-transparent">
                            <Info className="h-4 w-4 text-accent" />
                            <AlertTitle className="text-accent-foreground">Medical Disclaimer</AlertTitle>
                            <AlertDescription className="text-muted-foreground">
                              {result.disclaimer}
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    )}
                    
                    {!isLoading && !result && (
                       <div className="flex items-center justify-center text-center h-full py-10 px-4 border-2 border-dashed rounded-lg">
                         <p className="text-muted-foreground">Your compatibility report will appear here.</p>
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
