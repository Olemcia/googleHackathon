"use client";

import { useState } from 'react';
import {
  Ban,
  Pill,
  Stethoscope,
  TestTube2,
  Loader2,
  Info,
  HeartPulse,
} from 'lucide-react';
import { TagList } from '@/components/tag-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  checkItemCompatibility,
  type CheckItemCompatibilityInput,
  type CheckItemCompatibilityOutput,
} from '@/ai/flows/check-item-compatibility';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const [result, setResult] = useState<CheckItemCompatibilityOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleProfileChange = (field: keyof UserProfile) => (items: string[]) => {
    setProfile((prev) => ({ ...prev, [field]: items }));
  };

  const handleCheckCompatibility = async () => {
    if (!itemName.trim()) {
      toast({
        title: 'Item name is required',
        description: 'Please enter a drug or food item to check.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setResult(null);

    const input: CheckItemCompatibilityInput = {
      userProfile: profile,
      itemName: itemName.trim(),
    };

    try {
      const response = await checkItemCompatibility(input);
      setResult(response);
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-6 px-4 md:px-8 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <TestTube2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Health Harmony <span className="text-primary">AI</span>
          </h1>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          <section id="profile" aria-labelledby="profile-heading" className="lg:col-span-3">
            <div className="space-y-6">
              <div>
                <h2 id="profile-heading" className="text-2xl font-semibold">Your Health Profile</h2>
                <p className="text-muted-foreground mt-1">
                  Add your current health details for an accurate compatibility analysis. 
                  This information is processed in your browser and is not stored.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
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
            </div>
          </section>

          <aside id="checker" aria-labelledby="checker-heading" className="lg:col-span-2 lg:sticky top-28 self-start">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle id="checker-heading" className="text-2xl font-semibold">Compatibility Checker</CardTitle>
                <CardDescription>Enter a drug or food item to check against your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="item-name-input"
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Tylenol 500mg, Coffee"
                      className="flex-grow"
                      aria-label="Item to check"
                    />
                    <Button onClick={handleCheckCompatibility} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                      <Card className="bg-secondary/20 animate-in fade-in-50 duration-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <HeartPulse className="text-primary"/> Analysis for "{itemName}"
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.analysis}</p>
                          <Alert className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertTitle className="font-semibold text-amber-800 dark:text-amber-200">Medical Disclaimer</AlertTitle>
                            <AlertDescription className="text-amber-700 dark:text-amber-300">
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
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
