"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { T } from "@/lib/design-tokens";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
}

interface UserPickerProps {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function UserPicker({
  users,
  value,
  onChange,
  placeholder = "Select user…",
  disabled = false,
  className,
}: UserPickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => users.find((u) => u.id === value),
    [users, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !selected && "text-muted-foreground",
            className
          )}
          style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600 }}
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <div
                className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style={{ background: T.primaryLight, color: T.primary }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "12px" }}
                >
                  person
                </span>
              </div>
              <span className="truncate" style={{ fontFamily: T.fontDisplay, fontWeight: 600, color: T.onSurface }}>{selected.name}</span>
              <span className="text-xs ml-auto truncate hidden sm:inline" style={{ fontFamily: T.fontBody, color: T.muted }}>
                {selected.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                person_search
              </span>
              <span style={{ fontFamily: T.fontBody, fontWeight: 400 }}>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command className="">
          <CommandInput placeholder="Search by name or email…" className="" style={{ fontFamily: T.fontBody }} />
          <CommandList className="">
            <CommandEmpty className="">
              <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "28px" }}
                >
                  person_off
                </span>
                <span className="text-sm" style={{ fontFamily: T.fontBody }}>No user found</span>
              </div>
            </CommandEmpty>
            <CommandGroup className="">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.name + " " + user.email + " " + user.id}
                  onSelect={() => {
                    onChange(user.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-2.5 px-3"
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={{ background: T.primaryLight, color: T.primary }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      person
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate" style={{ fontFamily: T.fontDisplay, fontSize: "14px", fontWeight: 600, color: T.onSurface }}>
                      {user.name}
                    </div>
                    <div className="truncate" style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.muted }}>
                      {user.email}
                      {user.role && (
                        <span className="ml-2 opacity-60" style={{ fontFamily: T.fontLabel, fontSize: "11px" }}>
                          · {user.role.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      value === user.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                    style={{ color: T.primary }}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
