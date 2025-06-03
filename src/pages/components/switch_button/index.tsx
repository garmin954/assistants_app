"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SwitchButtonProps {
  className?: string;
  options: Option[];
  active: string;
  disabled?: boolean;
  onChange: (value: string) => Promise<unknown>;
}

export default function SwitchButton({
  className,
  options = [],
  active,
  disabled = false,
  onChange,
}: SwitchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (value: string) => {
    if (value === active || isLoading || disabled) return;
    setIsLoading(true);
    try {
      await onChange(value);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-gray-200 bg-white p-1 relative h-16",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <motion.div
        className="absolute h-[calc(100%-0.5rem)] rounded-[4px] bg-primary flex w-[calc(50%-0.25rem)]"
        initial={false}
        animate={{
          x: active === options[0]?.value ? 0 : `calc(100% + 0px)`,
        }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleClick(option.value)}
          disabled={isLoading || disabled}
          className={`relative z-10 h-[calc(100%-0.5rem)] w-fit px-4 rounded-[4px] text-[1.2rem] font-medium transition-colors text-center flex-1
            ${
              option.value === active
                ? "text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
        >
          {isLoading && option.value === active ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin" />
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  );
}
