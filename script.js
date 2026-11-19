// ====== KONFIGURASI ======
const CONFIG = {
  USER: "Fauzan Surya Nanda",
  SHEET_ID: "1dJZTZUDJ0Fainl76klvI9RJX_1Kf_ZS5AoFR6SwqsNk",
  SHEET_NAME: "",          // kosong = tab pertama
  APPS_SCRIPT_URL: "",     // URL Web App dari Code.gs agar tombol Add Data menulis ke spreadsheet
  INCOME_TARGET: 8000000   // target income bulanan (kartu Earning)
};
const COL = {Rent:"#0a4aa8",Food:"#ff3b30",Entertainment:"#1d4ed8",Training:"#7a4a0a",Internet:"#c5e8a0",Transport:"#ffb74d",Family:"#ff69b4",Others:"#888888","E-Commerce":"#8b5cf6",Shopping:"#06b6d4",Health:"#22c55e",Salary:"#16a34a",Project:"#0ea5e9"};
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const cc = c => COL[c] || "#64748b", $ = id => document.getElementById(id);
const num = n => new Intl.NumberFormat("id-ID").format(Math.round(n)), fmt = n => "Rp " + num(n);
const p2 = n => String(n).padStart(2,"0"), slug = c => c.toLowerCase().replace(/[^a-z0-9]+/g,"-");
const esc = s => String(s).replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const sum = a => a.reduce((s,r) => s + r.a, 0);
const n0 = new Date();
let rows = [], hide = false, loaded = false, V = {y:n0.getFullYear(), m:n0.getMonth(), d:n0.getDate()};

