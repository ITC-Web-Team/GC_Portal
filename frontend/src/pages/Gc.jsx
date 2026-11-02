import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./portal.css";
import "./gcdetail.css";
import logo from "../assets/logo.webp";
import { API, get } from "../api";

const GENRES = { genre1: "Software", genre2: "Hardware", genre3: "Pure Sciences", genre4: "Non Core" };
const SECTIONS = [["leaderboard", "Leaderboard"], ["hostels", "Hostels"], ["rules", "Rules"], ["gcs", "GCs"]];
const DAY = 864e5;

const ICONS = {
  back: <path d="M19 12H5M12 19l-7-7 7-7" />,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  link: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
};
const Icon = ({ n }) => (
  <svg className="gcd-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>
);

const fmt = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const absUrl = (u) => (/^https?:\/\//i.test(u) ? u : "https://" + u);
const host = (u) => { try { return new URL(absUrl(u)).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
const media = (p) => (!p ? "" : /^https?:/i.test(p) ? p : API + p);
const prepLevel = (p) => (/high/i.test(p) ? "high" : /med|mid/i.test(p) ? "mid" : "low");

function status(start, end) {
  const now = Date.now();
  if (now < start) return { k: "upcoming", t: `Starts in ${Math.ceil((start - now) / DAY)}d` };
  if (now <= end) return { k: "live", t: `Live · ends in ${Math.ceil((end - now) / DAY)}d` };
  return { k: "done", t: "Completed" };
}

/* turn plain URLs inside the description into clickable links */
const URL_RE = /(https?:\/\/[^\s]+)/g;
const Linkified = ({ text }) =>
  text.split(URL_RE).map((part, i) =>
    i % 2 ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part
  );

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <div className={"nav-wrap scrolled" + (open ? " open" : "")}>
      <nav className="nav">
        <Link to="/" className="logo" aria-label="Institute Technical Council">
          <img src={logo} alt="ITC - Institute Technical Council" />
        </Link>
        <div className="links">
          {SECTIONS.map(([id, label]) => (
            <Link key={id} to={`/#${id}`} className={id === "gcs" ? "active" : ""} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </div>
        <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}><i></i><i></i><i></i></button>
      </nav>
    </div>
  );
}

function Scoreboard({ scores, hostels, grow }) {
  if (!scores.length)
    return (
      <div className="gcd-empty">
        <span><Icon n="trophy" /></span>
        Scores will show up here once results are out.
      </div>
    );
  const max = Math.max(...scores.map((s) => s.score || 0), 0);
  let rank = 0, prev = null;
  return (
    <ol className="gcd-rows">
      {scores.map((s, i) => {
        if (s.score !== prev) { rank = i + 1; prev = s.score; }
        const h = hostels[s.hostel_name];
        return (
          <li key={s.id || i} className={"gcd-row" + (rank <= 3 ? " top r" + rank : "")} style={{ animationDelay: i * 50 + "ms" }}>
            <span className="gcd-bar" style={{ width: grow && max ? (s.score / max) * 100 + "%" : 0 }} />
            <span className="gcd-rk">{rank}</span>
            <span className="gcd-av">{h && h.image ? <img src={h.image} alt="" loading="lazy" /> : s.hostel_name}</span>
            <span className="gcd-who">{s.hostel_name}{h && h.tittle && <small>{h.tittle}</small>}</span>
            <span className="gcd-sc">{s.score ?? "–"}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Gc() {
  const { name: id } = useParams();
  const [gc, setGc] = useState(null);
  const [scores, setScores] = useState([]);
  const [hostels, setHostels] = useState({});
  const [error, setError] = useState(false);
  const [grow, setGrow] = useState(false);

  useEffect(() => {
    let dead = false;
    window.scrollTo(0, 0);
    setGc(null); setError(false); setGrow(false);
    Promise.all([get(`/GC${id}/`), get("/hostels/").catch(() => [])])
      .then(([d, hs]) => {
        if (dead) return;
        if (!d.gc || !d.gc[0]) { setError(true); return; }
        setGc(d.gc[0]);
        setScores(d.scores || []);
        setHostels(Object.fromEntries(hs.map((h) => [h.name, h])));
        setTimeout(() => !dead && setGrow(true), 150);
      })
      .catch((e) => { console.error(e); if (!dead) setError(true); });
    return () => { dead = true; };
  }, [id]);

  useEffect(() => {
    document.title = gc ? `${gc.name} · Tech GC Portal` : "Tech GC Portal";
    return () => { document.title = "Tech GC Portal"; };
  }, [gc]);

  let body;
  if (error) {
    body = (
      <div className="gcd-state">
        <h1>GC not found</h1>
        <p>This GC doesn't exist or couldn't be loaded.</p>
        <Link to="/#gcs" className="gcd-btn primary"><Icon n="back" />Back to all GCs</Link>
      </div>
    );
  } else if (!gc) {
    body = <div className="gcd-state"><span className="gcd-spin" aria-label="Loading" /></div>;
  } else {
    const start = new Date(gc.start_timeline), end = new Date(gc.end_timeline);
    const st = status(start, end);
    const genre = GENRES[gc.genre] || gc.gc_genre || gc.genre;
    const poster = media(gc.poster);
    const links = [
      { url: gc.doc_link, label: "Rulebook", icon: "book", primary: true },
      { url: gc.link, label: "Event link", icon: "link" },
    ].filter((l) => l.url && l.url.trim());

    body = (
      <>
        <header className="gcd-hero hero-bg">
          <div className="gcd-hero-in">
            <div className="gcd-info">
              <Link to="/#gcs" className="gcd-back"><Icon n="back" />All GCs</Link>
              <div className="gcd-tags">
                {genre && <span className="gcd-tag genre">{genre}</span>}
                {gc.prep && <span className={"gcd-tag prep " + prepLevel(gc.prep)}>{gc.prep}</span>}
                <span className={"gcd-tag st " + st.k}><i />{st.t}</span>
              </div>
              <h1 className="gcd-name">{gc.name}</h1>
              {gc.club && <p className="gcd-club">Conducted by <b>{gc.club}</b></p>}
              <div className="gcd-dates">
                <div><Icon n="calendar" /><span>Starts</span><b>{fmt(start)}</b></div>
                <div><Icon n="calendar" /><span>Ends</span><b>{fmt(end)}</b></div>
              </div>
              {links.length > 0 && (
                <div className="gcd-actions">
                  {links.map((l) => (
                    <a key={l.label} href={absUrl(l.url)} target="_blank" rel="noopener noreferrer" className={"gcd-btn" + (l.primary ? " primary" : "")}>
                      <Icon n={l.icon} />
                      <span>{l.label}<small>{host(l.url)}</small></span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            {poster && (
              <a className="gcd-poster" href={poster} target="_blank" rel="noopener noreferrer" aria-label="Open poster">
                <img src={poster} alt={gc.name + " poster"} />
              </a>
            )}
          </div>
        </header>

        <main className="gcd-body">
          <div className="gcd-card">
            <h2 className="gcd-h">About this GC</h2>
            <p className="gcd-desc"><Linkified text={gc.description || ""} /></p>
            {links.length > 0 && (
              <div className="gcd-linklist">
                <h3>Links</h3>
                {links.map((l) => (
                  <a key={l.label} href={absUrl(l.url)} target="_blank" rel="noopener noreferrer">
                    <Icon n={l.icon} /><b>{l.label}</b><span>{absUrl(l.url)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="gcd-card">
            <h2 className="gcd-h">Scoreboard</h2>
            <Scoreboard scores={scores} hostels={hostels} grow={grow} />
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="gcd">
      <Nav />
      {body}
      <footer>
        Developed by <b>Web Team</b> with <span className="heart">♥</span>
      </footer>
    </div>
  );
}
