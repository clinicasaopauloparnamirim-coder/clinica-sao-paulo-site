import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DOMAIN = "https://clinicasaopauloparnamirim.com.br";
const MAPS = "https://maps.app.goo.gl/VJ3AWx4hMo6gqXRk6";
const CLINIC_ID = DOMAIN + "/#clinic";
const PAGES = [
  { file: "public/index.html", url: DOMAIN + "/", service: false },
  { file: "public/dentista-parnamirim/index.html", url: DOMAIN + "/dentista-parnamirim/", service: true },
  { file: "public/aparelho-ortodontico-parnamirim/index.html", url: DOMAIN + "/aparelho-ortodontico-parnamirim/", service: true },
  { file: "public/clareamento-dental-parnamirim/index.html", url: DOMAIN + "/clareamento-dental-parnamirim/", service: true },
  { file: "public/limpeza-dental-parnamirim/index.html", url: DOMAIN + "/limpeza-dental-parnamirim/", service: true },
  { file: "public/clinica-odontologica-parnamirim/index.html", url: DOMAIN + "/clinica-odontologica-parnamirim/", service: true },
  { file: "public/facetas-de-resina-parnamirim/index.html", url: DOMAIN + "/facetas-de-resina-parnamirim/", service: true },
  { file: "public/restauracao-estetica-parnamirim/index.html", url: DOMAIN + "/restauracao-estetica-parnamirim/", service: true },
  { file: "public/tratamento-de-canal-parnamirim/index.html", url: DOMAIN + "/tratamento-de-canal-parnamirim/", service: true }
];
const errors = [];
const titles = new Set();
const canonicals = new Set();
const rows = [];
function read(path) {
  try { return readFileSync(join(ROOT, path), "utf8"); }
  catch { errors.push("Arquivo ausente: " + path); return ""; }
}
function attr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return m ? m[2] : "";
}
function meta(html, key, keyAttr) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find(x => attr(x, keyAttr).toLowerCase() === key.toLowerCase());
  return tag ? attr(tag, "content") : "";
}
function types(node) {
  return Array.isArray(node && node["@type"]) ? node["@type"] : [node && node["@type"]].filter(Boolean);
}
for (const p of PAGES) {
  const html = read(p.file);
  if (!html) continue;
  const title = ((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
  const description = meta(html, "description", "name");
  const canonicalTag = (html.match(/<link\b[^>]*rel\s*=\s*(["'])canonical\1[^>]*>/i) || [])[0]
    || (html.match(/<link\b[^>]*rel\s*=\s*(["'])canonical\1[^>]*>/i) || [])[0] || "";
  const canonical = canonicalTag ? attr(canonicalTag, "href") : "";
  const h1s = [...html.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
  const headingLevels = [...html.matchAll(/<h([1-6])\b[^>]*>[\s\S]*?<\/h\1>/gi)].map(x => Number(x[1]));
  const graph = [];
  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*(["'])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of scripts) {
    try { const d = JSON.parse(m[2]); graph.push(...(Array.isArray(d["@graph"]) ? d["@graph"] : [d])); }
    catch { errors.push(p.file + ": JSON-LD inválido"); }
  }
  const clinic = graph.find(n => n && n["@id"] === CLINIC_ID);
  const clinicTypes = types(clinic);
  const sameAs = Array.isArray(clinic && clinic.sameAs) ? clinic.sameAs : [clinic && clinic.sameAs].filter(Boolean);
  const address = clinic && clinic.address || {};
  const faq = graph.find(n => types(n).includes("FAQPage"));
  const service = graph.find(n => types(n).includes("Service"));
  const breadcrumbs = graph.find(n => types(n).includes("BreadcrumbList"));
  if (!title || title.length < 20 || title.length > 70) errors.push(p.file + ": title inválido");
  if (!description || description.length < 70 || description.length > 180) errors.push(p.file + ": meta description inválida");
  if (canonical !== p.url) errors.push(p.file + ": canonical incorreto");
  if (meta(html, "og:title", "property") !== title) errors.push(p.file + ": og:title divergente");
  if (!meta(html, "og:description", "property") || meta(html, "og:url", "property") !== canonical) errors.push(p.file + ": Open Graph incompleto");
  if (h1s.length !== 1) errors.push(p.file + ": precisa ter exatamente um H1");
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) { errors.push(p.file + ": hierarquia de headings pula um nível"); break; }
  }
  if (/<meta\b[^>]*name\s*=\s*(["'])robots\1[^>]*content\s*=\s*(["'])[^"']*noindex/i.test(html)) errors.push(p.file + ": contém noindex");
  if (!clinic) errors.push(p.file + ": nó da clínica não encontrado no JSON-LD");
  for (const t of ["Organization", "Dentist", "MedicalClinic"]) if (!clinicTypes.includes(t)) errors.push(p.file + ": falta tipo " + t);
  if (!sameAs.includes(MAPS)) errors.push(p.file + ": sameAs sem o Maps oficial");
  if (!(clinic && clinic.telephone === "+5584998947669")) errors.push(p.file + ": telefone do schema ausente/divergente");
  if (!String(address.streetAddress || "").toLowerCase().includes("rua edgar dantas") || !String(address.streetAddress || "").toLowerCase().includes("sala 7") || address.addressLocality !== "Parnamirim" || address.postalCode !== "59140-290") errors.push(p.file + ": endereço NAP incompleto");
  if (!faq || !Array.isArray(faq.mainEntity) || !faq.mainEntity.length) errors.push(p.file + ": FAQPage sem perguntas");
  if (p.service && (!service || !breadcrumbs || !((service.provider || {})["@id"] === CLINIC_ID))) errors.push(p.file + ": Service/BreadcrumbList/provider não ligado à clínica");
  if (!html.includes("maps.app.goo.gl/VJ3AWx4hMo6gqXRk6") || !/toque\s+27/i.test(html)) errors.push(p.file + ": CTA de rota ou interfone ausente");
  if (!/href\s*=\s*["'][^"']*(?:wa\.me|api\.whatsapp\.com)/i.test(html)) errors.push(p.file + ": CTA WhatsApp ausente");
  if (!/Parnamirim/i.test(html)) errors.push(p.file + ": contexto local ausente");
  if (titles.has(title)) errors.push("Title duplicado: " + title);
  titles.add(title);
  if (canonicals.has(canonical)) errors.push("Canonical duplicado: " + canonical);
  canonicals.add(canonical);
  rows.push({url:p.url,title,canonical,status:"checked"});
}
const sitemap = read("public/sitemap.xml");
const listed = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(m => m[1]);
const expected = PAGES.map(p => p.url);
if (listed.length !== PAGES.length) errors.push("Sitemap precisa ter nove URLs; encontrou " + listed.length);
for (const u of expected) if (!listed.includes(u)) errors.push("Sitemap não lista " + u);
for (const u of listed) if (!expected.includes(u)) errors.push("Sitemap contém URL inesperada " + u);
const robots = read("public/robots.txt");
if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots)) errors.push("robots.txt não permite rastreamento geral");
if (!robots.includes(DOMAIN + "/sitemap.xml")) errors.push("robots.txt não referencia o sitemap canônico");
const attribution = read("public/attribution.js");
for (const host of ["chatgpt\\.com","perplexity\\.ai","gemini\\.google\\.com","copilot\\.microsoft\\.com","claude\\.ai","deepseek\\.com"]) if (!attribution.includes(host)) errors.push("Atribuição IA ausente: " + host);
if (!attribution.includes('medium="ai-assistant"')) errors.push("Atribuição IA não define ai-assistant");
console.log("SEMANTIC SEO QUALITY GATE");
console.log("Páginas verificadas: " + rows.length + "/" + PAGES.length);
console.log("URLs no sitemap: " + listed.length);
console.log("Erros: " + errors.length);
for (const row of rows) console.log("CHECK " + row.url);
for (const e of errors) console.error("FAIL " + e);
if (rows.length !== PAGES.length || errors.length) process.exitCode = 1;
