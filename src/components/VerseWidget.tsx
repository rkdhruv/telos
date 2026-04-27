import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listVerses } from "../lib/queries";

const ROTATE_MS = 60_000;
const FADE_MS = 300;
const GAP_MS = 200;

function pickDifferent(currentIdx: number, length: number): number {
  if (length <= 1) return 0;
  const next = Math.floor(Math.random() * (length - 1));
  return next >= currentIdx ? next + 1 : next;
}

export function VerseWidget() {
  const { data: verses = [] } = useQuery({
    queryKey: ["verses"],
    queryFn: listVerses,
  });

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const transitionTimers = useRef<number[]>([]);
  const transitioning = useRef(false);

  // Initial pick: random verse on first load.
  const initialised = useRef(false);
  useEffect(() => {
    if (initialised.current || verses.length === 0) return;
    setIdx(Math.floor(Math.random() * verses.length));
    initialised.current = true;
  }, [verses.length]);

  const clearTimers = () => {
    transitionTimers.current.forEach((t) => window.clearTimeout(t));
    transitionTimers.current = [];
  };

  const advance = useCallback(() => {
    if (verses.length < 2 || transitioning.current) return;
    transitioning.current = true;
    setVisible(false);
    transitionTimers.current.push(
      window.setTimeout(() => {
        setIdx((i) => pickDifferent(i, verses.length));
        transitionTimers.current.push(
          window.setTimeout(() => {
            setVisible(true);
            transitionTimers.current.push(
              window.setTimeout(() => {
                transitioning.current = false;
              }, FADE_MS),
            );
          }, GAP_MS),
        );
      }, FADE_MS),
    );
  }, [verses.length]);

  useEffect(() => {
    if (verses.length < 2) return;
    const interval = window.setInterval(advance, ROTATE_MS);
    return () => {
      window.clearInterval(interval);
      clearTimers();
    };
  }, [verses.length, advance]);

  useEffect(() => () => clearTimers(), []);

  if (verses.length === 0) {
    return (
      <aside className="pointer-events-none absolute right-6 top-6 w-[280px]">
        <p className="font-display italic text-sm text-text-tertiary">
          Add your verses in Settings
        </p>
      </aside>
    );
  }

  const verse = verses[idx % verses.length];
  if (!verse) return null;

  return (
    <aside
      onClick={advance}
      className="absolute right-6 top-6 w-[280px] cursor-pointer select-none transition-opacity ease-soft"
      style={{ transitionDuration: `${FADE_MS}ms`, opacity: visible ? 1 : 0 }}
      aria-live="polite"
    >
      <p className="font-display italic text-base text-text-primary opacity-[0.85]">
        {verse.text}
      </p>
      {verse.reference && (
        <p className="mt-1 text-xs text-text-tertiary">{verse.reference}</p>
      )}
    </aside>
  );
}
