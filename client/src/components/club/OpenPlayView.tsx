import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarPlus,
  ChevronLeft,
  Crown,
  RefreshCw,
  Users,
  X,
} from "lucide-react";
import { openExternal } from "@/lib/external";
import { contact } from "@/lib/siteContent";
import { toIcsUtc } from "@/lib/booking/ics";
import {
  gamesPerPlayer,
  OPEN_PLAY_CAP_OPTIONS,
  OPEN_PLAY_HOURS,
  recommendedCap,
} from "@/lib/booking/openPlay";
import { formatLongDay, formatTimeRange, manilaNow } from "@/lib/booking/time";

const SESSION_START = 18 * 60;

export function CapacityMeter({
  joined,
  max,
  label = "players joined",
}: {
  joined: number;
  max: number;
  label?: string;
}) {
  const percentage = Math.min(100, Math.round((joined / max) * 100));
  return (
    <div className="capacity-meter">
      <div className="capacity-heading">
        <span>
          <Users size={14} /> {label}
        </span>
        <strong>
          {joined} <small>/ {max}</small>
        </strong>
      </div>
      <div className="capacity-track">
        <i style={{ width: `${percentage}%` }} />
      </div>
      <span className="capacity-note">
        {joined >= max
          ? "Session full"
          : `${max - joined} spot${max - joined === 1 ? "" : "s"} open · host max ${max}`}
      </span>
    </div>
  );
}

type OpenPlayRole = "host" | "participant";
type OpenPlayPlayer = {
  name: string;
  level: string;
  games: number;
  wait: number;
  joined: string;
  you?: boolean;
};

const openPlayPlayers: OpenPlayPlayer[] = [
  {
    name: "Alex dela Cruz",
    level: "3.5",
    games: 1,
    wait: 0,
    joined: "6:05 PM",
  },
  { name: "Mia Santos", level: "3.0", games: 1, wait: 2, joined: "6:08 PM" },
  { name: "Jon Bell", level: "3.5", games: 0, wait: 8, joined: "6:02 PM" },
  { name: "Camille Reyes", level: "4.0", games: 1, wait: 3, joined: "6:12 PM" },
  { name: "Paolo Lim", level: "3.0", games: 0, wait: 11, joined: "6:15 PM" },
  { name: "Nina Garcia", level: "3.5", games: 0, wait: 7, joined: "6:18 PM" },
  { name: "Rafael Tan", level: "4.0", games: 1, wait: 4, joined: "6:20 PM" },
  { name: "Bea Navarro", level: "3.0", games: 0, wait: 9, joined: "6:22 PM" },
];

