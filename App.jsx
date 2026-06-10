import { useState, useEffect } from "react";

// ── Storage helpers (localStorage — permanen di browser) ─────────────────────
function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
}

// ── Constants ────────────────────────────────────────────────────────────────
const ADMIN_PIN_KEY = "ts:admin_pin";
const KARYW_PIN_KEY = "ts:karyw_pin";
const TAGIHAN_KEY   = "ts:tagihan";
const MUTASI_KEY    = "ts:mutasi";
const HUTANG_KEY    = "ts:hutang";

const DEFAULT_ADMIN = "1234";
const DEFAULT_KARYW = "5678";

// ── Palette ──────────────────────────────────────────────────────────────────
const G = {
  dark:"#1B4332", mid:"#2D6A4F", light:"#40916C",
  pale:"#D8F3DC", cream:"#F0FFF4", white:"#FFFFFF",
  red:"#9B2226", redPale:"#FFE8E8",
  amber:"#7A5200", amberPale:"#FFF3CD",
  blue:"#1F4E79", bluePale:"#E8F4FD",
  gray:"#6B7280", border:"#E5E7EB", bg:"#F8FAF9",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n => isNaN(n)||n===""||n===null ? "—" : "Rp " + Number(n).toLocaleString("id-ID");
const todayStr = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

// ── UI Components ─────────────────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background:G.white, borderRadius:16, border:`1px solid ${G.border}`, padding:"1.25rem", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, color=G.dark, light=false, small=false, disabled=false, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: light ? "transparent" : color,
    color: light ? color : G.white,
    border: `1.5px solid ${color}`,
    borderRadius:10, padding: small ? "6px 14px" : "10px 20px",
    fontSize: small ? 13 : 14, fontWeight:600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, fontFamily:"inherit", ...style
  }}>{children}</button>
);

