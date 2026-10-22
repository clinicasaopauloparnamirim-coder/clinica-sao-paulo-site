import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../public/attribution.js", import.meta.url), "utf8");

async function scenario({ zaraz = false, click = true, holdScript = false } = {}) {
  const calls = { fetch: [], ga: [], zaraz: [] };
  const listeners = new Map();
  let gaScript;
  const whatsapp = { href: "https://wa.me/5584998947669?text=Oi", className: "whatsapp-cta", addEventListener(type, fn) { listeners.set("whatsapp:" + type, fn); } };
  const map = { href: "https://maps.app.goo.gl/example", className: "map-link", addEventListener(type, fn) { listeners.set("map:" + type, fn); } };
  const phone = { href: "tel:+5584998947669", className: "phone-link", addEventListener(type, fn) { listeners.set("phone:" + type, fn); } };
  const document = {
    title: "Clínica São Paulo", referrer: "",
    head: { appendChild(script) { gaScript = script; if (!holdScript) script.onload?.(); } },
    createElement() { return { onload: null, onerror: null, set async(_) {}, set src(_) {} }; },
    querySelectorAll(selector) {
      if (selector.includes("wa.me")) return [whatsapp];
      if (selector.includes("maps")) return [map];
      if (selector.includes("tel:")) return [phone];
      return [];
    },
  };
  const context = {
    console: { warn() {} }, document, location: { search: "?utm_source=google&gclid=GCLID-123", pathname: "/" },
    URL, URLSearchParams, Date, Math, JSON, Uint8Array,
    crypto: { randomUUID: () => "session-1", getRandomValues(a) { a.fill(1); } },
    localStorage: { getItem() { return null; }, setItem() {} }, sessionStorage: { getItem() { return null; }, setItem() {} },
    fetch(path, options) {
      calls.fetch.push({ path, options });
      if (path === "/analytics-config") return Promise.resolve({ ok: true, json: () => Promise.resolve({ measurement_id: "G-EGTYJM0REP" }) });
      return Promise.resolve({ ok: true });
    },
  };
  context.window = context;
  context.gtag = (...args) => calls.ga.push(args);
  if (zaraz) context.zaraz = { track(...args) { calls.zaraz.push(args); } };
  vm.runInNewContext(source, context, { filename: "public/attribution.js" });
  // Let /analytics-config resolve and, unless requested, let the GA script finish loading.
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
  await Promise.resolve(); await Promise.resolve();
  if (click) listeners.get("whatsapp:click")?.();
  if (holdScript) { assert.ok(gaScript); gaScript.onload?.(); }
  return { calls, href: whatsapp.href, click(kind) { listeners.get(kind + ":click")?.(); } };
}

function canonical(calls) {
  return [
    ...calls.zaraz.filter(([name]) => name === "clique_whatsapp").map(() => "zaraz"),
    ...calls.ga.filter(([, name]) => name === "clique_whatsapp").map(() => "ga"),
  ];
}

assert.deepEqual(canonical((await scenario({ zaraz: true, click: false })).calls), []);
const nonWhatsApp = await scenario({ zaraz: false, click: false });
nonWhatsApp.calls.ga.length = 0;
nonWhatsApp.calls.zaraz.length = 0;
nonWhatsApp.click("map");
nonWhatsApp.click("phone");
// Only WhatsApp handler emits the canonical event; maps and tel handlers are separate.
assert.deepEqual(canonical(nonWhatsApp.calls), []);
assert.equal(nonWhatsApp.calls.fetch.filter(({ path }) => path === "/track").length, 3);
assert.deepEqual(canonical((await scenario({ zaraz: false })).calls), ["ga"]);
assert.deepEqual(canonical((await scenario({ zaraz: true })).calls), ["zaraz"]);

// With GA configured but not ready, the canonical GA event is queued and flushes once on load.
const queued = await scenario({ zaraz: false, holdScript: true });
assert.deepEqual(canonical(queued.calls), ["ga"]);
const canonicalGa = queued.calls.ga.filter(([, name]) => name === "clique_whatsapp");
assert.equal(canonicalGa.length, 1);

const track = queued.calls.fetch.filter(({ path }) => path === "/track");
const lead = queued.calls.fetch.find(({ path }) => path === "/api/lead-click");
assert.ok(track.some(({ options }) => JSON.parse(options.body).event_type === "whatsapp_click"));
assert.ok(lead);
assert.equal(JSON.parse(lead.options.body).attribution.gclid, "GCLID-123");
assert.match(queued.href, /CSP-[A-F0-9]{10}/);
console.log("whatsapp attribution VM tests: passed");
