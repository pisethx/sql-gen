import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown } from "lucide-react"

export type Option = {
  label: string
  value: string
}

type MultiSelectProps = {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className = "w-[300px]"
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const selectedLabels = options
    .filter(option => selected.includes(option.value))
    .map(option => option.label)
    .join(", ")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className={`${className} justify-between`}>
          {selected.length > 0 ? selectedLabels : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${className} p-0`}>
        <Command>
          <CommandGroup>
            {options.map(option => (
              <CommandItem
                key={option.value}
                onSelect={() => toggleOption(option.value)}
                className="flex items-center justify-between"
              >
                {option.label}
                <Checkbox
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleOption(option.value)}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
