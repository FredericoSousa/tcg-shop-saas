'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipListInputProps {
  values: string[]
  onChange: (values: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ChipListInput({
  values,
  onChange,
  suggestions = [],
  placeholder = 'Adicionar...',
  className,
  disabled = false,
}: ChipListInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredSuggestions = suggestions.filter(
    s => !values.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  )

  const addChip = (value: string) => {
    const v = value.trim().toUpperCase()
    if (v && !values.includes(v)) {
      onChange([...values, v])
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeChip = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) {
        addChip(input)
      }
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      removeChip(values.length - 1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1 min-h-[32px] rounded-md border bg-background px-1.5 py-1 text-xs transition-colors',
          'focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary',
          disabled && 'opacity-50 pointer-events-none'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((chip, i) => (
          <span
            key={`${chip}-${i}`}
            className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeChip(i) }}
              className="ml-0.5 rounded-full hover:bg-primary/25 p-0.5 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={values.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[60px] bg-transparent outline-none text-2xs placeholder:text-muted-foreground/50"
          disabled={disabled}
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-[160px] overflow-y-auto rounded-md border bg-popover shadow-md">
          {filteredSuggestions.map(suggestion => (
            <button
              key={suggestion}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors cursor-pointer"
              onMouseDown={(e) => { e.preventDefault(); addChip(suggestion) }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
