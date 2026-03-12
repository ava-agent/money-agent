interface ClawAmountProps {
  amount: number;
  sign?: "+" | "-";
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
};

export default function ClawAmount({
  amount,
  sign,
  size = "md",
}: ClawAmountProps) {
  const colorClass =
    sign === "+"
      ? "text-green-600"
      : sign === "-"
        ? "text-red-600"
        : "text-amber-600";

  const sizeClass = SIZE_CLASSES[size];

  return (
    <span className={`${colorClass} ${sizeClass} whitespace-nowrap`}>
      {sign ?? ""}
      {amount.toLocaleString()} $C
    </span>
  );
}
