"use client";

import { useState, type KeyboardEvent, useEffect, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import {
  getSuggestions,
  type GetSuggestionsInput,
} from '@/ai/flows/get-suggestions';
import { useToast } from '@/hooks/use-toast';

interface TagListProps {
  title: string;
  Icon: LucideIcon;
  items: string[];
  setItems: (items: string[]) => void;
  placeholder: string;
  id: string;
  category: 'allergies' | 'medications' | 'conditions';
}

export function TagList({ title, Icon, items, setItems, placeholder, id, category }: TagListProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();

  const handleAddItem = (item: string) => {
    const trimmedValue = item.trim();
    if (trimmedValue && !items.find(i => i.toLowerCase() === trimmedValue.toLowerCase())) {
      setItems([...items, trimmedValue]);
    }
    setInputValue('');
    setSuggestions([]);
    setPopoverOpen(false);
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setItems(items.filter((item) => item !== itemToRemove));
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem(inputValue);
    }
  };

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setPopoverOpen(false);
      return;
    }
    setIsSuggesting(true);
    try {
      const input: GetSuggestionsInput = { category, query };
      const response = await getSuggestions(input);
      if (response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
        setPopoverOpen(true);
      } else {
        setPopoverOpen(false);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      toast({
        title: 'Suggestion Error',
        description: 'Could not fetch autocomplete suggestions.',
        variant: 'destructive'
      })
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [category]);

  useEffect(() => {
    debouncedFetchSuggestions(inputValue);
  }, [inputValue, debouncedFetchSuggestions]);


  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <Icon className="h-6 w-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverAnchor asChild>
            <div className="flex gap-2 mb-4 relative">
              <Input
                id={id}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                aria-label={`Add new ${title}`}
                className="text-base"
                autoComplete="off"
              />
              <Button type="button" onClick={() => handleAddItem(inputValue)} size="icon" aria-label={`Add ${inputValue}`}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </PopoverAnchor>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-1">
            {isSuggesting ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddItem(suggestion)}
                    className="text-left p-2 text-sm rounded-sm hover:bg-accent"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {items.length > 0 ? (
            items.map((item) => (
              <Badge key={item} variant="secondary" className="text-base font-medium py-1 pl-3 pr-1 bg-secondary/80 text-secondary-foreground hover:bg-secondary transition-colors duration-200">
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item)}
                  className="ml-2 rounded-full hover:bg-black/10 p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </Badge>
            ))
          ) : (
            <div className="flex items-center h-full w-full">
              <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
