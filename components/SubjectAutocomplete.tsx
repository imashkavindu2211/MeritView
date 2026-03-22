"use client";

import { useState, useRef, useEffect } from "react";
import { SUBJECTS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SubjectAutocompleteProps {
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  onSelect?: (value: string) => void;
  className?: string;
  showAllOption?: boolean;
}

export function SubjectAutocomplete({ 
  id, 
  name, 
  placeholder = "Search subject...", 
  required = false, 
  defaultValue = "",
  onSelect,
  className,
  showAllOption = false
}: SubjectAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length > 0 && isOpen) {
      let filtered = (SUBJECTS as unknown as string[]).filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      );
      
      const limited = filtered.slice(0, 10);
      
      if (showAllOption && "all subjects".includes(query.toLowerCase())) {
        limited.unshift("ALL_SUBJECTS");
      }
      
      setSuggestions(limited);
    } else if (isOpen && query.length === 0 && showAllOption) {
      setSuggestions(["ALL_SUBJECTS"]);
    } else {
      setSuggestions([]);
    }
  }, [query, isOpen, showAllOption]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (subject: string) => {
    const displayValue = subject === "ALL_SUBJECTS" ? "All Subjects" : subject;
    setQuery(displayValue);
    setIsOpen(false);
    if (onSelect) onSelect(subject);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    if (onSelect) onSelect("");
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="text"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
          {query ? (
            <X className="w-4 h-4 cursor-pointer hover:text-foreground" onClick={handleClear} />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-primary/5">
          <div className="max-h-68 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {suggestions.map((s) => (
              <div
                key={s}
                className="px-5 py-4 hover:bg-primary/10 cursor-pointer flex flex-col transition-all border-b last:border-0 border-neutral-100 group"
                onClick={() => handleSelect(s)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {s === "ALL_SUBJECTS" ? "🏆 All Subjects" : s}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.length > 0 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 rounded-2xl p-4 text-center text-muted-foreground text-sm shadow-xl">
          No matching subjects found.
        </div>
      )}
    </div>
  );
}
