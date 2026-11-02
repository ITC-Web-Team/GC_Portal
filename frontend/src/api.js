/* ====== CONFIG: paste your API token (or set REACT_APP_GC_TOKEN in .env) ====== */
export const API = process.env.REACT_APP_API_URL || "https://gcbackend.tech-iitb.org";
const TOKEN = process.env.REACT_APP_GC_TOKEN || "3af5accdebeb5b899e6f9197b0b822f657af008f";
/* ================================================================================ */

export const get = (path) =>
  fetch(API + path, { headers: { "Content-Type": "application/json", Authorization: "Token " + TOKEN } })
    .then((r) => { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); });
