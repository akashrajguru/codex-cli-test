"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRAVITY = 0.6;
const JUMP_VELOCITY = 10;
const TICK_MS = 16;
const PLAYER_SIZE = 40;
const PLAYER_X = 64;
const OBSTACLE_HEIGHT = 32;
const OBSTACLE_WIDTH = 24;
const OBSTACLE_SPEED = 4;
const OBSTACLE_SPAWN_MS = 1200;
const MIN_OBSTACLE_SPAWN_MS = 650;
const SPAWN_RAMP_STEP = 30;
const SPEED_RAMP_STEP = 0.25;
const OBSTACLE_START_X = 560;
const DAY_NIGHT_MS = 3000;

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
};

export default function Home() {
  const positionRef = useRef(0);
  const velocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnTimerRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const obstacleSpeedRef = useRef(OBSTACLE_SPEED);
  const obstacleSpawnMsRef = useRef(OBSTACLE_SPAWN_MS);
  const dayNightTimerRef = useRef(0);
  const [playerY, setPlayerY] = useState(0);
  const [isOnGround, setIsOnGround] = useState(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [difficultyTier, setDifficultyTier] = useState(1);
  const [isNight, setIsNight] = useState(false);

  const jump = useCallback(() => {
    if (positionRef.current === 0 && !isGameOver) {
      velocityRef.current = JUMP_VELOCITY;
      setIsOnGround(false);
      setIsRunning(true);
    }
  }, [isGameOver]);

  const resetGame = useCallback(() => {
    positionRef.current = 0;
    velocityRef.current = 0;
    obstaclesRef.current = [];
    spawnTimerRef.current = 0;
    obstacleSpeedRef.current = OBSTACLE_SPEED;
    obstacleSpawnMsRef.current = OBSTACLE_SPAWN_MS;
    dayNightTimerRef.current = 0;
    setPlayerY(0);
    setIsOnGround(true);
    setObstacles([]);
    setIsGameOver(false);
    setIsRunning(false);
    setScore(0);
    setDifficultyTier(1);
    setIsNight(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (isGameOver || !isRunning) {
        return;
      }

      if (positionRef.current > 0 || velocityRef.current > 0) {
        velocityRef.current -= GRAVITY;
        positionRef.current = Math.max(
          0,
          positionRef.current + velocityRef.current
        );

        if (positionRef.current === 0) {
          velocityRef.current = 0;
        }

        setPlayerY(positionRef.current);
        setIsOnGround(positionRef.current === 0);
      }

      spawnTimerRef.current += TICK_MS;
      if (spawnTimerRef.current >= obstacleSpawnMsRef.current) {
        spawnTimerRef.current = 0;
        const next: Obstacle = {
          id: obstacleIdRef.current++,
          x: OBSTACLE_START_X,
          width: OBSTACLE_WIDTH,
          height: OBSTACLE_HEIGHT,
        };
        obstaclesRef.current = [...obstaclesRef.current, next];
      }

      if (obstaclesRef.current.length > 0) {
        obstaclesRef.current = obstaclesRef.current
          .map((obstacle) => ({
            ...obstacle,
            x: obstacle.x - obstacleSpeedRef.current,
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > 0);
      }

      dayNightTimerRef.current += TICK_MS;
      if (dayNightTimerRef.current >= DAY_NIGHT_MS) {
        dayNightTimerRef.current = 0;
        setIsNight((current) => !current);
      }

      const hit = obstaclesRef.current.some((obstacle) => {
        const overlapsX =
          obstacle.x < PLAYER_X + PLAYER_SIZE &&
          obstacle.x + obstacle.width > PLAYER_X;
        const overlapsY = positionRef.current < obstacle.height;
        return overlapsX && overlapsY;
      });

      if (hit) {
        setIsGameOver(true);
      } else {
        setScore((current) => {
          const nextScore = current + 1;
          if (nextScore % 120 === 0) {
            obstacleSpeedRef.current += SPEED_RAMP_STEP;
            obstacleSpawnMsRef.current = Math.max(
              MIN_OBSTACLE_SPAWN_MS,
              obstacleSpawnMsRef.current - SPAWN_RAMP_STEP
            );
            setDifficultyTier((currentTier) => currentTier + 1);
          }
          return nextScore;
        });
      }

      setObstacles([...obstaclesRef.current]);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [isGameOver, isRunning]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-amber-50 to-amber-100 px-4 py-10 text-slate-900">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-slate-600">
          <span>Offline Run</span>
          <span>Score {score}</span>
          <span
            key={difficultyTier}
            data-testid="tier"
            className={difficultyTier > 1 ? "tier-pulse" : ""}
          >
            Tier {difficultyTier}
          </span>
        </header>

        <section
          className={`relative h-72 w-full overflow-hidden rounded-3xl border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.6)] ${
            isNight
              ? "bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-900"
              : "bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100"
          }`}
          onPointerDown={jump}
          role="button"
          tabIndex={0}
          aria-label="Game arena. Tap or press space to jump."
        >
          <div
            data-testid="haze"
            className="haze-drift absolute left-[-10%] top-10 h-24 w-72 rounded-full bg-gradient-to-r from-white/55 via-white/35 to-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            data-testid="haze"
            className="haze-drift-slow absolute right-[-20%] top-24 h-28 w-80 rounded-full bg-gradient-to-r from-white/40 via-white/25 to-white/5 blur-2xl"
            aria-hidden="true"
          />
          <div
            data-testid="ground"
            className={`absolute inset-x-0 bottom-0 h-16 ${
              isNight
                ? "bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500"
                : "bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500"
            }`}
          />
          <div
            data-testid="player"
            className="absolute bottom-16 left-16"
            style={{ transform: `translateY(${-playerY}px)` }}
            aria-label={isOnGround ? "Player ready" : "Player jumping"}
          >
            <div className="relative h-10 w-12">
              <div className="absolute bottom-1 left-1 h-6 w-10 rounded-full bg-amber-400 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.35)]" />
              <div
                className={`absolute bottom-3 left-2 h-3 w-5 rounded-full bg-amber-300 ${
                  isOnGround ? "" : "duck-wing-flap"
                }`}
              />
              <div className="absolute bottom-5 left-7 h-4 w-4 rounded-full bg-amber-400" />
              <div className="absolute bottom-6 left-9 h-2 w-3 rounded-sm bg-orange-500" />
              <div className="absolute bottom-7 left-8 h-1 w-1 rounded-full bg-slate-900" />
              <div className="absolute bottom-0 left-2 h-2 w-3 rounded-full bg-amber-600" />
            </div>
          </div>
          {obstacles.map((obstacle) => (
            <div
              key={obstacle.id}
              data-testid="obstacle"
              className="absolute bottom-16 rounded-md bg-emerald-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.35)]"
              style={{
                width: `${obstacle.width}px`,
                height: `${obstacle.height}px`,
                transform: `translateX(${obstacle.x}px)`,
              }}
              aria-hidden="true"
            />
          ))}
          {isNight ? (
            <div
              data-testid="moon"
              className="absolute right-10 top-8 h-10 w-10 rounded-full bg-slate-100 shadow-[0_0_12px_rgba(248,250,252,0.7)]"
              aria-hidden="true"
            >
              <div className="absolute right-2 top-2 h-6 w-6 rounded-full bg-slate-800" />
            </div>
          ) : (
            <div
              data-testid="sun"
              className="absolute right-10 top-8 h-10 w-10 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.9)]"
              aria-hidden="true"
            />
          )}
          {isNight && (
            <>
              <div
                data-testid="star"
                className="star-twinkle absolute left-1/4 top-8 h-1 w-1 rounded-full bg-white/80"
                style={{ animationDelay: "0s" }}
              />
              <div
                data-testid="star"
                className="star-twinkle absolute left-1/3 top-16 h-1.5 w-1.5 rounded-full bg-white/70"
                style={{ animationDelay: "0.6s" }}
              />
              <div
                data-testid="star"
                className="star-twinkle absolute left-2/3 top-12 h-1 w-1 rounded-full bg-white/60"
                style={{ animationDelay: "1.1s" }}
              />
              <div
                data-testid="star"
                className="star-twinkle absolute left-[20%] top-28 h-1.5 w-1.5 rounded-full bg-white/70"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                data-testid="star"
                className="star-twinkle absolute left-[70%] top-28 h-1 w-1 rounded-full bg-white/80"
                style={{ animationDelay: "0.9s" }}
              />
              <div
                data-testid="star"
                className="star-twinkle absolute left-[80%] top-16 h-1.5 w-1.5 rounded-full bg-white/60"
                style={{ animationDelay: "1.4s" }}
              />
            </>
          )}
          <div className="absolute left-1/2 top-10 h-6 w-6 rounded-full bg-white/70 blur-[1px]" />
          <div className="absolute left-1/3 top-20 h-8 w-8 rounded-full bg-white/60 blur-[1px]" />

          {!isRunning && !isGameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 text-slate-100">
              <span className="rounded-full border-2 border-slate-100 px-5 py-2 text-xs uppercase tracking-[0.3em]">
                Press Space to Start
              </span>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 text-slate-100">
              <p className="text-lg font-semibold uppercase tracking-[0.2em]">
                Game Over
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                Final score {score}
              </p>
              <button
                type="button"
                onClick={resetGame}
                className="rounded-full border-2 border-slate-100 px-4 py-1 text-xs uppercase tracking-[0.2em] transition hover:bg-slate-100 hover:text-slate-900"
              >
                Restart
              </button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-700">
          <p className="font-medium">
            Tap or press{" "}
            <span className="rounded bg-slate-900 px-2 py-1 text-slate-100">
              Space
            </span>{" "}
            to jump.
          </p>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Avoid the blocks
          </span>
        </div>
      </main>
    </div>
  );
}
