"use client";

import { useState, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

interface TagListProps {
  title: string;
  Icon: LucideIcon;
  items: string[];
  setItems: (items: string[]) => void;
  placeholder: string;
  id: string;
}

export function TagList({ title, Icon, items, setItems, placeholder, id }: TagListProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !items.find(item => item.toLowerCase() === trimmedValue.toLowerCase())) {
      setItems([...items, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setItems(items.filter((item) => item !== itemToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <Card className="h-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <Icon className="h-6 w-6 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={`Add new ${title}`}
            className="text-base"
          />
          <Button type="button" onClick={handleAddItem} size="icon" aria-label={`Add ${inputValue}`}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
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