const Badge = ({ children, color=G.dark, bg }) => (
  <span style={{ background:bg||G.pale, color, padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>
    {children}
  </span>
);

const Field = ({ label, value, onChange, type="text", placeholder }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:12, fontWeight:600, color:G.gray, marginBottom:4 }}>{label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${G.border}`,
        borderRadius:10, fontSize:14, fontFamily:"inherit", boxSizing:"border-box", background:G.white }} />
  </div>
);

// ── PIN Screen ───────────────────────────────────────────────────────────────
function PINScreen({ onLogin }) {
  const [pin, setPin]     = useState("");
  const [err, setErr]     = useState("");
  const adminPin = load(ADMIN_PIN_KEY) || DEFAULT_ADMIN;
  const karywPin = load(KARYW_PIN_KEY) || DEFAULT_KARYW;

  const press = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setErr("");
    if (next.length === 4) {
      setTimeout(() => {
        if (next === adminPin)      { onLogin("admin");    setPin(""); }
        else if (next === karywPin) { onLogin("karyawan"); setPin(""); }
        else                        { setErr("PIN salah, coba lagi"); setPin(""); }
      }, 200);
    }
  };

  const dots = Array(4).fill(0).map((_, i) => (
    <div key={i} style={{ width:16, height:16, borderRadius:"50%",
      background: i < pin.length ? G.dark : G.border, transition:"background .15s" }} />
  ));

  const keys = [["1","2","3"],["4","5","6"],["7","8","9"],["←","0","✓"]];

  return (
    <div style={{ minHeight:"100vh", background:G.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:320, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🥦</div>
        <div style={{ fontSize:24, fontWeight:800, color:G.dark, marginBottom:4 }}>Toko Sayur</div>
        <div style={{ fontSize:13, color:G.gray, marginBottom:32 }}>Masukkan PIN untuk masuk</div>
        <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:24 }}>{dots}</div>
        {err && (
          <div style={{ background:G.redPale, color:G.red, padding:"8px 16px", borderRadius:10, fontSize:13, marginBottom:16 }}>
            {err}
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:240, margin:"0 auto" }}>
          {keys.flat().map((k,i) => (
            <button key={i}
              onClick={() => k==="←" ? setPin(p=>p.slice(0,-1)) : k!=="✓" && press(k)}
              style={{ padding:"18px 0", fontSize:20, fontWeight:600, borderRadius:14,
                background: k==="←" ? G.amberPale : G.white,
                color: k==="←" ? G.amber : G.dark,
                border:`1.5px solid ${G.border}`, cursor:"pointer", fontFamily:"inherit" }}>
              {k}
            </button>
          ))}
        </div>
        <div style={{ marginTop:24, fontSize:12, color:G.gray }}>
          PIN default admin: <strong>1234</strong> · karyawan: <strong>5678</strong>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ tagihan, mutasi, hutang, tglFilter }) {
  const tt = tagihan.filter(t => t.tgl === tglFilter);
  const tm = mutasi.filter(m => m.tgl === tglFilter);
  const lunas   = tt.filter(t => tm.some(m => m.nominal === t.nominal)).length;
  const belum   = tt.length - lunas;
  const masuk   = tm.reduce((s,m) => s+m.nominal, 0);
  const outHutang = hutang.filter(h=>h.status!=="LUNAS").reduce((s,h)=>s+(h.total-(h.dibayar||0)),0);

  const cards = [
    { label:"Total tagihan hari ini", val:tt.length, unit:"pelanggan", color:G.dark },
    { label:"Sudah bayar",            val:lunas,     unit:"orang",     color:G.light },
    { label:"Belum bayar",            val:belum,     unit:"orang",     color:G.red },
    { label:"Uang masuk hari ini",    val:fmt(masuk),                  color:G.dark,  big:true },
    { label:"Total hutang outstanding", val:fmt(outHutang),            color:G.red,   big:true },
  ];

  return (
    <div>
      <div style={{ fontSize:13, color:G.gray, marginBottom:12 }}>📅 {tglFilter}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        {cards.slice(0,4).map((c,i) => (
          <Card key={i} style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:11, color:G.gray, marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize: c.big?17:26, fontWeight:800, color:c.color }}>
              {c.val}
              {!c.big && <span style={{ fontSize:12, fontWeight:400, color:G.gray, marginLeft:4 }}>{c.unit}</span>}
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ padding:"14px 16px" }}>
        <div style={{ fontSize:11, color:G.gray, marginBottom:4 }}>{cards[4].label}</div>
        <div style={{ fontSize:20, fontWeight:800, color:cards[4].color }}>{cards[4].val}</div>
      </Card>
    </div>
  );
}

// ── Cek Harian ───────────────────────────────────────────────────────────────
function CekHarian({ tagihan, mutasi, tglFilter, role, onAddTagihan }) {
  const [nama, setNama]       = useState("");
  const [nominal, setNominal] = useState("");
  const [saving, setSaving]   = useState(false);

  const tt = tagihan.filter(t => t.tgl === tglFilter);
  const tm = mutasi.filter(m => m.tgl === tglFilter);

  const getStatus = t => {
    if (!t.nominal) return "no-tagihan";
    return tm.some(m => m.nominal === t.nominal) ? "LUNAS" : "BELUM BAYAR";
  };

  const add = () => {
    if (!nama || !nominal) return;
    setSaving(true);
    const row = { id:Date.now(), tgl:tglFilter, nama, nominal:parseFloat(nominal)||0 };
    const updated = [...tagihan, row];
    save(TAGIHAN_KEY, updated);
    onAddTagihan(updated);
    setNama(""); setNominal(""); setSaving(false);
  };

  return (
    <div>
      <Card style={{ marginBottom:12, background:G.cream }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.dark, marginBottom:10 }}>➕ Input tagihan</div>
        <Field label="Nama pelanggan (OB jika tidak dikenal)" value={nama} onChange={setNama} placeholder="Bu Tini / OB" />
        <Field label="Nominal tagihan (Rp)" value={nominal} onChange={setNominal} type="number" placeholder="75000" />
        {role === "karyawan"
          ? <Btn onClick={add} disabled={saving||!nama||!nominal}>Simpan tagihan</Btn>
          : <Btn onClick={add} disabled={saving||!nama||!nominal}>Simpan tagihan</Btn>
        }
      </Card>

      <div style={{ fontSize:13, fontWeight:700, color:G.dark, marginBottom:8 }}>
        Tagihan {tglFilter} · {tt.length} pelanggan
      </div>

      {tt.length === 0 && (
        <div style={{ textAlign:"center", padding:"2rem", color:G.gray, fontSize:13 }}>
          Belum ada tagihan. Tambah di atas.
        </div>
      )}

      {tt.map(t => {
        const st = getStatus(t);
        return (
          <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px", marginBottom:8, borderRadius:12,
            background: st==="LUNAS" ? G.pale : st==="BELUM BAYAR" ? G.redPale : G.white,
            border:`1px solid ${st==="LUNAS" ? G.light : st==="BELUM BAYAR" ? "#F7C1C1" : G.border}` }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:G.dark }}>{t.nama}</div>
              <div style={{ fontSize:12, color:G.gray }}>{fmt(t.nominal)}</div>
            </div>
            <Badge color={st==="LUNAS"?G.dark:st==="BELUM BAYAR"?G.red:G.gray}
              bg={st==="LUNAS"?G.pale:st==="BELUM BAYAR"?G.redPale:G.border}>
              {st==="no-tagihan"?"—":st}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

// ── Mutasi ───────────────────────────────────────────────────────────────────
function MutasiView({ mutasi, tglFilter, onAdd }) {
  const [nama, setNama]       = useState("");
  const [nominal, setNominal] = useState("");

  const tm    = mutasi.filter(m => m.tgl === tglFilter);
  const total = tm.reduce((s,m) => s+m.nominal, 0);

  const add = () => {
    if (!nama || !nominal) return;
    const row = { id:Date.now(), tgl:tglFilter, nama, nominal:parseFloat(nominal)||0, tipe:"CR" };
    const updated = [...mutasi, row];
    save(MUTASI_KEY, updated);
    onAdd(updated);
    setNama(""); setNominal("");
  };

  return (
    <div>
      <Card style={{ marginBottom:12, background:G.bluePale }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.blue, marginBottom:10 }}>➕ Input transfer masuk</div>
        <Field label="Nama pengirim" value={nama} onChange={setNama} placeholder="Nama di mutasi bank" />
        <Field label="Nominal (Rp)" value={nominal} onChange={setNominal} type="number" placeholder="75000" />
        <Btn onClick={add} disabled={!nama||!nominal} color={G.blue}>Simpan</Btn>
      </Card>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:13, fontWeight:700, color:G.dark }}>{tm.length} transfer masuk</div>
        <div style={{ fontSize:13, fontWeight:700, color:G.light }}>{fmt(total)}</div>
      </div>

      {tm.length===0 && (
        <div style={{ textAlign:"center", padding:"2rem", color:G.gray, fontSize:13 }}>Belum ada mutasi hari ini.</div>
      )}

      {tm.map(m => (
        <div key={m.id} style={{ display:"flex", justifyContent:"space-between",
          padding:"10px 14px", marginBottom:6, borderRadius:12,
          background:G.pale, border:`1px solid ${G.light}` }}>
          <div style={{ fontSize:13, color:G.dark, fontWeight:500 }}>{m.nama}</div>
          <div style={{ fontSize:13, fontWeight:700, color:G.light }}>{fmt(m.nominal)}</div>
        </div>
      ))}
    </div>
  );
}

// ── Hutang ───────────────────────────────────────────────────────────────────
function HutangView({ hutang, role, onUpdate }) {
  const [nama, setNama]       = useState("");
  const [tglBeli, setTglBeli] = useState(todayStr());
  const [total, setTotal]     = useState("");
  const [bayarId, setBayarId] = useState(null);
  const [bayarNom, setBayarNom] = useState("");

  const aktif = hutang.filter(h => h.status !== "LUNAS");
  const lunas = hutang.filter(h => h.status === "LUNAS");

  const addHutang = () => {
    if (!nama || !total) return;
    const row = { id:Date.now(), nama, tglBeli, tglBayar:"", total:parseFloat(total)||0, dibayar:0, status:"BELUM LUNAS" };
    const updated = [...hutang, row];
    save(HUTANG_KEY, updated); onUpdate(updated);
    setNama(""); setTotal("");
  };

  const bayar = (id) => {
    const nom = parseFloat(bayarNom)||0;
    if (!nom) return;
    const updated = hutang.map(h => {
      if (h.id !== id) return h;
      const newDibayar = (h.dibayar||0) + nom;
      const sisa = h.total - newDibayar;
      return { ...h, dibayar:newDibayar, tglBayar:todayStr(), status: sisa<=0?"LUNAS":"BAYAR SEBAGIAN" };
    });
    save(HUTANG_KEY, updated); onUpdate(updated);
    setBayarId(null); setBayarNom("");
  };

  return (
    <div>
      {role === "admin" && (
        <Card style={{ marginBottom:12, background:G.amberPale }}>
          <div style={{ fontSize:13, fontWeight:700, color:G.amber, marginBottom:10 }}>➕ Catat hutang baru</div>
          <Field label="Nama pelanggan" value={nama} onChange={setNama} placeholder="Bu Tini" />
          <Field label="Tgl belanja" value={tglBeli} onChange={setTglBeli} />
          <Field label="Total tagihan (Rp)" value={total} onChange={setTotal} type="number" />
          <Btn onClick={addHutang} disabled={!nama||!total} color={G.amber}>Catat hutang</Btn>
        </Card>
      )}

      <div style={{ fontSize:13, fontWeight:700, color:G.red, marginBottom:8 }}>❌ Belum lunas ({aktif.length})</div>

      {aktif.length===0 && (
        <div style={{ textAlign:"center", padding:"1rem", color:G.gray, fontSize:13 }}>Semua sudah lunas! 🎉</div>
      )}

      {aktif.map(h => (
        <div key={h.id} style={{ marginBottom:10, borderRadius:12, border:"1px solid #F7C1C1", overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 14px", background:G.redPale }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:G.dark }}>{h.nama}</div>
              <div style={{ fontSize:11, color:G.gray }}>Belanja: {h.tglBeli}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, fontWeight:700, color:G.red }}>Sisa {fmt(h.total-(h.dibayar||0))}</div>
              {h.dibayar>0 && <div style={{ fontSize:11, color:G.gray }}>Sudah {fmt(h.dibayar)}</div>}
            </div>
          </div>
          {role==="admin" && (
            bayarId===h.id ? (
              <div style={{ padding:"10px 14px", background:G.white, display:"flex", gap:8, alignItems:"center" }}>
                <input type="number" placeholder="Nominal bayar" value={bayarNom} onChange={e=>setBayarNom(e.target.value)}
                  style={{ flex:1, padding:"8px 10px", border:`1.5px solid ${G.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit" }} />
                <Btn onClick={()=>bayar(h.id)} small>Simpan</Btn>
                <Btn onClick={()=>setBayarId(null)} small light color={G.gray}>Batal</Btn>
              </div>
            ) : (
              <div style={{ padding:"8px 14px", background:G.white }}>
                <Btn onClick={()=>setBayarId(h.id)} small light color={G.light}>💰 Catat pembayaran</Btn>
              </div>
            )
          )}
        </div>
      ))}

      {lunas.length>0 && (
        <>
          <div style={{ fontSize:13, fontWeight:700, color:G.light, margin:"16px 0 8px" }}>✅ Lunas ({lunas.length})</div>
          {lunas.map(h => (
            <div key={h.id} style={{ display:"flex", justifyContent:"space-between",
              padding:"10px 14px", marginBottom:6, borderRadius:12,
              background:G.pale, border:`1px solid ${G.light}` }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:G.dark }}>{h.nama}</div>
                <div style={{ fontSize:11, color:G.gray }}>{h.tglBeli} → {h.tglBayar}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:G.light }}>{fmt(h.total)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function Settings({ onLogout }) {
  const [aPin, setAPin] = useState("");
  const [kPin, setKPin] = useState("");
  const [msg, setMsg]   = useState("");

  const savePin = () => {
    if (aPin.length===4) save(ADMIN_PIN_KEY, aPin);
    if (kPin.length===4) save(KARYW_PIN_KEY, kPin);
    setMsg("PIN berhasil disimpan ✅");
    setTimeout(()=>setMsg(""), 2000);
  };

  return (
    <div>
      <Card style={{ marginBottom:12 }}>
        <div style={{ fontSize:14, fontWeight:700, color:G.dark, marginBottom:12 }}>🔐 Ganti PIN</div>
        <Field label="PIN Admin baru (4 angka)" value={aPin} onChange={setAPin} type="number" placeholder="1234" />
        <Field label="PIN Karyawan baru (4 angka)" value={kPin} onChange={setKPin} type="number" placeholder="5678" />
        {msg && <div style={{ color:G.light, fontSize:13, marginBottom:8 }}>{msg}</div>}
        <Btn onClick={savePin}>Simpan PIN</Btn>
      </Card>
      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:G.dark, marginBottom:8 }}>ℹ️ Hak akses</div>
        {[
          ["👑 Admin","Dashboard, input tagihan & mutasi, kelola hutang, ganti PIN"],
          ["👷 Karyawan","Input tagihan harian & lihat status bayar — tidak bisa hapus/edit data lama"],
        ].map(([r,d]) => (
          <div key={r} style={{ marginBottom:10, padding:"10px 12px", borderRadius:10, background:G.bg }}>
            <div style={{ fontWeight:700, fontSize:13, color:G.dark }}>{r}</div>
            <div style={{ fontSize:12, color:G.gray, marginTop:2 }}>{d}</div>
          </div>
        ))}
        <Btn onClick={onLogout} light color={G.red} style={{ marginTop:8 }}>Keluar</Btn>
      </Card>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole]         = useState(null);
  const [tab, setTab]           = useState("dashboard");
  const [tglFilter, setTglFilter] = useState(todayStr());
  const [tagihan, setTagihan]   = useState([]);
  const [mutasi, setMutasi]     = useState([]);
  const [hutang, setHutang]     = useState([]);

  useEffect(() => {
    setTagihan(load(TAGIHAN_KEY) || []);
    setMutasi(load(MUTASI_KEY)   || []);
    setHutang(load(HUTANG_KEY)   || []);
  }, []);

  if (!role) return <PINScreen onLogin={r => { setRole(r); setTab(r==="admin"?"dashboard":"cek"); }} />;

  const adminTabs = [
    { id:"dashboard", icon:"📊", label:"Ringkasan" },
    { id:"cek",       icon:"✅", label:"Cek Bayar" },
    { id:"mutasi",    icon:"🏦", label:"Mutasi" },
    { id:"hutang",    icon:"📋", label:"Hutang" },
    { id:"settings",  icon:"⚙️", label:"Pengaturan" },
  ];
  const karywTabs = [
    { id:"cek",    icon:"✅", label:"Input & Cek" },
    { id:"hutang", icon:"📋", label:"Hutang" },
  ];
  const tabs = role === "admin" ? adminTabs : karywTabs;

  const tglInput = tglFilter.split("/").reverse().join("-");
  const setTglFromInput = (v) => {
    const d = v.split("-");
    setTglFilter(`${d[2]}/${d[1]}/${d[0]}`);
  };

  return (
    <div style={{ background:G.bg, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background:G.dark, padding:"14px 20px", display:"flex",
        justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>🥦</span>
          <div>
            <div style={{ color:G.white, fontWeight:800, fontSize:16, lineHeight:1 }}>Toko Sayur</div>
            <div style={{ color:"#95D5B2", fontSize:11 }}>{role==="admin"?"👑 Admin":"👷 Karyawan"}</div>
          </div>
        </div>
        <input type="date" value={tglInput} onChange={e=>setTglFromInput(e.target.value)}
          style={{ padding:"6px 10px", borderRadius:8, border:"none", fontSize:12,
            background:G.mid, color:G.white, fontFamily:"inherit" }} />
      </div>

      {/* Content */}
      <div style={{ padding:"16px 16px 80px" }}>
        {tab==="dashboard" && <Dashboard tagihan={tagihan} mutasi={mutasi} hutang={hutang} tglFilter={tglFilter} />}
        {tab==="cek"       && <CekHarian tagihan={tagihan} mutasi={mutasi} tglFilter={tglFilter} role={role} onAddTagihan={setTagihan} />}
        {tab==="mutasi"    && role==="admin" && <MutasiView mutasi={mutasi} tglFilter={tglFilter} onAdd={setMutasi} />}
        {tab==="hutang"    && <HutangView hutang={hutang} role={role} onUpdate={setHutang} />}
        {tab==="settings"  && role==="admin" && <Settings onLogout={()=>setRole(null)} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:G.white,
        borderTop:`1px solid ${G.border}`, display:"flex", zIndex:10 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1, padding:"10px 4px 12px", border:"none", background:"transparent",
              cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:20 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:tab===t.id?700:400,
              color:tab===t.id?G.dark:G.gray }}>{t.label}</span>
            {tab===t.id && <div style={{ width:20, height:3, borderRadius:2, background:G.dark }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
