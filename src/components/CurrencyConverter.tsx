"use client";

import { useState } from "react";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { CURRENCY_MAP } from "@/lib/currencies";
import CurrencySelect from "./CurrencySelect";
import AmountInput from "./AmountInput";
import SwapButton from "./SwapButton";
import RateDisplay from "./RateDisplay";

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("CNY");
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<"from" | "to">("from");

  const { data, isLoading, error, convert, refetch } = useExchangeRate();

  const handleFromAmountChange = (value: string) => {
    setAmount(value);
    setDirection("from");
  };

  const handleToAmountChange = (value: string) => {
    setAmount(value);
    setDirection("to");
  };

  const handleFromCurrencyChange = (code: string) => {
    if (code === toCurrency) {
      setToCurrency(fromCurrency);
    }
    setFromCurrency(code);
  };

  const handleToCurrencyChange = (code: string) => {
    if (code === fromCurrency) {
      setFromCurrency(toCurrency);
    }
    setToCurrency(code);
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatResult = (value: number, currencyCode: string): string => {
    const info = CURRENCY_MAP.get(currencyCode);
    const decimals = info?.decimals ?? 2;
    return value.toFixed(decimals);
  };

  const getDisplayAmounts = (): { fromAmount: string; toAmount: string } => {
    const num = parseFloat(amount);
    if (!data) {
      return direction === "from"
        ? { fromAmount: amount, toAmount: "" }
        : { fromAmount: "", toAmount: amount };
    }
    if (isNaN(num)) {
      return direction === "from"
        ? { fromAmount: amount, toAmount: "" }
        : { fromAmount: "", toAmount: amount };
    }

    if (direction === "from") {
      const result = convert(num, fromCurrency, toCurrency);
      return {
        fromAmount: amount,
        toAmount: result !== null ? formatResult(result, toCurrency) : "",
      };
    } else {
      const result = convert(num, toCurrency, fromCurrency);
      return {
        fromAmount: result !== null ? formatResult(result, fromCurrency) : "",
        toAmount: amount,
      };
    }
  };

  const { fromAmount, toAmount } = getDisplayAmounts();
  const unitRate = convert(1, fromCurrency, toCurrency);

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl p-6 shadow-warm" style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)" }}>
      <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-center mb-6" style={{ color: "var(--foreground)" }}>
        💱 汇率换算器
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={refetch}
            className="mt-2 text-sm underline cursor-pointer"
            style={{ color: "var(--accent)" }}
          >
            重试
          </button>
        </div>
      )}

      <div className="rounded-xl p-4 space-y-2" style={{ border: "1px solid var(--border)" }}>
        <CurrencySelect value={fromCurrency} onChange={handleFromCurrencyChange} />
        <AmountInput
          value={fromAmount}
          onChange={handleFromAmountChange}
          label="从"
          disabled={isLoading}
        />
      </div>

      <SwapButton onClick={handleSwap} />

      <div className="rounded-xl p-4 space-y-2" style={{ border: "1px solid var(--border)" }}>
        <CurrencySelect value={toCurrency} onChange={handleToCurrencyChange} />
        <AmountInput
          value={toAmount}
          onChange={handleToAmountChange}
          label="到"
          disabled={isLoading}
        />
      </div>

      <RateDisplay
        fromCode={fromCurrency}
        toCode={toCurrency}
        rate={unitRate}
        lastUpdated={data?.lastUpdated ?? null}
        isLoading={isLoading}
      />
    </div>
  );
}
