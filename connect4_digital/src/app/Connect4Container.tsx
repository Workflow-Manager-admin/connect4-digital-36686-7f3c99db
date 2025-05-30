"use client";
import React, { useState, useRef } from "react";

// PUBLIC_INTERFACE
export interface Connect4Props {
  columns?: number;
  rows?: number;
}

type Player = 1 | 2 | null;

interface CellState {
  player: Player;
  isDropping: boolean;
}

// Color Theme
const COLORS = {
  player1: "#1976D2", // primary
  player2: "#FFC107", // secondary
  accent: "#E53935",
  background: "#ffffff",
  cell: "#e0e5ed",
  empty: "#e8ebf0",
  border: "#b1b6be",
};

const ROWS = 6;
const COLS = 7;
const ANIMATION_DURATION = 180; // ms per cell when dropping

// PUBLIC_INTERFACE
function Connect4Container({ columns = COLS, rows = ROWS }: Connect4Props) {
  // --- State ---
  // The actual board state: [row][col] (0 is top)
  const [board, setBoard] = useState<Player[][]>(
    Array(rows).fill(null).map(() => Array(columns).fill(null))
  );
  // For animating dropping discs
  const [animatedCells, setAnimatedCells] = useState<CellState[][]>(
    Array(rows).fill(null).map(() => Array(columns).fill({ player: null, isDropping: false }))
  );

  const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationLock = useRef(false);

  // --- Handlers ---
  // PUBLIC_INTERFACE
  function resetGame() {
    setBoard(Array(rows).fill(null).map(() => Array(columns).fill(null)));
    setAnimatedCells(Array(rows).fill(null).map(() => Array(columns).fill({ player: null, isDropping: false })));
    setCurrentPlayer(1);
    setWinner(null);
    setIsAnimating(false);
    animationLock.current = false;
  }

  // PUBLIC_INTERFACE
  function handleColumnClick(col: number) {
    if (winner || isAnimating) return;

    // Find the lowest empty cell in the column
    let targetRow = -1;
    for (let row = rows - 1; row >= 0; row--) {
      if (board[row][col] == null) {
        targetRow = row;
        break;
      }
    }
    if (targetRow === -1) return; // Column full

    animateDiscDrop(targetRow, col, currentPlayer);
  }

  // Animate the disc dropping down the column
  function animateDiscDrop(targetRow: number, col: number, player: Player) {
    if (animationLock.current) return;
    animationLock.current = true;
    setIsAnimating(true);

    // Helper to animate cell-by-cell
    function stepAnim(idx: number) {
      setAnimatedCells((prev) => {
        const next = prev.map((rowArr) => rowArr.map((cell) => ({ ...cell })));
        // Clean up previous animation if any
        if (idx > 0) next[idx - 1][col] = { player: null, isDropping: false };
        // Set this cell dropping
        if (idx <= targetRow) next[idx][col] = { player, isDropping: true };
        return next;
      });

      if (idx < targetRow) {
        setTimeout(() => stepAnim(idx + 1), ANIMATION_DURATION);
      } else {
        setTimeout(() => {
          // Finalize board and cleanup animated cells
          setBoard((prev) => {
            const next = prev.map((row) => [...row]);
            next[targetRow][col] = player;
            return next;
          });
          setAnimatedCells((prev) => {
            const next = prev.map((row) => row.map((cell) => ({ ...cell })));
            next[targetRow][col] = { player: null, isDropping: false };
            return next;
          });
          animationLock.current = false;
          setIsAnimating(false);
          checkForWinner(targetRow, col, player);
          togglePlayer();
        }, ANIMATION_DURATION);
      }
    }
    stepAnim(0);
  }

  // Toggle player if no win/draw
  function togglePlayer() {
    setTimeout(() => {
      // Check for draw
      if (board.every(row => row.every((cell) => cell !== null))) {
        setWinner("draw");
        return;
      }
      setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
    }, 50);
  }

  // Win detection algorithm
  function checkForWinner(row: number, col: number, player: Player) {
    if (!player) return;
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal /
      [1, -1],  // diagonal \
    ];

    function count(dx: number, dy: number) {
      let total = 1;
      // forward
      for (let d = 1; d < 4; d++) {
        const r = row + d * dx, c = col + d * dy;
        if (r < 0 || c < 0 || r >= rows || c >= columns || board[r][c] !== player)
          break;
        total += 1;
      }
      // backward
      for (let d = 1; d < 4; d++) {
        const r = row - d * dx, c = col - d * dy;
        if (r < 0 || c < 0 || r >= rows || c >= columns || board[r][c] !== player)
          break;
        total += 1;
      }
      return total >= 4;
    }

    const hasWinner = directions.some(([dx, dy]) => count(dx, dy));
    if (hasWinner) setWinner(player);
  }

  // --- Render ---
  function renderCell(row: number, col: number) {
    const cellPlayer = board[row][col];
    // Prefer animated disc if exists
    const anim = animatedCells[row][col];
    const showAnim = anim && anim.isDropping && anim.player != null;

    const discColor =
      cellPlayer === 1
        ? COLORS.player1
        : cellPlayer === 2
        ? COLORS.player2
        : COLORS.empty;

    // Animation overlay for dropping disc
    return (
      <div
        key={`${row}-${col}`}
        className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all"
        style={{
          background: COLORS.cell,
          border: `2px solid ${COLORS.border}`,
          borderRadius: "9999px",
          overflow: "hidden",
          boxShadow: "0 2px 6px 0 #b7b7b733",
        }}
      >
        {cellPlayer != null && (
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            style={{
              background: discColor,
              transition: "background .2s",
              boxShadow:
                cellPlayer === 1
                  ? `0 0 0 4px #bbdefb22, 0 0 0 8px #1976D211`
                  : `0 0 0 4px #fff8e122, 0 0 0 8px #FFC10711`,
            }}
            aria-label={`Player ${cellPlayer} disc`}
          />
        )}
        {/* Animated disc, overlays on top while dropping */}
        {showAnim && (
          <div
            className="absolute left-1/2 top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full pointer-events-none animate-dropDisc"
            style={{
              background: anim.player === 1 ? COLORS.player1 : COLORS.player2,
              transform: "translate(-50%, 0%)",
              transition: "background .2s",
              zIndex: 2,
            }}
            aria-label={`Player ${anim.player} disc dropping`}
          />
        )}
      </div>
    );
  }

  // PUBLIC_INTERFACE
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-2 py-8"
      style={{
        background: COLORS.background,
      }}
    >
      <h1 className="text-3xl font-bold mb-8 text-gray-800 tracking-tight">
        Connect 4 Digital
      </h1>
      {/* Game grid */}
      <div
        className="grid rounded-lg p-4 pt-2 pb-4 shadow-lg"
        style={{
          gridTemplateRows: `repeat(${rows}, minmax(2.5rem, 1fr))`,
          gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 1fr))`,
          background: "#e9f0fc",
          borderRadius: 20,
          boxShadow: `0 5px 32px -10px #164ea388`,
          gap: 8,
        }}
      >
        {/* Top invisible clickable row */}
        {[...Array(columns)].map((_, col) => (
          <button
            // unreachable if animating
            key={`col-top-${col}`}
            type="button"
            tabIndex={isAnimating || winner ? -1 : 0}
            aria-label={`Drop disc in column ${col + 1}`}
            disabled={!!winner || isAnimating}
            onClick={() => handleColumnClick(col)}
            className={`h-0 w-full mb-[-12px] col-span-1 cursor-pointer bg-transparent border-none focus-visible:outline-none`}
            style={{ gridColumn: col + 1, gridRow: 1, position: "relative" }}
          ></button>
        ))}
        {/* Game cells */}
        {[...Array(rows * columns)].map((_, idx) => {
          const row = Math.floor(idx / columns);
          const col = idx % columns;
          return (
            <div
              key={`cell-${row}-${col}`}
              className="flex items-center justify-center"
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                minWidth: "2.5rem",
                minHeight: "2.5rem",
                cursor:
                  winner || isAnimating
                    ? "not-allowed"
                    : board[0][col] === null
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {renderCell(row, col)}
            </div>
          );
        })}
      </div>
      {/* Bottom bar: Info + Reset */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 items-center">
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-lg font-semibold shadow border-2 border-gray-200 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-200"
          style={{
            background:
              "linear-gradient(90deg, #fff6f7 0%, #e5e9ee 100%)",
            color: COLORS.accent,
            borderColor: COLORS.accent,
          }}
          onClick={resetGame}
        >
          Reset Game
        </button>
        <div className="text-lg font-semibold ml-0 sm:ml-8 flex items-center min-h-[42px]">
          {winner === "draw"
            ? (
                <span>
                  <span role="img" aria-label="Draw" className="mr-1">🤝</span>
                  It&apos;s a draw!
                </span>
              )
            : winner ? (
                <span>
                  <span
                    className="inline-block w-4 h-4 rounded-full mr-2 align-middle"
                    style={{
                      background:
                        winner === 1
                          ? COLORS.player1
                          : COLORS.player2,
                    }}
                  />
                  Player {winner} wins!
                </span>
              )
            : (
                <span>
                  <span
                    className="inline-block w-4 h-4 rounded-full mr-2 align-middle"
                    style={{
                      background:
                        currentPlayer === 1
                          ? COLORS.player1
                          : COLORS.player2,
                    }}
                  />
                  Player {currentPlayer}&apos;s turn
                </span>
              )}
        </div>
      </div>
      {/* Animation keyframes for falling disc */}
      <style>
        {`
        @keyframes dropDisc {
          0% { transform: translate(-50%,-180%); opacity: 0.5;}
          80% { opacity: 1;}
          100% { transform: translate(-50%, 0%); opacity: 1;}
        }
        .animate-dropDisc {
          animation: dropDisc ${ANIMATION_DURATION / 1000}s cubic-bezier(0.16,1,0.3,1);
        }
        `}
      </style>
    </div>
  );
}

export default Connect4Container;
