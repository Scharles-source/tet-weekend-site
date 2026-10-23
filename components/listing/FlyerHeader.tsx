"use client";

import { Expand } from "lucide-react";
import { useState, type Ref } from "react";
import { altFlyer, flyerFrameStyle } from "@/lib/listing/flyer";
import type { FlyerPublic } from "@/lib/listing/types";

const DEGRADE = "linear-gradient(150deg, #F97316, #E02B20 55%, #5B2EE5)";

export function FlyerHeader({
  flyer,
  title,
  dateLabel,
  lieu,
  variant,
  onOpen,
  boutonRef,
}: {
  flyer: FlyerPublic | null;
  title: string;
  dateLabel: string;
  lieu: string | null;
  variant: "carte" | "banniere";
  onOpen: () => void;
  boutonRef?: Ref<HTMLButtonElement>;
}) {
  const [echec, setEchec] = useState(false);
  const url = flyer && !echec ? flyer.cardUrl || flyer.publicUrl : null;
  const alt = altFlyer(title, lieu, dateLabel);
  const cadre = flyer ? flyerFrameStyle({ publicUrl: flyer.publicUrl, cardUrl: flyer.cardUrl }) : null;
  const style =
    variant === "carte"
      ? { backgroundColor: "#F3E6D8", aspectRatio: cadre?.aspectRatio ?? "4 / 3", borderTopLeftRadius: 20, borderTopRightRadius: 20 }
      : {
          width: "100%",
          minHeight: 240,
          maxHeight: 680,
          height: hauteurBanniere(flyer?.width, flyer?.height),
          backgroundColor: "#F3E6D8",
          borderRadius: 20,
        };

  return (
    <div className="relative overflow-hidden" style={style}>
      {url ? (
        <>
          {/* Image originale : contain, repli immédiat si le chargement échoue. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-[16px] brightness-[0.55]"
            onError={() => setEchec(true)}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flyer?.publicUrl ?? url} alt={alt} className="absolute inset-0 h-full w-full object-contain" onError={() => setEchec(true)} />
          <button
            ref={boutonRef}
            type="button"
            className="absolute inset-0 z-10 cursor-pointer"
            aria-label={`Voir le flyer entier de ${title}`}
            onClick={onOpen}
          >
            <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-[rgba(0,0,0,0.68)] px-[9px] py-[6px] text-xs text-white">
              <Expand size={16} aria-hidden />
              Voir le flyer
            </span>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center" style={{ background: DEGRADE }}>
          <p className="font-[family-name:var(--font-display)] text-[22px] font-black text-white">{title}</p>
        </div>
      )}
      <span className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-[#191410] px-2.5 py-1 text-xs font-semibold text-white">
        {dateLabel}
      </span>
    </div>
  );
}

function hauteurBanniere(width?: number | null, height?: number | null): string {
  if (!width || !height) return "min(680px, max(240px, 56vw))";
  const ratio = height / width;
  return `min(680px, max(240px, calc(100cqw * ${ratio})))`;
}
