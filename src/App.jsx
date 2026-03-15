import { useState, useRef, useEffect, useCallback } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzFUQGzBB1a1ES2JlWi8eLt1G8Cdp1_X0OpX8T8SmklkWDTx1A_b4sGAYxFnCZGEdD9/exec";

async function gasGet(action) {
  const res = await fetch(`${GAS_URL}?action=${action}`);
  return res.json();
}

async function gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ═══════════════ CONSTANTS ═══════════════ */
const DAYS = ["月","火","水","木","金","土"];
const DAY_COLOR = { 月:"#2563EB", 火:"#DC2626", 水:"#0891B2", 木:"#059669", 金:"#7C3AED", 土:"#EA580C" };

const CATEGORIES = ["筋力","バランス","歩行","ROM","有酸素","協調","社会参加",
  "BI-食事","BI-移乗","BI-整容","BI-トイレ","BI-入浴","BI-歩行","BI-階段","BI-更衣","BI-排便","BI-排尿",
  "IADL-炊事","IADL-洗濯","IADL-買い物","IADL-掃除"];
const CAT_COLOR  = {
  筋力:"#DC2626", バランス:"#7C3AED", 歩行:"#2563EB", ROM:"#059669", 有酸素:"#EA580C", 協調:"#D97706", 社会参加:"#0891B2",
  "BI-食事":"#6366F1","BI-移乗":"#6366F1","BI-整容":"#6366F1","BI-トイレ":"#6366F1","BI-入浴":"#6366F1",
  "BI-歩行":"#6366F1","BI-階段":"#6366F1","BI-更衣":"#6366F1","BI-排便":"#6366F1","BI-排尿":"#6366F1",
  "IADL-炊事":"#0891B2","IADL-洗濯":"#0891B2","IADL-買い物":"#0891B2","IADL-掃除":"#0891B2",
};
const CAT_ICON   = {};
const shortLabel = s => s && s.includes("-") ? s.split("-").slice(1).join("-") : s;
const LOAD_CONFIG = {
  軽:{ color:"#059669", bg:"#ECFDF5", border:"#A7F3D0" },
  中:{ color:"#EA580C", bg:"#FFF7ED", border:"#FED7AA" },
  強:{ color:"#DC2626", bg:"#FEF2F2", border:"#FECACA" },
};

const INITIAL_USERS = [
  { id:1, name:"田中 花子", age:78, room:"A-01", gender:"女", diagnosis:"脳梗塞後遺症（左片麻痺）", pt:"鈴木PT", days:["月","水","金"],
    caution:["血圧高値注意（収縮期180以上で中止）","左肩関節拘縮・外転90°以上禁忌"],
    goals:["歩行","BI-食事","IADL-炊事"],
    menu:[{id:1,category:"筋力",name:"下肢筋力強化（座位）",sets:3,reps:10,load:"軽",unit:"回",note:"膝伸展時疼痛訴えあれば即中止"},{id:2,category:"バランス",name:"立位バランス訓練",sets:2,reps:30,load:"中",unit:"秒",note:"必ず後方に介助者配置"},{id:3,category:"歩行",name:"平行棒内歩行",sets:1,reps:5,load:"中",unit:"往復",note:"左足クリアランス注意"}],
    notes:[{id:1,date:"2025-03-12",staff:"鈴木PT",text:"立位バランス中に軽度めまい訴え。3→2セットに変更。次回経過観察。"}], records:{} },
  { id:2, name:"佐藤 一郎", age:82, room:"B-03", gender:"男", diagnosis:"変形性膝関節症", pt:"山田OT", days:["火","木"],
    caution:["右膝屈曲120°以上禁忌","心疾患あり・SpO2監視推奨"],
    goals:["筋力","BI-歩行"],
    menu:[{id:1,category:"筋力",name:"大腿四頭筋セッティング",sets:3,reps:15,load:"軽",unit:"回",note:"膝下タオル枕使用"},{id:2,category:"ROM",name:"膝関節可動域訓練",sets:2,reps:10,load:"軽",unit:"回",note:"120°超えない"}],
    notes:[], records:{} },
  { id:3, name:"山本 きよ", age:75, room:"C-02", gender:"女", diagnosis:"パーキンソン病（HY分類Ⅱ）", pt:"鈴木PT", days:["月","水","木","金"],
    caution:["すくみ足注意・開始時リズム誘導必須"],
    goals:["歩行","バランス","社会参加"],
    menu:[{id:1,category:"歩行",name:"リズム歩行",sets:2,reps:20,load:"中",unit:"m",note:"メトロノーム100bpm使用"},{id:2,category:"筋力",name:"体幹筋力訓練",sets:3,reps:10,load:"軽",unit:"回",note:""}],
    notes:[], records:{} },
  { id:4, name:"伊藤 正男", age:85, room:"D-01", gender:"男", diagnosis:"腰部脊柱管狭窄症", pt:"田中ST", days:["水","土"],
    caution:["体幹前屈制限・60°以上禁忌","間欠性跛行あり・休憩しながら実施"],
    goals:["歩行","IADL-買い物"],
    menu:[{id:1,category:"筋力",name:"腹筋・背筋強化",sets:2,reps:10,load:"軽",unit:"回",note:"前屈禁忌"},{id:2,category:"歩行",name:"歩行訓練（杖）",sets:1,reps:20,load:"中",unit:"m",note:"疼痛増強で即休憩"}],
    notes:[], records:{} },
  { id:5, name:"中村 幸子", age:79, room:"E-02", gender:"女", diagnosis:"右大腿骨頸部骨折術後", pt:"山田OT", days:["月","火","木","土"],
    caution:["右股関節90°以上屈曲禁忌","患側荷重制限（術後3ヶ月）"],
    goals:["筋力","BI-移乗","IADL-炊事","IADL-掃除"],
    menu:[{id:1,category:"筋力",name:"股関節外転筋訓練",sets:3,reps:10,load:"軽",unit:"回",note:"疼痛確認しながら"},{id:2,category:"歩行",name:"歩行器歩行",sets:2,reps:10,load:"中",unit:"m",note:"右荷重に注意"}],
    notes:[], records:{} },
];

const todayStr = () => new Date().toISOString().slice(0,10);
const todayDayName = () => ["日","月","火","水","木","金","土"][new Date().getDay()];