function OpenPlayRoleToggle({
  role,
  setRole,
}: {
  role: OpenPlayRole;
  setRole: (role: OpenPlayRole) => void;
}) {
  return (
    <div className="role-toggle" role="radiogroup" aria-label="Open play view">
      {(
        [
          ["host", "Host mode", Crown],
          ["participant", "Participant view", Users],
        ] as const
      ).map(([id, label, Icon]) => (
        <button
          key={id}
          role="radio"
          aria-checked={role === id}
          className={role === id ? "active" : ""}
          onClick={() => setRole(id)}
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>
  );
}

export function OpenPlayView({ onBack }: { onBack: () => void }) {
  const [role, setRoleState] = useState<OpenPlayRole>(() =>
    new URLSearchParams(window.location.search).get("role") === "participant"
      ? "participant"
      : "host"
  );
  const [rotationVersion, setRotationVersion] = useState(0);
  const [hours, setHours] = useState(3);
  const [maxPlayers, setMaxPlayers] = useState(() => recommendedCap(3));
  const today = manilaNow().date;
  const sessionEnd = SESSION_START + hours * 60;
  const sessionTime = formatTimeRange(SESSION_START, sessionEnd);
  const recommended = recommendedCap(hours);
  const [hasJoined, setHasJoined] = useState(false);
  const setRole = (next: OpenPlayRole) => {
    setRoleState(next);
    const url = new URL(window.location.href);
    if (next === "participant") url.searchParams.set("role", "participant");
    else url.searchParams.delete("role");
    window.history.replaceState(null, "", url);
  };
  const players = useMemo(
    () =>
      hasJoined
        ? [
            ...openPlayPlayers,
            {
              name: "You",
              level: "3.5",
              games: 0,
              wait: 0,
              joined: "now",
              you: true,
            },
          ]
        : openPlayPlayers,
    [hasJoined]
  );
  const queue = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          a.games - b.games ||
          b.wait - a.wait ||
          ((players.indexOf(a) + rotationVersion) % players.length) -
            ((players.indexOf(b) + rotationVersion) % players.length)
      ),
    [players, rotationVersion]
  );
  const joined = players.length;
  const isHost = role === "host";
  const yourPosition = queue.findIndex(player => player.you) + 1;
  const isFull = joined >= maxPlayers;
  const toggleJoin = () => {
    if (hasJoined) {
      setHasJoined(false);
      toast("You left the open play queue");
      return;
    }
    if (isFull) {
      toast("This session is full");
      return;
    }
    setHasJoined(true);
    toast("You're in! Watch the queue for your next game");
  };
  const participantPanel = (
    <aside className="host-tools participant-tools">
      <div className="eyebrow light">YOUR SPOT</div>
      {hasJoined ? (
        <>
          <h2>
            {yourPosition <= 4 ? (
              <>
                You’re up
                <br />
                <em>next game.</em>
              </>
            ) : (
              <>
                #{yourPosition}
                <br />
                <em>in line.</em>
              </>
            )}
          </h2>
          <div className="host-stat">
            <strong>{Math.max(0, Math.ceil(yourPosition / 4) - 1)}</strong>
            <span>games before you play</span>
          </div>
          <div className="host-stat">
            <strong>0</strong>
            <span>games played tonight</span>
          </div>
          <button className="outline-light" onClick={toggleJoin}>
            Leave queue <X size={14} />
          </button>
        </>
      ) : (
        <>
          <h2>
            Grab a<br />
            <em>paddle.</em>
          </h2>
          <div className="host-stat">
            <strong>{Math.max(0, maxPlayers - joined)}</strong>
            <span>spots still open</span>
          </div>
          <div className="host-stat">
            <strong>4</strong>
            <span>players per game</span>
          </div>
          <button
            className="lime-button participant-join"
            disabled={isFull}
            onClick={toggleJoin}
          >
            {isFull ? (
              "Session full"
            ) : (
              <>
                Join open play <ArrowRight size={14} />
              </>
            )}
          </button>
        </>
      )}
    </aside>
  );
  const hostPanel = (
    <aside className="host-tools">
      <div className="eyebrow light">HOST TOOLKIT</div>
      <h2>
        More play.
        <br />
        <em>Less waiting.</em>
      </h2>
      <div className="host-stat">
        <strong>4</strong>
        <span>players per game</span>
      </div>
      <div className="host-stat">
        <strong>11m</strong>
        <span>longest current rest</span>
      </div>
      <button
        className="outline-light"
        onClick={() => toast("Current game marked complete; queue advanced")}
      >
        Complete current game <ArrowRight size={14} />
      </button>
    </aside>
  );
  return (
    <div className={`openplay-page ${isHost ? "is-host" : "is-participant"}`}>
      <div className="openplay-top">
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={16} /> Back to club
        </button>
        <OpenPlayRoleToggle role={role} setRole={setRole} />
        <button
          className="outline-button"
          onClick={() => {
            const params = new URLSearchParams({
              action: "TEMPLATE",
              text: "Baseline Open Play",
              details: isHost
                ? "Hosted open play session. Rotation order is managed for equal rest time."
                : "Open play session. The host rotates players so everyone gets equal court time.",
              location: contact.address,
              dates: `${toIcsUtc(today, SESSION_START)}/${toIcsUtc(today, sessionEnd)}`,
            });
            openExternal(
              `https://calendar.google.com/calendar/render?${params.toString()}`
            );
            toast("Google Calendar opened with your event details");
          }}
        >
          <CalendarPlus size={15} /> Add session to Google Calendar
        </button>
      </div>
      <div className="openplay-hero">
        <div>
          <div className="eyebrow">
            {isHost ? "OPEN PLAY HOST MODE" : "OPEN PLAY"} ·{" "}
            {formatLongDay(today).toUpperCase()} · {sessionTime} · COURT 03
          </div>
          <h1>
            {isHost ? (
              <>
                Keep the rally
                <br />
                <em>moving.</em>
              </>
            ) : (
              <>
                Play more.
                <br />
                <em>Wait less.</em>
              </>
            )}
          </h1>
          <p>
            {isHost
              ? "Run an open play where every player gets the most court time with the least waiting. The queue favors players with fewer games and longer rest first."
              : "Join the session and see exactly where you stand. The host rotates players fairly, so fewer games and longer rest always move you up."}
          </p>
        </div>
        <div className="openplay-capacity">
          <span className="summary-label">SESSION CAPACITY</span>
          <strong>
            {joined} <small>/ {maxPlayers}</small>
          </strong>
          <CapacityMeter
            joined={joined}
            max={maxPlayers}
            label="players joined"
          />
          {isHost ? (
            <>
              <label>
                Session length
                <select
                  value={hours}
                  onChange={event => setHours(Number(event.target.value))}
                >
                  {OPEN_PLAY_HOURS.map(option => (
                    <option key={option} value={option}>
                      {option} hour{option === 1 ? "" : "s"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Host max
                <select
                  value={maxPlayers}
                  onChange={event => setMaxPlayers(Number(event.target.value))}
                  aria-describedby="cap-hint"
                >
                  {OPEN_PLAY_CAP_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option} players · about {gamesPerPlayer(option, hours)}{" "}
                      games each{option === recommended ? " (recommended)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p className="cap-hint" id="cap-hint">
                {maxPlayers === recommended ? (
                  <>
                    Recommended for {hours} hour{hours === 1 ? "" : "s"}:
                    everyone gets about {gamesPerPlayer(maxPlayers, hours)}{" "}
                    games.
                  </>
                ) : (
                  <>
                    For {hours} hour{hours === 1 ? "" : "s"} we recommend{" "}
                    {recommended} players (about{" "}
                    {gamesPerPlayer(recommended, hours)} games each).{" "}
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => setMaxPlayers(recommended)}
                    >
                      Use {recommended}
                    </button>
                  </>
                )}
              </p>
            </>
          ) : (
            <label>
              Max players
              <span className="capacity-readonly">
                {maxPlayers} players · about {gamesPerPlayer(maxPlayers, hours)}{" "}
                games each
              </span>
            </label>
          )}
        </div>
      </div>
      <div className="openplay-grid">
        <section className="rotation-card">
          <div className="rotation-heading">
            <div>
              <span className="eyebrow">FAIR ROTATION ORDER</span>
              <h2>Who plays next.</h2>
            </div>
            {isHost && (
              <button
                className="lime-button"
                onClick={() => {
                  setRotationVersion(version => version + 1);
                  toast("Rotation rebalanced for equal rest time");
                }}
              >
                <RefreshCw size={15} /> Rebalance queue
              </button>
            )}
          </div>
          <p className="rotation-note">
            <Crown size={15} />{" "}
            {isHost
              ? "Priority is calculated from games played, then minutes waiting. No one gets stuck on the sideline."
              : "The host manages this queue. Fewer games and longer rest move players up, so no one gets stuck on the sideline."}
          </p>
          <div className="rotation-list">
            {queue.map((player, index) => (
              <div
                className={`rotation-row ${player.you ? "is-you" : ""}`}
                key={player.name}
              >
                <span className="rotation-rank">{index + 1}</span>
                <div className="player-avatar">
                  {player.you
                    ? "ME"
                    : player.name
                        .split(" ")
                        .map(part => part[0])
                        .join("")}
                </div>
                <div className="rotation-player">
                  <strong>{player.name}</strong>
                  <span>
                    Level {player.level} · joined {player.joined}
                  </span>
                </div>
                <div className="player-games">
                  <strong>{player.games}</strong>
                  <span>games</span>
                </div>
                <div className="player-wait">
                  <strong>{player.wait}m</strong>
                  <span>rest</span>
                </div>
                <span className={`play-next ${index < 4 ? "next" : "queued"}`}>
                  {index < 4 ? "NEXT GAME" : "IN QUEUE"}
                </span>
              </div>
            ))}
          </div>
        </section>
        {isHost ? hostPanel : participantPanel}
      </div>
      <div className="fairness-explainer">
        <div>
          <span className="eyebrow">HOW THE QUEUE WORKS</span>
          <h2>Equal turns, by design.</h2>
        </div>
        <div className="fairness-steps">
          <span>
            <b>01</b> Fewer games move first.
          </span>
          <span>
            <b>02</b> Longer rest breaks ties.
          </span>
          <span>
            <b>03</b> Host advances the next four.
          </span>
        </div>
      </div>
    </div>
  );
}
