import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

type Mode = "easy" | "normal";
type Phase = "start" | "playing" | "clear";

interface Ghost {
  id: number;
  x: number; // %
  y: number; // %
  size: number; // px
  tilt: number; // deg
  opacity: number;
  found: boolean;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
}

interface SaveData {
  bestEasy: number | null;
  bestNormal: number | null;
  clears: number;
}

const SAVE_KEY = "halloween-obake-sagashi-save-v1";
const GHOST_COUNT: Record<Mode, number> = { easy: 5, normal: 10 };

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        bestEasy: typeof parsed.bestEasy === "number" ? parsed.bestEasy : null,
        bestNormal:
          typeof parsed.bestNormal === "number" ? parsed.bestNormal : null,
        clears: typeof parsed.clears === "number" ? parsed.clears : 0,
      };
    }
  } catch {
    // ignore
  }
  return { bestEasy: null, bestNormal: null, clears: 0 };
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  if (m <= 0) return `${s}びょう`;
  return `${m}ふん ${s}びょう`;
}

function formatTimeShort(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 隠れ場所候補（飾りの近くなど）。ラウンドごとにシャッフルして使う
const SPOTS: Array<{ x: number; y: number }> = [
  { x: 6, y: 10 },
  { x: 78, y: 8 },
  { x: 42, y: 16 },
  { x: 88, y: 34 },
  { x: 14, y: 38 },
  { x: 60, y: 30 },
  { x: 28, y: 55 },
  { x: 72, y: 58 },
  { x: 48, y: 68 },
  { x: 8, y: 72 },
  { x: 86, y: 78 },
  { x: 34, y: 82 },
];

function makeGhosts(mode: Mode): Ghost[] {
  const count = GHOST_COUNT[mode];
  const spots = [...SPOTS].sort(() => Math.random() - 0.5).slice(0, count);
  return spots.map((spot, i) => {
    const jitterX = (Math.random() - 0.5) * 6;
    const jitterY = (Math.random() - 0.5) * 6;
    return {
      id: i,
      x: Math.min(88, Math.max(2, spot.x + jitterX)),
      y: Math.min(84, Math.max(4, spot.y + jitterY)),
      size: mode === "easy" ? 56 + Math.random() * 14 : 44 + Math.random() * 16,
      tilt: Math.round((Math.random() - 0.5) * 24),
      opacity: mode === "easy" ? 0.95 : 0.75 + Math.random() * 0.25,
      found: false,
    };
  });
}

// 背景の飾り（タップ対象ではない）
const DECORATIONS = [
  { emoji: "🎃", x: 80, y: 68, size: 52 },
  { emoji: "🎃", x: 4, y: 60, size: 40 },
  { emoji: "🦇", x: 22, y: 8, size: 30 },
  { emoji: "🦇", x: 64, y: 12, size: 26 },
  { emoji: "🦇", x: 52, y: 4, size: 22 },
  { emoji: "🏚️", x: 36, y: 74, size: 64 },
  { emoji: "🌲", x: 90, y: 50, size: 48 },
  { emoji: "🌲", x: 2, y: 26, size: 44 },
  { emoji: "🪦", x: 58, y: 80, size: 36 },
  { emoji: "🕸️", x: 92, y: 4, size: 36 },
  { emoji: "⭐", x: 16, y: 18, size: 18 },
  { emoji: "⭐", x: 70, y: 22, size: 16 },
  { emoji: "⭐", x: 46, y: 8, size: 14 },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("easy");
  const [phase, setPhase] = useState<Phase>("start");
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [lastTime, setLastTime] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  const startAtRef = useRef<number>(0);
  const sparkleIdRef = useRef(0);
  const sceneRef = useRef<HTMLDivElement>(null);

  const foundCount = ghosts.filter((g) => g.found).length;
  const total = ghosts.length;

  const startGame = useCallback(
    (nextMode: Mode) => {
      setMode(nextMode);
      setGhosts(makeGhosts(nextMode));
      setElapsed(0);
      setSparkles([]);
      setIsNewBest(false);
      startAtRef.current = Date.now();
      setPhase("playing");
    },
    [],
  );

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      setElapsed((Date.now() - startAtRef.current) / 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase]);

  const handleGhostTap = (id: number) => {
    if (phase !== "playing") return;
    setGhosts((prev) => {
      const target = prev.find((g) => g.id === id);
      if (!target || target.found) return prev;
      const next = prev.map((g) => (g.id === id ? { ...g, found: true } : g));
      const found = next.filter((g) => g.found).length;
      if (found >= next.length) {
        const finalTime = (Date.now() - startAtRef.current) / 1000;
        setElapsed(finalTime);
        setLastTime(finalTime);
        setSave((prevSave) => {
          const key = mode === "easy" ? "bestEasy" : "bestNormal";
          const prevBest = prevSave[key];
          const newBest = prevBest === null || finalTime < prevBest;
          setIsNewBest(newBest);
          const updated: SaveData = {
            ...prevSave,
            clears: prevSave.clears + 1,
            [key]: newBest ? Math.floor(finalTime * 10) / 10 : prevBest,
          };
          try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        window.setTimeout(() => setPhase("clear"), 450);
      }
      return next;
    });
  };

  const handleSceneTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "playing" || !sceneRef.current) return;
    if ((e.target as HTMLElement).closest(".ghost")) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = ++sparkleIdRef.current;
    setSparkles((prev) => [...prev.slice(-5), { id, x, y }]);
    window.setTimeout(
      () => setSparkles((prev) => prev.filter((s) => s.id !== id)),
      600,
    );
  };

  const bestForMode = mode === "easy" ? save.bestEasy : save.bestNormal;

  return (
    <div className="app">
      <header className="header">
        <h1>🎃 ハロウィンおばけ探し 👻</h1>
        <p className="subtitle">よるの まちに かくれた おばけを さがそう！</p>
      </header>

      <div className="stats" aria-live="polite">
        <div className="stat">
          <span className="stat-label">みつけた</span>
          <span className="stat-value">
            {phase === "start" ? "－" : `${foundCount} / ${total}`}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">じかん</span>
          <span className="stat-value">{formatTimeShort(elapsed)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">ベストタイム</span>
          <span className="stat-value">
            {bestForMode === null ? "まだない" : formatTime(bestForMode)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">クリア</span>
          <span className="stat-value">{save.clears}かい</span>
        </div>
      </div>

      <div className="mode-row" role="group" aria-label="むずかしさ">
        <button
          type="button"
          className={`mode-btn ${mode === "easy" ? "active" : ""}`}
          onClick={() => startGame("easy")}
        >
          かんたん 👻×5
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === "normal" ? "active" : ""}`}
          onClick={() => startGame("normal")}
        >
          ふつう 👻×10
        </button>
      </div>

      <div
        className="scene"
        ref={sceneRef}
        onClick={handleSceneTap}
        role="application"
        aria-label="おばけが かくれている よるのシーン"
      >
        <div className="moon" aria-hidden="true">🌕</div>
        {DECORATIONS.map((d, i) => (
          <span
            key={i}
            className="deco"
            style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: d.size }}
            aria-hidden="true"
          >
            {d.emoji}
          </span>
        ))}

        {phase !== "start" &&
          ghosts.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`ghost ${g.found ? "found" : ""}`}
              style={{
                left: `${g.x}%`,
                top: `${g.y}%`,
                fontSize: g.size,
                opacity: g.found ? 1 : g.opacity,
                transform: `rotate(${g.tilt}deg)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleGhostTap(g.id);
              }}
              aria-label={g.found ? "みつけた おばけ" : "おばけ"}
              aria-pressed={g.found}
            >
              {g.found ? "😊" : "👻"}
              {g.found && <span className="found-badge">みつけた！</span>}
            </button>
          ))}

        {sparkles.map((s) => (
          <span
            key={s.id}
            className="sparkle"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            aria-hidden="true"
          >
            ✨
          </span>
        ))}

        {phase === "start" && (
          <div className="overlay">
            <p className="overlay-emoji">👻 🎃 🦇</p>
            <p className="overlay-text">
              おばけが かくれているよ。
              <br />
              みつけたら タップしてね！
            </p>
            <button
              type="button"
              className="big-btn"
              onClick={() => startGame(mode)}
            >
              ▶ スタート
            </button>
          </div>
        )}

        {phase === "clear" && (
          <div className="overlay">
            <p className="overlay-emoji">🎉 👻 🎃</p>
            <p className="overlay-title">ぜんぶ みつけた！</p>
            <p className="overlay-text">
              かかった じかん：{formatTime(lastTime)}
              {isNewBest && (
                <>
                  <br />
                  <strong>✨ ベストタイム こうしん！ ✨</strong>
                </>
              )}
            </p>
            <button
              type="button"
              className="big-btn"
              onClick={() => startGame(mode)}
            >
              🔁 もういっかい あそぶ
            </button>
          </div>
        )}
      </div>

      <p className="hint">
        {phase === "playing"
          ? `あと ${total - foundCount}ひき！ よーく みて さがしてね 👀`
          : "モードを えらんで「スタート」を おしてね。まちがえて タップしても だいじょうぶだよ。"}
      </p>

      <footer className="footer">
        ベストタイムと クリア回数は この端末に ほぞんされます。
      </footer>
    </div>
  );
}