// ====== BACA DATA (Google Sheets) ======
const parseAmount = v => typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d,.-]/g,"").replace(/\./g,"").replace(",","."));
function parseDate(v){
  if (typeof v !== "string") return new Date(NaN);
  let m = v.match(/^Date\((\d+),(\d+),(\d+)/); if (m) return new Date(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d+)\/(\d+)\/(\d+)/); if (m) return new Date(+m[3], +m[1]-1, +m[2]);
  return new Date(NaN);
}
async function load(){
  $("status").textContent = "· memuat...";
  try{
    const u = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json` + (CONFIG.SHEET_NAME ? `&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}` : "");
    const s = await (await fetch(u)).text();
    const j = JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}")+1));
    rows = [];
    for (const w of j.table.rows){
      const c = w.c.map(x => x ? x.v : null), d = parseDate(c[0]), a = parseAmount(c[3]);
      if (isNaN(d) || isNaN(a)) continue;
      rows.push({d, c: c[1] || "Others", t: c[2] || "", a, y: /inc/i.test(c[4] || "") ? "Income" : "Outcome", n: c[5] || ""});
    }
    if (!loaded && rows.length){
      const l = new Date(Math.max(...rows.map(r => r.d))); V = {y:l.getFullYear(), m:l.getMonth(), d:l.getDate()};
      if (n0.getFullYear()===V.y && n0.getMonth()===V.m) V.d = n0.getDate();
      loaded = true;
    }
    $("status").textContent = "· live";
  }catch(e){ $("status").textContent = "· gagal memuat"; toast("Gagal memuat data. Pastikan sheet dibagikan: Anyone with the link - Viewer."); }
  render();
}

// ====== TULIS DATA (Apps Script) ======
async function saveRow(f){
  if (!CONFIG.APPS_SCRIPT_URL){ toast("Disimpan sementara. Isi APPS_SCRIPT_URL agar masuk ke spreadsheet."); return false; }
  await fetch(CONFIG.APPS_SCRIPT_URL, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(f)});
  return true;
}
function toast(t){ const e = $("toast"); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, 3500); }
const group = list => { const m = {}; list.forEach(r => m[r.c] = (m[r.c]||0) + r.a); return Object.entries(m).sort((a,b) => b[1]-a[1]); };
const when = d => { const k = Math.round((new Date().setHours(0,0,0,0) - d) / 864e5); return k===0 ? "Hari ini" : k===1 ? "Kemarin" : d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}); };

// ====== RENDER ======
function render(){
  const mr = rows.filter(r => r.d.getFullYear()===V.y && r.d.getMonth()===V.m);
  const inc = mr.filter(r => r.y==="Income"), out = mr.filter(r => r.y==="Outcome"), ti = sum(inc), to = sum(out);
  const mname = new Date(V.y,V.m,1).toLocaleDateString("id-ID",{month:"long"}), per = `${mname} ${V.y}`;
  $("user").textContent = CONFIG.USER;
  $("bal").textContent = hide ? "Rp ••••••" : fmt(ti - to);
  $("bin").textContent = fmt(ti); $("bout").textContent = fmt(to);

  // kalender
  const dim = new Date(V.y,V.m+1,0).getDate(); V.d = Math.min(V.d, dim);
  $("dn").textContent = V.d; $("dw").textContent = new Date(V.y,V.m,V.d).toLocaleDateString("id-ID",{weekday:"long"});
  const evs = mr.filter(r => r.d.getDate()===V.d);
  const net = sum(evs.filter(r => r.y==="Income")) - sum(evs.filter(r => r.y==="Outcome"));
  $("evs").innerHTML = evs.slice(0,2).map(r => `<i>• ${esc(r.t)}</i>`).join("") + (evs.length>2 ? `<i>+${evs.length-2} lainnya</i>` : "") || "<i>• Tidak ada transaksi</i>";
  $("dtot").textContent = evs.length ? `${evs.length} transaksi · ${net<0?"-":"+"}${fmt(Math.abs(net))}` : "";
  $("yr").textContent = V.y;
  $("mr").innerHTML = MON.map((x,i) => `<span class="${i===V.m?"cur":""}" data-m="${i}">${x}</span>`).join("");
  const has = new Set(mr.map(r => r.d.getDate())), fd = new Date(V.y,V.m,1).getDay(), pd = new Date(V.y,V.m,0).getDate();
  let h = ["SUN","MON","TUE","WED","THU","FRI","SAT"].map(x => `<b>${x}</b>`).join("");
  for (let i = fd-1; i >= 0; i--) h += `<span class="f">${p2(pd-i)}</span>`;
  for (let d = 1; d <= dim; d++) h += `<span data-d="${d}" class="${has.has(d)?"dot ":""}${d===V.d?"sel":""}">${p2(d)}</span>`;
  for (let i = 1; (fd+dim+i-1) % 7 !== 0; i++) h += `<span class="f">${p2(i)}</span>`;
  $("cm").innerHTML = h;

  // spending
  const g = group(out), C = 2*Math.PI*66; let acc = 0, svg = "";
  g.forEach(([c,v],i) => { const l = v/to*C; svg += `<circle cx="90" cy="90" r="66" fill="none" stroke="${cc(c)}" stroke-width="18" stroke-dasharray="${Math.max(l-3,.5)} ${C}" stroke-dashoffset="${-acc-1.5}" transform="rotate(-90 90 90)"/>`; acc += l; });
  $("dsvg").innerHTML = svg || `<circle cx="90" cy="90" r="66" fill="none" stroke="#dcdcdc" stroke-width="14"/>`;
  $("sm").textContent = mname; $("stot").textContent = fmt(to);
  $("sdelta").textContent = ti ? `${Math.round(to/ti*100)}% dari income` : "";
  $("ins").textContent = g.length ? `${g[0][0]} pengeluaran terbesar (${Math.round(g[0][1]/to*100)}%)` : "Belum ada pengeluaran";
  $("sl").innerHTML = g.slice(0,6).map(([c,v]) => `<div><i class="gi" style="background:${cc(c)};border-color:${cc(c)};border-radius:50%"></i>${esc(c)} <b style="font-weight:500">${fmt(v)}</b></div>`).join("");

  // earning
  $("tgt").textContent = "◎ " + fmt(CONFIG.INCOME_TARGET); $("tbar").style.width = Math.min(ti/CONFIG.INCOME_TARGET*100,100) + "%";
  $("etot").textContent = fmt(ti); $("esub").textContent = `${Math.round(ti/CONFIG.INCOME_TARGET*100)}% dari target bulan ini`;
  $("ebars").innerHTML = group(inc).map(([c,v],i) => { const p = Math.round(v/ti*100); return `<div class="er"><div class="t"><span>${esc(c)}</span><span>${fmt(v)}</span></div><div class="tr"><i class="${i?"":"hi2"}" style="width:${p}%">${i?"":`<em>${p}%</em>`}</i></div></div>`; }).join("") + (ti || to ? `<div class="er"><div class="t"><span>Total Outcome</span><span>${fmt(to)}</span></div><div class="tr"><i style="width:${Math.min(to/Math.max(ti,1)*100,100)}%;background:#f5a3a3"></i></div></div>` : "");

  // transactions
  const dl = new Date(V.y,V.m,V.d).toLocaleDateString("id-ID",{day:"numeric",month:"short"});
  const rec = evs.map((r,i) => ({...r,i})).reverse();
  $("rd").textContent = dl;
  $("rec").innerHTML = rec.map((r,k) => `<div class="tx ${k?"":"hl"}"><span class="lg"><b style="background:${cc(r.c)}">${esc(r.c[0])}</b><img src="images/category/${slug(r.c)}.png" onerror="this.remove()" alt=""></span><div class="m"><span>${esc(r.t)}</span><small class="${k?"":"or"}">${esc(r.c)} · ${when(r.d)}</small></div><b class="${r.y==="Income"?"pos":"neg"}">${r.y==="Income"?"+":"-"}${fmt(r.a)}</b></div>`).join("") || `<div class="empty">Tidak ada transaksi pada ${dl}</div>`;

  // halaman Data: ringkasan + legend
  $("sper").textContent = $("sper2").textContent = per;
  $("tin").textContent = num(ti); $("tout").textContent = num(to);
  $("leg").innerHTML = g.map(([c]) => `<span><i style="background:${cc(c)}"></i>${esc(c)}</span>`).join("");
  table();
}

function table(){
  const q = $("q").value.toLowerCase(), ty = $("ty").value;
  const list = rows.map((r,i) => ({...r,i})).filter(r => (!ty || r.y===ty) && (!q || (r.c+r.t+r.n).toLowerCase().includes(q))).sort((a,b) => b.d-a.d || b.i-a.i);
  $("tb").innerHTML = list.map(r => `<tr><td>${r.d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td><td>${esc(r.c)}</td><td>${esc(r.t)}</td><td class="r">${fmt(r.a)}</td><td class="${r.y==="Income"?"ty-i":"ty-o"}">${r.y}</td><td>${esc(r.n)}</td></tr>`).join("") || `<tr><td colspan="6">Tidak ada data</td></tr>`;
}

// ====== INTERAKSI ======
document.querySelectorAll(".rail [data-view]").forEach(b => b.onclick = () => {
  document.body.dataset.view = b.dataset.view;
  document.querySelectorAll(".rail [data-view]").forEach(x => x.classList.toggle("on", x === b));
  scrollTo(0,0);
});
$("past").onclick = () => document.querySelector('.rail [data-view="data"]').click();
$("cm").onclick = e => { const d = e.target.dataset.d; if (d){ V.d = +d; render(); } };
$("mr").onclick = e => { const m = e.target.dataset.m; if (m !== undefined){ V.m = +m; V.d = 1; render(); } };
$("py").onclick = () => { V.y--; render(); }; $("ny").onclick = () => { V.y++; render(); };

const modal = $("modal"), form = $("form");
const openModal = () => { form.reset(); form.date.value = new Date().toISOString().slice(0,10); modal.hidden = false; };
["addBtn","addBtn2","addBtn3"].forEach(id => $(id).onclick = openModal);
$("close").onclick = () => modal.hidden = true;
modal.onclick = e => { if (e.target === modal) modal.hidden = true; };
form.onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form)); f.amount = Number(f.amount);
  const [yy,mm,dd] = f.date.split("-").map(Number);
  $("save").disabled = true; $("save").textContent = "Menyimpan...";
  try{
    const sent = await saveRow(f);
    rows.push({d: new Date(yy,mm-1,dd), c: f.category, t: f.description, a: f.amount, y: f.type, n: f.notes});
    V = {y:yy, m:mm-1, d:dd}; render(); modal.hidden = true;
    if (sent){ toast("Tersimpan ke spreadsheet"); setTimeout(load, 2000); }
  }catch(err){ toast("Gagal menyimpan. Cek APPS_SCRIPT_URL & deployment."); }
  $("save").disabled = false; $("save").textContent = "Simpan ke Spreadsheet";
};
$("eye").onclick = () => { hide = !hide; render(); };
$("refresh").onclick = load; $("q").oninput = table; $("ty").onchange = table;
// Avatar: pakai images/avatar.png; jika belum ada, pakai ilustrasi bawaan
const AVATAR_FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 220c6-42 38-56 80-56s74 14 80 56z" fill="#fff"/><path d="M80 150v22l20 10 20-10v-22" fill="#fff"/><path d="M52 92c-8-40 14-66 48-66s58 22 48 66c-2 36-24 62-48 62s-46-26-48-62z" fill="#fff"/><path d="M50 84c-14-30 4-62 30-64 14-14 44-12 54 4 24 4 30 34 16 60-8-16-18-26-34-28-18 4-44 8-66 28z" fill="#fff"/><circle cx="80" cy="102" r="3.5" fill="#111"/><circle cx="120" cy="102" r="3.5" fill="#111"/><path d="M92 128c5 4 11 4 16 0M98 108c-2 8-2 12 3 14"/></svg>');
const av = document.querySelector(".hello img"), useFb = () => { av.onerror = null; av.src = AVATAR_FALLBACK; };
av.onerror = useFb; if (av.complete && !av.naturalWidth) useFb();

load();
