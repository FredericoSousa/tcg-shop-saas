"use client";

import * as React from "react";
import { Input } from "./input";
import { formatPhone, unmaskPhone, formatCurrency, formatDecimal } from "@/lib/utils/format";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: "phone" | "currency" | "decimal";
  onValueChange?: (value: string | number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onValueChange, onChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        const stringValue = String(value);
        if (mask === "phone") {
          setDisplayValue(formatPhone(stringValue));
        } else if (mask === "currency") {
          setDisplayValue(formatCurrency(stringValue));
        } else if (mask === "decimal") {
          setDisplayValue(formatDecimal(stringValue));
        }
      }
    }, [value, mask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      let formattedValue = "";
      let finalValue: string | number = "";

      if (mask === "phone") {
        const unmasked = unmaskPhone(rawValue);
        formattedValue = formatPhone(unmasked);
        finalValue = unmasked;
      } else if (mask === "currency") {
        // For currency, we want to allow typing numbers and it automatically formats
        // Remove everything except numbers
        const digits = rawValue.replace(/\D/g, "");
        const numValue = parseInt(digits || "0", 10) / 100;
        formattedValue = formatCurrency(numValue);
        finalValue = numValue;
      } else if (mask === "decimal") {
        const digits = rawValue.replace(/\D/g, "");
        const numValue = parseInt(digits || "0", 10) / 100;
        formattedValue = formatDecimal(numValue);
        finalValue = numValue;
      }

      setDisplayValue(formattedValue);
      
      if (onValueChange) {
        onValueChange(finalValue);
      }

      if (onChange) {
        // Create a fake event with the unmasked value for form compatibility
        const fakeEvent = {
          ...e,
          target: {
            ...e.target,
            value: String(finalValue),
            name: props.name || "",
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(fakeEvent);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
