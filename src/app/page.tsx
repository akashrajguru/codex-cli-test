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
const OBSTACLE_START_X = 560;

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
  const [playerY, setPlayerY] = useState(0);
  const [isOnGround, setIsOnGround] = useState(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const jump = useCallback(() => {
    if (positionRef.current === 0 && !isGameOver) {
      velocityRef.current = JUMP_VELOCITY;
      setIsOnGround(false);
    }
  }, [isGameOver]);

  const resetGame = useCallback(() => {
    positionRef.current = 0;
    velocityRef.current = 0;
    obstaclesRef.current = [];
    spawnTimerRef.current = 0;
    setPlayerY(0);
    setIsOnGround(true);
    setObstacles([]);
    setIsGameOver(false);
    setScore(0);
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
      if (isGameOver) {
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
      if (spawnTimerRef.current >= OBSTACLE_SPAWN_MS) {
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
            x: obstacle.x - OBSTACLE_SPEED,
          }))
          .filter((obstacle) => obstacle.x + obstacle.width > 0);
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
        setScore((current) => current + 1);
      }

      setObstacles([...obstaclesRef.current]);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [isGameOver]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-200 via-amber-50 to-amber-100 px-4 py-10 text-slate-900">
      <main className="flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-slate-600">
          <span>Offline Run</span>
          <span>Score {score}</span>
        </header>

        <section
          className="relative h-72 w-full overflow-hidden rounded-3xl border-2 border-slate-900 bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.6)]"
          onPointerDown={jump}
          role="button"
          tabIndex={0}
          aria-label="Game arena. Tap or press space to jump."
        >
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500" />
          <div
            data-testid="player"
            className="absolute bottom-16 left-16 h-10 w-10 rounded-xl bg-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,0.4)]"
            style={{ transform: `translateY(${-playerY}px)` }}
            aria-label={isOnGround ? "Player ready" : "Player jumping"}
          />
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
          <div className="absolute left-1/2 top-10 h-6 w-6 rounded-full bg-white/70 blur-[1px]" />
          <div className="absolute left-1/3 top-20 h-8 w-8 rounded-full bg-white/60 blur-[1px]" />

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