function useLS(key, init) {
  const [v, setV] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  const set = val => { setV(val); try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
  return [v, set];
}



const DEFAULT_BASIC_MENU = ["１番","２番","３番","４番","５番","６番","ベッド","プーリー","ゴムバンド","足つり（レッド）","レッド（板）","メドマー","ホットパック","屋外歩行"];

function printMenu(user) {
  const w = window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${user.name} リハビリメニュー</title>
<style>body{font-family:sans-serif;padding:24px;font-size:14px}h1{font-size:20px;border-bottom:3px solid #2563EB;padding-bottom:8px;margin-bottom:6px}
.meta{color:#555;margin-bottom:16px}.caution{background:#FFF7ED;border-left:5px solid #EA580C;padding:10px 14px;margin-bottom:18px}
table{width:100%;border-collapse:collapse}th{background:#1e40af;color:white;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #e5e7eb}
</style></head><body><h1>🏥 リハビリメニュー表</h1>
<div class="meta">利用者：<b>${user.name}</b>（${user.age}歳・${user.room}）　診断名：${user.diagnosis}　担当：${user.pt}　出力日：${todayStr()}</div>
${user.caution.length?`<div class="caution"><b>⚠️ 禁忌・注意事項</b><br>${user.caution.map(c=>`・${c}`).join("<br>")}</div>`:""}
<table><tr><th>課題目標</th><th>種目名</th><th>セット</th><th>回数/量</th><th>負荷</th><th>注意事項</th></tr>
${user.menu.map(m=>`<tr><td>${CAT_ICON[m.category]} ${m.category}</td><td><b>${m.name}</b></td><td>${m.sets}セット</td><td>${m.reps}${m.unit}</td><td>${m.load}</td><td style="color:#555;font-size:13px">${m.note||"—"}</td></tr>`).join("")}
</table></body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>w.print(),400);
}

/* ═══════════════ UI PARTS ═══════════════ */
function CheckCircle({ done, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:48, height:48, borderRadius:"50%", flexShrink:0,
      border:`2px solid ${done?"#059669":"#D1D5DB"}`,
      background: done ? "#059669" : "white",
      cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center",
      transition:"all 0.2s", color: done ? "white" : "#D1D5DB",
      boxShadow: done ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
    }}>
      {done ? "✓" : "○"}
    </button>
  );
}

function ProgressRing({ pct, size=52, stroke=4 }) {
  const r = (size-stroke)/2;
  const circ = 2*Math.PI*r;
  const color = pct===100?"#059669":pct>0?"#2563EB":"#E5E7EB";
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{transition:"stroke-dashoffset 0.5s ease"}}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:11, fontWeight:800, color: pct===100?"#059669":"#374151" }}>{pct}%</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => { document.body.style.overflow="hidden"; return ()=>{document.body.style.overflow="";}; }, []);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:400,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"white", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:640,
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 -4px 24px rgba(0,0,0,0.12)",
        animation:"slideUp 0.22s ease",
      }}>
        <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid #F3F4F6",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:18, fontWeight:700, color:"#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background:"#F3F4F6", border:"none", borderRadius:"50%",
            width:36, height:36, fontSize:18, cursor:"pointer", color:"#6B7280",
            display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"18px 20px 32px" }}>{children}</div>
      </div>
    </div>
  );
}

function Confirm({ msg, onOk, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"white", borderRadius:20, padding:"28px 24px", maxWidth:340, width:"100%",
        textAlign:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ fontSize:38, marginBottom:10 }}>🗑️</div>
        <div style={{ fontSize:17, fontWeight:700, color:"#111827", marginBottom:22, lineHeight:1.6 }}>{msg}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, minHeight:48, borderRadius:12, border:"1.5px solid #E5E7EB",
            background:"white", fontSize:15, fontWeight:600, cursor:"pointer", color:"#6B7280" }}>キャンセル</button>
          <button onClick={onOk} style={{ flex:1, minHeight:48, borderRadius:12, border:"none",
            background:"#DC2626", color:"white", fontSize:15, fontWeight:700, cursor:"pointer" }}>削除する</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#6B7280", marginBottom:6, letterSpacing:"0.04em" }}>{label}</div>
      {children}
    </div>
  );
}

const INP = {
  width:"100%", border:"1.5px solid #E5E7EB", borderRadius:10, padding:"12px 14px",
  fontSize:16, outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  background:"white", color:"#111827", transition:"border-color 0.15s",
};

