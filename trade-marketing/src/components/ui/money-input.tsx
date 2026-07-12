import { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: number | null;
  onValueChange?: (value: number | null) => void;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // 🔥 Formata o valor para exibição
    const formatToBrazilianCurrency = (value: number | null): string => {
      if (value === null || value === undefined || isNaN(value)) return "";
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    // 🔥 Converte string com máscara para número
    const parseToNumber = (formattedValue: string): number | null => {
      const numericValue = formattedValue.replace(/\D/g, "");
      if (!numericValue) return null;
      const cents = parseInt(numericValue, 10);
      return cents / 100;
    };

    // 🔥 Atualiza o display quando o valor externo muda
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatToBrazilianCurrency(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    // 🔥 Manipula a digitação
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const numericOnly = rawValue.replace(/\D/g, "");
      
      if (!numericOnly) {
        setDisplayValue("");
        if (onValueChange) onValueChange(null);
        if (onChange) onChange(e);
        return;
      }

      const cents = parseInt(numericOnly, 10);
      const numberValue = cents / 100;
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numberValue);

      setDisplayValue(formatted);
      
      if (onValueChange) onValueChange(numberValue);
      
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    // 🔥 Manipula o foco - seleciona o texto para facilitar edição
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
      if (props.onFocus) props.onFocus(e);
    };

    // 🔥 Manipula blur - formata caso esteja vazio
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!displayValue) {
        setDisplayValue("");
      }
      if (props.onBlur) props.onBlur(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="R$ 0,00"
        className={props.className}
      />
    );
  }
);

MoneyInput.displayName = "MoneyInput";

export default MoneyInput;
