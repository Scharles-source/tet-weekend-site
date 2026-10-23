import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-inherit no-underline">
      <span className={`font-[family-name:var(--font-archivo-black)] leading-none tracking-tight ${compact ? "text-[22px]" : "text-[28px]"}`}>
        <span className="text-[#191410]">T</span>
        <span className="text-[#E02B20]">W</span>
      </span>
      <span className="leading-[1.05]">
        <span className={`block font-[family-name:var(--font-display)] font-extrabold text-[#191410] ${compact ? "text-[13px]" : "text-[15px]"}`}>tèt</span>
        <span className={`block font-[family-name:var(--font-display)] font-black tracking-[0.08em] text-[#E02B20] ${compact ? "text-[11px]" : "text-[13px]"}`}>WEEKEND</span>
      </span>
    </Link>
  );
}