/* ═══════════════ DRAGGABLE MENU LIST ═══════════════ */
function DraggableMenuList({ menu, onReorder, onEdit, onDelete, records, onToggle, isToday }) {
  const dragIdx = useRef(null);
  const [over, setOver] = useState(null);
  const [dragging, setDragging] = useState(null);
  const onDragStart = i => { dragIdx.current=i; setDragging(i); };
  const onDragEnter = i => setOver(i);
  const onDragEnd = () => {
    if (dragIdx.current!==null && over!==null && dragIdx.current!==over) {
      const a=[...menu]; const [item]=a.splice(dragIdx.current,1); a.splice(over,0,item); onReorder(a);
    }
    setDragging(null); setOver(null); dragIdx.current=null;
  };
  return (
    <div style={{ display:"grid", gap:8 }}>
      {menu.map((m,i) => {
        const done = records?.[m.id]||false;
        const cc = CAT_COLOR[m.category]||"#6B7280";
        const load = LOAD_CONFIG[m.load];
        return (
          <div key={m.id} draggable onDragStart={()=>onDragStart(i)} onDragEnter={()=>onDragEnter(i)}
            onDragEnd={onDragEnd} onDragOver={e=>e.preventDefault()}
            style={{ background: done?"#F0FDF4":"white",
              border:`1.5px solid ${over===i?cc:done?"#86EFAC":"#E5E7EB"}`,
              borderLeft:`4px solid ${done?"#22C55E":cc}`,
              borderRadius:12, padding:"13px 14px",
              opacity: dragging===i?0.4:1, transition:"all 0.15s",
              cursor: isToday?"default":"grab" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
              {isToday && <CheckCircle done={done} onClick={()=>onToggle(m.id)}/>}
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6, marginBottom:7 }}>
                  {!isToday && <span style={{ color:"#D1D5DB", fontSize:12 }}>⣿</span>}
                  <span style={{ fontSize:16, fontWeight:700,
                    color: done?"#15803D":"#111827",
                    textDecoration: done?"line-through":"none" }}>
                    {shortLabel(m.name)}
                  </span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:m.note?8:0 }}>
                  <span style={{ background:`${cc}12`, color:cc, padding:"3px 10px",
                    borderRadius:20, fontSize:12, fontWeight:700 }}>{shortLabel(m.category)}</span>
                  <span style={{ background:"#EFF6FF", color:"#2563EB", padding:"3px 10px",
                    borderRadius:20, fontSize:12, fontWeight:600 }}>{m.sets}セット × {m.reps}{m.unit}</span>
                  <span style={{ background:load.bg, color:load.color, border:`1px solid ${load.border}`,
                    padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>{m.load}負荷</span>
                </div>
                {m.note && (
                  <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8,
                    padding:"6px 11px", fontSize:13, color:"#92400E" }}>📌 {m.note}</div>
                )}
                {!isToday && (
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <button onClick={()=>onEdit(m)} style={{ minHeight:36, padding:"0 14px",
                      background:"#EFF6FF", color:"#2563EB", border:"none", borderRadius:8,
                      fontSize:13, fontWeight:700, cursor:"pointer" }}>✏️ 編集</button>
                    <button onClick={()=>onDelete(m.id)} style={{ minHeight:36, padding:"0 14px",
                      background:"#FEF2F2", color:"#DC2626", border:"none", borderRadius:8,
                      fontSize:13, fontWeight:700, cursor:"pointer" }}>🗑️ 削除</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════ MAIN APP ═══════════════ */
export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [sharedBasicMenu, setSharedBasicMenu] = useState(DEFAULT_BASIC_MENU);
  const [mBasicEdit, setMBasicEdit] = useState(false);
  const [basicEditText, setBasicEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  // 起動時にGASからデータを取得
  useEffect(() => {
    (async () => {
      try {
        const [allData, settingsData] = await Promise.all([
          gasGet("getAll"),
          gasGet("getSettings"),
        ]);
        if (allData.ok && allData.users.length > 0) setUsers(allData.users);
        if (settingsData.ok && settingsData.settings.basicMenu) {
          setSharedBasicMenu(settingsData.settings.basicMenu);
        }
      } catch(e) {
        setError("データの読み込みに失敗しました。オフラインで動作中。");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // GASにユーザーを保存
  const syncUser = async (user) => {
    try { await gasPost({ action: "saveUser", user }); } catch {}
  };

  // GASにチェック記録を保存
  const syncRecord = async (userId, date, key, value) => {
    try { await gasPost({ action: "saveRecord", userId, date, key, value }); } catch {}
  };

  // GASに申し送りを保存
  const syncNote = async (userId, note) => {
    try { await gasPost({ action: "saveNote", userId, note }); } catch {}
  };

  // GASに設定を保存
  const syncSettings = async (settings) => {
    try { await gasPost({ action: "saveSettings", settings }); } catch {}
  };
  const [selId, setSelId] = useState(null);
  const [detailMode, setDetailMode] = useState("basic");

  const todayDay = todayDayName();
  const initDay = DAYS.includes(todayDay) ? todayDay : "月";
  const [activeDay, setActiveDay] = useState(initDay);
  const [showAll, setShowAll] = useState(false);

  const [mMenu, setMMenu] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [mNote, setMNote] = useState(false);
  const [mAddUser, setMAddUser] = useState(false);
  const [mEditUser, setMEditUser] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const [mForm, setMForm] = useState({category:"筋力",name:"",sets:3,reps:10,load:"軽",unit:"回",note:""});
  const [nForm, setNForm] = useState({staff:"",text:""});
  const [uForm, setUForm] = useState({name:"",age:"",room:"",gender:"女",diagnosis:"",pt:"",caution:"",days:[],goals:[]});

  const sel = users.find(u=>u.id===selId);
  const td = todayStr();
  const upd = fn => {
    const next = users.map(u => {
      if (u.id !== selId) return u;
      const updated = fn(u);
      syncUser(updated);
      return updated;
    });
    setUsers(next);
  };

  const getRecord = (uid,mid) => users.find(u=>u.id===uid)?.records?.[td]?.[mid]||false;
  const toggleRec = mid => {
    const user = users.find(u=>u.id===selId);
    if (!user) return;
    const newVal = !user.records?.[td]?.[mid];
    syncRecord(selId, td, mid, newVal);
    upd(u=>{ const r={...u.records}; r[td]={...(r[td]||{}),[mid]:newVal}; return {...u,records:r}; });
  };

  const todayDone = sel ? sel.menu.filter(m=>getRecord(selId,m.id)).length : 0;
  const todayPct = sel?.menu.length ? Math.round(todayDone/sel.menu.length*100) : 0;

  const saveMenu = () => {
    if (!mForm.name.trim()) return;
    upd(u => {
      if (editItem) return {...u, menu:u.menu.map(m=>m.id===editItem?{...mForm,id:editItem}:m)};
      const id = Math.max(0,...u.menu.map(m=>m.id),0)+1;
      return {...u, menu:[...u.menu,{...mForm,id}]};
    });
    setMMenu(false); setEditItem(null); setMForm({category:"筋力",name:"",sets:3,reps:10,load:"軽",unit:"回",note:""});
  };

  const addNote = (text,staff) => {
    const id = Math.max(0,...(sel?.notes||[]).map(n=>n.id),0)+1;
    const note = {id, date:td, staff, text};
    syncNote(selId, note);
    upd(u=>({...u, notes:[note,...u.notes]}));
  };

  const saveUser = (isEdit) => {
    if (!uForm.name.trim()) return;
    if (isEdit) {
      const updated = {...users.find(u=>u.id===selId),...uForm,age:parseInt(uForm.age)||0,caution:uForm.caution.split("\n").filter(Boolean),goals:uForm.goals||[]};
      setUsers(users.map(u=>u.id===selId?updated:u));
      syncUser(updated);
      setMEditUser(false);
    } else {
      const id = Math.max(0,...users.map(u=>u.id))+1;
      const newUser = {id,...uForm,age:parseInt(uForm.age)||0,caution:uForm.caution.split("\n").filter(Boolean),goals:uForm.goals||[],menu:[],notes:[],records:{}};
      setUsers([...users, newUser]);
      syncUser(newUser);
      setMAddUser(false);
    }
    setUForm({name:"",age:"",room:"",gender:"女",diagnosis:"",pt:"",caution:"",days:[],goals:[]});
  };

  const openEditUser = () => { setUForm({...sel,caution:sel.caution.join("\n"),days:[...sel.days],goals:[...(sel.goals||[])]}); setMEditUser(true); };

  const execDelete = () => {
    if (!confirmDel) return;
    if (confirmDel.type==="menu") upd(u=>({...u,menu:u.menu.filter(m=>m.id!==confirmDel.id)}));
    if (confirmDel.type==="user") {
      gasPost({ action: "deleteUser", id: confirmDel.id });
      setUsers(users.filter(u=>u.id!==confirmDel.id));
      setSelId(null);
    }
    setConfirmDel(null);
  };


  const dayUsers = users.filter(u=>u.days.includes(activeDay));
  const isToday = activeDay===todayDay;
  const displayUsers = showAll ? users : dayUsers;
  const sortedUsers = isToday
    ? [...displayUsers.filter(u=>!u.menu.every(m=>getRecord(u.id,m.id))),
       ...displayUsers.filter(u=>u.menu.length>0&&u.menu.every(m=>getRecord(u.id,m.id))),
       ...displayUsers.filter(u=>u.menu.length===0)]
    : displayUsers;

  const DayPicker = ({value,onChange}) => (
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {DAYS.map(d=>{const on=value.includes(d); return(
        <button key={d} onClick={()=>onChange(on?value.filter(x=>x!==d):[...value,d])}
          style={{ width:48,height:48,borderRadius:10,fontSize:16,fontWeight:800,cursor:"pointer",
            background:on?DAY_COLOR[d]:"white", color:on?"white":DAY_COLOR[d],
            border:`2px solid ${DAY_COLOR[d]}`, transition:"all 0.15s" }}>{d}</button>
      );})}
    </div>
  );

  const UserForm = ({isEdit}) => (
    <>
      <Field label="氏名（必須）">
        <input style={INP} value={uForm.name} onChange={e=>setUForm({...uForm,name:e.target.value})} placeholder="田中 花子"
          onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="年齢">
          <input style={INP} type="number" value={uForm.age} onChange={e=>setUForm({...uForm,age:e.target.value})}
            onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
        </Field>
        <Field label="部屋番号">
          <input style={INP} value={uForm.room} onChange={e=>setUForm({...uForm,room:e.target.value})} placeholder="A-01"
            onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
        </Field>
      </div>
      <Field label="性別">
        <div style={{display:"flex",gap:10}}>
          {["女","男"].map(g=>(
            <button key={g} onClick={()=>setUForm({...uForm,gender:g})}
              style={{ flex:1,minHeight:48,borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",
                background:uForm.gender===g?"#2563EB":"white", color:uForm.gender===g?"white":"#6B7280",
                border:`1.5px solid ${uForm.gender===g?"#2563EB":"#E5E7EB"}` }}>
              {g==="女"?"👩 女":"👴 男"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="来所曜日"><DayPicker value={uForm.days} onChange={d=>setUForm({...uForm,days:d})}/></Field>
      <Field label="担当PT/OT/ST">
        <input style={INP} value={uForm.pt} onChange={e=>setUForm({...uForm,pt:e.target.value})} placeholder="鈴木PT"
          onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
      </Field>
      <Field label="診断名">
        <input style={INP} value={uForm.diagnosis} onChange={e=>setUForm({...uForm,diagnosis:e.target.value})} placeholder="脳梗塞後遺症（左片麻痺）"
          onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
      </Field>
      <Field label="禁忌・注意事項（1行1件）">
        <textarea style={{...INP,resize:"vertical"}} rows={3} value={uForm.caution}
          onChange={e=>setUForm({...uForm,caution:e.target.value})}
          placeholder={"血圧180以上で中止\n左肩外転90°以上禁忌"}
          onFocus={e=>e.target.style.borderColor="#EA580C"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
      </Field>
      <Field label="課題目標（複数選択可）">
        {[
          { label:"運動・機能", items:["筋力","バランス","歩行","ROM","有酸素","協調","社会参加"], color:"#2563EB" },
          { label:"BI", items:["BI-食事","BI-移乗","BI-整容","BI-トイレ","BI-入浴","BI-歩行","BI-階段","BI-更衣","BI-排便","BI-排尿"], color:"#6366F1" },
          { label:"IADL", items:["IADL-炊事","IADL-洗濯","IADL-買い物","IADL-掃除"], color:"#0891B2" },
        ].map(group=>(
          <div key={group.label} style={{ marginBottom:10 }}>
            <div style={{ fontSize:11,fontWeight:700,color:group.color,marginBottom:6,
              borderLeft:`3px solid ${group.color}`,paddingLeft:8 }}>{group.label}</div>
            <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
              {group.items.map(c=>{
                const label = c.includes("-") ? c.split("-").slice(1).join("-") : c;
                const sel2 = (uForm.goals||[]).includes(c);
                const cc = CAT_COLOR[c]||"#6B7280";
                return (
                  <button key={c} type="button" onClick={()=>{
                    const cur = uForm.goals||[];
                    setUForm({...uForm, goals: sel2?cur.filter(x=>x!==c):[...cur,c]});
                  }} style={{ minHeight:34,padding:"0 12px",borderRadius:8,fontSize:13,cursor:"pointer",
                    border:`1.5px solid ${sel2?cc:"#E5E7EB"}`,
                    background:sel2?`${cc}15`:"white",
                    color:sel2?cc:"#6B7280",fontWeight:sel2?700:500 }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Field>
      <button onClick={()=>saveUser(isEdit)} style={{ width:"100%",minHeight:52,borderRadius:12,border:"none",
        fontSize:16,fontWeight:700,cursor:"pointer",background:"#2563EB",color:"white",marginTop:8 }}>
        {isEdit?"変更を保存する":"追加する"}
      </button>
    </>
  );

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body,button,input,select,textarea{font-family:'Noto Sans JP',sans-serif;}
    input:focus,textarea:focus,select:focus{outline:none;}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#E5E7EB;border-radius:4px}
    @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .hc{transition:box-shadow 0.15s,transform 0.15s;}
    .hc:hover{box-shadow:0 4px 16px rgba(0,0,0,0.1)!important;transform:translateY(-1px);}
  `;

  /* ════════════ LOADING ════════════ */
  if (loading) return (
    <div style={{ fontFamily:"'Noto Sans JP',sans-serif", background:"#F9FAFB", minHeight:"100vh",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <style>{css}</style>
      <div style={{ width:40, height:40, border:"4px solid #E5E7EB", borderTop:"4px solid #2563EB",
        borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <div style={{ fontSize:15, color:"#6B7280", fontWeight:600 }}>データを読み込んでいます...</div>
    </div>
  );

  /* ════════════ LIST VIEW ════════════ */
  if (!sel) {
    const todayStats = {
      total: dayUsers.length,
      done: dayUsers.filter(u=>u.menu.length&&u.menu.every(m=>getRecord(u.id,m.id))).length,
      caution: dayUsers.filter(u=>u.caution.length).length,
    };
    return (
      <div style={{ fontFamily:"'Noto Sans JP',sans-serif", background:"#F9FAFB", minHeight:"100vh" }}>
        <style>{css}</style>
        {error && (
          <div style={{ background:"#FFF7ED", borderBottom:"1px solid #FED7AA",
            padding:"8px 16px", fontSize:13, color:"#C2410C", fontWeight:600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Header */}
        <div style={{ background:"white", position:"sticky", top:0, zIndex:50,
          borderBottom:"1px solid #E5E7EB", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ padding:"12px 16px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:"#111827" }}>🏥 デイリハ管理</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:1 }}>
                {new Date().toLocaleDateString("ja-JP",{month:"long",day:"numeric",weekday:"short"})}
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={()=>{setBasicEditText(sharedBasicMenu.join("\n"));setMBasicEdit(true);}}
                style={{ background:"#F3F4F6", border:"none", borderRadius:10,
                  color:"#374151", padding:"9px 14px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                ⚙️ 基礎
              </button>
              <button onClick={()=>{setUForm({name:"",age:"",room:"",gender:"女",diagnosis:"",pt:"",caution:"",days:[],goals:[]});setMAddUser(true);}}
                style={{ background:"#2563EB", border:"none", borderRadius:10,
                  color:"white", padding:"9px 16px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                ＋ 追加
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", overflowX:"auto", padding:"6px 8px 0" }}>
            <button onClick={()=>setShowAll(v=>!v)}
              style={{ padding:"9px 14px", border:"none", background:"transparent", cursor:"pointer", flexShrink:0,
                color:showAll?"#2563EB":"#9CA3AF", fontWeight:showAll?800:500, fontSize:14,
                borderBottom:showAll?"2px solid #2563EB":"2px solid transparent" }}>
              全員
            </button>
            {DAYS.map(d=>{
              const cnt = users.filter(u=>u.days.includes(d)).length;
              const isActive = !showAll && activeDay===d;
              const isTd = d===todayDay;
              return (
                <button key={d} onClick={()=>{setActiveDay(d);setShowAll(false);}}
                  style={{ padding:"9px 14px", border:"none", cursor:"pointer", flexShrink:0,
                    background:"transparent", position:"relative",
                    borderBottom: isActive?`2px solid ${DAY_COLOR[d]}`:"2px solid transparent",
                    color: isActive?DAY_COLOR[d]:isTd?"#374151":"#9CA3AF",
                    fontWeight: isActive?800:500, fontSize:14 }}>
                  {isTd && <span style={{ position:"absolute", top:7, right:5, width:5, height:5,
                    background:"#FBBF24", borderRadius:"50%" }}/>}
                  {d}曜
                  <span style={{ display:"block", fontSize:11, color:"#9CA3AF" }}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding:"14px 12px", maxWidth:720, margin:"0 auto" }}>
          {/* Stats */}
          {isToday && !showAll && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                {label:"本日の利用者",val:`${todayStats.total}名`,color:"#2563EB",bg:"#EFF6FF"},
                {label:"実施完了",val:`${todayStats.done}名`,color:"#059669",bg:"#F0FDF4"},
                {label:"要注意",val:`${todayStats.caution}名`,color:"#EA580C",bg:"#FFF7ED"},
              ].map((s,i)=>(
                <div key={i} style={{ background:s.bg, borderRadius:14, padding:"12px 10px", textAlign:"center" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:s.color, marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Label */}
          <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
            <div style={{ flex:1, fontSize:14, fontWeight:700, color:"#374151" }}>
              {showAll ? `全利用者 ${users.length}名` : (
                <span>
                  <span style={{ background:DAY_COLOR[activeDay], color:"white",
                    padding:"2px 10px", borderRadius:20, marginRight:8, fontSize:13 }}>{activeDay}曜日</span>
                  {isToday && <span style={{ background:"#FFFBEB", color:"#D97706",
                    padding:"2px 10px", borderRadius:20, fontSize:12, fontWeight:700 }}>📅 今日</span>}
                </span>
              )}
            </div>
            <span style={{ fontSize:13, color:"#9CA3AF" }}>{sortedUsers.length}名</span>
          </div>

          {/* Cards */}
          {sortedUsers.length===0 ? (
            <div style={{ textAlign:"center", padding:80, color:"#D1D5DB", fontSize:16 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              {showAll?"利用者がいません":`${activeDay}曜日の利用者はいません`}
            </div>
          ) : (
            <div style={{ display:"grid", gap:10 }}>
              {sortedUsers.map(u=>{
                const done = u.menu.filter(m=>getRecord(u.id,m.id)).length;
                const pct = u.menu.length ? Math.round(done/u.menu.length*100) : null;
                const allDone = u.menu.length>0 && done===u.menu.length;
                return (
                  <button key={u.id} className="hc"
                    onClick={()=>{setSelId(u.id);setDetailMode("basic");}}
                    style={{ display:"block", background:"white",
                      borderRadius:16, padding:"14px",
                      border:"1.5px solid #E5E7EB",
                      cursor:"pointer", width:"100%", textAlign:"left",
                      boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>

                    {/* 名前行 */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                      <span style={{ fontSize:17, fontWeight:800, color:"#111827" }}>{u.name}</span>
                      <span style={{ fontSize:12, color:"#9CA3AF" }}>{u.age}歳</span>
                      {u.days.map(d=>(
                        <span key={d} style={{ background:d===activeDay&&!showAll?DAY_COLOR[d]:`${DAY_COLOR[d]}15`,
                          color:d===activeDay&&!showAll?"white":DAY_COLOR[d],
                          padding:"1px 7px",borderRadius:20,fontSize:11,fontWeight:700 }}>{d}</span>
                      ))}
                      <span style={{ fontSize:12,color:"#9CA3AF",marginLeft:2 }}>{u.pt}</span>
                      <span style={{ fontSize:18,color:"#D1D5DB",marginLeft:"auto" }}>›</span>
                    </div>

                    {/* 課題目標＋基礎メニュー バッジ行 */}
                    {((u.goals||[]).length>0 || sharedBasicMenu.length>0) && (
                      <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:10, marginTop:4 }}>

                        {/* 課題目標 */}
                        {(u.goals||[]).length>0 && (
                          <div style={{ display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:sharedBasicMenu.length>0?8:0 }}>
                            <span style={{ fontSize:10,fontWeight:700,color:"#9CA3AF",flexShrink:0,whiteSpace:"nowrap" }}>課題目標</span>
                            {(u.goals||[]).map(g=>{
                              const cc = CAT_COLOR[g]||"#6B7280";
                              return (
                                <span key={g} style={{
                                  background:`${cc}12`,color:cc,border:`1px solid ${cc}28`,
                                  padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,
                                  whiteSpace:"nowrap"
                                }}>{shortLabel(g)}</span>
                              );
                            })}
                          </div>
                        )}

                        {/* 基礎メニュー */}
                        {sharedBasicMenu.length>0 && (
                          <div style={{ display:"flex",alignItems:"center",gap:5,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,fontWeight:700,color:"#9CA3AF",flexShrink:0,whiteSpace:"nowrap" }}>基礎</span>
                            {sharedBasicMenu.map((item,i)=>{
                              const key=`basic_${i}`;
                              const isDone=getRecord(u.id,key);
                              return (
                                <button key={key}
                                  onClick={e=>{
                                    e.stopPropagation();
                                    const r={...u.records}; r[td]={...(r[td]||{}),[key]:!r[td]?.[key]};
                                    setUsers(users.map(x=>x.id===u.id?{...x,records:r}:x));
                                  }}
                                  style={{
                                    padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600,
                                    cursor:"pointer",whiteSpace:"nowrap",
                                    border:`1.5px solid ${isDone?"#22C55E":"#E5E7EB"}`,
                                    background:isDone?"#DCFCE7":"#F9FAFB",
                                    color:isDone?"#15803D":"#6B7280",
                                    transition:"all 0.15s",
                                  }}>
                                  {isDone?"✓ "+item:item}
                                </button>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}

                    {/* 50/50 エリア：個別メニュー｜注意事項 */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>

                      {/* 左：個別メニュー */}
                      <div style={{ borderRight:"1px solid #F3F4F6", paddingRight:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#6B7280", marginBottom:6, letterSpacing:"0.05em" }}>個別メニュー</div>
                        {u.menu.length===0
                          ? <span style={{ fontSize:12,color:"#D1D5DB" }}>未登録</span>
                          : u.menu.map((m,i)=>{
                              const isDone = getRecord(u.id,m.id);
                              return (
                                <div key={m.id} style={{ display:"flex", alignItems:"baseline", gap:6,
                                  marginBottom: i<u.menu.length-1?5:0 }}>
                                  <span style={{ fontSize:11, color:isDone?"#22C55E":"#9CA3AF",
                                    fontWeight:700, flexShrink:0 }}>{i+1}.</span>
                                  <span style={{ fontSize:13, fontWeight:600,
                                    color:isDone?"#9CA3AF":"#374151",
                                    textDecoration:isDone?"line-through":"none",
                                    lineHeight:1.4 }}>{shortLabel(m.name)}</span>
                                </div>
                              );
                            })
                        }
                        {u.menu.length>0 && (
                          <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:8 }}>
                            <div style={{ flex:1,height:3,background:"#F3F4F6",borderRadius:3,overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`,height:"100%",borderRadius:3,transition:"width 0.5s",
                                background:allDone?"#22C55E":pct>0?"#2563EB":"transparent" }}/>
                            </div>
                            <span style={{ fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap" }}>{done}/{u.menu.length}</span>
                          </div>
                        )}
                      </div>

                      {/* 右：注意事項 */}
                      <div style={{ paddingLeft:12 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:"#EA580C", marginBottom:6, letterSpacing:"0.05em" }}>注意事項</div>
                        {u.caution.length===0
                          ? <span style={{ fontSize:12,color:"#D1D5DB" }}>なし</span>
                          : u.caution.map((c,i)=>(
                              <div key={i} style={{ display:"flex",alignItems:"baseline",gap:6,
                                marginBottom:i<u.caution.length-1?5:0 }}>
                                <span style={{ fontSize:11,color:"#EA580C",fontWeight:700,flexShrink:0 }}>{i+1}.</span>
                                <span style={{ fontSize:13,color:"#C2410C",lineHeight:1.4,fontWeight:500 }}>{c}</span>
                              </div>
                            ))
                        }
                      </div>

                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {mBasicEdit && (
          <Modal title="基礎メニューを編集" onClose={()=>setMBasicEdit(false)}>
            <div style={{ fontSize:13,color:"#6B7280",marginBottom:12 }}>
              施設共通の基礎メニューです。1行に1項目を入力してください。
            </div>
            <Field label="項目リスト（1行1項目）">
              <textarea style={{...INP,resize:"vertical",lineHeight:1.8}} rows={8}
                value={basicEditText} onChange={e=>setBasicEditText(e.target.value)}
                placeholder={"準備体操\n血圧測定\nSpO2測定\n体重測定"}
                onFocus={e=>e.target.style.borderColor="#2563EB"}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
            </Field>
            <button onClick={()=>{
              const items = basicEditText.split("\n").map(s=>s.trim()).filter(Boolean);
              setSharedBasicMenu(items);
              syncSettings({ basicMenu: items });
              setMBasicEdit(false);
            }} style={{ width:"100%",minHeight:52,borderRadius:12,border:"none",
              fontSize:16,fontWeight:700,cursor:"pointer",background:"#2563EB",color:"white",marginTop:8 }}>
              保存する
            </button>
          </Modal>
        )}
        {mAddUser && <Modal title="利用者を追加" onClose={()=>setMAddUser(false)}><UserForm isEdit={false}/></Modal>}
        {confirmDel && <Confirm msg="本当に削除しますか？" onOk={execDelete} onCancel={()=>setConfirmDel(null)}/>}
      </div>
    );
  }

  /* ════════════ DETAIL VIEW ════════════ */
  const menuDone = {};
  sel.menu.forEach(m=>{menuDone[m.id]=getRecord(selId,m.id);});

  return (
    <div style={{ fontFamily:"'Noto Sans JP',sans-serif", background:"#F9FAFB", minHeight:"100vh" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ background:"white", position:"sticky", top:0, zIndex:50,
        borderBottom:"1px solid #E5E7EB", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ padding:"12px 14px 10px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setSelId(null)}
            style={{ background:"#F3F4F6", border:"none", borderRadius:10, color:"#374151",
              width:42, height:42, fontSize:20, cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center", flexShrink:0 }}>‹</button>
          <div style={{ width:42,height:42,borderRadius:12,flexShrink:0,
            background:sel.gender==="女"?"#FCE7F3":"#DBEAFE",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>
            {sel.gender==="女"?"👩":"👴"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:19,fontWeight:800,color:"#111827" }}>{sel.name}</div>
            <div style={{ display:"flex",gap:5,marginTop:2,flexWrap:"wrap",alignItems:"center" }}>
              <span style={{ fontSize:12,color:"#9CA3AF" }}>{sel.age}歳・{sel.room}・{sel.pt}</span>
              {sel.days.map(d=>(
                <span key={d} style={{ background:DAY_COLOR[d],color:"white",
                  padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:700 }}>{d}曜</span>
              ))}
            </div>
          </div>
          <ProgressRing pct={todayPct} size={50} stroke={4}/>
        </div>
        <div style={{ display:"flex", borderTop:"1px solid #F3F4F6" }}>
          {[["basic","基礎"],["today","個別"],["notes","申し送り"]].map(([k,l])=>(
            <button key={k} onClick={()=>setDetailMode(k)}
              style={{ flex:1,minHeight:44,border:"none",background:"transparent",fontSize:13,fontWeight:700,
                color:detailMode===k?"#2563EB":"#9CA3AF",
                borderBottom:detailMode===k?"2px solid #2563EB":"2px solid transparent",cursor:"pointer" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Caution */}
      {sel.caution.length>0 && (
        <div style={{ background:"#FFF7ED",borderBottom:"1px solid #FED7AA",padding:"10px 16px" }}>
          <div style={{ fontWeight:700,color:"#EA580C",fontSize:13,marginBottom:5 }}>⚠️ 禁忌・注意事項</div>
          {sel.caution.map((c,i)=>(
            <div key={i} style={{ fontSize:13,color:"#C2410C",padding:"2px 0 2px 10px",
              borderLeft:"3px solid #FCA5A5",marginBottom:i<sel.caution.length-1?4:0 }}>{c}</div>
          ))}
        </div>
      )}

      <div style={{ padding:14, maxWidth:720, margin:"0 auto" }}>

        {/* BASIC TAB */}
        {detailMode==="basic" && (
          <div>
            <div style={{ fontSize:13,color:"#9CA3AF",fontWeight:500,marginBottom:14 }}>📅 {td}</div>

            {/* 課題目標 */}
            <div style={{ background:"white",borderRadius:14,padding:"14px",marginBottom:12,border:"1.5px solid #E5E7EB" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",marginBottom:10,letterSpacing:"0.05em" }}>課題目標</div>
              {(sel.goals||[]).length===0
                ? <span style={{ fontSize:13,color:"#D1D5DB" }}>未設定（利用者情報編集から設定）</span>
                : <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {(sel.goals||[]).map(g=>{
                      const cc = CAT_COLOR[g]||"#6B7280";
                      return (
                        <span key={g} style={{ background:`${cc}12`,color:cc,border:`1px solid ${cc}30`,
                          padding:"4px 12px",borderRadius:20,fontSize:13,fontWeight:700 }}>
                          {shortLabel(g)}
                        </span>
                      );
                    })}
                  </div>
              }
            </div>

            {/* 基礎メニュー タップ式（施設共通） */}
            <div style={{ background:"white",borderRadius:14,padding:"14px",border:"1.5px solid #E5E7EB" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6B7280",marginBottom:12,letterSpacing:"0.05em" }}>
                基礎メニュー（施設共通）
              </div>
              {sharedBasicMenu.length===0
                ? <div style={{ textAlign:"center",padding:"24px 0",color:"#D1D5DB",fontSize:14 }}>
                    項目がありません（トップ画面の「⚙️ 基礎」から設定）
                  </div>
                : <div style={{ display:"grid",gap:8 }}>
                    {sharedBasicMenu.map((item,i)=>{
                      const key = `basic_${i}`;
                      const done = getRecord(selId,key);
                      return (
                        <button key={key} onClick={()=>{
                          const newVal2 = !sel.records?.[td]?.[key];
                          syncRecord(selId, td, key, newVal2);
                          const r={...sel.records}; r[td]={...(r[td]||{}),[key]:newVal2};
                          setUsers(users.map(u=>u.id===selId?{...u,records:r}:u));
                        }} style={{
                          display:"flex",alignItems:"center",gap:14,
                          background:done?"#F0FDF4":"#F9FAFB",
                          border:`1.5px solid ${done?"#86EFAC":"#E5E7EB"}`,
                          borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left",
                          transition:"all 0.15s",width:"100%"
                        }}>
                          <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,
                            border:`2px solid ${done?"#22C55E":"#D1D5DB"}`,
                            background:done?"#22C55E":"white",
                            display:"flex",alignItems:"center",justifyContent:"center",
                            color:"white",fontSize:15,fontWeight:700,transition:"all 0.2s" }}>
                            {done?"✓":""}
                          </div>
                          <span style={{ fontSize:15,fontWeight:600,
                            color:done?"#9CA3AF":"#111827",
                            textDecoration:done?"line-through":"none" }}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        )}

        {/* INDIVIDUAL TAB */}
        {detailMode==="today" && (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
              <span style={{ fontSize:13,color:"#9CA3AF",fontWeight:500 }}>📅 {td}</span>
              <button onClick={()=>setDetailMode("menuMgmt")}
                style={{ fontSize:12,color:"#6B7280",background:"#F3F4F6",border:"none",
                  borderRadius:8,padding:"5px 10px",cursor:"pointer",fontWeight:600 }}>
                ⚙️ メニュー管理
              </button>
            </div>
            {sel.menu.length===0 ? (
              <div style={{ textAlign:"center",padding:60,color:"#D1D5DB",fontSize:15 }}>
                <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
                個別メニューがありません<br/><span style={{ fontSize:13 }}>「管理」タブから追加</span>
              </div>
            ) : (
              <DraggableMenuList menu={sel.menu} onReorder={m=>upd(u=>({...u,menu:m}))}
                records={menuDone} onToggle={toggleRec} isToday onEdit={()=>{}} onDelete={()=>{}}/>
            )}
            {todayPct===100 && sel.menu.length>0 && (
              <div style={{ marginTop:16,background:"#F0FDF4",border:"1px solid #86EFAC",
                borderRadius:16,padding:"20px",textAlign:"center" }}>
                <div style={{ fontSize:36 }}>🎉</div>
                <div style={{ fontSize:18,fontWeight:800,color:"#15803D",marginTop:6 }}>個別メニュー完了！</div>
              </div>
            )}
          </div>
        )}

        {/* MENU MANAGEMENT - now in a sub-area of 個別 tab, accessed via button */}
        {detailMode==="menuMgmt" && (
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
              <button onClick={()=>setDetailMode("today")}
                style={{ background:"#F3F4F6",border:"none",borderRadius:8,color:"#374151",
                  padding:"6px 12px",fontSize:13,fontWeight:600,cursor:"pointer" }}>← 戻る</button>
              <span style={{ fontSize:14,fontWeight:700,color:"#374151" }}>個別メニュー管理</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
              <span style={{ fontSize:12,color:"#9CA3AF" }}>⣿ ドラッグで並び替え</span>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={openEditUser}
                  style={{ minHeight:38,padding:"0 12px",borderRadius:8,border:"1.5px solid #E5E7EB",
                    background:"white",fontSize:13,fontWeight:600,cursor:"pointer",color:"#374151" }}>
                  情報編集
                </button>
                <button onClick={()=>printMenu(sel)}
                  style={{ minHeight:38,padding:"0 12px",borderRadius:8,border:"1.5px solid #E5E7EB",
                    background:"white",fontSize:13,fontWeight:600,cursor:"pointer",color:"#374151" }}>
                  印刷
                </button>
              </div>
            </div>
            {sel.menu.length===0 ? (
              <div style={{ textAlign:"center",padding:60,color:"#D1D5DB",fontSize:15 }}>まだメニューがありません</div>
            ) : (
              <DraggableMenuList menu={sel.menu} onReorder={m=>upd(u=>({...u,menu:m}))} records={{}} onToggle={()=>{}} isToday={false}
                onEdit={m=>{setMForm({...m});setEditItem(m.id);setMMenu(true);}}
                onDelete={id=>setConfirmDel({type:"menu",id})}/>
            )}
            <div style={{ marginTop:14,display:"grid",gap:10 }}>
              <button onClick={()=>{setEditItem(null);setMForm({category:"筋力",name:"",sets:3,reps:10,load:"軽",unit:"回",note:""});setMMenu(true);}}
                style={{ width:"100%",minHeight:52,borderRadius:12,border:"none",fontSize:16,fontWeight:700,
                  cursor:"pointer",background:"#2563EB",color:"white" }}>
                ＋ メニューを追加する
              </button>
              <button onClick={()=>setConfirmDel({type:"user",id:selId})}
                style={{ width:"100%",minHeight:48,borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",
                  background:"white",color:"#DC2626",border:"1.5px solid #FECACA" }}>
                🗑️ この利用者を削除
              </button>
            </div>
          </div>
        )}

        {/* NOTES */}
        {detailMode==="notes" && (
          <div>
            <div style={{ display:"flex",gap:10,marginBottom:14 }}>
              <button onClick={()=>setMNote(true)}
                style={{ minHeight:44,padding:"0 18px",borderRadius:10,border:"none",
                  background:"#2563EB",color:"white",fontSize:14,fontWeight:700,cursor:"pointer" }}>
                ＋ 申し送りを追加
              </button>
            </div>
            {sel.notes.length===0 ? (
              <div style={{ textAlign:"center",padding:60,color:"#D1D5DB",fontSize:15 }}>
                <div style={{ fontSize:40,marginBottom:12 }}>📝</div>申し送りがありません
              </div>
            ) : (
              <div style={{ display:"grid",gap:10 }}>
                {sel.notes.map(n=>(
                  <div key={n.id} style={{ background:"white",borderRadius:14,padding:"15px",
                    border:"1.5px solid #E5E7EB",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:8,alignItems:"center" }}>
                      <span style={{ background:"#DCFCE7",color:"#15803D",padding:"3px 12px",
                        borderRadius:20,fontSize:13,fontWeight:700 }}>👤 {n.staff}</span>
                      <span style={{ fontSize:12,color:"#9CA3AF" }}>{n.date}</span>
                    </div>
                    <div style={{ fontSize:15,lineHeight:1.8,color:"#374151" }}>{n.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MENU MODAL */}
      {mMenu && (
        <Modal title={editItem?"メニューを編集":"メニューを追加"} onClose={()=>{setMMenu(false);setEditItem(null);}}>
          <Field label="課題目標">
            {[
              { label:"運動・機能", items:["筋力","バランス","歩行","ROM","有酸素","協調","社会参加"], color:"#2563EB" },
              { label:"BI（バーセルインデックス）", items:["BI-食事","BI-移乗","BI-整容","BI-トイレ","BI-入浴","BI-歩行","BI-階段","BI-更衣","BI-排便","BI-排尿"], color:"#6366F1" },
              { label:"IADL", items:["IADL-炊事","IADL-洗濯","IADL-買い物","IADL-掃除"], color:"#0891B2" },
            ].map(group=>(
              <div key={group.label} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,fontWeight:700,color:group.color,marginBottom:6,
                  borderLeft:`3px solid ${group.color}`,paddingLeft:8 }}>{group.label}</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {group.items.map(c=>{
                    const label = c.startsWith("BI-")||c.startsWith("IADL-") ? c.split("-")[1] : c;
                    const cc = CAT_COLOR[c]||"#6B7280";
                    const sel = mForm.category===c;
                    return (
                      <button key={c} onClick={()=>setMForm({...mForm,category:c})}
                        style={{ minHeight:36,padding:"0 14px",borderRadius:8,
                          border:`1.5px solid ${sel?cc:"#E5E7EB"}`,
                          background:sel?`${cc}15`:"white",
                          color:sel?cc:"#6B7280",
                          fontWeight:sel?700:500,fontSize:13,cursor:"pointer" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </Field>
          <Field label="種目名（必須）">
            <input style={INP} value={mForm.name} onChange={e=>setMForm({...mForm,name:e.target.value})}
              placeholder="例：下肢筋力強化（座位）"
              onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          </Field>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
            <Field label="セット数">
              <input style={INP} type="number" min={1} value={mForm.sets} onChange={e=>setMForm({...mForm,sets:+e.target.value||1})}
                onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
            </Field>
            <Field label="回数・量">
              <input style={INP} type="number" min={1} value={mForm.reps} onChange={e=>setMForm({...mForm,reps:+e.target.value||1})}
                onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
            </Field>
            <Field label="単位">
              <select style={INP} value={mForm.unit} onChange={e=>setMForm({...mForm,unit:e.target.value})}>
                {["回","秒","分","m","往復"].map(u=><option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field label="負荷">
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10 }}>
              {["軽","中","強"].map(l=>{
                const lc=LOAD_CONFIG[l];
                return (
                  <button key={l} onClick={()=>setMForm({...mForm,load:l})}
                    style={{ minHeight:52,borderRadius:10,
                      border:`1.5px solid ${mForm.load===l?lc.color:lc.border}`,
                      background:mForm.load===l?lc.bg:"white",
                      color:mForm.load===l?lc.color:"#9CA3AF",
                      fontWeight:800,fontSize:18,cursor:"pointer" }}>{l}</button>
                );
              })}
            </div>
          </Field>
          <Field label="注意事項メモ（任意）">
            <input style={INP} value={mForm.note} onChange={e=>setMForm({...mForm,note:e.target.value})}
              placeholder="例：疼痛5/10以上で中止"
              onFocus={e=>e.target.style.borderColor="#D97706"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          </Field>
          <button onClick={saveMenu} style={{ width:"100%",minHeight:52,borderRadius:12,border:"none",
            fontSize:16,fontWeight:700,cursor:"pointer",background:"#2563EB",color:"white",marginTop:8 }}>
            {editItem?"変更を保存する":"追加する"}
          </button>
        </Modal>
      )}

      {/* NOTE MODAL */}
      {mNote && (
        <Modal title="申し送りを追加" onClose={()=>setMNote(false)}>
          <Field label="スタッフ名（必須）">
            <input style={INP} value={nForm.staff} onChange={e=>setNForm({...nForm,staff:e.target.value})} placeholder="鈴木PT"
              onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          </Field>
          <Field label="内容（必須）">
            <textarea style={{...INP,resize:"vertical"}} rows={6} value={nForm.text}
              onChange={e=>setNForm({...nForm,text:e.target.value})} placeholder="実施内容、気になった点、次回への引き継ぎなど"
              onFocus={e=>e.target.style.borderColor="#2563EB"} onBlur={e=>e.target.style.borderColor="#E5E7EB"}/>
          </Field>
          <button onClick={()=>{if(!nForm.staff||!nForm.text)return;addNote(nForm.text,nForm.staff);setNForm({staff:"",text:""});setMNote(false);}}
            style={{ width:"100%",minHeight:52,borderRadius:12,border:"none",fontSize:16,fontWeight:700,
              cursor:"pointer",background:"#2563EB",color:"white",marginTop:8 }}>
            保存する
          </button>
        </Modal>
      )}


      {mEditUser && (
        <Modal title="利用者情報を編集" onClose={()=>setMEditUser(false)}>
          <UserForm isEdit={true}/>
        </Modal>
      )}

      {confirmDel && <Confirm msg={confirmDel.type==="user"?"この利用者を削除しますか？":"このメニューを削除しますか？"} onOk={execDelete} onCancel={()=>setConfirmDel(null)}/>}
    </div>
  );
}
