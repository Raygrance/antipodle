import { useEffect, useMemo, useState } from "react";
import ExportsTreemap from "./components/ExportsTreemap";
import {
  MAX_GUESSES,
  buildPuzzle,
  countries,
  dataMeta,
  exporterForDay,
  exportsOf,
  judge,
  localDayNumber,
  randomExporter,
} from "./lib/game";

type Mode = { kind: "daily"; day: number } | { kind: "practice"; iso: string };

const storageKey = (day: number) => `antipodle:guesses:${day}`;

function loadGuesses(day: number): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(day)) ?? "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => ({ kind: "daily", day: localDayNumber() }));
  const exporterIso = mode.kind === "daily" ? exporterForDay(mode.day) : mode.iso;
  const puzzle = useMemo(() => buildPuzzle(exporterIso), [exporterIso]);

  const [guesses, setGuesses] = useState<string[]>(() =>
    mode.kind === "daily" ? loadGuesses(mode.day) : [],
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (mode.kind !== "daily") return;
    try {
      localStorage.setItem(storageKey(mode.day), JSON.stringify(guesses));
    } catch {
      /* storage unavailable: game still works */
    }
  }, [guesses, mode]);

  const feedback = guesses.map((g) => judge(g, puzzle));
  const won = feedback.some((f) => f.correct);
  const lost = !won && guesses.length >= MAX_GUESSES;
  const done = won || lost;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const match = countries.find((c) => c.name.toLowerCase() === input.trim().toLowerCase());
    if (!match) return setError("Pick a country from the list.");
    if (guesses.includes(match.iso)) return setError("Already guessed that one.");
    if (match.iso === puzzle.exporter.iso) {
      return setError("That's the exporter. Guess the country opposite it!");
    }
    setError("");
    setInput("");
    setGuesses([...guesses, match.iso]);
  }

  function playRandom() {
    setMode({ kind: "practice", iso: randomExporter(exporterIso) });
    setGuesses([]);
    setError("");
    setCopied(false);
  }

  async function share() {
    const label = mode.kind === "daily" ? `Antipodle #${mode.day - 20000}` : "Antipodle (practice)";
    const rows = feedback.map((f) => f.arrow).join("");
    const text = `${label} ${won ? guesses.length : "X"}/${MAX_GUESSES}\n${rows}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("Copy your result:", text);
    }
  }

  const data = exportsOf(exporterIso);

  return (
    <main>
      <header>
        <h1>Antipodle</h1>
        <p className="sub">
          These goods are exported by a country. Guess the country on the <em>opposite side of
          the world</em>.
        </p>
      </header>

      <section className="card" aria-label="Exports">
        <ExportsTreemap data={data} />
      </section>

      <section aria-label="Guesses">
        {Array.from({ length: MAX_GUESSES }).map((_, idx) => {
          const f = feedback[idx];
          return (
            <div className={`guess ${f?.correct ? "ok" : ""}`} key={idx}>
              {f ? (
                <>
                  <span className="g-name">{f.country.name}</span>
                  <span className="g-km">{f.correct ? "Correct!" : `${f.km.toLocaleString()} km`}</span>
                  <span className="g-arrow">{f.arrow}</span>
                </>
              ) : (
                <span className="g-empty">&nbsp;</span>
              )}
            </div>
          );
        })}
      </section>

      {!done ? (
        <form onSubmit={submit}>
          <input
            list="country-list"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Guess the opposite country…"
            autoComplete="off"
          />
          <datalist id="country-list">
            {countries.map((c) => (
              <option key={c.iso} value={c.name} />
            ))}
          </datalist>
          <button type="submit">Guess ({guesses.length}/{MAX_GUESSES})</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <section className="card result">
          <h2>{won ? "Nice!" : "Not this time"}</h2>
          <p>
            The exporter was <strong>{puzzle.exporter.name}</strong>. Its antipode (
            {puzzle.antipodePoint.lat.toFixed(1)}°, {puzzle.antipodePoint.lon.toFixed(1)}°) is
            nearest to <strong>{puzzle.answer.name}</strong>
            {puzzle.answerOffsetKm > 500
              ? ` (about ${puzzle.answerOffsetKm.toLocaleString()} km away, mostly ocean on the other side).`
              : "."}
          </p>
          <div className="actions">
            <button onClick={share}>{copied ? "Copied!" : "Share"}</button>
            <button className="secondary" onClick={playRandom}>
              Play a random one
            </button>
          </div>
        </section>
      )}

      <footer>
        {dataMeta?.source === "placeholder"
          ? "Trade data is placeholder; see README to load real data."
          : `Trade data: ${dataMeta?.source}, retrieved ${dataMeta?.retrieved}.`}
      </footer>
    </main>
  );
}
