import React from 'react';

interface MoneyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({ 
  value, 
  onChange, 
  className = "", 
  placeholder = "R$ 0,00",
  ...props 
}) => {
  
  // Função para formatar o valor numérico para exibição (R$ 1.234,56)
  const formatDisplay = (val: number | string) => {
    if (val === '' || val === undefined || val === null) return '';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não for dígito
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Se estiver vazio, retorna 0
    if (!rawValue) {
      onChange(0);
      return;
    }

    // Converte para float considerando os centavos (ex: 1234 -> 12.34)
    const numberValue = parseInt(rawValue, 10) / 100;
    
    onChange(numberValue);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={formatDisplay(value)}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};