// ==UserScript==
// @name         JP RUSH 3 新着チェック（試作）
// @namespace    jp-rush-local
// @version      4.10.457
// @updateURL    https://raw.githubusercontent.com/seiji1126/jp-rush/main/jp-rush.user.js
// @downloadURL  https://raw.githubusercontent.com/seiji1126/jp-rush/main/jp-rush.user.js
// @description  じゃんぱら検索結果（新着順）のどのページを開いても記録し、毎時の入れ替わりで新しく入った商品・上がってきた商品・在庫増・最安値↓に印を付けます。印は商品を開くまで消えません。通信は増やしません。保存はこの端末だけです。
// @match        https://www.janpara.co.jp/sale/search/*
// @match        https://www.janpara.co.jp/sale/cart/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @connect      gist.githubusercontent.com
// @connect      raw.githubusercontent.com
// ==/UserScript==
(() => {
  (function() {
    "use strict";
    // 4.10.178：表示までの時間を計る（スクリプトが動き始めた時刻。ページを開いてからの経過）
    const PERF_T0 = performance.now();
    // 4.10.143：カートのコピーで商品ページを読むための見えない枠の中では動かない（記録や印を書かない）
    if (window.name === "jprush-fetch") return;
    const Jt = "4.10.457",Ct ="jpRush.v4.", jt = [14, 15, 16, 17, 20, 21], Xt = [14, 20], Q = [14, 15, 16, 17, 20, 21, 22], Zt = 3e4, qe = 50 * 6e4, He = /^\/sale\/search\/result\/?$/, Qt = /^\/sale\/search\/detail\/?$/, te = /新着|入荷/, ee = /SOLD\s*OUT|完売|売り?切れ|在庫切れ/i, K = { NEW: "\u65B0\u7740", REST: "\u5FA9\u6D3B", BACK: "\u623B\u308A", PRICE: "\u5024\u4E0B\u3052", STOCK: "\u5728\u5EAB\u5897" }, Fe = { NEW: "\u307E\u3060\u4E00\u5EA6\u3082\u8A18\u9332\u3057\u3066\u3044\u306A\u3044\u5546\u54C1\u3067\u3059\uFF08\u958B\u3044\u305F\u3053\u3068\u306E\u306A\u3044\u30DA\u30FC\u30B8\u306E\u5546\u54C1\u3082\u542B\u307F\u307E\u3059\uFF09", REST: "\u58F2\u5207\u308C\uFF08SOLD OUT\uFF09\u304B\u3089\u5728\u5EAB\u3042\u308A\u306B\u623B\u3063\u305F\u5546\u54C1\u3067\u3059\uFF08\u30AB\u30FC\u30C8\u89E3\u9664\u30FB\u65B0\u3057\u3044\u5165\u8377\u306E\u3069\u3061\u3089\u3082\u542B\u307F\u307E\u3059\uFF09", PRICE: "\u4E00\u89A7\u306B\u51FA\u3066\u3044\u308B\u6700\u5B89\u5024\uFF08\u72B6\u614B\u3054\u3068\uFF09\u304C\u4E0B\u304C\u308A\u307E\u3057\u305F\u3002\u5728\u5EAB\u306E\u5897\u6E1B\u3084\u5B89\u3044\u500B\u4F53\u306E\u8FFD\u52A0\u3067\u3082\u8D77\u304D\u308B\u305F\u3081\u3001\u540C\u3058\u5546\u54C1\u306E\u5024\u4E0B\u3052\u3068\u306F\u9650\u308A\u307E\u305B\u3093", STOCK: "\u4E00\u89A7\u306B\u51FA\u3066\u3044\u308B\u5728\u5EAB\u6570\u304C\u524D\u56DE\u3088\u308A\u5897\u3048\u307E\u3057\u305F", BACK: "SOLD OUT\uFF08\u307E\u305F\u306F\u5728\u5EAB\u6E1B\uFF09\u306B\u306A\u3063\u3066\u3044\u305F\u5546\u54C1\u304C\u623B\u3063\u3066\u304D\u307E\u3057\u305F\u3002\u30AB\u30FC\u30C8\u306B\u5165\u308C\u3089\u308C\u3066\u623B\u3063\u305F\u30FB\u5728\u5EAB\u306E\u79FB\u52D5\u304B\u3089\u623B\u3063\u305F\u3068\u8003\u3048\u3089\u308C\u307E\u3059\uFF08\u65B0\u3057\u3044\u5165\u8377\u3067\u306F\u3042\u308A\u307E\u305B\u3093\uFF09" }, U = { NEW: "#F31515", REST: "#18794E", BACK: "#18794E", PRICE: "#F2D98A", STOCK: "#003792" }, ut = ["NEW", "REST", "BACK", "PRICE", "STOCK"], w = () => Date.now(), Tt = Math.round(w() - performance.now()), We = document.title, N = (t) => String(t || "").replace(/\s+/g, " ").trim(), A = (t) => "\xA5" + Number(t).toLocaleString("ja-JP"), Nt = () => He.test(location.pathname), ne = (t) => Math.floor((t - 201e4) / 36e5), oe = (t) => t * 36e5 + 201e4;
    function pt(t, e) {
      for (let n = 0; n < 3; n++) for (const o of e) {
        const s = new Date(t);
        if (s.setDate(s.getDate() + n), s.setHours(o, 33, 30, 0), s.getTime() > t) return s.getTime();
      }
      return t + 864e5;
    }
    const se = (t) => pt(t, jt), Ve = (t) => ft(t, jt);
    // 4.10.113：印の「判定した回」の始まり（検出した時間の HH:33:30）。新着は初めて見た時刻（at）ではなくこれで数える。判定の記録が無い古い印は at のまま
    const roundAt = (ev) => (ev.period != null ? oe(ev.period) : ev.at);
    function ft(t, e) {
      for (let n = 0; n < 3; n++) for (const o of [...e].reverse()) {
        const s = new Date(t);
        if (s.setDate(s.getDate() - n), s.setHours(o, 33, 30, 0), s.getTime() <= t) return s.getTime();
      }
      return t - 864e5;
    }
    const mt = (t) => {
      const e = new Date(t);
      return `${e.getMonth() + 1}/${e.getDate()}`;
    }, ht = (t) => {
      if (!t) return "";
      const e = new Date(t), n = (o) => String(o).padStart(2, "0");
      return `${e.getFullYear()}/${n(e.getMonth() + 1)}/${n(e.getDate())} ${n(e.getHours())}:${n(e.getMinutes())}`;
    };
    // 4.10.128：時刻の文字は作り置きの書式で作る（toLocaleTimeString と同じ文字。毎回作ると1回0.1msほどかかり、描き直しで数百回呼ぶため）
    const TF = new Intl.DateTimeFormat("ja-JP", { hour12: false, hour: "2-digit", minute: "2-digit" });
    function T(t) {
      if (!t) return "\u2015";
      const e = new Date(t), n = TF.format(e);
      return e.toDateString() === new Date(w()).toDateString() ? n : `${e.getMonth() + 1}/${e.getDate()} ${n}`;
    }
    // 4.10.88：保存内容の読み直しを減らす。読むだけの場面は1.5秒の間、前に読んだ内容を使う。書く場面は必ず保存から読み直し、書いた時点で覚えたものを捨てる
    const EC = new Map(), ECT = 1500;
    // 4.10.359：重さの計測。JP RUSH の主な処理・保存の読み書きにかかった時間と、画面が止まった時間（0.05秒以上）を数える。［計測結果をコピー］で文字にする
    const PERF = { t0: Date.now(), f: new Map(), lt: [], ltN: 0, ltMs: 0, ltMax: 0 };
    const perfAdd = (k, ms) => { const e = PERF.f.get(k) || PERF.f.set(k, { n: 0, ms: 0, max: 0 }).get(k); e.n++, e.ms += ms, ms > e.max && (e.max = ms); };
    const PW = (k, fn) => function (...a) { const t = performance.now(); try { return fn.apply(this, a); } finally { perfAdd(k, performance.now() - t); } };
    try { new PerformanceObserver((l) => { for (const x of l.getEntries()) { PERF.ltN++, PERF.ltMs += x.duration, x.duration > PERF.ltMax && (PERF.ltMax = x.duration); PERF.lt.push([Math.round((Date.now() - PERF.t0) / 1e3), Math.round(x.duration)]), PERF.lt.length > 30 && PERF.lt.shift(); } }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
    // 4.10.361：同期のために「変わった記録」を覚えておく（g:＝Tampermonkey 側、i:＝別の保存場所）。同期では、これと前回送った分だけを読む。
    // 取りこぼしがあっても、1時間に1回は全部を比べ直すので、遅れても1時間以内に届く
    const SYD = new Set();
    let sydTm = 0;
    function syMark(k) { SYD.add(k), sydTm || (sydTm = setTimeout(syDirtyFlush, 5e3)); }
    function syDirtyFlush() {
      clearTimeout(sydTm), sydTm = 0;
      if (!SYD.size) return;
      try { const a = new Set(GM_getValue(Ct + "syncDirty", []) || []); for (const k of SYD) a.add(k); GM_setValue(Ct + "syncDirty", [...a]), SYD.clear(); } catch (e) {}
    }
    addEventListener("pagehide", () => { try { syDirtyFlush(); } catch (e) {} });
    function syDirtySnap() { syDirtyFlush(); try { return [...new Set(GM_getValue(Ct + "syncDirty", []) || [])]; } catch (e) { return []; } }
    function syDirtyClear(snap) { try { const x = new Set(snap); for (const k of x) SYD.delete(k); GM_setValue(Ct + "syncDirty", (GM_getValue(Ct + "syncDirty", []) || []).filter((k) => !x.has(k))); } catch (e) {} }
    // 4.10.361：自動再カートの記録は直近40件まで残す（計測結果に出す）。今までは最後の1件だけだった
    // 4.10.367：4.10.361〜366 は、ここが自分自身を呼び続けていた（置き換えの誤り）。記録のたびに何千回も書き込んで重く、自動再カートの邪魔をしていた
    function arLog(msg) { try { $("autoRecartLog", msg); const a = E("autoRecartHist", []) || []; a.push(msg), a.length > 300 && a.splice(0, a.length - 300), $("autoRecartHist", a);   /* 4.10.378：300件まで残す */ } catch (e) {} }
    // 見回り（20秒ごと）が実際に何秒あいたか。ブラウザに止められているかが分かる
    const TICKS = { last: 0, n: 0, gaps: [], max: 0, over60: 0 };
    function tickMark() { const t = Date.now(); if (TICKS.last) { const g = Math.round((t - TICKS.last) / 1e3); TICKS.gaps.push(g), TICKS.gaps.length > 30 && TICKS.gaps.shift(), g > TICKS.max && (TICKS.max = g), g > 60 && TICKS.over60++; } TICKS.last = t, TICKS.n++; }
    // 押した時だけ、別の保存場所の大きさも数える（全部を読むので少し時間がかかる）
    function perfReportFull() {
      const base = perfReport();
      if (!window.indexedDB) return Promise.resolve(base);
      return idbAllEntries().then((ents) => {
        const kb = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.round(n / 1024) + "KB";
        const a = ents.map(([k, v]) => { let n = 0; try { n = JSON.stringify(v).length; } catch (e) {} return [String(k).replace(Ct, ""), n]; }).sort((x, y) => y[1] - x[1]), tot = a.reduce((x, y) => x + y[1], 0);
        return base + `\n保存（別の保存場所）：${a.length}件・合計${kb(tot)}・大きい順：${a.slice(0, 15).map(([k, n]) => k + " " + kb(n)).join("・")}`;
      }).catch(() => base);
    }
    function perfReport() {
      const sec = Math.round((Date.now() - PERF.t0) / 1e3), rows = [...PERF.f.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 30).map(([k, e]) => `  ${k}：${e.n}回・合計${Math.round(e.ms)}ms・最大${Math.round(e.max)}ms`);
      let dom = 0, ifr = 0; try { dom = document.getElementsByTagName("*").length, ifr = document.querySelectorAll("iframe").length; } catch (e) {}
      let big = [];
      try { if (typeof GM_listValues === "function") big = GM_listValues().map((k) => { let n = 0; try { n = JSON.stringify(GM_getValue(k, null) || "").length; } catch (e) {} return [String(k).replace(Ct, ""), n]; }).sort((a, b) => b[1] - a[1]); } catch (e) {}
      const kb = (n) => n >= 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.round(n / 1024) + "KB", tot = big.reduce((a, x) => a + x[1], 0);
      const ar = (E("autoRecartHist", []) || []).slice(-30);
      return [`JP RUSH 重さの計測 v${typeof Jt !== "undefined" ? Jt : ""}（${location.pathname}・開いてから${sec}秒・${innerWidth}×${innerHeight}）`, `画面が止まった回数（0.05秒以上）：${PERF.ltN}回・合計${Math.round(PERF.ltMs)}ms・最長${Math.round(PERF.ltMax)}ms`, `最近の止まり（何秒目・長さms）：${PERF.lt.map((x) => x.join("s:")).join(" ")}`, `ページの部品の数：${dom}・見えない枠：${ifr}`, (() => { try { if (!cartPage()) return ""; const C = (E("cart", { codes: {} }) || {}).codes || {}, B = new Set([...document.querySelectorAll(".jprush-readd[data-code]")].map((x) => x.dataset.code)), miss = Object.keys(C).filter((c) => !B.has(c)); return `カートの商品 ${Object.keys(C).length}点・再カートのボタン ${B.size}個${miss.length ? "・ボタンが無い商品：" + miss.slice(0, 8).join("・") : ""}`; } catch (e) { return ""; } })(), "JP RUSH の処理（時間の多い順）：", ...rows, `自動再カート：${E("autoRecart", false) ? "ON" : "OFF"}・見回り${TICKS.n}回・あいた最長${TICKS.max}秒・1分以上あいた${TICKS.over60}回`, `見回りの間隔（秒・新しい順）：${TICKS.gaps.slice().reverse().join(" ")}`, "自動再カートの記録（新しい順）：", ...ar.slice().reverse().map((x) => "  " + x), `保存（Tampermonkey 側）：合計${kb(tot)}・大きい順：${big.slice(0, 12).map(([k, n]) => k + " " + kb(n)).join("・")}`].join("\n");
    }
    // 4.10.89：読んだ写しは1.5秒たったら捨てる（ページを開いている間ずっと持ち続けてメモリを増やさない）
    const ecPut = (k, v) => { const now = Date.now(); EC.set(k, { at: now, v }); setTimeout(() => { const x = EC.get(k); x && x.at === now && EC.delete(k); }, ECT); };
    // 4.10.128：写しを使う保存（検索の記録 s.〜・既読 seen・最後に在庫があった時の価格 lastlive）は、書いた中身をそのまま写しにする（書いた直後の読み直しを省く。中身は保存したものと同じ。1.5秒で捨てるのも同じ）
    const ecKey = (t) => t === "seen" || t === "lastlive" || t.startsWith("s.");
    // 4.10.176：完売記録（sold.〜）は1回の表示の間は一度読んだ写しを使い回す（中身は同じ。写しは複製して渡すので、書き換えても保存には影響しない）
    const isSoldKey = (t) => typeof t === "string" && t.startsWith("sold.");
    const Es = (t, e) => {
      const k = Ct + t, c = EC.get(k);
      // 4.10.186：完売記録の月ごとの記録は、別の保存場所から読んだ手元の写しを使う（複製して渡す）
      if (typeof RECMEM !== "undefined" && RECMEM.has(k)) { const m = RECMEM.get(k); return m && typeof m === "object" ? structuredClone(m) : m; }
      let v;
      if (c && Date.now() - c.at < ECT) v = c.v;
      else v = GM_getValue(k, e), ecPut(k, v);
      return v && typeof v === "object" ? structuredClone(v) : v;
    };
    // 4.10.181：検索の記録（s.〜）は、商品ページと画像のURLの共通部分（前と後ろ）を1回だけ保存して小さくする。読むときに元のURLへ完全に戻す
    const isRecKey = (t) => typeof t === "string" && t.startsWith("s.");
    const ZF = ["url", "img"];
    function zipRec(r) {
      if (!r || typeof r !== "object" || !r.items || r._zf) return r;
      const its = r.items, ids = Object.keys(its), zf = {};
      for (const f of ZF) {
        const vals = [];
        for (const id of ids) { const v = its[id] && its[id][f]; typeof v === "string" && vals.push(v); }
        if (vals.length < 2) continue;
        let pre = vals[0];
        for (const v of vals) { let i = 0; const m = Math.min(pre.length, v.length); while (i < m && pre.charCodeAt(i) === v.charCodeAt(i)) i++; pre = pre.slice(0, i); if (!pre) break; }
        let suf = vals[0].slice(pre.length);
        for (const v of vals) { const w = v.slice(pre.length); let i = 0; const m = Math.min(suf.length, w.length); while (i < m && suf.charCodeAt(suf.length - 1 - i) === w.charCodeAt(w.length - 1 - i)) i++; suf = suf.slice(suf.length - i); if (!suf) break; }
        if (pre.length + suf.length >= 8) zf[f] = [pre, suf];
      }
      if (!Object.keys(zf).length) return r;
      const out = {};
      for (const id of ids) {
        const it = its[id];
        if (!it || typeof it !== "object") { out[id] = it; continue; }
        let c = null;
        for (const f of Object.keys(zf)) { const v = it[f]; if (typeof v === "string") { c = c || { ...it }; c[f] = v.slice(zf[f][0].length, v.length - zf[f][1].length); } }
        out[id] = c || it;
      }
      return { ...r, items: out, _zf: zf };
    }
    function unzipRec(r) {
      if (!r || typeof r !== "object" || !r._zf || !r.items) return r;
      const zf = r._zf;
      delete r._zf;
      for (const it of Object.values(r.items)) if (it && typeof it === "object") for (const f of Object.keys(zf)) typeof it[f] === "string" && (it[f] = zf[f][0] + it[f] + zf[f][1]);
      return r;
    }
    // 4.10.182：検索の記録は Tampermonkey の保存に置かず、別の保存場所（IndexedDB）に置く。開いた時に一度だけ読み、手元の写し（RECMEM）を使う。保存は少し後でまとめて書く
    const RECMEM = new Map(), RECDIRTY = new Map();
    let recTimer = 0;
    // 4.10.185：lastlive（最後に在庫があった時の価格）も別の保存場所へ。タブ同士で上書きしないよう、書く時に保存側と合わせる
    // 4.10.186：完売記録（sold.年-月）も別の保存場所へ。書く時は、読み込んだ時との差（このタブで変えた分）だけを保存側に重ねる
    const isSoldMonth = (t) => /^sold\.\d{4}-\d{2}$/.test(t);
    const isMemKey = (t) => isRecKey(t) || t === "lastlive" || isSoldMonth(t);
    const SOLDBASE = new Map();
    let SOLDREADY = false, SOLDKEYS = [];
    const RECZF = new Map();
    function zfOf(r, hint) {
      if (!r || typeof r !== "object" || !r.items) return null;
      const its = Object.values(r.items);
      // 前回の共通部分がそのまま使えるなら使う（全部の値の前と後ろが一致するかだけ確かめる）
      if (hint && its.every((it) => !it || typeof it !== "object" || Object.keys(hint).every((f) => typeof it[f] !== "string" || it[f].length >= hint[f][0].length + hint[f][1].length && it[f].startsWith(hint[f][0]) && it[f].endsWith(hint[f][1])))) return hint;
      const z = zipRec({ items: r.items });
      return z && z._zf || null;
    }
    function recFlush() {
      clearTimeout(recTimer), recTimer = 0;
      if (!window.indexedDB || !RECDIRTY.size) return;
      const list = [...RECDIRTY];
      RECDIRTY.clear();
      for (const [k] of list) syMark("i:" + k), syMark("g:" + k);
      const back = () => { for (const [k, v] of list) { try { GM_setValue(k, isRecKey(String(k).slice(Ct.length)) ? zipRec(v) : v); } catch (e) {} } };
      idbOpen().then((db) => {
        const t0 = performance.now(), tx = db.transaction(IDB_STORE, "readwrite"), st = tx.objectStore(IDB_STORE);
        for (const [k, v] of list) {
          if (isSoldMonth(String(k).slice(Ct.length))) {
            const g = st.get(k), base = SOLDBASE.get(k) || {};
            g.onsuccess = () => {
              const cur = g.result && typeof g.result === "object" ? g.result : {}, out = { ...cur };
              for (const [ek, ev] of Object.entries(v || {})) (!(ek in base) || JSON.stringify(base[ek]) !== JSON.stringify(ev)) && (out[ek] = ev);
              for (const ek of Object.keys(base)) v && !(ek in v) && delete out[ek];
              st.put(out, k), SOLDBASE.set(k, structuredClone(out)), RECMEM.set(k, out);
            };
            continue;
          }
          if (k === Ct + "lastlive") {
            const g = st.get(k);
            g.onsuccess = () => {
              const cur = g.result && typeof g.result === "object" ? g.result : {};
              for (const [id, x] of Object.entries(v)) (!cur[id] || (cur[id].at || 0) <= (x.at || 0)) && (cur[id] = x);
              const ks = Object.keys(cur);
              ks.length > le && ks.sort((a, b) => cur[a].at - cur[b].at).slice(0, ks.length - le).forEach((a) => delete cur[a]);
              st.put(cur, k);
            };
            continue;
          }
          // 検索の記録：その場で短くして書き（書く時に写しが作られる）、すぐ元に戻す
          const zf = zfOf(v, RECZF.get(k));
          if (zf) {
            RECZF.set(k, zf);
            const its = Object.values(v.items), saved = [];
            try {
              for (const it of its) if (it && typeof it === "object") for (const f of Object.keys(zf)) typeof it[f] === "string" && (saved.push([it, f, it[f]]), it[f] = it[f].slice(zf[f][0].length, it[f].length - zf[f][1].length));
              v._zf = zf, st.put(v, k);
            } finally { delete v._zf; for (const [it, f, val] of saved) it[f] = val; }
          } else st.put(v, k);
        }
        PIO.write += performance.now() - t0;
        tx.oncomplete = () => { db.close(); for (const [k] of list) { try { GM_getValue(k, null) != null && GM_deleteValue(k); } catch (e) {} } };
        tx.onerror = tx.onabort = () => { db.close(), back(); };
      }).catch(back);
    }
    const GMget = (k, e) => { const t0 = performance.now(); try { return GMget0(k, e); } finally { perfAdd("読む " + String(k).replace(Ct, ""), performance.now() - t0); } };
    const GMget0 = (k, e) => {
      if (!isMemKey(String(k).slice(Ct.length))) return GM_getValue(k, e);
      if (RECMEM.has(k)) return RECMEM.get(k);
      if (!isRecKey(String(k).slice(Ct.length))) return GM_getValue(k, e);
      const t0 = performance.now(), v = unzipRec(GM_getValue(k, e));
      return PIO.read += performance.now() - t0, v;
    };
    const E = (t, e) => isSoldKey(t) ? Es(t, e) : GMget(Ct + t, e), $ = (t, e) => { EC.delete(Ct + t); syMark("g:" + Ct + t), syMark("i:" + Ct + t); if (isMemKey(t) && window.indexedDB && (isRecKey(t) || RECMEM.has(Ct + t) || isSoldMonth(t) && SOLDREADY)) { RECMEM.set(Ct + t, e), RECDIRTY.set(Ct + t, e), recTimer || (recTimer = setTimeout(recFlush, 400)), ecKey(t) && ecPut(Ct + t, e); return; } const t0 = performance.now(), r = GM_setValue(Ct + t, isRecKey(t) ? zipRec(e) : e); isRecKey(t) && (PIO.write += performance.now() - t0); perfAdd("書く " + t, performance.now() - t0); isSoldKey(t) ? ecPut(Ct + t, e && typeof e === "object" ? structuredClone(e) : e) : ecKey(t) && ecPut(Ct + t, e); return r; };
    // 4.10.176：検索画面では完売記録の全件を読まない（売切れ履歴・売切れ回数・完売記録の件数は、完売記録の画面で見る）
    const ST_EMPTY = { sum: {}, tent: {}, old: {}, byName: {}, recentCount: 0, tentCount: 0 };
    // 4.10.182：印の履歴を残す日数（以前は30日）。古い分は evq（待ち行列）→ 別の保存場所の ev.〜 へ
    const EV_KEEP = 7 * 864e5;
    function evQueue(recKey, evs) {
      try { const q = GM_getValue(Ct + "evq", {}) || {}; q[recKey] = (q[recKey] || []).concat(evs); GM_setValue(Ct + "evq", q), syMark("g:" + Ct + "evq"); } catch (e) {}
    }
    function evFlush() {
      if (!window.indexedDB) return;
      let q;
      try { q = GM_getValue(Ct + "evq", null); } catch (e) { q = null; }
      if (!q || !Object.keys(q).length) return;
      const keys = Object.keys(q);
      const next = () => {
        const rk = keys.shift();
        if (!rk) return;
        const add = q[rk] || [], ik = "ev." + rk;
        return idbGet(ik).then((cur) => {
          const have = Array.isArray(cur) ? cur : [], seen = new Set(have.map((u) => u.item + "|" + u.type + "|" + u.at));
          for (const u of add) { const z = u.item + "|" + u.type + "|" + u.at; seen.has(z) || (seen.add(z), have.push(u)); }
          return idbPut(ik, have);
        }).then(() => {
          // 書き込めた分だけ待ち行列から外す（その間に増えた分は残す）
          const nq = GM_getValue(Ct + "evq", {}) || {}, left = (nq[rk] || []).slice(add.length);
          left.length ? (nq[rk] = left) : delete nq[rk];
          Object.keys(nq).length ? GM_setValue(Ct + "evq", nq) : GM_deleteValue(Ct + "evq"), syMark("g:" + Ct + "evq");
        }).catch(() => {}).then(next);
      };
      next();
    }
    // 4.10.182：処理の時間の内訳（検索の記録を読む・保存するのにかかった時間）
    const PIO = { read: 0, write: 0 };
    // 4.10.267：スマホで一覧が出ない原因を調べるための記録（どこまで進んだか・起きたエラー）。表示だけに使う
    const DIAG = { steps: {}, errs: [] };
    const derr = (where, e) => { DIAG.errs.length < 20 && DIAG.errs.push(where + ": " + (e && e.message || e) + " | " + String(e && e.stack || "").split("\n").slice(0, 3).join(" / ")); };
    const dstep = (name, fn) => { DIAG.steps[name] = "始"; try { const r = fn(); DIAG.steps[name] = "済"; return r; } catch (e) { DIAG.steps[name] = "失敗"; derr(name, e); throw e; } };
    try { window.addEventListener("error", (ev) => derr("window", ev.error || ev.message)); window.addEventListener("unhandledrejection", (ev) => derr("promise", ev.reason)); } catch (e) {}
    const Er = (t, e) => { const k = Ct + t, c = EC.get(k); if (c && Date.now() - c.at < ECT) return c.v; const v = GMget(k, e); ecPut(k, v); return v; };
    // 4.10.128：既読を読むだけの場面（描き直し・一覧・印へ移動）は写しで読む。書く場面（yt）は今まで通り保存から読む
    const rtR = () => Er("seen", {});
    // 4.10.77〜：自分のカート。カートページを開いたときに読んだ個体番号（SRCODE）を保存する。「🛒 カート内」の印は初めて見てから最大60分（保持期限の目安）
    // 4.10.453：補助の仕組みをまとめて止めた（働き手の再カートだけで動くかを確かめる）。機能しないと分かった物は true に戻す
    const AUX = { watch: false, guard: false, recover: false, screenRecart: false, stuckReload: false };
    const CART_HOLD = 60 * 6e4, cartPage = () => /^\/sale\/cart\/?$/.test(location.pathname), srOf = (u) => { const m = /[?&]SRCODE=(\d+)/.exec(String(u || "")); return m ? m[1] : ""; };
    // 4.10.343：カートへの通信には20秒の時間切れ（PCのスリープなどで返事が来ないまま固まり、自動再カートや見張りが全部止まっていた）
    // 4.10.414：じゃんぱらの「カートに入れる」は、2026-11-20 から ITMCODE・ITMNAME・MKRNAME・CLSNAME も送るようになった（JP RUSH は送っておらず、入らなくなった）
    //          商品ページで見たフォームの中身を商品ごとに覚えておき、カートに入れる時は必ず足す
    const ADD_META = ["ITMCODE", "ITMNAME", "MKRNAME", "CLSNAME"];
    function addMetaHarvest(doc) {
      try {
        const forms = [...(doc || document).querySelectorAll('form[action*="cart/add"]')]; if (!forms.length) return;
        const M = E("addMeta", {}) || {}; let ch = false;
        for (const f of forms) {
          const g = (n) => { const x = f.querySelector('[name="' + n + '"]'); return x ? String(x.getAttribute("value") || x.value || "") : ""; };
          const c = g("SRCODE"); if (!/^\d{6,10}$/.test(c)) continue;
          const o = {}; for (const k of ADD_META) { const v = g(k); v && (o[k] = v); }
          if (!o.ITMNAME) continue;   // 4.10.415：ITMCODE は無い商品もある（型番の登録が無い物）。ITMNAME があればフォームの中身として覚える
          o.at = w(), M[c] = o, ch = true;
        }
        if (ch) { const ks = Object.keys(M); if (ks.length > 1500) { ks.sort((a, b) => (M[a].at || 0) - (M[b].at || 0)); for (const k of ks.slice(0, ks.length - 1500)) delete M[k]; } $("addMeta", M); window.__jprAM = { at: Date.now(), M }; }
      } catch (e) {}
    }
    // 4.10.424：自分のカートにある物は商品ページにボタンが出ず、新しい項目（商品名・メーカー・分類）が取れない。
    //          カートに出ている名前から作った項目で入るかを、一度だけ安全な物（カートに無い取りこぼし）で試し、入るならそれを使う
    function guessMeta(name) {
      const n = N(String(name || "")), sp = n.indexOf(" ");
      return sp > 0 ? { MKRNAME: n.slice(0, sp), ITMNAME: n.slice(sp + 1), CLSNAME: "" } : { MKRNAME: "", ITMNAME: n, CLSNAME: "" };
    }
    function withMeta(code, body) {
      try {
        if (!window.__jprAM || Date.now() - window.__jprAM.at > 5e3) window.__jprAM = { at: Date.now(), M: E("addMeta", {}) || {} };   // 4.10.430：5秒は読み直さない（10分で5千回読んでいた）
        const b = body instanceof URLSearchParams ? body : new URLSearchParams(String(body || "")), o = window.__jprAM.M[String(code)];
        if (o) for (const k of ADD_META) o[k] && !b.get(k) && b.set(k, o[k]);
        // 4.10.424：覚えていない時は、名前から作った項目で入ると確かめられていれば、それを使う
        if (!b.get("ITMNAME")) { try { { if (!window.__jprNm || Date.now() - window.__jprNm.at > 1e4) window.__jprNm = { at: Date.now(), C: (E("cart", { codes: {} }) || {}).codes || {}, H: E("cartHist", {}) || {} }; const C = window.__jprNm.C, H = window.__jprNm.H, nm = (C[code] && C[code].name) || (H[code] && H[code].name) || ""; if (nm) { const g = guessMeta(nm); for (const k of ["ITMNAME", "MKRNAME", "CLSNAME"]) b.has(k) || b.set(k, g[k]); } } } catch (e) {} }
        // じゃんぱらと同じ並び（SRCODE, SHPCODE, PRICE, REDIRECT, ITMCODE, ITMNAME, MKRNAME, CLSNAME, QTY）
        const ord = ["SRCODE", "SHPCODE", "PRICE", "REDIRECT", ...ADD_META, "QTY"], out = new URLSearchParams();
        for (const k of ord) b.has(k) && out.set(k, b.get(k));
        for (const [k, v] of b) out.has(k) || out.append(k, v);
        return out;
      } catch (e) { return body instanceof URLSearchParams ? body : new URLSearchParams(String(body || "")); }
    }
    // 4.10.440：通信の記録（動きは変えない）。カートへの返事・カートの読み取りの結果を、1分ごとに「自動再カートの記録」へ一行で出す
    const DG = { add: {}, read: {} };
    const cfetch = (u, o = {}) => { const ac = new AbortController(), { timeout, ...oo } = o; setTimeout(() => ac.abort(), timeout || 2e4); // 4.10.442：ブレーキ。カートへの追加が403・503で拒否されたら、10分はこの画面からカートへの追加を一切送らない（拒否が長引かないように）
      { const us0 = String(u); if (/\/sale\/cart\/add\//.test(us0) && /post/i.test(oo.method || "")) { let bu = 0; try { bu = +localStorage.getItem("jprAddBrake") || 0; } catch (e) {} if (Date.now() < bu && !oo.noBrake) { DG.add["ブレーキ中で送らず"] = (DG.add["ブレーキ中で送らず"] || 0) + 1; return Promise.reject(new Error("ブレーキ中（じゃんぱらに拒否されたため10分止めている）")); } } }
      const p = fetch(u, { ...oo, signal: ac.signal });
      try {
        const us = String(u), isAdd = /\/sale\/cart\/add\//.test(us) && /post/i.test(oo.method || ""), isRead = /\/sale\/cart\/?$/.test(us.split("?")[0]);
        if (isAdd) p.then((r) => { const k = r.type === "opaqueredirect" ? "転送" : String(r.status); DG.add[k] = (DG.add[k] || 0) + 1;
          if ((k === "403" || k === "503") && !oo.noBrakeSet) { try { if (!(+localStorage.getItem("jprAddBrake") > Date.now())) { localStorage.setItem("jprAddBrake", String(Date.now() + 6e5)); arLog(`${T(w())} じゃんぱらが追加を拒否（${k}）→ 10分はカートへの追加を止める`); } } catch (e) {} }
          if (k !== "転送" && (DG.n = (DG.n || 0) + 1) <= 3) r.clone().text().then((tx) => { const sn = String(tx || "").replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160); arLog(`${T(w())} カートへ ${k} の中身：送った「${String(oo.body || "").slice(0, 260)}」／返事「${sn || "空"}」`); }).catch(() => {}); }, (e) => { const k = e && e.name === "AbortError" ? "時間切れ" : "通信エラー"; DG.add[k] = (DG.add[k] || 0) + 1; });
        else if (isRead) p.then((r) => { const k = String(r.status); DG.read[k] = (DG.read[k] || 0) + 1; }, () => { DG.read["通信エラー"] = (DG.read["通信エラー"] || 0) + 1; });
      } catch (e) {}
      // 4.10.452：じゃんぱらの混雑（503）以外のエラーは「⚠要報告」として記録に残す（混雑は仕方ないので残さない）
      try { const us2 = String(u); if (!/^\/|^https:\/\/www\.janpara\.co\.jp\//.test(us2)) return p; p.then((r) => { const k = r.type === "opaqueredirect" ? 0 : r.status; if (k >= 400 && k !== 503) jpReport(us2, k); }, (e) => jpReport(us2, e && e.name === "AbortError" ? "時間切れ" : "通信エラー", e && e.message)); } catch (e) {}
      return p; };
    function jpReport(u, k, msg) { try { const path = String(u).replace(/^https?:\/\/[^/]+/, "").split("&")[0].slice(0, 60), key = path + "|" + k, t = Date.now(); if (jpReport.at && jpReport.at[key] && t - jpReport.at[key] < 3e4) return; (jpReport.at = jpReport.at || {})[key] = t; arLog(`${T(t)} ⚠要報告：${path}（${k}）${msg ? String(msg).slice(0, 60) : ""}`); } catch (e) {} }
    setInterval(() => { try { const a = Object.entries(DG.add), b = Object.entries(DG.read); if (a.length || b.length) { arLog(`${T(w())} 通信の記録（この1分）：カートへ ${a.map(([k, n]) => k + "×" + n).join("・") || "なし"}／カートを読む ${b.map(([k, n]) => k + "×" + n).join("・") || "なし"}`); DG.add = {}, DG.read = {}, DG.n = 0; } } catch (e) {} }, 6e4);
    // ===== 4.10.334：商品台帳 =====
    // 見つけた商品の情報を、商品番号（SRCODE）ごとに1台ずつためる。検索記録とは別の保存場所（IndexedDB「jpRushLedger」）。
    // 書き込みはためておいて10秒おき・ページを離れる時にまとめて。同期・バックアップには入れない。90日見かけない台は1日1回少しずつ消す。
    // 1台の形（v:1）：{ v, sr, name, shop, url, img, itm, price, prices:[[時刻,価格]]（20回まで）, st, stAt, firstAt, lastAt, src:{list,cart,detail,watch}, ext:{} }
    //   あとから足す情報は ext に入れる（形を変える時は v を上げる）
    // 索引（idx）：「itm.型番番号」→{ v, srs:[…], name, url, price, stock, soldOut, lastAt }、「url.リンク」→{ sr, at }
    const LG_DB = "jpRushLedger", LG_KEEP = 90 * 864e5, LG_Q = new Map();
    let lgTm = 0;
    function lgOpen() {
      return new Promise((res, rej) => {
        const r = indexedDB.open(LG_DB, 1);
        r.onupgradeneeded = () => { const d = r.result; d.objectStoreNames.contains("item") || d.createObjectStore("item"); d.objectStoreNames.contains("idx") || d.createObjectStore("idx"); };
        r.onsuccess = () => res(r.result), r.onerror = () => rej(r.error);
      });
    }
    function lgPatch(store, key, fn) {
      if (!window.indexedDB || !key) return;
      const k = store + "\u0000" + key, a = LG_Q.get(k) || [];
      a.push(fn), LG_Q.set(k, a), lgTm || (lgTm = setTimeout(lgFlush, 1e4));
    }
    function lgFlush() {
      clearTimeout(lgTm), lgTm = 0;
      if (!LG_Q.size) return Promise.resolve();
      const q = [...LG_Q]; LG_Q.clear();
      return lgOpen().then((db) => new Promise((res) => {
        const tx = db.transaction(["item", "idx"], "readwrite");
        for (const [k, fns] of q) {
          const [st, key] = k.split("\u0000"), os = tx.objectStore(st), g = os.get(key);
          g.onsuccess = () => { let v = g.result || null; for (const fn of fns) { try { v = fn(v) || v; } catch (e) {} } v && os.put(v, key); };
        }
        tx.oncomplete = tx.onerror = tx.onabort = () => { db.close(), res(); };
      })).catch(() => {});
    }
    addEventListener("pagehide", () => { lgFlush(); }), document.addEventListener("visibilitychange", () => { document.visibilityState === "hidden" && lgFlush(); });
    const lgUrlKey = (u) => { try { const x = new URL(u, location.origin); x.hash = ""; for (const k of [...x.searchParams.keys()]) /^(cache_key|ga4_.*|PAGE|LINE)$/i.test(k) && x.searchParams.delete(k); return x.pathname + x.search; } catch (e) { return ""; } };
    // 1台分を書き足す（o：name, shop, url, img, itm, price, st。src：どこで見たか）
    function lgItem(sr, o, src) {
      sr = String(sr || "");
      if (!/^\d{5,18}$/.test(sr)) return;
      const t = w();
      // 4.10.348：前の版の記録から移す時（src "old"）は、無い項目だけ埋める（価格・状態・最後に見た時刻は上書きしない）
      if (src === "old") {
        lgPatch("item", sr, (v) => {
          const at = o.at || t;
          v = v && v.v ? v : { v: 1, sr, firstAt: at, lastAt: at, prices: [], src: {}, ext: {} };
          for (const k of ["name", "shop"]) o[k] && !v[k] && (v[k] = o[k]);
          o.cond && !v.cond && (v.cond = { ...o.cond, at });
          v.src.old = t;
          return v;
        });
        return;
      }
      lgPatch("item", sr, (v) => {
        v = v && v.v ? v : { v: 1, sr, firstAt: t, prices: [], src: {}, ext: {} };
        v.lastAt = t;
        for (const k of ["name", "shop", "url", "itm"]) o[k] && (v[k] = o[k]);
        o.img && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(o.img) && (v.img = o.img);
        // 4.10.347：状態コメント（ランク・状態・付属品・保証・備考・スペック・札）。中身のある項目だけ上書きし、取った時刻を付ける
        if (o.cond) { const c = { ...(v.cond || {}) }; let any = false; for (const [k, x] of Object.entries(o.cond)) if (x && (!Array.isArray(x) || x.length)) c[k] = x, any = true; any && (c.at = t, v.cond = c); }
        const p = Number(String(o.price || "").replace(/[^\d]/g, "")) || 0;   // 4.10.348：「¥29,980」のような文字でも読む
        if (p > 0 && p !== v.price) { v.price = p, v.prices.push([t, p]); v.prices.length > 20 && v.prices.splice(0, v.prices.length - 20); }
        if (o.st && o.st !== v.st) v.st = o.st, v.stAt = t;
        src && (v.src[src] = t);
        return v;
      });
      o.st && histStNote(sr, o.st);
      o.itm && lgPatch("idx", "itm." + o.itm, (v) => { v = v || { v: 1, srs: [] }; v.srs.includes(sr) || v.srs.push(sr); v.srs.length > 200 && v.srs.splice(0, v.srs.length - 200); v.lastAt = t; return v; });
      o.url && srOf(o.url) !== sr && lgUrl(o.url, sr);
    }
    // 4.10.335：台帳に「完売」「在庫あり」などが入ったら、カート履歴のその台にも完売の印を付け外しする（2秒ためて1回で）
    const histStQ = new Map();
    let histStTm = 0;
    function histStNote(sr, st) {
      histStQ.set(sr, st);
      histStTm || (histStTm = setTimeout(() => {
        histStTm = 0;
        try {
          const h = E("cartHist", {}) || {}, t = w();
          let ch = false;
          for (const [c, x] of histStQ) { const v = h[c]; if (!v) continue; if (x === "sold" && !v.sold) v.sold = t, v.markAt = Math.max(v.markAt || 0, t), ch = true; else if (x !== "sold" && v.sold) delete v.sold, v.markAt = Math.max(v.markAt || 0, t), ch = true; }
          histStQ.clear(), ch && $("cartHist", h);
        } catch (e) {}
      }, 2e3));
    }
    // 4.10.347：商品ページを読んだ時（自分で開いた・カートのコピー・完売チェック・見張り・在庫確認）は、必ず状態コメントを台帳へ
    function lgCond(sr, du, u, extra, src) {
      try {
        if (!sr || !(du || u)) return;
        const dash = (x) => !x || /^[-－―ー‐\s]*$/.test(String(x));
        const notes = ((du && du.lines && du.lines.length ? du.lines : u && u.notes) || []).map((x) => N(x)).filter((x) => x && x.length <= 200 && !/会員ページ|商品カテゴリー|メニュー|ログイン|カートを見る/.test(x)).slice(0, 8);
        const specs = ((u && u.specs) || []).filter((p) => p && !dash(p[1])).slice(0, 20).map(([a, b]) => [N(a), N(b)]);
        lgItem(sr, { cond: { cond: du && du.cond || "", rank: du && du.rank || "", acc: du && du.acc || "", grt: du && du.grt || "", badges: u && recBadgeOk(u.badges) ? u.badges : "", notes, specs }, ...(extra || {}) }, src || "page");
      } catch (e) {}
    }
    function lgUrl(url, sr) { const k = lgUrlKey(url), t = w(); k && sr && lgPatch("idx", "url." + k, () => ({ sr: String(sr), at: t })); }
    // 型番ページ（ITMCODE）の一覧の見え方
    function lgItm(itm, o) {
      const t = w();
      lgPatch("idx", "itm." + itm, (v) => { v = v || { v: 1, srs: [] }; for (const k of ["name", "url"]) o[k] && (v[k] = o[k]); "price" in o && (v.price = o.price); "stock" in o && (v.stock = o.stock); "soldOut" in o && (v.soldOut = o.soldOut); o.guessSr && (v.guessSr = { sr: o.guessSr, at: t }); v.lastAt = t; return v; });
    }
    // 読む（必要な時だけ）
    function lgGet(store, key) { return window.indexedDB ? lgOpen().then((db) => new Promise((res) => { const tx = db.transaction(store, "readonly"), g = tx.objectStore(store).get(key); tx.oncomplete = () => { db.close(), res(g.result || null); }; tx.onerror = tx.onabort = () => { db.close(), res(null); }; })).catch(() => null) : Promise.resolve(null); }
    // 4.10.346：何台かまとめて1回で読む
    function lgMany(codes) {
      if (!window.indexedDB || !codes.length) return Promise.resolve(new Map());
      return lgOpen().then((db) => new Promise((res) => {
        const m = new Map(), tx = db.transaction("item", "readonly"), os = tx.objectStore("item");
        for (const c of codes) { const g = os.get(String(c)); g.onsuccess = () => { g.result && m.set(String(c), g.result); }; }
        tx.oncomplete = () => { db.close(), res(m); }; tx.onerror = tx.onabort = () => { db.close(), res(m); };
      })).catch(() => new Map());
    }
    const lgGetItem = (sr) => lgGet("item", String(sr)), lgFindUrl = (url) => lgGet("idx", "url." + lgUrlKey(url));
    // 90日見かけない台を消す（1日1回、1回に500件まで）
    function lgPrune() {
      if (!window.indexedDB) return;
      const t = w();
      if (t - (E("lgPruneAt", 0) || 0) < 864e5) return;
      $("lgPruneAt", t);
      lgOpen().then((db) => {
        const tx = db.transaction(["item", "idx"], "readwrite");
        let n = 0;
        for (const st of ["item", "idx"]) {
          const c = tx.objectStore(st).openCursor();
          c.onsuccess = () => { const cur = c.result; if (!cur || n >= 500) return; const v = cur.value || {}; t - (v.lastAt || v.at || 0) > LG_KEEP && (cur.delete(), n++); cur.continue(); };
        }
        tx.oncomplete = tx.onerror = tx.onabort = () => db.close();
      }).catch(() => {});
    }
    setTimeout(lgPrune, 3e4);
    // 4.10.348：前の版で開いた商品ページの記録（状態・備考・スペック）を、1回だけ台帳へ移す。
    // 検索の邪魔をしないよう、毎時28〜47分は避け、手が空いた時に100件ずつ
    function lgBackfill() {
      try {
        if (!window.indexedDB || E("lgBackfillV", 0) >= 1) return;
        const mi = new Date().getMinutes();
        if (mi >= 28 && mi <= 47) return;
        const DS = dload(), recs = Object.values((DS && DS.recs) || {});
        let i = 0;
        const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
        const step = () => {
          const end = Math.min(i + 100, recs.length);
          for (; i < end; i++) {
            const r = recs[i] || {};
            for (const u of r.units || []) /^\d{5,18}$/.test(String(u.code || "")) && (u.badges || (u.notes || []).length || (u.specs || []).length) && lgCond(u.code, null, u, { name: r.title || "", shop: u.store || "", at: u.at || r.at || 0 }, "old");
          }
          i < recs.length ? idle(step, { timeout: 3e3 }) : (lgFlush(), $("lgBackfillV", 1), console.info("[JP RUSH] 台帳：前の記録を移しました", recs.length));
        };
        idle(step, { timeout: 3e3 });
      } catch (e) {}
    }
    setTimeout(lgBackfill, 2e4);
    try { window.jprushLedger = { get: lgGetItem, url: lgFindUrl, itm: (x) => lgGet("idx", "itm." + x), flush: lgFlush }; } catch (e) {}
    function ownCartSet(t) {
      const c = E("cart", { codes: {} }), s = new Set();
      for (const [k, v] of Object.entries(c.codes || {})) if (v && v.firstSeen && t - v.firstSeen < CART_HOLD) s.add(k);
      return s;
    }
    // 4.10.143：カートのページを上から順に読んで「店舗 → 商品 → 金額 → 送料 → 合計 → 総合計」に分ける。
    // PC版とスマホ版で表の形は違うが、上からの並びは同じなので、表の形には頼らない。
    // 総合計より前の商品だけを「カートに入っている」とする（期限切れで消えた商品は総合計の後ろ。言い方の違いに左右されない）
    // 4.10.358：見出しは一度見つけたら覚えておく（毎回ページ全体を読むと重い）
    let cartHeadC = null;
    function cartHead() {
      if (cartHeadC && cartHeadC.isConnected) return cartHeadC;
      const r = cartHeadFind();
      r && (cartHeadC = r);
      return r;
    }
    function cartHeadFind() {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const el = n.parentElement;
        if (!el || !/^\s*ショッピングカート/.test(n.nodeValue) || el.closest(".jprush-cartbar") || !el.getClientRects().length) continue;
        // 4.10.145：見出しの帯全体まで上がる（「ショッピングカート SHOPPING CART」のように中が分かれていても、帯の箱を取る）。カートの表まで含む大きな箱では止める
        let h = el;
        while (h.parentElement && h.parentElement !== document.body) {
          const pt = N(h.parentElement.textContent);
          if (!/^ショッピングカート/.test(pt) || pt.length > 60) break;
          h = h.parentElement;
        }
        return h;
      }
      // 4.10.241：スマホ版の見出し（文字が1字ずつ分かれている・画像になっている）。空白を除いて「ショッピングカート」で始まり、画面の幅の半分以上ある一番小さい箱
      let best = null, ba = Infinity;
      for (const e of document.querySelectorAll("h1,h2,h3,h4,div,p,span,img")) {
        if (e.closest("#jp3-host,#jp3-cart,.jprush-cartbar,.jprush-cartph,.jprush-cartfloat")) continue;
        const t = (e.tagName === "IMG" ? e.getAttribute("alt") || "" : e.textContent || "").replace(/\s/g, "");
        if (!/^ショッピングカート/.test(t) || t.length > 40) continue;
        const r = e.getBoundingClientRect();
        if (r.width < window.innerWidth * 0.5 || r.height < 16) continue;
        r.width * r.height < ba && (ba = r.width * r.height, best = e);
      }
      return best;
    }
    // 4.10.364：1秒の間は前の読み取りを使う（開いた直後に何度も同じページを読んでいた）
    let cpC = { at: 0, v: null };
    function cartParse() { const t = performance.now(); if (cpC.v && t - cpC.at < 1e3) return cpC.v; cpC = { at: t, v: cartParse0() }; return cpC.v; }
    function cartParse0() {
      const body = document.body, head = cartHead(), items = [], expired = [], stores = new Map();
      let started = !head, afterTotal = false, expMark = false, rec = false, mode = "", cur = null, store = "", grand = null;
      // おすすめ・閲覧履歴などの商品はカートではない（見出しが出たら、次の店舗名まで商品リンクを数えない）
      const REC = /おすすめ|オススメ|閲覧履歴|最近チェック|チェックした商品|最近見た|この商品を見た人|関連商品|人気商品|ランキング/;
      const money = (s) => (String(s).match(/[¥￥]\s?[\d,]+/g) || []).map((x) => Number(x.replace(/[^\d]/g, "")));
      const st = (name) => (stores.has(name) || stores.set(name, { name, ship: null, sub: null, n: 0 }), stores.get(name));
      const link = (a) => {
        const code = srOf(a.getAttribute("href")), name = N(a.textContent);
        if (!started || !code || rec) return;
        if (afterTotal) {
          expMark && !expired.some((x) => x.code === code) && expired.push({ code, name, url: a.href });
          return;
        }
        if (!store) return;   // 店舗名より前の商品リンクはカートの商品ではない
        if (cur && cur.code === code) {
          name.length > cur.name.length && (cur.name = name);
          return;
        }
        const ex = items.find((x) => x.code === code);
        if (ex) {
          cur = ex, mode = "item";
          return;
        }
        cur = { code, name, url: a.href, store, amts: [], qty: null }, items.push(cur), st(store).n += 1, mode = "item";
      };
      const text = (t) => {
        if (!t || !started) return;
        const m = money(t);
        if (REC.test(t) && t.length <= 40) {
          rec = true, mode = "", cur = null;
          return;
        }
        if (afterTotal) {
          mode === "total" && grand == null && m.length && (grand = m[0], mode = "");
          /期限切れ|有効期限|削除されました|削除しました/.test(t) && (expMark = true);
          return;
        }
        if (/総合計/.test(t)) {
          afterTotal = true, mode = "total", cur = null;
          m.length && (grand = m[0], mode = "");
          return;
        }
        if (!m.length && /^\S{1,24}店$/.test(t)) {
          store = t, st(store), mode = "", cur = null, rec = false;
          return;
        }
        if (/^送料/.test(t)) {
          mode = "ship", m.length && st(store).ship == null && (st(store).ship = m[0], mode = "");
          return;
        }
        if (/^合計/.test(t)) {
          mode = "sub", m.length && (st(store).sub = m[0], mode = "");
          return;
        }
        if (mode === "item" && cur) {
          const q = t.match(/^(\d+)\s*個$/);
          q && (cur.qty = Number(q[1])), cur.amts.push(...m);
          return;
        }
        if (mode === "ship" && m.length) {
          st(store).ship == null && (st(store).ship = m[0]), mode = "";
          return;
        }
        mode === "sub" && m.length && (st(store).sub = m[0], mode = "");
      };
      const visit = (node) => {
        if (node.nodeType === 3) return text(N(node.nodeValue));
        if (node.nodeType !== 1) return;
        const tag = node.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SELECT|OPTION|IFRAME)$/.test(tag) || (node.id || "").startsWith("jp3-") || node.classList.contains("jprush-cartbar") || node.classList.contains("jprush-exs") || node.classList.contains("jprush-exchk") || node.classList.contains("jprush-excopy") || node.classList.contains("jprush-otm")) return;
        const cs = getComputedStyle(node);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        if (node === head) started = true;
        if (tag === "A" && /[?&]SRCODE=\d+/.test(node.getAttribute("href") || "")) return link(node);
        for (const ch of node.childNodes) visit(ch);
      };
      body && visit(body);
      // 金額が一つも無い商品リンクはカートの行ではない（数えない）
      for (let i = items.length - 1; i >= 0; i--) if (!items[i].amts.length) stores.get(items[i].store).n -= 1, items.splice(i, 1);
      return { items, expired, stores: [...stores.values()].filter((s) => s.n > 0), grand, head };
    }
    // 4.10.309：カート履歴。カートの画面を開くたびに、入っている商品を覚える（7日・300件まで）。消えた商品には消えたと気づいた時刻を付ける
    const HIST_DAYS = 7 * 864e5;
    // 4.10.321：カート履歴を同期するので、どの端末のカートの記録かを分ける印（この端末で1回だけ作る。同期・バックアップには入れない）
    // 4.10.399：端末の印は、じゃんぱらのページ側の保存（localStorage）を正とする。Tampermonkey の保存をまるごと別の端末に写すと印まで同じになり、
    //          PCとタブレットがお互いのカートの商品を「自分の物」と思って入れ直そうとしていた
    const devId = () => {
      if (devId.v) return devId.v;
      let d = "";
      try { d = localStorage.getItem("jprDevId") || ""; } catch (e) {}
      if (!d) { d = Math.random().toString(36).slice(2, 10); try { localStorage.setItem("jprDevId", d); } catch (e) {} }
      if (E("devId", "") !== d) $("devId", d);
      return (devId.v = d);
    };
    function histUpdate(codes, now) {
      try {
        const h = E("cartHist", {}) || {}, me = devId();
        for (const [c, v] of Object.entries(codes)) {
          const o = h[c] && !h[c].goneAt ? h[c] : {};
          h[c] = { name: v.name, price: v.price, store: v.store, url: v.url, addAt: v.firstSeen || o.addAt || now, seen: now, dev: me };
        }
        // 消えた印は、この端末のカートの記録にだけ付ける（ほかの端末のカートの中身はこの端末からは見えない）
        for (const [c, v] of Object.entries(h)) if (!codes[c] && !v.goneAt && (!v.dev || v.dev === me)) v.goneAt = now;
        const keep = Object.entries(h).filter(([, v]) => now - (v.seen || v.addAt || 0) < HIST_DAYS).sort((x, y) => (y[1].addAt || 0) - (x[1].addAt || 0)).slice(0, 300);
        $("cartHist", Object.fromEntries(keep));
      } catch (e) {}
    }
    // 4.10.311：履歴の行を作る（真ん中の窓・タブレットの左の欄で共通）
    // 4.10.329：見張りの状態（見張り中の行・終わった行）
    function histWatchNote(code, W0, D0) {
      const W = (W0 || E("cartWatch", {}) || {})[code], D = (D0 || E("cartWatchDone", {}) || {})[code];
      return W ? [`見張り中：${W.st || ""}`] : D ? [D.st] : [];
    }
    // 4.10.335：自分で［削除］を押した商品に「削除」マーク（各行の左のボタンで付け外し。記録に残る）。まとめての再カートは「マーク以外」
    // 4.10.402：［削除］を押した印は、ページ側の保存（localStorage・すぐ書ける）にも残す。押してすぐページが移ると、
    //          スマホ・タブレットでは Tampermonkey 側の保存が間に合わず印が消え、消した商品を「消えた」とみて戻していた
    const lsMarks = (k) => { try { const o = JSON.parse(localStorage.getItem(k) || "{}") || {}, t = Date.now(); for (const c of Object.keys(o)) t - o[c] > 864e5 && delete o[c]; return o; } catch (e) { return {}; } };
    const lsMarkPut = (k, codes) => { try { const o = lsMarks(k), t = Date.now(); for (const c of codes) o[c] = t; localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };
    const lsMarkDel = (c) => { for (const k of ["jprDelMarks", "jprDelAll"]) try { const o = lsMarks(k); if (o[c]) delete o[c], localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };
    const delMarkPut = (code) => lsMarkPut("jprDelMarks", [code]);
    // 自分で消した印（［削除］＝履歴にも印、［カート全削除］＝印は付けず、戻さないだけ）
    const delMarks = () => ({ ...lsMarks("jprDelAll"), ...lsMarks("jprDelMarks") });
    // 開いた時に、ページ側に残っている印を履歴に写す
    function delMarksApply() {
      try {
        const o = lsMarks("jprDelMarks"), ks = Object.keys(o); if (!ks.length) return;
        const h = E("cartHist", {}) || {}, B = E("rcBook", {}) || {}; let ch = false, cb = false;
        for (const c of ks) { if (h[c] && !(h[c].markAt >= o[c])) h[c].mark = true, h[c].markAt = o[c], ch = true; if (B[c]) delete B[c], cb = true; }
        ch && $("cartHist", h), cb && $("rcBook", B);
      } catch (e) {}
    }
    function histMark(code, on) {
      try { const h = E("cartHist", {}) || {}; if (!h[code]) { if (!on) return; const v = ((E("cart", { codes: {} }) || {}).codes || {})[code] || {}; h[code] = { name: v.name || "", price: v.price, store: v.store, url: v.url, addAt: v.firstSeen || w(), seen: w(), dev: devId() }; } h[code].mark = !!on, h[code].markAt = w(), $("cartHist", h); } catch (e) {}   // 4.10.401：履歴に無くても印を付ける
    }
    // 4.10.335：リンクで飛んで戻ってきた時に、一覧の位置を戻す（10分以内）
    const scrollBox = (el) => { for (let p = el && el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight) return p; } return null; };
    function histSaveScroll(el) { try { const sc = scrollBox(el); sessionStorage.setItem("jprHistScroll", JSON.stringify({ top: sc ? sc.scrollTop : 0, ov: !!el.closest(".jprush-hist"), at: w() })); } catch (e) {} }
    function histSaved() { try { const o = JSON.parse(sessionStorage.getItem("jprHistScroll") || "null"); return o && w() - o.at < 6e5 ? o : null; } catch (e) { return null; } }
    function histRestore(el) { const o = histSaved(); if (!o) return; setTimeout(() => { const sc = scrollBox(el); sc && (sc.scrollTop = o.top); try { sessionStorage.removeItem("jprHistScroll"); } catch (e) {} }, 60); }
    // 4.10.345：コピーのアイコン（四角2つ）。押すとコピーして ✓ を1.5秒
    const COPY_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><rect x="9" y="9" width="12" height="12" rx="1"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>';
    function copyIcon(getText, title, col) {
      const b = document.createElement("button");
      b.type = "button", b.title = title, b.innerHTML = COPY_SVG;
      b.style.cssText = "flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:26px;padding:0;margin:0;border:1px solid transparent;border-radius:0;background:transparent;color:" + (col || "#003792") + ";cursor:pointer;vertical-align:middle;";
      b.onclick = (ev) => { ev.preventDefault(), ev.stopPropagation(); writeClip(getText(), () => { b.textContent = "✓", setTimeout(() => { b.innerHTML = COPY_SVG; }, 1500); }, () => { b.textContent = "×", setTimeout(() => { b.innerHTML = COPY_SVG; }, 1500); }); };
      return b;
    }
    function histBody(list) {
      const nt = document.createElement("div"), box = document.createElement("div");
      nt.textContent = "直近7日にカートの画面で見た商品（新しい順）。カートの画面を開いた時に記録します。自分で［削除］した商品には「削除」マークが付きます（左のボタンで付け外し）。";
      nt.style.cssText = "padding:8px 12px;font-size:12px;color:#5f6b7a;";
      list.length || box.append(Object.assign(document.createElement("div"), { textContent: "まだ記録がありません（カートの画面を開くと記録が始まります）", style: "padding:24px 12px;color:#4a5a6e;" }));
      const picks = [], ctl = document.createElement("div"), goB = document.createElement("button");
      const bst = "padding:6px 12px;min-height:34px;border:1px solid #cacaca;border-radius:0;background:#eef2f8;color:#003792;font:700 13px/1.5 system-ui,sans-serif;cursor:pointer;";
      ctl.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:8px;";
      goB.type = "button", goB.style.cssText = bst;
      const live = () => picks.filter((p) => !p.marked() && !p.done() && !p.sold());
      const syncCtl = () => { if (goB.dataset.busy) return; const n = live().length; goB.textContent = `マーク以外を再カート（${n}件）`, goB.disabled = !n, goB.style.opacity = n ? "1" : ".5"; };
      goB.onclick = (ev) => {
        ev.preventDefault();
        const sel = live();
        if (!sel.length) return;
        goB.dataset.busy = "1", goB.disabled = true, goB.textContent = "送信中…";
        // 4.10.443：1件ずつ・1秒おきに送る。じゃんぱらに拒否（403・503）されたら、そこで止める
        (async () => {
          let ok = 0, ng = 0, why = "";
          for (let i = 0; i < sel.length; i++) {
            goB.textContent = `送信中… ${i + 1}/${sel.length}（入った ${ok}）`;
            const r = await sel[i].runS();
            if (r === "ok") ok++; else if (r === "ng") ng++; else if (r === "stop") { why = "じゃんぱらが混雑（503）で止めた。少し空けてもう一度"; break; }
            await new Promise((res) => setTimeout(res, 2500));   // 4.10.450：手動と同じ間隔（数秒おく）
          }
          arLog(`${T(w())} マーク以外を再カート：${sel.length}件中 ${ok}件入った` + (ng ? `・${ng}件失敗` : "") + (why ? "・" + why : ""));
          goB.textContent = `${ok}件 戻しました` + (ng ? `（失敗 ${ng}件）` : "") + (why ? "・拒否で停止" : "");
          delete goB.dataset.busy;
          ok && cartPage() && setTimeout(() => location.reload(), 1500);
        })();
      };
      // 4.10.340：完売チェック。カートの外の商品（削除マーク含む・完売済みは除く）の商品ページを1件ずつ裏で読み、在庫あり・商談中・完売を記録する
      const chkB = document.createElement("button"), chkRows = new Map();
      chkB.type = "button", chkB.style.cssText = bst + "background:#fff;";
      let chkStop = false, chkRun = false;
      // 4.10.349：10分以内に確かめた商品は飛ばす（読み直さない）
      // 4.10.358：保存の読み直しを減らす（1回の表示で同じ記録を何百回も読んでいて重かった）。読むのは1秒に1回まで、書いたら読み直す
      let hC = null, hAt = 0;
      const curH = () => (hC && Date.now() - hAt < 1e3 ? hC : (hAt = Date.now(), hC = E("cartHist", {}) || {}));
      const chkTargets = () => { const H = curH(); return [...chkRows.entries()].filter(([c]) => { const v = H[c]; return v && !v.sold && !(v.chk && v.chk.st !== "?" && w() - v.chk.at < 6e5); }); };
      const chkLabel = () => { if (chkRun) return; const n = chkTargets().length; chkB.textContent = `完売チェック（${n}件）`, chkB.disabled = !n, chkB.style.opacity = n ? "1" : ".5"; };
      chkB.onclick = (ev) => {
        ev.preventDefault();
        if (chkRun) { chkStop = true, chkB.textContent = "止めています…"; return; }
        const tg = chkTargets();
        if (!tg.length) return;
        chkRun = true, chkStop = false;
        let i = 0;
        const next = () => {
          if (chkStop || i >= tg.length) { chkRun = false, chkBusyG = false, chkB.textContent = chkStop ? `止めました（${i}/${tg.length}件）` : `確認しました（${tg.length}件）`, setTimeout(chkLabel, 4000); return; }
          // 4.10.355：再カートを送っている間は待つ（同時に動かさない）
          if (readdPend || cartSending) { chkBusyG = false, chkB.textContent = `待機中 ${i}/${tg.length}（再カート中）`; return setTimeout(next, 2e3); }
          if (watchBusy) { chkBusyG = false; return setTimeout(next, 1e3); }
          chkBusyG = true;
          const [code, ref] = tg[i++], v0 = (E("cartHist", {}) || {})[code] || {};
          chkB.textContent = `確認中 ${i}/${tg.length}（押すと止める）`;
          framePageText(v0.url || srcodeHref(code)).then((g) => g && g.text ? judgeUnit(g.text, code) : { k: "?" }).catch(() => ({ k: "?" })).then((r) => {
            const t = w(), st = r.k === "sold" ? "sold" : r.k === "nego" ? "nego" : r.k === "stock" ? "stock" : "";
            try {
              const h = E("cartHist", {}) || {}, v = h[code];
              if (v) { v.chk = { st: st || "?", at: t }; st === "sold" ? (v.sold = t) : st && delete v.sold; v.markAt = Math.max(v.markAt || 0, t); $("cartHist", h), hC = null; }
              st && lgItem(code, { st, price: r.price || 0 }, "check");
            } catch (e) {}
            ref.paint(st || "?", t), syncCtl();
            setTimeout(next, 1e3);
          });
        };
        next();
      };
      // 4.10.344：［コピー］今の並びのまま、まとまりごとに文字でコピー
      const cpAll = copyIcon(() => `JP RUSH カート履歴（${T(w())}）` + flat(copyAll), "全部をコピー");
      cpAll.style.border = "1px solid #cdd6e4", cpAll.style.width = "36px", cpAll.style.height = "34px", cpAll.style.background = "#fff";
      ctl.style.flexWrap = "wrap";
      ctl.append(goB, chkB, cpAll);
      // 4.10.335：完売の台と「削除」マークの台は、いちばん下の「完売・削除済み」にまとめてグレーにする（履歴としては残す）
      // 4.10.344：やることが多い順に5つのまとまり（戻せる商品→見張り中→もう1台のカート→カート内→完売・削除済み）。日付の見出しはやめ、時刻は各行に
      const Wt = E("cartWatch", {}) || {}, Dt = E("cartWatchDone", {}) || {}, dv = devId();
      // 4.10.362：「完売」と「削除済み」を分ける（完売で削除済みのものは完売へ）
      const grp = ([c, v]) => (v.sold ? 5 : v.mark ? 6 : !v.goneAt && !(v.dev && v.dev !== dv) ? 4 : !v.goneAt ? 3 : Wt[c] ? 2 : 1);
      // 4.10.455：戻せる商品は「カートに入れた時刻の新しい順」（前は消えた時刻の新しい順）。時刻の分からない物は一番後ろ
      const gkey = ([c, v], g) => (g === 1 ? v.addAt || 0 : g === 2 ? (Wt[c] || {}).since || 0 : g >= 5 ? Math.max(v.sold || 0, v.markAt || 0, v.goneAt || 0) : v.addAt || 0);
      const GN = ["", "戻せる商品", "見張り中", "もう1台のカート", "カート内", "完売", "削除済み"], GS = [[], [], [], [], [], [], []];
      for (const e of list) GS[grp(e)].push(e);
      for (let g = 1; g <= 6; g++) GS[g].sort((a, b) => gkey(b, g) - gkey(a, g));
      // 4.10.457：戻せる商品は復活時刻の時系列（古い順）。復活の時刻が分からない物は一番後ろ
      { const rv = ([, v]) => (v.addAt ? v.addAt + CART_HOLD : Infinity); GS[1].sort((a, b) => { const ra = rv(a), rb = rv(b); return ra === rb ? 0 : ra < rb ? -1 : 1; }); }
      const rows = GS.flat(), cartRows = [], copyAll = [], copyG = [[], [], [], [], [], [], []];
      // 4.10.346：コピーに台帳の情報も入れる（表示した時に台帳をまとめて1回で読んでおく）
      let LGM = new Map();
      lgMany(rows.map(([c]) => c)).then((m) => { LGM = m; });
      const flat = (a) => a.map((x) => (typeof x === "function" ? x() : x)).join("\n");
      const stJ = (k) => ({ sold: "完売", nego: "商談中", stock: "在庫あり", cart: "カート内" })[k] || k || "";
      const rich = (code, v, base, st) => {
        const L = LGM.get(String(code)) || {}, out = ["・" + (v.name || L.name || "商品番号 " + code)];
        const pr = (L.prices || []).slice(-5).map(([t, p]) => `${T(t)} ${A(p)}`).join(" → ");
        out.push("  " + [`商品番号 ${code}`, v.price || L.price ? A(v.price || L.price) : "", v.store || L.shop || ""].filter(Boolean).join("／"));
        pr && (L.prices || []).length > 1 && out.push(`  価格の変化：${pr}`);
        const C = L.cond;
        if (C && (C.rank || C.cond || C.acc || C.badges || (C.notes || []).length)) {
          out.push("  状態：" + [C.cond, C.rank, C.badges && !C.rank && !C.cond ? C.badges : ""].filter(Boolean).join("・") + (C.acc ? `／付属品：${C.acc}` : "") + (C.grt ? `／保証：${C.grt}` : "") + `（${T(C.at)} 取得）`);
          (C.notes || []).length && out.push(`  備考：${C.notes.join(" ／ ")}`);
          (C.specs || []).length && out.push(`  スペック：${C.specs.map(([a, b]) => a + " " + b).join("／")}`);
        } else out.push("  状態：未取得（URL先で確認）");
        out.push("  " + base);
        const lg = [L.st ? `台帳の状態：${stJ(L.st)}（${T(L.stAt)}）` : "", L.firstAt ? `初めて見た ${T(L.firstAt)}` : "", L.lastAt ? `最後に見た ${T(L.lastAt)}` : "", L.itm ? `型番ページ ITMCODE=${L.itm}` : ""].filter(Boolean);
        lg.length && out.push("  " + lg.join("／"));
        out.push("  " + (v.url || L.url || srcodeHref(code)));
        return out.join("\n");
      };
      // 4.10.357：「カート内」と「完売・削除済み」は最初たたんでおく（見出しを押すと開く）
      const FK = { 4: "histFoldCart", 5: "histFoldDone", 6: "histFoldDel" }, fold = { 4: E("histFoldCart", true) !== false, 5: E("histFoldDone", true) !== false, 6: E("histFoldDel", true) !== false }, foldRows = { 4: [], 5: [], 6: [] };
      let curG = 0;
      for (const [code, v] of rows) {
        const g = grp([code, v]);
        if (g !== curG) {
          curG = g;
          const gh = document.createElement("div"), ght = document.createElement("span"), gg = g;
          ght.textContent = (FK[g] ? (fold[g] ? "▸ " : "▾ ") : "") + `${GN[g]}（${GS[g].length}件）`, ght.style.flex = "1";
          gh.append(ght, copyIcon(() => `JP RUSH カート履歴：${GN[gg]}（${T(w())}）\n` + flat(copyG[gg]), `${GN[g]}をまとめてコピー`, "currentColor"));
          gh.style.cssText = "display:flex;align-items:center;gap:6px;padding:8px 6px 8px 10px;font-size:13px;font-weight:700;background:#e9eef5;border-top:1px solid #c5ced8;border-left:4px solid;" + (g === 1 ? "color:#c8102e;border-left-color:#c8102e;" : g === 2 ? "color:#7a5600;border-left-color:#d4a017;" : g === 3 ? "color:#5b4aa8;border-left-color:#5b4aa8;" : g === 4 ? "color:#003792;border-left-color:#003792;" : "color:#6b7280;border-left-color:#9aa3ae;") + (g === 4 ? "cursor:pointer;" : "");
          if (FK[g]) { gh.style.cursor = "pointer", gh.onclick = (ev) => { if (ev.target.closest("button")) return; fold[gg] = !fold[gg], $(FK[gg], fold[gg]), ght.textContent = (fold[gg] ? "▸ " : "▾ ") + `${GN[gg]}（${GS[gg].length}件）`; for (const r of foldRows[gg]) r.style.display = fold[gg] ? "none" : "flex"; }; }
          box.append(gh), copyAll.push("", `■ ${GN[g]}（${GS[g].length}件）`);
        }
        const other = !!v.dev && v.dev !== devId(), inCart = !v.goneAt && !other, exp = !!v.goneAt && v.goneAt - (v.addAt || 0) >= CART_HOLD, st = other && !v.goneAt ? "もう1台のカート" : inCart ? "カート内" : exp ? "期限切れ" : "期限前に消えた";
        const row = document.createElement("div"), info = document.createElement("div"), nm = document.createElement("a"), sub = document.createElement("div"), tag = document.createElement("span");
        row.style.cssText = "display:flex;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #dfe4ea;background:#fff;content-visibility:auto;contain-intrinsic-size:auto 110px;";   // 4.10.364：見えていない行は描かない
        info.style.cssText = "flex:1;min-width:0;";
        nm.textContent = v.name || "商品番号 " + code, nm.href = v.url || "https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + code;
        nm.style.cssText = "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:15px;font-weight:700;line-height:1.4;color:#333333;text-decoration:none;";
        nm.addEventListener("pointerdown", () => histSaveScroll(nm)), nm.addEventListener("click", () => histSaveScroll(nm));
        const soldTag = v.sold ? Object.assign(document.createElement("span"), { textContent: "完売" }) : null;
        soldTag && (soldTag.style.cssText = "display:inline-block;margin:0 4px 2px 0;padding:0 7px;border-radius:5px;font-size:12px;font-weight:700;background:#6b7280;color:#fff;");
        tag.textContent = st, tag.style.cssText = "display:inline-block;margin:0 4px 2px 0;padding:0 7px;border-radius:5px;font-size:12px;font-weight:700;color:#fff;" + (other && !v.goneAt ? "background:#5b4aa8;" : inCart ? "background:#003792;" : exp ? "background:#6b7280;" : "background:#c8102e;");   // 4.10.363：検索画面の札と同じ形
        soldTag && sub.append(soldTag);
        const chkNote = (x) => x ? `確認：${x.st === "sold" ? "完売" : x.st === "nego" ? "商談中" : x.st === "stock" ? "在庫あり" : "読めず"} ${T(x.at)}` : "";
        sub.append(tag, [v.price ? A(v.price) : "", v.store || "", T(v.addAt) + " に入れた" + (v.goneAt ? `・${T(v.goneAt)} までに消えた・${T((v.addAt || 0) + CART_HOLD)} に復活` : "")].filter(Boolean).concat(histWatchNote(code, Wt, Dt), chkNote(v.chk) || []).join("・"));
        sub.style.cssText = "font-size:13px;line-height:1.5;color:#4a5a6e;margin-top:3px;";
        // 4.10.344：コピー用の1行（商品名／価格／店舗／状態／URL）と、行ごとの［コピー］
        const line = [v.name || "商品番号 " + code, v.price ? A(v.price) : "", v.store || "", [v.sold ? "完売" : "", v.mark ? "削除済" : "", st, v.goneAt ? T(v.goneAt) + "までに消えた" : T(v.addAt) + "に入れた"].concat(histWatchNote(code, Wt, Dt), chkNote(v.chk) || []).filter(Boolean).join(" "), nm.href].filter(Boolean).join("／");
        const base = [v.sold ? "完売" : "", v.mark ? "削除済" : "", st, T(v.addAt) + "に入れた", v.goneAt ? T(v.goneAt) + "までに消えた" : ""].concat(histWatchNote(code, Wt, Dt), chkNote(v.chk) || []).filter(Boolean).join("・");
        const lineFn = () => rich(code, v, base, st);
        copyAll.push(lineFn), copyG[g].push(lineFn);
        const cp = copyIcon(lineFn, "この商品をコピー");
        cp.style.width = "22px", cp.style.height = "18px", cp.style.marginLeft = "4px";
        sub.append(cp);
        info.append(nm, sub), row.append(info);
        if (!inCart) chkRows.set(code, { paint: (st, at) => {
          const note = Object.assign(document.createElement("span"), { textContent: "・" + chkNote({ st, at }) });
          note.style.cssText = "font-weight:700;color:" + (st === "sold" ? "#6b7280" : st === "stock" ? "#1e6b3f" : st === "nego" ? "#7a5600" : "#c8102e") + ";";
          sub.append(note);
          if (st === "sold") { row.style.background = "#f4f5f7", info.style.opacity = ".55"; const bt = [...row.querySelectorAll("button")].find((x) => /再カート/.test(x.textContent)); bt && bt.remove(); }
        } });
        if (!inCart) {
          // 「削除」マーク（付け外し）
          const mk = document.createElement("button");
          let marked = !!v.mark;
          const paintMk = () => { const g = marked || !!v.sold; mk.textContent = marked ? "削除済" : "削除"; mk.style.cssText = "flex:none;width:52px;min-height:30px;padding:0;border-radius:0;font:700 11px/1 system-ui,sans-serif;cursor:pointer;" + (marked ? "border:1px solid #6b7280;background:#6b7280;color:#fff;" : "border:1px dashed #b8c0cc;background:#fff;color:#8a94a3;"); row.style.background = g ? "#f4f5f7" : "#fff"; info.style.opacity = g ? ".55" : "1"; };
          mk.type = "button", mk.title = "自分で消した印（付け外しできます）。印のある商品は「マーク以外を再カート」の対象外", paintMk();
          mk.onclick = (ev) => { ev.preventDefault(), marked = !marked, histMark(code, marked), paintMk(), syncCtl(); };
          row.prepend(mk);
          if (v.price && !v.sold) {
            const b = document.createElement("button");
            let done = false;
            b.type = "button", b.textContent = "再カート";
            b.style.cssText = "flex:none;padding:0 14px;min-height:40px;border:0;border-radius:0;background:#003792;color:#fff;font:700 14px/1.5 system-ui,sans-serif;cursor:pointer;";   // 4.10.363：検索画面のボタンと同じ
            // 1件を送る（成功で true）。1件の［再カート］も、まとめての時も同じ
            const run = () => {
              if (b.disabled) return Promise.resolve(false);
              b.disabled = true, b.textContent = "送信中…";
              const shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(code), t0 = w();
              try { const m = E("cartReadd", {}) || {}; m[code] = t0, $("cartReadd", m); } catch (e) {}
              const body = withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(v.price)], ["REDIRECT", ""], ["QTY", "1"]]));
              return cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body, credentials: "include", redirect: "follow" }).then((r) => r.text()).then((html) => {
                if (!new RegExp("[?&]SRCODE=" + code + "(?!\\d)").test(html)) throw new Error("カートに見当たりません");
                try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; c.codes[code] = { name: v.name, price: v.price, store: v.store, url: v.url, firstSeen: t0 }; $("cart", c); } catch (e) {}
                b.textContent = "戻しました ✓", done = true, syncCtl();
                return true;
              }).catch(() => { b.textContent = "失敗", b.disabled = false, syncCtl(), setTimeout(() => { b.textContent = "再カート"; }, 4000); return false; });
            };
            b.onclick = (ev) => { ev.preventDefault(); run().then((ok) => { ok && cartPage() && setTimeout(() => location.reload(), 700); }); };
            // 4.10.438：まとめての時は、今すぐ再カートと同じ送り方（同時5件まで・リダイレクトを追わない・カートは1回だけ読む）。1件の［再カート］は今まで通り
            const runQ = () => new Promise((res) => {
              if (b.disabled) return res(false);
              b.disabled = true, b.textContent = "送信中…";
              const shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(code), t0 = w();
              try { const m = E("cartReadd", {}) || {}; m[code] = t0, $("cartReadd", m); } catch (e) {}
              const body = withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(v.price)], ["REDIRECT", ""], ["QTY", "1"]]));
              RDQ.jobs.push({
                code, body, delReq: () => Promise.resolve(), noCheck: true,
                ok: () => { try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; c.codes[code] = { name: v.name, price: v.price, store: v.store, url: v.url, firstSeen: t0 }; $("cart", c); } catch (e) {} b.textContent = "戻しました ✓", done = true, syncCtl(), res(true); },
                fail: () => { b.textContent = "失敗", b.disabled = false, syncCtl(), setTimeout(() => { b.textContent = "再カート"; }, 4000), res(false); },
              });
              rdqPump();
            });
            // 4.10.449：手動と同じ送り方。商品ページを開き、そのフォームの中身を送る（送り元＝商品ページ）。フォームが無ければ売り切れか他の人のカートとみて送らない
            const addLikeHand = async (code, shp) => {
              const detail = "https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + code + (shp ? "&SHPCODE=" + shp : "");
              const h0 = await (await cfetch(detail, { credentials: "include", cache: "no-store", timeout: 2e4 })).text();
              const fm = [...new DOMParser().parseFromString(h0, "text/html").querySelectorAll("form")].find((x) => /\/sale\/cart\/add\//.test(x.getAttribute("action") || ""));
              if (!fm) return { type: "", status: "ボタン無し" };
              const body = new URLSearchParams();
              for (const x of fm.elements) { if (!x.name || x.disabled || /^(submit|button|reset|image|file)$/i.test(x.type || "")) continue; if (/^(checkbox|radio)$/i.test(x.type || "") && !x.checked) continue; body.append(x.name, x.value || ""); }
              const sb = [...fm.elements].find((x) => /^(submit|image)$/i.test(x.type || "") && x.name); sb && body.append(sb.name, sb.value || "");
              return cfetch(new URL(fm.getAttribute("action") || "/sale/cart/add/", detail).href, { method: "POST", body, credentials: "include", redirect: "manual", referrer: detail, timeout: 3e4, noBrake: true, noBrakeSet: true });
            };
            // 4.10.443：まとめて用。1件を送って、返事（転送＝入った）で決める。拒否（403・503）なら "stop"
            const runS = async () => {
              if (b.disabled) return "skip";
              b.disabled = true, b.textContent = "送信中…";
              const shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(code), t0 = w();
              const body = withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(v.price)], ["REDIRECT", ""], ["QTY", "1"]]));
              let k = "";
              try { const r = await addLikeHand(code, shp); k = r.type === "opaqueredirect" ? "転送" : String(r.status); if (k === "転送") try { localStorage.removeItem("jprAddBrake"); } catch (e) {} } catch (e) { k = /ブレーキ/.test(String(e && e.message)) ? "ブレーキ" : "通信エラー"; }
              if (k === "転送" || k === "200") {
                try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; c.codes[code] = { name: v.name, price: v.price, store: v.store, url: v.url, firstSeen: t0 }; $("cart", c); } catch (e) {}
                try { const m = E("cartReadd", {}) || {}; m[code] = t0, $("cartReadd", m); } catch (e) {}
                b.textContent = "戻しました ✓", done = true, syncCtl(); return "ok";
              }
              b.textContent = "失敗（" + k + "）", b.disabled = false, syncCtl(), setTimeout(() => { b.textContent = "再カート"; }, 6000);
              return k === "503" ? "stop" : "ng";
            };
            picks.push({ run, runQ, runS, marked: () => marked, done: () => done, sold: () => !!(curH()[code] || {}).sold });
            row.append(b);
          }
        }
        if (FK[g]) { foldRows[g].push(row); fold[g] && (row.style.display = "none"); }
        box.append(row);
      }
      list.length && (nt.append(ctl), syncCtl(), chkLabel());
      return { nt, box };
    }
    function histList() { const h = E("cartHist", {}) || {}; return Object.entries(h).sort((x, y) => (y[1].addAt || 0) - (x[1].addAt || 0)); }
    function histPanel() {
      const h = E("cartHist", {}) || {}, now = w(), list = Object.entries(h).sort((x, y) => (y[1].addAt || 0) - (x[1].addAt || 0));
      // 4.10.310：一覧はこのスクリプトの左の欄ではなく、画面の真ん中に重ねる専用の窓に出す（閉じるとカートに戻る）
      document.querySelectorAll(".jprush-hist").forEach((x) => x.remove());
      const ov = document.createElement("div"), win = document.createElement("div"), hd = document.createElement("div"), ttl = document.createElement("span"), x = document.createElement("button"), sc = document.createElement("div");
      ov.className = "jprush-hist", ov.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.35);display:flex;justify-content:center;align-items:flex-start;padding:16px 8px;box-sizing:border-box;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;";
      win.style.cssText = "width:100%;max-width:760px;max-height:100%;display:flex;flex-direction:column;background:#f3f6fa;border:1px solid #cacaca;box-shadow:0 8px 30px rgba(0,0,0,.25);";
      hd.style.cssText = "flex:none;display:flex;align-items:center;gap:8px;height:44px;padding:0 6px 0 14px;background:#003792;color:#fff;font-weight:800;font-size:15px;";
      ttl.textContent = `カート履歴 ${list.length}件`, ttl.style.flex = "1";
      x.type = "button", x.textContent = "閉じる", x.style.cssText = "flex:none;height:32px;padding:0 14px;border:1px solid rgba(255,255,255,.7);border-radius:0;background:transparent;color:#fff;font:700 13px/1 system-ui,sans-serif;cursor:pointer;";
      const close = () => ov.remove();
      x.onclick = close, ov.addEventListener("click", (ev) => { ev.target === ov && close(); });
      sc.style.cssText = "flex:1;overflow:auto;-webkit-overflow-scrolling:touch;";
      hd.append(ttl, x), win.append(hd, sc), ov.append(win);
      const { nt, box } = histBody(list);
      sc.append(nt, box), document.body.append(ov), histRestore(box);
    }
    const openHist = () => { const o = document.querySelector(".jprush-hist"); o ? o.remove() : histPanel(); };
    // 4.10.329：見張り。入れ直した直後に消えた商品（削除は通ったが追加が通らなかった）と、期限切れの欄に出た商品を、自動再カートが ON の間だけ見張る。
    // 1分おきに商品ページを裏で読み、在庫あり→再カート、商談中→1分後にまた、完売→やめる、2時間で打ち切り
    const WATCH_EVERY = 6e4, WATCH_MAX = 2 * 36e5;
    function watchAdd(code, v, why, now) {
      if (!AUX.watch || !code || !E("autoRecart", false)) return;
      const W = E("cartWatch", {}) || {}, D = E("cartWatchDone", {}) || {};
      if (W[code] || (D[code] && now - D[code].at < 864e5)) return;
      // 4.10.341：「期限切れ」は、このカートに入っていたと分かっている商品だけ（おすすめの商品などを拾わない）
      if (why === "期限切れ" && !((E("cartHist", {}) || {})[code] || ((E("cart", { codes: {} }) || {}).codes || {})[code])) return;
      W[code] = { name: v.name || "", url: v.url || "https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + code, price: v.price || 0, why, since: now, next: now + 6e4, st: "見張り開始" };   // 4.10.451：最初の送りは1分後
      // 4.10.374：見張りは最大20点まで（多すぎると送信が増えるだけ）。あふれたら古い順にやめる
      const ks = Object.keys(W).sort((a, b) => (W[b].since || 0) - (W[a].since || 0));
      for (const k of ks.slice(WATCH_CAP)) { delete W[k], D[k] = { at: now, st: "見張りが多すぎるのでやめた" }; }
      $("cartWatch", W), $("cartWatchDone", D);
    }
    const WATCH_CAP = 20;
    function watchLost(prev, codes, readd, now) {
      try {
        // 4.10.343：期限切れの欄に出なくても、前回あって今回ない商品は見張る（自分で［削除］した商品と、［カート全削除］の直後は除く）
        const H = E("cartHist", {}) || {}, delAll = now - (E("cartDelAllAt", 0) || 0) < 3e5;
        // 4.10.374：一度にたくさん（5点以上かつ半分以上）消えた時は、読み違いか一斉の期限切れなので見張らない（カート履歴の「戻せる商品」には残る）
        { const pk = Object.keys(prev), miss = pk.filter((c) => !codes[c]).length; if (miss >= 5 && miss >= pk.length / 2) { arLog(`${T(now)} ${miss}点が一度に消えたので見張りには入れなかった（カート履歴から戻せる）`); return; } }
        for (const [c, v] of Object.entries(prev)) {
          if (codes[c]) continue;
          if (readd[c] && now - readd[c] >= 0 && now - readd[c] < 18e4) watchAdd(c, v || {}, "入れ直しで消えた", now);
          else if (!delAll && !(H[c] && H[c].mark) && !delMarks()[c]) watchAdd(c, { ...(H[c] || {}), ...(v || {}) }, "消えた", now);
        }
      } catch (e) {}
    }
    function watchDone(code, st) {
      const W = E("cartWatch", {}) || {}, D = E("cartWatchDone", {}) || {}, t = w();
      delete W[code], D[code] = { at: t, st };
      for (const k of Object.keys(D)) t - D[k].at > 864e5 && delete D[k];
      $("cartWatch", W), $("cartWatchDone", D);
    }
    // 4.10.374：前の版でたまった見張り（20点を超える分）は、読み込んだ時に古い順にやめる
    try { const W0 = E("cartWatch", {}) || {}, ks = Object.keys(W0); if (ks.length > 20) { const D0 = E("cartWatchDone", {}) || {}, t0 = Date.now(); for (const k of ks.sort((a, b) => (W0[b].since || 0) - (W0[a].since || 0)).slice(20)) delete W0[k], D0[k] = { at: t0, st: "見張りが多すぎるのでやめた" }; GM_setValue(Ct + "cartWatch", W0), GM_setValue(Ct + "cartWatchDone", D0); } } catch (e) {}
    function watchSet(code, o) { const W = E("cartWatch", {}) || {}; if (!W[code]) return; Object.assign(W[code], o), $("cartWatch", W); }
    // 4.10.333：カートの見張り。自動再カートが ON の間、1分おきにカートのページを裏で読むだけ（削除・追加はしない）。
    // じゃんぱら側で消えた商品があれば、期限切れの欄に出た商品を見張りに入れてから、ページを開き直して表をそろえる
    let cartPollAt = 0;
    function cartPoll() {
      if (!E("autoRecart", false) || !cartPage() || readdPend || watchBusy || rcwBusy()) return;
      const t = w();
      if (t - cartPollAt < 6e4) return;
      cartPollAt = t;
      // 4.10.365：今のページでも「期限切れのため」より下にある商品は、カートの中として数えない（スマホで、期限切れの欄の商品を「消えた」と何度も数えて開き直し続けていた）
      const liveExp = new Set();
      { let af = false; const tw0 = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT); for (let n = tw0.nextNode(); n; n = tw0.nextNode()) { if (n.nodeType === 3) { /期限切れのため/.test(n.nodeValue) && (af = true); continue; } if (af && n.tagName === "A") { const m = /[?&]SRCODE=(\d+)/.exec(n.getAttribute("href") || ""); m && liveExp.add(m[1]); } } }
      const shown = [...new Set([...document.querySelectorAll(".jprush-readd[data-code]")].map((x) => x.dataset.code))].filter((c) => !liveExp.has(c));
      if (!shown.length) return;
      cfetch("/sale/cart/", { credentials: "include", cache: "no-store" }).then((r) => r.text()).then((html) => {
        if (readdPend || document.querySelector(".jprush-readd [data-jprush-busy]")) return;
        const d = new DOMParser().parseFromString(html, "text/html"), inCart = new Set(), expired = [];
        let after = false;
        const tw = d.createTreeWalker(d.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (n.nodeType === 3) { /期限切れのため/.test(n.nodeValue) && (after = true); continue; }
          const m = n.tagName === "A" && /[?&]SRCODE=(\d+)/.exec(n.getAttribute("href") || "");
          if (!m) continue;
          after ? notRecommend(n) && expired.push({ sr: m[1], name: N(n.textContent), url: new URL(n.getAttribute("href"), location.href).href }) : inCart.add(m[1]);
        }
        // 4.10.386：読んでいる間に働き手が入れ直しを始めていたら、何もしない（入れ直しの途中を「消えた」と見て開き直し、働き手を止めていた）
        if (rcwBusy()) return;
        const RD = E("cartReadd", {}) || {};
        const IN2 = cartCodesIn(html);   // 4.10.390：カートの中かどうかは［削除］のある範囲で見る
        // 4.10.395：画面に出ていない商品（じゃんぱらの画面で直接入れた等）がカートにあれば、すぐ開き直して記録する（入れた時刻が分からないので、自動再カートがすぐ入れ直して時刻を確かにする）
        const C0 = (E("cart", { codes: {} }) || {}).codes || {}, fresh = [...IN2].filter((c) => !shown.includes(c) && !C0[c] && !(RD[c] && w() - RD[c] < 18e4));
        if (fresh.length && !readdPend && !watchBusy) {
          try { const o = JSON.parse(sessionStorage.getItem("jprPollNew") || "null"), k = fresh.slice().sort().join(","); if (!(o && o.k === k && w() - o.at < 3e5)) { sessionStorage.setItem("jprPollNew", JSON.stringify({ k, at: w() })); arLog(`${T(w())} カートに新しい商品${fresh.length}点（${fresh.slice(0, 3).join("・")}）→ 開き直して記録する`); setTimeout(() => { rcwBusy() || location.reload(); }, 500); return; } } catch (e) {}
        }
        const DM2 = delMarks();
        const lost = shown.filter((c) => !DM2[c] && !IN2.has(c) && !inCart.has(c) && !(RD[c] && w() - RD[c] < 18e4) && !(rcTouched(c) && w() - rcTouched(c) < 18e4));
        if (!lost.length) return;
        // 4.10.377：一度にたくさん（5点以上かつ3割以上）消えたように見える時は、読んだページが途中までだった可能性が高いので開き直さない
        if (lost.length >= 5 && lost.length >= shown.length * 0.3) { arLog(`${T(w())} カートの見張り：${lost.length}点が見当たらないが、読み取りが不完全とみて開き直さなかった`); return; }
        // 4.10.365：同じ商品で10分以内にもう開き直していたら、もう開き直さない（開き直し続けるのを防ぐ）
        try { const k = lost.slice().sort().join(","), o = JSON.parse(sessionStorage.getItem("jprPollLost") || "null"); if (o && o.k === k && w() - o.at < 6e5) return; sessionStorage.setItem("jprPollLost", JSON.stringify({ k, at: w() })); } catch (e) {}
        const H = E("cartHist", {}) || {}, C = (E("cart", { codes: {} }) || {}).codes || {};
        for (const x of expired) inCart.has(x.sr) || watchAdd(x.sr, { ...(H[x.sr] || {}), ...(C[x.sr] || {}), name: x.name || (H[x.sr] || {}).name, url: x.url }, "期限切れ", w());
        console.info("[JP RUSH] カートの見張り：じゃんぱら側で消えた商品", lost, "→ 開き直します");
        arLog(`${T(w())} カートの見張りで消えた商品 ${lost.length}点に気づいた（${lost.slice(0, 3).join("・")}）`);
        location.reload();
      }).catch(() => {});
    }
    try { const W = E("cartWatch", {}) || {}, H = E("cartHist", {}) || {}; let ch = false; for (const [c, v] of Object.entries(W)) if (v.why === "期限切れ" && !H[c]) delete W[c], ch = true; ch && $("cartWatch", W); } catch (e) {}   // 4.10.341：前の版で拾ったおすすめ商品を見張りから外す
    let watchBusy = false, chkBusyG = false;   // 4.10.357：見張りと完売チェックは同時に商品ページを読まない
    // 4.10.366：見張りを軽く作り直し。商品ページは読まず、カートに入れる送信だけを「空きそうな時」に試す。
    // 消えた商品は、たいてい誰かがカートに入れている。その人の持ち時間（1時間）が切れる頃に空くので、
    // 消えた直後（1分後・3分後）と、57分後〜66分後（40秒おき）だけ送る。66分たっても戻らなければやめる
    const WATCH_END = 66 * 6e4;
    // 4.10.451：見張りの送りは2回だけ（消えた1分後と、予定時刻＝消えた57分後）。その後は送らず、見張りをやめる
    function watchNext(since, now) {
      if (now < since + 1 * 6e4) return since + 1 * 6e4;
      if (now < since + 57 * 6e4) return since + 57 * 6e4;
      return null;
    }
    function watchTick() {
      if (watchBusy || chkBusyG || readdPend || !E("autoRecart", false) || !cartPage()) return;
      const W = E("cartWatch", {}) || {}, t = w(), list = Object.entries(W).sort((a, b) => a[1].next - b[1].next);
      const hit = list.find(([, v]) => v.next <= t);
      if (!hit) return;
      const [code, v] = hit;
      if (t - v.since > WATCH_END) { watchDone(code, "1時間すぎても戻らなかったので見張りをやめた"); return; }
      { const cc = ((E("cart", { codes: {} }) || {}).codes || {})[code]; if (cc && cc.firstSeen && t - cc.firstSeen < CART_HOLD) { watchDone(code, "カートに戻った " + T(t)); return; } }
      let price = v.price;
      if (!price) { try { const H = (E("cartHist", {}) || {})[code]; price = H && H.price; } catch (e) {} }
      if (!price) { watchDone(code, "値段が分からないので見張りをやめた"); return; }
      watchBusy = true;
      const fin = () => { watchBusy = false; }, shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(code);
      cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body: withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(price)], ["REDIRECT", ""], ["QTY", "1"]])), credentials: "include", redirect: "follow" }).then((x) => { if (x.status === 403 || x.status === 503) throw Object.assign(new Error("拒否"), { denied: x.status }); return x.text(); }).then((html) => {
        const d = new DOMParser().parseFromString(html, "text/html");
        if (!d.querySelector(`tr a[href*="SRCODE=${code}"]`)) { const nx = watchNext(v.since, w()); if (!nx) { watchDone(code, `2回送ってもまだ入らず（${T(w())}）→ 見張りをやめた`), fin(); return; } watchSet(code, { st: `まだ入らず（${T(w())}）・次 ${T(nx)}`, next: nx }), fin(); return; }
        const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; c.codes[code] = { name: v.name, price, url: v.url, firstSeen: w() }; $("cart", c);
        try { const m = E("cartReadd", {}) || {}; m[code] = w(), $("cartReadd", m); } catch (e) {}
        watchDone(code, "見張りで再カート " + T(w())), arLog(`${T(w())} 見張りで ${String(v.name || code).slice(0, 24)}（${code}）を再カート`);
        fin();   // 4.10.451：見張りで戻ったあとも開き直さない（カートは開いた時に読む）
      }).catch((e) => {
        // 4.10.451：拒否（403・503）や送れなかった時は、その商品の見張りをやめる（前は「まだ入らず」「送れず」として1分ごとに送り続けていた）
        const why = e && e.denied ? `じゃんぱらが拒否（${e.denied}）` : "送れず";
        watchDone(code, `${why}→ 見張りをやめた（${T(w())}）`), fin();
      });
    }
    function readCart() {
      try { delMarksApply(); } catch (e) {}
      const body = document.body, txt = body ? body.textContent : "", now = w();
      // 4.10.177：空のカートは読み取り失敗にしない（お知らせを出さない。記録は変えない）
      if (/カートに商品は入っておりません|商品が入っていません/.test(txt)) { watchLost(E("cart", { codes: {} }).codes || {}, {}, E("cartReadd", {}) || {}, now), histUpdate({}, now); return { ok: false, empty: true, at: now }; }
      if (!/総合計/.test(txt)) return { ok: false, why: "カートの表示を読み取れませんでした（記録は変えていません）", at: now };
      const P = cartParse();
      if (!P.items.length) return { ok: false, why: "商品の番号を読み取れませんでした（記録は変えていません）", at: now };
      const prev = E("cart", { codes: {} }).codes || {}, codes = {}, readd = E("cartReadd", {}) || {};
      for (const it of P.items) {
        const pf = prev[it.code] && prev[it.code].firstSeen;
        // 4.10.237：カート画面の「カート」で入れ直した商品は、押した時刻から数え直す（押してから2分以内に戻った時だけ）
        const rs = readd[it.code], fresh = rs && now - rs >= 0 && now - rs < 12e4;
        // 4.10.377：前の記録も入れ直しの記録も無い商品は「入れた時刻が分からない」（unsure）。自動再カートがすぐ入れ直して時刻を確かにする
        const known = fresh || (pf && now - pf < CART_HOLD), unsure = !fresh && (!known || !!(prev[it.code] && prev[it.code].unsure));
        codes[it.code] = { name: it.name, firstSeen: fresh ? rs : known ? pf : now, price: it.amts[0], store: it.store, url: it.url, ...(unsure ? { unsure: true } : {}) };
      }
      watchLost(prev, codes, readd, now), histUpdate(codes, now);
      // 4.10.342：カートに入っている商品は見張らない（商品ページでは自分のカートの台も「商談中」に見えるため、見張りが終わらなくなっていた）
      try { const W = E("cartWatch", {}) || {}; for (const c of Object.keys(W)) codes[c] && watchDone(c, "カートに戻った " + T(now)); } catch (e) {}
      try { for (const [c, v] of Object.entries(codes)) lgItem(c, { name: v.name, price: v.price, shop: v.store, url: v.url, st: "cart" }, "cart"); } catch (e) {}   // 4.10.334：商品台帳へ
      $("cart", { at: now, codes }), Object.keys(readd).length && $("cartReadd", {});
      return { ok: true, n: P.items.length, stores: P.stores.length, at: now };
    }
    // 4.10.143：帯は「ショッピングカート」の見出しのすぐ上に、ページの一部として入れる（浮かせない）。開いてから60分を過ぎたら注意を足す
    // 4.10.144：見た目はページの「ショッピングカート」の帯に合わせる（幅・余白・高さ・色・字体を読み取って使う。角丸なし）。コピーは右端のアイコン
    let cartCenter = false;
    function showCartNote(r) {
      const d = document.createElement("div"), h = cartHead();
      d.className = "jprush-cartbar";
      let look = "background:#003792;color:#fff;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;font-size:14px;font-weight:400;padding:8px 10px;margin:8px 0;";
      if (h) {
        // 4.10.145：色・字体・文字の始まる位置は「ショッピングカート」の文字そのものから読む（箱の文字色は中の文字と違うことがある）。
        // 高さは見出しの帯の高さをそのまま使う（文字が折り返す時だけ高くなる）
        const tw = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        let tn = tw.nextNode();
        while (tn && !/ショッピングカート/.test(tn.nodeValue)) tn = tw.nextNode();
        const te = tn && tn.parentElement || h, tc = getComputedStyle(te), c = getComputedStyle(h), px = (v) => parseFloat(v) || 0;
        const bgOf = (el) => { for (let x = el; x && x !== h.parentElement; x = x.parentElement) { const b = getComputedStyle(x).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; } return ""; };
        const bg = bgOf(te), hb = h.getBoundingClientRect(), hw = hb.width, hh = Math.round(hb.height), pa = h.parentElement, pc = pa ? getComputedStyle(pa) : null;
        const range = document.createRange();
        tn ? range.selectNodeContents(tn) : range.selectNodeContents(h);
        const tl = Math.round((range.getClientRects()[0] || hb).left - hb.left), fs = Math.min(px(tc.fontSize) || 14, 16), gap = px(c.marginTop) || 8;
        // 見出しの文字が中央寄せの時（スマホ版）は、こちらも中央寄せ。左寄せの時は文字の始まる位置を揃える
        const center = /center/.test(tc.textAlign) || /center/.test(c.textAlign), padL = center ? Math.max(px(c.paddingLeft), 8) : Math.max(tl, 8);
        cartCenter = center;
        const fill = !pa || Math.abs(hw - (pa.clientWidth - px(pc.paddingLeft) - px(pc.paddingRight) - px(c.marginLeft) - px(c.marginRight))) < 2;
        look = `background:${bg || "#003792"};color:${bg ? tc.color : "#fff"};font-family:${tc.fontFamily};font-size:${fs}px;font-weight:${tc.fontWeight};` +
          `min-height:${hh}px;padding:0 ${Math.max(px(c.paddingRight), 8)}px 0 ${padL}px;` +
          `width:${fill ? "auto" : hw + "px"};margin:${gap}px ${c.marginRight} ${gap}px ${c.marginLeft};`;
      }
      d.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;box-sizing:border-box;border-radius:0;line-height:1.5;text-align:left;" + look;
      const msg = document.createElement("span");
      msg.style.cssText = "flex:1 1 0;min-width:0;" + (cartCenter ? "text-align:center;" : "");   // 狭い画面では文字の方を折り返し、アイコンは同じ行の右端に残す
      msg.textContent = r.ok ? `JP RUSH｜カート ${r.n}点・${r.stores}店舗（${T(r.at)} に読み取り）` : `JP RUSH：${r.why}`;
      d.appendChild(msg);
      let right0 = null, warn0 = null;
      if (r.ok) {
        const right = document.createElement("span"), say = document.createElement("span"), cb = document.createElement("button");
        right0 = right;
        right.style.cssText = "flex:none;margin-left:auto;display:inline-flex;align-items:center;gap:6px;";
        say.className = "jprush-cartsay", say.style.cssText = "font-size:12px;opacity:.9;";
        cb.type = "button", cb.className = "jprush-cartcopy", cb.innerHTML = ICON_COPY, cb.title = "AI用にコピー", cb.setAttribute("aria-label", "AI用にコピー");
        cb.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;margin:0;border:0;border-radius:0;background:transparent;color:inherit;cursor:pointer;";
        cb.onclick = () => copyCartText(cb, r.at, (t) => { say.textContent = t; }), right.append(say, cb), d.appendChild(right);
        const warn = document.createElement("span");
        warn.className = "jprush-cartold", warn.hidden = true, warn.textContent = "1時間以上前の表示です。再読み込みしてください（カートは1時間で消えます）", warn.style.cssText = "flex-basis:100%;color:#ffd54a;";
        d.appendChild(warn);
        warn0 = warn;
        const chk = () => { warn.hidden = w() - r.at <= 60 * 6e4; d.parentNode && right0 && right0.dataset.moved && (d.parentNode.style.display = warn.hidden ? "none" : ""); };
        setInterval(chk, 6e4), document.addEventListener("visibilitychange", chk), window.addEventListener("pageshow", chk), chk();
      }
      // 4.10.145：下に動かして帯が画面の上から出たら、画面の一番上に貼り付ける。元の場所が見えたら戻す（元の場所には同じ高さの空きを残すので、ページはずれない）
      const ph = document.createElement("div");
      ph.className = "jprush-cartph", ph.style.cssText = "display:flow-root;margin:0;padding:0;";
      h && h.parentNode ? h.parentNode.insertBefore(ph, h) : document.body.prepend(ph);
      ph.appendChild(d);
      let fx = null, raf = 0;
      const unfix = () => {
        if (!fx) return;
        d.style.cssText = fx.css, ph.style.height = "", d.classList.remove("jprush-cartfixed"), fx = null;
      };
      const follow = () => {
        raf = 0;
        const pr = ph.getBoundingClientRect();
        if (!fx) {
          const br = d.getBoundingClientRect();
          if (br.top >= 0) return;
          fx = { css: d.style.cssText, mt: parseFloat(getComputedStyle(d).marginTop) || 0, ml: br.left - pr.left, w: br.width };
          ph.style.height = pr.height + "px";
          d.style.position = "fixed", d.style.top = "0px", d.style.margin = "0", d.style.width = fx.w + "px", d.style.zIndex = "2147483000", d.classList.add("jprush-cartfixed");
        }
        if (pr.top + fx.mt >= 0) return unfix();
        d.style.left = pr.left + fx.ml + "px";
      };
      const later = () => { raf || (raf = requestAnimationFrame(follow)); };
      window.addEventListener("scroll", later, { passive: true }), window.addEventListener("resize", () => { unfix(), later(); }), later();
      // 4.10.203：読み取れた時は、コピーを「通信販売 ORDER」の帯（無ければ「ショッピングカート」の見出し）の右端に入れ、JP RUSH の帯は隠す（1時間を過ぎた注意の時だけ出す）
      // 4.10.242：「通信販売 ORDER」の帯は「ショッピングカート」見出しのすぐ上にある時だけ使う（スマホではページの別の所の「通信販売」に入ってしまうため）
      const ob0 = r.ok && right0 ? cartOrderBar() : null, obr = ob0 && ob0.getBoundingClientRect(), hr0 = h && h.getBoundingClientRect();
      // 4.10.243：スマホ版（見出しが中央寄せ）は、コピーを画面の右下の丸いアイコンにする（左下のじゃんぱらの丸いカートと左右対称）
      if (cartCenter && r.ok && right0) {
        let sz = 56, bot = 24, side = 16, bg = "#fff", sh = "0 2px 8px rgba(0,0,0,.25)";
        try {
          for (const e of document.querySelectorAll("body *")) {
            if (e.closest(".jprush-cartph,#jp3-cart,#jp3-host")) continue;
            const c = getComputedStyle(e);
            if (c.position !== "fixed") continue;
            const b = e.getBoundingClientRect();
            if (!b.width || b.left > 120 || b.bottom < window.innerHeight - 200 || Math.abs(b.width - b.height) > 4 || b.width < 36 || b.width > 90 || parseFloat(c.borderTopLeftRadius) < b.width * 0.4) continue;
            sz = Math.round(b.width), bot = Math.round(window.innerHeight - b.bottom), side = Math.round(b.left);
            c.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor) && (bg = c.backgroundColor), c.boxShadow && c.boxShadow !== "none" && (sh = c.boxShadow);
            break;
          }
        } catch (e) {}
        const rb = document.createElement("div"), sayEl = right0.querySelector(".jprush-cartsay"), cbt = right0.querySelector(".jprush-cartcopy");
        rb.className = "jprush-cartround";
        rb.style.cssText = `position:fixed;right:${side}px;bottom:${bot}px;z-index:2147482500;display:flex;align-items:center;gap:8px;flex-direction:row-reverse;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;`;
        cbt.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;padding:0;margin:0;border:0;border-radius:50%;background:${bg};box-shadow:${sh};color:#003792;cursor:pointer;`;
        const svg = cbt.querySelector("svg"); svg && (svg.style.width = svg.style.height = Math.round(sz * 0.42) + "px");
        sayEl.style.cssText = "font-size:12px;color:#fff;background:rgba(0,0,0,.75);padding:4px 8px;border-radius:4px;white-space:nowrap;";
        const sayObs = () => { sayEl.style.display = N(sayEl.textContent) ? "" : "none"; };
        new MutationObserver(sayObs).observe(sayEl, { childList: true, characterData: true, subtree: true }), sayObs();
        rb.append(cbt, sayEl), document.body.appendChild(rb), right0.dataset.moved = "1";
        ph.style.display = warn0 && !warn0.hidden ? "" : "none";
        // 4.10.357：じゃんぱらの窓が開いている間に隠す見張りは外した（働いていなかった・重いだけ）
        return;
      }
      const ob = r.ok && right0 ? (ob0 && obr.width && (!hr0 || obr.bottom <= hr0.top + 2 && hr0.top - obr.bottom < 150) ? ob0 : h) : null;
      if (ob) {
        const txt = [...ob.querySelectorAll("*")].find((x) => x.childElementCount === 0 && N(x.textContent)) || ob;
        getComputedStyle(ob).position === "static" && (ob.style.position = "relative");
        right0.style.cssText = `position:absolute;right:10px;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;gap:6px;z-index:2;color:${getComputedStyle(txt).color};font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;`;
        right0.dataset.moved = "1", right0.classList.add("jprush-cartcopybox"), ob.appendChild(right0);
        ph.style.display = warn0 && !warn0.hidden ? "" : "none";
        // 4.10.205：帯が上に流れて見えなくなったら、コピーだけを小さな箱に入れて画面の上（じゃんぱらの貼り付く帯の下・カートの右端）に貼り付ける
        const inBar = right0.style.cssText, fl = document.createElement("div");
        fl.className = "jprush-cartfloat", fl.style.cssText = `position:fixed;display:none;z-index:2147482500;background:${getComputedStyle(ob).backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(ob).backgroundColor) ? getComputedStyle(ob).backgroundColor : "#003792"};padding:0 10px;height:38px;box-sizing:border-box;align-items:center;justify-content:flex-end;`;   // 4.10.206：帯と同じ幅の帯にする（右端にコピー）
        document.body.appendChild(fl);
        let rq = 0;
        const flo = () => {
          rq = 0;
          const b = ob.getBoundingClientRect(), st = stickBottom(), out = b.top < st + 8;   // じゃんぱらの全体を覆う画面の間は出さない
          if (out) {
            // 4.10.206：箱の中では普通の並びに戻す（帯の中の右寄せ・上下中央の指定を外す）
            if (right0.parentNode !== fl) Object.assign(right0.style, { position: "static", right: "auto", top: "auto", transform: "none" }), fl.appendChild(right0);
            // 4.10.207：左右の欄の見出しと同じ高さ（上端は貼り付く帯の下＋8px、高さ38px）にそろえる
            Object.assign(fl.style, { display: "flex", top: st + 8 + "px", left: Math.round(b.left) + "px", width: Math.round(b.width) + "px", right: "auto" });
          } else if (right0.parentNode === fl) right0.style.cssText = inBar, ob.appendChild(right0), fl.style.display = "none";
        };
        const fla = () => { rq || (rq = requestAnimationFrame(flo)); };
        window.addEventListener("scroll", fla, { passive: true }), window.addEventListener("resize", fla), every1s(fla), flo();
      }
    }
    // 4.10.204：上に貼り付いているじゃんぱらの帯（検索の帯など）の下端（無ければ 0）
    // 4.10.364：0.2秒だけ覚えて使い回す（スクロールのたびに1コマ何回も調べていて、ページ全体の並べ直しが起きていた）
    let stickC = { at: 0, v: 0 };
    function stickBottom() { const t = performance.now(); if (t - stickC.at < 200) return stickC.v; stickC = { at: t, v: stickBottom0() }; return stickC.v; }
    function stickBottom0() {
      let stick = 0;
      try {
        for (const e of document.elementsFromPoint(window.innerWidth / 2, 2)) {
          if (e.closest && e.closest("#jp3-host,#jp3-cart,.jprush-cartfloat")) continue;
          for (let a = e; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
            const p = getComputedStyle(a).position;
            if (p === "fixed" || p === "sticky") { const b = a.getBoundingClientRect(); b.top <= 2 && b.width >= window.innerWidth * 0.5 && (stick = Math.max(stick, Math.round(b.bottom))); break; }
          }
        }
      } catch (e) {}
      return stick;
    }
    // 4.10.209：押し間違えやすい所を隠す（場所は空けたまま。見えなく・押せなく）。開いた時に1回だけ
    // 見出しの「クーポン?」「オプション?」の「?」、「（?送料について）」、各商品のオプションの「追加」
    const OMIT = {};
    function cartOmit() {
      const hide = (e, k = "q") => { e && !e.dataset.jpOmit && (e.dataset.jpOmit = k, e.style.visibility = "hidden", e.style.pointerEvents = "none", OMIT[k] = (OMIT[k] || 0) + 1); };
      const lab = (e) => N(e.textContent || e.value || e.getAttribute("alt") || e.getAttribute("title") || "");
      // 同じ文字だけを包んでいる外側の部品（ボタンの箱など）まで上がる
      const up = (e) => { let x = e; while (x.parentElement && x.parentElement.childElementCount === 1 && lab(x.parentElement) === lab(e) && !/^(TD|TH|LI|TR|TABLE|BODY)$/.test(x.parentElement.tagName)) x = x.parentElement; return x; };
      const isQ = (e) => /^[?？]$/.test(lab(e)) || /question|hatena|help|icon_q|ques/i.test(e.getAttribute && (e.getAttribute("src") || "")) || e.tagName === "IMG" && !N(e.getAttribute("alt") || "");
      // 「送料について」のリンク（と、その前の「?」）
      for (const a of document.querySelectorAll("a")) {
        if (a.closest("#jp3-cart,#jp3-host,.jprush-cartbar,.jprush-cartfloat")) continue;
        if (/送料について/.test(lab(a))) { hide(a); const pa = a.parentElement; pa && N(pa.textContent).length <= 20 && pa.querySelectorAll("a,img").forEach((x) => x !== a && hide(x)); }
      }
      // 見出しの「クーポン?」「オプション?」の「?」
      for (const th of document.querySelectorAll("th,td")) {
        const t = N(th.textContent);
        if (!/^(クーポン|オプション)/.test(t) || t.length > 30 || /追加|なし/.test(t)) continue;
        // 4.10.212：商品の行の欄（「追加」のボタンが入力部品・画像で文字に出ないもの）は見出しではない
        if (th.querySelector("input,button,select") || [...th.querySelectorAll("*")].some((x) => /追加|なし|削除/.test(lab(x)))) continue;
        // 4.10.212：見出しの「クーポン」「オプション」の欄は、文字ごと押すと説明が開くので、欄ごと押せなくする
        // 4.10.212：「?」だけでなく文字ごと押すと説明が開くので、見出しの「クーポン?」「オプション?」の欄は押しても反応しないようにする（見た目はそのまま）
        th.style.pointerEvents = "none", th.dataset.jpOmit = th.dataset.jpOmit || "cell";
        // 4.10.215：欄の上に透明な板をかぶせて、押しても受け止める（じゃんぱら側が中の「?」だけ押せるように指定していても届かない）
        if (!th.querySelector(".jprush-shield")) {
          getComputedStyle(th).position === "static" && (th.style.position = "relative");
          const sh = document.createElement("div");
          sh.className = "jprush-shield", sh.style.cssText = "position:absolute;inset:0;z-index:2147480000;background:transparent;pointer-events:auto;cursor:default;";
          for (const ev of ["click", "mousedown", "mouseup", "touchstart", "touchend", "pointerdown", "pointerup"]) sh.addEventListener(ev, (e) => { e.stopPropagation(); ev === "click" && e.preventDefault(); }, { capture: true, passive: ev.startsWith("touch") ? true : false });
          th.appendChild(sh), OMIT.cell = (OMIT.cell || 0) + 1;
        }
        // 4.10.210：「?」は a・img とは限らない（span などの絵の部品もある）。文字が「?」か空の、中身の無い部品を隠す
        for (const x of th.querySelectorAll("*")) {
          if (x.tagName === "BR" || x.childElementCount) continue;
          const tx = lab(x);
          (x.tagName === "IMG" || !tx || /^[?？]$/.test(tx)) && hide(up(x));
        }
      }
      // 4.10.216：各商品の行の「クーポン 追加／オプション 追加・なし」の欄にも透明な板をかぶせる（どちらの「追加」も反応しない）
      for (const td of document.querySelectorAll("td,th")) {
        if (td.closest("#jp3-cart,#jp3-host") || td.querySelector(".jprush-shield")) continue;
        const t = N(td.textContent);
        if (!/^クーポン/.test(t) || !/オプション/.test(t) || t.length > 40 || /削除/.test(t)) continue;
        getComputedStyle(td).position === "static" && (td.style.position = "relative");
        const sh = document.createElement("div");
        sh.className = "jprush-shield", sh.style.cssText = "position:absolute;inset:0;z-index:2147480000;background:transparent;pointer-events:auto;cursor:default;";
        for (const ev of ["click", "mousedown", "mouseup", "touchstart", "touchend", "pointerdown", "pointerup"]) sh.addEventListener(ev, (e) => { e.stopPropagation(); ev === "click" && e.preventDefault(); }, { capture: true, passive: ev.startsWith("touch") });
        td.appendChild(sh), OMIT.cell = (OMIT.cell || 0) + 1;
        // クーポンの「追加」だけ、真ん中に小さな窓（18×18）を開ける。窓を押した時だけ本物の「追加」を押す
        const cands = [...td.querySelectorAll("input,button,a,span,div")].filter((e) => !e.closest(".jprush-shield") && N(e.value || e.textContent) === "追加");
        const outer = cands.filter((e) => !cands.some((o) => o !== e && o.contains(e)));
        const cb = outer.find((e) => { const r = document.createRange(); r.setStart(td, 0), r.setEndBefore(e); const pre = N(r.toString()); return /クーポン/.test(pre) && !/オプション/.test(pre); });
        if (cb) {
          const win = document.createElement("div"), H = 18;
          win.className = "jprush-shield jprush-cwin", win.style.cssText = `position:absolute;width:${H}px;height:${H}px;z-index:2147480001;background:transparent;border:1px dashed rgba(0,55,146,.45);box-sizing:border-box;pointer-events:auto;cursor:pointer;`;
          const place = () => { const tr = td.getBoundingClientRect(), br = cb.getBoundingClientRect(); win.style.display = br.width ? "" : "none"; win.style.left = Math.round(br.left + br.width / 2 - tr.left - td.clientLeft - H / 2) + "px", win.style.top = Math.round(br.top + br.height / 2 - tr.top - td.clientTop - H / 2) + "px"; };
          for (const ev of ["mousedown", "mouseup", "touchstart", "touchend", "pointerdown", "pointerup"]) win.addEventListener(ev, (e) => e.stopPropagation(), { capture: true, passive: true });
          win.addEventListener("click", (e) => { e.stopPropagation(), e.preventDefault(), cb.click(); }, true);
          td.appendChild(win), place(), window.addEventListener("resize", place, { passive: true }), setTimeout(place, 600);
        }
      }
      // 各商品のオプションの「追加」：直前の文字が「オプション」のもの（クーポンの「追加」は残す）
      // 4.10.210：「追加」は span・div のこともあるので、文字が「追加」だけの部品を全部見る（ボタンの箱まで上がって隠す）
      for (const b0 of document.querySelectorAll("*")) {
        if (b0.childElementCount && !/^(INPUT|BUTTON)$/.test(b0.tagName) || lab(b0) !== "追加" || b0.closest("#jp3-cart,#jp3-host")) continue;
        const b = up(b0);
        let cell = b.parentElement;
        for (let k = 0; k < 6 && cell && cell !== document.body && !/オプション/.test(cell.textContent); k++) cell = cell.parentElement;
        if (!cell || cell === document.body) continue;
        const tw = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        let prev = "";
        for (let n = tw.nextNode(); n; n = tw.nextNode()) {
          if (b.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) break;
          if (b.contains(n)) break;
          N(n.nodeValue) && (prev = N(n.nodeValue));
        }
        /オプション/.test(prev) && hide(b, "opt");
      }
    }
    // 「通信販売 ORDER」の帯（ショッピングカートの見出しより上にある、同じくらいの幅の帯）
    // 4.10.358：帯も一度見つけたら覚えておく。見つからない時も2秒は探し直さない（スクロールのたびに探していて重かった）
    let orderBarC = null, orderBarAt = 0;
    function cartOrderBar() {
      if (orderBarC && orderBarC.isConnected) return orderBarC;
      if (!orderBarC && Date.now() - orderBarAt < 2e3) return null;
      orderBarAt = Date.now();
      return (orderBarC = cartOrderBarFind());
    }
    function cartOrderBarFind() {
      const h = cartHead(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        const el = n.parentElement;
        if (!el || !/^\s*通信販売/.test(n.nodeValue) || el.closest(".jprush-cartbar,#jp3-cart") || !el.getClientRects().length) continue;
        let b = el;
        while (b.parentElement && b.parentElement !== document.body) { const pt = N(b.parentElement.textContent); if (!/^通信販売/.test(pt) || pt.length > 40) break; b = b.parentElement; }
        if (h && !(b.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        return b;
      }
      return null;
    }
    // 4.10.143：商品ページを見えない枠で開いて読む（同じサイトの中だけ）。枠の中ではこのスクリプトは動かない（名前で見分ける）。記録は書かない
    const FETCH_NAME = "jprush-fetch";
    function fetchDetail(it) {
      return new Promise((res) => {
        const f = document.createElement("iframe");
        let fin = false, tm = 0, poll = 0;
        const parse = () => {
          const d = f.contentDocument;
          if (!d || !d.body || !/^https?:/.test(d.URL) || d.readyState === "loading") return null;
          // 4.10.145：まず商品ページの作り（札の画像・商品について の欄・カートに入れるボタン）から読む。読めない時だけ、今までの文字の読み方
          const du = detailUnit(d, it.code), P = du ? null : kn(Sn(d.body)), u = P ? P.units.find((x) => String(x.code) === it.code) || null : null;
          return { ok: true, at: w(), du, unit: u, title: N(String(d.title || "").split(/[|｜]/)[0]).replace(/の詳細$/, "") };
        };
        const end = (v) => {
          if (fin) return;
          v && v.ok && lgCond(it.code, v.du, v.unit, { name: v.title || "", price: (v.du && v.du.price) || (v.unit && v.unit.price) || "", shop: (v.unit && v.unit.store) || "", st: v.du ? ({ 在庫あり: "stock", 商談中: "nego", 完売: "sold" })[v.du.status] || "" : v.unit ? (v.unit.sold ? "sold" : v.unit.nego ? "nego" : "stock") : "" });   // 4.10.347・348：カートのコピーで読んだ状態・価格・在庫も台帳へ
          fin = true, clearTimeout(tm), clearInterval(poll), f.remove(), res(v);
        };
        const tryParse = (last) => {
          let v = null;
          try { v = parse(); } catch (e) { v = last ? { ok: false, why: "読み取れませんでした" } : null; }
          if (v && (v.du || v.unit || last)) end(v);
          else if (last) end({ ok: false, why: last === "timeout" ? "時間切れ" : "読み取れませんでした" });
        };
        tm = setTimeout(() => tryParse("timeout"), 25e3);
        poll = setInterval(() => tryParse(false), 500);
        f.onload = () => tryParse(true);
        f.name = FETCH_NAME, f.tabIndex = -1, f.setAttribute("aria-hidden", "true");
        f.style.cssText = "position:fixed;left:-10000px;top:0;width:1024px;height:900px;border:0;opacity:0;pointer-events:none;";
        f.setAttribute("sandbox", "allow-same-origin");   // 4.10.351：商品ページの中のプログラム（広告・分割払いの案内など）は動かさない。判定に使う所はページの元の文章で同じ（実物で確認）。1件 5〜6秒 → 2秒ほど
        f.src = it.url;
        document.body.appendChild(f);
      });
    }
    // 4.10.145：商品ページ（PC版・スマホ版）の、その商品番号の欄から直接読む。
    // 区分・ランク・付属品・保証は札の画像（icon_con・icon_fac・icon_acc・icon_grt の alt）、状態説明は「商品について」の欄、在庫は「カートに入れる」の有無
    function textLines(el) {
      const c = el.cloneNode(true);
      c.querySelectorAll("script, style").forEach((x) => x.remove());
      c.querySelectorAll("br").forEach((b) => b.replaceWith("\n"));
      c.querySelectorAll("p, div, li, dd, dt").forEach((b) => b.append("\n"));
      return c.textContent.split("\n").map(N).filter(Boolean);
    }
    function detailUnit(d, code) {
      if (!d || !d.body) return null;
      const re = new RegExp("商品番号\\s*[：:]\\s*" + code + "(?!\\d)"), tw = d.createTreeWalker(d.body, NodeFilter.SHOW_TEXT);
      let n = tw.nextNode();
      while (n && !re.test(n.nodeValue)) n = tw.nextNode();
      if (!n) return null;
      const many = (el) => (el.textContent.match(/商品番号\s*[：:]/g) || []).length > 1;
      let root = n.parentElement;
      for (let x = root; x && x !== d.body; x = x.parentElement) {
        if (many(x)) break;
        root = x;
        if (x.querySelector(".item_icons, .itemdetail_comment, dl.item_info")) break;
      }
      const icons = [...root.querySelectorAll(".item_icons img, img.kbn")].map((g) => ({ src: g.getAttribute("src") || "", alt: N(g.getAttribute("alt")) })).filter((g) => g.alt);
      const pick = (sre, are) => (icons.find((g) => sre.test(g.src)) || icons.find((g) => are.test(g.alt)) || {}).alt || "";
      const cond = pick(/icon_con/, /^(中古|未使用|新品|アウトレット)/), rank = pick(/icon_fac/, /ランク/);
      const acc = pick(/icon_acc/, /^(全付|一部付|付属品)/), grt = pick(/icon_grt/, /^[0-9０-９]+\s*(ヶ月|か月|カ月|週間|日|年)/);
      let cm = root.querySelector(".itemdetail_comment");
      if (!cm) {
        const dt = [...root.querySelectorAll("dt")].find((x) => /商品について/.test(x.textContent));
        cm = dt && dt.nextElementSibling;
      }
      const lines = (cm ? textLines(cm) : []).concat(...[...root.querySelectorAll(".salenotes")].map(textLines));
      const pe = root.querySelector(".detail_item_money, .money"), txt = N(root.textContent);
      const status = root.querySelector('form[action*="cart/add"]') ? "在庫あり" : /商談中/.test(txt) ? "商談中" : /完売|SOLD\s*OUT|売り?切れ|品切れ/i.test(txt) ? "完売" : "不明（カートに入れるボタンがありません）";
      return { code, cond, rank, acc, grt, lines, price: pe ? N(pe.textContent) : "", status };
    }
    function duLines(du) {
      const L = [], rk = (du.rank.match(/ランク\s*([A-DＡ-ＤS])/) || [])[1];
      L.push(`ランク：${rk ? rk + (du.cond ? `（${du.cond}）` : "") : du.cond || "記載なし"}`);
      L.push(`保証：${du.grt || "記載なし"}`);
      const lines = du.lines.filter((x) => !NO_ID.test(x)), al = lines.find((x) => /^付属品?\s*[:：]/.test(x)), accT = al ? al.replace(/^付属品?\s*[:：]\s*/, "") : "";
      const cond = lines.filter((x) => x !== al);
      if (!cond.length) L.push("状態説明：記載なし");
      else if (cond.length === 1) L.push(`状態説明：${cond[0].replace(/^(状態説明|商品状態|状態)\s*[:：]\s*/, "")}`);
      else L.push("状態説明：", ...cond.map((x) => `  ${x}`));
      L.push(`付属品：${du.acc && accT ? `${du.acc}（${accT}）` : du.acc || accT || "記載なし"}`);
      L.push(`在庫：${du.status}`);
      return L;
    }
    // 商品ページの記載（1個体分）を、査定に使う項目に分ける。IMEI・シリアルは入れない
    const NO_ID = /IMEI|シリアル|製造番号|S\/N|MEID/i;
    function unitLines(u) {
      const L = [], badges = String(u.badges || ""), specs = (u.specs || []).filter(([k, v]) => !NO_ID.test(k + v)), notes = (u.notes || []).filter((s) => !NO_ID.test(s));
      const rank = bt(badges), cls = (badges.match(/^(中古|新品|未使用|アウトレット)/) || [])[1] || "";
      L.push(`ランク：${rank || "記載なし"}${cls ? `（${cls}）` : ""}`);
      const wk = specs.find(([k]) => /保証/.test(k)), wb = badges.match(/([0-9０-９]+\s?[ヶか]月|[0-9０-９]+\s?日)\s*(?:間)?\s*保証|保証\s*[:：]?\s*([0-9０-９]+\s?[ヶか]月|[0-9０-９]+\s?日|なし)/);
      L.push(`保証：${wk ? wk[1] : wb ? (wb[1] || wb[2]) : "記載なし"}`);
      const ak = specs.find(([k]) => /付属/.test(k)), an = notes.find((s) => /^付属品?\s*[:：]/.test(s));
      const cond = notes.filter((s) => s !== an).map((s) => s.replace(/^(状態説明|商品状態|状態)\s*[:：]\s*/, "")).filter(Boolean);
      if (!cond.length) L.push("状態：記載なし");
      else if (cond.length === 1) L.push(`状態：${cond[0]}`);
      else L.push("状態：", ...cond.map((s) => `  ・${s}`));
      L.push(`付属品：${ak ? ak[1] : an ? an.replace(/^付属品?\s*[:：]\s*/, "") : "記載なし"}`);
      return L;
    }
    function cartCopyText(P, R, now, loadedAt) {
      const L = [], price = (it) => (it.amts.length ? it.amts[it.amts.length - 1] : null);
      const sum = P.items.reduce((s, it) => s + (price(it) || 0), 0) + P.stores.reduce((s, x) => s + (x.ship || 0), 0);
      // 同じ店舗の送料は点数で均等に割る（割り切れない端数は上の商品から1円ずつ）
      const share = new Map();
      for (const s of P.stores) {
        const its = P.items.filter((it) => it.store === s.name);
        if (s.ship == null) continue;
        const base = Math.floor(s.ship / its.length);
        its.forEach((it, k) => share.set(it.code, base + (k < s.ship - base * its.length ? 1 : 0)));
      }
      L.push(`JP RUSH｜${ht(now)}`);
      L.push(`カート${P.items.length}点 / ${P.stores.length}店舗 / 総額 ${A(P.grand != null ? P.grand : sum)}（送料込み${P.grand != null ? "・ページの総合計" : "・計算"}）`);
      now - loadedAt > 60 * 6e4 && L.push(`※カートのページは ${ht(loadedAt)} に開いたもの（1時間以上前。中身が変わっている可能性あり）`);
      const DS = E("details", {}) || {};
      P.items.forEach((it, i) => {
        const r = R[i] || { ok: false, why: "未取得" }, p = price(it), sh = share.get(it.code);
        L.push("", `${String(i + 1).padStart(2, "0")}｜${it.name || r.title || "（商品名を読み取れませんでした）"}`);
        L.push(`店舗：${it.store || "未取得"}`);
        L.push(`価格：${p == null ? "未取得" : A(p)}｜送料按分：${sh == null ? "未取得" : A(sh)}`);
        L.push(`仕入原価：${p != null && sh != null ? A(p + sh) : "未取得"}`);
        if (r.ok && r.du) {
          L.push(...duLines(r.du));
          r.fromLg && L.push(`※状態は ${T(r.at)} に商品ページを読んだ記録（30分以内なので読み直していません）`);
          const dp = It(r.du.price);
          dp != null && it.amts.length && dp !== it.amts[0] && L.push(`※商品ページの価格は ${A(dp)}（カートの単価と違います）`);
          L.push(it.url);
          return;
        }
        let u = r.ok ? r.unit : null, src = r.ok ? `商品ページ ${T(r.at)} 確認` : "";
        if (!u) {
          // 読み込めなかった時は、前にこの端末で商品ページを開いたときの記録を使う（あれば）
          const rec = DS.v === 2 ? dget(DS, "S" + it.code) : DS["S" + it.code], old = rec && rec.units ? rec.units.find((x) => String(x.code) === it.code) : null;
          if (old) u = old, src = `商品ページを読み込めず、前に開いたときの記録 ${ht(rec.at)}`;
        }
        if (u) {
          L.push(...unitLines(u));
          const dp = It(u.price);
          (u.sold || u.nego) && L.push(`※商品ページでは${u.sold ? "完売" : "商談中"}になっています（${src}）`);
          !r.ok && L.push(`※${src}`);
          dp != null && it.amts.length && dp !== it.amts[0] && L.push(`※商品ページの価格は ${A(dp)}（カートの単価と違います）`);
        } else if (r.ok) {
          L.push("ランク・保証・状態・付属品：未取得（商品ページにこの商品番号が出ていません。完売・取り置きの可能性）");
        } else {
          L.push(`ランク・保証・状態・付属品：未取得（商品ページを読み込めませんでした：${r.why}）`);
        }
        L.push(it.url);
      });
      return L.join("\n");
    }
    function writeClip(text, ok, ng) {
      const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = text, ta.style.position = "fixed", ta.style.opacity = "0", document.body.appendChild(ta), ta.select();
        let r = false;
        try { r = document.execCommand("copy"); } catch (e) { r = false; }
        ta.remove(), r ? ok() : ng();
      };
      navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(ok, fallback) : fallback();
    }
    // 4.10.143：コピーを押したら、カートの商品ページを3つずつ読み込んでから、商品ごとの形でコピーする。
    // 読み込みに時間がかかってコピーが断られた時は、もう一度押すとそのままコピーする（読み直さない）
    let cartReady = null;
    async function copyCartText(btn, loadedAt, say) {
      if (btn.disabled) return;
      const reset = () => setTimeout(() => say(""), 2500);
      if (cartReady) {
        const t = cartReady;
        writeClip(t, () => { cartReady = null, say("コピーしました"), reset(); }, () => say("コピーできませんでした"));
        return;
      }
      const P = cartParse(), now = w();
      if (!P.items.length) {
        say("商品を読み取れませんでした"), reset();
        return;
      }
      btn.disabled = true;
      const R = new Array(P.items.length);
      let k = 0, n = 0;
      const show = () => say(`読み込み中 ${n}/${P.items.length}`);
      show();
      // 4.10.349：30分以内に商品ページを読んだ商品は、台帳の記録を使って読み直さない
      const LG = await lgMany(P.items.map((it) => it.code)).catch(() => new Map()), STJ = { stock: "在庫あり", nego: "商談中", sold: "完売", cart: "カート内" };
      const fromLg = (it) => {
        const L = LG.get(String(it.code)), C = L && L.cond;
        if (!C || !C.at || w() - C.at > 18e5 || !(C.cond || C.rank)) return null;
        return { ok: true, at: C.at, fromLg: 1, title: L.name || "", du: { code: it.code, cond: C.cond || "", rank: C.rank || "", acc: C.acc || "", grt: C.grt || "", lines: C.notes || [], price: L.price ? A(L.price) : "", status: STJ[L.st] || "不明" } };
      };
      let reused = 0;
      const worker = async () => {
        while (k < P.items.length) {
          const i = k++, c = fromLg(P.items[i]);
          c ? (R[i] = c, reused++) : (R[i] = await fetchDetail(P.items[i])), n += 1, show();
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      btn.disabled = false;
      const text = cartCopyText(P, R, now, loadedAt);
      writeClip(text, () => { say("コピーしました"), reset(); }, () => { cartReady = text, say("読み込み完了。もう一度押してコピー"); });
    }
    function At(t) {
      let e = 2166136261;
      for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
      return (e >>> 0).toString(16) + "-" + t.length;
    }
    const I = (t) => "s." + At(t), Lt = (t) => "hourly." + At(t), tt = (t) => "test." + At(t);
    // 4.10.88：商品の番号を取り出すのは同じURLに何度も行うので、結果を覚えておく（件数の多いページで速くなる）
    const etMemo = new Map(), MMemo = new Map(), URL_MEMO_MAX = 50000;
    function et(t) {
      if (etMemo.has(t)) return etMemo.get(t);
      const v = etRaw(t);
      if (etMemo.size >= URL_MEMO_MAX) etMemo.clear();
      etMemo.set(t, v);
      return v;
    }
    function etRaw(t) {
      const e = new URL(t, location.origin);
      for (const [n, o] of [["ITMCODE", "I"], ["SRCODE", "S"]]) {
        const s = e.searchParams.get(n);
        if (s && /^\d{1,18}$/.test(s)) return o + s;
      }
      return null;
    }
    // 戻り値は読むだけ（呼び出し側は書き換えない）
    function M(t) {
      if (MMemo.has(t)) return MMemo.get(t);
      const v = MRaw(t);
      if (MMemo.size >= URL_MEMO_MAX) MMemo.clear();
      MMemo.set(t, v);
      return v;
    }
    function MRaw(t) {
      const e = new URL(t, location.origin), n = [];
      for (const [o, s] of [["ITMCODE", "I"], ["SRCODE", "S"]]) {
        const i = e.searchParams.get(o);
        i && /^\d{1,18}$/.test(i) && n.push(s + i);
      }
      return n;
    }
    function D(t) {
      const e = [];
      for (const [n, o] of new URL(t).searchParams) if (!(/^(PAGE|LINE|cache_key|viewmodechange|ga4_.*)$/i.test(n) || !o)) if (/^CONKBN(?:\[\d*\])?$/.test(n)) for (const s of o.split(",")) s && e.push(["CONKBN", s]);
      else e.push([n, o]);
      return JSON.stringify(e.sort((n, o) => n[0].localeCompare(o[0]) || n[1].localeCompare(o[1])));
    }
    function Rt() {
      const t = Number(new URL(location.href).searchParams.get("PAGE") || 1);
      return Number.isInteger(t) && t >= 1 ? t : 1;
    }
    function Ge(t) {
      const e = Number(new URL(location.href).searchParams.get("LINE"));
      if (Number.isInteger(e) && e > 0) return e;
      for (const n of t.querySelectorAll("select")) {
        const o = n.options && n.options[n.selectedIndex], s = N(o && o.textContent).match(/^(\d+)\s*件?$/);
        if (s) return Number(s[1]);
      }
      return null;
    }
    // 4.10.150：今のページ／全ページ数（「該当件数」と1ページの件数から。分からない時は今のページだけ）。全ページ数は開き直すまで変わらないので1回だけ数える
    let pgTotal = null;
    function pgLabel() {
      if (pgTotal == null && document.body) {
        const c = tn(document.body.textContent), l = Ge(document);
        c && l && (pgTotal = Math.max(1, Math.ceil(c / l)));
      }
      return pgTotal ? `${Rt()} / ${pgTotal}` : `${Rt()}ページ目`;
    }
    function Pgo(p) {
      const u = new URL(location.href);
      return u.searchParams.set("PAGE", String(p)), u.hash = "", u.href;
    }
    function Ye() {
      const t = new URL(location.href);
      return t.searchParams.set("LINE", "120"), t.searchParams.set("ORDER", "4"), t.searchParams.set("PAGE", "1"), t.hash = "", t.href;
    }
    function Je() {
      const t = new URL(location.href).searchParams;
      return t.get("LINE") === "120" && t.get("ORDER") === "4" && Number(t.get("PAGE") || 1) === 1;
    }
    function Xe() {
      const t = new URL(location.href);
      return t.searchParams.set("PAGE", "1"), t.hash = "", t.href;
    }
    function Ze(t) {
      const e = (o) => typeof o.className == "string" ? o.className.trim().split(/\s+/).filter(Boolean).join(".") : "", n = [t.tagName.toLowerCase() + (e(t) ? "." + e(t) : "")];
      for (const o of [...t.querySelectorAll("*")].slice(0, 14)) n.push(o.tagName.toLowerCase() + (e(o) ? "." + e(o) : ""));
      return [...new Set(n)].join(" ").slice(0, 300);
    }
    // 4.10.128：カードの文字（JP RUSH が足した印の中は除く）。写しを作って印を消す代わりに、印の中だけ飛ばして文字を集める（できる文字は同じ）
    const IE_SKIP = ".jp3-sold, .jp3-hist, .jp3-tag, .jp3-cart, .jp3-srcode", IE_F = { acceptNode: (n) => n.nodeType === 1 && n.matches(IE_SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT };
    function ie(t) {
      const tw = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, IE_F);
      let s = "";
      for (let n = tw.nextNode(); n; n = tw.nextNode()) n.nodeType === 3 && (s += n.data);
      return N(s);
    }
    // 4.10.271：スマホ版の検索結果（.search_item_box）を、PC版と同じ形で読めるようにする。
    // 商品名のリンクに PC版の目印（search_itemlink）を付け、名前を .search_itemname で包み、在庫・SOLD OUT・状態と価格・写真を
    // 見えない写し（.jp3-mirror）としてリンクの中に入れる。ページの見た目は変えない（写しは表示しない）
    function phoneAdapt() {
      if (document.querySelector("a.search_itemlink")) return;
      const first = document.querySelector(".search_item_box");
      if (!first || !first.parentElement) return;
      let n = 0;
      for (const box of first.parentElement.querySelectorAll(":scope > .search_item_box")) {
        const a = box.querySelector(".item_name a[href*='/sale/search/detail/']");
        if (!a || a.classList.contains("search_itemlink")) continue;
        const nm = N(a.textContent), sp = document.createElement("span");
        sp.className = "search_itemname", sp.textContent = nm, a.replaceChildren(sp), a.classList.add("search_itemlink");
        const mir = document.createElement("span"), pr = box.querySelector(".search_itemprice");
        mir.className = "jp3-mirror", mir.style.display = "none", mir.setAttribute("aria-hidden", "true");
        const st = document.createElement("span");
        st.className = "search_itemprice";
        const so = pr && pr.querySelector(".search_nostock"), stk = pr && [...pr.children].find((x) => /個の在庫/.test(x.textContent));
        st.textContent = so ? N(so.textContent) : stk ? N(stk.textContent) : "";
        mir.appendChild(st);
        for (const r of pr ? pr.querySelectorAll(".txtright") : []) {
          const p = r.querySelector(".price"), cd = N([...r.childNodes].filter((x) => x !== p).map((x) => x.textContent).join(""));
          if (!p || !cd) continue;
          const c1 = document.createElement("span"), c2 = document.createElement("span");
          c1.className = "search_itemcondition", c1.textContent = cd, c2.className = "item_amount", c2.textContent = N(p.textContent);
          mir.append(c1, c2);
        }
        const im = box.querySelector(".item_image img");
        if (im) { const ic = document.createElement("img"); ic.src = im.currentSrc || im.src, ic.alt = "", ic.style.display = "none"; mir.appendChild(ic); }
        a.appendChild(mir), n++;
      }
      DIAG.steps.phone = n + "件";
    }
    function Qe(t) {
      const e = new URL(t.getAttribute("href"), location.href).href, n = new URL(e);
      if (n.origin !== location.origin || !Qt.test(n.pathname)) throw new Error("\u5546\u54C1\u30EA\u30F3\u30AF\u306E\u5F62\u5F0F\u304C\u5909\u308F\u3063\u3066\u3044\u307E\u3059\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      const o = et(e), s = N(t.querySelector(".search_itemname")?.textContent), i = ie(t), c = ee.test(i), l = N(t.querySelector(".search_itemprice")?.textContent || i).match(/([\d,]+)\s*個の在庫/), r = c ? 0 : l ? Number(l[1].replace(/,/g, "")) : null, p = {};
      for (const u of t.querySelectorAll(".search_itemcondition")) {
        const a = N(u.textContent);
        let h = u.nextElementSibling;
        for (; h && !h.matches(".item_amount,.search_itemcondition"); ) h = h.nextElementSibling;
        const b = h && h.matches(".item_amount") && h.textContent.match(/[¥￥]\s*([\d,]+)/);
        b && a && (p[a] = Number(b[1].replace(/,/g, "")));
      }
      if (!o || !s || !c && (r === null || !Object.keys(p).length)) throw new Error(`\u5546\u54C1\u30AB\u30FC\u30C9\u306E\u5F62\u5F0F\u304C\u60F3\u5B9A\u3068\u9055\u3044\u307E\u3059\uFF08\u69CB\u6210\uFF1A${Ze(t)}\uFF09\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093`);
      const m = t.querySelector("img");
      return { id: o, name: s, soldOut: c, stock: r, prices: p, url: e, img: m && (m.currentSrc || m.src) || "" };
    }
    function re(t) {
      for (const e of t.querySelectorAll("select")) {
        const n = e.options && e.options[e.selectedIndex] || e.querySelector("option[selected]"), o = N(n && n.textContent);
        if (o && /順/.test(o)) return o;
      }
      return null;
    }
    function tn(t) {
      const e = N(t).match(/該当件数\s*[：:]\s*([\d,]+)\s*商品/) || N(t).match(/検索結果\s*([\d,]+)\s*件/);   // 4.10.271：スマホ版は「検索結果 ○件」
      return e ? Number(e[1].replace(/,/g, "")) : null;
    }
    function ce(t) {
      const e = re(t);
      if (!e) throw Object.assign(new Error("sort"), { sort: true });
      if (!te.test(e)) {
        const r = new Error(`\u4E26\u3073\u9806\u304C\u300C${e}\u300D\u3067\u3059\u3002\u300C\u65B0\u7740\u9806\u300D\u306B\u3059\u308B\u3068\u8A18\u9332\u304C\u59CB\u307E\u308A\u307E\u3059`);
        throw r.sort = true, r;
      }
      const n = tn(t.textContent);
      if (n === null) throw new Error("\u4EF6\u6570\u306E\u898B\u51FA\u3057\u3092\u8AAD\u3081\u307E\u305B\u3093\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      if (n === 0) throw new Error("\u691C\u7D22\u7D50\u679C\u304C0個\u3067\u3057\u305F\u3002\u4E00\u6642\u7684\u306A\u8868\u793A\u306E\u53EF\u80FD\u6027\u304C\u3042\u308B\u305F\u3081\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      const o = Rt(), s = [...t.querySelectorAll("a.search_itemlink")], i = Ge(t) || (o === 1 ? s.length : null);
      if (!i) throw new Error("1\u30DA\u30FC\u30B8\u306E\u4EF6\u6570\u304C\u5206\u304B\u308A\u307E\u305B\u3093\u3002URL\u306B LINE= \u3092\u4ED8\u3051\u3066\u958B\u3044\u3066\u304F\u3060\u3055\u3044");
      const c = Math.min(i, n - (o - 1) * i);
      if (c <= 0) throw new Error("\u3053\u306E\u30DA\u30FC\u30B8\u756A\u53F7\u306B\u306F\u5546\u54C1\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      if (s.length !== c) throw new Error(`\u3053\u306E\u30DA\u30FC\u30B8\u306F${c}個\u306E\u306F\u305A\u304C${s.length}個\u3067\u3057\u305F\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093`);
      const d = s.map(Qe);
      if (new Set(d.map((r) => r.id)).size !== d.length) throw new Error("\u30DA\u30FC\u30B8\u5185\u306E\u5546\u54C1ID\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      const l = (o - 1) * i + 1;
      return d.forEach((r, p) => {
        r.rank = l + p;
      }), { items: d, total: n, page: o, line: i, startRank: l };
    }
    const le = 25e3;   // 4.10.187：商品ごとの最後の価格は 25,000商品まで（3タブで約2.1万商品を一巡しても消えない）
    function en(t, e) {
      const n = E("lastlive", {});
      let o = false;
      for (const i of t) !i.soldOut && Object.keys(i.prices || {}).length && (n[i.id] = { name: i.name, prices: i.prices, stock: i.stock, at: e }, o = true);
      if (!o) return;
      const s = Object.keys(n);
      s.length > le && s.sort((i, c) => n[i].at - n[c].at).slice(0, s.length - le).forEach((i) => delete n[i]), $("lastlive", n);
    }
    const nn = 90 * 864e5, gt = 3 * 864e5, _t = (t) => pt(t.s, Xt), V = (t) => !!t && !t.ret && !t.rm && !t.sure && (t.tent || t.slot && w() - t.s <= gt);
    const on = (t) => {
      const e = new Date(t);
      return `sold.${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}`;
    }, z = (t) => N(t).replace(/\s+/g, ""), sn = (t) => {
      EC.delete(Ct + t), typeof GM_deleteValue == "function" ? GM_deleteValue(Ct + t) : $(t, null);
    }, q = () => E("sold.months", []);
    function ae() {
      const t = [];
      for (const e of q()) for (const n of Object.values(E(e, null) || {})) t.push(n);
      return t;
    }
    let L = null;
    function Mt(t, e) {
      e ? (t.sure = 1, t.cf = w()) : t.tent = 1;
      const n = on(t.s), o = E(n, null) || {};
      if (o[t.k]) return;
      o[t.k] = t, $(n, o);
      const s = q();
      s.includes(n) || (s.push(n), s.sort(), $("sold.months", s)), L = null;
    }
    function nt(t, e, n) {
      const o = w() - e, s = q().slice(-2);
      for (const i of s) {
        const c = E(i, null) || {};
        for (const [d, l] of Object.entries(c)) if (l.s >= o && (t.includes(l.id) || l.sr && t.includes("S" + l.sr)) && (!n || n(l))) return { m: i, k: d, ch: c, r: l };
      }
      return null;
    }
    const de = (t) => !t.pt && !t.ret;
    function Pt() {
      const t = {};
      for (const e of q().slice(-2)) for (const [n, o] of Object.entries(E(e, null) || {})) if (V(o)) for (const s of [o.id, o.sr ? "S" + o.sr : null]) s && (t[s] = t[s] || []).push({ m: e, k: n });
      return t;
    }
    function ue(t, e, n) {
      const o = E(t, null) || {};
      return V(o[e]) ? (delete o[e].tent, delete o[e].slot, delete o[e].cf, o[e].ret = n || w(), $(t, o), L = null, true) : false;
    }
    function pe() {
      for (const t of q().slice(-2)) {
        const e = E(t, null) || {};
        let n = false;
        for (const o of Object.values(e)) o.tent && w() >= _t(o) && (delete o.tent, o.cf = o.slot = _t(o), n = true);
        n && ($(t, e), L = null);
      }
    }
    function rn(t, e, n) {
      const o = ot(t.prices);
      let s = false;
      for (const { m: i, k: c } of e[t.id] || []) {
        const d = (E(i, null) || {})[c];
        if (!V(d)) continue;
        n - d.s <= gt && (t.id[0] === "S" || o && d.c === o.c && d.p === o.p) && ue(i, c, n) && (s = true);
      }
      return s;
    }
    const bt = (t) => {
      const e = String(t || "").match(/ランク\s*([A-DＡ-ＤS]|未使用)/);
      return e ? e[1].replace(/[Ａ-Ｄ]/, (n) => String.fromCharCode(n.charCodeAt(0) - 65248)) : "";
    }, xt = (t) => String(t || "").replace(/\s.*$/, ""), ot = (t) => {
      const e = Object.entries(t || {}), n = e.find(([o]) => o === "\u4E2D\u53E4") || e[0];
      return n ? { c: n[0], p: n[1] } : null;
    }, It = (t) => {
      const e = String(t || "").match(/[\d,]+/);
      return e ? Number(e[0].replace(/,/g, "")) : null;
    };
    // 4.10.94：詳細ページの記録は1件1つだけ保存する。DS.recs に記録、DS.idx に「ページのIDや個体の番号 → 記録の番号」。
    // 古い形（番号ごとに写しを持つ形）は、初めて読んだときに1回だけこの形に直す
    function dload() {
      const raw = E("details", {});
      if (raw && raw.v === 2) return raw;
      const DS = { v: 2, n: 0, recs: {}, idx: {} }, byJson = new Map();
      for (const k of Object.keys(raw || {})) {
        const j = JSON.stringify(raw[k]);
        let id = byJson.get(j);
        if (!id) id = "r" + (DS.n += 1), byJson.set(j, id), DS.recs[id] = raw[k];
        DS.idx[k] = id;
      }
      if (Object.keys(DS.idx).length) $("details", DS);
      return DS;
    }
    const dget = (DS, k) => DS.recs[DS.idx[k]];
    // 4.10.94：保存の数え方は今と同じ（番号の数が400を超えたら、古い番号から外す）。外れて誰も指さなくなった記録は消す
    function dput(DS, keys, rec) {
      const id = "r" + (DS.n += 1);
      DS.recs[id] = rec;
      for (const k of keys) DS.idx[k] = id;
      const ks = Object.keys(DS.idx);
      if (ks.length > Se) ks.sort((l, r) => DS.recs[DS.idx[l]].at - DS.recs[DS.idx[r]].at).slice(0, ks.length - Se).forEach((l) => delete DS.idx[l]);
      const used = new Set(Object.values(DS.idx));
      for (const k of Object.keys(DS.recs)) used.has(k) || delete DS.recs[k];
      $("details", DS);
    }
    function fe(t, DS) {
      const e = dget(DS, t);
      return !e || !e.units || !e.units.length ? null : e.units.find((n) => "S" + n.code === t) || (e.units.length === 1 ? e.units[0] : null);
    }
    function gk(itm, name) {
      return itm ? "I" + itm : z(name);
    }
    function itmOf(u) {
      return ((M(u).find((p) => p[0] === "I") || "").slice(1));
    }
    function me(t, e) {
      const n = gk(e.itm, e.n), o = t[n] || (t[n] = { n: e.n, itm: [], c: 0, lo: null, hi: null, lp: null, la: 0, ds: 0, dn: 0, rk: {} });
      if (e.ret) return o.rt = (o.rt || 0) + 1, o;
      if (o.c++, e.itm && !o.itm.includes(e.itm) && (o.itm = [...o.itm, e.itm].slice(-5)), e.p != null && (o.lo = o.lo == null ? e.p : Math.min(o.lo, e.p), o.hi = o.hi == null ? e.p : Math.max(o.hi, e.p), e.s >= o.la && (o.lp = e.p), e.r)) {
        const s = o.rk[e.r] || (o.rk[e.r] = [0, null, null]);
        s[0]++, s[1] = s[1] == null ? e.p : Math.min(s[1], e.p), s[2] = s[2] == null ? e.p : Math.max(s[2], e.p);
      }
      return e.s >= o.la && (o.la = e.s), e.d != null && (o.ds += e.d, o.dn++), o;
    }
    function cn() {
      if (w() - E("sold.foldAt", 0) < 864e5) return;
      $("sold.foldAt", w());
      const t = w() - nn, e = E("soldsum", {}), n = [];
      let o = false;
      for (const s of q()) {
        const i = E(s, null) || {};
        let c = false;
        for (const [d, l] of Object.entries(i)) l.s < t && !l.tent && (me(e, l), delete i[d], c = true);
        c && (o = true), Object.keys(i).length ? (n.push(s), c && $(s, i)) : sn(s);
      }
      (o || n.length !== q().length) && ($("soldsum", e), $("sold.months", n), L = null);
    }
    function st() {
      if (L) return L;
      const t = JSON.parse(JSON.stringify(E("soldsum", {}))), e = {};
      for (const [i, c] of Object.entries(t)) e[i] = { c: c.c, lo: c.lo, hi: c.hi };
      const n = ae().sort((i, c) => i.s - c.s), o = {}, s = {};
      for (const i of n) me(i.tent ? s : t, i), (o[gk(i.itm, i.n)] = o[gk(i.itm, i.n)] || []).push(i);
      return L = { sum: t, tent: s, old: e, byName: o, recentCount: n.filter((i) => !i.ret).length, tentCount: n.filter((i) => i.tent).length }, L;
    }
    const he = (t) => t.dn ? `\u58F2\u308C\u308B\u307E\u3067\u7D04${Math.max(0.1, Math.round(t.ds / t.dn * 10) / 10)}\u65E5` : "", it = (t) => t.lo == null ? "\u4FA1\u683C\u4E0D\u660E" : t.lo === t.hi ? A(t.lo) : `${A(t.lo)}\u301C${A(t.hi)}`;
    function ln(t, e) {
      const n = [], o = t && t.c;
      return o && n.push(`\u58F2\u5207\u308C\u5C65\u6B74 ${t.c}\u56DE`, it(t), t.lp != null ? `\u76F4\u8FD1 ${A(t.lp)}\uFF08${mt(t.la)}\uFF09` : "", he(t)), e && e.c && n.push(o ? `\u78BA\u8A8D\u4E2D${e.c}` : `\u58F2\u5207\u308C\u78BA\u8A8D\u4E2D ${e.c}\u56DE\u30FB${it(e)}`), t && t.rt && n.push(`\u623B\u308A${t.rt}\u56DE`), n.filter(Boolean).join("\u30FB");
    }
    const Dt = (t) => ({ schema: 4, signature: t, items: {}, ref: null, cur: null, events: [], log: [], lastAt: 0 });
    function ge(t) {
      const e = E(I(t), null) || Dt(t);
      if (e.signature !== t) throw new Error("\u4FDD\u5B58\u30C7\u30FC\u30BF\u306E\u691C\u7D22\u6761個\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002\u8A18\u9332\u3057\u3066\u3044\u307E\u305B\u3093");
      return e;
    }
    function an(t, e, n, o) {
      const s = [];
      if (!t || e.soldOut) return s;
      const i = { item: e.id, at: n, period: o };
      t.soldOut && e.stock > 0 ? s.push({ ...i, type: "REST", to: e.stock, why: "sold" }) : Number.isFinite(t.stock) && e.stock > t.stock && s.push({ ...i, type: "STOCK", from: t.stock, to: e.stock });
      for (const [c, d] of Object.entries(e.prices || {})) {
        const l = t.prices && t.prices[c];
        Number.isFinite(l) && d < l && s.push({ ...i, type: "PRICE", condition: c, from: l, to: d });
      }
      return s;
    }
    function un(t, e, n, o) {
      const s = new Set(e.items.map((c) => c.id)), i = Pt();
      for (const [c, d] of Object.entries(t.items)) {
        if (!d.soldOut || d.removedAt || s.has(c) || d.lastSeen >= n || !i[c]) continue;
        const l = o[d.lastSeen] || {}, r = l[d.rank - 1], p = l[d.rank + 1];
        if (!(!r || !p || !s.has(r) || !s.has(p))) {
          d.removedAt = n;
          for (const { m, k: u } of i[c]) {
            const a = E(m, null) || {}, h = a[u];
            !V(h) || h.pt || (delete h.tent, delete h.slot, h.cf = n, h.rm = n, $(m, a), L = null);
          }
        }
      }
    }
    function pn(t, e, n) {
      const lv = e.live || {}, o = M(t.url);
      if (nt(o.length ? o : [t.id], 3 * 864e5, de)) return;
      const DS = dload(), s = ot(lv.prices), i = ot(e.fp), c = fe(t.id, DS) || o.map((x) => fe(x, DS)).find(Boolean), d = (o.find((p) => p[0] === "I") || "").slice(1), l = (o.find((p) => p[0] === "S") || "").slice(1) || (c ? c.code : ""), r = e.listAt || 0;
      Mt({ k: `${t.id}@${n}`, id: t.id, itm: d, sr: l, n: t.name, u: t.url, c: s ? s.c : "", p: s ? s.p : c ? It(c.price) : null, p0: i && s && i.c === s.c ? i.p : null, st: lv.stock, f: e.firstSeen, la: r, l: (lv.at || n), s: n, d: r ? Math.round((((lv.at || n) + n) / 2 - r) / 864e5 * 10) / 10 : null, r: c ? bt(c.badges) : "", sh: c ? xt(c.store) : "", su: c ? 1 : 0 });
    }
    function fn(t, e, n) {
      const o = ot(e.live.prices), s = ot(t.prices);
      if (!o || !s || o.c !== s.c || !(t.stock < e.live.stock) || !(s.p > o.p)) return;
      const i = M(t.url);
      Mt({ k: `${t.id}@${n}`, id: t.id, itm: (i.find((c) => c[0] === "I") || "").slice(1), sr: "", n: t.name, u: t.url, c: o.c, p: o.p, p0: null, st: e.live.stock, st2: t.stock, pt: 1, f: e.firstSeen, la: 0, l: e.live.at, s: n, d: null, r: "", sh: "" });
    }
    // 4.10.254：在庫1の機種（ITMCODE）は、一覧の写真の名前から今の1台の番号（8〜9桁）を取って覚える（usr）。じゃんぱらへの読み込みはしない
    const photoCode = (img) => (/(?:^|\/)(\d{8,9})(?!\d)[^/]*$/.exec(String(img || "")) || [])[1] || "";
    // 4.10.251：機種ごとの行（ITMCODE）の状態ごとの最安値（lo）。在庫ありで見るたびに安ければ書き換える。売り切れを挟んでも残る
    function loMerge(a, u, evs) {
      const lo = {}, put = (o) => { for (const [g, v] of Object.entries(o || {})) Number.isFinite(v) && v > 0 && (!(g in lo) || v < lo[g]) && (lo[g] = v); };
      if (a && a.lo) put(a.lo);
      else if (a) {   // まだ無い時は、今までの記録から始める
        put(a.fp), a.live && put(a.live.prices), a.soldOut || put(a.prices);
        for (const e of evs || []) e && e.item === u.id && e.type === "PRICE" && e.condition && Number.isFinite(e.to) && put({ [e.condition]: e.to });
      }
      u.soldOut || put(u.prices);
      return lo;
    }
    function mn(t, e, n) {
      const o = ne(n);
      // 4.10.107：1時間ごとに見た順位は記録（hours）に残し、印はその記録から計算する（印が消えても記録から戻る）。
      // t.cur は、この1時間の戻り・復活の二重付けを防ぐためだけに使う
      if (!t.cur || t.cur.period !== o) t.cur && (t.ref = { period: t.cur.period, at: t.cur.firstAt }), t.cur = { period: o, emitted: {}, firstAt: n };
      t.hours = t.hours || {};
      const obs = t.hours[o] || (t.hours[o] = {});
      if (t.cur.obs) Object.assign(obs, t.cur.obs), delete t.cur.obs;   // 4.10.106 までの保存を引き継ぐ
      const s = [], i = {}, base = Object.keys(t.items).length > 0;
      for (const [u, a] of Object.entries(t.items)) a.rank && ((i[a.lastSeen] = i[a.lastSeen] || {})[a.rank] = u);
      const c = Pt(), d = /* @__PURE__ */ new Set();
      const prevUsr = {}, nowUsr = {};
      for (const u of e.items) {
        const a = t.items[u.id];
        if (u.id[0] === "I") { prevUsr[u.id] = a && a.usr || ""; nowUsr[u.id] = !u.soldOut && u.stock === 1 ? photoCode(u.img) : ""; }
        s.push(...an(a, u, n, o));
        const h = u.soldOut ? a && a.live || null : { prices: u.prices, stock: u.stock, at: n };
        !u.soldOut && rn(u, c, n) && d.add(u.id), u.soldOut ? !(a && a.led) && pn(u, a || {}, n) : !u.soldOut && a && !a.soldOut && a.live && fn(u, a, n);
        const b = a ? a.fp || a.live && a.live.prices || null : u.soldOut ? null : u.prices, C = u.soldOut ? a && a.soldOut && a.soldAt || n : 0;
        // 4.10.124：soldEvAt＝この回に売り切れたのを見た時刻（在庫あり→売り切れ、または初めて見た時点で売り切れ）。戻っても消さない。最初の記録（基準・保存が空のとき）は入れない（新と同じ）。完の積み上げに使う
        t.items[u.id] = { name: u.name, soldOut: u.soldOut, stock: u.stock, prices: u.prices, live: h, fp: b || (u.soldOut ? null : u.prices), listAt: a && a.listAt || 0, soldAt: C, soldEvAt: u.soldOut && (a ? !a.soldOut : base) ? n : (a && a.soldEvAt || 0), url: u.url, img: u.img, rank: u.rank, line: e.line, pn: e.items.length, firstSeen: a ? a.firstSeen : n, lastSeen: n, led: u.soldOut ? 1 : 0, ...(nowUsr[u.id] || a && a.usr ? { usr: nowUsr[u.id] || a.usr } : {}), ...(u.id[0] === "I" ? { lo: loMerge(a, u, t.events) } : {}) }, obs[u.id] = u.rank;   // 4.10.248：usr＝在庫1の時に読んだ、その1台の SRCODE
      }
      // 4.10.334：商品台帳へ（SRCODE が分かる台は1台ずつ、型番ページは型番の索引へ）
      try { for (const u of e.items) { const lo = Object.values(u.prices || {}).filter((x) => x > 0).sort((x, y) => x - y)[0] || 0; if (u.id[0] === "S") lgItem(u.id.slice(1), { name: u.name, url: u.url, img: u.img, price: u.soldOut ? 0 : lo, st: u.soldOut ? "sold" : "stock" }, "list"); else if (u.id[0] === "I") { const g = Number(u.stock) === 1 ? srcodeOf(u.url, u.img) : null; lgItm(u.id.slice(1), { name: u.name, url: u.url, price: lo, stock: u.stock, soldOut: u.soldOut, guessSr: g && g.photo ? g.code : "" }); } } } catch (e) {}
      en(e.items, n), un(t, e, n, i);
      // 4.10.107：NEWは記録から計算する（表示期間の中の記録を毎回すべて計算し直し、まだ付いていない分だけ足す）。
      // 基準：同じ時間に1ページ目から続けて見た中で、初めて見た商品が、その商品を初めて見た時間より前から記録していた商品より上にあれば NEW。
      // 時間をまたいでも同じ基準。付けるのは初めて記録した時刻（firstSeen）の印
      const winFrom = ft(n, Xt), doneNew = new Set(t.events.filter((u) => u.type === "NEW").map((u) => u.item));
      for (const hp of Object.keys(t.hours)) oe(+hp) < winFrom && delete t.hours[hp];
      // 4.10.184：NEW になり得る商品（表示期間の中で初めて見た、まだ印の無い商品）が無い時間は、並びを作らずに飛ばす（結果は同じ。計算を減らすだけ）
      const cand = Object.keys(t.items).filter((id) => { const a = t.items[id]; return a && a.firstSeen >= winFrom && !doneNew.has(id) && !t.cur.emitted[id]; });
      for (const hp of cand.length ? Object.keys(t.hours).map(Number).sort((x, y) => x - y) : []) {
        if (!cand.some((id) => id in t.hours[hp])) continue;
        const hobs = t.hours[hp], byRank = new Map(Object.entries(hobs).map(([id, rk]) => [rk, id])), run = [];
        for (let k = 1; byRank.has(k); k++) run.push(byRank.get(k));
        for (const id of run) {
          const a = t.items[id];
          if (!a || doneNew.has(id) || t.cur.emitted[id] || a.firstSeen < winFrom) continue;
          const hourAt = oe(ne(a.firstSeen));
          if (hourAt > oe(hp)) continue;
          const deepest = Math.max(0, ...run.filter((y) => t.items[y] && t.items[y].firstSeen < hourAt).map((y) => hobs[y]));
          hobs[id] < deepest && (doneNew.add(id), s.push({ item: id, at: a.firstSeen, period: o, type: "NEW", to: a.stock, why: "above" }));
        }
      }
      for (let u = s.length - 1; u >= 0; u--) d.has(s[u].item) && s.splice(u, 1);
      for (const u of d) s.push({ item: u, at: n, period: o, type: "BACK", to: t.items[u] ? t.items[u].stock : void 0 }), t.cur.emitted[u] = "BACK";
      // 4.10.254：在庫1の機種が売り切れから戻った時、前の1台と今の1台の写真の番号を比べる（同じ＝戻り、違う＝新着、どちらか分からない＝今の決まりのまま）
      for (const u of s) {
        if (!(u.type === "REST" || u.type === "BACK") || u.item[0] !== "I") continue;
        const pv = prevUsr[u.item], cu = nowUsr[u.item];
        if (!pv || !cu) continue;
        if (pv === cu) {
          if (u.type === "REST") { u.type = "BACK", u.why = "same-unit", t.cur.emitted[u.item] = "BACK"; for (const { m, k } of c[u.item] || []) ue(m, k, n); }
        } else {
          // 前の1台は売れた：戻りで「戻った」にした完売記録は元に戻す
          if (u.type === "BACK") for (const m of q().slice(-2)) { const ob = E(m, null) || {}; let ch = false; for (const v of Object.values(ob)) v && v.id === u.item && v.ret === n && (delete v.ret, ch = true); ch && ($(m, ob), L = null); }
          u.type = "NEW", u.why = "new-unit", u.to = t.items[u.item] ? t.items[u.item].stock : u.to, t.cur.emitted[u.item] = "NEW";
        }
      }
      for (const u of s) u.type === "REST" && (t.cur.emitted[u.item] = "REST");
      for (const u of s) (u.type === "NEW" || u.type === "REST") && t.items[u.item] && (t.items[u.item].listAt = u.at, u.type === "REST" && (t.items[u.item].fp = t.items[u.item].prices));
      const p = new Set(s.filter((u) => u.type === "REST").map((u) => u.item));
      for (let u = s.length - 1; u >= 0; u--) s[u].type === "STOCK" && p.has(s[u].item) && s.splice(u, 1);
      // 4.10.182：印の履歴は7日分だけ残す。7日より古いものは消さずに別の保存場所へ送る（いったん小さな待ち行列に入れ、表示の後で移す）
      {
        const allEv = [...t.events, ...s], cut = n - EV_KEEP, keep = [], old = [];
        for (const u of allEv) (u.at > cut ? keep : old).push(u);
        old.length && evQueue(I(t.signature), old);
        t.events = keep.slice(-20000);
      }
      for (const [u, a] of Object.entries(t.items)) a.lastSeen < n - 7776e6 && delete t.items[u];
      // 4.10.447：表示から消えたものは、その都度（この更新で）完売の一覧から外す。このページの前回の一覧にあって今回は無い商品に印を付ける（別のページで今も出ている商品は外さない）。今回また出た商品の印は外す
      if (e.items && e.items.length) {
        const pg = t.pg = t.pg || {}, gone = t.gone = t.gone || {}, key = e.page + "/" + (e.line || ""), now = new Set(e.items.map((u) => u.id));
        const elsewhere = (id) => Object.entries(pg).some(([k, ids]) => k !== key && ids.includes(id));
        for (const id of pg[key] || []) !now.has(id) && !elsewhere(id) && (gone[id] = gone[id] || n);
        for (const id of now) delete gone[id];
        for (const id of Object.keys(gone)) !t.items[id] && delete gone[id];
        pg[key] = [...now];
      }
      t.lastAt = n;
      const m = { NEW: 0, REST: 0, BACK: 0, PRICE: 0, STOCK: 0 };
      for (const u of s) m[u.type]++;
      return { counts: m, hasRef: base, refAt: t.ref && t.ref.at, known: Object.keys(t.items).length };
    }
    const rt = () => E("seen", {}), Bt = () => E("viewed", {}), xe = () => E("opened", {});
    function ye(t) {
      if (!t.length) return;
      const e = xe(), n = w();
      for (const o of t) e[o] = n;
      for (const o of Object.keys(e)) e[o] < n - 10368e6 && delete e[o];
      $("opened", e);
    }
    function hn(t, e = {}) {
      if (!t.length) return;
      const n = Bt(), o = w();
      for (const s of t) n[s] = e[s] || o;
      for (const s of Object.keys(n)) n[s] < o - 10368e6 && delete n[s];
      $("viewed", n);
    }
    function yt(t, e = {}) {
      if (!t.length) return;
      const n = rt(), o = w();
      for (const s of t) n[s] = e[s] || o;
      for (const s of Object.keys(n)) n[s] < o - 10368e6 && delete n[s];
      $("seen", n);
    }
    // 4.10.105：印を出すかどうかは、カードも一覧もこれ一つで決める。
    // 最後の 14:33:30・20:33:30 の区切りより後の印だけ（更新では消えない）。NEWは初めて記録した時刻と同じものだけ
    function markOk(t, ev, from) {
      if (ev.at < from) return false;
      if (ev.type !== "NEW" || ev.why === "new-unit") return true;   // 4.10.248：在庫1の機種に別の1台が入った NEW は、初めて見た時刻と離れていても出す
      const r = t.items[ev.item];
      return !(r && r.firstSeen && ev.at - r.firstSeen > 6e4);
    }
    function gn(t, e, n) {
      const o = {}, from = ft(n, Xt);
      for (const i of t.events) {
        if (!K[i.type] || !markOk(t, i, from)) continue;
        const c = i.at <= (e[i.item] || 0), d = o[i.item] = o[i.item] || { evs: {}, strong: false, seen: true, win: false };
        d.evs[i.type] = i, c || (d.seen = false), !c && n < se(roundAt(i)) && (d.strong = true);
      }
      const s = Ve(n);
      for (const [i, c] of Object.entries(o)) c.win = !c.strong && c.seen && (e[i] || 0) >= s;
      return o;
    }
    // 4.10.129\uff1a\u5024\u4e0b\u3052\u306e\u5370\u306f\u5dee\u984d\u3067\u51fa\u3059\uff08\u2212\u00a5\u5dee\u984d\uff09\u3002\u524d\u5f8c\u306e\u4fa1\u683c\u306f\u51fa\u3055\u306a\u3044\u3002\u5728\u5eab\u306e\u5370\u306f\u524d\u2192\u5f8c\u306e\u307e\u307e
    // 4.10.249：印の文字は「何が起きたか」と「差」だけ（NEW・復活・戻りは種類だけ、在庫増は +差、値下げは 状態 −差額）。今の在庫・価格は行の決まった場所に出す
    function weTag(t) {
      return t.type === "PRICE" ? `${t.condition ? t.condition + " " : ""}\u2212${A(t.from - t.to)}` : t.type === "STOCK" && Number.isFinite(t.from) && Number.isFinite(t.to) ? `+${t.to - t.from}` : "";
    }
    function we(t) {
      return t.type === "PRICE" ? `${t.condition ? t.condition + " " : ""}\u2212${A(t.from - t.to)}` : t.type === "STOCK" ? `\u5728\u5EAB${t.from}\u2192${t.to}` : Number.isFinite(t.to) ? `\u5728\u5EAB${t.to}` : "";
    }
    function bn() {
      if (document.getElementById("jp3-style")) return;
      const t = document.createElement("style");
      t.id = "jp3-style", t.textContent = ["a.search_itemlink.jp3-viewed:link .search_itemname, a.search_itemlink.jp3-viewed:link .search_itemname * { color: #000 !important; -webkit-text-stroke: 0.15px #000; }", "a.search_itemlink.jp3-opened:link .search_itemname, a.search_itemlink.jp3-opened:link .search_itemname * { color: #888 !important; }", "a.search_itemlink.jp3-opened, a.search_itemlink.jp3-opened .search_itemname, a.search_itemlink.jp3-opened .search_itemname * { text-decoration: none !important; }", "a.search_itemlink:visited, a.search_itemlink:visited .search_itemname, a.search_itemlink:visited .search_itemname * { text-decoration-color: transparent !important; }"].join(`
`), (document.head || document.documentElement).appendChild(t);
    }
    const Se = 400, xn = /返品|注文|キャンセル|ペイディ|月々|[¥￥]|^ポスト$|詳細・在庫店舗|価格（税込）|お気に入り|カート|問い合わせ|完売|商談中|^[（(]/, yn = (t) => N(t.replace(/(ランク\s?[A-DＡ-Ｄ未]|[0-9０-９]+\s?[ヶか]月|一点限り|一部付|付属品完備|完備|保証)/g, " $1 "));
    function wn(t, e, n) {
      const o = [], s = [], i = [];
      let c = "", d = -1;
      t.forEach((p, m) => {
        const u = p.match(/^(.+?)\s*(?:電話番号|☎|TEL\s*[:：]?)\s*(0\d{1,4}-?\d{1,4}-?\d{3,4})/);
        u && d < 0 && (c = `${N(u[1])} ${u[2]}`, d = m);
      }), t.forEach((p, m) => {
        if (m === d) return;
        if (p.includes("	")) {
          const [a, ...h] = p.split("	").map(N);
          a && h.join(" ") && !/詳細・在庫店舗/.test(a) && o.push([a, h.filter(Boolean).join(" ")]);
          return;
        }
        const u = N(p);
        !u || xn.test(u) || (d >= 0 && m > d ? i : s).push(u);
      });
      const l = d >= 0 ? i : s.filter((p) => /^[^：:]{1,12}[：:]|^※/.test(p)), r = d >= 0 ? s : s.filter((p) => !l.includes(p));
      return { code: e, price: n, badges: yn(r.join(" ")).slice(0, 120), store: c, notes: l.slice(0, 12).map((p) => p.slice(0, 200)), specs: o.slice(0, 30) };
    }
    function Sn(t) {
      const e = [], n = /^(block|flex|grid|list-item|table|table-row|table-row-group|table-header-group|table-footer-group|table-caption|flow-root)$/, o = (s) => {
        if (s.nodeType === 3) {
          e.push(s.nodeValue.replace(/[ \n\r\t\u00a0]+/g, " "));
          return;
        }
        if (s.nodeType !== 1) return;
        const i = s.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SELECT|OPTION)$/.test(i) || (s.id || "").startsWith("jp3-")) return;
        const c = (s.ownerDocument.defaultView || window).getComputedStyle(s);   // 4.10.143：見えない枠の中のページも読めるように、そのページの見た目で判定（今のページでは今までと同じ）
        if (c.display === "none" || c.visibility === "hidden") return;
        if (i === "IMG") {
          const l = N(s.alt);
          l && e.push(" " + l + " ");
          return;
        }
        if (i === "INPUT") {
          /^(button|submit)$/i.test(s.type) && e.push(" " + N(s.value) + " ");
          return;
        }
        if (i === "BR") {
          e.push(`
`);
          return;
        }
        const d = n.test(c.display);
        d && e.push(`
`);
        for (const l of s.childNodes) o(l);
        c.display === "table-cell" && e.push("	"), d && e.push(`
`);
      };
      return o(t), e.join("").split(`
`).map((s) => s.replace(/ +/g, " ").replace(/ *\t */g, "	").replace(/\t{2,}/g, "	").replace(/^\t+|\t+$/g, "").trim()).filter(Boolean).join(`
`);
    }
    function kn(t) {
      const e = String(t || "").replace(/\r/g, "").replace(/\t(?=商品番号)/g, `
`).split(`
`).map((a) => a.replace(/\s+$/, "")).filter((a) => a.trim());
      let n = e.findIndex((a) => /詳細・在庫店舗/.test(a));
      n < 0 && (n = e.findIndex((a) => /条件に一致する在庫/.test(a)));
      let o = e.findIndex((a, h) => h > n && /^\s*(※商品の情報は|ランクの説明)/.test(a));
      o < 0 && (o = e.length);
      const s = e.slice(n + 1, o), i = [];
      let c = [], d = null, l = null;
      const r = () => {
        d && (l = { ...wn(d.lines, d.code, d.price), sold: !!d.sold, nego: !!d.nego }, i.push(l)), d = null;
      };
      for (const a of s) {
        if (/^\s*商談中\s*$/.test(a) && !d && l && !c.length) {
          l.nego = true;
          continue;
        }
        const h = a.match(/商品番号\s*[：:]\s*([0-9A-Za-z-]+)/);
        if (h) {
          r();
          const b = a.slice(h.index + h[0].length).match(/[¥￥]\s?[\d,]+/);
          d = { code: h[1], lines: c, price: b ? b[0].replace(/\s/g, "").replace("\uFFE5", "\xA5") : "" }, c = [], d.price && r();
          continue;
        }
        if (!d && l && /^\s*(完売|SOLD\s*OUT)\s*$/i.test(a) && !c.length) {
          l.sold = true;
          continue;
        }
        if (d) {
          const b = !/ペイディ|月々/.test(a) && a.match(/[¥￥]\s?[\d,]+/);
          if (b) {
            d.price = b[0].replace(/\s/g, "").replace("\uFFE5", "\xA5"), r();
            continue;
          }
          if (/商談中/.test(a)) {
            d.nego = true, r();
            continue;
          }
          if (/完売|売り?切れ|SOLD/i.test(a)) {
            d.sold = true, r();
            continue;
          }
          const C = /カート|購入/.test(a);
          if (r(), C) continue;
        }
        c.push(a);
      }
      r();
      const p = e.join(`
`), m = p.match(/※商品の情報は\s*(.+?)\s*現在/), u = p.match(/条件に一致する在庫\s*[：:]\s*(\d+)\s*点/);
      return { units: i.slice(0, 10), infoDate: m ? m[1] : "", count: u ? Number(u[1]) : null, outOfStock: /ただいま品切れ|品切れとなっております/.test(p) || u && u[1] === "0" };
    }
    function En(t) {
      const e = [], n = /* @__PURE__ */ new Set(), o = (i, c) => {
        i = N(i).replace(/[：:]$/, ""), c = N(c), !(!i || !c || i.length > 24 || c.length > 240 || n.has(i + c)) && (n.add(i + c), e.push([i, c]));
      };
      for (const i of document.querySelectorAll("table tr")) {
        const c = i.querySelector("th"), d = [...i.querySelectorAll("td")];
        c && d.length ? o(c.textContent, d.map((l) => l.textContent).join(" / ")) : !c && d.length >= 2 && o(d[0].textContent, d.slice(1).map((l) => l.textContent).join(" / "));
      }
      for (const i of document.querySelectorAll("dl dt")) {
        const c = i.nextElementSibling;
        c && c.tagName === "DD" && o(i.textContent, c.textContent);
      }
      const s = N(t.innerText || t.textContent);
      return { pairs: e.slice(0, 40), prices: [...new Set(s.match(/[¥￥]\s?[\d,]+/g) || [])].slice(0, 12), text: s.slice(0, 2500) };
    }
    function ke() {
      const t = N(String(document.title || "").split(/[|｜]/)[0]);
      return t && !/^じゃんぱら/.test(t) && t !== "\u8A73\u7D30" ? t : [...document.querySelectorAll("h1, h2, h3")].map((n) => N(n.textContent)).find((n) => n.length > 5 && !/じゃんぱら|通信販売/.test(n)) || t;
    }
    function vn() {
      const t = M(location.href);
      if (!t.length) return null;
      try { addMetaHarvest(document); } catch (e) {}   // 4.10.437：カートに入れる時の新しい項目を覚える
      const e = document.querySelector("main, #main, .main, #contents, .contents, #content, .content") || document.body, n = kn(Sn(document.body)), DS = dload(), s = t.map((l) => dget(DS, l)).find(Boolean) || n.units.map((l) => dget(DS, "S" + l.code)).find(Boolean);
      let i;
      if (n.units.length) {
        const l = new Map((s && s.units || []).map((a) => [a.code, a])), r = Pt();
        for (const a of n.units) {
          const h = l.get(a.code);
          if (a.price && !a.sold && !a.nego && h && h.soldAt) for (const { m: b, k: C } of r["S" + a.code] || []) {
            const k = (E(b, null) || {})[C];
            k && w() - k.s <= gt && ue(b, C);
          }
        }
        const p = n.units.map((a) => {
          const h = l.get(a.code);
          if (a.price && !a.sold && !a.nego) return { code: a.code, price: a.price, badges: a.badges, store: a.store, notes: a.notes, specs: a.specs, at: w() };
          const b = a.sold || !a.nego && !a.price;
          return { code: a.code, price: h && h.price || a.price || "", at: h ? h.at : 0, soldAt: b ? h && h.soldAt || w() : 0, sure: b && a.sold ? 1 : h && h.sure || 0, nego: a.nego ? w() : 0, badges: a.badges || h && h.badges || "", store: a.store || h && h.store || "", notes: a.notes.length ? a.notes : h && h.notes || [], specs: a.specs.length ? a.specs : h && h.specs || [] };
        }), m = new Set(p.map((a) => a.code)), u = (s && s.units || []).filter((a) => !m.has(a.code)).map((a) => ({ ...a, soldAt: a.soldAt || a.goneAt || w(), gone: 1 }));
        i = { at: w(), url: location.href, title: ke() || s && s.title || "", units: p.concat(u).slice(0, 10), infoDate: n.infoDate || s && s.infoDate || "", count: n.count };
      } else {
        if (s) return { parsed: n, ids: t };
        if (n.outOfStock) return { parsed: n, ids: t };
        i = { at: w(), url: location.href, title: ke(), ...En(e) };
      }
      // 4.10.334：商品台帳へ（商品ページ：台ごとの価格・店舗・状態と、型番番号との対応）
      try { const itm = (t.find((x) => x[0] === "I") || "").slice(1); for (const a of n.units || []) { lgItem(a.code, { name: i.title, price: a.sold ? 0 : a.price, shop: a.store, st: a.sold ? "sold" : a.nego ? "nego" : a.price ? "stock" : "", itm, url: srcodeHref(a.code) }, "detail"); let du = null; try { du = detailUnit(document, a.code); } catch (e) {} lgCond(a.code, du, a); } } catch (e) {}
      On(t, s, i);
      const c = new Set(t);
      for (const l of i.units || []) /^\d{1,18}$/.test(l.code) && c.add("S" + l.code);
      dput(DS, c, i);
      return { parsed: n, ids: t, rec: i };
    }
    function On(t, e, n) {
      if (!n || !n.units) return;
      const o = new Map((e && e.units || []).map((l) => [l.code, l])), s = E("lastlive", {}), i = [...document.querySelectorAll('a[href*="ITMCODE="]')].find((l) => /他の/.test(l.textContent)), c = (t.find((l) => l[0] === "I") || "").slice(1) || i && new URL(i.href, location.href).searchParams.get("ITMCODE") || "";
      for (const l of n.units.filter((r) => r.nego)) {
        const r = nt([...t, "S" + l.code], 2592e5, (p) => p.tent && !p.pt);
        r && !r.r.nego && (r.r.nego = l.nego, r.ch[r.k] = r.r, $(r.m, r.ch), L = null);
      }
      for (const l of n.units.filter((r) => r.sure && r.soldAt)) {
        const r = nt([...t, "S" + l.code], 12096e5, V);
        r && (delete r.r.tent, delete r.r.slot, r.r.cf = w(), r.r.sure = 1, r.ch[r.k] = r.r, $(r.m, r.ch), L = null);
      }
      const d = n.units.filter((l) => l.soldAt && !(o.get(l.code) && o.get(l.code).soldAt));
      for (const l of d) {
        const r = [...t, "S" + l.code], p = l.price && nt(r, 3 * 864e5, (h) => h.pt && !h.ret && !h.sr && h.p === It(l.price));
        if (p) {
          Object.assign(p.r, { sr: l.code, su: 1, r: p.r.r || bt(l.badges), sh: p.r.sh || xt(l.store) }), p.ch[p.k] = p.r, $(p.m, p.ch), L = null;
          continue;
        }
        const m = nt(r, 3 * 864e5, de);
        if (m) {
          (d.length === 1 || m.r.sr === l.code) && (!m.r.r || !m.r.sh) && (m.r.r = m.r.r || bt(l.badges), m.r.sh = m.r.sh || xt(l.store), m.ch[m.k] = m.r, $(m.m, m.ch), L = null);
          continue;
        }
        const u = r.map((h) => s[h]).find(Boolean), a = (String(l.badges).match(/^(中古|新品|未使用|アウトレット)/) || [])[1] || "\u4E2D\u53E4";
        Mt({ k: `S${l.code}@${l.soldAt}`, id: "S" + l.code, itm: c, sr: l.code, n: u && u.name || n.title, u: location.href, c: a, p: It(l.price), p0: null, st: null, f: l.at || null, la: 0, l: l.at || null, s: l.soldAt, d: null, r: bt(l.badges), sh: xt(l.store), su: 1 }, l.sure);
      }
    }
    // 4.10.336：「前に記録した内容」の表示から、ページのメニューの文字・空のスペック・店舗の電話番号を省く（表示とコピーだけ。保存した記録はそのまま）
    // 4.10.353：スマホのページでは上のメニューの文字（じゃんぱら 検索 会員ページ メニュー 商品カテゴリー iPhone…）が札に混ざることがあるので出さない
    const recBadgeOk = (a) => { const s = N(a); return !!s && s.length <= 60 && !/会員ページ|商品カテゴリー|メニュー|ログイン|カートを見る|検索/.test(s); };
    const recNoteOk = (a) => { const s = N(a); return !!s && s.length <= 160 && !/会員ページ|商品カテゴリー|メニュー|ログイン|カートを見る/.test(s); };
    const recSpecOk = (x) => { const v = N(x && x[1]); return !!v && !/^[-－―ー‐]+$/.test(v); };
    const recStore = (s) => N(String(s || "").replace(/[\s（(]*0\d{1,4}-\d{1,4}-\d{3,4}[）)]?/g, ""));
    const recName = (s) => N(s).replace(/^(\S+)\s+\1(?=\s|$)/i, "$1");
    // 4.10.336：［コピー］で取り出す短い文章（商品名・商品番号・価格か完売・店舗・状態・備考・中身のあるスペック・ページのURL）
    function recCopyText(t, e, n, o) {
      const out = [recName(o || n && n.title || "")].filter(Boolean);
      if (n && n.units) {
        const d = t && t[0] === "S" ? t.slice(1) : "", l = n.units.slice().sort((r, p) => (p.code === d) - (r.code === d));
        l.forEach((r, p) => {
          l.length > 1 && out.push(`【${p + 1}台目】`);
          out.push([`商品番号 ${r.code}`, r.soldAt ? `完売（${T(r.soldAt)} に確認）` : "", r.price ? `${r.price}${r.soldAt ? "（売切れ前）" : ""}` : "価格の記録なし"].filter(Boolean).join("／"));
          r.store && out.push(`店舗：${recStore(r.store)}`);
          recBadgeOk(r.badges) && out.push(`状態：${N(r.badges)}`);
          for (const a of r.notes || []) recNoteOk(a) && out.push(N(a));
          const sp = (r.specs || []).filter(recSpecOk).map(([a, h]) => `${N(a)} ${N(h)}`);
          sp.length && out.push(`スペック：${sp.join("／")}`);
        });
        n.url && out.push(n.url);
      } else if (e) {
        const d = Object.entries(e.prices || {}).map(([l, r]) => `${l} ${A(r)}〜`).join(" / ");
        out.push(`一覧で最後に見た価格：${d || "―"}・在庫${e.stock}（${T(e.at)}）`);
        n && n.url && out.push(n.url);
      }
      return out.join("\n");
    }
    function recCopy(text, btn) {
      const ok = () => { btn.textContent = "コピー済み ✓"; setTimeout(() => { btn.textContent = "コピー"; }, 1500); };
      const fb = () => { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0;"; document.body.append(ta); ta.select(); let r = false; try { r = document.execCommand("copy"); } catch (e) {} ta.remove(); r ? ok() : (btn.textContent = "失敗"); };
      try { navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(ok, fb) : fb(); } catch (e) { fb(); }
    }
    function Ee(t, e, n, o) {
      const s = [], i = (d, l) => {
        const r = document.createElement("div");
        return r.className = l || "sect", r.textContent = d, r;
      }, c = (d, l) => {
        const r = document.createElement("details"), p = document.createElement("summary");
        return p.textContent = d, p.className = "sect", r.append(p, ...l), r;
      };
      if (s.push(i(recName(o || n && n.title || t), "sect")), e) {
        const d = Object.entries(e.prices || {}).map(([l, r]) => `${l} ${A(r)}\u301C`).join(" / ");
        s.push(i(`\u4E00\u89A7\u3067\u6700\u5F8C\u306B\u898B\u305F\u4FA1\u683C\uFF1A${d || "\u2015"}\u30FB\u5728\u5EAB${e.stock}\uFF08${T(e.at)}\uFF09`, "row"));
      }
      if (n && n.units) {
        s.push(i(`\u8A73\u7D30\u30DA\u30FC\u30B8\u306E\u8A18\u9332${n.infoDate ? `\uFF08\u5546\u54C1\u306E\u60C5\u5831\u306F${n.infoDate}\u73FE\u5728\uFF09` : ""}`, "sect"));
        const d = t && t[0] === "S" ? t.slice(1) : "", l = n.units.slice().sort((r, p) => (p.code === d) - (r.code === d));
        l.forEach((r, p) => {
          l.length > 1 && s.push(i(`${p + 1}\u53F0\u76EE`, "sect"));
          const m = r.at ? `${T(r.at)} \u306B\u958B\u3044\u305F\u3068\u304D` : "", u = r.price ? `${r.price}${r.soldAt ? "\uFF08\u58F2\u5207\u308C\u524D\uFF09" : ""}` : "\u4FA1\u683C\u306E\u8A18\u9332\u306A\u3057\uFF08\u958B\u3044\u305F\u3068\u304D\u306B\u306F\u3082\u3046\u5B8C\u58F2\uFF09";
          s.push(i(`\u5546\u54C1\u756A\u53F7 ${r.code}\u3000${u}${m ? `\u3000${m}` : ""}`, "row")), r.soldAt && s.push(i(`\u58F2\u5207\u308C\uFF08${T(r.soldAt)} \u306B\u78BA\u8A8D\uFF09`, "row")), recBadgeOk(r.badges) && s.push(i(r.badges, "row")), r.store && s.push(i(`\u5728\u5EAB\u5E97\u8217\uFF1A${recStore(r.store)}`, "row"));
          for (const a of r.notes || []) recNoteOk(a) && s.push(i(N(a), "row"));
          const sp = (r.specs || []).filter(recSpecOk);
          sp.length && s.push(c(`\u30B9\u30DA\u30C3\u30AF\uFF08${sp.length}\u9805\u76EE\uFF09`, sp.map(([a, h]) => i(`${a}\uFF1A${h}`, "row"))));
        });
      } else if (n) {
        s.push(i(`\u8A73\u7D30\u30DA\u30FC\u30B8\u3092\u958B\u3044\u305F\u3068\u304D\u306E\u8A18\u9332\uFF08${T(n.at)}\uFF09`, "sect"));
        for (const [l, r] of n.pairs || []) s.push(i(`${l}\uFF1A${r}`, "row"));
        n.prices && n.prices.length && s.push(i(`\u30DA\u30FC\u30B8\u5185\u306E\u4FA1\u683C\uFF1A${n.prices.join("\u30FB")}`, "row"));
        const d = i(n.text || "", "row");
        d.style.whiteSpace = "pre-wrap", s.push(c("\u30DA\u30FC\u30B8\u306E\u6587\u7AE0\uFF08\u8981\u70B9\uFF09", [d]));
      } else s.push(i("\u8A73\u7D30\u30DA\u30FC\u30B8\u306E\u8A18\u9332\u306F\u3042\u308A\u307E\u305B\u3093\uFF08\u5728\u5EAB\u304C\u3042\u308B\u3046\u3061\u306B\u958B\u3044\u305F\u5546\u54C1\u3060\u3051\u8A18\u9332\u3055\u308C\u307E\u3059\uFF09", "empty"));
      return s;
    }
    function Kt(t) {
      const e = !!_ && !f.panel.hidden && f.panelKind === t, n = f.panel.scrollTop;
      f.panelKind = t, f.panel.classList.toggle("split", t === "new"), qt(), f.panel.hidden = false, f.panel.scrollTop = e ? n : 0;
    }
    function ve(t, e) {
      if (!f.panel.hidden && f.panelKind === t) {
        if (_) {
          vt();
          return;
        }
        f.panel.hidden = true, f.panelKind = null;
        return;
      }
      e();
    }
    function $n(t, e) {
      const n = dget(dload(), t);
      f.ptitle.textContent = "\u58F2\u5207\u308C\u524D\u306E\u8A18\u9332", f.pbody.replaceChildren(...Ee(t, e && e.live, n, e && e.name)), Kt("detail");
    }
    function Cn(t) {
      if (!t) return;
      const { parsed: e, ids: n } = t, DS = dload(), o = t.rec || n.map((a) => dget(DS, a)).find(Boolean), s = E("lastlive", {}), i = n.map((a) => s[a]).find(Boolean);
      if (!(!e.units.length || e.units.some((a) => a.sold || a.nego) || (o && o.units || []).some((a) => a.soldAt)) || !o && !i) return;
      const d = n.find((a) => a[0] === "S") || n[0], l = document.createElement("div");
      l.id = "jp3-dhost";
      const r = l.attachShadow({ mode: "open" });
      r.innerHTML = `<style>
      :host { all: initial; }
      .box { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483000; max-height: 55vh; overflow: auto; box-sizing: border-box;
        background: #172233; color: #f3f6fa; font: 15px/1.45 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif;
        padding: 8px 12px calc(10px + env(safe-area-inset-bottom)); box-shadow: 0 -6px 18px rgba(0,0,0,.28); }
      .top { display: flex; align-items: center; gap: 8px; }
      .ttl { flex: 1; font-weight: 800; }
      .sum { margin: 4px 0; font-weight: 700; }
      button { min-height: 40px; border: 0; border-radius: 10px; background: #3b4d66; color: #fff; font: inherit; font-weight: 700; padding: 0 12px; }
      .body { background: #fff; color: #222; border-radius: 10px; margin-top: 6px; overflow: hidden; }
      .body[hidden] { display: none; }
      .sect { padding: 8px 12px 4px; font-weight: 700; color: #4a5a6e; }
      .row { padding: 6px 12px; border-bottom: 1px solid #dfe4ea; }
      .empty { padding: 10px 12px; color: #667; }
      summary { cursor: pointer; }
          .why { font-size: 13px; color: #cbd5e1; }
    </style><div class="box"><div class="top"><div class="ttl">\u524D\u306B\u8A18\u9332\u3057\u305F\u5185\u5BB9\uFF08JP RUSH\uFF09</div><button id="cp">コピー</button><button id="more">\u8A73\u3057\u304F</button></div><div class="why" id="why"></div><div class="sum" id="sum"></div><div class="body" id="body" hidden></div></div>`;
      const p = e.units.find((a) => "S" + a.code === d) || e.units[0];
      r.getElementById("why").textContent = p && p.nego ? "\u3053\u306E\u53F0\u306F\u5546\u8AC7\u4E2D\u3067\u3059\uFF08\u30AB\u30FC\u30C8\u306B\u5165\u3063\u3066\u3044\u307E\u3059\u30021\u6642\u9593\u307B\u3069\u3067\u623B\u308B\u3053\u3068\u304C\u3042\u308A\u307E\u3059\uFF09" : p && p.sold ? "\u3053\u306E\u53F0\u306F\u5B8C\u58F2\u3067\u3059" : e.units.length ? "\u3053\u306E\u30DA\u30FC\u30B8\u304B\u3089\u6D88\u3048\u305F\u53F0\u304C\u3042\u308A\u307E\u3059\uFF08\u5546\u8AC7\u4E2D\u304B\u5B8C\u58F2\uFF09" : d[0] === "I" ? "\u3053\u306E\u30DA\u30FC\u30B8\u3067\u306F\u53F0\u304C\u8868\u793A\u3055\u308C\u307E\u305B\u3093\uFF08\u5168\u90E8\u304C\u5546\u8AC7\u4E2D\u304B\u5B8C\u58F2\u3002\u691C\u7D22\u6761個\u306E\u305B\u3044\u3067\u51FA\u306A\u3044\u3053\u3068\u3082\u3042\u308A\u307E\u3059\uFF09" : "\u3053\u306E\u30DA\u30FC\u30B8\u3067\u306F\u53F0\u304C\u8868\u793A\u3055\u308C\u307E\u305B\u3093\uFF08\u691C\u7D22\u6761個\u306E\u305B\u3044\u3067\u51FA\u306A\u3044\u3053\u3068\u3082\u3042\u308A\u307E\u3059\uFF09";
      const m = o && o.units && (o.units.find((a) => "S" + a.code === d) || o.units.find((a) => a.price)), u = i && Object.entries(i.prices || {}).map(([a, h]) => `${a} ${A(h)}\u301C`).join(" / ");
      r.getElementById("sum").textContent = m && m.price ? `${m.price}${m.store ? `\u30FB${m.store.replace(/\s.*$/, "")}` : ""}${recBadgeOk(m.badges) ? `\u30FB${m.badges}` : ""}\uFF08${T(m.at)} \u306B\u958B\u3044\u305F\u3068\u304D\uFF09` : u ? `\u4E00\u89A7\u3067\u6700\u5F8C\u306B\u898B\u305F\u4FA1\u683C\uFF1A${u}\uFF08${T(i.at)}\uFF09` : "\u4FA1\u683C\u306E\u8A18\u9332\u306F\u3042\u308A\u307E\u305B\u3093", r.getElementById("body").replaceChildren(...Ee(d, i, o, i && i.name)), r.getElementById("more").onclick = () => {
        const a = r.getElementById("body");
        a.hidden = !a.hidden, r.getElementById("more").textContent = a.hidden ? "\u8A73\u3057\u304F" : "\u305F\u305F\u3080";
      }, r.getElementById("cp").onclick = () => recCopy(recCopyText(d, i, o, i && i.name), r.getElementById("cp")), document.body.appendChild(l);
    }
    function jn(t) {
      let e = t;
      for (; e.parentElement && e.parentElement !== document.body && e.parentElement.querySelectorAll("a.search_itemlink").length === 1; ) e = e.parentElement;
      return e;
    }
    function Tn(t, e, n) {
      n = n || {};
      const DS = dload();
      bn();
      const s = xe(), i = ST_EMPTY;
      // 4.10.79：カート内（SRCODE一致）の印を検索結果のカードにも付ける
      const cartNow = ownCartSet(w());
      for (const c of document.querySelectorAll("a.search_itemlink")) {
        const d = et(c.href);
        c.querySelectorAll(".jp3-sold").forEach((g) => g.remove());
        // 4.10.117：商品の番号（SRCODE）をカードに小さく出す。リンクに無い時は写真の名前から（表示だけ。判定には使わない）
        c.querySelectorAll(".jp3-srcode").forEach((g) => g.remove());
        const scd = srcodeOf(c.href, imgSrcOf(c));
        if (scd) {
          const sg = document.createElement("span");
          sg.className = "jp3-srcode", sg.textContent = srcodeText(scd), sg.style.cssText = "display:block;margin:2px 0 0;font:600 11px/1.4 sans-serif;color:#555";
          c.appendChild(sg);
        }
        const l = ee.test(ie(c)), r = !!(d && s[d]);
        c.style.background = "";
        const p = jn(c);
        l ? (p.dataset.jp3soldcell = "1", p.style.backgroundColor = "#e9e9e9") : p.dataset.jp3soldcell && (p.style.backgroundColor = "", delete p.dataset.jp3soldcell);
        for (const g of c.querySelectorAll("[data-jp3soldbox]")) g.style.outline = "", g.style.outlineOffset = "", g.style.backgroundColor = "", g.style.filter = "", delete g.dataset.jp3soldbox;
        for (const g of c.querySelectorAll("img[data-jp3sold]")) g.style.filter = "", delete g.dataset.jp3sold;
        if (l) {
          c.dataset.jp3sold = "1";
          const g = document.createElement("span");
          g.className = "jp3-sold", g.textContent = "SOLD OUT", g.style.cssText = "display:inline-block;margin:2px 6px 2px 0;padding:2px 10px;border-radius:6px;font:800 13px/1.6 sans-serif;letter-spacing:.05em;color:#fff;background:#333333";
          const O = d && n[d], y = d && dget(DS, d);
          if (O && O.live || y) {
            const v = document.createElement("span");
            if (v.className = "jp3-sold jp3-noopen", v.style.cssText = "display:block;margin:2px 0 4px;font:600 12px/1.5 sans-serif;color:#333", O && O.live) {
              const S = Object.entries(O.live.prices || {}).map(([j, X]) => `${j} ${A(X)}\u301C`).join(" / ");
              v.append(`\u58F2\u5207\u308C\u524D\uFF1A${S}\u30FB\u5728\u5EAB${O.live.stock}\uFF08${T(O.live.at)}\uFF09`);
            }
            if (y) {
              const S = document.createElement("span");
              S.className = "jp3-detailbtn", S.textContent = "\u958B\u3044\u305F\u3068\u304D\u306E\u8A18\u9332", S.style.cssText = "display:inline-block;margin-left:6px;padding:1px 8px;border-radius:6px;background:#fff;border:1px solid #888;color:#222;cursor:pointer", S.addEventListener("click", (j) => {
                j.preventDefault(), j.stopPropagation(), $n(d, O);
              }, true), v.append(S);
            }
            c.prepend(g), g.after(v);
          } else c.prepend(g);
        } else delete c.dataset.jp3sold;
        c.querySelectorAll(".jp3-hist").forEach((g) => g.remove());
        const m = N((c.querySelector(".search_itemname") || {}).textContent), lk = gk(itmOf((c.matches("a") ? c : c.querySelector("a") || {}).href || ""), m), u = m && (i.sum[lk] || i.sum[z(m)]), a = m && (i.tent[lk] || i.tent[z(m)]);
        if (u || a) {
          const g = document.createElement("span");
          g.className = "jp3-hist jp3-noopen", g.style.cssText = "display:block;margin:2px 0;font:600 11.5px/1.5 sans-serif;color:#555;cursor:pointer", g.textContent = ln(u, a), g.addEventListener("click", (y) => {
            y.preventDefault(), y.stopPropagation(), Ie(m);
          }, true);
          const O = [...c.children].filter((y) => y.classList.contains("jp3-sold")).pop();
          O ? O.after(g) : c.prepend(g);
        }
        // カート内の印は、見ている途中のカードでも記録の変化に合わせて付け直す（イベントの印と違い、表示中でも待たない）
        // 4.10.80：印は一つだけ。売切れのカートの商品は「SOLD OUT」の印を「カート内」に替える（売切れの背景などの処理はそのまま）
        c.querySelectorAll(".jp3-cart").forEach((g) => g.remove());
        if (cartNow.has(srOf(c.href))) {
          const sp = [...c.children].find((x) => x.classList.contains("jp3-sold") && !x.classList.contains("jp3-noopen") && x.textContent === "SOLD OUT");
          if (sp) sp.textContent = "カート内", sp.style.background = "#374151";
          else {
            const g = document.createElement("span");
            g.className = "jp3-cart", g.textContent = "カート内", g.style.cssText = "display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border-radius:6px;font:700 12px/1.6 sans-serif;color:#fff;background:#374151";
            const q = [...c.querySelectorAll(":scope > .jp3-tag, :scope > .jp3-sold")].pop();
            q ? q.after(g) : c.prepend(g);
          }
        }
        if (wt.has(c)) continue;
        const h = !!(d && s[d]);
        c.classList.toggle("jp3-opened", h), c.classList.toggle("jp3-viewed", !h && !!(d && e[d])), c.querySelectorAll(".jp3-tag").forEach((g) => g.remove()), c.dataset.jp3 && (c.style.outline = "", c.style.outlineOffset = "", p.style.outline = "", p.style.outlineOffset = "", delete c.dataset.jp3, delete c.dataset.jp3lv);
        const b = d && t[d];
        if (!b) continue;
        const C = b.evs, k = ut.filter((g) => C[g]);
        k.length && (c.dataset.jp3 = k[0], c.dataset.jp3lv = b.strong ? "strong" : "weak", p.style.outline = b.strong ? "3px solid " + U[k[0]] : b.win ? "2px dashed " + U[k[0]] : "", p.style.outlineOffset = b.strong ? "-3px" : "-2px", c.prepend(...k.map((g) => {
          const O = C[g], y = document.createElement("span");
          y.className = "jp3-tag", y.dataset.t = g;
          const v = weTag(O), tc = tagColors(O);
          y.textContent = tagLabel(O) + (v ? " " + v : "");
          const S = document.createElement("small");
          return S.textContent = " " + T(O.at) + (b.strong ? "" : b.seen ? " \u2713\u898B\u305F" : " \u524D\u56DE"), S.style.cssText = "font-weight:400;opacity:.85", y.appendChild(S), y.style.cssText = "display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border-radius:5px;font:700 12px/1.6 sans-serif;color:" + tc.fg + ";background:" + tc.bg + (b.strong || b.win ? "" : ";opacity:.55"), y;
        })));
      }
    }
    let Oe = {};
    const wt = /* @__PURE__ */ new Set();
    let lt = [], St = {}, Nn = null, mo = null;
    function An() {
      clearTimeout(Nn);
      const t = lt, e = St;
      // 4.10.91：スクロールで通過したものは「黒（見た）」の記録（viewed）だけに入れる。既読（seen）には入れない
      lt = [], St = {}, hn(t, e);
    }
    function Ln() {
      let t = 0;
      for (const n of [0.2, 0.5, 0.8]) {
        let o = document.elementFromPoint(window.innerWidth * n, 2);
        for (; o && o !== document.body && o !== document.documentElement; ) {
          const s = getComputedStyle(o).position;
          if (s === "fixed" || s === "sticky") {
            t = Math.max(t, o.getBoundingClientRect().bottom);
            break;
          }
          o = o.parentElement;
        }
      }
      const e = f.bar && !f.bar.classList.contains("side") ? f.bar.getBoundingClientRect().height : 0;
      return { top: Math.min(t, window.innerHeight * 0.4), bottom: Math.min(e, window.innerHeight * 0.6) };
    }
    let P = null, H = -1, F = 0, $e = 0;
    function Rn() {
      if (document.hidden || f.panel && !f.panel.hidden && !f.panel.classList.contains("side")) return;
      if (w() < $e) {
        P = null, H = -1, F = 0;
        return;
      }
      // 4.10.90：拡張の一覧を出している間は、裏の元の検索結果では「見た」を付けない（一覧に出ているカードで判定する）
      const { top: t, bottom: e } = Ln(), n = t, o = window.innerHeight - e, s = w(), ov = document.getElementById(LIST_ID), i = ov ? [...ov.querySelectorAll(".xi")] : [...document.querySelectorAll("a.search_itemlink")];
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4 ? F || (F = s) : F = 0;
      let d = -1;
      if (i.forEach((l, r) => {
        const p = l.getBoundingClientRect(), m = Math.min(p.bottom, o) - Math.max(p.top, n);
        p.height > 0 && m >= Math.min(p.height, o - n) * 0.6 ? (wt.add(l), (P === null || r < P) && (P = r), d = r) : wt.has(l) && wt.delete(l), P !== null && r >= P && p.height > 0 && p.bottom - n < p.height * 0.4 && (H = Math.max(H, r));
      }), F && s - F >= 1e3 && d >= 0 && (H = Math.max(H, d)), P !== null) for (let l = P; l <= H; l++) {
        const r = i[l];
        if (!(!r || r._jp3viewed)) {
          r._jp3viewed = true;
          for (const p of M(ov ? r.dataset.url : r.href)) lt.push(p), St[p] || (St[p] = s);
        }
      }
    }
    function _n() {
      setInterval(Rn, 300), window.addEventListener("pagehide", () => {
        lt.length && An();
      });
    }
    function Mn() {
      f.bar && (f.bar.style.setProperty("--pulse", R && R.top ? U[R.top] : "#1f7a4a"), f.bar.classList.add("pulse"), setTimeout(() => f.bar.classList.remove("pulse"), 1600));
    }
    let R = null, Ut = false;
    function Pn(t, e) {
      const n = `${T(Tt)}\u3000${e.page}\u30DA\u30FC\u30B8\u76EE\uFF08${e.items.length}個\uFF09`, o = T(se(w())), s = ut.filter((d) => t.counts[d]).map((d) => `${K[d]} ${t.counts[d]}`), i = ut.find((d) => t.counts[d]) || null, c = s.length ? `\u65B0\u3057\u3044\u5370\uFF1A${s.join("\u30FB")}` : "\u65B0\u3057\u3044\u5370\u306A\u3057";
      return t.hasRef ? { kind: s.length ? "ok" : "none", top: i, text: `${n}\u3000${c}\u3002\u6B21\u306E\u66F4\u65B0 ${o}` } : { kind: s.length ? "ok" : "first", top: i, text: `${n}\u3092\u8A18\u9332\u3057\u307E\u3057\u305F\u3002${s.length ? c + "\u3002" : ""}NEW\u306F\u3001\u6B21\u306E\u66F4\u65B0\uFF08${o}\uFF09\u306E\u3042\u30681\u30DA\u30FC\u30B8\u76EE\u3092\u958B\u304F\u3068\u4ED8\u304D\u307E\u3059` };
    }
    function In() {
      const t = D(location.href);
      ra(t);
      let e;
      try {
        e = ge(t);
      } catch (o) {
        R = { kind: "error", text: o.message };
        return;
      }
      const n = w();
      try {
        const o = ce(document.body);
        // 4.10.271：スマホ版で読んだ時は、商品の番号がこれまでの記録（タブレットで付けたもの）と合うか確かめる。半分も合わない時は記録しない（誤った新着・完売を付けないため）
        if (DIAG.steps.phone && e.items) {
          const have = Object.keys(e.items).length, hit = o.items.filter((x) => e.items[x.id]).length;
          DIAG.steps.match = hit + "/" + o.items.length + "（記録" + have + "）";
          if (have >= o.items.length && hit < o.items.length * 0.5) throw new Error(`スマホ版の商品の番号がこれまでの記録と合いません（${hit}/${o.items.length}件一致）。記録していません`);
        }
        const s = mn(e, o, Tt);
        e.log = [...e.log, { at: n, ok: true, page: o.page, count: o.items.length, hasRef: s.hasRef, counts: s.counts }].slice(-30), $(I(t), e), R = Pn(s, o), Ut = true;
        RUNLOG = { at: n, sig: t, ok: true, page: o.page, line: o.line, total: o.total, count: o.items.length, hasRef: s.hasRef, counts: s.counts };
      } catch (o) {
        R = o.sort ? { kind: "sortx", text: "" } : { kind: "error", text: o.message }, o.sort || (e.log = [...e.log, { at: n, ok: false, page: Rt(), error: o.message }].slice(-30), $(I(t), e), RUNLOG = { at: n, sig: t, ok: false, page: Rt(), error: o.message });
      }
    }
    const Ce = (t) => Tt < ft(t, Q), je = (t) => pt(t, Q) + Zt;
    let Te = null, Ne = false, placed1 = false, redo1 = false;
    // 4.10.128：前の版は、起動して1秒後に同じ中身でもう一度すべてを描き直していた。そのうち結果が変わるのは
    // ①カードの印の並び（2回目でカート内・売切れ履歴の位置が決まる）と ②一覧（拡張）・左の欄の位置合わせ だけなので、その二つだけをする。
    // 一度だけの整理（v65）をした回は、左の欄が整理の前の中身で描かれているので、前の版と同じくすべて描き直す（redo1）
    // 4.10.183：起動の1秒後は、置き場所だけ合わせ直す（印は at() で付け済みなので、商品カードを全部描き直さない）
    function placeAgain() {
      Et();
      const l = document.getElementById(LIST_ID), g = l && gridOf();
      g && placeList(l, g);
    }
    function Dn() {
      if (!Nt()) return;
      syncCart();
      const t = w(), e = Ce(t);
      // 4.10.128：Te は at() が描いたときの「古い画面かどうか」。変わったときだけ描き直す（起動直後に同じ中身をもう一度描き直さない）
      if (e !== Te) Te = e, placed1 = true, at();
      else if (!placed1) placed1 = true, redo1 ? at() : placeAgain();
      if (Ne || !e || document.visibilityState === "visible" || !E(Lt(D(location.href)), false)) return;
      const n = ft(t, Q);
      t < n + Zt || t - n > qe || (Ne = true, location.href = Xe());
    }
    function Vis() {
      if (document.visibilityState !== "visible" || Ne || !Nt()) return;
      // 4.10.163：表に戻したときも、裏の時と同じ時間帯（更新の34分ごろから50分後まで）の中だけ開き直す
      const t = w(), n = ft(t, Q);
      if (!Ce(t) || t < n + Zt || t - n > qe || !E(Lt(D(location.href)), false)) return;
      Ne = true, location.href = Xe();
    }
    function Bn() {
      const t = Lt(D(location.href)), e = !E(t, false);
      $(t, e), Y(e ? `\u81EA\u52D5ON\uFF1A\u3053\u306E\u30BF\u30D6\u304C\u88CF\u306B\u56DE\u3063\u3066\u3044\u308B\u3068\u304D\u3001\u66F4\u65B0\uFF08${Q.join("\u30FB")}\u6642\u306E33\u520630\u79D2\uFF09\u306E\u3042\u306834\u5206\u3054\u308D\u306B1\u30DA\u30FC\u30B8\u76EE\u304B\u3089\u958B\u304D\u76F4\u3057\u307E\u3059\u3002\u898B\u3066\u3044\u308B\u30BF\u30D6\u3068\u3001\u66F4\u65B0\u306E\u3042\u3068\u306B\u3082\u3046\u958B\u304D\u76F4\u3057\u305F\u30BF\u30D6\u306F\u305D\u306E\u307E\u307E\u3067\u3059\u3002\u6B21\u306F${T(je(w()))}` : "\u81EA\u52D5OFF\u306B\u3057\u307E\u3057\u305F"), at();
    }
    const f = {};
    let Ae = "";
    function Y(t) {
      Ae = t, f.status && (f.status.textContent = t);
    }
    let W = null;
    const kt = (t) => {
      const e = (t.closest("a") || t).getBoundingClientRect();
      return e.width > 0 && e.height > 0 ? e : null;
    };
    function Kn() {
      if (W && W.isConnected && kt(W)) return W;
      W = null;
      const t = [...document.querySelectorAll("a, span, div, p, button")].filter((o) => o.childElementCount === 0), e = (o) => (s) => (s.textContent || "").replace(/\s+/g, "") === o;
      return W = [...[...document.querySelectorAll("select")].filter((o) => [...o.options].some(e("\u5168\u5E97\u8217"))), ...t.filter(e("\u5168\u5E97\u8217")), ...t.filter(e("\u8CB7\u53D6\u306F\u3053\u3061\u3089"))].find((o) => kt(o)) || null, W;
    }
    let J = null;
    function zt() {
      return J && J.isConnected && kt(J) || (J = [...document.querySelectorAll("div, h1, h2, h3, p, span, td, th")].find((t) => {
        const e = (t.textContent || "").replace(/\s+/g, "");
        return e.startsWith("\u691C\u7D22\u7D50\u679C") && e.length <= 20 && kt(t);
      }) || null), J;
    }
    function Un() {
      if (window.innerWidth < 900) return null;
      const t = Kn();
      if (!t) return null;
      const e = (t.closest("a") || t).getBoundingClientRect();
      if (!(e.width > 0 && e.height > 0)) return null;
      const n = zt(), o = n ? n.getBoundingClientRect() : null, s = document.querySelector("a.search_itemlink"), i = o ? o.left : s ? s.getBoundingClientRect().left - 25 : window.innerWidth, c = Math.min(480, i - 10 - e.left);
      return c < 240 ? null : { left: e.left, width: c, top: Math.max(o ? o.top : e.bottom + 10, e.bottom + 10) };
    }
    const zn = ["left", "width", "top", "right", "bottom", "maxHeight", "overflowY", "borderRadius"], qn = ["left", "width", "top", "right", "bottom"];
    let _ = null;
    let listFull = false;   // 一覧詳細（画面いっぱい）を開いているか
    function qt() {
      const t = f.panel, e = f.bar;
      if (!t || !e) return;
      f.xcp && (f.xcp.style.display = f.panelKind === "new" ? "" : "none"), f.xcp2 && (f.xcp2.style.display = f.panelKind === "new" ? "" : "none");   // 4.10.190：全検索のコピーは新着候補の時だけ
      const n = f.panelKind === "sold" || f.panelKind === "detail" || (f.panelKind === "new" && listFull);
      if (_ && !n) {
        const s = e.classList.contains("rail") ? _.top : Math.round(e.getBoundingClientRect().bottom + 10);
        t.classList.remove("full"), t.classList.add("side"), Object.assign(t.style, { left: _.left + "px", width: _.width + "px", right: "auto", top: s + "px", bottom: "8px" });
      } else if (_) t.classList.remove("side"), t.classList.add("full"), Object.assign(t.style, { left: "0px", width: "auto", right: "0px", top: "0px", bottom: "0px" });
      else {
        t.classList.remove("side", "full");
        for (const o of qn) t.style[o] = "";
        t.style.bottom = e.getBoundingClientRect().height + "px";
      }
    }
    function Hn() {
      !f.bar || !f.panel || !_ || (f.panel.hidden || !f.panelKind || f.panelKind === "new") && vt();
    }
    function Le() {
      const t = f.bar;
      if (!t) return;
      const e = Un();
      if (e) {
        const n = Math.max(8, e.top);
        t.classList.add("side"), Object.assign(t.style, { left: e.left + "px", width: e.width + "px", top: n + "px", right: "auto", bottom: "auto", borderRadius: "0" }), document.body.style.paddingBottom = "";
        const o = Re(e);
        _ = { left: e.left, width: e.width, top: n };
        const s = window.innerHeight - n - 8;
        Object.assign(t.style, { maxHeight: (o ? s : Math.max(160, Math.round(s * 0.5))) + "px", overflowY: "auto" }), qt();
      } else {
        t.classList.remove("side");
        for (const n of zn) t.style[n] = "";
        // 4.10.174：下に移ったときは、画面の高さの30%まで（入りきらない分はツールの中でスクロール）。ページの上側を操作できるように
        t.style.maxHeight = Math.round(window.innerHeight * 0.3) + "px", t.style.overflowY = "auto";
        _ = null, Re(null), qt(), document.body.style.paddingBottom = t.getBoundingClientRect().height + 12 + "px";
      }
    }
    // 4.10.256：ヘッダーの空き（ロゴの右〜「コーポレートサイト」の左）を測って、大きい「次へ」を置く
    let railOn = false, hdCorp = null, hdLogo = null, hdTry = 0, hdRight = null, hdNav = null, hdLine = null;
    function navText() {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) if (/店舗情報/.test(n.nodeValue) && N(n.nodeValue).length <= 8 && n.parentElement && !n.parentElement.closest("#jp3-host") && n.parentElement.getClientRects().length) return n;
      return null;
    }
    // 4.10.286：スマホ版の時計と全検索コピーを置く（空きを測って、足りない時は出さない。ページと一緒に流れる）
    let spLogo = null, spMem = null;
    function spPlace() {
      const c = f.spclock, x = f.spxcp;
      if (!c || !x) return;
      const sp = Nt() && !railOn && !!document.querySelector(".search_item_box");
      if (!sp) return c.classList.remove("spon"), x.classList.remove("spon");
      const sx = window.scrollX, sy = window.scrollY;
      // 時計：ロゴの右端〜「会員ページ」の左端の真ん中。高さはロゴにそろえる
      if (!spLogo || !spLogo.isConnected) spLogo = document.querySelector("#header .logo img, #header img");
      if (!spMem || !spMem.isConnected) spMem = document.querySelector("#header .hamburger, #header li.hamburger");
      const lr = spLogo && spLogo.getBoundingClientRect(), mr = spMem && spMem.getBoundingClientRect();
      if (lr && lr.width && mr && mr.width) {
        const L = lr.right + 12, R = mr.left - 12, fs = Math.max(14, Math.min(Math.round(lr.height * 0.75), 40));
        c.textContent = new Date(w()).toLocaleTimeString("ja-JP", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        c.style.fontSize = fs + "px";
        c.classList.add("spon");
        const cw = c.getBoundingClientRect().width;
        if (R - L < cw) c.classList.remove("spon");
        else Object.assign(c.style, { left: Math.round(L + (R - L - cw) / 2 + sx) + "px", top: Math.round((lr.top + lr.bottom) / 2 - fs / 2 + sy) + "px" });
      } else c.classList.remove("spon");
      // 全検索コピー：黒い「検索結果」の帯の右端（余白12px）・上下の真ん中
      const g = gridOf(), bar = g && barOf(g);
      if (!bar) return x.classList.remove("spon");
      const br = bar.getBoundingClientRect();
      let tr = null;
      const tw = document.createTreeWalker(bar, NodeFilter.SHOW_TEXT);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) if (/検索結果/.test(t.nodeValue)) { const rg = document.createRange(); rg.selectNodeContents(t); tr = rg.getBoundingClientRect(); break; }
      const h = Math.max(24, Math.min(32, Math.round(br.height * 0.6)));
      x.style.setProperty("height", h + "px", "important"), x.style.setProperty("min-height", "0", "important"), x.classList.add("spon");
      const xw = x.getBoundingClientRect().width, left = br.right - 12 - xw;
      if (tr && left < tr.right + 12) return x.classList.remove("spon");
      Object.assign(x.style, { left: Math.round(left + sx) + "px", top: Math.round((br.top + br.bottom) / 2 - h / 2 + sy) + "px" });
    }
    function topqPlace() {
      const q = f.topq;
      if (!q) return;
      const off = () => { q.classList.remove("on"); };
      if (!railOn) return off();
      const leaf = (tx) => [...document.querySelectorAll("a,span,li,p,div")].find((el) => el.childElementCount === 0 && (el.textContent || "").replace(/\s+/g, "") === tx && !el.closest("#jp3-host"));
      if ((!hdCorp || !hdCorp.isConnected) && Date.now() - hdTry > 5e3) hdTry = Date.now(), hdCorp = leaf("コーポレートサイト"), hdLogo = null, hdRight = null;
      if (!hdCorp) return off();
      const cr = hdCorp.getBoundingClientRect();
      if (!cr.width) return off();
      if (!hdLogo || !hdLogo.isConnected) {
        let best = null, bx = -1;
        for (const im of document.querySelectorAll("img,svg")) {
          if (im.closest("#jp3-host")) continue;
          const r = im.getBoundingClientRect();
          if (r.width < 60 || r.height < 20 || r.right > cr.left || r.bottom < cr.top - 60 || r.top > cr.bottom + 80) continue;
          if (r.right > bx) bx = r.right, best = im;
        }
        hdLogo = best;
      }
      // 4.10.259：上下左右の余白をそろえて、空きいっぱいに置く
      //  左＝ロゴの右端、右＝右側の「ログイン」「会員登録」「コーポレートサイト」とその絵の左端
      //  上＝ヘッダーの上端（ページの一番上）、下＝ヘッダーの区切り線（見つからなければ、ログインの段と「店舗情報」の段の真ん中）
      const lr = hdLogo ? hdLogo.getBoundingClientRect() : null, sy = window.scrollY;
      if (!hdRight || hdRight.some((el) => !el.isConnected)) {
        hdRight = ["ログイン", "会員登録", "コーポレートサイト"].map(leaf).filter(Boolean), hdNav = navText(), hdLine = null;
      }
      const rr = hdRight.map((el) => el.getBoundingClientRect()).filter((r) => r.width), rTop = Math.min(...rr.map((r) => r.top)), rBot = Math.max(...rr.map((r) => r.bottom));
      let R = Math.min(...rr.map((r) => r.left));
      for (const im of document.querySelectorAll("img,svg,i")) {   // ログイン・会員登録の横の絵
        if (im.closest("#jp3-host")) continue;
        const r = im.getBoundingClientRect(), cy = (r.top + r.bottom) / 2;
        if (r.width && r.width < 60 && r.left < R && r.left > R - 80 && cy >= rTop - 4 && cy <= rBot + 4) R = r.left;
      }
      // 4.10.262：「店舗情報」は文字そのものの位置で測る（部品の中に絵があると見つからなかった）
      let nb = null;
      if (hdNav && hdNav.isConnected) { const rg = document.createRange(); rg.selectNodeContents(hdNav), nb = rg.getBoundingClientRect(); }
      // 4.10.260：区切り線は探さない（実際の画面で別の線を拾っていた）。ログインの段と「店舗情報」の段の真ん中を区切りとみなす
      const bTop = lr && lr.top + sy > 150 ? lr.top - 20 : -sy;
      const bBot = nb && nb.width ? (Math.max(rBot, lr ? lr.bottom : 0) + nb.top) / 2 :   // 4.10.262：ログインの段と「店舗情報」の文字の真ん中＝区切り線
        Math.max(rBot, lr ? lr.bottom : 0) + 12;
      const m = Math.max(10, Math.round((bBot - bTop) * 0.16)), L = (lr ? lr.right : 0) + m * 2;
      R -= m * 2;
      const h = Math.round(bBot - bTop - m * 2), w = Math.min(1000, R - L);
      if (w < 140 || h < 32) return off();
      const slim = w < h * 2 + 16 + 200;   // 狭いときは次へだけ
      q.classList.toggle("slim", slim), q.querySelectorAll("button.ic").forEach((b) => { b.style.width = ""; });   // 4.10.371：両端の正方形は CSS（aspect-ratio）で
      Object.assign(q.style, { left: Math.round(L + (R - L - w) / 2 + window.scrollX) + "px", top: Math.round(bTop + m + sy) + "px", width: Math.round(w) + "px", height: h + "px" });
      q.querySelectorAll("button").forEach((b) => { const s = f[b.dataset.t]; s && (b.disabled = !!s.disabled || !!s.hidden, b.classList.toggle("warn", s.classList.contains("warn"))); });
      q.classList.add("on");
    }
    let Ht = 0;
    function Re(t) {
      const e = f.bar, n = f.rail, o = f.btns;
      if (!e || !n || !o) return;
      const s = t && zt() ? zt().getBoundingClientRect() : null;
      s && (Ht = s.right);
      const i = Ht ? window.innerWidth - Ht - 20 : 0, c = !!t && i >= 110, d = [f.toprow, f.nextbox, f.clock, f.banner, f.counts, f.key, o, f.status, f.ver].filter(Boolean);
      if (c) {
        const l = Math.min(280, i);
        n.classList.toggle("narrow", l < 220), n.classList.toggle("tiny", l < 140);   // 4.10.148：tiny はボタンの字を小さくするだけ
        const r = Math.max(8, Math.round(t.top));
        Object.assign(n.style, { left: "auto", right: "10px", width: l + "px", top: r + "px", bottom: "8px", maxHeight: "", overflowY: "auto" }), n.classList.add("on"), d.some((p) => p.parentNode !== n) && d.forEach((p) => n.appendChild(p));
      } else n.classList.remove("on", "narrow", "tiny"), n.removeAttribute("style"), d.some((l) => l.parentNode !== e) && d.forEach((l) => e.appendChild(l));
      railOn = c, topqPlace();
      return e.classList.toggle("rail", c), c;
    }
    let Ft = 0;
    function Et() {
      Ft || (Ft = requestAnimationFrame(() => {
        Ft = 0, Le();
      }));
    }
    // 4.10.174：じゃんぱらの店舗・カテゴリのメニュー（「閉じる」付きで、画面幅いっぱい・リンクが多い欄）が開いている間は、左右の欄と検索ツールを隠す
    function siteMenuOpen() {
      const vw = window.innerWidth, vh = window.innerHeight;
      for (const el of document.querySelectorAll("a,button,span,p,div,li")) {
        if (el.childElementCount > 2) continue;
        const tx = (el.textContent || "").replace(/\s+/g, "");
        if (tx.length > 4 || !/閉じる$/.test(tx)) continue;
        if (el.closest("#jprush-ext,#jprush-ext-list,[class*=jprush]")) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || r.bottom < 0 || r.top > vh) continue;
        for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
          const ar = a.getBoundingClientRect();
          if (ar.width < vw * 0.8) continue;
          if (ar.height > vh * 1.5) break;
          if (ar.height >= vh * 0.15 && a.querySelectorAll("a").length >= 20) return true;
        }
      }
      return false;
    }
    let smOn = false, smTick = 0, smClickAt = 0;
    document.addEventListener("click", () => { smClickAt = Date.now(); }, true);
    function ckTick() {
      // 4.10.185：メニューの確認は、押した直後・開いている間・5秒ごとだけ（毎秒ページ全体を調べない）
      // 4.10.273：下の帯の時（スマホ版）は、PC版向けの調べ方を使わない（スマホ版のページの部品をメニューと見間違えて、タップのたびに帯が消えていた）。
      // 右上の「メニュー」（#ham_trigger）が開いている時だけ隠す
      const hamb = document.getElementById("ham_trigger");
      const sm = !railOn ? !!(hamb && hamb.checked) : smOn || Date.now() - smClickAt < 3e3 || ++smTick % 5 === 0 ? siteMenuOpen() : smOn, host = document.getElementById("jp3-host");
      if (sm !== smOn) smOn = sm, host && (host.style.visibility = sm ? "hidden" : ""), sm || Et();
      f.panel && f.panel.classList.toggle("popup-off", popupOpen());
      topqPlace();
      try { spPlace(); } catch (e) {}
      // 4.10.266：スマホの幅で、検索結果なのに商品カードを1つも読めない時だけ、お知らせと「作りをコピー」を出す（調べるための表示だけ）
      if (f.pnote) {
        const ph = false;   // 4.10.272：調べるための1行は出さない（原因が分かったため）   // 4.10.268：下の帯の時（右の欄を置けない時）。スマホ版のページは幅600px以上のことがある
        f.pnote.hidden = !ph;
        if (ph) { const l = document.getElementById(LIST_ID), sp = f.pnote.firstElementChild; sp && (sp.textContent = `v${Jt}・カード${document.querySelectorAll("a.search_itemlink").length}件・箱${document.querySelectorAll(".search_item_box").length}・幅${window.innerWidth}・一覧${l ? l.querySelectorAll(".xi").length : 0}件・エラー${DIAG.errs.length}件`); }
      }
      f.clock && (f.clock.textContent = new Date(w()).toLocaleTimeString("ja-JP", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    // 4.10.357：1秒ごとの更新（時計・消えるまで・表の残り時間など）は1つのタイマーでまとめて回す
    const SEC1 = new Set();
    let sec1T = 0;
    function every1s(fn) { SEC1.add(fn); sec1T || (sec1T = setInterval(() => { const t = performance.now(); for (const g of SEC1) { try { g(); } catch (e) {} } perfAdd("1秒ごとの更新", performance.now() - t); }, 1000)); }
    function popupOpen() {
      const vw = window.innerWidth, vh = window.innerHeight, hit = (el) => {
        if (!el || el.id === "jp3-host") return false;
        const c = getComputedStyle(el);
        if ((c.position !== "fixed" && c.position !== "absolute") || c.display === "none" || c.visibility === "hidden") return false;
        if (c.backgroundColor === "rgba(0, 0, 0, 0)" || c.backgroundColor === "transparent") return false;
        const r = el.getBoundingClientRect();
        return r.width >= vw * 0.9 && r.height >= vh * 0.9;
      };
      for (const el of document.body.children) {
        if (hit(el) || [...el.children].some(hit)) return true;
      }
      // 4.10.239：じゃんぱらのクーポン・オプションの一覧（暗い幕がページの飾りで描かれていて見つけられないため、見出しで見る）
      try {
        const xr = document.evaluate("//*[starts-with(normalize-space(text()),'使用可能な')]", document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < xr.snapshotLength; i++) {
          const e = xr.snapshotItem(i);
          if (e.closest("#jp3-host,#jp3-cart") || !/^使用可能な(クーポン|オプション)/.test(N(e.textContent))) continue;
          const r = e.getBoundingClientRect();
          if (r.width && r.height && getComputedStyle(e).visibility !== "hidden") return true;
        }
      } catch (e) {}
      // 4.10.212：画面の真ん中にかかっている画面いっぱいの幕（深い所にあるものも）
      try {
        for (const e of document.elementsFromPoint(vw / 2, vh / 2)) {
          if (e.closest && e.closest("#jp3-host,#jp3-cart,#jprush-ext-list,#jprush-ext")) continue;
          // 深い所の幕は「画面に固定」かつ「半透明（後ろが透ける暗い幕）」のものだけ（ページの土台の箱を間違えないように）
          for (let a = e; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
            const c = getComputedStyle(a);
            if (c.position !== "fixed" || !hit(a)) continue;
            const m = /rgba\([^)]*,\s*([\d.]+)\)/.exec(c.backgroundColor);
            if (m && Number(m[1]) < 1 || Number(c.opacity) < 1) return true;
          }
        }
      } catch (e) {}
      return false;
    }
    function Fn() {
      const t = document.createElement("div");
      t.id = "jp3-host";
      const e = t.attachShadow({ mode: "open" }), n = Object.keys(K).flatMap((o) => (o === "PRICE" ? [{ l: PRICE_STYLE.big.label, bg: PRICE_STYLE.big.bg, fg: PRICE_STYLE.big.fg, d: "値下げ率が15%以上（大幅）" }, { l: PRICE_STYLE.small.label, bg: PRICE_STYLE.small.bg, fg: PRICE_STYLE.small.fg, d: Fe[o] }] : [{ l: K[o], bg: o === "NEW" ? NEW_TAG_BG : o === "STOCK" ? STOCK_TAG.bg : U[o], fg: o === "STOCK" ? STOCK_TAG.fg : "#fff", d: Fe[o] }])).map((o) => `<div><b style="background:${o.bg};color:${o.fg};border-radius:0;padding:0 6px">${o.l}</b>\u3000${o.d}</div>`).join("");
      e.innerHTML = `<style>
      /* 4.10.141：パネルの字体を中央の一覧と同じゴシック系にする（all: initial のままだと既定の明朝系になり、英字が明朝に見えていた。表示だけ） */
      :host { all: initial; font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; }
      .bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483000; box-sizing: border-box;
        background: #fff; color: #222; font: 15px/1.45 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif;
        padding: 8px 12px calc(10px + env(safe-area-inset-bottom)); box-shadow: 0 -4px 14px rgba(0,0,0,.14); border-top: 2px solid #003792; }
      .top { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 32px; }
      .title { font-weight: 800; white-space: nowrap; color: #fff; background: #003792; padding: 4px 12px; border-radius: 0; text-align: center; }
      .sort { flex: 1; min-width: 0; font-size: 14px; color: #4a5a6e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sort.bad { color: #b0182f; font-weight: 700; }
      .sort.ok { color: #1d7a45; }
      .banner { margin: 8px 0; padding: 10px 12px; border-radius: 0; font-size: 15px; line-height: 1.5; font-weight: 600; color: #fff; transition: box-shadow .3s; }
      .bar.pulse { animation: jp3pulse 1.6s ease-out; }
      @keyframes jp3pulse { 0%, 45% { background: var(--pulse, #1f7a4a); } 100% { background: #fff; } }
      .banner:empty { display: none; }
      .banner.first { background: #003792; }
      .banner.ok { background: #1d7a45; }
      .banner.none { background: #5a6878; }
      .banner.warn { background: #8a5a00; }
      .banner.error { background: #a3261d; }
      .counts { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; font-size: 14px; align-items: center; }
      .chip { color: #fff; font-weight: 800; border-radius: 0; padding: 4px 10px; }
      .chip b { font-size: 17px; margin-left: 3px; }
      .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0 4px; }
      .btns button { width: 100%; min-width: 0; min-height: 40px; font-size: 15px; }
      .btns #first { grid-column: 1 / -1; }
      @media (min-width: 700px) { .bar:not(.side) .btns { grid-template-columns: repeat(4, 1fr); } .bar:not(.side) .btns #first { grid-column: 1 / -1; } }
      button { min-height: 44px; min-width: 96px; border: 0; border-radius: 0; background: #003792; color: #fff;
        font: inherit; font-weight: 700; padding: 0 14px; cursor: pointer; }
      button.sub { background: #eef2f8; color: #003792; border: 1px solid #cacaca; }
      button.on { background: #1d7a45; }
      button:disabled { opacity: .4; cursor: default; }
      button[hidden] { display: none; }
      .status { margin: 6px 0 2px; font-size: 14px; line-height: 1.6; color: #33435a; }
      .key { font-size: 13px; color: #222; background: #f4f6f9; border-left: 3px solid #003792; border-radius: 0; padding: 8px 10px; margin: 8px 0 4px; line-height: 1.6; }
      .key > div { margin: 3px 0; }
      .key .kt { font-weight: 800; color: #1f2d3d; }
      .status:empty { display: none; }
      .help { margin-top: 8px; font-size: 13px; color: #4a5a6e; }
      .help summary { padding: 6px 0; cursor: pointer; font-weight: 700; }
      .legend, .hist { font-size: 13px; color: #222; margin: 6px 0; }
      .legend div, .hist div { margin: 4px 0; }
      .panel { position: fixed; left: 0; right: 0; top: 0; z-index: 2147483001; background: #f4f6f9; color: #1b2430; overflow-y: auto;
        font: 14px/1.45 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
      .panel[hidden] { display: none; }
      .phead { position: sticky; top: 0; display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #172233; color: #fff; font-weight: 800; }
      .phead span { flex: 1; }
      .phead button.xcp, .panel.side .phead button.xcp { display: inline-flex; align-items: center; gap: 4px; flex: none; min-height: 0; min-width: 0; width: auto; height: 26px; padding: 0 8px; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.65); border-radius: 0; font: 700 12px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; white-space: nowrap; cursor: pointer; }   /* 4.10.190 */
      .sect { padding: 8px 12px 4px; font-weight: 700; color: #4a5a6e; }
      .row { display: flex; gap: 12px; align-items: center; padding: 10px 12px; border-bottom: 1px solid #dfe4ea; background: #fff; color: inherit; text-decoration: none; }
      .row.weak { opacity: .75; }
      .row.cur { background: #e6eefc; }
      .row.cart { background: #cbd2dd; }
      .row .seenmark { color: #1f7a3a; font-weight: 800; }
      .row img { width: 72px; height: 72px; object-fit: contain; flex: none; background: #eef1f4; border-radius: 6px; }
      .row .noimg { width: 72px; height: 72px; flex: none; background: #eef1f4; border-radius: 6px; }
      /* 4.10.118：画像の下に SRCODE（押すと、その番号の詳細ページ） */
      .row .lthumb { display: flex; flex-direction: column; gap: 3px; flex: none; min-width: 0; }
      .row .lsr { display: block; font: 600 10px/1.3 sans-serif; color: #003792; text-align: center; text-decoration: none; word-break: break-all; cursor: pointer; }
      .row .lsr:hover { text-decoration: underline; }
      .row .t { flex: 1; min-width: 0; }
      .row .nm { font-size: 15px; font-weight: 700; color: #333333; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      /* 4.10.142：番号は行の右上（価格の段の右端）に出す。名前の段には入れない（表示だけ） */
      .row .rno { flex: none; margin-left: auto; font-size: 15px; font-weight: 700; color: #003792; }
      .row .sub2 { font-size: 14px; color: #4a5a6e; }
      .tg { display: inline-block; margin: 0 4px 2px 0; padding: 0 7px; border-radius: 5px; color: #fff; font-size: 13px; font-weight: 700; }
      .tg.cartg { background: #374151; }
      .wstar { margin-left: 6px; font-size: 20px; line-height: 1; color: #b0b7c3; cursor: pointer; user-select: none; }   /* 4.10.191：要注意の★ */
      .wstar.on { color: #d4a017; }
      .weakbox { border-top: 1px solid #c5ced8; }
      .weakbox > summary { list-style: none; padding: 10px 12px; font-weight: 700; color: #4a5a6e; background: #e9eef5; cursor: pointer; }
      .weakbox > summary::-webkit-details-marker { display: none; }
      .panel.full { box-shadow: none; }
      .empty { padding: 24px 12px; color: #4a5a6e; }
      .ctl { display: flex; flex-wrap: wrap; gap: 8px; padding: 8px 12px; align-items: center; }
      .ctl input { flex: 1; min-width: 150px; height: 40px; box-sizing: border-box; border: 1px solid #c5ced8; border-radius: 9px; padding: 0 10px; font: inherit; }
      .ctl button { min-height: 40px; min-width: 0; font-size: 13px; }
      .note { padding: 0 12px 6px; font-size: 12px; color: #4a5a6e; }
      .grp { background: #fff; border-bottom: 1px solid #dfe4ea; }
      .grp > summary { list-style: none; padding: 8px 12px; cursor: pointer; }
      .grp > summary::-webkit-details-marker { display: none; }
      .grp .gn { font-weight: 700; }
      .grp .gs { font-size: 13px; color: #4a5a6e; }
      .srow { padding: 6px 12px 6px 22px; font-size: 13px; background: #f8f9fb; border-top: 1px solid #eef1f4; }
      .srow a { color: #003792; }
      /* \u5DE6\u306E\u5217\uFF08\u6A2A\u306B\u4E26\u3076\u3068\u304D\uFF09\uFF1A\u60C5\u5831\u306F\u5DE6\u3001\u64CD\u4F5C\u30DC\u30BF\u30F3\u306F\u53F3\u306B\u5BC4\u305B\u308B */
      .bar.side { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); column-gap: 10px; align-items: start; }
      .bar.side > .top, .bar.side > .banner, .bar.side > .counts, .bar.side > .key { grid-column: 1 / -1; }
      .bar.side > .btns { grid-column: 2; grid-row: 5; margin: 0; }
      .bar.side > .help { grid-column: 1; grid-row: 5; margin: 0; }
      .bar.side > .help[open] { grid-column: 1 / -1; grid-row: 6; }
      .bar.side > .status { grid-column: 1 / -1; margin: 6px 0 0; }
      .bar.side .btns { gap: 6px; }
      .bar.side .btns button { min-height: 40px; min-width: 0; padding: 0 4px; font-size: 14px; }
      .panel.side { box-shadow: none; box-sizing: border-box; border: 1px solid #cacaca; border-top: 0; }
      .panel.side .phead button { display: none; }
      .panel.side.split { display: flex; flex-direction: column; overflow: hidden; }
      .panel.side.split[hidden] { display: none; }
      .panel.popup-off { display: none !important; }
      /* 4.10.126：箱の「新」「完」で重ねて出す一覧（左の新着候補とは別。画面の上に重ねる） */
      .ov { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 2147483002; }
      .ov[hidden] { display: none; }
      .ovbg { position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(15, 23, 35, .35); }
      .ovbox { position: absolute; left: 50%; top: 6vh; transform: translateX(-50%); width: min(720px, calc(100vw - 24px)); max-height: 88vh; display: flex; flex-direction: column; background: #f4f6f9; color: #1b2430; border-radius: 10px; box-shadow: 0 12px 36px rgba(0, 0, 0, .35); overflow: hidden; box-sizing: border-box; }
      .ovhead { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 8px 12px; background: #003792; color: #fff; font-weight: 700; }
      .ovhead span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ovhead button { min-height: 34px; }
      .ovtabs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; background: #fff; border-bottom: 1px solid #dfe4ea; }
      .ovtabs .cp { margin-left: auto; }
      .ovbody { flex: 1; min-height: 0; overflow-y: auto; padding: 8px 10px; }
      .panel.side.split > .phead { flex: none; }
      .panel.side.split > #pbody { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .pbox { min-height: 0; overflow-y: auto; }
      .pbox.a { flex: 2 1 0; }
      .pbox.b { flex: 1 1 0; border-top: 1px solid #cacaca; }
      .pbox.folded { flex: 0 0 auto; }
      .pbox.folded > :not(.phd) { display: none; }
      .phd .fbtn { box-sizing: border-box; width: 28px; height: 28px; min-width: 28px; min-height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #003792; background: #fff; color: #003792; border-radius: 0; cursor: pointer; flex: none; }
      .phd .fbtn svg { display: block; width: 16px; height: 16px; }
      .phd { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 8px 10px; background: #fff; border-bottom: 1px solid #dfe4ea; font-weight: 700; color: #1b2430; }
      .seg { display: inline-flex; flex: none; }
      .seg button { min-height: 28px; min-width: 0; padding: 0 8px; font-size: 12px; border: 1px solid #003792; background: #fff; color: #003792; border-radius: 0; }
      .seg button.on { background: #003792; color: #fff; }
      .pact { display: inline-flex; align-items: center; gap: 8px; flex: none; }
      .pact .cp { box-sizing: border-box; width: 28px; height: 28px; min-height: 28px; min-width: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #003792; background: #fff; color: #003792; border-radius: 0; cursor: pointer; flex: none; }
      .pact .cp svg { display: block; width: 16px; height: 16px; }
      .panel.side .phead { background: #003792; height: 38px; padding: 0 12px; box-sizing: border-box; overflow: hidden; }
      .panel.side .phead span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* \u53F3\u306E\u4F59\u767D\u306B\u7F6E\u304F\u64CD\u4F5C\u30DC\u30BF\u30F3 */
      .rail { position: fixed; display: none; box-sizing: border-box; background: #fff; padding: 0 8px 8px; border: 1px solid #cacaca; border-top: 0; z-index: 2147483000; }
      .rail.on { display: block; }
      .rail .btns { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 0; }
      .rail.narrow .btns { grid-template-columns: 1fr; }
      .rail .btns button { min-height: 42px; min-width: 0; padding: 0 6px; font-size: 14px; }
      /* \u53F3\u306E\u4F59\u767D\u3078\u79FB\u3057\u305F\u3068\u304D\u306F\u3001\u5DE6\u306E\u30D0\u30FC\u306F\u51FA\u3055\u306A\u3044\uFF08\u5DE6\u306F\u65B0\u7740\u4E00\u89A7\u3060\u3051\uFF09 */
      .bar.rail { display: none; }
      .rail .top { flex-wrap: wrap; row-gap: 4px; }
      .rail > .top { margin: 0 -8px 6px; height: 38px; min-height: 38px; padding: 0 8px; background: #003792; justify-content: center; }
      .rail > .top .title { background: none; padding: 0; color: #fff; text-align: center; }
      .rail.narrow .key { display: none; }   /* \u72ED\u3044\u3068\u304D\u306F\u3001\u5370\u306E\u8AAC\u660E\u306F\u4E0B\u306E\u300C\u5370\u306E\u610F\u5473\u300D\u306B\u4EFB\u305B\u308B */
      /* 4.10.1：右の列は縦に並べる。見出しごとに区切る */
      .btns .gh { grid-column: 1 / -1; font-size: 12px; font-weight: 700; color: #4a5a6e; margin: 6px 0 -4px; }
      .btns .gh:first-child { margin-top: 0; }
      .btns #reload, .btns #hourly, .btns #jump, .btns #first, .btns #nextpage { grid-column: 1 / -1; }
      .rail .btns #reload { min-height: 46px; font-size: 16px; }
      .rail .counts { display: none; }
      /* 左の候補カード：価格を一番上に大きく出す */
      .row .pr { font-size: 20px; font-weight: 800; color: #F31515; line-height: 1.2; margin-bottom: 2px; }
      .row .pr .pc { font-size: 12px; font-weight: 600; color: #4a5a6e; }      /* 4.10.2：右の列（A〜F） */
      .btns .pair { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .btns .pair button { min-height: 44px; min-width: 0; }
      .btns #list, .btns #sold, .btns #hourly, .btns #reload { grid-column: 1 / -1; }
      .btns > details.more { grid-column: 1 / -1; border-top: 1px solid #dfe4ea; padding-top: 4px; font-size: 13px; }
      .more summary { font-weight: 700; color: #4a5a6e; cursor: pointer; padding: 6px 0; }
      .more button { width: 100%; margin: 6px 0 0; }
      .rail, .rail button, .rail summary { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; }
      .rail .key, .rail .status { display: none; }
      /* 右の列の帯は、警告・エラーのときだけ出す（結果の長い文は出さない） */
      .rail .banner.ok, .rail .banner.none, .rail .banner.first, .rail .banner:empty { display: none; }
      .rail .pair button { font-size: 16px; padding: 0 2px; min-height: 44px; }
      .rail .banner { font-size: 13px; padding: 6px 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
      .row .nm { -webkit-line-clamp: 3; overflow-wrap: anywhere; }
      /* 4.10.6：右の上の状態箱（次回・新着・未見）と、更新ボタンの見た目（自動更新と区別） */
      .nextbox { border: 1px solid #cacaca; background: #fff; padding: 6px 10px; margin: 0 0 8px; color: #33435a; font-size: 13px; }
      .nextbox:empty { display: none; }
      .nb-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; }
      .nb-row > span { color: #4a5a6e; font-weight: 900; white-space: nowrap; }   /* 4.10.189：「取得」を折り返さない（時刻の幅で高さが変わって「次へ」が動かないように） */
      .nb-row > b { white-space: nowrap; }
      .nb-row > b { font-size: 18px; color: #1f2d3d; }
      .nb-row > b.ok { font-size: 16px; font-weight: 900; color: #1d7a45; }
      .nb-row > b.ng { font-size: 15px; color: #c8102e; }
      .nb-foot { display: flex; justify-content: space-between; border-top: 1px solid #dfe4ea; margin-top: 4px; padding-top: 4px; font-weight: 700; color: #33435a; }
      /* 4.10.125：箱の「新」「完」は、文字だけの押せるボタン（下線あり。global の button 指定を打ち消す） */
      .nb-foot .nbk { min-height: 0; min-width: 0; padding: 0; border: 0; border-radius: 0; background: none; color: #33435a; font: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
      .nb-warn { font-size: 12px; color: #b45309; margin-top: 4px; line-height: 1.4; }
      .rail .btns #reload { min-height: 46px; font-size: 16px; }
      .rail .counts { display: none; }
      /* 左の候補カード：価格を一番上に大きく出す */
      .row .pr { font-size: 20px; font-weight: 800; color: #F31515; line-height: 1.2; margin-bottom: 2px; }
      .row .pr .pc { font-size: 12px; font-weight: 600; color: #4a5a6e; }      /* 4.10.2：右の列（A〜F） */
      .btns .pair { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .btns .pair button { min-height: 44px; min-width: 0; }
      .btns #list, .btns #sold, .btns #hourly, .btns #reload { grid-column: 1 / -1; }
      .btns > details.more { grid-column: 1 / -1; border-top: 1px solid #dfe4ea; padding-top: 4px; font-size: 13px; }
      .more summary { font-weight: 700; color: #4a5a6e; cursor: pointer; padding: 6px 0; }
      .more button { width: 100%; margin: 6px 0 0; }
      .rail, .rail button, .rail summary { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; }
      .rail .key, .rail .status { display: none; }
      /* 右の列の帯は、警告・エラーのときだけ出す（結果の長い文は出さない） */
      .rail .banner.ok, .rail .banner.none, .rail .banner.first, .rail .banner:empty { display: none; }
      .rail .pair button { font-size: 16px; padding: 0 2px; min-height: 44px; }
      .rail .banner { font-size: 13px; padding: 6px 8px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
      .row .nm { -webkit-line-clamp: 3; overflow-wrap: anywhere; }
      /* 4.10.6：右の上の状態箱（次回・新着・未見）と、更新ボタンの見た目（自動更新と区別） */
      .nextbox { border: 1px solid #cacaca; background: #fff; padding: 8px 10px; margin: 0 0 8px; color: #33435a; }
      .nextbox:empty { display: none; }
      .nb-next { font-size: 18px; font-weight: 800; color: #1f2d3d; line-height: 1.3; }
      .nb-cnt { font-size: 13px; color: #4a5a6e; margin-top: 2px; }
      .nb-warn { font-size: 12px; color: #b45309; margin-top: 4px; line-height: 1.4; }
      .rail .btns #reload { background: #fff; color: #003792; border: 2px solid #003792; }
      /* 4.10.11：右の列の「並び順：新着順」は、新着順でないときだけ出す */
      .sort, .banner.sortx { display: none !important; }
      .btns #first.warn { background: #c8102e; color: #fff; border-color: #c8102e; font-weight: 800; }
      .btns button:disabled { background: #eef0f3 !important; color: #a3adbb !important; border-color: #dfe4ea !important; opacity: 1 !important; }
      .rail .btns #first { min-height: 48px; }
      /* 4.10.150：検索ツールのボタン周り（参考画像に合わせる）。地は白・紺の太い枠・紺の字（いままでの「更新」の見た目）。4.10.151：角は四角（ページに溶け込ませる） */
      .btns .sep { grid-column: 1 / -1; height: 1px; background: #dfe4ea; margin: 4px 0; }
      .btns .pgnum { grid-column: 1 / -1; text-align: center; font-size: 18px; font-weight: 700; color: #4a5a6e; letter-spacing: .02em; }
      .btns .pgnum:empty { display: none; }
      .btns .pair2 { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr; gap: 6px; }   /* 4.10.153：更新・先頭へ は縦1列 */
      .btns .pair2 > button { grid-column: auto !important; }
      .btns button.tile, .rail .btns #nextpage.tile, .rail .btns #reload.tile, .rail .btns #first.tile, .bar .btns #nextpage.tile, .bar .btns #reload.tile, .bar .btns #first.tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: #fff; color: #003792; border: 2px solid #003792; border-radius: 0; font-weight: 700; white-space: nowrap; overflow: hidden; padding: 6px 2px; box-sizing: border-box; height: auto; }
      .btns button.tile svg { flex: none; }
      .btns #nextpage.tile, .rail .btns #nextpage.tile, .rail.narrow .btns #nextpage.tile { min-height: 96px; font-size: 18px; grid-column: 1 / -1; }
      .btns .pair2 > #reload.tile, .btns .pair2 > #first.tile, .rail .btns .pair2 > #reload.tile, .rail .btns .pair2 > #first.tile { min-height: 62px; font-size: 15px; }
      /* 4.10.152：更新・先頭は「機能」のボタン（新着詳細など）と同じ見た目（薄い青灰の地・細い灰色の枠・紺の字）。次へ は白地・紺の太い枠のまま */
      .btns .pair2 > #reload.tile, .btns .pair2 > #first.tile, .rail .btns .pair2 > #reload.tile, .rail .btns .pair2 > #first.tile { background: #eef2f8; color: #003792; border: 1px solid #cacaca; }
      .btns #first.tile.warn, .rail .btns .pair2 > #first.tile.warn { background: #c8102e; color: #fff; border-color: #c8102e; }
      .btns #hourly, .rail .btns #hourly, .rail.narrow .btns #hourly { display: flex; align-items: center; justify-content: center; gap: 8px; background: #eef0f3; color: #5f6b7a; border: 0; border-radius: 0; font-weight: 700; font-size: 15px; height: 46px; min-height: 46px; white-space: nowrap; }
      .btns #hourly::before { content: ""; flex: none; width: 10px; height: 10px; border-radius: 50%; background: #9aa5b4; }
      .btns #hourly.on, .rail .btns #hourly.on { background: #e6f4ea; color: #1d7a45; }
      .btns #hourly.on::before { background: #1d7a45; }
      /* 4.10.15：仕様説明（オーバーレイ） */
      .spec { position: fixed; left: 0; right: 0; top: 0; bottom: 0; z-index: 2147483002; background: #f4f6f9; color: #1b2430; overflow-y: auto; font: 14px/1.6 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; }
      .spec[hidden] { display: none; }
      .spec-body { padding: 4px 14px 28px; max-width: 720px; margin: 0 auto; }
      .spec h4 { margin: 16px 0 6px; font-size: 14px; color: #1f2d3d; border-left: 3px solid #003792; padding-left: 8px; }
      .spec-ul { margin: 0; padding-left: 1.2em; }
      .spec-ul li { margin: 4px 0; }
      .spec .legend { font-size: 13px; }
      .btns #spec { grid-column: 1 / -1; }
      .btns #list, .btns #sold { white-space: pre-line; line-height: 1.35; padding-top: 4px; padding-bottom: 4px; text-align: center; }
      .btns #spec { text-align: center; }
      /* 4.10.16：時計とバージョン表示 */
      .clock { font-size: 22px; font-weight: 800; color: #003792; font-variant-numeric: tabular-nums; line-height: 1.2; margin: 6px 0 8px; text-align: center; }
      .ver { margin-top: 8px; font-size: 12px; font-weight: 700; color: #4a5a6e; text-align: center; }
      .grp > summary.sect { cursor: pointer; background: #e9eef5; padding: 8px 12px; }
      /* 4.10.90：左の新着候補は、画像・価格・カートを小さくまとめる（情報は減らさない。詳しくは拡張の詳細で） */
      .row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; }
      .row img, .row .noimg { width: 56px; height: 56px; flex: none; }
      .row .t { flex: 1; min-width: 0; }
      .row .ptop { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 2px; }
      .row .ptop .pr { font-size: 17px; margin-bottom: 0; }
      .row .kfoot { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .row .kfoot > .sub2 { flex: 1 1 auto; min-width: 0; }
      .row .kfoot .jprush-cart { flex: none; }
      .row .nm { font-size: 14px; line-height: 1.35; -webkit-line-clamp: 2; }
      .row .sub2 { font-size: 12px; }
      .row .tg { font-size: 11px; padding: 0 5px; margin-bottom: 2px; }
      /* 4.10.246：スマホ（下に出す時）は「次へ」「更新」「先頭へ」だけ（お試し。見えなくするだけで裏の処理は動く） */
      .bar:not(.side) > :not(.btns) { display: none !important; }
      .bar:not(.side) .btns > :not(#nextpage):not(.pair2):not(.pnote) { display: none !important; }
      /* 4.10.265：スマホの3つは1行に（« ↻ 次へ）。タブレットのヘッダーのボタンと同じ見た目（白地・青い1pxの線・小さめの字） */
      .bar:not(.side) { padding: 12px 12px calc(12px + env(safe-area-inset-bottom)) !important; border-top: 1px solid #003792 !important; }
      .bar:not(.side) .btns { display: flex !important; flex-wrap: wrap; gap: 8px !important; margin: 0 !important; }
      .bar:not(.side) .btns .pair2 { display: contents !important; }
      .bar:not(.side) .btns button.tile { height: 48px !important; min-height: 48px !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box; background: #fff !important; color: #003792 !important; border: 1px solid #003792 !important; border-radius: 4px !important; font: 700 15px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif !important; flex-direction: row !important; gap: 4px !important; }
      .bar:not(.side) .btns #first.tile { order: 1; flex: 0 0 76px; }
      .bar:not(.side) .btns #reload.tile { order: 2; flex: 0 0 76px; }
      .bar:not(.side) .btns #nextpage.tile { order: 3; flex: 1 1 0; min-width: 0; flex-direction: row-reverse !important; }
      .bar:not(.side) .btns #first.tile > span, .bar:not(.side) .btns #reload.tile > span { display: none; }
      .bar:not(.side) .btns button.tile svg { width: 18px !important; height: 18px !important; }
      .bar:not(.side) .btns #nextpage.tile svg { width: 15px !important; height: 15px !important; }
      .bar:not(.side) .btns #first.tile.warn { background: #c8102e !important; color: #fff !important; border-color: #c8102e !important; }
      .bar:not(.side) .btns button.tile:disabled { background: #eef0f3 !important; color: #a3adbb !important; border-color: #dfe4ea !important; }
      .pnote { display: none; }
      /* 4.10.286：スマホ版の上の空きに、秒までの時計（ロゴと「会員ページ」の間）と、全検索コピー（黒い「検索結果」の帯の右） */
      .spclock { display: none; position: absolute; z-index: 2147483000; color: #0f2c8c; font: 800 24px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; font-variant-numeric: tabular-nums; letter-spacing: .02em; white-space: nowrap; pointer-events: none; text-align: center; }
      .spclock.spon { display: block; }
      .spxcp { display: none; position: absolute; z-index: 2147483000; align-items: center; justify-content: center; gap: 4px; margin: 0; padding: 0 10px; box-sizing: border-box; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.65); border-radius: 0; font: 400 13px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; white-space: nowrap; cursor: pointer; }
      .spxcp.spon { display: inline-flex; }
      .spxcp svg { width: 14px; height: 14px; }
      .bar:not(.side) .btns .pnote:not([hidden]) { display: flex; order: 0; flex: 0 0 100%; align-items: center; gap: 8px; font-size: 12px; color: #4a5a6e; }
      .pnote span { flex: 1 1 auto; min-width: 0; }
      .bar:not(.side) .btns .pnote button { flex: none; width: auto !important; min-width: 0 !important; min-height: 0 !important; height: 28px; padding: 0 10px; background: #fff; color: #003792; border: 1px solid #003792; border-radius: 4px; font: 700 12px/1 system-ui, sans-serif; }
      /* 4.10.258：ヘッダーの空きに 先頭・更新・次へ。白地に青枠で控えめに。ヘッダーの上下・ロゴとリンクの間の真ん中。ヘッダーと一緒に流れる */
      .topq { display: none; position: absolute; z-index: 2147483000; }
      .topq.on { display: flex; gap: 8px; }
      .topq button { height: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: center; background: #fff; color: #003792; border: 1px solid #003792; border-radius: 4px; padding: 0; }   /* 4.10.263：線は1px */
      .topq button.ic { flex: none; height: 100%; width: auto; aspect-ratio: 1 / 1; }   /* 4.10.371：両端は必ず正方形 */
      .topq button[data-t="first"] { order: 1; } .topq button.nx { order: 2; } .topq button[data-t="reload"] { order: 3; }   /* 4.10.370：« 次へ ↻ の順 */
      .topq button.nx { flex: 1; min-width: 0; gap: 4px; font: 700 15px/1 system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; letter-spacing: .06em; }
      .topq button.warn { background: #c8102e; color: #fff; border-color: #c8102e; }
      .topq button:disabled { background: #eef0f3; color: #a3adbb; border-color: #dfe4ea; }
      .topq.slim button.ic { display: none; }
    </style>
    <div class="spclock" id="spclock"></div><button class="spxcp" id="spxcp" type="button" title="全検索の新着候補をAI用にコピー" aria-label="全検索の新着候補をコピー">${ICON_COPY}全検索</button><div class="topq" id="topq"><button type="button" class="ic" data-t="first" title="先頭へ" aria-label="先頭へ"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6l-6 6 6 6"/><path d="M19 6l-6 6 6 6"/></svg></button><button type="button" class="ic" data-t="reload" title="更新" aria-label="更新"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/></svg></button><button type="button" class="nx" data-t="nextpage">次へ<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></div>
    <div class="bar" id="bar">
      <div class="top" id="toprow">
        <span class="title">\u691C\u7D22\u30C4\u30FC\u30EB</span>
        <span class="sort" id="sort"></span>
      </div>
      <div class="clock" id="clock"></div>
      <div class="nextbox" id="nextbox"></div>
      <div class="banner" id="banner"></div>
      <div class="counts" id="counts"></div>
      <div class="key" id="key"><div><span class="kt">\u5546\u54C1\u540D\uFF1A</span><b style="color:#c8102e">\u8D64</b>\uFF1D\u307E\u3060\u898B\u3066\u3044\u306A\u3044\u3000<b style="color:#000">\u9ED2</b>\uFF1D\u898B\u305F\u3000<b style="color:#5f6b7a">\u7070</b>\uFF1D\u958B\u3044\u305F</div><div><b style="color:#2e2e2e">SOLD OUT</b>\uFF1D\u30AB\u30FC\u30C9\u304C\u7070\u8272\uFF08\u958B\u3044\u305F\u304B\u306F\u5546\u54C1\u540D\u306E\u8272\u3068\u4E0B\u7DDA\u3067\u5206\u304B\u308A\u307E\u3059\uFF09</div></div>
      <div class="btns">
        <!-- 4.10.150：参考画像に合わせた並び。自動（時計のすぐ下）→ 区切り → 今のページ／全ページ → 次へ（大）→ 更新・先頭（横並び）。前のページは出さない -->
        <button id="hourly" class="sub" type="button">自動 OFF</button>
        <div class="sep"></div>
        <div class="pgnum" id="pgnum"></div>
        <button id="nextpage" class="sub tile big" type="button" title="次のページへ" aria-label="次のページへ"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg><span>次へ</span></button>
        <div class="pair2"><button id="reload" class="tile" type="button" title="更新" aria-label="更新"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/></svg><span>更新</span></button><button id="first" class="sub tile" type="button" hidden title="1ページ目へ（120個・新着順）" aria-label="1ページ目へ"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6l-6 6 6 6"/><path d="M19 6l-6 6 6 6"/></svg><span>先頭へ</span></button></div>
        <button id="prevpage" class="sub" type="button" hidden style="display:none" title="前のページ" aria-label="前のページ">◀</button>
        <div class="pair" style="display:none"><button id="gotop" class="sub" type="button" title="このページの先頭へ" aria-label="このページの先頭へ">↑</button><button id="gobottom" class="sub" type="button" title="このページの末尾へ" aria-label="このページの末尾へ">↓</button></div>
        <div class="gh" style="display:none">候補へ移動 <span id="markpos"></span></div>
        <div class="pair" style="display:none"><button id="prev" class="sub" type="button" title="前の印" aria-label="前の印">◀</button><button id="next" class="sub" type="button" title="次の印" aria-label="次の印">▶</button></div>
        <div class="sep"></div>
        <div class="gh">機能</div>
        <button id="list" class="sub" type="button">新着詳細</button>
        <button id="sold" class="sub" type="button">完売記録</button>
        <button id="watchl" class="sub" type="button">要注意</button>
        <button id="spec" class="sub" type="button">仕様説明</button>
        <button id="jump" class="sub" type="button" hidden></button>
        <div class="pnote" id="pnote" hidden><span>一覧を作れませんでした（商品カードを読めません）</span><button type="button" id="pnotecp">作りをコピー</button></div>
      </div>
      <div class="status" id="status"></div>
      <div class="ver" id="ver">v${Jt}</div>
    </div>
    <div class="spec" id="specbox" hidden>
      <div class="phead"><span>仕様説明（v${Jt}）</span><button id="specclose" class="sub" type="button">閉じる</button></div>
      <div class="spec-body">
        <h4>印の意味</h4>
        <div class="legend">${n}</div>
        <h4>商品名の色</h4>
        <ul class="spec-ul"><li>赤：まだ見ていない</li><li>黒：見た（スクロールで上へ通り過ぎた商品。ページの一番下まで来たら残りも見たことになります）</li><li>灰：開いた</li></ul>
        <h4>印の期限</h4>
        <ul class="spec-ul"><li>印は次の更新まで濃く残ります。</li><li>更新は ${jt.join("・")} 時の33分30秒ごろです（例：17:33 の次は20:33、21:33 の次は翌14:33）。</li><li>次の更新が来た後、または見た後は薄くなります。</li><li>14〜17時台の印は20:33に、20:33以降の印は翌14:33に消えます。</li></ul>
        <h4>候補一覧</h4>
        <ul class="spec-ul"><li>在庫あり：印が付いてから1時間以内の商品。</li><li>売り切れ：売り切れてから3日以内の商品。</li><li>1つの商品は、どちらか一方にだけ出ます。見た商品は消さず「✓見た」と薄く表示します。</li></ul>
        <h4>移動</h4>
        <ul class="spec-ul"><li>候補へ移動 ◀ ▶：濃い印の商品と、見てから1時間以内の商品を上から順に移動します。最後の次は一番上に戻ります。</li><li>次へ：次のページへ移動します。上に「今のページ／全ページ数」を出します。</li><li>↑ ↓：このページの先頭・末尾へ移動します。既読は変わりません。</li><li>先頭へ：120個・新着順・1ページ目を開きます。</li></ul>
        <h4>自動ON</h4>
        <ul class="spec-ul"><li>裏に回っているタブだけを、更新（33分30秒）の34分ごろに1ページ目から開き直します。見ているタブは開き直しません。</li></ul>
        <h4>売切履歴</h4>
        <ul class="spec-ul"><li>一覧で SOLD OUT になった商品を記録します（値段が分からない商品も含みます）。ITMCODE でまとめます。</li><li>90日を過ぎた1台ごとの記録は、商品ごとの合計にまとめます。</li></ul>
        <h4>記録の履歴</h4>
        <div class="hist" id="hist"></div>
      </div>
    </div>
    <div class="rail" id="rail"></div>
    <div class="panel" id="panel" hidden>
      <div class="phead"><span id="ptitle">\u65B0\u7740\u4E00\u89A7</span><button id="xcp" class="xcp" type="button" title="全検索の新着候補をAI用にコピー" aria-label="全検索の新着候補をコピー" style="display:none">${ICON_COPY}全検索（今回）</button><button id="xcp2" class="xcp" type="button" title="全検索の新着候補（在庫半日・完売全て）をAI用にコピー" aria-label="全検索の新着候補（半日）をコピー" style="display:none">${ICON_COPY}全検索（半日）</button><button id="pclose" class="sub" type="button">\u9589\u3058\u308B</button></div>
      <div id="pbody"></div>
    </div>
    <div class="ov" id="ov" hidden>
      <div class="ovbg" id="ovbg"></div>
      <div class="ovbox">
        <div class="ovhead"><span id="ovtitle"></span><button id="ovclose" class="sub" type="button">閉じる</button></div>
        <div class="ovtabs seg" id="ovtabs"></div>
        <div class="ovbody" id="ovbody"></div>
      </div>
    </div>`, document.body.appendChild(t), f.bar = e.getElementById("bar");
      for (const o of ["xcp2", "sort", "clock", "ver", "banner", "nextbox", "counts", "reload", "list", "next", "first", "hourly", "status", "hist", "panel", "ptitle", "pclose", "pbody", "sold", "jump", "key", "spec", "specbox", "specclose", "toprow", "prev", "prevpage", "nextpage", "pgnum", "gotop", "gobottom", "markpos", "ov", "ovbg", "ovtitle", "ovclose", "ovtabs", "ovbody", "xcp", "watchl", "topq", "pnote", "pnotecp", "spclock", "spxcp"]) f[o] = e.getElementById(o);
      f.spxcp && (f.spxcp.onclick = (ev) => { ev.stopPropagation(), copyAllSearches(f.spxcp); });
      f.pnotecp && (f.pnotecp.onclick = (ev) => { ev.stopPropagation(), copyPageShape(f.pnotecp); });
      f.topq && f.topq.querySelectorAll("button").forEach((b) => { b.onclick = (ev) => { ev.stopPropagation(); const s = f[b.dataset.t]; s && !s.disabled && s.click(); }; });
      f.watchl && (f.watchl.onclick = () => ve("watch", watchPanel));
      f.xcp && (f.xcp.onclick = (ev) => { ev.stopPropagation(), copyAllSearches(f.xcp, "now"); });
      f.xcp2 && (f.xcp2.onclick = (ev) => { ev.stopPropagation(), copyAllSearches(f.xcp2, "all"); });
      f.rail = e.getElementById("rail"), f.btns = e.querySelector(".btns"), ckTick(), every1s(ckTick), document.addEventListener("click", () => setTimeout(ckTick, 120), true), f.jump.onclick = to, window.addEventListener("scroll", Vt, { passive: true }), window.addEventListener("scroll", Et, { passive: true }), window.addEventListener("resize", Et, { passive: true }), Le(), window.ResizeObserver && new ResizeObserver(Et).observe(f.bar), Vt(), f.sold.onclick = () => ve("sold", () => Ie("")), f.list.onclick = () => { listFull = true; vt(); }, f.spec.onclick = () => { f.specbox.hidden = false; }, f.specclose.onclick = () => { f.specbox.hidden = true; }, f.pclose.onclick = () => {
        listFull = false;
        if (_) {
          vt();
          return;
        }
        f.panel.hidden = true, f.panelKind = null;
      }, f.reload.onclick = () => {
        f.reload.disabled = true, f.reload.textContent = "\u958B\u304D\u76F4\u3057\u4E2D\u2026", location.reload();
      }, f.next.onclick = Vn, f.first.onclick = () => {
        location.href = Ye();
      }, f.hourly.onclick = Bn, f.prev.onclick = Vq, f.gotop.onclick = () => goEdge(false), f.gobottom.onclick = () => goEdge(true), f.prevpage.onclick = () => { if (Rt() > 1) location.href = Pgo(Rt() - 1); }, f.nextpage.onclick = () => { location.href = Pgo(Rt() + 1); }, f.nextbox.addEventListener("click", (ev) => {
        // 4.10.126：箱の「新」「完」を押すと、その数と同じ中身の一覧を重ねて出す（左の新着候補はそのまま）。表示だけ（判定・記録・数字は変えない）
        const b = ev.target && ev.target.closest ? ev.target.closest("[data-nb]") : null;
        if (!b) return;
        openOv(b.dataset.nb === "new" ? "new" : "sold");
      }), f.ovclose.onclick = closeOv, f.ovbg.onclick = closeOv;
    }
    function Wn(t) {
      if (!t.ok) return `${T(t.at)}\u3000${t.page || "?"}\u30DA\u30FC\u30B8\u76EE\u3000\u30A8\u30E9\u30FC\uFF1A${t.error}`;
      const e = ut.filter((o) => t.counts && t.counts[o]).map((o) => `${K[o]} ${t.counts[o]}`), n = t.hasRef ? e.length ? "\u65B0\u3057\u3044\u5370\uFF1A" + e.join("\u30FB") : "\u65B0\u3057\u3044\u5370\u306A\u3057" : "\u8A18\u9332\uFF08\u57FA\u6E96\u306A\u3057\uFF09";
      return `${T(t.at)}\u3000${t.page}\u30DA\u30FC\u30B8\u76EE\u3000${n}\uFF08${t.count}個\uFF09`;
    }
    // 4.10.83：中央の検索結果の下に、今のページの印付き商品だけを掲載順で並べる欄（通常／拡張の切り替え）。
    // 保存済みの記録だけを使い、通信は増やさない。印の無い商品は並べない
    const EXT_ID = "jprush-ext", LIST_ID = "jprush-ext-list", SW_ID = "jprush-ext-switch";
    // 4.10.108：表示は3つ。通常＝一覧なし／新着＝NEW・最安値↓・復活・戻りの印だけ（4.10.114）／拡張＝印の付いたものすべて。保存の値（off・new・on）は記録に残すだけで、表示には使わない（4.10.115）
    const EXT_MODES = [["off", "通常"], ["new", "新着"], ["on", "拡張"]];
    const setExt = (v) => { try { $("extView", v); } catch (e) { /* 保存できなくても表示は続ける */ } };
    // 4.10.115：一覧の表示は件数で決める。新着の行が5以下（0件を含む）なら拡張、6以上なら新着。保存の表示は使わない（通常も上書きする）。お知らせは出さない
    // 手で通常・新着・拡張のどれかを押したら、そのページを開いている間はその表示のまま（件数では切り替えない）。ページを開き直すと、また件数で決める
    const EXT_AUTO_MAX = 5;
    let extPick = null;
    function extShown(all) {
      if (extPick) return extPick;
      // 4.10.272：120件・新着順のページ以外は「通常」（かぶせない）。普通の検索ができるように。手で新着・拡張を押せば出す
      try { if (Ge(document) !== 120 || !te.test(re(document) || "")) return "off"; } catch (e) { return "off"; }
      // 4.10.162：数えるのは新着モードで実際に出る行（小さい値下げの印は数えない）
      return all.filter((x) => isNewRow({ evs: x.evs.filter(showEv) })).length <= EXT_AUTO_MAX ? "on" : "new";
    }
    function extStyle() {
      if (document.getElementById("jprush-ext-style")) return;
      const st = document.createElement("style");
      st.id = "jprush-ext-style";
      st.textContent = [
        `#${EXT_ID}{margin:16px 0 24px;font:13px/1.5 sans-serif;color:#222;}`,
        `#${EXT_ID} .xh{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:8px 12px;background:#003792;color:#fff;font-weight:700;}`,
        `#${SW_ID}{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:inline-flex;gap:4px;margin:0;z-index:1;}`,
        `#${SW_ID} button,#${EXT_ID} .xh button{margin:0;padding:2px 10px;border:1px solid #fff;border-radius:6px;background:transparent;color:#fff;font:700 12px/1.4 sans-serif;cursor:pointer;}`,
        `#${SW_ID} button.on,#${EXT_ID} .xh button.on{background:#fff;color:#003792;}`,
        `#${LIST_ID}.xl{position:absolute;z-index:1;overflow:auto;box-sizing:border-box;display:block;padding:0;background:#fff;border:0;font:14px/1.45 system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",Meiryo,sans-serif;color:#1b2330;}`,
        `#${LIST_ID} .xi{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:10px 12px;border-bottom:1px solid #dfe4ea;background:#fff;min-width:0;}`,
        `#${LIST_ID} .xi img,#${LIST_ID} .xnoimg{width:72px;height:72px;object-fit:contain;background:#eef1f4;border-radius:6px;}`,
        `#${LIST_ID} .xthumb{display:flex;flex-direction:column;gap:3px;min-width:0;}`,
        `#${LIST_ID} .xsr{display:block;font:600 10px/1.3 sans-serif;color:#003792;text-align:center;text-decoration:none;word-break:break-all;}`,
        `#${LIST_ID} .xsr:hover{color:#003792;text-decoration:underline;}`,
        // 4.10.193：前回の行は中身ごとに薄くする（SOLD OUT の札だけは薄くしない）
        `#${LIST_ID} .xi.jp3-prev > :not(.xb),#${LIST_ID} .xi.jp3-prev > .xb > :not(.xtags),#${LIST_ID} .xi.jp3-prev .xtags > :not(.xsold){opacity:.55;}`,
        `#${LIST_ID} .xi.xout{background:rgba(0,0,0,.07);}`,
        `#${LIST_ID} .xb{min-width:0;}`,
        `#${LIST_ID} .xtags{margin:0 0 3px;}`,
        `#${LIST_ID} .xt{display:inline-block;margin:0 4px 2px 0;padding:0 7px;border-radius:5px;color:#fff;font-size:12px;font-weight:700;}`,
        `#${LIST_ID} .xn{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:15px;font-weight:700;color:#333333;text-decoration:none;overflow-wrap:anywhere;}`,
        `#${LIST_ID} .xmeta{margin-top:2px;font-size:12px;color:#4a5a6e;}`,
        `#${LIST_ID} .xside{display:flex;flex-direction:column;align-items:flex-end;gap:4px;text-align:right;min-width:0;}`,
        // 4.10.247：価格は商品名のすぐ下。「中古」「未使用」などは色の札（決まった幅で並べる）
        `#${LIST_ID} .xi{cursor:pointer;}`,
        `#${LIST_ID} .xpr{display:flex;flex-wrap:wrap;margin-top:3px;font-size:22px;font-weight:800;color:#F31515;line-height:1.25;}`,   // 4.10.252：価格を少し大きく（20→22）
        `#${LIST_ID} .xpr .xpc{flex:0 0 210px;min-width:0;white-space:nowrap;display:inline-flex;align-items:center;gap:6px;}`,
        `#${LIST_ID} .xpr .xcd{flex:none;display:inline-block;padding:0;font-size:13px;font-weight:700;line-height:1.5;background:none;color:#4a5a6e;}`,   // 4.10.252：状態は囲みなし・文字の色だけ
        `#${LIST_ID} .xpr .xcd.c-used{color:#5b6472;}`,
        `#${LIST_ID} .xpr .xcd.c-unused{color:#1f5fbf;}`,
        `#${LIST_ID} .xpr .xcd.c-new{color:#2e7d32;}`,
        `#${LIST_ID} .xpr .xmin{font-size:11px;font-weight:600;color:#4a5a6e;margin-left:2px;}`,
        `#${LIST_ID} .xpr .xpc:has(.xmin){flex-basis:300px;}`,
        `#${LIST_ID} .xpr .xpc.none{color:#6b7280;font-size:14px;font-weight:600;}`,
        `#${LIST_ID} .xst{font-size:13px;font-weight:700;color:#33435a;}`,
        // 4.10.197：売り切れの行の★（要注意）
        `#${LIST_ID} .wstar{margin-left:8px;font-size:20px;line-height:1;color:#b0b7c3;cursor:pointer;user-select:none;vertical-align:-2px;}`,
        `#${LIST_ID} .wstar.on{color:#d4a017;}`,
        `#${LIST_ID} .xdet{grid-column:2 / -1;border-top:1px dashed #dfe4ea;padding-top:4px;font-size:12px;}`,
        // 4.10.249：右は上に在庫・下にカート。履歴は番号の下。最安は価格の下に必ず
        `#${LIST_ID} .xi{align-items:stretch;}`,
        `#${LIST_ID} .xthumb{align-self:start;}`,
        `#${LIST_ID} .xb{align-self:center;}`,
        `#${LIST_ID} .xside{align-self:stretch;justify-content:space-between;gap:6px;}`,
        `#${LIST_ID} .xside .jprush-cart{min-height:36px !important;min-width:88px;}`,
        `#${LIST_ID} .xhs{display:block;margin-top:2px;font:500 11px/1.4 sans-serif;color:#4a5a6e;text-align:center;cursor:pointer;user-select:none;}`,
        `#${LIST_ID} .xhd{grid-column:1 / -1;cursor:auto;}`,
        `#${LIST_ID} .xtags{min-height:21px;}`,
        // 4.10.253：上の行＝印＋在庫数。価格は大きく、状態の数で等分の列。カートは大きく。余白は少し広く
        `#${LIST_ID} .xi{padding:12px 14px;gap:6px 14px;}`,
        `#${LIST_ID} .xb{align-self:start;}`,
        `#${LIST_ID} .xtags{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;min-height:22px;margin-bottom:4px;}`,
        `#${LIST_ID} .xtags .xt{margin:0;}`,
        `#${LIST_ID} .xinf{font-size:12px;font-weight:700;color:#33435a;white-space:nowrap;}`,
        // 4.10.287：スマホ版は★を行の右上に（★のために行が高くならないように）
        // 4.10.288：閉じている履歴の欄は必ず消す（サイト側の指定で隠れず、カードの下に余白が増えていた）。印の行が詰まった時の小さめの表示
        `#${LIST_ID} [hidden]{display:none!important;}#${LIST_ID} .xtags.xtight{font-size:11px;}#${LIST_ID} .xtags.xtight .xt{padding:0 5px;font-size:11px;}#${LIST_ID} .xtags.xtight .xinf{font-size:11px;}`,
        `#${LIST_ID}.xsp .xi{position:relative;}#${LIST_ID}.xsp .xst{position:absolute;top:8px;right:12px;}#${LIST_ID}.xsp .xminx{color:#4a5a6e;font-weight:600;}`,
        `#${LIST_ID} .xn{margin-bottom:4px;}`,
        `#${LIST_ID} .xpr{display:grid;gap:2px 16px;font-size:26px;}`,
        `#${LIST_ID} .xpr.c1{grid-template-columns:minmax(0,1fr);}`,
        `#${LIST_ID} .xpr.c2{grid-template-columns:repeat(2,minmax(0,1fr));}`,
        `#${LIST_ID} .xpr.c3{grid-template-columns:repeat(3,minmax(0,1fr));}`,
        `#${LIST_ID} .xpr .xpc,#${LIST_ID} .xpr .xpc:has(.xmin){flex:none;display:flex;align-items:baseline;gap:6px;min-width:0;}`,
        `#${LIST_ID} .xside{align-items:flex-end;min-width:116px;}`,
        `#${LIST_ID} .xside .jprush-cart{min-height:44px !important;min-width:116px !important;font-size:15px !important;padding:6px 18px !important;border-radius:10px !important;}`,
        `#${LIST_ID} .xfoot{grid-column:2 / -1;display:flex;align-items:flex-start;gap:8px;min-width:0;}`,
        `#${LIST_ID} .xfoot>details{flex:1 1 auto;min-width:0;}`,
        `#${LIST_ID} .xfoot .jprush-cart{flex:none;margin:2px 0 0 auto;}`,
        `#${LIST_ID} .xdet>summary{cursor:pointer;color:#4a5a6e;font-weight:400;}`,
        `#${LIST_ID} .xdl{padding:4px 0 2px;color:#33435a;}`,
        `#${LIST_ID} .xdh{margin:8px 0 2px;font-weight:700;color:#4a5a6e;}`,
        `#${LIST_ID} .xdr{word-break:break-all;}`,
        `@media (max-width:640px){#${LIST_ID} .xi{grid-template-columns:56px minmax(0,1fr);}#${LIST_ID} .xi img,#${LIST_ID} .xnoimg{width:56px;height:56px;}#${LIST_ID} .xside{grid-column:2;flex-direction:row;flex-wrap:wrap;align-items:center;text-align:left;min-width:0;}#${LIST_ID} .xdet{grid-column:1 / -1;}#${LIST_ID} .xfoot{grid-column:1 / -1;}#${LIST_ID} .xpr{font-size:20px;gap:2px 10px;}#${LIST_ID} .xpr.c3{grid-template-columns:repeat(2,minmax(0,1fr));}#${LIST_ID} .xpr .xcd{font-size:12px;}#${LIST_ID} .xside{justify-content:flex-end;align-items:center;}}`,
        `#${EXT_ID} .xempty{padding:12px;color:#666;}`,
      ].join("\n");
      (document.head || document.documentElement).appendChild(st);
    }
    // 一覧（拡張）を、中央の検索結果のカードの場所にぴったり重ねる（ページの座標で置く）
    // 重ねる範囲は「カードの一番上から一番下」まで。上のページ番号は隠さない
    // 4.10.116：一覧の行（画像・名前・価格・在庫）が収まる最小の幅（px）。カードの表がこれより狭い時だけ、一覧を青い枠の右端まで広げる
    const LIST_MIN_W = 400;
    function placeList(list, grid) {
      const g = grid.getBoundingClientRect();
      let top = Infinity, bottom = -Infinity;
      for (const c of document.querySelectorAll("a.search_itemlink")) {
        const r = (c.closest(".search_item_box") || c).getBoundingClientRect();   // 4.10.271：スマホ版は商品の箱の大きさで
        top = Math.min(top, r.top), bottom = Math.max(bottom, r.bottom);
      }
      if (!isFinite(top)) top = g.top, bottom = g.bottom;
      // 4.10.116：カードが1件だけなどで表が狭いと、一覧の幅が1枚ぶんになって、行の名前・価格が切れる。そのときだけ、一覧を青い枠（検索結果 RESULT）の右端まで広げる（左端は今のまま）
      const bar = g.width < LIST_MIN_W ? barOf(grid) : null, br = bar && bar.getBoundingClientRect();
      list.style.left = (g.left + window.scrollX) + "px";
      list.style.width = (br ? Math.max(g.width, br.right - g.left) : g.width) + "px";
      list.style.top = (top + window.scrollY - 4) + "px";
      list.style.height = Math.max(bottom - top + 8, 240) + "px";
    }
    // 中央の検索結果（カードをすべて含む一番小さなまとまり）
    function gridOf() {
      const all = document.querySelectorAll("a.search_itemlink");
      if (!all.length) return null;
      let g = all[0].parentElement;
      while (g && g !== document.body && g.querySelectorAll("a.search_itemlink").length < all.length) g = g.parentElement;
      // 表（tbody・tr・td）の中に入れると崩れて見えないので、表そのものの後ろに置く
      while (g && g !== document.body && /^(TBODY|THEAD|TFOOT|TR|TD|TH)$/.test(g.tagName)) g = g.parentElement;
      return g && g !== document.body ? g : null;
    }
    // 今のページのカードのうち、印の付いたもの（じゃんぱらの掲載順＝画面の並び順）
    // 4.10.117：商品の番号（SRCODE）。リンクに SRCODE があればそれ。無ければ写真の名前の先頭の数字（8桁・9桁だけ。写真から取ったものは「（写真）」と付ける）
    function srcodeOf(url, img) {
      const s = srOf(url);
      if (s) return { code: s, photo: false };
      const m = /(?:^|\/)(\d{8,9})(?!\d)[^/]*$/.exec(String(img || ""));
      return m ? { code: m[1], photo: true } : null;
    }
    function srcodeText(sc) { return "SRCODE " + sc.code + (sc.photo ? "（写真）" : ""); }
    // 4.10.118：一覧の SRCODE を押したときの詳細ページ（番号だけで作る：/sale/search/detail/?SRCODE=番号）
    function srcodeHref(code) { const u = new URL("/sale/search/detail/", location.origin); u.searchParams.set("SRCODE", code); return u.href; }
    // 4.10.119：一覧の画像の下の番号（文字は番号だけ）。写真の名前から取った番号は、押す先の説明（ヒント）に「推測」と書く
    function srcodeTitle(sc) { return (sc.photo ? "写真の名前から取った番号（推測）：" : "") + "SRCODE " + sc.code + " の詳細ページを開く"; }
    function imgSrcOf(a) { const im = a.querySelector("img"); return im ? im.currentSrc || im.src : ""; }
    // 4.10.109：印は、カードの番号の全部（ITMCODE・SRCODE）と、同じ SRCODE の記録から集める。売切れで番号の形が変わっても漏らさない。種類ごとにいちばん新しい印を使う
    // 4.10.128：同じ記録（読んだ写し）からは作り直さない（中身は記録から決まるので同じ）
    const srMemo = new WeakMap();
    function srIndex(n) {
      if (srMemo.has(n)) return srMemo.get(n);
      const m = new Map();
      for (const [id, r] of Object.entries(n.items)) {
        const sr = r && r.url ? srOf(r.url) : "";
        if (sr) (m.get(sr) || m.set(sr, []).get(sr)).push(id);
      }
      srMemo.set(n, m);
      return m;
    }
    // 4.10.110：今のカード（ページに出ている商品）から、印の記録が無い売切れの行を作る
    function soldCardRec(a) {
      const im = a.querySelector("img");
      return { name: N(a.querySelector(".search_itemname")?.textContent) || "(名称なし)", url: new URL(a.getAttribute("href"), location.href).href, img: im ? im.currentSrc || im.src : "", prices: {}, stock: 0, soldOut: true, live: null };
    }
    // 4.10.110：拡張の行＝印の記録がある商品（従来どおり）＋ 今のページで SOLD OUT の印が付いている商品（印の記録が無くても入る）
    function extRows(n, s) {
      const rows = [], bySr = srIndex(n);
      for (const a of document.querySelectorAll("a.search_itemlink")) {
        const id = et(a.href);
        if (!id) continue;
        const sold = ee.test(ie(a));
        const sr = srOf(a.href), keys = [...new Set([id, ...M(a.href), ...(sr && bySr.get(sr) || [])])];
        const hit = keys.filter((k) => s[k] && s[k].evs && Object.keys(s[k].evs).length);
        if (!hit.length && !sold) continue;
        const byType = {};
        for (const k of hit) for (const [ty, ev] of Object.entries(s[k].evs)) if (!byType[ty] || ev.at > byType[ty].at) byType[ty] = ev;
        let r = n.items[id] && n.items[id].url ? n.items[id] : (hit.length ? n.items[hit[0]] : null);
        if (!r || !r.url) r = sold ? (keys.map((k) => n.items[k]).find((x) => x && x.url) || soldCardRec(a)) : null;
        if (!r || !r.url) continue;
        rows.push({ id, keys, rec: r, evs: Object.values(byType), sold });
      }
      return rows;
    }
    // 4.10.114：新着＝NEW・最安値↓・復活・戻り のどれかの印が付いたもの（複数あれば1行）。完売の商品も印があれば入る。在庫増だけは入れない
    const isNewRow = (x) => x.evs.some((e) => e.type === "NEW" || e.type === "PRICE" || e.type === "REST" || e.type === "BACK");
    // 4.10.158：新着モード＝NEW・大幅値下げ・復活・戻り のどれかの印がある行。小さい値下げの印はこのモードでは出さない（拡張モードは全部のまま）
    const newRows = (all) => all.map((x) => ({ ...x, evs: x.evs.filter(showEv) })).filter((x) => isNewRow(x) || x.sold);
    // 4.10.170：並び順（新着・拡張とも）。NEW → 大幅値下げ → 復活 → 戻り → 売り切れ → 値下げ → 在庫増。行に印が複数あれば一番上の印で決める。同じ順位の中は掲載順のまま（並べ方だけ。判定・件数は変えない）
    // 4.10.172：行の印の順位を全部持ち、上の印から順に比べる。同じ一番上の印の組の中では、低い印が増えるほど下がる（印の少ない行が上）
    const prioKey = (x) => {
      const r = x.sold ? [4] : [];
      for (const e of x.evs) {
        if (e.type === "NEW") r.push(0);
        else if (e.type === "PRICE") r.push(bigPD(e) ? 1 : 5);
        else if (e.type === "REST") r.push(2);
        else if (e.type === "BACK") r.push(3);
        else if (e.type === "STOCK") r.push(6);
      }
      return r.length ? [...new Set(r)].sort((p, q) => p - q) : [99];
    };
    const prioCmp = (a, b) => {
      for (let k = 0; k < Math.max(a.length, b.length); k++) {
        // 印が無い（次の印が無い）行は、同じ組の中で一番上。低い印が増えるほど下がる
        const p = k < a.length ? a[k] : -1, q = k < b.length ? b[k] : -1;
        if (p !== q) return p - q;
      }
      return 0;
    };
    const prioOrder = (all) => all.map((x, i) => ({ x, i, key: prioKey(x) })).sort((a, b) => prioCmp(a.key, b.key) || a.i - b.i).map((o) => o.x);
    // 4.10.138：値下げの印で、値下げ額が PD_BIG 円以上のものは「−¥N」の部分を白い札・濃い赤字にして目立たせる（表示だけ。判定・記録は変えない）。文字の並びは今までと同じ
    // 4.10.139：値下げ額が PD_BIG 円以上の印は、「−¥N」の文字だけを黒（#111）にする
    // 4.10.156：大幅値下げ＝値下げ率が PD_BIG_PCT％以上（（前の価格−今の価格）÷前の価格）。以前は 5,000円以上だった。
    // 印の地は黒（PD_BIG_BG）、文字は白のまま（表示だけ。判定・記録・並びは変えない。この判定はこの印の表示にだけ使う）
    const PD_BIG_PCT = 15, PD_BIG_BG = "#E9B949";
    // 4.10.157：大幅値下げ＝値下げ率が PD_BIG_PCT％以上の値下げ。showEv は一覧（中央の印付き・左の新着候補）に出す印：値下げは大幅だけ（他の印はそのまま。記録・判定は変えない）
    function bigPD(ev) { return ev.type === "PRICE" && ev.from > 0 && (ev.from - ev.to) * 100 >= ev.from * PD_BIG_PCT; }
    function showEv(ev) { return ev.type !== "PRICE" || bigPD(ev); }
    // 4.10.160：印の見た目はこの三つだけで決める（商品カード・左・中央・重ねる一覧・凡例・帯で共通）
    const PRICE_STYLE = { big: { label: "大幅値下げ", bg: "#E9B949", fg: "#333333" }, small: { label: "値下げ", bg: "#F7F0DE", fg: "#715016" } };
    const pstyle = (ev) => (bigPD(ev) ? PRICE_STYLE.big : PRICE_STYLE.small);
    function tagLabel(ev) { return ev.type === "PRICE" ? pstyle(ev).label : K[ev.type]; }
    // 4.10.164：NEW の印の背景だけ商品タイトルの赤（#B0182F）。文字は白のまま。価格・枠・帯などの #F31515 は変えない
    const NEW_TAG_BG = "#B0182F";
    // 4.10.169：在庫増の印は淡い背景に青い文字（商品カード・一覧・凡例・通知帯で統一）
    const STOCK_TAG = { bg: "#E6EEFC", fg: "#003792" };
    function tagColors(ev) { return ev.type === "PRICE" ? { bg: pstyle(ev).bg, fg: pstyle(ev).fg } : ev.type === "STOCK" ? { bg: STOCK_TAG.bg, fg: STOCK_TAG.fg } : { bg: ev.type === "NEW" ? NEW_TAG_BG : U[ev.type], fg: "#fff" }; }
    function tagPaint(el, ev) { const c = tagColors(ev), v = weTag(ev); el.style.background = c.bg, el.style.color = c.fg, el.textContent = tagLabel(ev) + (v ? " " + v : ""); }
    // 4.10.114：前の回の印だけの行（薄く出す行）かどうか。判定は印の判定した回（roundAt）のいちばん新しいもの。売切れの行は売切れた時刻も含める。cur は直前の更新（ft(今, jt)）
    const prevRow = (x, cur) => { const lastAt = Math.max(0, ...x.evs.map((e) => roundAt(e)), x.sold && x.rec.soldAt ? x.rec.soldAt : 0); return !!lastAt && lastAt < cur; };
    // 4.10.90：拡張（中央）は詳細版。印・商品名・価格・在庫・カートは常に出し、保存している情報はすべて「詳細・履歴」に出す（削らない）
    const XL = { name: "商品名", soldOut: "売切れ", stock: "在庫", prices: "価格", live: "直近の在庫・価格（売切れ前）", fp: "基準の価格", listAt: "一覧に出た時刻", soldAt: "売切れた時刻", url: "商品ページ", img: "画像", rank: "新着順の位置", line: "1ページの件数", pn: "ページの件数（記録時）", firstSeen: "最初に見た", lastSeen: "最後に見た", led: "売切れ記録済み", badges: "ランク・状態", store: "店舗", notes: "状態説明", specs: "付属品・保証など", price: "価格", at: "取得時刻", sure: "売切れ確定", nego: "価格相談", code: "個体番号", title: "ページ名", infoDate: "情報日", count: "件数", gone: "一覧から消えた" };
    const XTIME = new Set(["firstSeen", "lastSeen", "listAt", "soldAt", "at", "nego"]), XBOOL = new Set(["soldOut", "led", "sure", "gone"]);
    function xv(k, v) {
      if (XBOOL.has(k) && v != null) return v ? "はい" : "いいえ";
      if (v == null || v === "" || v === false) return "";
      if (XTIME.has(k)) return v ? T(v) : "";
      if (Array.isArray(v)) return v.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" / ");
      if (typeof v === "object") return Object.entries(v).map(([g, p]) => (Number.isFinite(p) ? `${g} ${A(p)}〜` : `${g} ${xv(g, p)}`)).join(" / ");
      return String(v);
    }
    // 4.10.128：印の記録を商品ごとにまとめる（記録の中の順番の番号）。一覧の行ごとに印の記録を全部見ないため
    function evIndex(n) {
      const m = new Map();
      n.events.forEach((e, i) => { const a = m.get(e.item); a ? a.push(i) : m.set(e.item, [i]); });
      return m;
    }
    // x.keys の印を、記録の中の順番のまま取り出す（n.events.filter(e => x.keys.includes(e.item)) と同じ並び）
    const evsOf = (keys, n, ix) => {
      if (!ix) return n.events.filter((e) => keys.includes(e.item));
      const at = [];
      for (const k of keys) { const a = ix.get(k); a && at.push(...a); }
      return at.sort((p, q) => p - q).map((i) => n.events[i]);
    };
    function extCard(x, n, cartSet, ix) {
      const r = x.rec, box = document.createElement("div"), body = document.createElement("div"), side = document.createElement("div"), thumb = document.createElement("div");
      // 4.10.113：前の回（直前の更新 ft(今, jt) より前）の印だけ薄くする（不透明度 .55・カードの「前回」と同じ濃さ）。今回の行は普通の表示
      // 4.10.114：薄い行は一覧の下にまとめる（renderExt）。判定は prevRow（印の判定した回・売切れは売切れた時刻）
      // 4.10.136：在庫なし（右下が「在庫 0」か「SOLD OUT」）の行は、背景をうっすら黒くする（表示だけ。判定・記録は変えない）
      box.className = "xi" + (prevRow(x, ft(w(), jt)) ? " jp3-prev" : "")   /* 4.10.192：売り切れの行も前回なら薄くする（4.10.175 の前に戻す） */ + (x.sold || r.stock === 0 ? " xout" : ""), box.dataset.id = x.id, box.dataset.url = r.url || "";
      // 4.10.118：画像と、その下の SRCODE（押すと、その番号の詳細ページを同じタブで開く）を一つの列にまとめる
      thumb.className = "xthumb";
      if (r.img) {
        const im = document.createElement("img");
        im.src = r.img, im.loading = "lazy", im.alt = "";
        thumb.appendChild(im);
      } else {
        const g = document.createElement("div");
        g.className = "xnoimg", thumb.appendChild(g);
      }
      const scx = srcodeOf(r.url, r.img);
      if (scx) {
        const sl = document.createElement("a");
        sl.className = "xsr", sl.href = srcodeHref(scx.code), sl.title = srcodeTitle(scx);
        sl.textContent = scx.code;   // 4.10.119：番号だけ（「SRCODE」の字と「（写真）」は出さない）
        thumb.appendChild(sl);
      }
      box.appendChild(thumb);
      body.className = "xb";
      // 印（種類ごとに、いちばん新しい内容）
      const tags = document.createElement("div");
      tags.className = "xtags";
      // 4.10.110：売切れの印（カードと同じ黒い印）を、印の列の先頭に出す
      if (x.sold) {
        const so = document.createElement("span");
        so.className = "xt xsold", so.style.background = "#333333", so.textContent = "SOLD OUT";
        tags.appendChild(so);
      }
      for (const g of Me.filter((y) => x.evs.some((z) => z.type === y))) {
        const ev = x.evs.find((y) => y.type === g), tag = document.createElement("span");
        tag.className = "xt", tagPaint(tag, ev);
        tags.appendChild(tag);
      }
      // 4.10.137：カートに入っている行（カートへは出さない）には「カート内」の印を付ける（左の一覧と同じ。表示だけ）
      if (cartSet.has(srOf(r.url))) {
        const ct = document.createElement("span");
        ct.className = "xt", ct.style.background = "#374151", ct.textContent = "カート内";
        tags.appendChild(ct);
      }
      // 4.10.253：在庫数は印の行の後ろに（売り切れの行は出さない。右上は★だけ）
      if (!x.sold) { const sk = document.createElement("span"); sk.className = "xinf xstk", sk.textContent = `在庫 ${r.stock}`, tags.appendChild(sk); }
      body.appendChild(tags);
      const nm = document.createElement("a");
      nm.className = "xn", nm.href = r.url, nm.textContent = r.name || "(名称なし)";
      body.appendChild(nm);
      box.appendChild(body);
      // 価格・在庫・カート（主要な情報）
      side.className = "xside";
      let prs = Object.entries((r.soldOut && r.live ? r.live.prices : r.prices) || {});
      // 4.10.187：この検索に価格が無い売り切れは、商品ごとの最後の価格（ほかの検索で見た価格）を出す
      if (!prs.length) { const ll = Er("lastlive", {}), sr = srOf(r.url), L = ll[x.id] || (sr && ll["S" + sr]) || null; L && L.prices && (prs = Object.entries(L.prices)); }
      // 4.10.247：価格は商品名のすぐ下（右の欄には在庫と★だけ）。状態は色の札（中古＝灰、未使用＝青、新品＝緑）
      const pv = document.createElement("div");
      pv.className = "xpr c" + Math.min(3, Math.max(1, prs.length));   // 4.10.253：状態の数で等分の列（2つなら半分ずつ）
      if (!prs.length) { const c = document.createElement("span"); c.className = "xpc none", c.textContent = "価格なし", pv.appendChild(c); }
      for (const [g, p] of prs) {
        const cell = document.createElement("span"), c = document.createElement("span"), v = document.createElement("span");
        cell.dataset.c = g, cell.dataset.p = p, cell.className = "xpc", c.className = "xcd" + (/^中古/.test(g) ? " c-used" : /^未使用/.test(g) ? " c-unused" : /^新品/.test(g) ? " c-new" : ""), c.textContent = g, v.textContent = A(p) + "〜";
        cell.append(c, v), pv.appendChild(cell);
      }
      nm.after(pv);   // 商品名のすぐ下（最安値・在庫の変化より上）
      // 4.10.251：最安値は機種ごとの行（ITMCODE）だけ、状態ごとの価格の横に、今より安い記録がある時だけ出す（1台ずつの行は出さない）
      if (x.id[0] === "I") {
        const lo = { ...(r.lo || {}) };
        for (const e of evsOf(x.keys, n, ix)) e.type === "PRICE" && e.condition && Number.isFinite(e.to) && (!(e.condition in lo) || e.to < lo[e.condition]) && (lo[e.condition] = e.to);
        for (const cell of pv.querySelectorAll(".xpc")) {
          const g = cell.dataset.c, cur = Number(cell.dataset.p);
          if (!(g && Number.isFinite(lo[g]) && lo[g] < cur)) continue;
          // 4.10.287：スマホ版は価格の横だと見切れるので、在庫数と同じ上の行に「最安値 中古 ¥〇」で並べる
          if (document.querySelector(".search_item_box")) { const m = document.createElement("span"); m.className = "xinf xminx", m.textContent = `最安値 ${g} ${A(lo[g])}`, tags.appendChild(m); }
          else { const m = document.createElement("span"); m.className = "xmin", m.textContent = "最安値 " + A(lo[g]), cell.appendChild(m); }
        }
      }
      const st = document.createElement("div");
      // 4.10.110：右下の欄は今のカードで決める（古い記録では決めない）
      st.className = "xst";   // 4.10.253：右上は★だけ（在庫数は印の行へ）
      // 4.10.197：売り切れの行に★（左の新着候補と同じ記録）
      const xw = x.sold || r.soldOut ? watchOf(x.id, { ...r, soldOut: true }, n) : null;
      if (xw) {
        watchAutoSave(x.id, { ...r, soldOut: true }, n, xw);
        const ws = wStar(xw.on);
        ws.addEventListener("click", (ev) => {
          ev.preventDefault(), ev.stopPropagation();
          const on = toggleWatch(x.id, { ...r, soldOut: true }, n);
          ws.className = "wstar jp3-noopen" + (on ? " on" : ""), ws.textContent = on ? "★" : "☆", watchSync();
        });
        st.appendChild(ws);
      }
      side.append(st);
      box.appendChild(side);
      // 4.10.249：「▸ 履歴」は画像と番号の下。押すと中身（保存している情報をすべて）が行の下に横幅いっぱいで開く
      const hs = document.createElement("span"), hd = document.createElement("div");
      hs.className = "xhs jp3-noopen", hs.setAttribute("role", "button"), hs.textContent = "▸ 履歴";
      hd.className = "xhd xdet jp3-noopen", hd.hidden = true;
      hs.addEventListener("click", (ev) => {
        ev.preventDefault(), ev.stopPropagation();
        if (!hd.dataset.done) hd.dataset.done = "1", hd.appendChild(extDetail(x, n));
        hd.hidden = !hd.hidden, hs.textContent = hd.hidden ? "▸ 履歴" : "▾ 履歴";
      });
      thumb.appendChild(hs);
      // 4.10.97：「カートへ」は詳細・履歴の行の右端に置く（価格の下に置くと、ボタンのある行だけ高くなるため）。商品番号が分かるものだけ付く（送信の処理は変えない）
      // 4.10.249：「カートへ」は右下（右上の在庫数と縦に並ぶ）
      appendCartBtn(side, { rec: r, cart: cartSet.has(srOf(r.url)) }, true);
      box.appendChild(hd);
      // 4.10.247：行の空いた所（画像・価格・右の余白も）を押したら、商品名を押したのと同じ（ボタン・リンク・★・詳細は除く）
      box.addEventListener("click", (ev) => {
        const t = ev.target;
        if (!(t instanceof Element) || t.closest("a,button,input,select,summary,details,.jp3-noopen,.jprush-cart")) return;
        if (window.getSelection && String(window.getSelection())) return;
        nm.click();
      });
      return box;
    }
    // 詳細・履歴の中身：この商品の記録、ページの記録（個体）、売切れの記録、印の履歴
    function extDetail(x, n) {
      const r = x.rec, sr = srOf(r.url), wrap = document.createElement("div");
      wrap.className = "xdl";
      const add = (title, rows) => {
        const h = document.createElement("div");
        h.className = "xdh", h.textContent = title, wrap.appendChild(h);
        if (!rows.length) {
          const e = document.createElement("div");
          e.className = "xdr", e.textContent = "記録なし", wrap.appendChild(e);
          return;
        }
        for (const [k, v] of rows) {
          if (v === "" || v == null) continue;
          const p = document.createElement("div");
          p.className = "xdr", p.textContent = k ? `${k}：${v}` : String(v);
          wrap.appendChild(p);
        }
      };
      add("保存している商品の情報", [["商品番号", sr], ["商品のID", x.id], ...Object.entries(r).map(([k, v]) => (k === "live" ? [XL.live, v ? `${xv("prices", v.prices)}　在庫 ${v.stock}　${T(v.at)}` : ""] : [XL[k] || k, xv(k, v)]))]);
      const DS = dload(), dr = dget(DS, x.id) || dget(DS, "S" + sr) || null;
      add("商品ページの記録（個体）", dr ? [...(dr.units ? [["同じページの個体数", `${dr.units.length}件`]] : []), ...Object.entries((dr.units || []).find((a) => a.code === sr) || dr).filter(([k]) => k !== "units").map(([k, v]) => [XL[k] || k, xv(k, v)])] : []);
      const sold = [];
      for (const m of q()) for (const v of Object.values(E(m, null) || {})) v && v.id === x.id && sold.push(v);
      sold.sort((p1, p2) => (p2.s || 0) - (p1.s || 0));
      add("売切れの記録", sold.map((v) => [T(v.s), [v.c, Number.isFinite(v.p) ? A(v.p) : v.p, v.sh && `店舗 ${v.sh}`, v.r, Number.isFinite(v.st) ? `在庫 ${v.st}` : "", v.sr && `商品番号 ${v.sr}`].filter(Boolean).join("　")]));
      add("印の履歴（30日分）", n.events.filter((e) => x.keys.includes(e.item)).sort((p1, p2) => p2.at - p1.at).map((e) => [T(e.at), `${K[e.type] || e.type}${we(e) ? " " + we(e) : ""}`]));
      return wrap;
    }
    // 通常／新着／拡張の切り替え（「検索結果 RESULT」の青い枠の右端に置く）
    function mkSwitch(n, s, mode) {
      const sw = document.createElement("span");
      sw.id = SW_ID;
      for (const [v, lab] of EXT_MODES) {
        const b = document.createElement("button");
        b.type = "button", b.textContent = lab, b.className = mode === v ? "on" : "";
        b.onclick = () => { extPick = v; setExt(v); renderExt(n, s); };
        sw.appendChild(b);
      }
      return sw;
    }
    // 「検索結果 RESULT」の青い枠：中央の検索結果より上にあり、ほぼ同じ幅で、カードを含まない、いちばん下のもの
    function barOf(grid) {
      const gr = grid.getBoundingClientRect();
      let best = null, bestBottom = -Infinity;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!/RESULT|検索結果/.test(t.nodeValue)) continue;
        const el = t.parentElement;
        if (!el || el.closest("script,style,noscript,#jprush-ext,#jprush-ext-list")) continue;
        let a = el;
        while (a && a !== document.body && !a.contains(grid) && a.getBoundingClientRect().width < gr.width * 0.8) a = a.parentElement;
        if (!a || a === document.body || a.contains(grid)) continue;
        const ar = a.getBoundingClientRect();
        if (ar.width < gr.width * 0.8 || ar.height <= 0 || ar.bottom > gr.top + 2) continue;
        if (ar.bottom > bestBottom) best = a, bestBottom = ar.bottom;
      }
      return best;
    }
    // 中央の検索結果の下に欄を置き、通常／拡張を切り替える（拡張は今のページの印付きだけ）
    // 4.10.178：版の下に「ページ・始まるまで・処理」の時間を出す（最初の表示の1回だけ。表示だけ）。押すと保存の大きさの内訳
    let perfDone = false;
    // 4.10.188：検索ログ（1回の表示ごとに1件。別の保存場所へ、表示が済んでから書く）
    let RUNLOG = null, PERF_RES = null;
    function runLogSave() {
      if (!RUNLOG || !window.indexedDB) return;
      const r = { ...RUNLOG, ver: Jt, t: PERF_RES };
      RUNLOG = null;
      idbPut("run." + r.at + "." + Math.random().toString(36).slice(2, 6), r).catch(() => {});
    }
    function perfMark() {
      if (perfDone || !f.ver) return;
      perfDone = true;
      const nav = performance.getEntriesByType("navigation")[0], dcl = nav ? nav.domContentLoadedEventEnd : 0, end = performance.now();
      const sec = (x) => (Math.max(0, x) / 1000).toFixed(1);
      const m = document.createElement("div");
      const tot = end - PERF_T0, other = Math.max(0, tot - PIO.read - PIO.write);
      PERF_RES = { page: dcl, start: PERF_T0 - dcl, proc: tot, read: PIO.read, write: PIO.write };
      m.textContent = `ページ ${sec(dcl)}秒・始まるまで ${sec(PERF_T0 - dcl)}秒・処理 ${sec(tot)}秒（読込${sec(PIO.read)}・保存${sec(PIO.write)}・他${sec(other)}）`;
      m.title = "押すと保存の大きさ";
      m.style.cssText = "margin-top:4px;font-size:11px;font-weight:600;color:#5f6b7a;text-align:center;cursor:pointer;white-space:pre-wrap;line-height:1.5";
      m.addEventListener("click", () => {
        m.textContent += "\n" + storeSizes();
        window.indexedDB && idbCount().then((c) => { m.textContent += `\n別の保存場所の記録 ${c || 0}件（検索の記録・古い印の履歴・検索ログなど）`; }).catch(() => {});
      }, { once: true });
      f.ver.appendChild(m);
    }
    function storeSizes() {
      if (typeof GM_listValues !== "function") return "保存の大きさ：読めません";
      const g = {};
      let total = 0;
      for (const k of GM_listValues()) {
        let n = 0;
        try { n = (JSON.stringify(GM_getValue(k)) || "").length; } catch (e) {}
        total += n;
        const kk = String(k).replace(Ct, ""), grp = kk.startsWith("s.") ? "検索の記録" : kk.startsWith("sold.") ? "完売記録" : kk;
        g[grp] = g[grp] || [0, 0], g[grp][0]++, g[grp][1] += n;
      }
      const mb = (n) => (n / 1048576).toFixed(2) + "M字";
      // 4.10.179：検索ごとの大きさ（大きい順に6件。条件と最後に開いた日時）
      const lab = (sig) => {
        let p;
        try { const arr = JSON.parse(String(sig || "[]")); p = new Map(); for (const [k, v] of arr) p.set(k, p.has(k) ? p.get(k) + "," + v : v); } catch (e) { return "条件不明"; }
        const parts = [["KEYWORDS", "語"], ["NOTKEYWORDS", "除外"], ["MINPRICE", "下限"], ["MAXPRICE", "上限"]].map(([k, l]) => p.get(k) ? l + p.get(k) : "").filter(Boolean);
        return parts.join(" ") || "条件なし";
      };
      const per = [];
      for (const k of GM_listValues()) {
        if (!String(k).startsWith(Ct + "s.")) continue;
        const v = GM_getValue(k, null);
        let n = 0;
        try { n = (JSON.stringify(v) || "").length; } catch (e) {}
        per.push([n, v && v.lastAt ? T(v.lastAt) : "－", lab(v && v.signature)]);
      }
      per.sort((a, b) => b[0] - a[0]);
      // 4.10.180：今開いている検索の記録の中身（どこが大きいか）
      let inside = "";
      try {
        const cv = RECMEM.get(Ct + I(D(location.href))) || GM_getValue(Ct + I(D(location.href)), null);
        if (cv) {
          const sz = (x) => { try { return (JSON.stringify(x) || "").length; } catch (e) { return 0; } };
          const its = Object.values(cv.items || {}), now = w(), old30 = its.filter((x) => x && x.lastSeen && x.lastSeen < now - 30 * 864e5).length;
          const parts = Object.keys(cv).map((k) => [k, sz(cv[k])]).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${mb(n)}`).join("・");
          const one = its.length ? Object.keys(its[0]).map((k) => [k, its.reduce((a, x) => a + sz(x && x[k]), 0)]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} ${mb(n)}`).join("・") : "";
          inside = `\n― この検索の中身 ―\n商品 ${its.length}件（30日以上見ていない ${old30}件）・印の履歴 ${(cv.events || []).length}件\n${parts}\n商品の中：${one}`;
        }
      } catch (e) {}
      return `保存 合計 約${mb(total)}\n` + Object.entries(g).sort((a, b) => b[1][1] - a[1][1]).slice(0, 8).map(([k, [c, n]]) => `${k} ${c}件 ${mb(n)}`).join("\n") + "\n― 検索ごと（大きい順）―\n" + per.slice(0, 6).map(([n, at, l]) => `${mb(n)} ${at} ${l}`).join("\n") + inside;
    }
    // 4.10.265：スマホで商品カードを読めない時、ページの作り（最初の商品のまわり）をコピーする（直すための手がかり。記録は変えない）
    function copyPageShape(btn) {
      let out = "";
      try {
        // 4.10.270：商品1件ぶんの箱（同じ id の商品リンクだけを含む一番大きな箱）を、最初の2件・売切れ1件・状態が2つある1件だけ写す
        const links = [...document.querySelectorAll("a[href*='/sale/search/detail/']")].filter((x) => !x.closest("#jp3-host,#jprush-ext-list"));
        const keyOf = (x) => x.id || (/[?&](ITMCODE|SRCODE)=(\d+)/.exec(x.getAttribute("href") || "") || [])[2] || "";
        const cards = [], seen = new Set();
        for (const l of links) {
          const k = keyOf(l);
          if (!k || seen.has(k)) continue;
          seen.add(k);
          let c = l;
          while (c.parentElement && c.parentElement !== document.body && [...c.parentElement.querySelectorAll("a[href*='/sale/search/detail/']")].every((x) => keyOf(x) === k)) c = c.parentElement;
          cards.push(c);
        }
        const pick = [cards[0], cards[1], cards.find((c) => /SOLD\s*OUT/i.test(c.textContent)), cards.find((c) => /未使用/.test(c.textContent) && /中古/.test(c.textContent))].filter(Boolean);
        const uniq = [...new Set(pick)];
        const parentInfo = cards[0] && cards[0].parentElement ? `親: <${cards[0].parentElement.tagName.toLowerCase()} id="${cards[0].parentElement.id}" class="${cards[0].parentElement.className}">（商品の箱 ${cards.length}件）` : "";
        const box = { outerHTML: parentInfo + "\n" + uniq.map((c, i) => `【${i + 1}】` + c.outerHTML.replace(/\s+/g, " ").slice(0, 5000)).join("\n\n") };
        out = "JP RUSH v" + Jt + "\n状態: " + (R ? R.kind + " " + (R.text || "") : "－") + "\n段階: " + JSON.stringify(DIAG.steps) + "\nエラー:\n" + (DIAG.errs.join("\n") || "なし") + "\nカード(a.search_itemlink): " + document.querySelectorAll("a.search_itemlink").length + "\nURL: " + location.href + "\n幅: " + window.innerWidth + "\nUA: " + navigator.userAgent + "\nリンク例: " + [...document.querySelectorAll("a[href*='detail']")].slice(0, 3).map((a) => a.outerHTML.slice(0, 400)).join("\n") + "\n---\n" + (cards.length ? box.outerHTML : "商品の箱が見つかりません");
      } catch (e) { out = "読み取りエラー: " + e.message; }
      // 4.10.269：コピーの仕方を他のコピーと同じに（だめな時は別の方法）。それでもだめなら、文字を画面に出して手で全部選んでコピーできるようにする
      writeClip(out, () => { btn.textContent = "コピーしました"; }, () => {
        btn.textContent = "下の欄からコピー";
        document.getElementById("jprush-diagbox") && document.getElementById("jprush-diagbox").remove();
        const box = document.createElement("div"), ta = document.createElement("textarea"), cl = document.createElement("button");
        box.id = "jprush-diagbox", box.style.cssText = "position:fixed;left:8px;right:8px;top:8px;bottom:120px;z-index:2147483600;background:#fff;border:2px solid #003792;display:flex;flex-direction:column;gap:6px;padding:8px;box-sizing:border-box;font:13px system-ui,sans-serif;";
        ta.value = out, ta.readOnly = true, ta.style.cssText = "flex:1;width:100%;box-sizing:border-box;font:11px/1.4 monospace;";
        cl.type = "button", cl.textContent = "閉じる", cl.style.cssText = "height:36px;";
        cl.onclick = () => box.remove();
        const tip = document.createElement("div");
        tip.textContent = "下の欄を長押し →「すべて選択」→「コピー」で、全部コピーしてください";
        box.append(tip, ta, cl), document.body.appendChild(box), ta.focus(), ta.select();
      });
    }
    function renderExt(n, s) {
      if (!Nt()) return;
      extStyle();
      const grid = gridOf();
      DIAG.steps.grid = grid ? grid.tagName + "." + (grid.className || "") : "なし";
      if (!grid) return;
      const all = extRows(n, s), mode = extShown(all);
      DIAG.steps.rows = all.length + "件・" + mode;
      const rows = prioOrder(mode === "new" ? newRows(all) : all);
      const on = mode !== "off", cartSet = ownCartSet(w());
      // 切り替えは青い枠の右端へ。枠が見つからない時だけ、一覧の前に小さく置く
      const bar = barOf(grid);
      document.querySelectorAll("#" + SW_ID).forEach((e) => e.remove());
      const sw = mkSwitch(n, s, mode);
      // 4.10.279：スマホ・タブレットとも「表示件数［12］件」のすぐ右に並べる（左に 12px）。見た目は選択欄に合わせる（灰色の細線・四角・選んでいるものだけ黒地に白い太字）。
      // 高さは選択欄とぴったり同じ（サイトのボタンの指定に負けないよう強めに指定し、置いた後の実際の高さで合わせる）
      const sels = [...document.querySelectorAll("select")].filter((x) => !x.closest("#jp3-host,#jprush-ext-list"));
      const selTxt = (x) => { const o = x.options && x.options[x.selectedIndex]; return N(o && o.textContent || ""); };
      const sortSel = sels.find((x) => /順/.test(selTxt(x))), lineSel = sels.find((x) => x !== sortSel && /^\d+\s*件?$/.test(selTxt(x)));
      const anchorSel = lineSel || sortSel;
      if (anchorSel) {
        // 「件」の文字（選択欄のすぐ後ろ）を探して、その後ろに置く
        let after = anchorSel;
        if (lineSel) {
          const scope = anchorSel.parentElement && anchorSel.parentElement.parentElement || document.body, tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
          for (let t = tw.nextNode(); t; t = tw.nextNode()) if (anchorSel.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING && /^\s*件/.test(t.nodeValue)) { after = t; break; }
        }
        const cs = getComputedStyle(anchorSel);
        sw.classList.add("sp");
        // 4.10.280：「件」との間は 16px。線の色は選択欄の枠と同じ色
        const bc = cs.borderTopColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.borderTopColor) ? cs.borderTopColor : "#999";
        // 4.10.281：選んでいないボタンの地の色は、選択欄（12件など）の地の色と同じ
        const sbg = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) ? cs.backgroundColor : "#fff";
        const spNarrow = !!document.querySelector(".search_item_box");
        sw.style.cssText = `position:static;transform:none;float:none;display:inline-flex;vertical-align:middle;gap:0;margin:0 0 0 ${spNarrow ? 12 : 16}px;right:auto;`;
        [...sw.children].forEach((b, i) => {
          const on = b.classList.contains("on");
          b.style.cssText = `margin:0;margin-left:${i ? -1 : 0}px;padding:0 ${spNarrow ? 10 : 12}px;border:1px solid ${bc};border-radius:0;background:${on ? sbg : "#fff"};color:${cs.color || "#333"};font:400 ${cs.fontSize || "13px"}/1 ${cs.fontFamily || "sans-serif"};cursor:pointer;`;
        });
        // スマホは行の上下に 6px の余白（4.10.276）
        if (document.querySelector(".search_item_box")) {
          let row = anchorSel.parentElement;
          while (row.parentElement && row !== document.body && (sels.filter((x) => row.contains(x)).length < 2 || getComputedStyle(row).display.startsWith("inline"))) row = row.parentElement;
          row.dataset.jp3pad || (row.dataset.jp3pad = "1", row.style.paddingTop = (parseFloat(getComputedStyle(row).paddingTop) || 0) + 6 + "px", row.style.paddingBottom = (parseFloat(getComputedStyle(row).paddingBottom) || 0) + 6 + "px");
        }
        const isSp = !!document.querySelector(".search_item_box");
        if (!isSp) {
          // 4.10.281：タブレットは行の右端に寄せる（右の余白 16px）。行が横並び（flex）の時は最後に置いて右へ
          let row = anchorSel.parentElement;
          while (row.parentElement && row !== document.body && (sels.filter((x) => row.contains(x)).length < 2 || getComputedStyle(row).display.startsWith("inline"))) row = row.parentElement;
          // 4.10.284：右寄せはやめる（サイトの行の作りで寄らなかった）。「件」との間を「該当件数」と表示切替の絵の間くらい（20px）あける
          after.parentNode.insertBefore(sw, after.nextSibling), sw.style.marginLeft = "20px";
        } else after.parentNode.insertBefore(sw, after.nextSibling);
        const fit = () => {
          const r = anchorSel.getBoundingClientRect(), h = Math.round(r.height);
          if (!h || !sw.isConnected) return;
          sw.style.setProperty("height", h + "px", "important");
          for (const b of sw.children) for (const [k, v] of [["height", h + "px"], ["min-height", "0"], ["max-height", h + "px"], ["line-height", "1"], ["padding-top", "0"], ["padding-bottom", "0"], ["box-sizing", "border-box"], ["display", "inline-flex"], ["align-items", "center"]]) b.style.setProperty(k, v, "important");
          sw.style.setProperty("position", "relative", "important"), sw.style.setProperty("top", "0px", "important");
          // 4.10.285：同じ行に並んでいる時だけ上下をそろえる（入りきらずに次の行へ回った時に上へ動かすと、並び順の欄に重なっていた）
          const sr = sw.getBoundingClientRect(), d = Math.round(r.top - sr.top);
          if (d && Math.abs(d) < h * 0.75) sw.style.setProperty("top", d + "px", "important");
          else if (Math.abs(d) >= h * 0.75) sw.style.setProperty("margin-top", "6px", "important");
        };
        fit(), setTimeout(fit, 300);
      } else if (bar) {
        if (getComputedStyle(bar).position === "static") bar.style.position = "relative";
        bar.appendChild(sw);
        // 4.10.277：スマホと同じ形（3つをつなげる・角は四角・選んでいるものだけ塗る）。高さは左の欄の「全検索」の枠に合わせる。右の余白 12px
        const xr = f.xcp && f.xcp.getBoundingClientRect(), hh = xr && xr.height >= 18 ? Math.round(xr.height) : 26;
        sw.style.cssText = `right:12px;gap:0;height:${hh}px;`;
        [...sw.children].forEach((b, i) => {
          const on = b.classList.contains("on");
          b.style.cssText = `height:${hh}px;margin:0;margin-left:${i ? -1 : 0}px;padding:0 12px;border:1px solid #fff;border-radius:0;background:${on ? "#fff" : "transparent"};color:${on ? "#003792" : "#fff"};font:${on ? 700 : 400} 12px/1 sans-serif;cursor:pointer;box-sizing:border-box;`;
        });
      }
      // 枠が無い時の切り替え、と「拡張で印付きが無い」の一文だけを、一覧の前に置く
      let sec = document.getElementById(EXT_ID);
      if (!bar || (on && !rows.length)) {
        if (!sec) {
          sec = document.createElement("div");
          sec.id = EXT_ID;
        }
        grid.before(sec);
        sec.replaceChildren();
        if (!bar) {
          const head = document.createElement("div");
          head.className = "xh";
          head.appendChild(sw);
          sec.appendChild(head);
        }
        if (on && !rows.length) {
          const e = document.createElement("div");
          e.className = "xempty", e.textContent = mode === "new" ? "このページに新着（新着・値下げ・復活・戻り）の商品はありません" : "このページに印付きの商品はありません";
          sec.appendChild(e);
        }
      } else if (sec) sec.remove();
      // 一覧は「拡張」のときだけ、下のカードの上に重ねて出す
      let list = document.getElementById(LIST_ID);
      if (!on || !rows.length) {
        list && list.remove();
        return;
      }
      if (!list) {
        list = document.createElement("div");
        list.id = LIST_ID;
        list.className = "xl" + (document.querySelector(".search_item_box") ? " xsp" : "");
        document.body.appendChild(list);
        list.addEventListener("scroll", () => Rn());
      }
      // 4.10.101：描き直しの前後で、一覧のスクロール位置を保つ（戻ったときに一番上へ戻らないように。表示だけ）
      const jpKeepTop = list.scrollTop;
      list.replaceChildren();
      // 4.10.114：前の回の行（薄く出す行）は下にまとめる。上は今回の行、下は前の回の行
      // 4.10.120：その中で NEW の印が付いた行を先頭に（順位：今回の NEW 0 → 今回のその他 1 → 前の回の NEW 2 → 前の回のその他 3）。表示だけ。判定や記録は変えない
      // 4.10.121：順位の小さい順に並べるだけ。同じ順位の中は掲載順のまま（sort は元の順を保つ）
      // 4.10.141：在庫増だけの行（印が在庫増だけ）は、今回・前の回それぞれの中で一番後ろへ。順位：今回 NEW 0 → 今回 その他 1 → 今回 在庫増だけ 2 → 前の回 NEW 3 → 前の回 その他 4 → 前の回 在庫増だけ 5。表示だけ（判定・記録・件数は変えない）
      // 4.10.173：売り切れの行は今回・前の回の区切りに入れない（並びは順位だけ。薄い表示はそのまま）
      const cur = ft(w(), jt), ordKey = (y) => (prevRow(y, cur) && !y.sold ? 3 : 0) + (y.evs.some((e) => e.type === "NEW") ? 0 : (y.evs.length > 0 && y.evs.every((e) => e.type === "STOCK") ? 2 : 1));
      const ix = evIndex(n);
      const ord = [...rows].sort((p, q) => ordKey(p) - ordKey(q));
      // 4.10.195：売り切れの行の位置はそのまま、その中で今回の売り切れを先に、前回の売り切れを後に
      { const slots = [], so = []; ord.forEach((y, i) => { y.sold && (slots.push(i), so.push(y)); }); const re = [...so.filter((y) => !prevRow(y, cur)), ...so.filter((y) => prevRow(y, cur))]; slots.forEach((i, k) => { ord[i] = re[k]; }); }
      ord.forEach((y) => list.appendChild(extCard(y, n, cartSet, ix)));
      placeList(list, grid);
      // 4.10.288：スマホ版で、最安値が印の行からはみ出して次の行に回った時は、印の行を小さめにして1行に収める
      if (list.classList.contains("xsp")) for (const tg of list.querySelectorAll(".xtags")) {
        const mx = tg.querySelector(".xminx"), f0 = tg.firstElementChild;
        const wrapped = () => mx && f0 && mx.getBoundingClientRect().top - f0.getBoundingClientRect().top > 4;
        if (wrapped()) tg.classList.add("xtight");
        // それでも収まらない時は「最安値 中古 ¥〇」を「最安 中古¥〇」に縮める
        if (wrapped()) for (const m of tg.querySelectorAll(".xminx")) m.textContent = m.textContent.replace(/^最安値 /, "最安 ").replace(/ (¥|￥)/, "$1");
      }
      // 4.10.289：カードの上下の余白をそろえる。中身（文字・印・価格・写真）のいちばん上と下を測り、下の余白が多い分だけ下の詰め物を減らす（サイト側の指定で下が広くなっていた）
      for (const xi of list.querySelectorAll(".xi")) {
        const r = xi.getBoundingClientRect();
        if (!r.height) continue;
        let t = 1e9, b = -1e9;
        for (const e of xi.querySelectorAll(".xtags > *, .xn, .xpc, .xpr, .xthumb img, .xnoimg, .xsr, .xhs, .jprush-cart")) {
          const q = e.getBoundingClientRect();
          if (!q.height || !q.width) continue;
          t = Math.min(t, q.top), b = Math.max(b, q.bottom);
        }
        if (t > 1e8) continue;
        const pb = parseFloat(getComputedStyle(xi).paddingBottom) || 0, d = Math.round((r.bottom - b) - (t - r.top));
        if (Math.abs(d) >= 2) xi.style.paddingBottom = Math.max(0, pb - d) + "px";
      }
      list.scrollTop = jpKeepTop;
      perfMark();
      if (!window.__jprExtResize) {
        window.__jprExtResize = true;
        window.addEventListener("resize", () => {
          const l = document.getElementById(LIST_ID), g = gridOf();
          if (l && g) placeList(l, g);
        });
      }
    }
    // 4.10.70：ページ全体が未記録だった時に付いた、明らかな誤NEWだけを一度消す。
    // 同じ時刻のNEWが、そのページの商品数（pn、無ければLINE）と同じ件数ぶん付いたもの。一部だけのNEWと記録・在庫・価格は消さない
    function dropFlood(s) {
      const cnt = {};
      for (const ev of s.events) ev.type === "NEW" && (cnt[ev.at] = (cnt[ev.at] || 0) + 1);
      const before = s.events.length;
      s.events = s.events.filter((ev) => {
        if (ev.type !== "NEW") return true;
        const r = s.items[ev.item];
        return !(r && (cnt[ev.at] || 0) >= (r.pn || r.line || Infinity));
      });
      return before - s.events.length;
    }
    function at() {
      if (!Nt()) return;
      f.banner || Fn(), Hn();
      const t = D(location.href);
      let e = Er(I(t), null);
      // 一回だけの整理（v65）は、書く前に保存から読み直して行う
      if (e && e.signature === t && !e.v65) { const fresh = E(I(t), null); if (fresh && fresh.signature === t && !fresh.v65) { fresh.floodDeleted = dropFlood(fresh); fresh.v65 = 1; $(I(t), fresh); e = fresh; redo1 = true; } }
      const n = e && e.signature === t ? e : Dt(t), o = rtR(), s = gn(n, o, w());
      Oe = s;
      const i = Bt();
      Tn(s, i, n.items);
      // 印付き商品の欄は付け足し。ここで失敗しても、このあとの処理（一覧・定期更新）は止めない
      try { DIAG.steps.ext = "始"; renderExt(n, s); DIAG.steps.ext = "済"; } catch (err) { DIAG.steps.ext = "失敗"; derr("renderExt", err); console.warn("[JP RUSH] 印付き商品の欄の表示に失敗", err); }
      const c = new Set([...document.querySelectorAll("a.search_itemlink")].map((S) => et(S.href))), d = { NEW: 0, REST: 0, BACK: 0, PRICE: 0, STOCK: 0 };
      let l = 0, r = 0, p = 0, m = 0;
      const u = w();
      for (const [S, j] of Object.entries(s)) {
        if (c.has(S) && _e(j, S, o, u) && m++, !j.strong) {
          c.has(S) && p++;
          continue;
        }
        if (c.has(S)) {
          l++;
          for (const X of Object.keys(j.evs)) d[X]++;
        } else r++;
      }
      const a = re(document), h = a ? te.test(a) ? "ok" : "bad" : "";
      f.sort.textContent = "", f.sort.className = "sort";
      const C = Ce(w());
      Te = C;   // 4.10.128：この描き直しが「古い画面かどうか」のどちらで描いたかを覚える（Dn が同じ状態で描き直さないため）
      const k = C ? `\u3010${T(ft(w(), Q))}\u306E\u66F4\u65B0\u3088\u308A\u524D\u306E\u753B\u9762\u3067\u3059\u3002\u300C\u6700\u65B0\u306B\u3059\u308B\u300D\u3067\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3011` : "";
      f.banner.textContent = (R ? (Ut ? "✓ " : "") + R.text : ""), f.banner.className = "banner " + (R ? R.kind : ""), f.banner.style.background = R && R.top ? (R.top === "NEW" ? U.NEW : tagColors({ type: R.top }).bg) : "", f.banner.style.color = R && R.top ? tagColors({ type: R.top }).fg : "";
      const g = document.createElement("span"), O = [...c].filter((S) => i[S]).length;
      g.textContent = (r ? `\u307B\u304B\u306E\u30DA\u30FC\u30B8\u306B\u6FC3\u3044\u5370 ${r}個\u3002` : "") + `\u3053\u306E\u30DA\u30FC\u30B8\u3000\u672A\u898B ${c.size - O}\u30FB\u898B\u305F ${O}`, f.counts.replaceChildren(g), f.next.disabled = !m, f.prev.disabled = !m, f.next.textContent = "▶", f.markpos.textContent = m ? m + "個" : "";
      // 4.10.122：箱の「新」＝このページの今回の NEW の数（見たかどうかは関係なし）、「完」＝このページで SOLD OUT と出ている数。表示だけ（判定や記録は変えない）
      // 4.10.124：箱の「新」「完」＝この回（直前の更新 ft(今, jt) から）に見つけた数の積み上げ。新＝この回に NEW と記録した商品（保存全体・全ページ分）。完＝この回に在庫あり→売り切れに変わったのを見た商品（戻っても数える）。表示だけ（判定や記録は変えない）
      let newNow = 0, soldNow = 0;
      // 4.10.126：数字は roundSets（押して開く一覧と同じ関数）から取る。件数は一覧と必ず一致する
      try { const sets = roundSets(n, u); newNow = sets.news.length, soldNow = sets.solds.length; } catch (err) { console.warn("[JP RUSH] 箱の数の計算に失敗", err); }
      // 4.10.123：タブ名の数も箱の「新」と同じ（このページの今回の NEW の数）。全ページの数は使わない。表示だけ（判定や記録は変えない）
      document.title = (newNow ? `(${newNow}) ` : "") + We;
      f.nextbox.innerHTML = `<div class="nb-row"><span>取得</span>${R && R.kind === "error" ? `<b class="ng">${T(n.lastAt)} ✗</b>` : R && R.kind === "sortx" ? `<b class="ng">－</b>` : `<b class="ok">${T(n.lastAt)}</b>`}</div><div class="nb-foot"><button type="button" class="nbk" data-nb="new" title="今回の新（一覧を重ねて開く）">新 ${newNow}</button><button type="button" class="nbk" data-nb="sold" title="今回の完（一覧を重ねて開く）">完 ${soldNow}</button></div>` + (C ? `<div class="nb-warn">古い画面です（更新前）。「更新」で開き直してください</div>` : "");
      {
        const S = Pe(n, o, u);
        f.list.textContent = `新着詳細\n${S.stock.length + S.sold.length}個`;
      }
      ovKind && renderOv();
      f.watchl && (f.watchl.textContent = `要注意 ${watchCount()}件`);
      f.sold.textContent = "完売記録", f.first.hidden = false, f.first.disabled = Je(), f.first.classList.toggle("warn", !Je() && !!R && R.kind === "error"), f.prevpage.disabled = Rt() <= 1, f.pgnum && (f.pgnum.textContent = pgLabel());
      const y = !!E(Lt(t), false);
      f.hourly.textContent = y ? "自動 ON" : "自動 OFF", f.hourly.className = y ? "on" : "sub", f.status.textContent = Ae;
      const v = [...n.log].reverse().slice(0, 8).map((S) => {
        const j = document.createElement("div");
        return j.textContent = Wn(S), j;
      });
      if (!v.length) {
        const S = document.createElement("div");
        S.textContent = "\u8A18\u9332\u306E\u5C65\u6B74\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093", v.push(S);
      }
      f.hist.replaceChildren(...v);
    }
    let dt = null;
    function _e(t, e, n, o) {
      return t ? t.strong ? true : !!t.seen && o - (n[e] || 0) <= 36e5 : false;
    }
    function Vn() {
      const t = rtR(), e = w(), n = [...document.querySelectorAll("a.search_itemlink")].filter((i) => {
        const c = et(i.href);
        return _e(Oe[c], c, t, e);
      });
      if (!n.length) {
        Y("\u6B21\u306E\u5370\u306E\u4ED8\u3044\u305F\u5546\u54C1\u306F\u3053\u306E\u30DA\u30FC\u30B8\u306B\u3042\u308A\u307E\u305B\u3093");
        return;
      }
      const o = dt && dt.isConnected ? dt.getBoundingClientRect() : null;
      let s;
      o && o.bottom > 140 && o.top < window.innerHeight ? s = n.find((i) => dt.compareDocumentPosition(i) & Node.DOCUMENT_POSITION_FOLLOWING) || n[0] : s = n.find((i) => i.getBoundingClientRect().top > 140) || n[0], dt = s, $e = e + 1500, f.markpos.textContent = (n.indexOf(s) + 1) + "/" + n.length, s.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // 4.10.94：試験の保存が残っていれば、起動時に1回だけ元に戻して消す（試験中の状態と既読を、試験の開始時のものに戻す）。試験を始める機能は無くした
    function ra(t) {
      const k = E(tt(t), null);
      k && ($(I(t), k.state), $("seen", k.seen || {}), $(tt(t), null));
    }
    const Xn = 3 * 864e5, Me = ["NEW", "REST", "PRICE", "STOCK", "BACK"];
    function Pe(t, e, n) {
      // 4.10.105：印はカードと同じ markOk で選ぶ（区切りは一つ）。保存は消さない
      const o = {}, from = ft(n, Xt);
      for (const d of t.events) Me.includes(d.type) && showEv(d) && markOk(t, d, from) && (o[d.item] = o[d.item] || []).push(d);   // 4.10.157：小さい値下げは左の欄に並べない
      const s = ST_EMPTY.sum, i = { stock: [], sold: [] };
      const ids = new Set([...Object.keys(o), ...Object.keys(t.items).filter((d) => t.items[d] && t.items[d].soldOut)]);
      for (const d of ids) {
        const r = t.items[d], l = o[d] || [];
        if (!r || !r.url || (!l.length && !r.soldOut)) continue;
        // 4.10.128：3日より前に売り切れたものは、行を作る前に外す（今までも一覧には入れていない。外す順番を前にしただけ）
        // 4.10.447：完売の「全て」は3日の制限を外した（今回は下の curX で絞るので、ここでは絞らない）。表示から消えた完売は外す（mn で印を付ける）
        if (r.soldOut && t.gone && t.gone[d]) continue;
        const p = l.length ? Math.max(...l.map((a) => a.at)) : r.soldAt || 0, m = s[gk(itmOf(r.url), r.name)] || s[z(r.name)], u = { id: d, rec: r, evs: l, at: p, seen: (e[d] || 0) >= p, sold: m ? m.c : 0, wn: t };
        r.soldOut ? i.sold.push(u) : i.stock.push(u);
      }
      // 4.10.71：今開いているページの商品を先に、その中とその後の商品はそれぞれじゃんぱらの新着順位順。NEW・復活・戻り・値下げは区別せず、既読でも並べ替えない（薄く表示するだけ）
      const pageNow = Number(new URL(location.href).searchParams.get("PAGE") || 1);
      const onNow = (d) => (d.rec.rank && d.rec.line && Math.ceil(d.rec.rank / d.rec.line) === pageNow ? 0 : 1);
      const c = (d, l) => onNow(d) - onNow(l) || (d.rec.rank || 1e9) - (l.rec.rank || 1e9) || (d.id < l.id ? -1 : d.id > l.id ? 1 : 0);
      return i.stock.sort(c), i.sold.sort(c), i;
    }
    // 4.10.126：箱の「新」「完」の数字と、押して重ねて出す一覧（オーバーレイ）。左の新着候補とは別に作る（新着候補は後で外す）
    // 数字＝今回（ft(今, jt) から）の一覧の件数。一覧と数字は同じ関数（roundSets）から作るので件数は必ず一致する。表示だけ（判定や記録は変えない）
    const setRow = (id, r, evs, at, seenAt, sum) => {
      const m = sum[gk(itmOf(r.url), r.name)] || sum[z(r.name)];
      return { id, rec: r, evs, at, seen: (seenAt[id] || 0) >= at, sold: m ? m.c : 0 };
    };
    // 新＝cut 以降に NEW と記録した商品（売り切れたものも・全ページ分も）。完＝cut 以降に在庫あり→売り切れと見た商品（戻ったものも数える）
    function roundSets(n, now, cut = ft(now, jt)) {
      const seenAt = rtR(), sum = ST_EMPTY.sum, s = gn(n, seenAt, now), news = [], solds = [];
      for (const [id, x] of Object.entries(s)) {
        const ev = x.evs.NEW, r = n.items[id];
        ev && roundAt(ev) >= cut && r && r.url && news.push(setRow(id, r, [ev], ev.at, seenAt, sum));
      }
      for (const [id, r] of Object.entries(n.items || {})) r && r.url && r.soldEvAt >= cut && solds.push(setRow(id, r, [], r.soldEvAt, seenAt, sum));
      return { news, solds };
    }
    // 一覧の一行（左の新着候補と、重ねる一覧で共通）
    // 4.10.140：no は左の一覧の番号（AI用にコピーの「N.」と同じ数え方）。4.10.142 から出すのは価格の段の右端だけ（表示だけ）
    function mkRow(r, pageNow, last, no) {
        const p = document.createElement("a");
        p.className = "row" + (r.seen ? " weak" : "") + (r.rec.rank && r.rec.line && Math.ceil(r.rec.rank / r.rec.line) === pageNow ? " cur" : "") + (r.cart ? " cart" : ""), p.href = r.rec.url, p.dataset.id = r.id, p.onclick = () => {
          yt(M(r.rec.url)), _ || (f.panel.hidden = true), closeOv();
        };
        // 4.10.118：画像の下に SRCODE を出す（押すと、その番号の詳細ページを同じタブで開く。行の「見た」は付けない。Ctrl・⌘・Shift は新しいタブ）
        const lt = document.createElement("div");
        lt.className = "lthumb";
        if (r.rec.img) {
          const g = document.createElement("img");
          g.src = r.rec.img, g.loading = "lazy", g.alt = "", lt.appendChild(g);
        } else {
          const g = document.createElement("div");
          g.className = "noimg", lt.appendChild(g);
        }
        const scx = srcodeOf(r.rec.url, r.rec.img);
        if (scx) {
          const ls = document.createElement("span");
          ls.className = "lsr", ls.title = srcodeTitle(scx);
          ls.textContent = scx.code;   // 4.10.119：番号だけ（「SRCODE」の字と「（写真）」は出さない）
          ls.addEventListener("click", (ev) => {
            ev.preventDefault(), ev.stopPropagation();   // 行のリンク（商品ページ）と、行の「見た」の印は使わない
            const href = srcodeHref(scx.code);
            ev.ctrlKey || ev.metaKey || ev.shiftKey ? window.open(href, "_blank") : (location.href = href);
          });
          // 中ボタン：行のリンク（商品ページ）ではなく、番号の詳細ページを新しいタブで開く
          ls.addEventListener("auxclick", (ev) => {
            if (ev.button !== 1) return;
            ev.preventDefault(), ev.stopPropagation(), window.open(srcodeHref(scx.code), "_blank");
          });
          lt.appendChild(ls);
        }
        p.appendChild(lt);
        const m = document.createElement("div");
        m.className = "t";
        const u = document.createElement("div");
        for (const g of Me.filter((O) => r.evs.some((y) => y.type === O))) {
          const O = r.evs.filter((S) => S.type === g).sort((S, j) => j.at - S.at)[0], y = document.createElement("span");
          y.className = "tg", tagPaint(y, O), u.appendChild(y);
        }
        if (r.cart) {
          const y = document.createElement("span");
          y.className = "tg cartg", y.textContent = "カート内", u.appendChild(y);
        }
        // 4.10.191：完売の行に★（要注意。押して付け外し）
        const wn = r.wv ? null : r.wn || curRecW(), w0 = r.rec.soldOut ? watchOf(r.id, r.rec, wn) : null;
        let wst = null;
        if (w0) {
          r.wv || watchAutoSave(r.id, r.rec, wn, w0);
          wst = wStar(w0.on), wst.addEventListener("click", (ev) => {
            ev.preventDefault(), ev.stopPropagation();
            const on = toggleWatch(r.id, r.rec, wn);
            wst.className = "wstar jp3-noopen" + (on ? " on" : ""), wst.textContent = on ? "★" : "☆";
            f.watchl && (f.watchl.textContent = `要注意 ${watchCount()}件`);
            f.panelKind === "watch" && !on && p.remove();
            watchSync(true);
          });
        }
        const a = document.createElement("div");
        a.className = "nm";
        // 4.10.142：番号は名前の段から外し、価格の段の右端（行の右上）に入れる
        let rn = null;
        if (no) rn = document.createElement("span"), rn.className = "rno", rn.textContent = "#" + no;
        a.appendChild(document.createTextNode(r.rec.name));
        const h = Object.entries((r.rec.soldOut && r.rec.live ? r.rec.live.prices : r.rec.prices) || {}).map(([g, O]) => `${g} ${A(O)}\u301C`).join(" / ") + (r.rec.soldOut && r.rec.live ? "\uFF08\u58F2\u5207\u308C\u524D\uFF09" : ""), b = r.rec.rank && r.rec.line ? `${Math.ceil(r.rec.rank / r.rec.line)}\u30DA\u30FC\u30B8\u76EE` : "", C = r.rec.soldOut ? `SOLD OUT${r.sold ? `\u30FB\u58F2\u5207\u308C${r.sold}\u56DE` : ""}` : `\u5728\u5EAB${r.rec.stock}`, k = document.createElement("div");
        const pd = mkPrice(r, last), top = document.createElement("div"), kf = document.createElement("div"), sm = document.createElement("span"); return sm.className = "seenmark", sm.textContent = "\u2713\u898B\u305F", k.className = "sub2", k.textContent = [C, w0 && w0.mins != null ? "出て" + fmtMin(w0.mins) : "", b, T(r.at)].filter(Boolean).join("\u30FB"), r.seen && k.append(" ", sm), top.className = "ptop", top.append(pd), rn && top.append(rn), wst && top.append(wst), kf.className = "kfoot", kf.append(k), appendCartBtn(kf, r, false), m.append(top, u, a, kf), p.appendChild(m), p;
    }
    let ovKind = null, ovTab = { new: "now", sold: "now" };
    const OV_TITLE = { new: "新", sold: "完" };
    const OV_TABS = { new: [["now", "今回"], ["half", "半日"]], sold: [["now", "今回"], ["half", "今回（半日）"], ["all", "全て"]] };
    function ovRows(n, now, kind, tab) {
      const seenAt = rtR(), sum = st().sum;
      if (kind === "sold" && tab === "all") return Object.entries(n.items || {}).filter(([id, r]) => r && r.url && r.soldOut && !(n.gone || {})[id]).map(([id, r]) => setRow(id, r, [], r.soldAt || r.soldEvAt || 0, seenAt, sum));
      const sets = roundSets(n, now, ft(now, tab === "half" ? Xt : jt));
      return kind === "new" ? sets.news : sets.solds;
    }
    function openOv(kind) {
      ovKind = kind, ovTab[kind] = "now", f.ov.hidden = false, renderOv();
    }
    function closeOv() {
      ovKind = null, f.ov && (f.ov.hidden = true);
    }
    function renderOv() {
      if (!ovKind || !f.ov) return;
      const t = D(location.href), e = Er(I(t), null), n = e && e.signature === t ? e : Dt(t), now = w();
      const tab = ovTab[ovKind], pageNow = Number(new URL(location.href).searchParams.get("PAGE") || 1), last = Er("lastlive", {});
      const onNow = (d) => (d.rec.rank && d.rec.line && Math.ceil(d.rec.rank / d.rec.line) === pageNow ? 0 : 1);
      const byOrder = (d, l) => onNow(d) - onNow(l) || (d.rec.rank || 1e9) - (l.rec.rank || 1e9) || (d.id < l.id ? -1 : d.id > l.id ? 1 : 0);
      const ownSet = ownCartSet(now);
      cartSig = sigOf(ownSet);
      const rows = ovRows(n, now, ovKind, tab).sort(byOrder).map((r) => ({ ...r, cart: ownSet.has(srOf(r.rec.url)) }));
      const list = [...rows.filter((r) => !r.cart), ...rows.filter((r) => r.cart)];
      const label = OV_TABS[ovKind].find(([v]) => v === tab)[1];
      const title = `${OV_TITLE[ovKind]}・${label}`;
      f.ovtitle.textContent = `${title}　${list.length}個`;
      const tabBtns = OV_TABS[ovKind].map(([v, lab]) => {
        const bt = document.createElement("button");
        bt.type = "button", bt.textContent = lab, bt.className = v === tab ? "on" : "";
        bt.onclick = () => { ovTab[ovKind] = v, renderOv(); };
        return bt;
      });
      const cp = document.createElement("button");
      cp.type = "button", cp.innerHTML = ICON_COPY, cp.title = "AI用にコピー", cp.setAttribute("aria-label", "AI用にコピー"), cp.className = "cp";
      cp.onclick = () => copyTo(cp, title, list, now);
      f.ovtabs.replaceChildren(...tabBtns, cp);
      const keep = f.ovbody.scrollTop;
      const box = document.createElement("div");
      box.className = "pbox a";
      if (!list.length) {
        const em = document.createElement("div");
        em.className = "empty", em.textContent = `${title}の商品はありません`;
        box.append(em);
      }
      list.slice(0, VT_MAX).forEach((r, k) => box.append(mkRow(r, pageNow, last, k + 1)));
      list.length > VT_MAX && box.append(Object.assign(document.createElement("div"), { className: "empty", textContent: `上位${VT_MAX}件だけ表示（残り${list.length - VT_MAX}件は「AI用にコピー」で全件）` }));
      f.ovbody.replaceChildren(box), f.ovbody.scrollTop = keep;
    }
    // 4.10.82：新着候補の在庫の行に「カートへ」を付ける。商品番号（SRCODE）が8桁か9桁のものだけ。
    // 店舗番号は長さで決める（8桁→先頭2桁、9桁→先頭3桁）。押すと確認画面なしで1回だけ送る（詳細ページは読まない）
    let cartSending = false, cartQueue = Promise.resolve(), readdPend = 0, readdOk = 0, readdTm = 0;
    // 4.10.368：カート画面の再カートは順番待ちにして、同時に送るのは4件まで（4.10.369 から5件）。入れる送信はカートのページを受け取らず（転送の返事で次へ）、
    // 全部送り終わったら、カートのページを1回だけ読んで入ったかを確かめる。入っていなければ1回だけ入れ直す。
    //（26件を一度に送ると、送信が詰まって20秒で打ち切られ、削除だけ通って消えていた）
    const RDQ = { jobs: [], active: 0, sent: [] };
    // ===== 4.10.382：自動再カートの働き手（Worker） =====
    // 画面（ページの処理）が固まっても止まらないよう、送信は別の働き手が受け持つ。画面のボタンは押さない。
    // ・画面はカートを読んだ時に「商品ごとの削除の送り先・入れ直しの中身・消える時刻」を働き手に渡すだけ
    // ・働き手は10秒ごとに時刻を見て、残り10分を切った商品を5件ずつ「削除→入れ直し」し、カートのページを読んで入ったかを確かめる。入っていなければもう1回入れる
    // ・削除の送り先が古い恐れがある時（画面が固まっていて、働き手が前に入れ直した後に読み直せていない）は、削除の後に本当に消えたかを確かめてから入れ直す
    // ・結果は画面に知らせ、画面が生きていれば記録・表示・開き直しをする。働き手の応答が45秒途絶えたら、今まで通り画面のボタンで動く
    const LIVE_END = {};   // 4.10.394：入れ直しが成功した商品の新しい「消える時刻」（開き直さずに表示を更新する）
    const RCW = { recipes: {}, w: null, hb: 0, ok: false, startAt: 0 };
    // ===== 4.10.384：再発防止の作り直し =====
    // ① 時間で必ず動く：残り10分になった商品は、カートの読み取り結果に関係なく必ず入れ直す（「見当たらない」で見送らない）
    //    カートに無ければ「入れるだけ」（期限切れで消えた物も1時間以内なら自動で戻す）。有れば「削除→入れる」
    // ② 削除の送り先は、その時読んだカートのページの行から毎回取り直す（画面のボタンに頼らない）
    // ③ 予定は画面ではなく覚え書き（rcBook）から作る。画面を開き直しても、カートから消えても、予定は消えない
    // ④ 読み取りがおかしい時（商品の半分以上が見えない等）は「信用しない」：失敗と数えず、削除→入れ直しをそのまま送る
    // ⑤ 番人：働き手が間に合っていない商品（残り4分以下）は、画面側がまとめて入れ直す（働き手が生きていても）
    function rcwMain() {
      let P = { active: false, items: [] }, busy = false; const tried = {}, lastRe = {};
      onmessage = (e) => { if (e.data && e.data.type === "plan") { P = e.data; for (const i of P.items) if (lastRe[i.code] && lastRe[i.code] > i.exp - P.hold) i.exp = lastRe[i.code] + P.hold; } };
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      // 4.10.452：働き手の通信も、混雑（503）以外のエラーは「⚠要報告」として記録に出す（同じ内容は30秒に1回まで）
      const repAt = {};
      const tf = (u, o) => { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 45000); const pr = fetch(u, { ...o, signal: ac.signal, credentials: "include" }).finally(() => clearTimeout(t)); const rep = (k) => { const path = String(u).replace(/^https?:\/\/[^/]+/, "").split("&")[0].slice(0, 60), key = path + "|" + k; if (repAt[key] && Date.now() - repAt[key] < 3e4) return; repAt[key] = Date.now(); postMessage({ type: "log", msg: `⚠要報告：${path}（${k}）` }); }; pr.then((r) => { if (r.status >= 400 && r.status !== 503) rep(r.status); }, (e) => rep(e && e.name === "AbortError" ? "時間切れ" : "通信エラー")); return pr; };
      const cartHtml = async () => { try { const r = await tf(P.origin + "/sale/cart/", { cache: "no-store" }); let h = await r.text(); h = h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, ""); const b = h.search(/<body/i); return b >= 0 ? h.slice(b) : h; } catch (e) { return ""; } };
      // その商品の行（SRCODE のリンクがあり、［削除］がある行）
      // 4.10.385：商品の範囲は「その商品のリンクから、次の別の商品のリンクまで」。中に［削除］のボタン（またはリンク）があればカートの中
      // （4.10.384 までは最初の </tr> で切っていた。スマホ・PC など保証などの小さな表が行の中にある商品は、削除の手前で切れて「無い」と見誤っていた）
      const LINK = /<a\b[^>]*href\s*=\s*["'][^"']*[?&]SRCODE=(\d+)/gi, DELC = /<(?:input|button)\b[^>]*(?:value|alt|title)\s*=\s*["'][^"']*削除|<button\b[^>]*>[^<]*削除|<img\b[^>]*alt\s*=\s*["'][^"']*削除|<a\b[^>]*>(?:\s|<[^>]+>)*削除/i;
      let LC = { h: null, links: [] };
      const linksOf = (h) => { if (LC.h === h) return LC.links; const a = []; let m; LINK.lastIndex = 0; while ((m = LINK.exec(h))) a.push([m.index, m[1]]); LC = { h, links: a }; return a; };
      const rowOf = (h, c) => {
        if (!h) return "";
        const links = linksOf(h), mk = h.indexOf("期限切れのため");
        for (let k = 0; k < links.length; k++) {
          if (links[k][1] !== c) continue;
          const s0 = links[k][0]; let e = h.length;
          for (let j = k + 1; j < links.length; j++) if (links[j][1] !== c) { e = links[j][0]; break; }
          if (mk > s0 && mk < e) e = mk;
          const seg = h.slice(s0, Math.min(e, s0 + 30000));
          if (DELC.test(seg)) { const st = h.lastIndexOf("<tr", s0); return h.slice(st >= 0 && s0 - st < 8000 ? st : s0, s0 + seg.length); }
        }
        return "";
      };
      const snipOf = (h, c) => { const k = linksOf(h).find((x) => x[1] === c); return k ? h.slice(Math.max(0, h.lastIndexOf("<tr", k[0])), k[0] + 2500).replace(/\s+/g, " ").slice(0, 3000) : ""; };
      const has = (h, c) => !!rowOf(h, c);
      const empty = (h) => /カートに商品は入っておりません|商品が入っていません/.test(h);
      // 読み取りを信用してよいか：総合計がある（または空のカート）、かつ、まだ期限内のはずの商品の半分以上が見えている
      const trust = (h) => { if (!h) return false; if (empty(h)) return true; if (!/総合計/.test(h)) return false; const live = P.items.filter((i) => i.exp > Date.now() + 60000); if (live.length < 4) return true; return live.filter((i) => has(h, i.code)).length >= live.length * 0.5; };
      const attr = (tag, n) => { const x = new RegExp("\\b" + n + "\\s*=\\s*([\"'])([^\"']*)\\1", "i").exec(tag) || new RegExp("\\b" + n + "\\s*=\\s*([^\\s>]+)", "i").exec(tag); return x ? (x[2] != null ? x[2] : x[1]).replace(/&amp;/g, "&") : ""; };
      // 行の中の［削除］の送り先と中身を、読んだページから取り出す
      const delOf = (row) => {
        try {
          const fr = /<form\b[^>]*>[\s\S]*?<\/form>/gi; let m;
          while ((m = fr.exec(row))) {
            const fm = m[0]; if (!/削除/.test(fm)) continue;
            const tag = /<form\b[^>]*>/i.exec(fm)[0], q = new URLSearchParams();
            const ir = /<(input|button)\b[^>]*>/gi; let x;
            while ((x = ir.exec(fm))) { const t = x[0], ty = (attr(t, "type") || (x[1].toLowerCase() === "button" ? "submit" : "text")).toLowerCase(), n = attr(t, "name"); if (!n) continue; if (ty === "hidden" || ty === "text") q.append(n, attr(t, "value")); else if (/削除/.test(t)) ty === "image" ? (q.append(n + ".x", "1"), q.append(n + ".y", "1")) : q.append(n, attr(t, "value")); }
            return { url: new URL(attr(tag, "action") || "/sale/cart/", P.origin + "/sale/cart/").href, method: (attr(tag, "method") || "post").toUpperCase(), body: q.toString() };
          }
          const ar = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
          while ((m = ar.exec(row))) if (/削除/.test(m[2]) && !/^javascript:/i.test(m[1])) return { url: new URL(m[1].replace(/&amp;/g, "&"), P.origin + "/sale/cart/").href, method: "GET", body: "" };
        } catch (e) {}
        return null;
      };
      // 商品のページの「カートに入れる」フォームの中身。無ければ在庫の状態（商談中・完売など）
      const detailAdd = async (i) => {
        try {
          const q = new URLSearchParams(i.add || ""), shp = q.get("SHPCODE");
          const r = await tf(P.origin + "/sale/search/detail/?SRCODE=" + i.code + (shp ? "&SHPCODE=" + shp : ""), { cache: "no-store" }), h = await r.text();
          const fr = /<form\b[^>]*action\s*=\s*["'][^"']*cart\/add[^"']*["'][^>]*>[\s\S]*?<\/form>/gi; let m;
          while ((m = fr.exec(h))) {
            const b = new URLSearchParams(), ir = /<input\b[^>]*>/gi; let x;
            while ((x = ir.exec(m[0]))) { const t = x[0], n = attr(t, "name"), ty = (attr(t, "type") || "text").toLowerCase(); if (n && (ty === "hidden" || ty === "text" || ty === "number")) b.set(n, attr(t, "value")); }
            if (b.get("SRCODE") && b.get("SRCODE") !== i.code) continue;
            if (!b.get("SRCODE")) b.set("SRCODE", i.code);
            if (!b.get("QTY")) b.set("QTY", "1");
            if (!b.has("REDIRECT")) b.set("REDIRECT", "");
            if (!b.get("SHPCODE") && shp) b.set("SHPCODE", shp);
            if (!b.get("PRICE") && q.get("PRICE")) b.set("PRICE", q.get("PRICE"));
            return { body: b.toString() };
          }
          return { st: /商談中/.test(h) ? "商談中" : /完売|SOLD\s*OUT|売り?切れ|品切れ/i.test(h) ? "完売" : "カートに入れるボタンが無い" };
        } catch (e) { return null; }
      };
      const send = (d) => d.method === "GET" ? tf(d.url, { redirect: "manual", cache: "no-store" }) : tf(d.url, { method: d.method, body: new URLSearchParams(d.body), redirect: "manual" });
      const add = (b) => tf(P.origin + "/sale/cart/add/", { method: "POST", body: new URLSearchParams(b), redirect: "manual" }).catch(() => {});
      const pool = async (arr, n, fn) => { let i = 0; await Promise.all(Array.from({ length: Math.min(n, arr.length) }, async () => { while (i < arr.length) { const x = arr[i++]; try { await fn(x); } catch (e) {} } })); };
      async function loop() {
        postMessage({ type: "hb", at: Date.now() });
        if (!P.active || busy) return;
        const now = Date.now(), ok0 = (i) => i.add && i.exp - now > -3600000 && !(tried[i.code] && now - tried[i.code] < 180000);
        let due = P.items.filter((i) => ok0(i) && i.exp - now <= P.left);
        if (!due.length) return;
        // 4.10.393：1点ずつ何度も動かず、5分以内に順番が来る物もまとめて入れ直す（回数・開き直し・削除〜カートインの隙が減る。まとまりは回を重ねるほど大きくなる）
        due = P.items.filter((i) => ok0(i) && i.exp - now <= P.left + 60000);   // 4.10.451：まとめは1分以内に順番が来る物まで（前は5分）
        busy = true;
        try {
          for (const i of due) tried[i.code] = now;
          // 4.10.451：送る前にカートを読まない（削除の送り先は、カートを読んだ時に覚えた物を使う）
          for (const i of due) { i.mode = "re"; i.delNow = null; }
          postMessage({ type: "start", codes: due.map((i) => i.code), back: [], blind: false, at: Date.now() });
          // 4.10.385：削除は必ず送る（カートに無ければ何も起きないだけ。読み違いで「入れるだけ」になると時間が延びずに消えていた）
          // 4.10.386：削除が本当に効いたかをカートを読んで確かめてから入れる。効いていない物はもう一度削除。
          //          （削除が効かないまま入れても時間は延びず、「成功」と出たのに元の時刻で消えていた）
          // 4.10.451：削除が403・503で拒否されたら、その商品は入れ直さない（拒否の中で入れ直しを続けない）
          const sendDel = async (i, d) => { if (!d) return (i.noDel = true); try { const r = await send(d); i.dOk = r.type === "opaqueredirect" || (r.status >= 300 && r.status < 400) || r.ok; i.denied = r.status === 403 || r.status === 503 ? r.status : 0; } catch (e) { i.dOk = false; } };
          // 4.10.392：削除の返事が正常なら、その場ですぐ入れる（消えている時間を1往復だけにして、他の人に取られる隙を最小にする）
          //          返事がおかしかった物だけ、カートを読んで削除が効いたかを確かめてから入れる
          const tB = Date.now();
          await pool(due, 5, async (i) => { await sendDel(i, i.delNow || i.del || null); if (i.dOk || i.noDel) { i.added = true; const t0 = Date.now(); await add(i.add); i.gap = Date.now() - t0; } });
          // 4.10.397：削除が通ってからカートインが通るまでの時間（＝他の人に取られうる時間）を測って記録する
          { const g = due.map((i) => i.gap).filter((x) => x >= 0).sort((a, b) => a - b); g.length && postMessage({ type: "log", msg: `削除〜カートインの隙：最大${(g[g.length - 1] / 1000).toFixed(1)}秒・中央${(g[g.length >> 1] / 1000).toFixed(1)}秒（${g.length}点・全体${((Date.now() - tB) / 1000).toFixed(1)}秒）` }); }
          const slow = due.filter((i) => !i.added && !i.denied);
          let hm = slow.length ? await cartHtml() : "", tm = !!hm && (empty(hm) || /総合計/.test(hm));
          let still = tm ? slow.filter((i) => has(hm, i.code)) : [];
          if (still.length) {
            await pool(still, 5, (i) => sendDel(i, delOf(rowOf(hm, i.code)) || i.del));
            hm = await cartHtml(), tm = !!hm && (empty(hm) || /総合計/.test(hm));
            still = tm ? still.filter((i) => has(hm, i.code)) : [];
            for (const i of still) i.delFail = true;
          }
          await pool(slow, 5, (i) => add(i.add));
          let h1 = await cartHtml(), t1 = trust(h1);
          const again = due.filter((i) => !i.denied && !has(h1, i.code));
          // 4.10.391：入らなかった物は、商品のページを読んで「今のカートに入れる中身」（値段が変わっていれば新しい値段）で入れ直す
          //          （値下げ等で値段が変わると、覚えていた値段では入らず、削除だけ通って消えていた）
          if (again.length) { await sleep(1500); await pool(again, 5, async (i) => { const f = await detailAdd(i); if (f && f.body) { if (f.body !== i.add) i.newAdd = f.body, i.add = f.body; await add(f.body); } else { if (f && f.st) i.st = f.st; await add(i.add); } }); h1 = await cartHtml(); t1 = trust(h1); }
          const t = Date.now();
          for (const i of due) {
            const ok = has(h1, i.code) && !i.delFail;
            if (ok) lastRe[i.code] = t, i.exp = t + P.hold;
            postMessage({ type: "done", code: i.code, ok, sure: t1 && !i.delFail, newAdd: i.newAdd || "", st: i.st || "", snip: ok ? "" : snipOf(h1, i.code), mode: i.mode, retried: again.includes(i), delOk: i.mode === "back" || !!i.dOk, noDel: !!i.noDel, at: t, why: ok ? "" : i.denied ? "じゃんぱらが拒否（" + i.denied + "）" : i.delFail ? "削除が効かず時間を延ばせない" : i.st ? "入らない・商品ページ：" + i.st : t1 ? "入れてもカートに無い（売れた可能性）" : "カートを読めなかった" });
          }
        } catch (e) { postMessage({ type: "log", msg: "働き手のエラー：" + String(e && e.message || e).slice(0, 60) }); }
        finally { busy = false; }
      }
      setInterval(loop, 10000); setTimeout(loop, 800);
    }
    const RCW_SRC = "(" + rcwMain.toString() + ")();";
    // 覚え書き（rcBook）：商品ごとの「入れる中身・削除の中身・消える時刻・最後に入れ直せた時刻・失敗回数」。この端末だけ（同期しない）
    function rcBookDrop(code) {
      try { const B = E("rcBook", {}) || {}; if (B[code]) delete B[code], $("rcBook", B); } catch (e) {}
      try { const c = E("cart", { codes: {} }) || { codes: {} }; if (c.codes && c.codes[code]) delete c.codes[code], $("cart", c); } catch (e) {}   // 自分で消した商品を、カートの記録から作り直さない
    }
    function rcBookOk(code, at) { try { const B = E("rcBook", {}) || {}; B[code] = { ...(B[code] || {}), exp: at + CART_HOLD, okAt: at, fails: 0 }; $("rcBook", B); } catch (e) {} }
    function rcItems() {
      const C = (E("cart", { codes: {} }) || {}).codes || {}, B = E("rcBook", {}) || {}, now = Date.now(), items = [], DM = delMarks();
      let ch = false;
      for (const [code, r] of Object.entries(RCW.recipes)) { const b = B[code]; if (!b || b.at !== r.at) B[code] = { ...(b || {}), del: r.del, add: r.add, name: r.name, at: r.at }, ch = true; }
      // 画面のボタンがまだ無い商品も、カートの記録から「入れる中身」を作って予定に入れる
      const H = E("cartHist", {}) || {};
      for (const [code, v] of Object.entries(C)) if (v && v.firstSeen && !B[code] && v.price && !(H[code] && H[code].mark)) { B[code] = { add: new URLSearchParams([["SRCODE", code], ["SHPCODE", shpOf(code)], ["PRICE", String(It ? It(v.price) || v.price : v.price).replace(/[^0-9]/g, "")], ["REDIRECT", ""], ["QTY", "1"]]).toString(), name: String(v.name || "").slice(0, 40), at: 0 }, ch = true; }
      const me = devId();
      for (const [code, b] of Object.entries(B)) {
        const v = C[code];
        // 4.10.398：ほかの端末のカートに入っている商品（履歴で別の端末・消えていない）は、この端末では入れない（取り合いで相手のカートから奪う恐れ）
        const hv = H[code];
        if (!v && hv && hv.dev && hv.dev !== me && !hv.goneAt) { delete B[code], ch = true; continue; }
        if (!v && hv && hv.mark) { delete B[code], ch = true; continue; }
        if (!v && DM[code]) { delete B[code], ch = true; continue; }
        if (v && DM[code] && (v.firstSeen || 0) > DM[code]) lsMarkDel(code);
        // 4.10.400：この端末のカートで実際に見た商品だけを扱う（見た印 mine）。2時間この端末のカートで見ていない物は予定から外す
        //          （端末の保存を写した時に、もう1台の商品が予定に混ざり、相手が入れ直す一瞬にこちらへ取り込んでいた）
        if (v) { if (!b.mine || now - b.mine > 6e5) b.mine = now, ch = true; }
        else if (!b.mine || now - b.mine > 72e5) { delete B[code], ch = true; continue; }
        let exp = b.exp || 0;
        if (v && v.firstSeen) { exp = v.unsure ? now : v.firstSeen + CART_HOLD; if (!v.unsure && b.exp !== exp) b.exp = exp, ch = true; }
        // 4.10.386：期限前なのにカートから消えている（途中で止まった等）商品は、待たずにすぐ戻す
        else if (exp > now && !(b.okAt && now - b.okAt < 18e4) && cartPage()) exp = now;
        if (!exp || now - exp > 36e5 || !b.add) { delete B[code], ch = true; continue; }
        items.push({ code, exp, del: b.del || null, add: withMeta(code, b.add).toString(), recipeAt: b.at || 0, okAt: b.okAt || 0, name: b.name || (v && v.name) || "" });
      }
      ch && $("rcBook", B);
      return items;
    }
    function rcwPlan(active) {
      if (!RCW.w) return;
      try { RCW.w.postMessage({ type: "plan", active: !!active, origin: location.origin, hold: CART_HOLD, left: RECART_LEFT, items: rcItems() }); } catch (e) {}
    }
    function rcwStart() {
      if (RCW.w || !window.Worker) return;
      try { RCW.w = new Worker(URL.createObjectURL(new Blob([RCW_SRC], { type: "text/javascript" }))), RCW.startAt = Date.now(); } catch (e) { console.warn("[JP RUSH] 働き手を作れません", e); RCW.w = null; return; }
      let relT = 0;
      RCW.w.onmessage = (e) => {
        const m = e.data || {};
        if (m.type === "hb") { RCW.hb = m.at; return; }
        if (m.type === "log") { arLog(`${T(w())} ${m.msg}`); return; }
        if (m.type === "start") { RCW.busy = Date.now(), RCW.lastStart = Date.now(); rcTouch(m.codes); try { const rd = E("cartReadd", {}) || {}; for (const c of m.codes) rd[c] = m.at; $("cartReadd", rd); } catch (e) {} arLog(`${T(m.at)} 働き手が再カート：${m.codes.length}点（${m.codes.slice(0, 3).join("・")}）${m.back && m.back.length ? `・うち${m.back.length}点はカートに無いので入れ直して戻す` : ""}${m.blind ? "・カートの読み取りが怪しいので確かめずに送った" : ""}`); return; }
        if (m.type === "missing") {
          // 4.10.383：画面にはボタンがあるのに働き手が「無い」と言う時は、働き手の読み違い。30分は働き手を信用せず、画面のボタンで再カートする
          if (document.querySelector(`.jprush-readd[data-code="${m.code}"]`)) { RCW.distrustUntil = Date.now() + 18e5; arLog(`${T(w())} 働き手の読み違い（${m.code} は画面ではカートにある）→ 30分は画面のボタンで再カート`); return; }
          arLog(`${T(w())} 働き手：${m.code} がカートに見当たらない（消えた可能性）`); return;
        }
        if (m.type === "done") {
          RCW.busy = 0;
          const nm = String((RCW.recipes[m.code] || {}).name || ((E("rcBook", {}) || {})[m.code] || {}).name || ((E("cart", { codes: {} }).codes || {})[m.code] || {}).name || m.code).slice(0, 20);
          if (m.ok) {
            try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; const o = { ...(c.codes[m.code] || {}) }; delete o.unsure; c.codes[m.code] = { ...o, firstSeen: m.at }; $("cart", c); } catch (e) {}
            rcBookOk(m.code, m.at);
            if (m.newAdd) try { const B = E("rcBook", {}) || {}; B[m.code] = { ...(B[m.code] || {}), add: m.newAdd }; $("rcBook", B); const np = Number(new URLSearchParams(m.newAdd).get("PRICE") || 0); if (np) { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes && c.codes[m.code] && (c.codes[m.code].price = np, $("cart", c)); arLog(`${T(m.at)} 値段が変わっていたので新しい値段（${np.toLocaleString()}円）で入れ直した（${m.code}）`); } } catch (e) {}
            arLog(`${T(m.at)} ${m.mode === "back" ? "カートに戻した" : "入れ直し成功"} ${nm}（${m.code}）${m.retried ? "・2回目で入った" : ""}${m.delOk ? "" : "・削除の返事がおかしかった"}${m.noDel ? "・削除の送り先が分からず入れるだけ" : ""}`);
            LIVE_END[m.code] = m.at + CART_HOLD;
            try { const H = E("cartHist", {}) || {}; if (H[m.code]) H[m.code].addAt = m.at, H[m.code].seen = m.at, H[m.code].dev = devId(), delete H[m.code].goneAt, $("cartHist", H); } catch (e) {}   // 4.10.395：カート履歴の「入れた時刻」も開き直さずに更新
            // 4.10.394：働き手はカートを読んで入ったことを確かめているので、開き直し・二重チェックはしない（止まりを減らす）。カートに無かった物を戻した時だけ開き直してボタンを出す
            if (m.mode === "back") try { const o = JSON.parse(sessionStorage.getItem("jprRdqCheck") || "null"), it = o && Date.now() - o.at < 3e5 ? o.items : {}; it[m.code] = (RCW.recipes[m.code] || {}).add || ""; sessionStorage.setItem("jprRdqCheck", JSON.stringify({ at: Date.now(), items: it })); } catch (e) {}
            m.mode === "back" && (clearTimeout(relT), relT = setTimeout(() => { readdPend || rcwBusy() || location.reload(); }, 3e3));
          } else {
            // 読み取りが確かな時だけ失敗と数える。3回続けて入らなければ、売れたとみて予定から外す
            let gave = false;
            // 画面ではカートにある（ボタンがある）のに入らないと言う時は、働き手の読み違い。数えずに30分は画面のボタンで動かす
            try { const rd = E("cartReadd", {}) || {}; if (rd[m.code]) delete rd[m.code], $("cartReadd", rd); } catch (e) {}   // 4.10.386：入れ直せなかった物は「入れ直した」扱いにしない（残り時間を延ばしたことにしない）
            try { if (m.snip) { const D = (E("rcDiag", []) || []).slice(-4); D.push({ at: m.at, code: m.code, why: m.why, html: m.snip, del: ((E("rcBook", {}) || {})[m.code] || {}).del || null }); $("rcDiag", D); } } catch (e) {}
            // 4.10.396：商品ページにカートボタンが無い（売れた・他の人のカート等）なら、すぐ予定から外して見張りに回す（何度も入れ直さない）
            if (m.st) {
              try { const B = E("rcBook", {}) || {}; delete B[m.code], $("rcBook", B); const R = E("rcRecov", {}) || {}; R[m.code] = { n: 3, at: m.at }, $("rcRecov", R); } catch (e) {}
              try { const H = E("cartHist", {}) || {}, C = (E("cart", { codes: {} }) || {}).codes || {}; watchAdd(m.code, { ...(H[m.code] || {}), ...(C[m.code] || {}) }, "買えない状態（" + m.st + "）", w()); } catch (e) {}
              arLog(`${T(m.at)} ${nm}（${m.code}）は商品ページで「${m.st}」→ 売れたか他の人のカートとみて、入れ直しをやめて見張りに回した`);
              return;
            }
            // 4.10.396：「読み違い」扱い（30分は画面のボタンで動く）はやめる。画面は入れ直す前の古い状態のことが多く、本当の失敗まで読み違いにしていた
            if (false && m.sure && document.querySelector(`.jprush-readd[data-code="${m.code}"]`)) { RCW.distrustUntil = Date.now() + 18e5; arLog(`${T(m.at)} 働き手の読み違い（${m.code} は画面ではカートにある）→ 30分は画面のボタンで再カート`); return; }
            if (m.sure) try { const B = E("rcBook", {}) || {}; if (B[m.code]) { B[m.code].fails = (B[m.code].fails || 0) + 1; gave = B[m.code].fails >= 3; gave && delete B[m.code]; $("rcBook", B); } } catch (e) {}
            arLog(`${T(m.at)} 入れ直し失敗 ${nm}（${m.code}・${m.why}）${gave ? "→ 3回入らないので売れたとみて外した" : m.sure ? "→ 3分後にもう一度" : "→ 失敗とは数えずにもう一度"}`);
          }
        }
      };
    }
    // 4.10.384：働き手が送っている途中は、画面を開き直さない（途中で開き直すと働き手ごと止まり、削除だけ通って消えていた）
    // 4.10.390：働き手が手を付けた時刻（このタブ・開き直しても残る）。番人・回収・見張りは、働き手が最近触った商品には手を出さない
    const rcTouchedMap = () => { try { return JSON.parse(sessionStorage.getItem("jprTouched") || "{}") || {}; } catch (e) { return {}; } };
    const rcTouched = (c) => rcTouchedMap()[c] || 0;
    const rcTouch = (codes) => { try { const o = rcTouchedMap(), t = Date.now(); for (const c of codes) o[c] = t; for (const c of Object.keys(o)) t - o[c] > 36e5 && delete o[c]; sessionStorage.setItem("jprTouched", JSON.stringify(o)); } catch (e) {} };
    const rcwBusy = () => !!(RCW.busy && Date.now() - RCW.busy < 18e4);
    const rcwAlive = () => !!RCW.w && !(RCW.distrustUntil > Date.now()) && (Date.now() - RCW.hb < 45e3 || Date.now() - RCW.startAt < 15e3);
    function rdqPump() {
      while (RDQ.active < 1 && RDQ.jobs.length) {   // 4.10.450：手動と同じく1件ずつ（前は同時に5件まで）
        const j = RDQ.jobs.shift();
        RDQ.active++;
        (j.retry ? Promise.resolve() : j.delReq().then((r) => { r && r.type !== "opaqueredirect" && !(r.status >= 300 && r.status < 400) && (j.delFail = true); }).catch(() => { j.delFail = true; }))
          .then(() => new Promise((res) => setTimeout(res, 2500)))   // 4.10.450：削除のあと数秒おいてから入れる（手動の間隔）
          .then(() => cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body: j.body, credentials: "include", redirect: "manual", keepalive: true, timeout: 45e3 }))
          .catch((e) => { j.err = e; })
          .finally(() => { setTimeout(() => { RDQ.active--, RDQ.sent.push(j), rdqPump(); }, 2500); });   // 次の1件までも数秒あける
      }
      if (!RDQ.active && !RDQ.jobs.length && RDQ.sent.length) rdqVerify();
    }
    // カートのページの文から「カートの中」の商品番号を拾う（期限切れの欄・おすすめは除く）
    // 4.10.390：カートの中の商品番号（その商品のリンクから次の別の商品のリンクまでに［削除］がある物）。「期限切れのため」の位置や行の中の小さな表に左右されない
    function cartSet(h) {
      const out = new Set(); if (!h) return out;
      const re = /<a\b[^>]*href\s*=\s*["'][^"']*[?&]SRCODE=(\d+)/gi, links = [], mk = h.indexOf("期限切れのため"); let m;
      while ((m = re.exec(h))) links.push([m.index, m[1]]);
      const DEL = /<(?:input|button)\b[^>]*(?:value|alt|title)\s*=\s*["'][^"']*削除|<button\b[^>]*>[^<]*削除|<img\b[^>]*alt\s*=\s*["'][^"']*削除|<a\b[^>]*>(?:\s|<[^>]+>)*削除/i;
      for (let k = 0; k < links.length; k++) {
        const c = links[k][1]; if (out.has(c)) continue;
        const s0 = links[k][0]; let e = h.length;
        for (let j = k + 1; j < links.length; j++) if (links[j][1] !== c) { e = links[j][0]; break; }
        if (mk > s0 && mk < e) e = mk;
        if (DEL.test(h.slice(s0, Math.min(e, s0 + 30000)))) out.add(c);
      }
      return out;
    }
    function cartCodesIn(html) { return cartSet(String(html || "").replace(/<script[\s\S]*?<\/script>/gi, "")); }
    function rdqVerify() {
      const batch = RDQ.sent.splice(0);
      cfetch("/sale/cart/", { credentials: "include", cache: "no-store", timeout: 45e3 }).then((r) => r.text()).then((html) => {
        const again = [], inCart = cartCodesIn(html);
        for (const j of batch) {
          if (inCart.has(j.code)) j.ok();
          else if (!j.retry) j.retry = true, again.push(j);
          else j.fail(j.err ? String(j.err.message || j.err) : "カートに見当たりません");
        }
        if (again.length) RDQ.jobs.push(...again), rdqPump();
      }).catch((e) => { for (const j of batch) j.fail("確かめられず（" + String(e && e.message || e).slice(0, 20) + "）"); });
      // 4.10.369：二重チェック用に、送った商品を覚えておく（開き直した後のページで、もう一度入っているか確かめる）
      try { const o = JSON.parse(sessionStorage.getItem("jprRdqCheck") || "null"), m = o && w() - o.at < 3e5 ? o.items : {}; for (const j of batch) j.noCheck || (m[j.code] = String(j.body)); sessionStorage.setItem("jprRdqCheck", JSON.stringify({ at: w(), items: m })); } catch (e) {}
    }
    // 4.10.369：二重チェック。再カートの後に開き直したページで、送った商品が全部カートにあるかをもう一度見る。無い物はその場で入れ直す（1回だけ）
    function rdqDoubleCheck() {
      let o = null;
      try { o = JSON.parse(sessionStorage.getItem("jprRdqCheck") || "null"); sessionStorage.removeItem("jprRdqCheck"); } catch (e) {}
      if (!o || !o.items || w() - o.at > 3e5) return;
      const have = new Set(cartParse().items.map((x) => x.code)), miss = Object.entries(o.items).filter(([c]) => !have.has(c));
      if (!miss.length) { arLog(`${T(w())} 二重チェック：${Object.keys(o.items).length}件とも入っている`); return; }
      arLog(`${T(w())} 二重チェック：${miss.length}件が入っていないので入れ直す（${miss.slice(0, 3).map(([c]) => c).join("・")}）`);
      readdPend++;
      let i = 0, act = 0;
      const t0 = w(), next = () => {
        while (act < 5 && i < miss.length) {
          const [code, body] = miss[i++];
          act++;
          try { const m = E("cartReadd", {}) || {}; m[code] = t0, $("cartReadd", m); } catch (e) {}
          cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body: new URLSearchParams(body), credentials: "include", redirect: "manual", keepalive: true, timeout: 45e3 }).catch(() => {}).finally(() => { act--, next(); });
        }
        if (act || i < miss.length) return;
        cfetch("/sale/cart/", { credentials: "include", cache: "no-store", timeout: 45e3 }).then((r) => r.text()).then((html) => {
          const inCart = cartCodesIn(html), ok = miss.filter(([c]) => inCart.has(c));
          try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; for (const [code] of ok) c.codes[code] = { ...(c.codes[code] || {}), firstSeen: t0 }; $("cart", c); } catch (e) {}
          arLog(`${T(w())} 二重チェック：${ok.length}件戻した` + (ok.length < miss.length ? `・${miss.length - ok.length}件は戻せず（${miss.filter(([c]) => !inCart.has(c)).slice(0, 3).map(([c]) => c).join("・")}）` : ""));
          readdPend--, ok.length && setTimeout(() => { rcwBusy() || location.reload(); }, 500);
        }).catch(() => { readdPend--; });
      };
      next();
    }
    window.addEventListener("pageshow", () => { cartSending = false; });
    // 4.10.194：番号が商品ページの中にしか無い在庫1の商品は、押した時にページの文字（HTML）だけを取ってきて読む（枠で開かない・画像も読まない）
    const shpOf = (sr) => sr.slice(0, sr.length === 8 ? 2 : 3);
    function cartUnitsFromHtml(txt, itm) {
      const out = [], seen = new Set();
      // 4.10.195：文字化けに左右されない「SRCODE=〜&SHPCODE=〜」（問い合わせ・共有のリンク）から取る。その商品の ITMCODE が付いたものを先に
      try { /cart\/add/.test(String(txt || "")) && addMetaHarvest(new DOMParser().parseFromString(String(txt || ""), "text/html")); } catch (e) {}   // 4.10.437
      const raw = String(txt || "").replace(/&amp;/g, "&").replace(/%3D/gi, "=").replace(/%26/gi, "&");
      // 4.10.196：並び順に関係なく、同じリンクの中の SRCODE・SHPCODE・ITMCODE を拾う（[1]=SRCODE [2]=SHPCODE [4]=ITMCODE）
      const links = raw.split(/["'\s<>]+/).filter((t) => /SRCODE=\d{8,9}(?!\d)/.test(t) && /SHPCODE=\d+/.test(t)).map((t) => { const g = (k) => (new RegExp("[?&]?" + k + "=(\\d+)").exec(t) || [])[1] || ""; return [t, g("SRCODE"), g("SHPCODE"), "", g("ITMCODE")]; }).filter((x) => x[1].length === 8 || x[1].length === 9);
      const own = links.find((x) => itm && x[4] === itm);
      if (own) return [{ sr: own[1], shp: own[2], price: 0 }];
      let d = null;
      try { d = new DOMParser().parseFromString(String(txt || ""), "text/html"); } catch (e) { d = null; }
      if (d) for (const fm of d.querySelectorAll('form[action*="cart/add"]')) {
        const g = (n) => { const i = fm.querySelector(`[name="${n}"]`); return i ? String(i.value || i.getAttribute("value") || "") : ""; };
        const sr = g("SRCODE").replace(/\D/g, ""), pr = Number(g("PRICE").replace(/[^\d]/g, ""));
        (sr.length === 8 || sr.length === 9) && !seen.has(sr) && (seen.add(sr), out.push({ sr, shp: g("SHPCODE").replace(/\D/g, "") || shpOf(sr), price: pr }));
      }
      if (out.length) return out;
      const re = /商品番号\s*[：:]\s*(\d{8,9})(?!\d)/g, plain = d && d.body ? d.body.textContent : String(txt || "");
      let mm;
      while ((mm = re.exec(plain))) seen.has(mm[1]) || (seen.add(mm[1]), out.push({ sr: mm[1], shp: shpOf(mm[1]), price: 0 }));
      // 最後の手段：ITMCODE の付かない「SRCODE=〜&SHPCODE=〜」（1件だけの時）
      if (!out.length && links.length === 1) out.push({ sr: links[0][1], shp: links[0][2], price: 0 });
      return out;
    }
    const unitPend = new Map();
    // 4.10.196：まずページの文字だけを取って読む。取れなければ見えない枠で商品ページを開いて読む（カートの「AI用にコピー」と同じ方法）
    // 結果は { us: [台], why: "" | "読めず" | "番号なし" }
    function unitsByFetch(u, itm) {
      return fetch(u, { credentials: "include", cache: "no-store" }).then((r) => {
        if (!r.ok) return null;
        const ct = r.headers.get("content-type") || "";
        return r.arrayBuffer().then((buf) => {
          let cs = (/charset=([\w-]+)/i.exec(ct) || [])[1] || "";
          if (!cs) { const head = new TextDecoder("latin1").decode(buf.slice(0, 4096)); cs = (/charset=["']?([\w-]+)/i.exec(head) || [])[1] || "utf-8"; }
          try { return new TextDecoder(cs).decode(buf); } catch (e) { return new TextDecoder("utf-8").decode(buf); }
        });
      }).then((t) => t ? { us: cartUnitsFromHtml(t, itm), read: true } : { us: [], read: false }).catch(() => ({ us: [], read: false }));
    }
    function unitsByFrame(u, itm) {
      return new Promise((res) => {
        const f = document.createElement("iframe");
        let fin = false, tm = 0, poll = 0, read = false;
        const end = (v) => { if (fin) return; fin = true, clearTimeout(tm), clearInterval(poll), f.remove(), res(v); };
        const tryPick = (last) => {
          let us = [];
          try {
            const d = f.contentDocument;
            if (d && d.documentElement && /^https?:/.test(d.URL) && d.body && d.body.childElementCount) read = true, us = cartUnitsFromHtml(d.documentElement.outerHTML, itm);
          } catch (e) { us = []; }
          if (us.length) return end({ us, read: true });
          last && end({ us: [], read });
        };
        tm = setTimeout(() => tryPick(true), 15e3);
        poll = setInterval(() => tryPick(false), 300);
        f.onload = () => setTimeout(() => tryPick(true), 200);
        f.name = FETCH_NAME, f.tabIndex = -1, f.setAttribute("aria-hidden", "true");
        f.style.cssText = "position:fixed;left:-10000px;top:0;width:1024px;height:900px;border:0;opacity:0;pointer-events:none;";
        f.setAttribute("sandbox", "allow-same-origin");   // 4.10.351：商品ページの中のプログラム（広告・分割払いの案内など）は動かさない。判定に使う所はページの元の文章で同じ（実物で確認）。1件 5〜6秒 → 2秒ほど
        f.src = u;
        document.body.appendChild(f);
      });
    }
    function cartUnitFor(url) {
      const u = new URL(url, location.origin).href;
      const itm = (/[?&]ITMCODE=(\d+)/.exec(u) || [])[1] || "";
      if (!unitPend.has(u)) unitPend.set(u, unitsByFetch(u, itm).then((a) => a.us.length ? { us: a.us, why: "" } : unitsByFrame(u, itm).then((b) => ({ us: b.us, why: b.us.length ? "" : (a.read || b.read) ? "番号なし" : "読めず" })))).then((res) => {
        // 4.10.348：型番ページで見つけた台は全部台帳へ（型番の索引にも足す）
        try { for (const x of res.us || []) x.sr && lgItem(x.sr, { price: x.price || 0, url: srcodeHref(x.sr), itm, st: "stock" }, "itmpage"); (res.us || []).length === 1 && res.us[0].sr && lgUrl(u, res.us[0].sr); } catch (e) {}   // 4.10.352：1台だけなら「このリンク＝この番号」も
        return res;
      });
      return unitPend.get(u);
    }
    function appendCartBtn(m, r, big) {
      // 4.10.194：番号は画像の下に出している番号と同じ取り方（URLに無ければ画像の名前から）。画像から取った番号は在庫1の時だけ使う
      const scx = srcodeOf(r.rec.url, r.rec.img), one = Number(r.rec.stock) === 1;
      const sr = scx && (!scx.photo || one) ? scx.code : "", len = sr.length, direct = len === 8 || len === 9;
      if (r.rec.soldOut || r.cart) return;
      // 番号が分からない在庫1の商品（ITMCODE）は、押した時に商品ページから番号を取る
      const viaPage = !direct && one && /[?&]ITMCODE=\d+/.test(String(r.rec.url || ""));
      if (!direct && !viaPage) return;
      const e0 = Object.entries(r.rec.prices || {})[0];
      const price = e0 ? Number(String(e0[1]).replace(/[^\d]/g, "")) : 0;
      if (!price) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "jprush-cart";
      b.textContent = "カートへ";
      // 4.10.332：一覧が描き直されても、さっき入れた商品は緑の「入れました ✓」のまま（商品ページから番号を取った商品は、リンクと番号の対応を覚えておく）
      const ukey = String(r.rec.url || "").replace(/[#].*$/, ""), own = ownCartSet(w()), um = E("cartUrls", {}) || {};
      const already = (sr && own.has(sr)) || (um[ukey] && own.has(um[ukey].sr));
      b.title = direct ? `商品番号 ${sr}${scx.photo ? "（写真の名前から）" : ""}・店舗番号 ${shpOf(sr)}（長さから推定）。押すと確認画面なしでカートに入れます` : "押すと商品ページから番号を取って、確認画面なしでカートに入れます";
      b.style.cssText = big ? "margin:0;padding:3px 12px;min-height:30px;border:1px solid #003792;border-radius:8px;background:#fff;color:#003792;font:700 13px/1.3 sans-serif;cursor:pointer;white-space:nowrap;" :"margin:0;padding:2px 10px;min-width:0;min-height:24px;border:1px solid #003792;border-radius:8px;background:#fff;color:#003792;font:700 12px/1.3 sans-serif;white-space:nowrap;cursor:pointer;";
      // 4.10.295：ページを移らずに裏でカートに入れる（続けて何個でも押せる。送るのは押した順に1つずつ）。
      // 送る中身は今までと同じ。返ってきたカートの中にその商品があれば成功
      // 4.10.330：状態を色で見せる（送信中＝黄、入った＝緑、入らない＝赤。赤は5秒で元に戻る）
      const css0 = b.style.cssText;
      const paint = (k) => { b.style.cssText = css0 + (k === "wait" ? "background:#fff7d6;border-color:#d9a400;color:#7a5600;" : k === "ok" ? "background:#e3f4e8;border-color:#2e8b57;color:#1e6b3f;" : k === "ng" ? "background:#fdecef;border-color:#c8102e;color:#c8102e;" : ""); };
      const fail = (why) => { b.disabled = false, paint("ng"), b.textContent = "入れられません" + (why ? "（" + why + "）" : ""), setTimeout(() => { b.disabled || (b.textContent = "カートへ", paint("")); }, 5000); };   // 4.10.331：赤の表示は5秒
      already && (b.disabled = true, b.textContent = "入れました ✓", paint("ok"));
      const send = (s, shp, pr, onFail) => {
        const fail0 = fail, fail1 = (why) => (onFail ? onFail(why) : fail0(why));
        b.textContent = "送信中…", paint("wait");
        console.info("[JP RUSH] カートへ：商品番号", s, "店舗番号", shp, "価格", pr);
        const body = withMeta(s, new URLSearchParams([["SRCODE", s], ["SHPCODE", shp], ["PRICE", String(pr)], ["REDIRECT", ""], ["QTY", "1"]]));
        // 4.10.296：順番待ちをやめて、押したらすぐ送る（ほぼ同時に並べて送る。失敗したらその行だけ「入れられません」）
        (() => cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body, credentials: "include", redirect: "follow" }).then((res) => res.text()).then((html) => {
          if (!new RegExp("[?&]SRCODE=" + s + "(?!\\d)").test(html)) return fail1("カートに見当たりません");
          try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; c.codes[s] = { name: r.rec.name || "", firstSeen: w() }; c.at = w(), $("cart", c); } catch (e) {}
          b.textContent = "入れました ✓", paint("ok");
          try { lgUrl(r.rec.url, s), lgItem(s, { name: r.rec.name, url: srcodeHref(s), st: "cart" }, "cart"); } catch (e) {}   // 4.10.334：商品台帳へ
          try { const m = E("cartUrls", {}) || {}, t = w(); m[ukey] = { sr: s, at: t }; for (const k of Object.keys(m)) t - m[k].at > CART_HOLD && delete m[k]; $("cartUrls", m); } catch (e) {}
        }).catch((e) => { console.warn("[JP RUSH] カートへ：送れませんでした", e); fail1("通信"); }))();
      };
      // 4.10.352：5分以内に同じ型番ページを読んで「在庫あり・この価格・この番号」と分かっていれば、ページを読み直さずにすぐ送る（入らなければ読み直す）
      let lgHit = null;
      const lookup = () => lgHit || (lgHit = lgFindUrl(r.rec.url).then((x) => (x && x.sr && w() - x.at < 3e5 ? lgGetItem(x.sr).then((L) => (L && L.st === "stock" && w() - (L.stAt || 0) < 3e5 && (!L.price || L.price === price) ? x.sr : "")) : "")).catch(() => ""));
      const viaRead = () => {
        b.textContent = "読込中…", paint("wait");
        cartUnitFor(r.rec.url).then(({ us, why }) => {
          const u = us.find((x) => x.price === price) || us[0];
          if (u) return send(u.sr, u.shp, u.price || price);
          unitPend.delete(new URL(r.rec.url, location.origin).href);
          console.warn("[JP RUSH] カートへ：番号を取れませんでした", why, r.rec.url);
          fail(why);
        });
      };
      // 指が触れた時点で商品ページを取り始める（押し終わるまでの時間を使う）。台帳で分かる時は読まない
      viaPage && b.addEventListener("pointerdown", () => { lookup().then((s) => { s || cartUnitFor(r.rec.url); }); }, { passive: true });
      b.addEventListener("click", (ev) => {
        // 行のリンクに移動させない
        ev.preventDefault();
        ev.stopPropagation();
        if (b.disabled) return;
        b.disabled = true;
        if (direct) return send(sr, (/[?&]SHPCODE=(\d+)/.exec(String(r.rec.url || "")) || [])[1] || shpOf(sr), price);   // 4.10.202：リンクに店舗番号があればそれを使う
        lookup().then((s) => (s ? send(s, shpOf(s), price, () => { lgHit = Promise.resolve(""), viaRead(); }) : viaRead()));
      });
      m.appendChild(b);
    }
    let ho = null;
    // 4.10.93：左の価格が無い行だけ、同じ商品番号の「最後に在庫があった時の価格」（lastlive・全検索共通）を時刻付きで出す。表示だけに使う（カートの価格・値下げの判定・保存には使わない）
    function mkPrice(r, last) {
      const pd = document.createElement("div");
      pd.className = "pr";
      const e0 = Object.entries((r.rec.soldOut && r.rec.live ? r.rec.live.prices : r.rec.prices) || {})[0];
      if (!e0 && last) {
        const sr = srOf(r.rec.url), L = last[r.id] || (sr && last["S" + sr]) || null, l0 = L && Object.entries(L.prices || {})[0];
        if (l0 && L.at > 0) {
          pd.textContent = A(l0[1]) + "〜";
          const c = document.createElement("small");
          c.className = "pc", c.textContent = ` ${l0[0]} ${T(L.at)}`;
          pd.appendChild(c);
          return pd;
        }
      }
      pd.textContent = e0 ? A(e0[1]) + "〜" : "価格なし";
      if (e0) {
        const c = document.createElement("small");
        c.className = "pc";
        c.textContent = " " + e0[0];
        pd.appendChild(c);
      }
      return pd;
    }
    const ICON_SVG = (d) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const ICON_COPY = ICON_SVG('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>');
    const ICON_CHECK = ICON_SVG('<path d="M20 6 9 17l-5-5"/>');
    const ICON_X = ICON_SVG('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
    // 4.10.191：要注意の完売（★）。自動＝出た時刻（NEW・復活の印）から売切れまで1時間以内。手動＝★を押して付け外し
    // 保存は watch：{商品ID: 記録（★）/ 0（外した）}。★の時点で商品の情報をまるごと残す（検索の記録から消えても残る）
    const WATCH_FAST = 36e5, appCache = new WeakMap();
    function appMap(n) {
      if (!n || !Array.isArray(n.events)) return {};
      const c = appCache.get(n);
      if (c && c.len === n.events.length) return c.m;
      const m = {};
      for (const d of n.events) d && (d.type === "NEW" || d.type === "BACK") && (m[d.item] || (m[d.item] = [])).push(d.at);
      return appCache.set(n, { len: n.events.length, m }), m;
    }
    const curRecW = () => { try { const t = D(location.href), e = Er(I(t), null); return e && e.signature === t ? e : null; } catch (e) { return null; } };
    const wStore = () => Er("watch", {}) || {};
    function watchOf(id, rec, n) {
      if (!rec || !rec.soldOut) return null;
      const sold = rec.soldAt || rec.soldEvAt || 0, ts = (appMap(n)[id] || []).filter((t) => t && t <= sold), app = ts.length ? Math.max(...ts) : 0;
      const v = wStore()[id], saved = v && typeof v === "object" ? v : null;
      const mins = app && sold ? Math.round((sold - app) / 6e4) : saved && saved.mins != null ? saved.mins : null, auto = !!(app && sold && sold - app <= WATCH_FAST);
      return { mins, auto, app, sold, saved, on: !!saved || (v !== 0 && auto) };
    }
    const fmtMin = (m) => m < 60 ? `${m}分` : `${Math.floor(m / 60)}時間${m % 60 ? (m % 60) + "分" : ""}`;
    function watchEntry(id, rec, n, wo, kind) {
      const pr = (rec.soldOut && rec.live ? rec.live.prices : rec.prices) || {};
      return { kind, at: w(), name: rec.name, prices: pr, url: rec.url, img: rec.img || "", rank: rec.rank || 0, line: rec.line || 0, app: wo.app || 0, sold: wo.sold || 0, mins: wo.mins, q: n && n.signature ? qLabel(n.signature) : "", sig: n && n.signature || "" };
    }
    // 自動の★は、行を描いた時に保存する（まとめて1回だけ書く）
    let wPend = null;
    function watchAutoSave(id, rec, n, wo) {
      if (!wo.on || wo.saved) return;
      wPend || (wPend = {}, setTimeout(() => { const o = { ...wStore() }, p = wPend; wPend = null; let ch = false; for (const [k, e] of Object.entries(p)) o[k] == null && (o[k] = e, ch = true); ch && $("watch", o); }, 0));
      wPend[id] = watchEntry(id, rec, n, wo, "自動");
    }
    function toggleWatch(id, rec, n) {
      const wo = watchOf(id, rec, n), o = { ...wStore() };
      o[id] = wo.on ? 0 : watchEntry(id, rec, n, wo, "手動");
      $("watch", o), vtMemo = [];
      return !wo.on;
    }
    function wStar(on) {
      const y = document.createElement("span");
      return y.className = "wstar jp3-noopen" + (on ? " on" : ""), y.textContent = on ? "★" : "☆", y.title = on ? "要注意（押すと外す）" : "押すと要注意", y.setAttribute("role", "button"), y;
    }
    // 4.10.197：★を付け外ししたら、もう片方（左の新着候補・真ん中の一覧）の★と件数を揃える
    function watchSync(fromLeft) {
      f.watchl && (f.watchl.textContent = `要注意 ${watchCount()}件`);
      if (fromLeft) { try { paintCards(); } catch (e) {} return; }
      if (f.panel && !f.panel.hidden && f.panelKind === "new") { const st = f.panel.scrollTop; vt(), f.panel.scrollTop = st; }
    }
    const watchCount = () => Object.values(wStore()).filter((v) => v && typeof v === "object").length;
    // 要注意の一覧（新しい順）。行の形は新着候補と同じ
    function watchRows() {
      return Object.entries(wStore()).filter(([, v]) => v && typeof v === "object").map(([id, v]) => ({ id, rec: { name: v.name, soldOut: true, prices: v.prices, live: { prices: v.prices }, url: v.url, img: v.img, rank: v.rank, line: v.line, soldAt: v.sold, stock: 0 }, evs: [], at: v.sold || v.at, seen: false, sold: 0, wv: v })).sort((a, b) => (b.wv.sold || b.wv.at) - (a.wv.sold || a.wv.at));
    }
    function wItem(r, i) {
      const v = r.wv, pr = Object.entries(v.prices || {}).map(([g, O]) => `${g} ${A(O)}〜`).join(" / ");
      return `${i + 1}. ${v.name}\n   価格：${pr}（売切れ前）\n   ${[v.mins != null ? "出て" + fmtMin(v.mins) + "で完売" : "", v.sold ? "売切れ " + ht(v.sold) : "", v.kind, v.q ? "検索：" + v.q : ""].filter(Boolean).join(" / ")}\n   ${v.url}`;
    }
    function watchPanel() {
      const rows = watchRows(), last = Er("lastlive", {});
      f.ptitle.textContent = `要注意 ${rows.length}件`;
      const ctl = document.createElement("div"), cp = document.createElement("button"), nt = document.createElement("div");
      ctl.className = "ctl", cp.type = "button", cp.className = "sub", cp.textContent = "AI用にコピー";
      cp.onclick = () => writeClip([`要注意の完売　${rows.length}件（${T(w())}時点）`, ...rows.map(wItem)].join("\n\n"), () => { cp.textContent = "✓ コピー", setTimeout(() => { cp.textContent = "AI用にコピー"; }, 1200); }, () => { cp.textContent = "✗ 失敗"; });
      ctl.append(cp), nt.className = "note", nt.textContent = "★＝要注意。自動は出てから1時間以内に完売した商品（新着・復活の印から）。☆にすると一覧から外れます。";
      const box = document.createElement("div");
      box.className = "wlist";
      rows.length || box.append(Object.assign(document.createElement("div"), { className: "empty", textContent: "要注意の商品はまだありません" }));
      rows.forEach((r, k) => box.append(mkRow(r, 0, last, k + 1)));
      f.pbody.replaceChildren(ctl, nt, box), Kt("watch");
    }
    function cpItem(r, i) {
      const pr = Object.entries((r.rec.soldOut && r.rec.live ? r.rec.live.prices : r.rec.prices) || {}).map(([g, O]) => `${g} ${A(O)}〜`).join(" / ") + (r.rec.soldOut && r.rec.live ? "（売切れ前）" : "");
      const mk = Me.filter((g) => r.evs.some((y) => y.type === g)).map((g) => K[g]).join("・");
      const pg = r.rec.rank && r.rec.line ? `${Math.ceil(r.rec.rank / r.rec.line)}ページ目` : "";
      const stt = r.rec.soldOut ? `売切れ${r.sold ? `（${r.sold}回）` : ""}` : `在庫 ${r.rec.stock}`;
      const wq = r.rec.soldOut ? watchOf(r.id, r.rec, r.wn || curRecW()) : null, wt = wq && wq.on ? `要注意（${wq.mins != null ? "出て" + fmtMin(wq.mins) + "で完売" : "手動"}）` : "";
      const info = [stt, mk ? `印 ${mk}` : "", wt, r.cart ? "カート内" : "", `検出 ${T(r.at)}`, pg].filter(Boolean).join(" / ");
      return `${i + 1}. ${r.rec.name}\n   価格：${pr}\n   ${info}\n   ${r.rec.url}`;
    }
    function copyTo(btn, title, list, now) {
      const text = [`${title}　${list.length}件（${T(now)}時点）`, ...list.map((r, i) => cpItem(r, i))].join("\n\n");
      const done = (ok) => {
        btn.innerHTML = ok ? ICON_CHECK : ICON_X;
        setTimeout(() => { btn.innerHTML = ICON_COPY; }, 1200);
      };
      const fallback = () => {
        const ta = document.createElement("textarea");
        ta.value = text, ta.style.position = "fixed", ta.style.opacity = "0", document.body.appendChild(ta), ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        ta.remove();
        done(ok);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback);
      else fallback();
    }
    // 4.10.190：全検索の新着候補をコピー。押した時だけ、ほかの検索の記録を別の保存場所から読む（直近24時間に開いた検索だけ）。判定は左の新着候補と同じ
    const XCP_DAY = 864e5;
    const qLabel = (sig) => {
      let p;
      try { const arr = JSON.parse(String(sig || "[]")); p = new Map(); for (const [k, v] of arr) p.set(k, p.has(k) ? p.get(k) + "," + v : v); } catch (e) { return "検索"; }
      const parts = [["KEYWORDS", "語"], ["NOTKEYWORDS", "除外"], ["MINPRICE", "下限"], ["MAXPRICE", "上限"]].map(([k, l]) => p.get(k) ? l + " " + p.get(k) : "").filter(Boolean);
      return parts.join(" / ") || "条件なし";
    };
    // 左の新着候補（vt）と同じ選び方
    function candOf(n, now, seen, ownSet, view) {
      view = view || candView;
      const o = Pe(n, seen, now), cur = ft(now, jt), curX = ft(now, Xt), nowOk = (ev) => roundAt(ev) >= cur;
      const stockAll = view.stock === "now" ? o.stock.filter((r) => r.evs.some(nowOk)).map((r) => ({ ...r, evs: r.evs.filter(nowOk) })) : o.stock;
      const onlyStockUp = (r) => r.evs.length > 0 && r.evs.every((ev) => ev.type === "STOCK");
      const withCart = (list) => list.map((r) => ({ ...r, cart: ownSet.has(srOf(r.rec.url)) }));
      return { stock: withCart(listFull ? stockAll : stockAll.filter((r) => !onlyStockUp(r))), sold: withCart(view.sold === "now" ? o.sold.filter((r) => r.rec.soldAt >= curX) : o.sold) };
    }
    function recsForCopy(now) {
      const curKey = Ct + I(D(location.href)), out = new Map();
      const take = (k, v) => { v && v.items && v.signature && now - (v.lastAt || 0) <= XCP_DAY && out.set(k, v); };
      RECMEM.has(curKey) ? take(curKey, RECMEM.get(curKey)) : take(curKey, E(I(D(location.href)), null));
      if (!window.indexedDB) return Promise.resolve(out);
      return idbOpen().then((db) => new Promise((res) => {
        const tx = db.transaction(IDB_STORE, "readonly"), st = tx.objectStore(IDB_STORE), rg = IDBKeyRange.bound(Ct + "s.", Ct + "s.￿"), rk = st.getAllKeys(rg), rv = st.getAll(rg);
        tx.oncomplete = () => { db.close(); const ks = rk.result || [], vs = rv.result || []; for (let i = 0; i < ks.length; i++) { const k = String(ks[i]); out.has(k) || RECMEM.has(k) || take(k, unzipRec(vs[i])); } res(out); };
        tx.onerror = tx.onabort = () => { db.close(), res(out); };
      })).catch(() => out);
    }
    let xcpReady = null;
    function copyAllSearches(btn, scope = "now") {
      const sc = { stock: scope, sold: scope === "now" ? "now" : "all" };   // 4.10.446：今回＝在庫今回・完売今回／半日＝在庫半日・完売全て
      const say = (s) => { btn.textContent = s; };
      const reset = () => setTimeout(() => { btn.innerHTML = ICON_COPY + "全検索"; }, 1500);
      if (xcpReady && xcpReady.k === scope) { const t = xcpReady.t; writeClip(t, () => { xcpReady = null, say("✓ コピー"), reset(); }, () => { say("✗ 失敗"), reset(); }); return; }
      say("読込中…");
      const now = w();
      recsForCopy(now).then((recs) => {
        const seen = rtR(), ownSet = ownCartSet(now), best = { stock: new Map(), sold: new Map() };
        for (const n of recs.values()) {
          let c;
          try { c = candOf(n, now, seen, ownSet, sc); } catch (e) { continue; }
          const q = qLabel(n.signature);
          for (const kind of ["stock", "sold"]) for (const r of c[kind]) { const was = best[kind].get(r.id); (!was || r.at > was.at) && best[kind].set(r.id, { ...r, q }); }
        }
        // 1つの商品は在庫か完売のどちらか一方（新しい方）
        for (const [id, r] of best.sold) { const s = best.stock.get(id); s && (s.at > r.at ? best.sold.delete(id) : best.stock.delete(id)); }
        const order = (m) => { const l = [...m.values()].sort((a, b) => b.at - a.at || (a.rec.rank || 1e9) - (b.rec.rank || 1e9)); return [...l.filter((r) => !r.cart), ...l.filter((r) => r.cart)]; };
        const item = (r, i) => cpItem(r, i).replace(/\n   ([^\n]*)$/, `\n   検索：${r.q}\n   $1`);
        const stock = order(best.stock), sold = order(best.sold);
        const sec = (title, list) => [`${title}　${list.length}件（${T(now)}時点）`, ...list.map(item)].join("\n\n");
        const text = [`全検索の新着候補（${recs.size}検索：${[...recs.values()].map((n) => qLabel(n.signature)).join("｜")}）`, sec(`在庫（${sc.stock === "now" ? "今回" : "半日"}）`, stock), sec(`完売（${sc.sold === "now" ? "今回" : "全て"}）`, sold)].join("\n\n――――――――\n\n");
        writeClip(text, () => { say("✓ コピー"), reset(); }, () => { xcpReady = { k: scope, t: text }, say("もう一度押す"); });
      }).catch(() => { say("✗ 失敗"), reset(); });
    }
    let candView = { stock: "now", sold: "now" };
    // 4.10.75：在庫・完売の枠を「たたむ／開く」の状態（開いている間だけ覚える）
    let candFold = { stock: false, sold: false };
    // 4.10.78：カートの記録（SRCODE・失効）が変わったときだけ、開いている候補一覧を描き直す。検索や新着の判定は動かさない
    let cartSig = null;
    const sigOf = (set) => [...set].sort().join(",");
    // 4.10.79：検索結果のカードの印だけを描き直す（候補一覧や新着の判定には触らない）
    function paintCards() {
      const t = D(location.href), e = Er(I(t), null), n = e && e.signature === t ? e : Dt(t), s = gn(n, rtR(), w());
      Tn(s, Bt(), n.items);
      try { DIAG.steps.ext = "始"; renderExt(n, s); DIAG.steps.ext = "済"; } catch (err) { DIAG.steps.ext = "失敗"; derr("renderExt", err); console.warn("[JP RUSH] 印付き商品の欄の表示に失敗", err); }
    }
    function syncCart() {
      if (!Nt() || !f.panel || !f.pbody) return;
      const sig = sigOf(ownCartSet(w()));
      if (sig === cartSig) return;
      if (cartSig === null) { cartSig = sig; return; }   // 4.10.183：起動直後の1回目は、カートの中身を覚えるだけ（同じ中身で描き直さない）
      cartSig = sig;
      paintCards();
      ovKind && renderOv();
      if (f.panel.hidden || f.panelKind !== "new") return;   // 閉じている間は、次に開いたとき vt() が読み直す
      const st = f.panel.scrollTop;
      vt();
      f.panel.scrollTop = st;
    }
    const VT_MAX = 150;   // 4.10.87：新着候補の一覧に並べる最大の行数
    // 4.10.130：左の箱の使い回し（直近2つ）と、コピーに渡す一覧（押した時点の最新）
    let vtCopy = { stock: [], sold: [], now: 0 }, vtMemo = [];
    function vt() {
      const t = D(location.href), e = Er(I(t), null), n = e && e.signature === t ? e : Dt(t), now = w(), o = Pe(n, rtR(), now), s = (r) => r.filter((p) => !p.seen).length;
      const curX = ft(now, Xt);
      // 4.10.113：在庫の「今回」＝直前の更新（ft(今, jt)）以降に判定した印（新着も判定した回で数える。初めて見た時刻では数えない）
      const cur = ft(now, jt), nowOk = (ev) => roundAt(ev) >= cur;
      // 4.10.72：今開いているページ（URLの PAGE）。このページの商品の行に薄い背景色を付ける
      const pageNow = Number(new URL(location.href).searchParams.get("PAGE") || 1);
      // 4.10.70：印は「表示している期間に起きたもの」だけで判定・表示する（過去30日分の古いNEWを持ち込まない）
      // 4.10.105：在庫は区切り一つ（14:33:30・20:33:30）。印は Pe で選び済み
      const stockAll = candView.stock === "now" ? o.stock.filter((r) => r.evs.some(nowOk)).map((r) => ({ ...r, evs: r.evs.filter(nowOk) })) : o.stock;
      // 4.10.70：在庫増だけの商品は、表示期間の中に値下げ（最安値↓）が無ければ出さない。印で理由が見えるものだけ残す
      const onlyStockUp = (r) => r.evs.length > 0 && r.evs.every((ev) => ev.type === "STOCK");
      // 4.10.78：カート内（SRCODE一致）の商品は印を付けて各一覧の最後へ送るだけ。一覧からは外さず、件数にも含める
      const ownSet = ownCartSet(now), withCart = (list) => list.map((r) => ({ ...r, cart: ownSet.has(srOf(r.rec.url)) })), cartLast = (list) => [...list.filter((r) => !r.cart), ...list.filter((r) => r.cart)];
      cartSig = sigOf(ownSet);
      const stock = cartLast(withCart(listFull ? stockAll : stockAll.filter((r) => !onlyStockUp(r))));
      const soldRaw = candView.sold === "now" ? o.sold.filter((r) => r.rec.soldAt >= curX) : o.sold;
      const sold = cartLast(withCart(soldRaw));
      // 4.10.130：コピーの押し手は、押した時点の最新の一覧を読む（箱を使い回しても、中身は今の一覧）
      vtCopy = { stock, sold, now };
      const last = Er("lastlive", {});   // 4.10.93：最後に在庫があった時の価格は一覧の描き直しごとに1回だけ読む（4.10.128：読むだけなので写しで読む）
      const i = (r) => {
        const p = document.createElement("div");
        return p.className = "sect", p.textContent = r, p;
      }, c = (r) => {
        const p = document.createElement("div");
        return p.className = "empty", p.textContent = r, p;
      }, d = (r, no) => mkRow(r, pageNow, last, no), l = [];
      const segBtns = (kind, opts) => {
        const g = document.createElement("span");
        g.className = "seg";
        for (const [v, lab] of opts) {
          const bt = document.createElement("button");
          bt.type = "button";
          bt.textContent = lab;
          bt.className = candView[kind] === v ? "on" : "";
          bt.onclick = () => { candView[kind] = v, vt(); };
          g.appendChild(bt);
        }
        return g;
      }, hdr = (text, kind, opts, title, list) => {
        const h = document.createElement("div");
        h.className = "phd";
        const sp = document.createElement("span");
        sp.textContent = text;
        const g = segBtns(kind, opts), cp = document.createElement("button"), pa = document.createElement("span");
        cp.type = "button", cp.innerHTML = ICON_COPY, cp.title = "AI用にコピー", cp.setAttribute("aria-label", "AI用にコピー"), cp.className = "cp";
        cp.onclick = () => copyTo(cp, title, vtCopy[kind], vtCopy.now);
        const fb = document.createElement("button");
        fb.type = "button", fb.className = "fbtn", fb.innerHTML = ICON_SVG(candFold[kind] ? '<path d="m6 9 6 6 6-6"/>' : '<path d="m6 15 6-6 6 6"/>'), fb.title = candFold[kind] ? "開く" : "たたむ", fb.setAttribute("aria-label", fb.title), fb.setAttribute("aria-expanded", String(!candFold[kind])), fb.onclick = () => { candFold[kind] = !candFold[kind], vt(); };
        pa.className = "pact", pa.append(cp, g, fb), h.append(sp, pa);
        return h;
      };
      // 4.10.70：NEWだけの商品も折りたたまず通常の一覧に出す（NEWの印で区別できるため）
      // 4.10.87：一覧に出す行は上位だけ（1行ごとに画像とボタンを作るため、件数が多いとEdgeのメモリを使い切る）。全件は「AI用にコピー」で取り出せる
      // 4.10.130：箱の中身の材料（行に出るもの・並び・折りたたみ・表示の切り替え・件数）が前と同じなら、作り直さず前の箱を使う
      const vtKey = (r) => [r.id, r.seen, r.cart, r.at, r.sold, r.evs, r.rec, last[r.id] || null, last["S" + srOf(r.rec.url)] || null];
      const sig = JSON.stringify([pageNow, candView, candFold, stock.length, sold.length, stock.slice(0, VT_MAX).map(vtKey), sold.slice(0, VT_MAX).map(vtKey)]);
      const buildBoxes = () => {
      const boxA = document.createElement("div");
      boxA.className = "pbox a" + (candFold.stock ? " folded" : "");
      boxA.append(hdr(`在庫 ${stock.length}個`, "stock", [["now", "今回"], ["all", "半日"]], `新着候補・在庫（${candView.stock === "now" ? "今回" : "半日"}）`, stock));
      stock.length || boxA.append(c("在庫の候補はありません"));
      // 4.10.140：左の在庫の行に、コピーと同じ番号（#N）を付ける（並びは vtCopy と同じ配列。上位の表示分だけ）
      stock.slice(0, VT_MAX).forEach((r, k) => boxA.append(d(r, k + 1)));
      stock.length > VT_MAX && boxA.append(c(`上位${VT_MAX}件だけ表示（残り${stock.length - VT_MAX}件は「AI用にコピー」で全件）`));
      const boxB = document.createElement("div");
      boxB.className = "pbox b" + (candFold.sold ? " folded" : "");
      boxB.append(hdr(`完売 ${sold.length}個`, "sold", [["now", "今回"], ["all", "全て"]], `新着候補・完売（${candView.sold === "now" ? "今回" : "3日"}）`, sold));
      sold.length || boxB.append(c("完売の候補はありません"));
      // 4.10.140：左の完売の行に、コピーと同じ番号（#N）を付ける（並びは vtCopy と同じ配列。上位の表示分だけ）
      sold.slice(0, VT_MAX).forEach((r, k) => boxB.append(d(r, k + 1)));
      sold.length > VT_MAX && boxB.append(c(`上位${VT_MAX}件だけ表示（残り${sold.length - VT_MAX}件は「AI用にコピー」で全件）`));
      return { boxA, boxB };
      };
      let memo = vtMemo.find((m) => m.sig === sig);
      if (!memo) { memo = { sig, ...buildBoxes() }; vtMemo.unshift(memo), vtMemo.length = Math.min(vtMemo.length, 2); }
      const { boxA, boxB } = memo;
      // 4.10.101：描き直しの前後で、左の在庫・完売それぞれのスクロール位置を保つ（表示だけ）
      // 4.10.130：画面の計算（レイアウト）を1回にまとめる。スクロールを読む→パネルの状態を決める→箱を入れる→最後に位置を戻す（Kt と同じ結果）
      const jpKeepBoxes = [...f.pbody.querySelectorAll(".pbox")].map((e) => e.scrollTop);
      const jpPanelE = !!_ && !f.panel.hidden && f.panelKind === "new", jpPanelN = f.panel.scrollTop;
      f.panelKind = "new", qt(), f.panel.classList.toggle("split", true), f.panel.hidden = false;
      f.ptitle.textContent = `新着候補　在庫 ${stock.length}個 / 完売 ${sold.length}個`;
      f.pbody.replaceChildren(boxA, boxB);
      f.panel.scrollTop = jpPanelE ? jpPanelN : 0, [boxA, boxB].forEach((e, i) => { e.scrollTop = jpKeepBoxes[i] || 0; });
    }
    const Wt = 150;
    function Ie(t) {
      const { sum: e, tent: n, old: o, byName: s, recentCount: i, tentCount: c } = st(), d = [.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(n)])], l = (k) => Math.max((e[k] || {}).la || 0, (n[k] || {}).la || 0), r = d.map((k) => [k, e[k], n[k]]).sort((k, g) => l(g[0]) - l(k[0]));
      f.ptitle.textContent = `\u58F2\u5207\u308C\u8A18\u9332\u3000\u76F4\u8FD190\u65E5 ${i}\u53F0\uFF08\u78BA\u8A8D\u4E2D${c}\uFF09\u30FB\u5546\u54C1 ${r.length}\u7A2E\u985E`;
      const p = document.createElement("div");
      p.className = "ctl";
      const m = document.createElement("input");
      m.type = "search", m.placeholder = "\u5546\u54C1\u540D\u3067\u3057\u307C\u308B", m.value = t || "";
      const u = document.createElement("button");
      u.type = "button", u.className = "sub", u.textContent = "\u66F8\u304D\u51FA\u3057\uFF081\u53F0\u3054\u3068\uFF09", u.onclick = Zn;
      const a = document.createElement("button");
      a.type = "button", a.className = "sub", a.textContent = "\u66F8\u304D\u51FA\u3057\uFF08\u5546\u54C1\u307E\u3068\u3081\uFF09", a.onclick = Qn;
      // 4.10.131：全データ（今の検索で記録している商品の全件）を CSV で書き出す。読むだけ
      const xAll = document.createElement("button");
      xAll.type = "button", xAll.className = "sub", xAll.textContent = "書き出し（全データ）", xAll.onclick = exportAll, p.append(m, u, a, xAll);
      const h = document.createElement("div");
      h.className = "note", h.textContent = "\u4E00\u89A7\u3067 SOLD OUT \u306B\u306A\u3063\u305F\u5546\u54C1\u3068\u3001\u8A73\u7D30\u30DA\u30FC\u30B8\u3067\u5B8C\u58F2\u306B\u306A\u3063\u305F\u53F0\u3001\u5728\u5EAB\u304C\u6E1B\u3063\u3066\u6700\u5B89\u5024\u304C\u4E0A\u304C\u3063\u305F\u5546\u54C1\uFF08\u4E00\u756A\u5B89\u3044\u53F0\u304C\u58F2\u308C\u305F\uFF09\u3092\u8A18\u9332\u3057\u307E\u3059\u3002\u30AB\u30FC\u30C8\u306B\u5165\u3063\u3066\u3044\u308B\u9593\u3082 SOLD OUT \u306B\u306A\u308B\u306E\u3067\u3001\u6700\u521D\u306F\u300C\u78BA\u8A8D\u4E2D\u300D\u3067\u3059\u3002SOLD OUT \u306E\u307E\u307E\u691C\u7D22\u7D50\u679C\u304B\u3089\u6D88\u3048\u305F\u3089\u78BA\u5B9A\u3001\u6B21\u306E\u8868\u793A\u30EA\u30BB\u30C3\u30C8\uFF0814:33\u30FB20:33\uFF09\u307E\u3067\u623B\u3089\u306A\u3051\u308C\u3070\u3044\u3063\u305F\u3093\u78BA\u5B9A\u3057\u307E\u3059\u3002SOLD OUT \u3092\u898B\u3064\u3051\u3066\u304B\u30893\u65E5\u306E\u3046\u3061\u306B\u623B\u3063\u3066\u304D\u305F\u3089\u300C\u623B\u308A\u300D\u3068\u3057\u3066\u58F2\u308C\u305F\u56DE\u6570\u304B\u3089\u5916\u3057\u307E\u3059\uFF08ITMCODE \u306E\u5546\u54C1\u306F\u540C\u3058\u6700\u5B89\u5024\u3067\u623B\u3063\u305F\u3068\u304D\u3060\u3051\uFF09\u30021\u53F0\u3054\u3068\u306E\u8A18\u9332\u306F90\u65E5\u6B8B\u3057\u3001\u305D\u308C\u3088\u308A\u524D\u306F\u5546\u54C1\u3054\u3068\u306E\u307E\u3068\u3081\uFF08\u56DE\u6570\u30FB\u6700\u5B89\u301C\u6700\u9AD8\u30FB\u76F4\u8FD1\u306E\u4FA1\u683C\uFF09\u3060\u3051\u6B8B\u3057\u307E\u3059\u3002\u300C\u58F2\u308C\u308B\u307E\u3067\u300D\u306F NEW\u30FB\u518D\u5165\u8377\u306E\u5370\u304C\u4ED8\u3044\u3066\u304B\u3089\u58F2\u5207\u308C\u3092\u78BA\u8A8D\u3059\u308B\u307E\u3067\u306E\u76EE\u5B89\u3067\u3059\u3002";
      const b = document.createElement("div"), C = () => {
        const k = z(m.value), g = r.filter(([y, v, S]) => !k || z((v || S).n).toLowerCase().includes(k.toLowerCase())), O = g.slice(0, Wt).map(([y, v, S]) => {
          const j = document.createElement("details");
          j.className = "grp";
          const X = document.createElement("summary"), Gt = document.createElement("div");
          Gt.className = "gn", Gt.textContent = (v || S).n + ((v || S).itm && (v || S).itm.length ? "　ITMCODE " + (v || S).itm.join(" / ") : "");
          const Yt = document.createElement("div");
          Yt.className = "gs";
          const Ue = v ? Object.entries(v.rk).sort().map(([Z, [x, B, Ot]]) => `\u30E9\u30F3\u30AF${Z} ${x}\u56DE ${B === Ot ? A(B) : A(B) + "\u301C" + A(Ot)}`).join("\uFF0F") : "";
          Yt.textContent = [v && v.c ? [`\u58F2\u5207\u308C ${v.c}\u56DE`, it(v), v.lp != null ? `\u76F4\u8FD1 ${A(v.lp)}\uFF08${mt(v.la)}\uFF09` : `\u76F4\u8FD1 ${mt(v.la)}`, he(v)].filter(Boolean).join("\u30FB") : "", S ? `\u78BA\u8A8D\u4E2D ${S.c}\u56DE\uFF08${it(S)}\uFF09` : "", v && v.rt ? `\u30AB\u30FC\u30C8\u30FB\u5728\u5EAB\u79FB\u52D5\u304B\u3089\u623B\u308A ${v.rt}\u56DE` : ""].filter(Boolean).join("\u30FB") + (Ue ? `\u3000${Ue}` : ""), X.append(Gt, Yt), j.append(X);
          const ze = () => {
            if (j.dataset.filled) return;
            j.dataset.filled = "1";
            for (const x of (s[y] || []).slice().reverse()) {
              const B = document.createElement("div");
              B.className = "srow";
              const Ot = x.rm ? `\u30FB${T(x.rm)} \u691C\u7D22\u7D50\u679C\u304B\u3089\u6D88\u3048\u305F\uFF08\u767A\u9001\u306A\u3069\u3067\u78BA\u5B9A\uFF09` : x.sure ? "\u30FB\u5B8C\u58F2\u306E\u8868\u793A\u3067\u78BA\u5B9A" : x.nego && x.tent ? `\u30FB${T(x.nego)} \u5546\u8AC7\u4E2D\uFF08\u30AB\u30FC\u30C8\uFF09\u3092\u78BA\u8A8D` : "", so = [x.ret ? `${T(x.s)} SOLD OUT \u2192 ${T(x.ret)} \u623B\u308A\uFF08\u30AB\u30FC\u30C8\u30FB\u5728\u5EAB\u79FB\u52D5\u3002\u58F2\u308C\u305F\u56DE\u6570\u306B\u306F\u5165\u308C\u306A\u3044\uFF09` : `${T(x.s)} \u58F2\u5207\u308C\u3092\u78BA\u8A8D${Ot}${x.tent ? `\uFF08\u78BA\u8A8D\u4E2D\uFF1A${T(_t(x))}\u306E\u8868\u793A\u30EA\u30BB\u30C3\u30C8\u307E\u3067\u623B\u3089\u306A\u3051\u308C\u3070\u78BA\u5B9A\uFF09` : x.slot ? `\u30FB${T(x.slot)}\u306E\u8868\u793A\u30EA\u30BB\u30C3\u30C8\u3067\u78BA\u5B9A${V(x) ? `\uFF08${mt(x.s + gt)}\u307E\u3067\u306B\u623B\u308C\u3070\u300C\u623B\u308A\u300D\u306B\u76F4\u3059\uFF09` : ""}` : ""}`, x.p != null ? `${x.c} ${A(x.p)}` : "\u4FA1\u683C\u4E0D\u660E", x.p0 != null && x.p0 !== x.p ? `\uFF08\u521D\u3081 ${A(x.p0)}\uFF09` : "", x.pt ? `\u4E00\u90E8\u58F2\u308C\uFF08\u5728\u5EAB${x.st}\u2192${x.st2}\u30FB\u4E00\u756A\u5B89\u3044\u53F0\uFF09` : x.st != null ? `\u5728\u5EAB${x.st}` : "", x.r ? `\u30E9\u30F3\u30AF${x.r}` : "", x.sh || "", x.d != null ? `\u58F2\u308C\u308B\u307E\u3067\u7D04${Math.max(0.1, x.d)}\u65E5` : ""];
              if (B.textContent = so.filter(Boolean).join("\u30FB") + "\u3000", x.u) {
                const $t = document.createElement("a");
                $t.href = x.u, $t.className = "jp3-noopen", $t.textContent = "\u5546\u54C1\u30DA\u30FC\u30B8", B.append($t);
              }
              j.append(B);
            }
            const Z = o[y];
            if (Z && Z.c) {
              const x = document.createElement("div");
              x.className = "srow", x.textContent = `90\u65E5\u3088\u308A\u524D\uFF1A\u58F2\u5207\u308C ${Z.c}\u56DE\u30FB${it(Z)}`, j.append(x);
            }
          };
          return j.addEventListener("toggle", () => {
            j.open && ze();
          }), j._fill = ze, j;
        });
        if (!O.length) {
          const y = document.createElement("div");
          y.className = "empty", y.textContent = r.length ? "\u4E00\u81F4\u3059\u308B\u5546\u54C1\u306F\u3042\u308A\u307E\u305B\u3093" : "\u307E\u3060\u58F2\u5207\u308C\u306E\u8A18\u9332\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u5728\u5EAB\u3042\u308A\u3067\u898B\u3066\u3044\u305F\u5546\u54C1\u304C SOLD OUT \u306B\u306A\u308B\u3068\u8A18\u9332\u3055\u308C\u307E\u3059", O.push(y);
        }
        if (g.length > Wt) {
          const y = document.createElement("div");
          y.className = "note", y.textContent = `\u307B\u304B ${g.length - Wt}\u7A2E\u985E\uFF08\u5546\u54C1\u540D\u3067\u3057\u307C\u308B\u3068\u51FA\u307E\u3059\uFF09`, O.push(y);
        }
        if (b.replaceChildren(...O), k && g.length === 1) {
          const y = b.querySelector("details");
          y._fill(), y.open = true;
        }
      };
      m.oninput = C, C(), f.pbody.replaceChildren(p, h, b), Kt("sold");
    }
    function De(t, e) {
      const n = (i) => {
        const c = i == null ? "" : String(i);
        return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }, o = "\uFEFF" + e.map((i) => i.map(n).join(",")).join(`\r
`), s = document.createElement("a");
      s.href = URL.createObjectURL(new Blob([o], { type: "text/csv" })), s.download = t, document.body.appendChild(s), s.click(), s.remove(), setTimeout(() => URL.revokeObjectURL(s.href), 1e4);
    }
    const Be = () => {
      const t = new Date(w()), e = (n) => String(n).padStart(2, "0");
      return `${t.getFullYear()}${e(t.getMonth() + 1)}${e(t.getDate())}`;
    };
    function Zn() {
      const t = [["\u58F2\u5207\u308C\u3092\u78BA\u8A8D\u3057\u305F\u65E5\u6642", "\u6700\u5F8C\u306B\u5728\u5EAB\u3042\u308A\u3067\u898B\u305F\u65E5\u6642", "NEW\u30FB\u518D\u5165\u8377\u306E\u5370\u304C\u4ED8\u3044\u305F\u65E5\u6642", "\u58F2\u308C\u308B\u307E\u3067\u306E\u65E5\u6570\uFF08\u76EE\u5B89\uFF09", "\u5546\u54C1\u540D", "ITMCODE", "SRCODE", "\u72B6\u614B", "\u58F2\u308C\u65B9", "\u533A\u5206", "\u58F2\u5207\u308C\u524D\u306E\u4FA1\u683C", "\u521D\u3081\u3066\u898B\u305F\u3068\u304D\u306E\u4FA1\u683C", "\u5728\u5EAB\u6570", "\u30E9\u30F3\u30AF", "\u5E97\u8217", "\u5546\u54C1\u30DA\u30FC\u30B8"]];
      for (const e of ae().sort((n, o) => o.s - n.s)) t.push([ht(e.s), ht(e.l), ht(e.la), e.d, e.n, e.itm, e.sr, e.ret ? "\u623B\u308A\uFF08\u30AB\u30FC\u30C8\u30FB\u5728\u5EAB\u79FB\u52D5\uFF09" : e.tent ? e.nego ? "\u78BA\u8A8D\u4E2D\uFF08\u5546\u8AC7\u4E2D\u3092\u78BA\u8A8D\uFF09" : "\u78BA\u8A8D\u4E2D" : e.rm ? "\u78BA\u5B9A\uFF08\u691C\u7D22\u7D50\u679C\u304B\u3089\u6D88\u3048\u305F\uFF09" : e.sure ? "\u78BA\u5B9A\uFF08\u5B8C\u58F2\u306E\u8868\u793A\uFF09" : "\u78BA\u5B9A\uFF08\u8868\u793A\u30EA\u30BB\u30C3\u30C8\u307E\u3067\u58F2\u308C\u305F\u307E\u307E\uFF09", e.pt ? `\u4E00\u90E8\uFF08\u5728\u5EAB${e.st}\u2192${e.st2}\u30FB\u4E00\u756A\u5B89\u3044\u53F0\uFF09` : "\u5168\u90E8\u58F2\u5207\u308C", e.c, e.p, e.p0, e.st, e.r, e.sh, e.u ? new URL(e.u, location.origin).href : ""]);
      De(`janpara-sold-units-${Be()}.csv`, t);
    }
    function Qn() {
      const t = [["\u5546\u54C1\u540D", "ITMCODE", "\u58F2\u5207\u308C\u56DE\u6570\uFF08\u78BA\u5B9A\uFF09", "\u6700\u5B89", "\u6700\u9AD8", "\u76F4\u8FD1\u306E\u4FA1\u683C", "\u76F4\u8FD1\u306E\u58F2\u5207\u308C", "\u58F2\u308C\u308B\u307E\u3067\u306E\u5E73\u5747\u65E5\u6570", "\u65E5\u6570\u304C\u5206\u304B\u3063\u305F\u500B\u6570", "\u30E9\u30F3\u30AF\u5225", "\u78BA\u8A8D\u4E2D\u306E\u56DE\u6570", "\u78BA\u8A8D\u4E2D\u306E\u4FA1\u683C", "\u30AB\u30FC\u30C8\u30FB\u5728\u5EAB\u79FB\u52D5\u304B\u3089\u623B\u3063\u305F\u56DE\u6570"]], { sum: e, tent: n } = st(), o = [.../* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(n)])].sort((s, i) => Math.max((e[i] || {}).la || 0, (n[i] || {}).la || 0) - Math.max((e[s] || {}).la || 0, (n[s] || {}).la || 0));
      for (const s of o) {
        const i = e[s] || { n: n[s].n, itm: [], c: 0, rk: {}, dn: 0 }, c = n[s];
        t.push([i.n, [.../* @__PURE__ */ new Set([...i.itm || [], ...c ? c.itm : []])].join(" "), i.c, i.lo, i.hi, i.lp, ht(i.la), i.dn ? Math.round(i.ds / i.dn * 10) / 10 : "", i.dn, Object.entries(i.rk).sort().map(([d, [l, r, p]]) => `${d}:${l}\u56DE ${r}-${p}`).join(" "), c ? c.c : 0, c ? c.lo === c.hi ? c.lo : `${c.lo}-${c.hi}` : "", i.rt || 0]);
      }
      De(`janpara-sold-summary-${Be()}.csv`, t);
    }
    // 4.10.131：今の検索で記録している商品を全件、CSV で書き出す（1商品×状態で1行。読むだけ。通信も記録の書き換えもしない）
    function exportAll() {
      const r = E(I(D(location.href)), null), rows = [["商品名", "状態", "価格", "在庫か売切れか", "在庫数", "売切れた時刻", "最初に見た時刻", "最後に見た時刻", "商品ページ", "商品のID"]];
      const items = Object.entries((r && r.items) || {}).filter(([, x]) => x).sort(([, a], [, b]) => (b.lastSeen || 0) - (a.lastSeen || 0));
      for (const [id, x] of items) {
        const tail = [x.soldOut ? "売切れ" : "在庫", x.stock, ht(x.soldAt), ht(x.firstSeen), ht(x.lastSeen), x.url, id], prices = Object.entries((x.soldOut && x.live ? x.live.prices : x.prices) || {});
        if (!prices.length) rows.push([x.name, "", "", ...tail]);
        for (const [cond, price] of prices) rows.push([x.name, cond, price, ...tail]);
      }
      De(`janpara-all-items-${Be()}.csv`, rows);
    }
    const Ke = () => window.scrollY < 10;
    function Vt() {
      f.jump && (f.jump.textContent = Ke() ? "\u25BC \u4E0B\u3078" : "\u25B2 \u4E0A\u3078");
    }
    function Vq() {
      const t = rtR(), e = w(), n = [...document.querySelectorAll("a.search_itemlink")].filter((i) => {
        const c = et(i.href);
        return _e(Oe[c], c, t, e);
      });
      if (!n.length) {
        Y("前の印の付いた商品はこのページにありません");
        return;
      }
      const o = dt && dt.isConnected ? dt.getBoundingClientRect() : null;
      const k = o && o.bottom > 140 && o.top < window.innerHeight ? n.indexOf(dt) : -1;
      let s;
      if (k > 0) s = n[k - 1];
      else s = [...n].reverse().find((i) => i.getBoundingClientRect().top < 140) || n[n.length - 1];
      dt = s, $e = e + 1500, f.markpos.textContent = (n.indexOf(s) + 1) + "/" + n.length, s.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // 先頭・末尾へは、既読の判定をやり直す（飛び越えた商品の既読は変えない）
    function goEdge(bottom) {
      window.scrollTo({ top: bottom ? document.documentElement.scrollHeight : 0, behavior: "auto" }), P = null, H = -1, F = 0;
    }
    function to() {
      window.scrollTo({ top: Ke() ? document.documentElement.scrollHeight : 0, behavior: "auto" }), P = null, H = -1, F = 0, Vt();
    }
    function eo() {
      const t = Bt();
      for (const n of lt) t[n] = 1;
      const e = [...document.querySelectorAll("a.search_itemlink")].find((n) => {
        const o = et(n.href);
        return !(o && t[o]);
      });
      if (!e) {
        Y("\u3053\u306E\u30DA\u30FC\u30B8\u306F\u5168\u90E8\u898B\u307E\u3057\u305F");
        return;
      }
      e.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function no() {
      const t = E(I(D(location.href)), null), e = { version: Jt, exportedAt: new Date(w()).toISOString(), log: t ? t.log : [], ref: t && t.ref ? { at: t.ref.at } : null, known: t ? Object.keys(t.items).length : 0 }, n = document.createElement("a");
      n.href = URL.createObjectURL(new Blob([JSON.stringify(e, null, 2)], { type: "application/json" })), n.download = "jp-rush-3-log.json", n.click();
    }
    document.addEventListener("click", (t) => {
      if (t.target instanceof Element && t.target.closest(".jp3-noopen")) return;
      const e = t.target instanceof Element ? t.target.closest("a.search_itemlink") : null;
      e && (yt(M(e.href)), ye(M(e.href)), setTimeout(at, 0));
    }, true);
    // 4.10.198：カート画面の左右の空きに、検索画面と同じ形の欄を出す（左＝カートの中身、右＝カートツール）。幅が足りない時は出さない（今までのボタンのまま）
    // 読むのはカートの中身と、もう読んである lastlive（一覧で最後に見た価格）だけ。残り時間は1秒ごとに書き換えるだけ
    function openSearchPanel() {
      if (!f.banner) { Fn(); f.bar && (f.bar.style.display = "none"); f.rail && (f.rail.style.display = "none"); document.body.style.paddingBottom = ""; }
    }
    const mmss = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
    // 4.10.199：カートの「期限切れのため削除されました」の商品。表示が済んでから1件ずつ商品ページを読んで、在庫あり／完売を判定する
    // 4.10.201：商品ページを見えない枠で開き、表示が済んだ後の文字を取る（カートの「AI用にコピー」と同じ開き方）
    function framePageText(u) {
      return new Promise((res) => {
        const f = document.createElement("iframe");
        let fin = false, tm = 0, poll = 0, seenAt = 0;
        const end = (v) => {
          if (fin) return;
          // 4.10.347：完売チェック・見張り・在庫確認で読んだ商品ページの状態も台帳へ
          try { const sr = srOf(u), d = f.contentDocument; if (sr && d && d.body && !/アクセス集中/.test(v && v.text || "")) { let P = null; try { P = kn(v.text || ""); } catch (e) {} lgCond(sr, detailUnit(d, sr), P && P.units.find((x) => String(x.code) === sr)); } } catch (e) {}
          fin = true, clearTimeout(tm), clearInterval(poll), f.remove(), res(v);
        };
        const read = () => { try { const d = f.contentDocument; return d && d.body && /^https?:/.test(d.URL) ? Sn(d.body) : ""; } catch (e) { return ""; } };
        // 4.10.355：待っている間は文字だけ軽く見る（見た目を調べて読むのは最後の1回だけ。毎回やると画面が固まることがあった）
        const peek = () => { try { const d = f.contentDocument; return d && d.body && /^https?:/.test(d.URL) ? d.body.textContent || "" : ""; } catch (e) { return ""; } };
        poll = setInterval(() => {
          const t = peek();
          if (/アクセス集中/.test(t)) return end({ text: read() });
          // 在庫の欄が出てから少し待つ（後から書き込まれる分を待つ）
          if (/条件に一致する在庫|商品番号\s*[：:]/.test(t)) { seenAt || (seenAt = Date.now()); Date.now() - seenAt > 1200 && end({ text: read() }); }
        }, 300);
        tm = setTimeout(() => end({ text: read() }), 2e4);
        f.name = FETCH_NAME, f.tabIndex = -1, f.setAttribute("aria-hidden", "true");
        f.style.cssText = "position:fixed;left:-10000px;top:0;width:1024px;height:900px;border:0;opacity:0;pointer-events:none;";
        f.setAttribute("sandbox", "allow-same-origin");   // 4.10.351：商品ページの中のプログラム（広告・分割払いの案内など）は動かさない。判定に使う所はページの元の文章で同じ（実物で確認）。1件 5〜6秒 → 2秒ほど
        f.src = u;
        document.body.appendChild(f);
      });
    }
    // その台（商品番号）の欄で判定する。無ければページ全体の「条件に一致する在庫：N点」「品切れ」
    function judgeUnit(t, sr) {
      if (/アクセス集中/.test(t)) return { k: "busy" };
      let P = null;
      try { P = kn(t); } catch (e) { P = null; }
      const u = P && sr ? P.units.find((x) => String(x.code) === String(sr)) : null, num = (v) => Number(String(v || "").replace(/[^\d]/g, "")) || 0;
      // 4.10.202：その台の欄に金額が無ければ、「商品番号：〜」のすぐ後の金額
      const near = () => { if (!sr) return 0; const p = String(t).replace(/\s+/g, " "), i = p.search(new RegExp("商品番号\\s*[：:]\\s*" + sr + "(?!\\d)")); const m = i >= 0 ? /[¥￥]\s?([\d,]+)/.exec(p.slice(i, i + 200)) : null; return m ? num(m[1]) : 0; };
      if (u) return u.nego ? { k: "nego", why: "その台の欄に商談中" } : u.sold ? { k: "sold", why: "その台の欄に完売" } : { k: "stock", why: "その台の欄", price: num(u.price) || near() };
      if (P && P.outOfStock) return { k: "sold", why: P.count === 0 ? "在庫0点の表示" : "品切れの表示" };
      if (P && P.count > 0) return { k: "stock", why: `在庫${P.count}点の表示`, price: P.units[0] ? num(P.units[0].price) : 0 };
      return { k: "?" };
    }
    // 4.10.341：おすすめ・広告の枠の中のリンクは期限切れの商品として数えない
    const notRecommend = (a) => !a.closest('.recommend,[class*="recommend"],[id*="recommend"],[class*="osusume"],[class*="swiper"],[class*="slick"],[class*="carousel"]');
    function cartExpiredLinks() {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let mark = null, total = null;
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (n.parentElement && n.parentElement.closest("#jp3-cart,#jp3-host,.jprush-cartbar")) continue;
        !mark && /期限切れ/.test(n.nodeValue) && (mark = n);
        mark && !total && /総合計/.test(n.nodeValue) && (total = n);
      }
      if (!mark) return [];
      const out = [], seen = new Set();
      for (const a of document.querySelectorAll('a[href*="/sale/search/detail"]')) {
        if (!(mark.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (total && !(a.compareDocumentPosition(total) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        if (!notRecommend(a)) continue;
        const href = a.getAttribute("href") || "", s = (/[?&]SRCODE=(\d+)/.exec(href) || [])[1], i = (/[?&]ITMCODE=(\d+)/.exec(href) || [])[1], id = s ? "S" + s : i ? "I" + i : "";
        if (!id || seen.has(id)) continue;
        seen.add(id), out.push({ id, sr: s || "", itm: i || "", name: N(a.textContent), url: a.href, a });
      }
      return out;
    }
    function cartTools(cr) {
      // 4.10.211：カートが空でも、期限切れで消えた商品があれば欄を出す
      if (!cr || !(cr.ok || cr.empty) || document.getElementById("jp3-cart")) return false;   // 4.10.319：カートが空でも左右の欄（カート履歴）を出す
      const h = cartHead();
      if (!h) return false;
      const hr = h.getBoundingClientRect(), L = Math.floor(hr.left - 24), R = Math.floor(window.innerWidth - hr.right - 20);
      if (L < 230 || R - 4 < 92) return false;
      const P = cartParse(), codes = (E("cart", { codes: {} }) || {}).codes || {}, last = Er("lastlive", {}) || {}, now0 = w();
      const host = document.createElement("div");
      host.id = "jp3-cart", host.style.cssText = "position:static";
      document.body.appendChild(host);
      const sr = host.attachShadow({ mode: "open" });
      sr.innerHTML = `<style>
        :host { all: initial; }
        * { box-sizing: border-box; font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", "Meiryo", sans-serif; }
        .col { position: fixed; z-index: 2147482000; display: flex; flex-direction: column; background: #fff; border: 1px solid #cacaca; border-top: 0; overflow: hidden; }
        .hd { flex: none; height: 38px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 12px; background: #003792; color: #fff; font-weight: 800; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .left .hd { justify-content: flex-start; }
        .bd { flex: 1; overflow: auto; padding: 8px; }
        .box { border: 1px solid #dfe4ea; padding: 6px 8px; margin-bottom: 8px; }
        .kv { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; column-gap: 6px; padding: 2px 0; font-size: 12px; color: #4a5a6e; font-weight: 700; }
        .kv span, .kv b { white-space: nowrap; }
        .kv b { margin-left: auto; font-size: 15px; color: #1f2d3d; }
        .left0 { text-align: center; font-size: 12px; color: #4a5a6e; font-weight: 700; margin-top: 6px; }
        .cd { text-align: center; font-size: 26px; font-weight: 900; color: #003792; letter-spacing: .5px; }
        .cd.warn { color: #c8102e; }
        .clk { text-align: center; font-size: 20px; font-weight: 800; color: #1f2d3d; letter-spacing: .5px; font-variant-numeric: tabular-nums; padding: 2px 0 8px; }
        .btn { display: block; width: 100%; margin: 0 0 6px; padding: 9px 6px; border: 1px solid #cdd6e4; border-radius: 0; background: #eef2f8; color: #003792; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; white-space: pre-line; }
        .gh { font-size: 12px; color: #5f6b7a; font-weight: 700; margin: 10px 0 4px; }
        .st { margin: 0 0 10px; border: 1px solid #dfe4ea; }
        .sth { padding: 6px 8px; background: #f3f6fa; font-weight: 800; font-size: 13px; color: #1f2d3d; }
        .it { display: block; padding: 8px; border-top: 1px solid #edf0f4; text-decoration: none; color: #333; }
        .it .nm { font-size: 14px; font-weight: 700; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .it .pr { font-size: 18px; font-weight: 800; color: #F31515; }
        .it .sub { font-size: 12px; color: #4a5a6e; margin-top: 2px; }
        .it .sub .dn { color: #1d7a45; font-weight: 700; }
        .it .sub .up { color: #c8102e; font-weight: 700; }
        .it .rm { float: right; font-size: 13px; font-weight: 800; color: #003792; }
        .it .rm.warn { color: #c8102e; }
        .stf { display: flex; justify-content: space-between; padding: 6px 8px; border-top: 1px solid #edf0f4; font-size: 13px; color: #33435a; font-weight: 700; }
        .note { font-size: 11px; color: #5f6b7a; line-height: 1.5; margin-top: 8px; }
        .col.off { display: none !important; }
        .tl { margin-bottom: 10px; border: 1px solid #dfe4ea; }
        .tr { display: flex; gap: 10px; align-items: center; padding: 8px; border-top: 1px solid #edf0f4; text-decoration: none; color: #333; }
        .tr:first-child { border-top: 0; }
        .tcl { flex: none; width: 92px; }
        .tcd { font-size: 26px; font-weight: 900; line-height: 1.1; letter-spacing: .5px; color: #003792; font-variant-numeric: tabular-nums; }
        .tbar { height: 5px; margin-top: 4px; background: #e6eaf0; overflow: hidden; }
        .tfill { height: 100%; background: #003792; }
        .tr[data-st="amber"] .tcd { color: #c96a00; } .tr[data-st="amber"] .tfill { background: #e08a00; }
        .tr[data-st="red"] .tcd { color: #c8102e; } .tr[data-st="red"] .tfill { background: #c8102e; }
        .tr[data-st="gone"] { opacity: .55; } .tr[data-st="gone"] .tcd { font-size: 16px; color: #6b7280; }
        .tinfo { flex: 1; min-width: 0; }
        .tinfo .nm { font-size: 14px; font-weight: 700; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .tinfo .sub { font-size: 12px; color: #4a5a6e; margin-top: 2px; }
        .tsubrow { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
        .tsubrow .sub { flex: 1; min-width: 0; margin-top: 0; }
        .tacts { flex: none; display: flex; gap: 6px; }
        .tacts button { padding: 6px 16px; min-height: 34px; font-size: 14px !important; border: 1px solid #cdd6e4; border-radius: 0; background: #eef2f8; color: #003792; font: 700 13px/1.5 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif; cursor: pointer; }
        .tacts button:disabled { opacity: .5; cursor: default; }
        .tinfo .sub .dn { color: #1d7a45; font-weight: 700; } .tinfo .sub .up { color: #c8102e; font-weight: 700; }
        .it.ex { display: block; }
        .it.ex .nm { color: #003792; text-decoration: underline; text-underline-offset: 2px; font-size: 13px; }
        .it.ex.sold .nm { color: #6b7280; }
        .it.ex .act { margin-top: 4px; }
        .it.ex .act:empty { display: none; }
        .btn.mini { width: auto; margin: 6px 8px 8px; padding: 6px 10px; font-size: 13px; }
      </style>
      <div class="col left" id="L"><div class="hd" id="lh"></div><div class="bd" id="lb"></div></div>
      <div class="col right" id="R"><div class="hd">カートツール</div><div class="bd" id="rb"></div></div>`;
      const $$ = (id) => sr.getElementById(id), el = (tag, cls, txt) => { const e = document.createElement(tag); cls && (e.className = cls); txt != null && (e.textContent = txt); return e; };
      const price = (it) => (it.amts.length ? it.amts[it.amts.length - 1] : null);
      const endOf = (it) => { const fs = codes[it.code] && codes[it.code].firstSeen; return (fs || now0) + CART_HOLD; };
      // 4.10.208：左は残り時間を中心に（先に消える順に1列。店舗ごとのまとめ・送料・合計は真ん中のカートと同じなので出さない）
      const hl = histList();
      $$("lh").textContent = `カート履歴 ${hl.length}件`;   // 4.10.311：左は残り時間をやめてカート履歴
      const lb = $$("lb"), rms = [], tl = el("div", "tl");
      for (const it of [...P.items].sort((a, b) => endOf(a) - endOf(b))) {
        const a = el("a", "tr"), lft = el("div", "tcl"), cd0 = el("div", "tcd"), bar = el("div", "tbar"), fill = el("div", "tfill"), rt = el("div", "tinfo");
        a.href = it.url, bar.append(fill), lft.append(cd0, bar);
        const p = price(it), L0 = last["S" + it.code], l0 = L0 && Object.entries(L0.prices || {})[0], lp = l0 ? Number(String(l0[1]).replace(/[^\d]/g, "")) : null;
        const sub = el("div", "sub", [p != null ? A(p) : "価格不明", it.store].filter(Boolean).join("・"));
        if (lp && p != null && lp !== p) sub.append(" ", el("span", p < lp ? "dn" : "up", `一覧より${p < lp ? "−" : "+"}${A(Math.abs(p - lp))}`));
        // 4.10.230：各行に「削除」「カート」（真ん中のじゃんぱらの「削除」／JP RUSH の「カート」を押したのと同じ。行の移動はしない）
        const acts = el("div", "tacts"), bDel = el("button", "", "削除"), bAdd = el("button", "", "再カート");
        bDel.type = bAdd.type = "button";
        const doIt = (btn, find, lab) => (ev) => {
          ev.preventDefault(), ev.stopPropagation();
          const t = find();
          if (!t) { btn.textContent = "見つかりません", setTimeout(() => { btn.textContent = lab; }, 3000); return; }
          t.click();
        };
        bDel.addEventListener("click", doIt(bDel, () => document.querySelector(`[data-jprush-del="${it.code}"]`), "削除"));
        bAdd.addEventListener("click", doIt(bAdd, () => document.querySelector(`.jprush-readd[data-code="${it.code}"] > *`), "再カート"));
        acts.append(bAdd);   // 4.10.301：左は「再カート」だけ（削除は再カートの中で行う）
        // 4.10.231：ボタンは価格・店名の行の右端（行を増やさない）
        const srow = el("div", "tsubrow");
        srow.append(sub, acts), rt.append(el("div", "nm", it.name), srow), a.append(lft, rt), tl.append(a);
        rms.push({ code: it.code, row: a, cd: cd0, fill, end: endOf(it) });
      }
      try { const { nt, box } = histBody(hl); nt.style.padding = "0 2px 8px", box.style.border = "1px solid #dfe4ea", lb.append(nt, box), histRestore(box); } catch (e) {}
      // 4.10.199：期限切れで消えた商品
      expiredOverlay();   // 4.10.240：期限切れの一覧への表示は別の関数に（スマホでも使う）
      // 右：カートツール
      const rb = $$("rb"), sum = el("div", "box"), ship = P.stores.reduce((t, s) => t + (s.ship || 0), 0);
      const kv = (k, v) => { const d = el("div", "kv"); d.append(el("span", "", k), el("b", "", v)); return d; };
      const clk = el("div", "clk");   // 4.10.307：秒まで出る時計（右の欄のいちばん上）。点数は赤
      const kvN = kv("点数", `${P.items.length}点`); kvN.querySelector("b").style.color = "#c8102e";
      sum.append(kvN, kv("店舗", `${P.stores.length}店舗`), kv("送料", A(ship)), kv("総合計", P.grand != null ? A(P.grand) : "－"));
      const cdBox = el("div", "box"), cdl = el("div", "left0", "消えるまで（目安）"), cd = el("div", "cd");
      // 4.10.312：消える時刻と［今すぐ再カート］（最初に消える商品と、その1分以内に消える商品をまとめて再カート）
      const cdAt = el("div", "left0"), nowB = el("button", "btn");
      cdAt.style.marginTop = "0", nowB.type = "button", nowB.style.cssText = "margin:0;font-size:12px;padding:8px 2px;white-space:pre;line-height:1.35;";
      cdBox.append(cdl, cd, cdAt);
      let first = P.items.length ? Math.min(...P.items.map(endOf)) : 0;
      nowB.onclick = (ev) => {
        ev.preventDefault();
        if (nowB.dataset.busy || !first) return;
        const tg = P.items.map((it) => document.querySelector(`.jprush-readd[data-code="${it.code}"] > *`)).filter(Boolean);
        if (!tg.length) { nowB.textContent = "見つかりません"; return; }
        nowB.dataset.busy = "1", nowB.textContent = "送信中…", bulkReadd(tg);
      };
      const cp = el("button", "btn", "AI用にコピー"), so = el("button", "btn", "完売記録"), wl = el("button", "btn", `要注意 ${watchCount()}件`), anchor = el("div");
      cp.type = so.type = wl.type = "button";
      cp.onclick = () => { const b = document.querySelector(".jprush-cartcopy"); b ? b.click() : (cp.textContent = "コピーできません"); };
      so.onclick = () => { openSearchPanel(); (SOLDREADY ? Promise.resolve() : preload(SOLDKEYS).then(() => { SOLDREADY = !!window.indexedDB; })).then(() => ve("sold", () => Ie(""))); };
      wl.onclick = () => { openSearchPanel(); ve("watch", watchPanel); };
      rb.append(clk, sum, cdBox, el("div", "gh", "機能"), anchor);   // 4.10.306：AI用にコピーは見出しのコピーと同じなので外す   // 4.10.303：完売記録・要注意はカート画面からは外す
      try { handoffBox(rb, "btn"); } catch (e) {}
      // 4.10.313：［今すぐ再カート］はカートの全部が対象。「機能」の［自動再カート］のすぐ下
      try { const hx = rb.querySelector(".jprush-handoff"), arRow = hx && [...hx.children].find((x) => /自動再カート/.test(x.textContent) && x.tagName === "DIV"); arRow ? arRow.after(nowB) : rb.append(nowB); } catch (e) {}
      rb.append(el("div", "note", "v" + Jt));   // 4.10.303：説明文は外す
      const tick = () => {
        const t = w();
        if (P.items.length) first = Math.min(...P.items.map((it) => LIVE_END[it.code] || endOf(it)));   // 4.10.394：開き直さなくても入れ直した時刻を反映
        clk.textContent = new Date(t).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        cd.textContent = first ? mmss(first - t) : "－", cd.classList.toggle("warn", !!first && first - t < 6e5);
        cdAt.textContent = first ? new Date(first).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) + " まで" : "";
        if (!nowB.dataset.busy) nowB.textContent = "今すぐ再カート", nowB.hidden = !P.items.length;
        for (const x of rms) {
          const left = (LIVE_END[x.code] || x.end) - t, st = left <= 0 ? "gone" : left < 6e5 ? "red" : left < 18e5 ? "amber" : "ok";
          x.cd.textContent = left <= 0 ? "期限切れ" : mmss(left), x.fill.style.width = Math.max(0, Math.min(100, left / CART_HOLD * 100)) + "%", x.row.dataset.st = st;
        }
      };
      const place = () => {
        // 4.10.203：上端は「通信販売 ORDER」の帯にそろえる。画面の端・カートとの間は左右とも同じ余白
        const G = 12, ob = cartOrderBar(), vis = (e) => e && e.getClientRects().length && getComputedStyle(e).display !== "none" ? e : null;
        // 4.10.204：上に貼り付いているじゃんぱらの帯（検索の帯など）の下で止める
        const stick = stickBottom();
        const r = (vis(ob) || vis(document.querySelector(".jprush-cartph")) || h).getBoundingClientRect(), top = Math.max(stick + 8, 8, Math.round(r.top)), hh = h && h.isConnected ? h : cartHead();   // 4.10.358：スクロールのたびにページ全体を読み直さない
        const cr2 = (hh || h).getBoundingClientRect(), l = Math.min(520, Math.floor(cr2.left - 2 * G)), rw = Math.min(280, Math.floor(window.innerWidth - cr2.right - 2 * G));
        Object.assign($$("L").style, { left: G + "px", width: l + "px", top: top + "px", bottom: "8px", display: l >= 230 ? "flex" : "none" });
        Object.assign($$("R").style, { right: G + "px", width: rw + "px", top: top + "px", bottom: "8px", display: rw >= 92 ? "flex" : "none" });
      };
      // 4.10.204：じゃんぱらの画面（クーポンなど全体を覆うもの）が開いている間は、左右の欄を隠す
      tick(), place(), every1s(tick);   // 4.10.357：窓が開いている間に左右の欄を隠す見張りは外した
      let plq = 0;   // 4.10.364：1コマに1回だけ
      window.addEventListener("scroll", () => { plq || (plq = requestAnimationFrame(() => { plq = 0, place(); })); }, { passive: true }), window.addEventListener("resize", place);
      return true;
    }
    // 4.10.227：カートの各商品の「削除」の真下に、同じ見た目の「カートへ」（その商品をもう一度カートに入れる。送り方は検索画面の「カートへ」と同じ）
    // 4.10.316：［今すぐ再カート］は全部すぐ押す（3点ずつは3点で止まったのでやめた）
    function bulkReadd(tg) { tg.forEach((b) => b.click()); }
    // 4.10.325：カート全削除は1件ずつ。毎回カートを読み直して、いちばん上の商品の「削除」を送る（同時に送ると取りこぼしが出た）
    function cartDelAll(say) {
      try { $("rcBook", {}); } catch (e) {}   // 4.10.384：全部消す時は、自動で戻す予定も空にする
      // 4.10.401→402：全部消した商品は、取りこぼしの回収・自動で戻す対象から外す（「削除済」の印は付けない）
      try {
        const C = (E("cart", { codes: {} }) || {}).codes || {}, H = E("cartHist", {}) || {}, t = w(), me = devId(), codes = new Set(Object.keys(C));
        for (const a of document.querySelectorAll('a[href*="SRCODE="]')) { const m = /[?&]SRCODE=(\d+)/.exec(a.href); m && a.closest("tr") && codes.add(m[1]); }
        // 4.10.402：全削除では「削除済」は付けない（言われた通り）。代わりに回収・自動で戻す対象から外すだけ
        void H, void me;
        lsMarkPut("jprDelAll", [...codes]);
        for (const c of codes) delete RCW.recipes[c];
        try { const c0 = E("cart", { codes: {} }) || { codes: {} }; c0.codes = {}; $("cart", c0); } catch (e) {}
        const R = E("rcRecov", {}) || {}; for (const c of codes) R[c] = { n: 3, at: t }; $("rcRecov", R);
      } catch (e) {}
      // 真ん中の表の［再カート］と同じ探し方：文字が「削除」の部品のうち、いちばん内側のもの → その中（または外側）のボタン
      const findDel = (doc) => {
        const cands = [...doc.querySelectorAll("input,button,a,span,div")].filter((e) => !e.closest(".jprush-readd") && /^削除$/.test(N(e.value || e.alt || e.textContent)) && e.closest("tr") && e.closest("tr").querySelector("a[href*='SRCODE=']"));
        const d = cands.find((e) => !cands.some((o) => o !== e && e.contains(o)));
        return d && (d.matches("input,button,a") ? d : [...d.querySelectorAll("input,button,a")].find((x) => x.type !== "hidden") || d.closest("a,button"));
      };
      const send = (btn) => {
        if (btn.tagName === "A") return cfetch(new URL(btn.getAttribute("href"), location.href).href, { credentials: "include", redirect: "manual" });
        const fm = btn.form || btn.closest("form");
        if (!fm) return Promise.reject(new Error("削除の送り先が見つかりません"));
        const fd = new URLSearchParams();
        for (const x of fm.querySelectorAll("input,select,textarea")) {
          if (!x.name || x.disabled) continue;
          if (/^(submit|button|image|reset)$/i.test(x.type || "")) continue;
          if (/^(checkbox|radio)$/i.test(x.type || "") && !x.checked) continue;
          fd.append(x.name, x.value || "");
        }
        if (/^image$/i.test(btn.type || "")) { const p = btn.name ? btn.name + "." : ""; fd.append(p + "x", "0"), fd.append(p + "y", "0"); }
        else btn.name && fd.append(btn.name, btn.value || "");
        return cfetch(new URL(fm.getAttribute("action") || location.href, location.href).href, { method: (fm.getAttribute("method") || "post").toUpperCase(), body: fd, credentials: "include", redirect: "manual" });
      };
      let n = 0;
      const step = () => cfetch("/sale/cart/", { credentials: "include" }).then((r) => r.text()).then((html) => {
        const btn = findDel(new DOMParser().parseFromString(html, "text/html"));
        if (!btn || n >= 80) return;
        return send(btn).then(() => { n++, say(`削除中… ${n}点`); return step(); });
      });
      // 4.10.338：一気に。その時のカートの削除ボタンを全部同時に送る → 読み直して、残りがあればまた全部同時に（最大5回）。
      // 全部消すのが目的なので、同時に送って行がずれても構わない（取りこぼしは次の回で拾う）
      const allDels = (doc) => {
        const cands = [...doc.querySelectorAll("input,button,a,span,div")].filter((e) => !e.closest(".jprush-readd") && /^削除$/.test(N(e.value || e.alt || e.textContent)) && e.closest("tr") && e.closest("tr").querySelector("a[href*='SRCODE=']"));
        const out = [];
        for (const l of cands.filter((e) => !cands.some((o) => o !== e && e.contains(o)))) { const b = l.matches("input,button,a") ? l : [...l.querySelectorAll("input,button,a")].find((x) => x.type !== "hidden") || l.closest("a,button"); b && !out.includes(b) && out.push(b); }
        return out;
      };
      const round = (doc, k) => {
        const bs = allDels(doc);
        if (!bs.length || k >= 5) return Promise.resolve();
        say(`削除中…（${k + 1}回目 ${bs.length}点）`);
        return Promise.all(bs.map((b) => send(b).catch(() => {}))).then(() => { n += bs.length; return cfetch("/sale/cart/", { credentials: "include", cache: "no-store" }); })
          .then((r) => r.text()).then((html) => round(new DOMParser().parseFromString(html, "text/html"), k + 1));
      };
      say("削除中…"), $("cartDelAllAt", w());   // 4.10.343：全削除の直後に消えた商品は見張らない
      round(document, 0).catch((e) => console.warn("[JP RUSH] カート全削除", e)).finally(() => { say("削除しました"), setTimeout(() => location.reload(), 300); });
    }
    // 4.10.356：カート画面でスクロールが止まったままになる時がある（削除の後など。開き直すと直る）。
    // 見える窓が開いていないのに「スクロール止め」や「見えない幕」が残っていたら外し、原因を下に数秒出す
    function scrollGuard() {
      if (window.__jprSG) return;
      window.__jprSG = 1;
      const said = new Set(), note = (why) => {
        console.info("[JP RUSH] スクロールの止まりを外しました：", why);
        if (said.has(why)) return;
        said.add(why);
        const d = document.createElement("div");
        d.textContent = "JP RUSH：スクロールの止まりを外しました（" + why + "）";
        d.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483646;max-width:calc(100vw - 16px);padding:6px 10px;background:#1f2d3d;color:#fff;font:600 12px/1.5 system-ui,sans-serif;pointer-events:none;";
        document.body.appendChild(d), setTimeout(() => d.remove(), 6e3);
      };
      const ours = (el) => !!(el && el.closest && el.closest(".jprush-hist,#jp3-host,#jp3-cart,[class^='jprush'],[id^='jp3']"));
      // 見える窓（じゃんぱらの窓・JP RUSH の窓）が開いている間は触らない
      const seen = (el) => { if (ours(el)) return false; const c = getComputedStyle(el); if ((c.position !== "fixed" && c.position !== "absolute") || c.display === "none" || c.visibility === "hidden" || Number(c.opacity) < 0.05) return false; const r = el.getBoundingClientRect(); return r.width >= innerWidth * 0.5 && r.height >= innerHeight * 0.5 && r.bottom > 0 && r.top < innerHeight; };
      const busy = () => { try { if (document.querySelector(".jprush-hist,.remodal-is-opened")) return true; for (const el of document.body.children) if (seen(el) || [...el.children].some(seen)) return true; return false; } catch (e) { return true; } };
      const desc = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
      setInterval(() => {
        if (document.hidden || busy()) return;
        const se = document.scrollingElement || document.documentElement;
        if (se.scrollHeight <= innerHeight + 40) return;
        for (const el of [document.documentElement, document.body]) {
          const c = getComputedStyle(el);
          if (/hidden|clip/.test(c.overflowY)) { el.style.setProperty("overflow-y", "auto", "important"), note(desc(el) + " のスクロール止め"); }
          if (c.position === "fixed" && el === document.body) { el.style.setProperty("position", "static", "important"), note("body の位置固定"); }
          if (c.touchAction === "none") { el.style.setProperty("touch-action", "auto", "important"), note(desc(el) + " のタッチ止め"); }
        }
        // 画面の真ん中を覆っている、じゃんぱら側の見えない幕（ほぼ全面・透明）
        let el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
        for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
          if (ours(el)) break;
          const c = getComputedStyle(el);
          if (c.position !== "fixed" && c.position !== "absolute") continue;
          const r = el.getBoundingClientRect();
          if (r.width < innerWidth * 0.9 || r.height < innerHeight * 0.9) continue;
          const clear = Number(c.opacity) < 0.05 || ((c.backgroundColor === "rgba(0, 0, 0, 0)" || c.backgroundColor === "transparent") && !N(el.innerText || ""));
          if (clear) { el.style.setProperty("pointer-events", "none", "important"), note(desc(el) + " の見えない幕"); }
          break;
        }
      }, 1500);
    }
    // 4.10.359：計測のために主な処理を包む（動きは同じ）
    try { readCart = PW("readCart", readCart), cartTools = PW("cartTools", cartTools), histBody = PW("カート履歴を作る", histBody), cartReaddBtns = PW("再カートのボタン", cartReaddBtns), centerTimers = PW("表の残り時間", centerTimers), showCartNote = PW("showCartNote", showCartNote), watchTick = PW("見張り", watchTick), cartPoll = PW("カートの見張り", cartPoll), cartParse = PW("カートを読む", cartParse), cartHead = PW("見出しを探す", cartHead), cartOrderBar = PW("帯を探す", cartOrderBar), stickBottom = PW("上の帯", stickBottom), popupOpen = PW("窓の確認", popupOpen), Sn = PW("ページの文字を読む", Sn), lgFlush = PW("台帳を書く", lgFlush), syncMaybe = PW("同期", syncMaybe), expiredOverlay = PW("期限切れの表示", expiredOverlay), cartExpiredLinks = PW("期限切れを探す", cartExpiredLinks); } catch (e) { console.warn("[JP RUSH] 計測の準備に失敗", e); }
    // 4.10.402：画面のどこで［削除］を押しても印を付ける（ボタンの探し方から漏れた［削除］の分）
    if (!window.__jprDelCap) { window.__jprDelCap = 1; document.addEventListener("click", (ev) => { try { const t = ev.target && ev.target.closest && ev.target.closest("input,button,a,img"); if (!t || t.closest(".jprush-readd,#jp3-cart,#jp3-host,.jprush-ptm,.jprush-hist")) return; if (!/削除/.test((t.value || "") + (t.alt || "") + (t.textContent || "") + (t.title || ""))) return; const tr = t.closest("tr"), a = tr && tr.querySelector("a[href*='SRCODE=']"), m = a && /[?&]SRCODE=(\d+)/.exec(a.getAttribute("href") || ""); if (m) delMarkPut(m[1]), histMark(m[1], true), rcBookDrop(m[1]); } catch (e) {} }, true); }
    function cartReaddBtns(cr) {
      if (!cr || !cr.ok || document.querySelector(".jprush-readd")) return;
      const P = cartParse(), byCode = new Map(P.items.map((it) => [it.code, it]));
      // 4.10.364：「削除」の文字から探す（全部の箱の中身を読むと重かった）。見つかる物は今までと同じ
      const cs = new Set();
      for (const e of document.querySelectorAll("input,button")) N(e.value || e.textContent) === "削除" && cs.add(e);
      { const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (N(n.nodeValue) !== "削除") continue; for (let e = n.parentElement; e && e !== document.body && N(e.textContent) === "削除"; e = e.parentElement) /^(INPUT|BUTTON|A|SPAN|DIV)$/.test(e.tagName) && cs.add(e); } }
      const cands = [...cs].filter((e) => !e.closest("#jp3-cart,#jp3-host,.jprush-ptm") && e.getClientRects().length);
      const dels = cands.filter((e) => !cands.some((o) => o !== e && o.contains(e)));
      for (const d of dels) {
        const tr = d.closest("tr"), a = tr && [...tr.querySelectorAll("a[href*='SRCODE=']")].find((x) => x.getClientRects().length), code = a && srOf(a.getAttribute("href")), it = code && byCode.get(code);
        if (!it || !it.amts.length) continue;
        const price = it.amts[0], shp = (/[?&]SHPCODE=(\d+)/.exec(a.getAttribute("href") || "") || [])[1] || shpOf(code);
        // 4.10.228：写すのは「削除」のボタン1つだけ（まわりの箱には、隠れた商品番号・店舗番号の欄が入っている）。幅と高さは「削除」と同じ
        const btn = d.matches("input,button,a") ? d : [...d.querySelectorAll("input,button,a")].find((x) => x.type !== "hidden" && x.getClientRects().length) || d, br0 = btn.getBoundingClientRect();
        const b = btn.cloneNode(true);
        b.querySelectorAll("input[type=hidden]").forEach((x) => x.remove());
        for (const x of [b, ...b.querySelectorAll("*")]) {
          for (const at of [...x.attributes]) /^(on|id$|name$|href$|form|data-|action$)/i.test(at.name) && x.removeAttribute(at.name);
          /^(INPUT|BUTTON)$/.test(x.tagName) && (x.type = "button");
        }
        if (b.tagName === "INPUT") b.value = "再カート";   // 4.10.300：文字は「入れ直し」
        else { const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); for (let n = tw.nextNode(); n; n = tw.nextNode()) /削除/.test(n.nodeValue) && (n.nodeValue = n.nodeValue.replace("削除", "再カート")); }
        b.title = `商品番号 ${code}・店舗番号 ${shp}・${A(price)}。押すと「削除→カートに入れる」を続けて行い、残り時間を数え直します`;
        Object.assign(b.style, { boxSizing: "border-box", width: br0.width + "px", height: br0.height + "px", paddingLeft: "0", paddingRight: "0", whiteSpace: "nowrap", overflow: "hidden" });
        const wrap = document.createElement("div");
        wrap.className = "jprush-readd", wrap.style.cssText = "margin-top:6px;", wrap.dataset.code = code, btn.dataset.jprushDel = code;
        btn.addEventListener("click", () => { delMarkPut(code), histMark(code, true), rcBookDrop(code); }, true);   // 4.10.335：自分で［削除］を押したら履歴に「削除」マーク
        // 4.10.298：カート画面の「カート」（入れ直し）も、ページを移らずに裏で送る。続けて押せる（ほぼ同時に送る）。
        // 全部の返事が来たら、1回だけ開き直して残り時間などを新しくする（入れ直した商品は押した時刻から数える）
        const lbl = (t) => { if (b.tagName === "INPUT") b.value = t; else { const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); const n = tw.nextNode(); n && (n.nodeValue = t); } };
        // 4.10.382：送る中身を覚えておく（自動再カートの働き手が、画面を使わずにこれで送る）
        try {
          const dr = (() => { if (btn.tagName === "A" && btn.href) return { url: btn.href, method: "GET", body: "" }; const fm = btn.form || btn.closest("form"); if (!fm) return null; let fd; try { fd = new FormData(fm, btn); } catch (e) { fd = new FormData(fm); btn.name && fd.append(btn.name, btn.value || ""); } return { url: new URL(fm.getAttribute("action") || location.href, location.href).href, method: (fm.method || "post").toUpperCase(), body: new URLSearchParams(fd).toString() }; })();
          dr && (RCW.recipes[code] = { del: dr, add: withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(price)], ["REDIRECT", ""], ["QTY", "1"]])).toString(), name: String(it.name || "").slice(0, 40), at: w() });
        } catch (e) {}
        b.addEventListener("click", (ev) => {
          ev.preventDefault(), ev.stopPropagation();
          if (b.dataset.jprushBusy) return;
          b.dataset.jprushBusy = "1", lbl("送信中…"), readdPend++;
          console.info("[JP RUSH] カートへ（カート画面）：商品番号", code, "店舗番号", shp, "価格", price);
          const t0 = w();
          try { const m = E("cartReadd", {}) || {}; m[code] = t0, $("cartReadd", m); } catch (e) {}
          const body = withMeta(code, new URLSearchParams([["SRCODE", code], ["SHPCODE", shp], ["PRICE", String(price)], ["REDIRECT", ""], ["QTY", "1"]]));
          // 4.10.299：「カート」1回で「削除→カートに入れる」を順番に行う（削除の返事を待ってから入れる。同時に送ると、後に届いた削除で入れた分まで消えることがあった）。
          // 先に自分で「削除」を押していても、削除は空振りになるだけ。ページが移っても送り切るよう keepalive
          const delReq = () => {
            try {
              // 4.10.315：削除は「受け付けた」返事（転送の指示）が来た時点で次へ。カートのページを読み込み終わるのは待たない（削除→追加のすき間を短く）
              if (btn.tagName === "A" && btn.href) return cfetch(btn.href, { credentials: "include", keepalive: true, redirect: "manual" });
              const fm = btn.form || btn.closest("form");
              if (!fm) return Promise.resolve();
              let fd;
              try { fd = new FormData(fm, btn); } catch (e) { fd = new FormData(fm); btn.name && fd.append(btn.name, btn.value || ""); }
              return cfetch(fm.action || location.href, { method: (fm.method || "post").toUpperCase(), body: new URLSearchParams(fd), credentials: "include", keepalive: true, redirect: "manual" });
            } catch (e) { return Promise.resolve(); }
          };
          const end = () => { readdPend--; clearTimeout(readdTm), readdTm = setTimeout(() => { readdPend || !readdOk || location.reload(); }, 900); };
          const job = {
            code, body, delReq,
            ok: () => {
              try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; const o = { ...(c.codes[code] || {}) }; delete o.unsure; c.codes[code] = { ...o, firstSeen: t0 }; /* 削除の返事がおかしくても時刻は更新する（記録にだけ残す） */ $("cart", c); } catch (e) {}
              job.delFail && arLog(`${T(w())} 削除の返事がおかしかった ${code}（持ち時間が延びていない恐れ）`);
              lbl("入れ直し ✓"), readdOk++, arLog(`${T(w())} 入れ直し成功 ${String(it.name || code).slice(0, 20)}（${code}）`), end();
            },
            fail: (msg) => { console.warn("[JP RUSH] カートへ（カート画面）：送れませんでした", code, msg); arLog(`${T(w())} 入れ直し失敗 ${code}（${String(msg).slice(0, 30)}）`); lbl("失敗"), delete b.dataset.jprushBusy, setTimeout(() => lbl("再カート"), 4000), end(); },
          };
          RDQ.jobs.push(job);
          rdqPump();
        }, true);
        wrap.appendChild(b), d.after(wrap);
        // 4.10.354：商品名の横に、商品名だけをコピーするアイコン
        try {
          const na = [...tr.querySelectorAll("a[href*='SRCODE=']")].find((x) => x.getClientRects().length && N(x.textContent).length > 3);
          if (na && !na.parentNode.querySelector(".jprush-namecp")) { const cb = copyIcon(() => N(na.textContent), "商品名をコピー"); cb.classList.add("jprush-namecp"); cb.style.marginLeft = "4px"; na.after(cb); }
        } catch (e) {}
        // 4.10.264：「カート」の左端を真上の「削除」の左端にそろえる（欄の中の寄せ方で、店ごとにずれていた）
        const align = () => {
          if (!b.isConnected) return;
          b.style.position = "relative", b.style.left = "0px";
          const r0 = btn.getBoundingClientRect(), r1 = b.getBoundingClientRect();
          r0.width && r1.width && (b.style.left = Math.round(r0.left - r1.left) + "px");
        };
        align(), setTimeout(align, 300), setTimeout(align, 1200), window.addEventListener("resize", align, { passive: true });
      }
    }
    // 4.10.232：タブレットの表の「オプション代」の列を「残り時間」にする（元の文字は消さず、上に重ねて隠す）
    function centerTimers(cr) {
      if (!cr || !cr.ok || document.querySelector(".jprush-otm")) return;
      const codes = (E("cart", { codes: {} }) || {}).codes || {}, now0 = w(), list = [];
      const colOf = (cell) => { let c = 0; for (let e = cell.previousElementSibling; e; e = e.previousElementSibling) c += e.colSpan || 1; return c; };
      const cellAt = (tr, col) => { let c = 0; for (const e of tr.cells) { if (c === col) return e; c += e.colSpan || 1; if (c > col) return null; } return null; };
      // 4.10.234：板は塗らない（線にかぶらない）。元の文字は透明にして見えなくする（文字は残るので読み取りは変わらない）
      const cover = (cell) => {
        const cs0 = getComputedStyle(cell), col0 = cs0.color, font0 = cs0.font;
        // 4.10.236：欄そのものは位置の基準にしない（隣と共有している線を塗りつぶすため）。中に小さな箱を作って、それを基準にする
        // 線の色が文字の色に連動していても消えないよう、先に今の線の色を固定する
        // 4.10.235：中の箱の線・影・下線の色も、透明にする前に固定する（じゃんぱらは中の箱で線を引いていることがある）
        const freeze = (e, c) => { for (const sd of ["Top", "Right", "Bottom", "Left"]) e.style["border" + sd + "Color"] = c["border" + sd + "Color"]; c.boxShadow && c.boxShadow !== "none" && (e.style.boxShadow = c.boxShadow); e.style.outlineColor = c.outlineColor; e.style.textDecorationColor = "transparent"; };
        const kids = [...cell.querySelectorAll("*")].filter((e) => !e.closest(".jprush-otm")), kcs = kids.map((e) => getComputedStyle(e)), snap = kids.map((e, i) => [e, { borderTopColor: kcs[i].borderTopColor, borderRightColor: kcs[i].borderRightColor, borderBottomColor: kcs[i].borderBottomColor, borderLeftColor: kcs[i].borderLeftColor, boxShadow: kcs[i].boxShadow, outlineColor: kcs[i].outlineColor }]);
        freeze(cell, cs0), cell.style.color = "transparent";
        for (const [e, c] of snap) freeze(e, c), e.style.color = "transparent";
        const wr = document.createElement("span");
        wr.className = "jprush-otmw", wr.style.cssText = "position:relative;display:block;";
        while (cell.firstChild) wr.appendChild(cell.firstChild);
        cell.appendChild(wr);
        const o = document.createElement("div");
        o.className = "jprush-otm";
        o.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;white-space:nowrap;background:transparent;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;pointer-events:none;`;
        wr.appendChild(o), o.dataset.col = col0, o.dataset.font = font0;
        return o;
      };
      const bgOf = (cell) => { for (let e = cell; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && b !== "transparent" && !/rgba\(.*,\s*0\)$/.test(b)) return b; } return "#fff"; };
      for (const th of document.querySelectorAll("th,td")) {
        if (th.closest("#jp3-cart,#jp3-host") || N(th.textContent).replace(/\s/g, "") !== "オプション代" || !th.getClientRects().length) continue;
        // 4.10.233：見出しと商品が別の箱（thead／tbody）に分かれていても、表全体の行を見る
        const hr = th.parentElement, col = colOf(th), tb = th.closest("table"), rows = tb ? [...tb.rows] : [...hr.parentElement.children];
        let any = false;
        for (let i = rows.indexOf(hr) + 1; i < rows.length; i++) {
          const r = rows[i];
          if ([...r.cells].some((c) => N(c.textContent).replace(/\s/g, "") === "オプション代")) break;
          const a = [...r.querySelectorAll("a[href*='SRCODE=']")].find((x) => x.getClientRects().length), code = a && srOf(a.getAttribute("href")), cell = code && cellAt(r, col);
          if (!cell || cell.querySelector(".jprush-otm")) continue;
          const o = cover(cell), cd = document.createElement("div"), bar = document.createElement("div"), fill = document.createElement("div");
          cd.style.cssText = "font-size:17px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;letter-spacing:.3px;";
          bar.style.cssText = "width:56px;height:4px;background:#e5e9ef;position:relative;overflow:hidden;", fill.style.cssText = "position:absolute;left:0;top:0;bottom:0;";
          bar.append(fill), o.append(cd, bar);
          const fs = codes[code] && codes[code].firstSeen;
          list.push({ code, cd, fill, end: (fs || now0) + CART_HOLD }), any = true;
        }
        if (any) { const o = cover(th); o.textContent = "残り時間", o.style.font = o.dataset.font, o.style.color = o.dataset.col; }
      }
      if (!list.length) return;
      const COL = { ok: "#003792", amber: "#c96a00", red: "#c8102e", gone: "#6b7280" };
      const tick = () => {
        const t = w();
        for (const x of list) {
          const left = (LIVE_END[x.code] || x.end) - t, st = left <= 0 ? "gone" : left < 6e5 ? "red" : left < 18e5 ? "amber" : "ok";
          x.cd.textContent = left <= 0 ? "期限切れ" : mmss(left), x.cd.style.color = COL[st], x.cd.style.fontSize = left <= 0 ? "12px" : "17px";
          x.fill.style.background = COL[st], x.fill.style.width = Math.max(0, Math.min(100, left / CART_HOLD * 100)) + "%";
        }
      };
      tick(), every1s(tick);
    }
    // 4.10.240：じゃんぱらの期限切れの一覧に重ねる表示（タブレット・スマホ共通）
    function expiredOverlay() {
      if (document.querySelector(".jprush-exchk")) return;
      const exl = cartExpiredLinks();
      if (exl.length) {
        // 4.10.211：じゃんぱらの期限切れの一覧に重ねる（各行の名前の右に結果と「カートへ」、説明文の下に確かめるボタン）
        const pel = (tag, css, txt) => { const e = document.createElement(tag); css && (e.style.cssText = css); txt != null && (e.textContent = txt); return e; };
        const chk = pel("button", "display:inline-block;margin:6px 0 4px;padding:6px 12px;border:1px solid #cdd6e4;border-radius:0;background:#eef2f8;color:#003792;font:700 13px/1.3 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;cursor:pointer;", "確かめています…"), rowsE = [];
        chk.className = "jprush-exchk";
        for (const e of exl) {
          const row = pel("span", "margin-left:8px;font:500 12px/1.5 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;color:#4a5a6e;"), stt = pel("span", "", "未確認"), act = pel("span", "margin-left:6px;display:inline-block;vertical-align:middle;");
          row.className = "jprush-exs", row.append(stt, act), e.a.after(row);
          rowsE.push({ e, stt, act, row: { classList: { add: () => { e.a.style.opacity = ".5"; }, remove: () => { e.a.style.opacity = ""; } } } });
        }
        const list = exl[0].a.closest("ul,ol,dl") || exl[0].a.parentElement;
        list.parentNode.insertBefore(chk, list);
        chk.type = "button";
        // 4.10.199：表示が済んでから、1件ずつ間をあけて商品ページを読んで判定する（ボタンで読み直し）
        const run = () => {
          chk.disabled = true, chk.textContent = "確かめています…";
          let k = 0;
          const next = () => {
            const r = rowsE[k++];
            if (!r) { chk.disabled = false, chk.textContent = `在庫確認（${T(w())} 済）`; return; }
            r.stt.textContent = "商品ページを読んでいます…", r.act.replaceChildren();
            // 4.10.201：見えない枠で商品ページを本当に開き、表示が済んだ後の画面（その台の欄）で判定する
            // 4.10.349：3分以内に商品ページで在庫を確かめた商品は、台帳の結果を使って読み直さない
            (r.e.sr ? lgGetItem(r.e.sr) : Promise.resolve(null)).then((L) => L && L.stAt && w() - L.stAt < 18e4 && /^(stock|nego|sold)$/.test(L.st) && L.src && (L.src.check || L.src.watch || L.src.page || L.src.detail) >= L.stAt - 5e3 ? { cached: L } : framePageText(r.e.url)).then((g) => {
              if (g.cached) { const L = g.cached; g = { text: "x" }; g.v = { k: L.st, why: `${T(L.stAt)} に確認済み`, price: L.st === "stock" ? L.price : 0 }; }
              const now = T(w()), v = g.v || (g.text ? judgeUnit(g.text, r.e.sr) : null);
              try { !g.v && r.e.sr && v && /^(stock|nego|sold)$/.test(v.k) && lgItem(r.e.sr, { name: r.e.name, url: r.e.url, st: v.k, price: v.k === "stock" ? v.price : 0 }, "check"); } catch (e) {}   // 4.10.348
              if (!g.text) r.stt.textContent = `読めませんでした（${now}）`;
              else if (v.k === "busy") r.stt.textContent = `混雑中で読めませんでした（${now}）`;
              else if (v.k === "nego") r.row.classList.remove("sold"), r.stt.textContent = `商談中（${v.why}・${now}）`;
              else if (v.k === "sold") r.row.classList.add("sold"), r.stt.textContent = `完売（${v.why}・${now}）`;
              else if (v.k === "stock") {
                r.row.classList.remove("sold"), r.stt.textContent = `在庫あり${v.price ? " " + A(v.price) : ""}（${v.why}・${now}）`;
                // 4.10.202：ページから価格が取れなければ、巡回で最後に見た価格
                if (!v.price) { const L = (Er("lastlive", {}) || {})["S" + r.e.sr], l0 = L && Object.entries(L.prices || {})[0]; l0 && (v.price = Number(String(l0[1]).replace(/[^\d]/g, "")) || 0, v.price && (r.stt.textContent = `在庫あり ${A(v.price)}（${v.why}・価格は巡回で ${T(L.at)} に見たもの・${now}）`)); }
                v.price && appendCartBtn(r.act, { rec: { name: r.e.name, url: r.e.url, img: "", stock: 1, soldOut: false, prices: { "": v.price } }, cart: false }, false);
              } else r.stt.textContent = `分かりませんでした（${now}）`;
              setTimeout(next, 500);
            });
          };
          next();
        };
        chk.onclick = run, chk.textContent = "在庫確認";   // 4.10.245：文字は「在庫確認」   // 4.10.201：自動では読まない（押した時だけ）
        // 4.10.244：期限切れの商品をAI用の文章にしてコピー（確かめた結果も入れる。商品ページは読み直さない）
        const cpx = chk.cloneNode(false);
        // 4.10.245：コピーはアイコンに（押した結果は横に少し出す）
        cpx.className = "jprush-excopy", cpx.type = "button", cpx.disabled = false, cpx.innerHTML = ICON_COPY, cpx.title = "期限切れをコピー", cpx.setAttribute("aria-label", "期限切れをコピー");
        Object.assign(cpx.style, { marginLeft: "8px", padding: "0", width: "34px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "top" });
        const cps = document.createElement("span");
        cps.className = "jprush-excopy", cps.style.cssText = "margin-left:6px;font:500 12px/32px system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;color:#4a5a6e;vertical-align:top;";
        const cpSay = (t) => { cps.textContent = t; setTimeout(() => { cps.textContent = ""; }, 2500); };
        cpx.onclick = () => {
          const lines = [`じゃんぱら カートの期限切れ商品（${rowsE.length}件・${T(w())} 時点）`];
          for (const r of rowsE) {
            const st = N(r.stt.textContent), sr = r.e.sr || "";
            let url = r.e.url || "";
            try { url = new URL(url, location.origin).href; } catch (e) {}
            lines.push(`・${r.e.name}`, `  ${sr ? "商品番号 " + sr + "／" : ""}状態：${!st || st === "未確認" ? "未確認" : st}`, `  ${url}`);
          }
          writeClip(lines.join("\n"), () => cpSay(`コピーしました（${rowsE.length}件）`), () => cpSay("コピーできませんでした"));
        };
        chk.after(cpx, cps);
      }
    }
    // 4.10.218：スマホ（左右に欄を出せない画面）は、各商品の「オプション」の行の上に、その商品の残り時間をかぶせる（オプションの行は押せない。クーポンは使うのでかぶせない）
    function phoneTimers(cr) {
      if (!cr || !cr.ok || document.querySelector(".jprush-ptm")) return false;
      const P = cartParse(), codes = (E("cart", { codes: {} }) || {}).codes || {}, now0 = w(), trs = [...document.querySelectorAll("tr")], list = [];
      const endOf = (it) => { const fs = codes[it.code] && codes[it.code].firstSeen; return (fs || now0) + CART_HOLD; };
      // 4.10.220：見えている文字だけで見る（「追加」の行には、押すと開くオプション一覧が見えないまま入っている）
      const vt = (e) => N(e.innerText != null ? e.innerText : e.textContent), short = (e, re) => { const t = vt(e); return re.test(t) && t.length <= 40; };
      for (const it of P.items) {
        const a = [...document.querySelectorAll(`a[href*="SRCODE=${it.code}"]`)].find((x) => !x.closest("#jp3-cart,#jp3-host,.jprush-exs") && x.getClientRects().length), tr = a && a.closest("tr");
        if (!tr) continue;
        let cRow = null, oRow = null;
        for (let i = trs.indexOf(tr) + 1; i < trs.length && i < trs.indexOf(tr) + 12; i++) {
          const r = trs[i];
          if (r.contains(tr) || [...r.querySelectorAll("a[href*='SRCODE=']")].some((x) => x.getClientRects().length) || /^(送料|合計|総合計)/.test(vt(r))) break;
          !cRow && short(r, /^クーポン/) && (cRow = r), !oRow && short(r, /^オプション(?!代)/) && (oRow = r);
        }
        const top = oRow, bot = oRow;
        if (!top) continue;
        const bx = document.createElement("div"), lab = document.createElement("span"), cd = document.createElement("span"), bar = document.createElement("span"), fill = document.createElement("span");
        bx.className = "jprush-ptm";
        bx.style.cssText = "position:absolute;box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:0 14px;background:#fff;border:1px solid #cacaca;font-family:system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;cursor:default;";
        lab.textContent = "残り時間", lab.style.cssText = "flex:none;font-size:13px;font-weight:700;color:#4a5a6e;";
        cd.style.cssText = "flex:none;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;letter-spacing:.5px;line-height:1;";
        bar.style.cssText = "flex:1;height:8px;background:#e5e9ef;position:relative;overflow:hidden;", fill.style.cssText = "position:absolute;left:0;top:0;bottom:0;";
        bar.append(fill), bx.append(lab, cd, bar);
        for (const ev of ["click", "mousedown", "mouseup", "touchstart", "touchend", "pointerdown", "pointerup"]) bx.addEventListener(ev, (e) => { e.stopPropagation(); ev === "click" && e.preventDefault(); }, { capture: true, passive: ev.startsWith("touch") });
        document.body.appendChild(bx), list.push({ code: it.code, bx, cd, fill, top, bot, end: endOf(it) });
      }
      if (!list.length) return false;
      const place = () => {
        for (const x of list) {
          // 4.10.219：行の外枠ではなく、行の中の欄（左端〜右端）にきっちり合わせる。数字は丸めない。枠線はじゃんぱらの表の線と同じ色・太さ
          const cs = [...x.top.children].filter((c) => c.getClientRects().length), vis = cs.length && x.top.isConnected;
          x.bx.style.display = vis ? "flex" : "none";
          if (!vis) continue;
          const a = cs[0].getBoundingClientRect(), b = cs[cs.length - 1].getBoundingClientRect(), c0 = getComputedStyle(cs[0]);
          Object.assign(x.bx.style, { left: a.left + window.scrollX + "px", top: Math.min(a.top, b.top) + window.scrollY + "px", width: b.right - a.left + "px", height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) + "px" });
          parseFloat(c0.borderTopWidth) > 0 && (x.bx.style.border = `${c0.borderTopWidth} ${c0.borderTopStyle} ${c0.borderTopColor}`);
        }
      };
      const COL = { ok: "#003792", amber: "#c96a00", red: "#c8102e", gone: "#6b7280" };
      const tick = () => {
        const t = w();
        for (const x of list) {
          const left = (LIVE_END[x.code] || x.end) - t, st = left <= 0 ? "gone" : left < 6e5 ? "red" : left < 18e5 ? "amber" : "ok";
          x.cd.textContent = left <= 0 ? "期限切れ" : mmss(left), x.cd.style.color = COL[st], x.cd.style.fontSize = left <= 0 ? "18px" : "30px";
          x.fill.style.background = COL[st], x.fill.style.width = Math.max(0, Math.min(100, left / CART_HOLD * 100)) + "%", x.bx.dataset.st = st;
        }
        place();
      };
      tick(), every1s(tick), window.addEventListener("resize", place), setTimeout(place, 600);
      // 4.10.238：じゃんぱらのポップアップ（オプション・クーポンの一覧など）が開いている間は、板と上の青いバーを隠す（×が押せるように）
      // 4.10.357：↑の見張りは外した（働いていなかった・重いだけ）
      return true;
    }
    // 4.10.177：カート画面の左の空き部分に「完売記録を表示」。押した時だけ完売記録を読んで、完売記録の画面を開く（検索ツール・新着候補は出さない）
    function cartSoldBtn() {
      if (document.querySelector(".jprush-cartsold")) return;
      const h = cartHead(), r = h ? h.getBoundingClientRect() : null, b = document.createElement("button");
      b.type = "button", b.className = "jprush-cartsold", b.textContent = "完売記録を表示";
      const base = "font:600 14px/1.4 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;color:#003792;background:#eef2f8;border:1px solid #cdd6e4;border-radius:0;padding:10px 12px;cursor:pointer;";
      if (r && r.left >= 170) b.style.cssText = base + `position:absolute;left:${Math.max(8, Math.round(r.left / 2 - 75))}px;top:${Math.round(r.top + window.scrollY)}px;width:150px;z-index:10;`, document.body.appendChild(b);
      else b.style.cssText = base + "display:inline-block;margin:6px 0;", h && h.parentNode ? h.parentNode.insertBefore(b, h) : document.body.prepend(b);
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (!f.banner) { Fn(); f.bar && (f.bar.style.display = "none"); f.rail && (f.rail.style.display = "none"); document.body.style.paddingBottom = ""; }
        (SOLDREADY ? Promise.resolve() : preload(SOLDKEYS).then(() => { SOLDREADY = !!window.indexedDB; })).then(() => ve("sold", () => Ie("")));
      });

    }
    // 4.10.188：カート画面に「データを書き出す」。押した時だけ別の保存場所を全部読む（検索ページでは何もしない）
    function idbAllEntries() {
      return idbOpen().then((db) => new Promise((res, rej) => {
        const tx = db.transaction(IDB_STORE, "readonly"), st = tx.objectStore(IDB_STORE), rk = st.getAllKeys(), rv = st.getAll();
        tx.oncomplete = () => { db.close(); const ks = rk.result || [], vs = rv.result || [], out = []; for (let i = 0; i < ks.length; i++) out.push([String(ks[i]), vs[i]]); res(out); };
        tx.onerror = tx.onabort = () => { db.close(), rej(tx.error); };
      }));
    }
    const sigText = (sig) => { try { return JSON.parse(String(sig || "[]")).map(([k, v]) => k + "=" + v).join(" "); } catch (e) { return String(sig || ""); } };
    const RUN_KEEP = 90 * 864e5;
    const cellOf = (v) => v == null ? "" : typeof v === "object" ? JSON.stringify(v) : v;
    // 全部を1回で集める（検索の記録はURLを元に戻す。Tampermonkey 側に残っている分も入れる）
    function dumpAll() {
      return (window.indexedDB ? idbAllEntries() : Promise.resolve([])).catch(() => []).then((idb) => {
        const recs = {}, evArch = {}, runs = [], sold = {}, other = {}, gm = {}, oldRun = [];
        for (const [k, v0] of idb) {
          if (k.startsWith("run.")) { v0 && w() - (v0.at || 0) > RUN_KEEP ? oldRun.push(k) : v0 && runs.push(v0); continue; }
          if (k.startsWith("ev.")) { evArch[k.slice(3).replace(Ct, "")] = v0; continue; }
          const kk = k.startsWith(Ct) ? k.slice(Ct.length) : k;
          if (isRecKey(kk)) { recs[kk] = unzipRec(structuredClone(v0)); continue; }
          if (isSoldMonth(kk)) { sold[kk] = v0; continue; }
          other[kk] = v0;
        }
        if (typeof GM_listValues === "function") for (const k of GM_listValues()) {
          const kk = String(k).startsWith(Ct) ? String(k).slice(Ct.length) : String(k);
          let v; try { v = GM_getValue(k, null); } catch (e) { v = null; }
          if (isRecKey(kk)) { recs[kk] || (recs[kk] = unzipRec(structuredClone(v))); continue; }
          gm[kk] = v;
        }
        // このタブで書きかけの分（手元の写し）があればそちらを優先
        for (const [k, v] of RECMEM) { const kk = String(k).slice(Ct.length); isRecKey(kk) && (recs[kk] = structuredClone(v)); }
        oldRun.length && Promise.all(oldRun.map((k) => idbDel(k).catch(() => {})));
        runs.sort((a, b) => (a.at || 0) - (b.at || 0));
        return { recs, evArch, runs, sold, other, gm };
      });
    }
    const SCHEMA = {
      "searches[検索キー]": "検索ごとの記録。signature=検索条件（URLの条件）、items=商品、events=直近7日の印、log=直近30回の表示、hours=時間帯ごとの順位（{区切り:{商品ID:順位}}）、ref/cur=前回と今回の基準",
      "items[商品ID]": "I〜=ITMCODE（商品の種類）、S〜=SRCODE（1台）。name, soldOut, stock=在庫数, prices={状態:価格}, live=最後に在庫ありで見た時の値, fp=最初に見た時の価格, firstSeen/lastSeen=最初・最後に見た時刻, soldAt=売切れた時刻, soldEvAt=売切れを見つけた時刻, listAt, rank=ランク, line=1ページの件数, pn=ページの商品数, url, img",
      "events": "item=商品ID, at=時刻, period=表示の区切り, type=NEW（新着 to=在庫数）/PRICE（値段の変化 condition=状態 from→to）/STOCK（在庫数 from→to）/REST（売切れ why=sold）/BACK（復活 to=在庫数）",
      "evArchive[検索キー]": "7日より古い印（形は events と同じ）",
      "runs": "検索ログ（4.10.188から）。at, sig=検索条件, page, line=1ページの件数, total=全件数, count=取れた商品数, ok, error, counts=印の数, t={page=ページの読込, start=始まるまで, proc=処理, read, write}（ミリ秒）",
      "lastlive": "商品IDごとの最後に在庫があった時の価格（全検索共通）",
      "sold[年-月]": "完売記録（1台ごと）",
      "gm": "Tampermonkey側の保存（既読・開いた・詳細・カート・時間ごと・設定・印の待ち行列など）",
      "時刻": "1970年からのミリ秒（CSV では 年/月/日 時:分）"
    };
    const iso = (t) => t ? ht(t) : "";
    function exportJson() {
      return dumpAll().then((d) => {
        const o = { version: Jt, exportedAt: new Date(w()).toISOString(), schema: SCHEMA, searches: d.recs, evArchive: d.evArch, runs: d.runs, lastlive: d.other.lastlive || null, sold: d.sold, otherIdb: Object.fromEntries(Object.entries(d.other).filter(([k]) => k !== "lastlive")), gm: d.gm };
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: "application/json" })), a.download = `janpara-jprush-all-${Be()}.json`, document.body.appendChild(a), a.click(), a.remove(), setTimeout(() => URL.revokeObjectURL(a.href), 3e4);
        return Object.keys(d.recs).length + "検索";
      });
    }
    const TYPE_JA = { NEW: "NEW", PRICE: "値段", STOCK: "在庫数", REST: "売切れ", BACK: "復活" };
    function exportEvents() {
      return dumpAll().then((d) => {
        const rows = [["検索条件", "商品ID", "商品名", "状態", "種類", "検出時刻", "変更前", "変更後", "理由", "区切り", "検索キー"]];
        let n = 0;
        for (const [rk, r] of Object.entries(d.recs)) {
          if (!r) continue;
          const its = r.items || {}, lab = sigText(r.signature), seen = new Set(), all = [];
          for (const u of [...(d.evArch[rk] || []), ...(r.events || [])]) { if (!u) continue; const z = u.item + "|" + u.type + "|" + u.at + "|" + (u.condition || ""); seen.has(z) || (seen.add(z), all.push(u)); }
          all.sort((a, b) => (a.at || 0) - (b.at || 0));
          for (const u of all) {
            const x = its[u.item] || {};
            rows.push([lab, u.item, x.name || "", u.condition || "", TYPE_JA[u.type] || u.type, iso(u.at), cellOf(u.from), cellOf(u.to), u.why || "", cellOf(u.period), rk]), n++;
          }
        }
        De(`janpara-changes-${Be()}.csv`, rows);
        return n + "件";
      });
    }
    function exportItemsAll() {
      return dumpAll().then((d) => {
        const rows = [["検索条件", "商品名", "状態", "価格", "最初に見た時の価格", "在庫か売切れか", "在庫数", "売切れた時刻", "最初に見た時刻", "最後に見た時刻", "ランク", "1ページの件数", "商品ページ", "商品のID", "検索キー", "出現→完売（分）", "要注意"]];
        let n = 0;
        for (const [rk, r] of Object.entries(d.recs)) {
          if (!r || !r.items) continue;
          const lab = sigText(r.signature);
          for (const [id, x] of Object.entries(r.items)) {
            if (!x) continue;
            let url = "";
            try { url = x.url ? new URL(x.url, location.origin).href : ""; } catch (e) { url = x.url || ""; }
            const wq = x.soldOut ? watchOf(id, x, r) : null;
            const fp = x.fp || {}, tail = [x.soldOut ? "売切れ" : "在庫", cellOf(x.stock), iso(x.soldAt), iso(x.firstSeen), iso(x.lastSeen), x.rank || "", x.line || "", url, id, rk, wq && wq.mins != null ? wq.mins : "", wq && wq.on ? (wq.saved ? wq.saved.kind : "自動") : ""], prices = Object.entries((x.soldOut && x.live ? x.live.prices : x.prices) || {});
            if (!prices.length) rows.push([lab, x.name, "", "", "", ...tail]);
            for (const [c, p] of prices) rows.push([lab, x.name, c, cellOf(p), cellOf(fp[c]), ...tail]);
            n++;
          }
        }
        De(`janpara-all-items-all-${Be()}.csv`, rows);
        return n + "商品";
      });
    }
    function exportRuns() {
      return dumpAll().then((d) => {
        const sec = (x) => x == null ? "" : (Math.max(0, x) / 1000).toFixed(2);
        const cnt = (c) => c ? Object.entries(c).filter(([, v]) => v).map(([k, v]) => k + ":" + v).join(" ") : "";
        const rows = [], have = new Set();
        for (const r of d.runs) { have.add(r.sig + "|" + r.at); const t = r.t || {}; rows.push([r.at, iso(r.at), sigText(r.sig), r.page, r.line || "", cellOf(r.total), cellOf(r.count), r.ok ? "成功" : "失敗", r.error || "", cnt(r.counts), sec(t.page), sec(t.start), sec(t.proc), sec(t.read), sec(t.write), r.ver || "", "検索ログ"]); }
        // 4.10.188より前の分：各検索の記録に残っている直近30回（時間なし）
        for (const r of Object.values(d.recs)) if (r && r.log) for (const g of r.log) g && !have.has(r.signature + "|" + g.at) && rows.push([g.at, iso(g.at), sigText(r.signature), g.page, "", "", cellOf(g.count), g.ok ? "成功" : "失敗", g.error || "", cnt(g.counts), "", "", "", "", "", "", "記録内（直近30回）"]);
        rows.sort((a, b) => (a[0] || 0) - (b[0] || 0));
        De(`janpara-search-log-${Be()}.csv`, [["時刻", "検索条件", "ページ", "1ページの件数", "全件数", "取れた商品数", "成否", "エラー", "印の数", "ページの読込(秒)", "始まるまで(秒)", "処理(秒)", "読込(秒)", "保存(秒)", "版", "出どころ"], ...rows.map((r) => r.slice(1))]);
        return rows.length + "件";
      });
    }
    function exportWatch() {
      return Promise.resolve().then(() => {
        const rows = [["商品名", "状態と価格（売切れ前）", "出た時刻", "売切れた時刻", "出現→完売（分）", "自動か手動か", "★を付けた時刻", "検索条件", "商品ページ", "商品のID"]], list = watchRows();
        for (const r of list) { const v = r.wv; let url = v.url || ""; try { url = new URL(url, location.origin).href; } catch (e) {} rows.push([v.name, Object.entries(v.prices || {}).map(([g, O]) => g + " " + O).join(" / "), iso(v.app), iso(v.sold), v.mins == null ? "" : v.mins, v.kind, iso(v.at), v.q, url, r.id]); }
        De(`janpara-watch-${Be()}.csv`, rows);
        return list.length + "件";
      });
    }
    // 4.10.305：ボタンの小さな絵（下向き＝保存、上向き＝読み込み、戻る矢印＝元に戻す）
    const icoSvg = (k) => '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-left:6px">' + ({ dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', ul: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>' })[k] + '</svg>';
    const icoLabel = (b, t, k) => { b.textContent = t, b.insertAdjacentHTML("beforeend", icoSvg(k)); };
    function cartExportBtns(anchor) {
      if (document.querySelector(".jprush-cartexp")) return;
      const box = document.createElement("div"), base = "font:600 13px/1.4 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;color:#003792;background:#eef2f8;border:1px solid #cdd6e4;border-radius:0;padding:8px 10px;cursor:pointer;width:100%;text-align:left;box-sizing:border-box;";
      box.className = "jprush-cartexp";
      const abs = anchor.style.position === "absolute";
      box.style.cssText = abs ? `position:absolute;left:${anchor.style.left};top:${Math.round(anchor.getBoundingClientRect().bottom + window.scrollY + 6)}px;width:150px;z-index:10;display:flex;flex-direction:column;gap:4px;` : "display:flex;flex-direction:column;gap:4px;max-width:240px;margin:0 0 6px;";
      const main = document.createElement("button"), list = document.createElement("div"), note = document.createElement("div");
      main.type = "button", icoLabel(main, "書き出す", "dl"), main.style.cssText = base;
      list.style.cssText = "display:none;flex-direction:column;gap:4px;";
      note.style.cssText = "font:500 11px/1.4 system-ui,sans-serif;color:#5f6b7a;";
      for (const [label, fn] of [["変化の履歴（CSV）", exportEvents], ["全商品・全検索（CSV）", exportItemsAll], ["検索ログ（CSV）", exportRuns], ["要注意（CSV）", exportWatch]]) {
        const b = document.createElement("button");
        b.type = "button", b.textContent = label, b.style.cssText = base + "font-weight:500;background:#fff;";
        b.addEventListener("click", (ev) => {
          ev.preventDefault(), note.textContent = "読んでいます…";
          setTimeout(() => fn().then((m) => { note.textContent = label + "：" + m; }).catch((e) => { note.textContent = "書き出せませんでした：" + (e && e.message || e); }), 30);
        });
        list.appendChild(b);
      }
      main.addEventListener("click", (ev) => { ev.preventDefault(), list.style.display = list.style.display === "none" ? "flex" : "none"; });
      box.append(main, list, note);
      abs ? document.body.appendChild(box) : anchor.parentNode.insertBefore(box, anchor.nextSibling);
    }
    // 4.10.290：データ引き継ぎ（2台を行き来して使う）。カートの画面に［書き出し］［読み込み］［元に戻す］。
    // 書き出し＝この端末の記録すべて（Tampermonkey の保存＋別の保存場所）を1つのファイルに。読み込み＝もう1台のファイルを今の記録に合わせる（上書きしない）。
    // 読み込む前の記録は別の保存場所に1つだけ取っておき、［元に戻す］で戻せる。設定（自動ON・表示の切り替え・欄の大きさ）とカートは端末ごとのまま
    const HO_FMT = "jprush-handoff", HO_BAK = "handoff.backup";
    const HO_SKIP = (k) => /^(hourly\.|test\.|cart$|cartReadd$|devId$|upd$|cartWatch$|cartWatchDone$|cartUrls$|lgPruneAt$|cartDelAllAt$|histCartFold$|histFoldCart$|histFoldDone$|histFoldDel$|aiAt$|aiAddr$|aiLast$|aiGist$|aiFiles$|aiIndex$|cartLeader$|rcBook$|condQ$|condCloud$|judgeTok$|judge$|rcDiag$|rcRecov$|recovAt$|lgBackfillV$|extView$|hoHide$|hoOpen$|autoRecart$|autoRecartLog$|autoRecartHist$|sync[A-Z][a-zA-Z]*$|R$|L$|lb$|lh$|rb$)/.test(k);
    // 4.10.361：決まった記録だけ読む（同期の「変わった分だけ」用）。読み方は hoDump と同じ
    async function syDumpKeys(marks) {
      const gm = {}, idb = [], strip = (k) => (String(k).startsWith(Ct) ? String(k).slice(Ct.length) : String(k));
      for (const m of marks) {
        const k = String(m).slice(2);
        if (m.startsWith("g:")) { if (/^sync[A-Z]/.test(strip(k))) continue; let v; try { v = GM_getValue(k, undefined); } catch (e) {} v !== undefined && v !== null && (gm[k] = v); }
        else if (m.startsWith("i:")) {
          if (k === HO_BAK || k.startsWith("run.") || k.startsWith("sync.")) continue;
          let v = window.indexedDB ? await idbGet(k).catch(() => undefined) : undefined;
          if ((v === undefined || v === null) && RECMEM.has(k) && gm[k] === undefined) v = RECMEM.get(k);
          v !== undefined && v !== null && idb.push([k, v]);
        }
        await syPace();
      }
      return { fmt: HO_FMT, v: 1, ver: Jt, at: w(), gm, idb };
    }
    function hoDump() {
      return (window.indexedDB ? idbAllEntries() : Promise.resolve([])).catch(() => []).then(async (idb) => {
        const gm = {};
        // 4.10.294：鍵（トークン）など連携の設定は書き出さない
        if (typeof GM_listValues === "function") for (const k of GM_listValues()) { if (/^sync[A-Z]/.test(String(k).startsWith(Ct) ? String(k).slice(Ct.length) : String(k))) continue; try { gm[k] = GM_getValue(k, null); } catch (e) {} await syPace(); }
        for (const [k, v] of RECMEM) gm[k] === undefined && idb.every(([x]) => x !== k) && idb.push([k, v]);
        return { fmt: HO_FMT, v: 1, ver: Jt, at: w(), gm, idb: idb.filter(([k]) => k !== HO_BAK && !k.startsWith("run.") && !k.startsWith("sync.")) };
      });
    }
    function hoGzip(text) {
      if (typeof CompressionStream !== "function") return Promise.resolve({ blob: new Blob([text], { type: "application/json" }), ext: "json" });
      const s = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
      return new Response(s).blob().then((b) => ({ blob: b, ext: "json.gz" }));
    }
    function hoRead(file) {
      return file.arrayBuffer().then((buf) => {
        const u = new Uint8Array(buf);
        if (u[0] === 0x1f && u[1] === 0x8b) {
          if (typeof DecompressionStream !== "function") throw new Error("この端末では圧縮ファイルを開けません");
          return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
        }
        return new TextDecoder().decode(u);
      }).then((t) => { const o = JSON.parse(t); if (!o || o.fmt !== HO_FMT) throw new Error("JP RUSH の引き継ぎファイルではありません"); return o; });
    }
    const hoNewer = (a, b) => ((b && (b.lastSeen || b.at || b.lastAt || b.cf || b.s)) || 0) > ((a && (a.lastSeen || a.at || a.lastAt || a.cf || a.s)) || 0);
    const hoEvKey = (u) => u && [u.item, u.type, u.at, u.condition || ""].join("|");
    function hoUnionArr(a, b, key) {
      const out = Array.isArray(a) ? [...a] : [], seen = new Set(out.map(key));
      for (const u of Array.isArray(b) ? b : []) { const z = key(u); seen.has(z) || (seen.add(z), out.push(u)); }
      return out;
    }
    function hoMergeRec(a, b) {
      if (!a || !a.items) return b;
      if (!b || !b.items) return a;
      a = unzipRec(structuredClone(a)), b = unzipRec(structuredClone(b));
      const bNew = (b.lastAt || 0) > (a.lastAt || 0), out = bNew ? { ...b } : { ...a }, items = {};
      for (const id of new Set([...Object.keys(a.items), ...Object.keys(b.items)])) {
        const x = a.items[id], y = b.items[id];
        if (!x || !y) { items[id] = x || y; continue; }
        const n = hoNewer(x, y) ? { ...y } : { ...x }, o = n === y ? x : y;
        n.firstSeen = Math.min(x.firstSeen || Infinity, y.firstSeen || Infinity), Number.isFinite(n.firstSeen) || delete n.firstSeen;
        if (x.lo || y.lo) { const lo = { ...(x.lo || {}) }; for (const [g, p] of Object.entries(y.lo || {})) (!(g in lo) || p < lo[g]) && (lo[g] = p); n.lo = lo; }
        !n.usr && o.usr && (n.usr = o.usr);
        items[id] = n;
      }
      out.items = items;
      out.events = hoUnionArr(a.events, b.events, hoEvKey).sort((p, q) => (p.at || 0) - (q.at || 0));
      out.log = hoUnionArr(a.log, b.log, (g) => g && g.at).sort((p, q) => (p.at || 0) - (q.at || 0)).slice(-30);
      out.lastAt = Math.max(a.lastAt || 0, b.lastAt || 0);
      return out;
    }
    function hoMergeMap(a, b, pick) {
      if (!a || typeof a !== "object" || Array.isArray(a)) return b;
      if (!b || typeof b !== "object" || Array.isArray(b)) return a;
      const out = { ...a };
      for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v;
      return out;
    }
    // 1つのキーを合わせる（k は Ct を除いた名前）
    function hoMergeKey(k, a, b) {
      if (b == null) return a;
      if (a == null) return b;
      if (isRecKey(k)) return hoMergeRec(a, b);
      if (k === "lastlive") return hoMergeMap(a, b, (x, y) => (hoNewer(x, y) ? y : x));
      if (k === "cartHist") { const sc = (v) => Math.max((v && v.seen) || 0, (v && v.goneAt) || 0, (v && v.addAt) || 0, (v && v.markAt) || 0); return hoMergeMap(a, b, (x, y) => { const win = sc(y) > sc(x) ? y : x, lo = win === y ? x : y; return lo && lo.markAt && lo.markAt > ((win && win.markAt) || 0) && lo.markAt >= ((win && win.addAt) || 0) ? { ...win, mark: !!lo.mark, markAt: lo.markAt } : win; }); }   // 4.10.398：削除マークは、どちらの端末で付け外ししても新しい方を残す   // 4.10.321
      if (isSoldMonth(k)) return hoMergeMap(a, b, (x, y) => (y && y.sure && !(x && x.sure) ? y : x));
      if (k === "sold.months") return [...new Set([...(a || []), ...(b || [])])].sort();
      if (k === "evq") return hoMergeMap(a, b, (x, y) => hoUnionArr(x, y, hoEvKey));
      if (k.startsWith("ev.")) return hoUnionArr(a, b, hoEvKey);
      if (Array.isArray(a) && Array.isArray(b)) return hoUnionArr(a, b, (u) => JSON.stringify(u));
      if (typeof a === "object" && typeof b === "object") return hoMergeMap(a, b, (x, y) => (typeof x === "number" && typeof y === "number" ? Math.max(x, y) : hoNewer(x, y) ? y : x));
      return a;   // 数・文字（設定など）はこの端末のまま
    }
    function hoImport(o, say) {
      say("今の記録を取っておいています…");
      return hoDump().then((bak) => idbPut(HO_BAK, bak)).then(() => (say("合わせています…"), hoMerge(o, true))).then((n) => `合わせました（${n}件）。検索ページを開き直すと反映されます`);
    }
    // 4.10.294：合わせる本体。live のときは、開いているページの手元の写しも合わせた中身に入れ替える（開き直さなくても新しい記録を使う）
    function hoMerge(o, live) {
      return Promise.resolve().then(async () => {
        const strip = (k) => (String(k).startsWith(Ct) ? String(k).slice(Ct.length) : String(k));
        let ng = 0, ni = 0;
        // Tampermonkey 側
        for (const [k, v] of Object.entries(o.gm || {})) {
          const kk = strip(k);
          if (HO_SKIP(kk)) continue;
          let cur = null;
          try { cur = GM_getValue(k, null); } catch (e) {}
          const m = hoMergeKey(kk, isRecKey(kk) && cur ? unzipRec(structuredClone(cur)) : cur, v);
          try { GM_setValue(k, isRecKey(kk) ? zipRec(m) : m), EC.delete(k), syMark("g:" + k), ng++; } catch (e) {}
          await syPace();
        }
        // 別の保存場所
        const list = (o.idb || []).filter(([k]) => k !== HO_BAK && !String(k).startsWith("run.") && !String(k).startsWith("sync."));
        return list.reduce((p, [k, v]) => p.then(() => idbGet(k).then((cur) => {
          const kk = strip(k), m = hoMergeKey(kk, cur, v);
          ni++;
          if (live && RECMEM.has(k)) { RECMEM.set(k, isRecKey(kk) ? unzipRec(structuredClone(m)) : structuredClone(m)); isSoldMonth(kk) && SOLDBASE.set(k, structuredClone(m)); EC.delete(k); }
          return idbPut(k, m);
        })), Promise.resolve()).then(() => ng + ni);
      });
    }
    function hoRestore(say) {
      return idbGet(HO_BAK).then((bak) => {
        if (!bak || bak.fmt !== HO_FMT) throw new Error("戻せる記録がありません");
        say("戻しています…");
        if (typeof GM_listValues === "function") for (const k of GM_listValues()) { const kk = String(k).startsWith(Ct) ? String(k).slice(Ct.length) : String(k); HO_SKIP(kk) || k in bak.gm || GM_deleteValue(k); }
        for (const [k, v] of Object.entries(bak.gm || {})) { try { GM_setValue(k, v); } catch (e) {} }
        return idbAllEntries().then((all) => {
          const keep = new Set((bak.idb || []).map(([k]) => k));
          return Promise.all(all.filter(([k]) => k !== HO_BAK && !k.startsWith("run.") && !keep.has(k)).map(([k]) => idbDel(k)));
        }).then(() => (bak.idb || []).reduce((p, [k, v]) => p.then(() => idbPut(k, v)), Promise.resolve())).then(() => {
          EC.clear(), RECMEM.clear(), RECDIRTY.clear();
          return `読み込む前（${ht(bak.at)}）に戻しました。ページを開き直すと反映されます`;
        });
      });
    }
    // 4.10.294：自動連携（GitHub の非公開 Gist を間の保管場所にする）。鍵（トークン）は端末の中だけ。じゃんぱらへの通信は増やさない
    const SY_FILE = "jprush-sync.txt", SY_DESC = "JP RUSH sync (jprush-sync)", SY_GAP = 30 * 6e4;
    // 4.10.350：差分の同期。いつもの Gist には「目印（meta）」と「前回の土台からの変更分（patch）」だけ。全部（土台）は別の Gist に置き、1日1回か変更分が大きくなった時だけ送り直す
    const SY_META = "jprush-sync-meta.txt", SY_PATCH = "jprush-sync-patch.txt", SY_BASE = "jprush-sync-base.txt", SY_DESC_B = "JP RUSH sync base (jprush-sync-base)", SY_REBASE = 864e5, SY_PMAX = 5e5;
    const syHash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return (h >>> 0).toString(36) + ":" + str.length; };
    // 4.10.360：同期の重い作業は細かく区切って、合間に画面を動かす（タイマーではなく MessageChannel で。見えていないタブでも遅くならない）
    const syYield = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
    let syT = 0;
    const syPace = async () => { if (performance.now() - syT > 25) { await syYield(); syT = performance.now(); } };
    const syPhase = async (k, fn) => { const t = performance.now(); try { return await fn(); } finally { perfAdd("同期：" + k, performance.now() - t); } };
    const syHashesA = async (o) => { const h = {}; for (const [k, v] of Object.entries((o && o.gm) || {})) { h["g:" + k] = syHash(JSON.stringify(v)); await syPace(); } for (const [k, v] of (o && o.idb) || []) { h["i:" + k] = syHash(JSON.stringify(v)); await syPace(); } return h; };
    const syHashes = (o) => { const h = {}; for (const [k, v] of Object.entries((o && o.gm) || {})) h["g:" + k] = syHash(JSON.stringify(v)); for (const [k, v] of (o && o.idb) || []) h["i:" + k] = syHash(JSON.stringify(v)); return h; };
    const syFileText = (fl) => (!fl ? Promise.resolve(null) : fl.truncated && fl.raw_url ? syReq("GET", fl.raw_url, null, true) : Promise.resolve(fl.content));
    const syTok = () => E("syncTok", ""), syInfo = () => E("syncInfo", {}) || {};
    function syReq(method, url, body, raw) {
      return new Promise((res, rej) => {
        if (typeof GM_xmlhttpRequest !== "function") return rej(new Error("この Tampermonkey では外部と通信できません"));
        const headers = raw ? {} : { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + syTok() };
        body != null && (headers["Content-Type"] = "application/json");
        GM_xmlhttpRequest({ method, url, headers, data: body != null ? JSON.stringify(body) : undefined, timeout: 6e4,
          onload: (r) => r.status >= 200 && r.status < 300 ? res(raw ? r.responseText : (r.responseText ? JSON.parse(r.responseText) : {})) : rej(new Error(r.status === 401 ? "鍵（トークン）が違うか、期限が切れています" : r.status === 404 ? "保管場所が見つかりません（鍵の許可に Gist が入っているか確認してください）" : "GitHub の返事 " + r.status)),
          onerror: () => rej(new Error("GitHub につながりませんでした")), ontimeout: () => rej(new Error("GitHub の返事が遅すぎました")) });
      });
    }
    function syB64(u8) { let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); }
    function syEncode(o) {
      const text = JSON.stringify(o);
      if (typeof CompressionStream !== "function") return Promise.resolve("json:" + text);
      return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer().then((b) => "jpz1:" + syB64(new Uint8Array(b)));
    }
    function syDecode(s) {
      s = String(s || "");
      if (s.startsWith("json:")) return Promise.resolve(JSON.parse(s.slice(5)));
      if (!s.startsWith("jpz1:")) return Promise.resolve(null);
      const bin = atob(s.slice(5)), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"))).text().then((t) => JSON.parse(t));
    }
    function syFind() {
      const id = E("syncGist", "");
      if (id) return Promise.resolve(id);
      return syReq("GET", "https://api.github.com/gists?per_page=100").then((list) => {
        const g = (list || []).find((x) => x && x.description === SY_DESC && x.files && (x.files[SY_FILE] || x.files[SY_META]));
        if (g) return $("syncGist", g.id), g.id;
        return syReq("POST", "https://api.github.com/gists", { description: SY_DESC, public: false, files: { [SY_FILE]: { content: "init" } } }).then((n) => ($("syncGist", n.id), n.id));
      });
    }
    let syBusy = false;
    function syncNow(why, say) {
      say = say || (() => {});
      if (!syTok()) return Promise.reject(new Error("鍵（トークン）が入っていません"));
      if (syBusy) return Promise.resolve("連携中です");
      // 別のタブが連携中なら待たない（2分で切れる目印）
      const lk = E("syncLock", 0);
      if (lk && w() - lk < 12e4) return Promise.resolve("別のタブで連携中です");
      syBusy = true, $("syncLock", w()), say("連携しています…");
      let gid = "";
      const run = async () => {
        gid = await syFind();
        const g = await syReq("GET", "https://api.github.com/gists/" + gid), F = (g && g.files) || {};
        // 4.10.360：前回の同期から向こうが変わっていなければ、受け取って合わせる作業を飛ばす（同じ変更分を10分ごとに合わせ直していて重かった）
        const gv = (g && g.history && g.history[0] && g.history[0].version) || "", local0 = (await idbGet("sync.base").catch(() => null)) || {}, same = !!gv && gv === local0.gv;
        let legacy = false;
        // 前の版（全部を1つのファイルで送っていた）の分が残っていれば、まず合わせる
        if (!same && F[SY_FILE] && F[SY_FILE].content !== "init") { const o = await syFileText(F[SY_FILE]).then(syDecode).catch(() => null); o && o.fmt === HO_FMT && (await hoMerge(o, true)), legacy = true; }
        let meta = null;
        try { meta = F[SY_META] ? JSON.parse(await syFileText(F[SY_META])) : null; } catch (e) { meta = null; }
        let local = (await idbGet("sync.base").catch(() => null)) || {};
        // 土台が新しくなっていたら、土台を受け取って合わせる
        if (!same && meta && meta.bid && meta.baseGist && meta.bid !== local.bid) {
          say("土台を受け取っています…");
          const gb = await syReq("GET", "https://api.github.com/gists/" + meta.baseGist), base = await syFileText(gb && gb.files && gb.files[SY_BASE]).then(syDecode).catch(() => null);
          if (base && base.fmt === HO_FMT) { await syPhase("土台を合わせる", () => hoMerge(base, true)); local = { bid: meta.bid, gidB: meta.baseGist, at: meta.at || w(), h: null, pk: [], fullAt: w() }; await idbPut("sync.base", local);   /* 4.10.431：土台を受け取った後に全部を比べ直さない（受け取るたびに数十秒止まり、Fold7 では同期が終わらなかった）。こちらの変更は「変わった印」で送る */ }
        }
        // 変更分（同じ土台のもの）を合わせる
        if (!same && F[SY_PATCH] && local.bid) { const p = await syPhase("変更分を受け取る", () => syFileText(F[SY_PATCH]).then(syDecode).catch(() => null)); p && p.fmt === HO_FMT && p.bid === local.bid && (await syPhase("変更分を合わせる", () => hoMerge(p, true))); }
        // 送る：土台から変わった所だけ
        // 4.10.361：ふだんは「変わった記録＋前回送った分」だけ読む。全部を読むのは1時間に1回・自分で押した時・初めての時
        // 4.10.360：土台（全部）の送り直しは、初めて・前の版から・画面を見ていない時・3分さわっていない時・自分で押した時だけ（見ている間に何十秒も止まっていた）
        let idle = false;
        try { idle = w() - Math.max(lastInput || 0, PERF.t0) > 18e4; } catch (e) {}   // 3分以上さわっていない
        const night = syQuiet();   // 4.10.426：1時〜14時（触らない時間）
        const canRebase = !local.bid || legacy || why === "full" || (night && (document.hidden || idle));   // 4.10.425：土台の送り直しも夜中か「全部を合わせる」の時だけ
        // 4.10.409：「今すぐ同期」も変わった分だけ。全部を読んで比べるのは、初めて・前回の変更分が大きかった時・1時間に1回（画面を見ていない時か3分さわっていない時）だけ
        // 4.10.425：全部を読んで比べる重い同期は、初めての時・「全部を合わせる」を押した時・触らない時間（1〜14時）に画面を見ていない時だけ（半日に1回）（昼間に何十秒も止まっていた）
        const dSnap = syDirtySnap(), full = !local.bid || !Array.isArray(local.pk) || !local.fullAt || why === "full" || (why === "auto" && night && (document.hidden || idle) && w() - local.fullAt > 12 * 36e5);
        const D = full ? await syPhase("全部を読む", () => hoDump()) : await syPhase("変わった分を読む", () => syDumpKeys(new Set([...dSnap, ...local.pk])));
        const pg = {}, pi = [];
        let H = null;
        if (full) {
          H = await syPhase("比べる", () => syHashesA(D));
          const lh = local.h || {};
          for (const [k, v] of Object.entries(D.gm || {})) H["g:" + k] !== lh["g:" + k] && (pg[k] = v);
          for (const [k, v] of D.idb || []) H["i:" + k] !== lh["i:" + k] && pi.push([k, v]);
        } else {
          // 4.10.409：変わった印の付いた物（＋前回送った分）は比べずにそのまま送る（比べるのに10秒かかっていた）
          Object.assign(pg, D.gm || {});
          for (const kv of D.idb || []) pi.push(kv);
        }
        const encP = await syPhase("まとめる", () => syEncode({ fmt: HO_FMT, v: 1, ver: Jt, at: w(), bid: local.bid || "", gm: pg, idb: pi }));
        if (full && canRebase && (!local.bid || legacy || encP.length > SY_PMAX || w() - (local.at || 0) > SY_REBASE)) {
          say("土台を送り直しています…");
          const encB = await syPhase("土台をまとめる", () => syEncode(D));
          let gidB = local.gidB || (meta && meta.baseGist) || "";
          if (gidB) await syReq("PATCH", "https://api.github.com/gists/" + gidB, { files: { [SY_BASE]: { content: encB } } });
          else gidB = (await syReq("POST", "https://api.github.com/gists", { description: SY_DESC_B, public: false, files: { [SY_BASE]: { content: encB } } })).id;
          const bid = w().toString(36) + Math.random().toString(36).slice(2, 8), at = w();
          const files = { [SY_META]: { content: JSON.stringify({ bid, baseGist: gidB, at }) }, [SY_PATCH]: { content: "empty" } };
          legacy && (files[SY_FILE] = { content: "init" });
          const r2 = await syReq("PATCH", "https://api.github.com/gists/" + gid, { files });
          await idbPut("sync.base", { bid, gidB, at, h: H, pk: [], fullAt: w(), gv: (r2 && r2.history && r2.history[0] && r2.history[0].version) || "" });
          syDirtyClear(dSnap);
          return encB.length;
        }
        const pf = { [SY_PATCH]: { content: encP } };
        const r1 = await syPhase("送る", () => syReq("PATCH", "https://api.github.com/gists/" + gid, { files: pf }));
        try {
          const lb = (await idbGet("sync.base").catch(() => null)) || local;
          if (lb.bid === local.bid) {
            lb.gv = (r1 && r1.history && r1.history[0] && r1.history[0].version) || "";
            lb.pk = Object.keys(pg).map((k) => "g:" + k).concat(pi.map(([k]) => "i:" + k)), full && (lb.fullAt = w());
            lb.plen = encP.length;   // 4.10.409：次の同期で全部を読み直すかの目安
            await idbPut("sync.base", lb);
          }
          syDirtyClear(dSnap);
        } catch (e) {}
        return encP.length;
      };
      return run(
      ).then((n) => {
        const msg = `連携しました（${T(w())}・${n >= 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB"}）`;
        $("syncInfo", { at: w(), ok: true, why, msg });
        return msg;
      }).catch((e) => {
        const msg = "連携できませんでした：" + (e && e.message || e);
        $("syncInfo", { at: w(), ok: false, why, msg });
        throw new Error(msg);
      }).finally(() => { syBusy = false, $("syncLock", 0); });
    }
    // 検索ページの記録が終わった後（保存が書き終わるのを待ってから）。前回から10分以上たっている時だけ
    // ===== 4.10.373：AI用データ（同期とは別の Gist「JP RUSH AI data (jprush-ai)」） =====
    // ChatGPT・Claude のどちらも同じ住所で読めるように、JSON と説明書（README.md）を置く。端末の種類（pc/tablet/phone）ごとにファイルを分ける。
    // ・searches-<種類>[-N].json … 毎時の検索の記録まるごと（全商品・出来事・台帳の状態）。検索の端末で、毎時の検索が終わった後（48分〜27分）に1時間1回
    // ・cart-<種類>.json … カートの中・カート履歴7日・見張り。カート画面で30分に1回
    // ・status-<種類>.json … 版・同期の状態・自動再カートの記録・計測。上のどちらかを送る時に一緒に
    // 材料は手元の記録と台帳だけ（商品ページを新しく読まない）。毎時28分〜47分は何もしない。鍵（トークン）・ログイン情報は入れない
    const AI_DESC = "JP RUSH AI data (jprush-ai)", AI_MAXF = 6e5;
    let aiBusy = false;
    const devKind = () => (/Android|iPhone|iPad|Mobile/.test(navigator.userAgent) ? (Math.min(innerWidth, innerHeight) >= 600 ? "tablet" : "phone") : "pc");
    const aiIso = (t) => (t ? new Date(t).toISOString() : null);
    const aiReadme = () => `# JP RUSH AI data

じゃんぱら（janpara.co.jp）の検索結果とカートの記録を、JP RUSH（Tampermonkey のスクリプト）が自動で書き出したもの。ChatGPT・Claude など、どの AI でも読めるように JSON にしてある。

## ファイル
- index-<端末>.json … その端末の検索ファイルの目次（検索条件・最後に検索した時刻・ファイル名）。まずこれを読む
- searches-<端末>-<検索>.json … 検索条件ごとに1つ。直近3日に動きのあった商品（新着・復活・値下げ・在庫増・売切れ表示・初めて見た）。商品ごとに出来事（events）と台帳（ledger）を付ける。まずこれを読む
- catalog-<端末>-<検索>[-N].json … 検索条件ごとの全商品の一覧（台帳なし）。見落とし探し用。約1MB ごとに -2, -3 … に分ける。<検索> は searches と同じ記号（中の search に条件が書いてある）
- cart-<端末>.json … 今のカートの中身（入れた時刻）、カート履歴（直近7日）、見張り中の商品
- status-<端末>.json … スクリプトの版、最終更新、同期の状態、自動再カートの記録、重さの計測
- 端末：pc / tablet / phone（同じ種類の端末が2台あると後から書いた方が残る）

## 読み方の注意（大事）
- 値が無い項目は省いてある（false・空も省く）。ledger が "未取得" の商品は状態を推測で埋めないこと
- items[].sr は個体番号（SRCODE）。型番（ITMCODE）の一覧で在庫が複数の時は sr が null で、units に分かっている個体が入る
- items[].soldOut＝true は「一覧で SOLD OUT 表示」というだけ。じゃんぱらの一覧は「商談中（誰かのカートの中）」と「完売」を区別しない。売れたとは限らない
- 商談中か完売かが確定しているのは ledger.st（stock＝在庫あり／nego＝商談中／sold＝完売）が入っている時だけ。ledger.stAt がその確認時刻
- events の種類：NEW＝新着、REST＝復活（売切れ表示から戻った）、BACK＝戻り、PRICE＝値下げ、STOCK＝在庫増。at は検出時刻（毎時の検索で見つけた時刻なので、実際の出品時刻より遅れることがある）
- じゃんぱらの「新着」表示や新着順は当てにならないことがある。events にない商品でも、firstSeen（JP RUSH が初めて見た時刻）が新しければ実質的な新着
- ledger が "未取得" の商品は、状態（傷・付属品・保証など）が分からない。推測で埋めないこと
- ledger.cond.notes は商品ページの状態コメントの原文。要約しないで読むこと
- 価格は税込みの円。prices は { 区分: 価格 }（中古・訳あり など）。ledger.prices は [時刻, 価格] の履歴
- 時刻は ISO 8601（UTC）。日本時間は +9 時間
- 自動再カート：じゃんぱらのカートは入れてから60分で消える。JP RUSH は残り10分で「削除→入れ直し」をして持ち続ける。cart.items[].firstSeen はその時の入れ直し時刻
`;
    // 4.10.375：検索の記録は8,000件・6MBになるので分ける。
    // searches-<端末>.json＝直近3日に動きのあった商品（新着・復活・値下げ・在庫増・売切れ表示・初めて見た）を台帳つきで
    // catalog-<端末>[-N].json＝全商品の一覧（台帳なし・短い形）を 0.8MB ずつ
    const aiUrl = (sr, itm, u) => (sr ? "https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + sr : itm ? "https://www.janpara.co.jp/sale/search/detail/?ITMCODE=" + itm : u);
    const aiClean = (o) => { for (const k of Object.keys(o)) (o[k] === null || o[k] === undefined || o[k] === false || (Array.isArray(o[k]) && !o[k].length)) && delete o[k]; return o; };
    // 4.10.403：検索ごとに別のファイル名（searches-<端末>-<検索>.json・catalog-<端末>-<検索>[-N].json）。
    //          検索ごとに別のタブで動かしていると、同じ名前に上書きし合い、前のタブのファイルを消してもいた（3検索のうち1つしか残っていなかった）
    const aiSid = (k) => String(k).slice((Ct + "s.").length).replace(/[^0-9A-Za-z_-]/g, "").slice(0, 24) || "x";
    async function aiSearchesFiles(now, only) {
      const recs = [];
      for (const [k, v] of RECMEM) String(k).startsWith(Ct + "s.") && (!only || only.has(k)) && v && v.items && v.signature && now - (v.lastAt || 0) <= 864e5 && recs.push([k, v]);
      if (!recs.length) return [];
      const files = [];
      for (const r of recs) for (const f of await aiSearchFiles1(now, r)) files.push(f);
      return files;
    }
    async function aiSearchFiles1(now, rec) {
      const recs = [rec], sid = aiSid(rec[0]);
      const from = now - 3 * 864e5, seen = (() => { try { return rtR(); } catch (e) { return {}; } })(), kind = devKind();
      const head = { device: kind, version: Jt, generatedAt: aiIso(now), note: "README.md を先に読むこと" };
      const recent = [], catalog = [], wantLg = new Set();
      for (const [k, v] of recs) {
        const evBy = {};
        for (const e of v.events || []) e && e.at >= from && (evBy[e.item] = evBy[e.item] || []).push(e);
        const label = qLabel(v.signature), base = { search: label, searchLastAt: aiIso(v.lastAt) };
        const rows = [], hot = [];
        for (const [id, it] of Object.entries(v.items)) {
          if (!it) continue;
          const sr = String(srOf(it.url) || it.usr || "") || null, itm = itmOf(it.url) || null, evs = evBy[id] || [];
          const row = aiClean({ id, sr, itm, name: it.name, url: aiUrl(sr, itm, it.url), prices: it.prices || null, stock: it.stock ?? null, soldOut: !!it.soldOut, soldShownAt: aiIso(it.soldEvAt), rank: it.rank || null, page: it.rank && it.line ? Math.ceil(it.rank / it.line) : null, firstSeen: aiIso(it.firstSeen), lastSeen: aiIso(it.lastSeen), units: it.lo && Object.keys(it.lo).length ? it.lo : null, readByUser: !!seen[id] });
          rows.push(row);
          const active = evs.length || (it.firstSeen || 0) >= from || (it.soldEvAt || 0) >= from;
          if (active) { sr && wantLg.add(sr); hot.push({ ...row, events: evs.map((e) => aiClean({ type: e.type, at: aiIso(e.at), from: e.from ?? null, to: e.to ?? null, why: e.why || null })) }); }
        }
        catalog.push({ ...base, items: rows }), recent.push({ ...base, items: hot.sort((a, b) => (b.events.length ? Date.parse(b.events[b.events.length - 1].at) : 0) - (a.events.length ? Date.parse(a.events[a.events.length - 1].at) : 0)) });
      }
      // 台帳（状態・商談中か完売かの確認）は「動きのあった商品」にだけ付ける
      const lg = await lgMany([...wantLg]).catch(() => new Map());
      for (const s of recent) for (const r of s.items) {
        const L = r.sr && lg.get(String(r.sr));
        r.ledger = L ? aiClean({ st: L.st || null, stAt: aiIso(L.stAt), shop: L.shop || null, price: L.price || null, priceHistory: (L.prices || []).map(([t, p]) => [aiIso(t), p]), cond: L.cond ? aiClean({ ...L.cond, at: aiIso(L.cond.at) }) : null, firstAt: aiIso(L.firstAt), lastAt: aiIso(L.lastAt) }) : "未取得";
      }
      const files = [[`searches-${kind}-${sid}.json`, JSON.stringify({ kind: "searches-recent", ...head, searchId: sid, days: 3, searches: recent })]];
      // 全商品の一覧は約1MB ずつ（1つの検索が大きい時は商品の途中で分ける）
      const parts = [];
      let cur = [], size = 0;
      for (const s of catalog) {
        let chunk = { search: s.search, searchLastAt: s.searchLastAt, items: [] };
        for (const r of s.items) {
          const n = JSON.stringify(r).length + 1;
          if (size + n > AI_MAXF && (chunk.items.length || cur.length)) { chunk.items.length && cur.push(chunk), parts.push(cur), cur = [], size = 0, chunk = { search: s.search, searchLastAt: s.searchLastAt, items: [] }; }
          chunk.items.push(r), size += n;
        }
        chunk.items.length && cur.push(chunk);
      }
      cur.length && parts.push(cur);
      parts.forEach((list, i) => files.push([`catalog-${kind}-${sid}${i ? "-" + (i + 1) : ""}.json`, JSON.stringify({ kind: "catalog", ...head, searchId: sid, part: i + 1, parts: parts.length, searches: list })]));
      return files;
    }
    async function aiCartFile(now) {
      const C = E("cart", { codes: {} }) || { codes: {} }, H = E("cartHist", {}) || {}, W = E("cartWatch", {}) || {}, dv = devId();
      // 4.10.406：カートとカート履歴の商品に、商品ページの状態コメント（原文）を付ける。無い物は condStatus＝"未取得"
      const codes = [...new Set([...Object.keys(C.codes || {}), ...Object.keys(H)])], LG = await lgMany(codes).catch(() => new Map());
      const condOf = (sr) => { const L = LG.get(String(sr)), c = L && L.cond; if (!c) return { condStatus: "未取得" }; const has = (c.notes && c.notes.length) || c.cond || c.rank || c.acc; return { condStatus: has ? "取得済" : "記載なし", cond: aiClean({ cond: c.cond || null, rank: c.rank || null, acc: c.acc || null, grt: c.grt || null, notes: c.notes && c.notes.length ? c.notes : null, specs: c.specs && c.specs.length ? c.specs : null, at: aiIso(c.at) }) }; };
      return [`cart-${devKind()}.json`, JSON.stringify({
        kind: "cart", device: devKind(), deviceId: dv, version: Jt, generatedAt: aiIso(now), holdMinutes: CART_HOLD / 6e4,
        items: Object.entries(C.codes || {}).map(([sr, v]) => ({ ...condOf(sr), sr, name: v.name || null, price: v.price || null, store: v.store || null, url: v.url || null, firstSeen: aiIso(v.firstSeen), expiresAt: v.firstSeen ? aiIso(v.firstSeen + CART_HOLD) : null })),
        history: Object.entries(H).map(([sr, v]) => ({ ...condOf(sr), sr, name: v.name || null, price: v.price || null, store: v.store || null, url: v.url || null, addAt: aiIso(v.addAt), lastSeen: aiIso(v.seen), goneAt: aiIso(v.goneAt), state: v.sold ? "sold" : v.mark ? "deletedByUser" : v.goneAt ? (v.goneAt - (v.addAt || 0) >= CART_HOLD ? "expired" : "goneBeforeExpiry") : "inCart", soldCheckedAt: aiIso(v.sold || (v.chk && v.chk.at)), check: v.chk ? { st: v.chk.st, at: aiIso(v.chk.at) } : null, otherDevice: !!(v.dev && v.dev !== dv) })),
        watching: Object.entries(W).map(([sr, v]) => ({ sr, name: v.name || null, since: aiIso(v.since), why: v.why || null, status: v.st || null, next: aiIso(v.next) })),
      })];
    }
    function aiStatusFile(now) {
      let perf = "";
      try { perf = perfReport(); } catch (e) {}
      return [`status-${devKind()}.json`, JSON.stringify({ kind: "status", device: devKind(), version: Jt, generatedAt: aiIso(now), page: location.pathname, sync: E("syncInfo", {}) || {}, autoRecart: !!E("autoRecart", false), condCloud: (() => { const q = E("condCloud", {}) || {}; return { at: aiIso(q.at), copied: q.n || 0, total: q.total || 0 }; })(), autoRecartLog: (E("autoRecartHist", []) || []).slice(-300), recartDiag: E("rcDiag", []) || [], aiLast: E("aiLast", {}) || {}, perf })];
    }
    async function aiGistId() {
      const id = E("aiGist", "");
      if (id) return id;
      const list = await syReq("GET", "https://api.github.com/gists?per_page=100");
      const g = (list || []).find((x) => x && x.description === AI_DESC);
      if (g) return $("aiGist", g.id), g.owner && $("aiAddr", `https://gist.github.com/${g.owner.login}/${g.id}`), g.id;
      const n = await syReq("POST", "https://api.github.com/gists", { description: AI_DESC, public: false, files: { "README.md": { content: aiReadme() } } });
      $("aiGist", n.id), n.owner && $("aiAddr", `https://gist.github.com/${n.owner.login}/${n.id}`);
      return n.id;
    }
    async function aiTick(force) {
      if (aiBusy || !syTok()) return;
      const now = w(), m = new Date(now).getMinutes(), last = E("aiLast", {}) || {};
      if (!force && m >= 28 && m <= 47) return;   // 毎時の検索の間は何もしない
      // 4.10.403：検索ごとに「前に書いた時刻」を持つ（別のタブが書いても、自分の検索の分は止まらない）
      const LS = last.s || {}, want = new Set();
      for (const [k, v] of RECMEM) { if (!String(k).startsWith(Ct + "s.") || !v || !v.items) continue; const t = LS[aiSid(k)] || 0; (v.lastAt || 0) > t && (force || now - t > 50 * 6e4) && want.add(k); }
      const doS = want.size > 0;
      const doC = cartPage() && (force || now - (last.cart || 0) > 30 * 6e4);
      if (!doS && !doC) return;
      aiBusy = true;
      const t0 = performance.now();
      try {
        const files = {};
        if (doS) for (const [n, c] of await aiSearchesFiles(now, want)) files[n] = { content: c };
        if (doC) { const [n, c] = await aiCartFile(now); files[n] = { content: c }; }
        const LS2 = { ...((E("aiLast", {}) || {}).s || {}) }; for (const k of want) LS2[aiSid(k)] = now;
        const nl = { ...(E("aiLast", {}) || {}), ...(doS ? { search: now, s: LS2 } : {}), ...(doC ? { cart: now } : {}), ms: Math.round(performance.now() - t0), ok: true, at: now };
        $("aiLast", nl);
        { const [n, c] = aiStatusFile(now); files[n] = { content: c }; }
        files["README.md"] = { content: aiReadme() };
        // 前に書いた分割ファイルで、今回なくなったものは消す（同じ端末の種類の searches/catalog だけ）
        if (doS) {
          // 消すのは、同じ検索の前の分割ファイルだけ（ほかの検索・ほかのタブのファイルは消さない）。前の版の共通の名前は1回だけ消す
          let AF = E("aiFiles", {}) || {};
          if (Array.isArray(AF)) { for (const n of AF) !files[n] && (files[n] = null); AF = {}; }
          for (const k of want) { const id = aiSid(k), mine = Object.keys(files).filter((n) => files[n] && /^(searches|catalog)-/.test(n) && n.includes("-" + id)); for (const n of AF[id] || []) !files[n] && (files[n] = null); AF[id] = mine; }
          $("aiFiles", AF);
          // 4.10.405：この端末の検索ファイルの目次（AI はまずこれを読めば、どの検索のファイルがあるか分かる）
          const IX = { ...((E("aiIndex", {}) || {})) };
          for (const k of want) { const v = RECMEM.get(k) || {}; IX[aiSid(k)] = { search: qLabel(v.signature), searchLastAt: aiIso(v.lastAt), files: AF[aiSid(k)] || [], writtenAt: aiIso(now) }; }
          for (const id of Object.keys(IX)) !AF[id] && delete IX[id];
          $("aiIndex", IX);
          files[`index-${devKind()}.json`] = { content: JSON.stringify({ kind: "index", device: devKind(), version: Jt, generatedAt: aiIso(now), searches: IX }, null, 1) };
        }
        const gid = await aiGistId();
        const r = await syReq("PATCH", "https://api.github.com/gists/" + gid, { files });
        r && r.owner && $("aiAddr", `https://gist.github.com/${r.owner.login}/${gid}`);
        perfAdd("AI用データ", performance.now() - t0);
      } catch (e) {
        $("aiLast", { ...(E("aiLast", {}) || {}), ok: false, err: String(e && e.message || e).slice(0, 80), at: now });
        String(e && e.message || e).includes("404") && $("aiGist", "");
      } finally { aiBusy = false; }
    }
    setTimeout(() => { setInterval(() => { try { aiTick(); } catch (e) {} }, 6e4); }, 15e3);
    // ===== 4.10.406：カートとカート履歴の商品の状態コメントを裏で読む =====
    // 20秒に1点・1時間に40点まで・毎時の検索（28〜47分）と入れ直しの最中は読まない。読んだ物は台帳に入り、AI用データ（cart-<端末>.json）に原文で載る
    let condBusy = false;
    function condTick() {
      try {
        if (condBusy || !cartPage() || rcwBusy() || readdPend || !cartLeader()) return;
        const now = w(), m = new Date(now).getMinutes(); if (m >= 28 && m <= 47) return;
        const Q = E("condQ", {}) || {}, hr = Math.floor(now / 36e5); if ((Q.h === hr ? Q.n : 0) >= 40) return;
        const C = (E("cart", { codes: {} }) || {}).codes || {}, H = E("cartHist", {}) || {}, T = Q.t || {};
        const live = Object.keys(C), hist = Object.entries(H).filter(([c, v]) => !C[c] && v && !v.sold && !v.mark && now - (v.goneAt || v.seen || 0) < 2592e5).sort((a, b) => (b[1].goneAt || b[1].seen || 0) - (a[1].goneAt || a[1].seen || 0)).map(([c]) => c);
        const order = [...live, ...hist].filter((c) => !(T[c] && now - T[c] < 216e5));
        if (!order.length) return;
        condBusy = true;
        lgMany(order.slice(0, 60)).then((LG) => {
          const code = order.slice(0, 60).find((c) => { const L = LG.get(c); return !(L && L.cond && L.cond.at && now - L.cond.at < 2592e5); });
          if (!code) { const T2 = { ...T }; for (const c of order.slice(0, 60)) T2[c] = now; $("condQ", { ...Q, t: T2 }); return; }
          const v = C[code] || H[code] || {}, shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(code);
          const url = "https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + code + (shp ? "&SHPCODE=" + shp : "");
          let got = false;
          return cfetch(url, { credentials: "include", cache: "no-store", timeout: 3e4 }).then((r) => r.text()).then((h) => {
            const d = new DOMParser().parseFromString(h, "text/html"), du = detailUnit(d, code), P = du ? null : kn(Sn(d.body)), u = P ? P.units.find((x) => String(x.code) === code) || null : null;
            got = !!(du || u);
            if (du || u) lgCond(code, du, u, { name: N(String(d.title || "").split(/[|｜]/)[0]).replace(/の詳細$/, ""), price: (du && du.price) || (u && u.price) || "" }, "bg");
          }).catch(() => {}).finally(() => { const Q2 = E("condQ", {}) || {}, t2 = { ...(Q2.t || {}) }; t2[code] = now; for (const c of Object.keys(t2)) now - t2[c] > 6048e5 && delete t2[c]; $("condQ", { t: t2, h: hr, n: (Q2.h === hr ? Q2.n || 0 : 0) + 1, ok: (Q2.ok || 0) + (got ? 1 : 0), ng: (Q2.ng || 0) + (got ? 0 : 1), last: code, lastAt: now, lastOk: got }); });
        }).catch(() => {}).finally(() => { condBusy = false; });
      } catch (e) { condBusy = false; }
    }
    // 4.10.407：端末で裏読みはしない（重くなるため）。足りない状態はクラウド側（Parallel）で取り、cond.json から台帳に写す
    void condTick;
    // ===== 4.10.404：AI の判定を読む（非公開リポジトリ seiji1126/jp-rush-data の judge.json・読み取り専用の鍵）=====
    // 読むのは30分に1回（毎時の検索の間＝28〜47分は読まない）。カートの表とカート履歴の商品名の横に「AI 買い +¥…」を出す
    const JUDGE_URL = "https://api.github.com/repos/seiji1126/jp-rush-data/contents/judge.json";
    let judgeBusy = false;
    function judgeFetch(force) {
      const tok = E("judgeTok", ""); if (!tok || judgeBusy || typeof GM_xmlhttpRequest !== "function") return Promise.resolve(false);
      const J = E("judge", {}) || {}, now = w(), m = new Date(now).getMinutes();
      if (!force && (cartPage() || now - (J.at || 0) < 18e5 || (m >= 28 && m <= 47))) return Promise.resolve(false);   // 4.10.448：カート画面では判定の取り直しをしない（裏の通信を減らす）
      judgeBusy = true;
      return new Promise((res) => GM_xmlhttpRequest({ method: "GET", url: JUDGE_URL + "?t=" + now, timeout: 3e4,
        headers: { Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + tok },
        onload: (r) => { try { if (r.status === 200) { const o = JSON.parse(r.responseText || "{}"); $("judge", { at: now, ok: true, updatedAt: o.updatedAt || null, items: o.items || {} }); condFetchCloud(tok); res(true); } else { $("judge", { ...J, at: now, ok: false, err: r.status === 401 || r.status === 403 ? "鍵が違うか、期限が切れています" : r.status === 404 ? "judge.json が見つかりません（鍵の対象リポジトリを確認）" : "HTTP " + r.status }); res(false); } } catch (e) { res(false); } judgeBusy = false; },
        onerror: () => { judgeBusy = false; $("judge", { ...J, at: now, ok: false, err: "GitHub につながりませんでした" }); res(false); },
        ontimeout: () => { judgeBusy = false; res(false); } }));
    }
    // 4.10.407：クラウド側（Parallel）で読んだ状態コメント（cond.json）を、まだ状態の無い商品だけ台帳に写す
    function condFetchCloud(tok) {
      GM_xmlhttpRequest({ method: "GET", url: JUDGE_URL.replace("judge.json", "cond.json") + "?t=" + w(), timeout: 3e4,
        headers: { Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + tok },
        onload: (r) => {
          try {
            if (r.status !== 200) return;
            const o = JSON.parse(r.responseText || "{}"), it = o.items || {}, codes = Object.keys(it).filter((c) => /^\d{5,18}$/.test(c));
            if (!codes.length) return;
            lgMany(codes).then((LG) => {
              let n = 0;
              for (const c of codes) {
                const L = LG.get(c), x = it[c] || {}, xa = Date.parse(x.at || "") || 0;
                if (L && L.cond && L.cond.at && L.cond.at >= xa) continue;   // 端末で読んだ方が新しければそのまま
                lgCond(c, { lines: (x.notes || []).map(String), cond: x.cond || "", rank: x.rank || "", acc: x.acc || "", grt: x.grt || "" }, null, {}, "cloud"), n++;
              }
              n && $("condCloud", { at: w(), n, total: codes.length });
            }).catch(() => {});
          } catch (e) {}
        } });
    }
    const JV = { buy: ["買い", "#0a7d32", "#e6f6ea"], hold: ["保留", "#8a5a00", "#fff4d6"], skip: ["見送り", "#6b7280", "#eef0f3"] };
    function judgePaint() {
      try {
        const it = (E("judge", {}) || {}).items || {}; if (!Object.keys(it).length) return;
        const roots = [document]; const h = document.getElementById("jp3-cart"); h && h.shadowRoot && roots.push(h.shadowRoot);
        for (const R of roots) for (const a of R.querySelectorAll('a[href*="SRCODE="]')) {
          if (a.dataset.jprj || a.closest(".jprj")) continue;
          const m = /[?&]SRCODE=(\d+)/.exec(a.getAttribute("href") || ""), j = m && it[m[1]]; if (!j || !JV[j.verdict]) continue;
          if (!(a.textContent || "").trim()) continue;
          a.dataset.jprj = "1";
          const [lb, fg, bg] = JV[j.verdict], b = document.createElement("span");
          b.className = "jprj";
          b.textContent = `AI ${lb}${j.profit != null ? (j.profit >= 0 ? " +¥" : " −¥") + Math.abs(Math.round(j.profit)).toLocaleString() : ""}`;
          b.title = [j.reason, j.sell != null ? `想定売価 ¥${Math.round(j.sell).toLocaleString()}` : "", j.at ? `判定 ${new Date(j.at).toLocaleString("ja-JP")}` : "", j.by ? `by ${j.by}` : ""].filter(Boolean).join("\n");
          b.style.cssText = `display:inline-block;margin:0 0 0 6px;padding:1px 6px;border-radius:9px;font-size:11px;font-weight:700;line-height:16px;color:${fg};background:${bg};border:1px solid ${fg}33;white-space:nowrap;vertical-align:middle;cursor:help;text-decoration:none`;
          a.after(b);
        }
      } catch (e) {}
    }
    setTimeout(() => { judgePaint(); judgeFetch().then((ch) => ch && judgePaint()); setInterval(() => { judgeFetch().then((ch) => ch && judgePaint()); judgePaint(); }, 6e4); }, 4e3);
    try { window.jprushAi = { tick: (f) => aiTick(f !== false), readme: aiReadme, cartFile: () => aiCartFile(w()) }; } catch (e) {}
    // 4.10.426：同期する時間を使い方に合わせる。毎時33分の更新で触るのは〜10分ごろまでなので、毎時10〜15分に1回。
    //          1時〜14時はほとんど触らないので、その間は1時間に1回いつでも（重い全部確認もこの時間に）
    const syQuiet = () => { const h = new Date().getHours(); return h >= 1 && h < 14; };
    const syWindow = () => { const m = new Date().getMinutes(); return m >= 10 && m < 16; };
    let syTick = 0;
    function syncMaybe() {
      if (!syTok()) return;
      syTick || (syTick = setInterval(() => { try { syncMaybe(); } catch (e) {} }, 6e4));
      const i = syInfo();
      if (!(syWindow() || syQuiet())) return;
      if (i.at && w() - i.at < (syQuiet() && !syWindow() ? 36e5 : 20 * 6e4)) return;
      setTimeout(() => { if (RECDIRTY.size) return setTimeout(syncMaybe, 3e3); syncNow("auto").catch(() => {}); }, 4e3);
    }
    // 4.10.302：自動再カート。20秒ごとに、残り5分を切った（まだ切れていない）商品の「再カート」を押す。1回のページ表示で1商品1回まで
    // 4.10.328：画面を消さない機能（4.10.326）はやめた
    let stuckAt = 0, lastInput = 0;
    const pageAt = Date.now();
    ["pointerdown", "keydown", "wheel", "touchmove"].forEach((t) => addEventListener(t, () => { lastInput = Date.now(); }, { passive: true, capture: true }));   // 操作中（2分以内）は開き直さない
    // 4.10.376：当番。カート画面を2枚以上開いていても、自動再カート・見張り・カートの見張りを動かすのは当番の1枚だけ。
    // 当番が90秒止まったら（固まった・閉じた）、別の1枚が代わる。見えている画面を優先（裏のタブはブラウザに遅くされるため）
    const TAB_ID = (() => { try { let x = sessionStorage.getItem("jprTabId"); x || (x = Math.random().toString(36).slice(2, 10), sessionStorage.setItem("jprTabId", x)); return x; } catch (e) { return Math.random().toString(36).slice(2, 10); } })();
    let leaderNow = true;
    function cartLeader() {
      try {
        const now = w(), vis = document.visibilityState === "visible", L = GM_getValue(Ct + "cartLeader", null);
        const take = !L || L.id === TAB_ID || now - (L.at || 0) > 9e4 || (vis && !L.vis && now - (L.at || 0) > 5e3);
        if (take) GM_setValue(Ct + "cartLeader", { id: TAB_ID, at: now, vis });
        const L2 = GM_getValue(Ct + "cartLeader", null);
        leaderNow = !!L2 && L2.id === TAB_ID;
      } catch (e) { leaderNow = true; }
      return leaderNow;
    }
    // 4.10.377：再カートを始める残り時間（5分 → 12分）。入れた時刻の見積もりが数分ずれても間に合うように
    const RECART_LEFT = 2 * 6e4;   // 4.10.451：再カートは期限の2分前（前は10分前）
    // 4.10.384：番人。残り4分を切っても入れ直せていない商品は、働き手が生きていても画面側がまとめて入れ直す（2分に1回まで）
    function rcGuard() {
      const now = w(); if (now - (rcGuard.at || 0) < 12e4 || rcwBusy() || recovBusy) return;
      // 4.10.390：働き手が生きている間は、働き手が10分以内に触っていない商品だけ（働き手と同じ商品を同時に削除・カートインして消していた）
      const rd = E("cartReadd", {}) || {}, q = new Set([...RDQ.jobs, ...RDQ.sent].map((j) => j.code)), alive = rcwAlive();
      // 4.10.398：働き手が生きている時は、働き手が1分以上何も始めていない時だけ（画面が寝ていて起きた直後に、番人と働き手が同時に動いていた）
      if (alive && now - (RCW.lastStart || RCW.startAt || 0) < 6e4) return;
      if (alive && now - (RCW.startAt || 0) < 6e4) return;
      const late = rcItems().filter((i) => i.exp - now < (alive ? 1.5 : 3) * 6e4 && i.exp - now > -36e5 && !(rd[i.code] && now - rd[i.code] < 15e4) && !q.has(i.code) && !(alive && rcTouched(i.code) && now - rcTouched(i.code) < 6e5));
      if (!late.length) return;
      rcGuard.at = now;
      arLog(`${T(now)} 番人：間に合っていない${late.length}点をまとめて入れ直す（${late.slice(0, 3).map((i) => i.code).join("・")}）`);
      try { const m = E("cartReadd", {}) || {}; for (const i of late) m[i.code] = now; $("cartReadd", m); } catch (e) {}
      let left = late.length;
      const fin = () => { --left || setTimeout(() => { readdPend || rcwBusy() || location.reload(); }, 1500); };
      for (const i of late) {
        const d = i.del && !(i.okAt > i.recipeAt) ? i.del : null;
        RDQ.jobs.push({
          code: i.code, body: i.add,
          delReq: () => d ? cfetch(d.url, d.method === "GET" ? { credentials: "include", redirect: "manual", keepalive: true } : { method: d.method, body: new URLSearchParams(d.body), credentials: "include", redirect: "manual", keepalive: true }) : Promise.resolve(null),
          ok: () => { const t = w(); try { const c = E("cart", { codes: {} }) || { codes: {} }; c.codes = c.codes || {}; const o = { ...(c.codes[i.code] || {}) }; delete o.unsure; c.codes[i.code] = { ...o, firstSeen: t }; $("cart", c); } catch (e) {} rcBookOk(i.code, t), arLog(`${T(t)} 番人：入れ直し成功 ${String(i.name || i.code).slice(0, 20)}（${i.code}）`), fin(); },
          fail: (msg) => { arLog(`${T(w())} 番人：入れ直し失敗 ${i.code}（${String(msg).slice(0, 30)}）`), fin(); },
        });
      }
      rdqPump();
    }
    // 4.10.387：取りこぼしの自動回収。1分に1回（4.10.389）、カート履歴の「戻せる商品」（6時間以内に消えた・削除マーク無し・完売でない・この端末のカート）を
    // まとめてカートに入れる（1回40点まで）。3回入らなかった物は売れたとみて回収をやめる。どんな原因で消えても、ここで拾い直す
    const cartHasCode = (h, c) => cartCodesIn(h).has(c);
    let recovBusy = false;
    function autoRecover() {
      if (recovBusy || readdPend || rcwBusy() || RDQ.jobs.length || RDQ.sent.length || !cartPage() || !E("autoRecart", false)) return;
      const now = w(); if (now - (E("recovAt", 0) || 0) < 6e4) return;   // 4.10.389：5分 → 1分ごと
      const H = E("cartHist", {}) || {}, C = (E("cart", { codes: {} }) || {}).codes || {}, R = E("rcRecov", {}) || {}, dv = devId(), RD = E("cartReadd", {}) || {};
      const other = new Set(Object.entries(H).filter(([, v]) => v && v.dev && v.dev !== dv && !v.goneAt).map(([c]) => c));
      const DM = delMarks();
      const cand = Object.entries(H).filter(([c, v]) => !other.has(c) && !DM[c] && v && v.goneAt && now - v.goneAt < 216e5 && !v.sold && !v.mark && v.price && !C[c] && !(v.dev && v.dev !== dv) && !((R[c] || {}).n >= 3) && !(RD[c] && now - RD[c] < 9e4) && !(rcTouched(c) && now - rcTouched(c) < 9e4) && !RDQ.jobs.concat(RDQ.sent).some((j) => j.code === c)).sort((a, b) => b[1].goneAt - a[1].goneAt).slice(0, 40);
      $("recovAt", now);
      if (!cand.length) return;
      recovBusy = true;
      arLog(`${T(now)} 取りこぼしの回収：消えた${cand.length}点をまとめてカートに入れる（${cand.slice(0, 3).map(([c]) => c).join("・")}）`);
      try { for (const [c] of cand) RD[c] = now; $("cartReadd", RD); } catch (e) {}
      let i = 0;
      // 4.10.391：商品のページを読んで、今の値段・カートに入れる中身で入れる（値段が変わっていても入る。カートボタンが無ければ在庫の状態を記録）
      const st = {};
      const one = async () => { while (i < cand.length) { const [c, v] = cand[i++];
        // 4.10.439：初めの1回は保存した中身でそのまま入れる（商品ページは読まない）。入らなかった時だけ、次の回に商品ページを読み直す
        if (!((R[c] || {}).n)) { const sh0 = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(c); try { await cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body: withMeta(c, new URLSearchParams([["SRCODE", c], ["SHPCODE", sh0], ["PRICE", String(v.price)], ["REDIRECT", ""], ["QTY", "1"]])), credentials: "include", redirect: "manual", keepalive: true, timeout: 45e3 }); } catch (e) {} continue; } const shp = (/[?&]SHPCODE=(\d+)/.exec(v.url || "") || [])[1] || shpOf(c); let body = withMeta(c, new URLSearchParams([["SRCODE", c], ["SHPCODE", shp], ["PRICE", String(v.price)], ["REDIRECT", ""], ["QTY", "1"]]));
        try { const r = await cfetch("https://www.janpara.co.jp/sale/search/detail/?SRCODE=" + c + "&SHPCODE=" + shp, { credentials: "include", cache: "no-store", timeout: 3e4 }), h = await r.text(), d = new DOMParser().parseFromString(h, "text/html"), fm = [...d.querySelectorAll('form[action*="cart/add"]')].find((f) => { const x = f.querySelector('[name="SRCODE"]'); return !x || String(x.value || x.getAttribute("value") || "").replace(/\D/g, "") === c; });
          try { addMetaHarvest(d); } catch (e) {}   // 4.10.437
          if (fm) { const b = new URLSearchParams(); for (const x of fm.querySelectorAll("input[name]")) /^(hidden|text|number)$/i.test(x.type || "text") && b.set(x.name, x.getAttribute("value") || x.value || ""); b.get("SRCODE") || b.set("SRCODE", c); b.get("QTY") || b.set("QTY", "1"); b.has("REDIRECT") || b.set("REDIRECT", ""); b.get("SHPCODE") || b.set("SHPCODE", shp); b.get("PRICE") || b.set("PRICE", String(v.price)); body = b; }
          else { const tx = d.body ? d.body.textContent : ""; st[c] = /商談中/.test(tx) ? "商談中" : /完売|SOLD\s*OUT|売り?切れ|品切れ/i.test(tx) ? "完売" : "カートボタン無し"; continue; }
        } catch (e) {}
        try { await cfetch("https://www.janpara.co.jp/sale/cart/add/", { method: "POST", body, credentials: "include", redirect: "manual", keepalive: true, timeout: 45e3 }); } catch (e) {} } };
      Promise.all(Array.from({ length: Math.min(5, cand.length) }, one)).then(() => cfetch("/sale/cart/", { credentials: "include", cache: "no-store", timeout: 45e3 })).then((r) => r.text()).then((html) => {
        if (!/総合計/.test(html)) { arLog(`${T(w())} 取りこぼしの回収：カートを読めなかったので次の回で確かめる`); return; }
        const t = w(), IN = cartCodesIn(html), ok = cand.filter(([c]) => IN.has(c)), ng = cand.filter(([c]) => !IN.has(c));
        try { const c0 = E("cart", { codes: {} }) || { codes: {} }; c0.codes = c0.codes || {}; for (const [c, v] of ok) c0.codes[c] = { ...(c0.codes[c] || {}), name: v.name, price: v.price, store: v.store, url: v.url, firstSeen: t }; $("cart", c0); } catch (e) {}
        try { const R2 = E("rcRecov", {}) || {}; for (const [c] of ok) delete R2[c]; for (const [c] of ng) R2[c] = { n: ((R2[c] || {}).n || 0) + 1, at: t }; for (const c of Object.keys(R2)) t - R2[c].at > 864e5 && delete R2[c]; $("rcRecov", R2); } catch (e) {}
        const sts = ng.filter(([c]) => st[c]).map(([c]) => `${c}：${st[c]}`);
        arLog(`${T(t)} 取りこぼしの回収：${ok.length}点戻した` + (ng.length ? `・${ng.length}点は入らず（${sts.length ? sts.slice(0, 3).join("・") + "・" : ""}3回で諦める）` : ""));
        ok.length && setTimeout(() => { readdPend || rcwBusy() || location.reload(); }, 1500);
      }).catch(() => {}).finally(() => { recovBusy = false; });
    }
    function autoRecartLoop() {
      // 4.10.448：自動再カートは裏で通信するので、一度だけオフに戻す（その後は画面のスイッチでオンにできる）
      try { if (!E("ar448", false)) { E("autoRecart", false) && $("autoRecart", false); $("ar448", true); } } catch (e) {}
      // 4.10.381：押した商品は3分たてばもう一度押せる（前は開き直すまで二度と押さなかったので、失敗するとそのまま放置されていた）
      const done = new Map();
      const tick = () => {
        // 4.10.327：画面が見えていなくても動く（PC は画面が消えても動いている）。二重に押さないよう、どこかのタブが2分以内に入れ直した商品は飛ばす
        if (!E("autoRecart", false)) { try { RCW.w && rcwPlan(false); } catch (e) {} return; }
        tickMark();
        const lead = cartLeader();
        // 4.10.379：遅れの見張り。再カートの時刻を2分以上過ぎても入れ直していない商品があれば、その時の様子を記録に残す（5分に1回まで）
        try {
          const t0 = w(), C0 = (E("cart", { codes: {} }) || {}).codes || {}, rd0 = E("cartReadd", {}) || {};
          const late = Object.entries(C0).filter(([c, v]) => v && v.firstSeen && v.firstSeen + CART_HOLD - t0 < RECART_LEFT - 12e4 && v.firstSeen + CART_HOLD > t0 && !(rd0[c] && t0 - rd0[c] < 3e5));
          if (late.length && t0 - (window.__jprLateAt || 0) > 3e5) {
            window.__jprLateAt = t0;
            const L = (() => { try { return GM_getValue(Ct + "cartLeader", null); } catch (e) { return null; } })();
            const btns = new Set([...document.querySelectorAll(".jprush-readd[data-code]")].map((x) => x.dataset.code)), noBtn = late.filter(([c]) => !btns.has(c)).map(([c]) => c), inDone = late.filter(([c]) => done.has(c)).map(([c]) => c);
            arLog(`${T(t0)} 自動再カートが遅れている：${late.length}点（${late.slice(0, 3).map(([c]) => c).join("・")}）／ボタンが無い${noBtn.length}点${noBtn.length ? "（" + noBtn.slice(0, 3).join("・") + "）" : ""}／押した後${inDone.length}点／当番：${lead ? "この画面" : "別の画面（" + (L ? Math.round((t0 - L.at) / 1e3) + "秒前に応答・" + (L.vis ? "見えている" : "裏") : "不明") + "）"}／この画面：${document.visibilityState}／ボタン${document.querySelectorAll(".jprush-readd[data-code]").length}個／送信中${readdPend}`);
          }
        } catch (e) {}
        lead && AUX.watch && (() => { try { watchTick(); } catch (e) {} })();   // 4.10.451：カートの定期読み（cartPoll）は止めた（カート画面は開いた時に読む）
        // 4.10.343：立て直し。「送信中」が1分以上続いた、またはカートを読んでから10分以上たったら、開き直す
        try {
          const busy = [...document.querySelectorAll(".jprush-readd [data-jprush-busy]")].length || readdPend;
          busy ? (stuckAt || (stuckAt = w())) : (stuckAt = 0);
          if (AUX.stuckReload && stuckAt && w() - stuckAt > 12e4 && !rcwBusy()) { console.warn("[JP RUSH] 送信中のまま固まったので開き直します"), arLog(`${T(w())} 送信中のまま固まったので開き直した`), location.reload(); return; }
          // 4.10.451：30分ごとの開き直しはやめた（カート画面は開いた時に読む）
        } catch (e) {}
        // 4.10.382：働き手に予定を渡す（当番の時だけ動かす）。働き手が生きていれば、画面のボタンは押さない
        try { rcwStart(), rcwPlan(lead && !(RCW.distrustUntil > Date.now())); } catch (e) {}
        try { lead && AUX.guard && rcGuard(); } catch (e) {}
        try { lead && AUX.recover && autoRecover(); } catch (e) {}
        if (!lead) return;   // 4.10.376：当番でない画面は、ここから先（自動再カート）をしない
        if (!AUX.screenRecart || rcwAlive()) return;
        const codes = (E("cart", { codes: {} }) || {}).codes || {}, t = w(), rd = E("cartReadd", {}) || {};
        for (const wr of document.querySelectorAll(".jprush-readd[data-code]")) {
          const code = wr.dataset.code, fs = codes[code] && codes[code].firstSeen, b = wr.firstElementChild;
          if (!fs || !b || (done.has(code) && t - done.get(code) < 18e4) || b.dataset.jprushBusy || (rd[code] && t - rd[code] < 12e4)) continue;
          const left = fs + CART_HOLD - t;
          // 4.10.377：入れた時刻が分からない商品（JP RUSH 以外で入れた・初めて見た）は、すぐ再カートして時刻を確かにする
          const unsure = codes[code].unsure;
          if (!unsure && (left > RECART_LEFT || left < -6e4)) continue;
          done.set(code, t), b.click();
          const nm = (codes[code].name || code).slice(0, 24);
          arLog(`${T(t)} ${nm}（${code}）を再カート（${unsure ? "入れた時刻が分からないので" : "残り" + Math.max(0, Math.round(left / 6e4)) + "分"}）`);
          console.info("[JP RUSH] 自動再カート", code, nm);
        }
      };
      // 期限切れの欄に出た商品も見張る（自分で消した商品はこの欄に出ない）
      setTimeout(() => { try { const H = E("cartHist", {}) || {}, C = (E("cart", { codes: {} }) || {}).codes || {}; for (const x of cartExpiredLinks()) x.sr && !C[x.sr] && watchAdd(x.sr, { ...(H[x.sr] || {}), name: x.name, url: x.url }, "期限切れ", w()); } catch (e) {} }, 2500);
      // 4.10.366：見張りは20秒ごとの見回りの中だけで動かす（5秒おきはやめた）
      // 4.10.380：画面が消えている・裏に回っている間も見回りが止まらないよう、別の働き手（Worker）の時計で20秒ごとに起こす。
      // ふつうのタイマーは、見えていない画面ではブラウザに1分に1回などへ間引かれるため。両方動かし、15秒以内の重複は飛ばす
      // 4.10.382：働き手はすぐ起こして予定を渡す（最初の見回りを待たない）
      setTimeout(() => { try { E("autoRecart", false) && (rcwStart(), rcwPlan(cartLeader())); } catch (e) {} }, 300);
      let lastTick = 0;
      const tick2 = () => { const t = Date.now(); if (t - lastTick < 15e3) return; lastTick = t, tick(); };
      try { const wk = new Worker(URL.createObjectURL(new Blob(["setInterval(()=>postMessage(0),20000)"], { type: "text/javascript" }))); wk.onmessage = () => { try { tick2(); } catch (e) {} }; } catch (e) { console.warn("[JP RUSH] Worker の時計が使えません", e); }
      setInterval(tick2, 2e4), setTimeout(tick2, 3e3), document.addEventListener("visibilitychange", () => setTimeout(() => { lastTick = 0, tick2(); }, 1500));
    }
    // 置き場所：右の欄（カートツール）があればその中、無ければ「ショッピングカート」の見出しのすぐ下
    function handoffBox(parent, btnClass) {
      if (document.querySelector(".jprush-handoff")) return;
      const box = document.createElement("div"), note = document.createElement("div"), file = document.createElement("input");
      const mk = (t) => { const b = document.createElement("button"); b.type = "button", b.textContent = t; btnClass ? (b.className = btnClass) : (b.style.cssText = "font:600 14px/1.4 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP','Meiryo',sans-serif;color:#003792;background:#fff;border:1px solid #003792;border-radius:0;padding:8px 12px;cursor:pointer;flex:1;"); return b; };
      const ex = mk("引き継ぎ：書き出し"), im = mk("引き継ぎ：読み込み"), rs = mk("読み込む前に戻す");
      box.className = "jprush-handoff";
      box.style.cssText = btnClass ? "display:flex;flex-direction:column;gap:6px;" : "display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;padding:10px;border:1px solid #cdd6e4;background:#f5f7fb;";
      note.style.cssText = "flex-basis:100%;font:500 12px/1.5 system-ui,sans-serif;color:#4a5a6e;";
      note.textContent = "";   // 4.10.303：説明文は出さない（結果の知らせだけ出す）
      file.type = "file", file.accept = ".gz,.json,application/json,application/gzip", file.style.display = "none";
      const say = (t) => { note.textContent = t, note.style.display = t ? "" : "none"; };
      note.style.display = "none";
      ex.onclick = (ev) => {
        ev.preventDefault(), say("書き出しています…");
        hoDump().then((o) => hoGzip(JSON.stringify(o)).then(({ blob, ext }) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob), a.download = `jprush-handoff-${Be()}.${ext}`, document.body.appendChild(a), a.click(), a.remove(), setTimeout(() => URL.revokeObjectURL(a.href), 6e4);
          say(`書き出しました（検索 ${o.idb.filter(([k]) => isRecKey(String(k).slice(Ct.length))).length}件・${(blob.size / 1048576).toFixed(1)}MB）。このファイルをもう1台へ送って「読み込み」してください`);
        })).catch((e) => say("書き出せませんでした：" + (e && e.message || e)));
      };
      im.onclick = (ev) => { ev.preventDefault(), file.value = "", file.click(); };
      file.onchange = () => {
        const fl = file.files && file.files[0];
        if (!fl) return;
        say("読んでいます…");
        hoRead(fl).then((o) => hoImport(o, say)).then(say).catch((e) => say("読み込めませんでした：" + (e && e.message || e)));
      };
      rs.onclick = (ev) => { ev.preventDefault(), hoRestore(say).then(say).catch((e) => say("戻せませんでした：" + (e && e.message || e))); };
      // 4.10.294：自動連携の欄（鍵を貼って始める／今すぐ連携／やめる）
      const sy = document.createElement("div"), syMsg = document.createElement("div"), tok = document.createElement("input"), syGo = mk("自動連携をはじめる"), syNow = mk("今すぐ連携"), syOff = mk("自動連携をやめる");
      sy.style.cssText = "flex-basis:100%;display:flex;flex-wrap:wrap;gap:8px;align-items:center;" + (btnClass ? "flex-direction:column;align-items:stretch;" : "") + "border-top:1px solid #cdd6e4;padding-top:8px;margin-top:2px;";
      syMsg.style.cssText = "flex-basis:100%;font:500 12px/1.5 system-ui,sans-serif;color:#4a5a6e;";
      tok.type = "password", tok.placeholder = "GitHub の鍵（トークン）を貼る", tok.autocomplete = "off";
      tok.style.cssText = "flex:1 1 200px;min-width:0;height:34px;box-sizing:border-box;border:1px solid #9aa6b8;padding:0 8px;font:13px system-ui,sans-serif;";
      const syShow = () => {
        const on = !!syTok(), i = syInfo();
        tok.style.display = syGo.style.display = on ? "none" : "";
        syNow.style.display = syOff.style.display = on ? "" : "none";
        syMsg.textContent = on ? "ON" + (i.msg ? "　" + i.msg : "") : "OFF";
      };
      syGo.onclick = (ev) => {
        ev.preventDefault();
        const t = tok.value.trim();
        if (!t) return syMsg.textContent = "鍵（トークン）を貼ってください";
        $("syncTok", t), $("syncGist", ""), $("syncInfo", {});
        syncNow("start", (m) => { syMsg.textContent = m; }).then((m) => { tok.value = "", syShow(), syMsg.textContent = "自動連携をはじめました。" + m; }).catch((e) => { $("syncTok", ""), syShow(), syMsg.textContent = e.message; });
      };
      // 4.10.432：「連携中です」「別のタブで連携中です」などの返事を消さずに出す（押しても何も起きないように見えていた）
      syNow.onclick = (ev) => { ev.preventDefault(); syncNow("manual", (m) => { syMsg.textContent = m; }).then((m) => { syShow(); typeof m === "string" && /連携中/.test(m) && (syMsg.textContent = m + "（終わるまで待つか、ほかのじゃんぱらのタブを閉じてください）"); }).catch((e) => { syShow(); syMsg.textContent = "同期できませんでした：" + String((e && e.message) || e).slice(0, 60); }); };
      syOff.onclick = (ev) => { ev.preventDefault(); $("syncTok", ""), $("syncGist", ""), $("syncInfo", {}), syShow(), syMsg.textContent = "自動連携をやめました（GitHub の保管場所はそのまま残っています）"; };
      // 4.10.425：重い「全部を合わせる」は手で押す時だけ（ふだんは変わった分だけ・夜中に自動で1回）
      const syFull = mk("全部を合わせる（重い・数十秒）");
      syFull.onclick = (ev) => { ev.preventDefault(); syncNow("full", (m) => { syMsg.textContent = m; }).then(() => syShow()).catch(() => syShow()); };
      sy.append(syMsg, tok, syGo, syNow, syFull, syOff), syShow();
      // 4.10.302：自動再カート（試し）。ONの間、カートのページが前に出ていれば、残り5分を切った商品を自動で「再カート」する
      const ar = document.createElement("div"), arB = mk(""), arMsg = document.createElement("div");
      ar.style.cssText = "flex-basis:100%;display:flex;flex-wrap:wrap;gap:8px;align-items:center;" + (btnClass ? "flex-direction:column;align-items:stretch;" : "") + "border-top:1px solid #cdd6e4;padding-top:8px;margin-top:2px;";
      arMsg.style.cssText = "flex-basis:100%;font:500 12px/1.5 system-ui,sans-serif;color:#4a5a6e;";
      const arShow = () => { const on = !!E("autoRecart", false), lg = E("autoRecartLog", "") || ""; arB.textContent = "自動再カート" + (btnClass ? "\n" : "：") + (on ? "ON" : "OFF"); arB.style.background = on ? "#e6f4ea" : ""; 
        // 4.10.320：前回の記録ではなく、次に動く予定（いちばん早く消える商品の残り5分の時刻と、あと何分か）
        let nx = "";
        if (on) {
          const t = w(), ends = Object.values((E("cart", { codes: {} }) || {}).codes || {}).map((v) => v && v.firstSeen ? v.firstSeen + CART_HOLD : 0).filter((e) => e > t);
          if (ends.length) {
            const at = Math.min(...ends) - RECART_LEFT, m = Math.ceil((at - t) / 6e4);
            const hm = new Date(at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
            nx = btnClass ? (m > 0 ? `次 ${hm}\nあと${m}分` : "次 まもなく") : (m > 0 ? `次：${hm}（あと${m}分）` : "次：まもなく") + "（カートの画面を開いている間に動きます）";
          }
        }
        // 4.10.376：当番でない画面は「待機中」と出す
        on && !leaderNow && (nx = btnClass ? "待機中\n（別の画面が担当）" : "待機中：別のカート画面が自動再カートを担当しています（そちらが止まったら代わります）");
        // 4.10.329：見張り中の数
        arMsg.textContent = nx, arMsg.style.display = nx ? "" : "none", arMsg.style.whiteSpace = "pre-line";
        // 4.10.341：見張り中の内訳（押すと開く。1点ずつ「やめる」もできる）
        const WE = on ? Object.entries(E("cartWatch", {}) || {}) : [], ng = WE.filter(([, x]) => /商談中/.test(x.st || "")).length;
        wlHead.style.display = WE.length ? "" : "none", wlHead.textContent = `${wlOpen ? "▾" : "▸"} 見張り中 ${WE.length}点` + (ng ? `（商談中 ${ng}）` : "");
        wlList.style.display = WE.length && wlOpen ? "" : "none", wlList.replaceChildren();
        for (const [c, x] of WE) {
          const li = document.createElement("div"), nm = document.createElement("a"), st = document.createElement("div"), stop = document.createElement("button");
          li.style.cssText = "padding:5px 0;border-top:1px solid #e3e8ef;";
          nm.textContent = String(x.name || "商品番号 " + c).slice(0, 40), nm.href = x.url || srcodeHref(c), nm.style.cssText = "display:block;font-weight:700;color:#1f2d3d;text-decoration:none;line-height:1.35;";
          st.textContent = `${x.st || ""}（${x.why || ""}・${T(x.since)}から）`, st.style.cssText = "color:" + (/商談中/.test(x.st || "") ? "#7a5600" : "#4a5a6e") + ";";
          stop.type = "button", stop.textContent = "やめる", stop.style.cssText = "margin-top:3px;padding:2px 8px;border:1px solid #cdd6e4;border-radius:0;background:#fff;color:#4a5a6e;font:600 11px/1.6 system-ui,sans-serif;cursor:pointer;";
          stop.onclick = (ev) => { ev.preventDefault(), watchDone(c, "手動で見張りをやめた " + T(w())), arShow(); };
          li.append(nm, st, stop), wlList.append(li);
        }
        // 4.10.374：全部やめる
        if (WE.length > 1) { const all = document.createElement("button"); all.type = "button", all.textContent = `全部やめる（${WE.length}点）`, all.style.cssText = "margin-top:6px;padding:4px 10px;border:1px solid #cdd6e4;border-radius:0;background:#fff;color:#c8102e;font:700 12px/1.6 system-ui,sans-serif;cursor:pointer;"; all.onclick = (ev) => { ev.preventDefault(); const t = w(), D = E("cartWatchDone", {}) || {}; for (const [c] of WE) D[c] = { at: t, st: "手動で全部やめた " + T(t) }; $("cartWatch", {}), $("cartWatchDone", D), arShow(); }; wlList.append(all); }
      };
      const wlHead = document.createElement("button"), wlList = document.createElement("div");
      let wlOpen = false;
      wlHead.type = "button", wlHead.style.cssText = "flex-basis:100%;display:block;width:100%;white-space:normal;margin:2px 0 0;padding:2px 0;border:0;background:none;text-align:left;font:700 12px/1.5 system-ui,sans-serif;color:#003792;cursor:pointer;";
      wlList.style.cssText = "flex-basis:100%;font:500 11px/1.45 system-ui,sans-serif;color:#4a5a6e;";
      wlHead.onclick = (ev) => { ev.preventDefault(), wlOpen = !wlOpen, arShow(); };
      setInterval(arShow, 15e3);
      arB.onclick = (ev) => { ev.preventDefault(), $("autoRecart", !E("autoRecart", false)), arShow(); };
      ar.append(arB, arMsg, wlHead, wlList), arShow();
      // 4.10.304：整理。上に「自動再カート」だけ。その下の［バックアップ・同期 ▸］を押すと開く欄に、自動同期・バックアップ（保存・読み込み・戻す）・表の書き出し（CSV）をしまう。開いたかどうかは覚えておく
      icoLabel(ex, "保存", "dl"), icoLabel(im, "読み込み", "ul"), icoLabel(rs, "元に戻す", "undo");
      ar.style.borderTop = "0", ar.style.paddingTop = "0", ar.style.marginTop = "0";
      const fold = mk(""), body = document.createElement("div"), csvAnchor = document.createElement("div"), sub = (t) => { const d = document.createElement("div"); d.textContent = t; d.style.cssText = "flex-basis:100%;font:700 12px/1.6 system-ui,sans-serif;color:#33435a;margin-top:4px;"; return d; };
      body.style.cssText = "flex-basis:100%;flex-direction:" + (btnClass ? "column" : "row") + ";flex-wrap:wrap;gap:8px;border-top:1px solid #cdd6e4;padding-top:8px;";
      fold.style.flexBasis = "100%", fold.style.textAlign = "left";
      csvAnchor.style.cssText = "flex-basis:100%;height:0;";
      let open = !!E("hoOpen", false);
      const setF = () => { body.style.display = open ? "flex" : "none"; fold.textContent = (open ? "▾ " : "▸ ") + "データ管理"; };
      fold.onclick = (ev) => { ev.preventDefault(), open = !open, $("hoOpen", open), setF(); };
      syGo.textContent = "はじめる", syOff.textContent = "やめる", syNow.textContent = "今すぐ同期";
      const pf = mk("計測結果をコピー");
      pf.onclick = (ev) => { ev.preventDefault(); pf.textContent = "まとめています…"; perfReportFull().then((tx) => writeClip(tx, () => { pf.textContent = "コピーしました ✓", setTimeout(() => { pf.textContent = "計測結果をコピー"; }, 2e3); }, () => { pf.textContent = "コピーできません"; })); };
      // 4.10.372：AI用のまとめの住所（Claude などに渡す）
      const ai = mk("AI用まとめの住所をコピー");
      ai.onclick = (ev) => {
        ev.preventDefault();
        const a = E("aiAddr", "");
        if (!a) { aiTick(true); ai.textContent = "作っています…少し待ってもう一度押す"; setTimeout(() => { ai.textContent = "AI用まとめの住所をコピー"; }, 2500); return; }
        const raw = a.replace("https://gist.github.com/", "https://gist.githubusercontent.com/") + "/raw/";
        const tx = [`JP RUSH のAI用データ（説明書：README.md）`, a, raw + "README.md", ...["pc", "tablet", "phone"].flatMap((k) => [raw + `searches-${k}.json`, raw + `cart-${k}.json`, raw + `status-${k}.json`])].join("\n");
        writeClip(tx, () => { ai.textContent = "コピーしました ✓", setTimeout(() => { ai.textContent = "AI用まとめの住所をコピー"; }, 2e3); }, () => { ai.textContent = "コピーできません"; });
      };
      // 4.10.404：AI の判定を読む鍵（jp-rush-data の読み取り専用）
      const jg = mk("AIの判定を読む鍵");
      const jgSay = () => { const J = E("judge", {}) || {}, n = Object.keys(J.items || {}).length; return E("judgeTok", "") ? (J.ok === false ? "AIの判定：" + (J.err || "読めませんでした") : J.at ? `AIの判定：${n}件（${new Date(J.at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}に読んだ）` : "AIの判定：鍵あり・まだ読んでいない") : "AIの判定を読む鍵（未設定）"; };
      jg.textContent = jgSay();
      jg.onclick = (ev) => {
        ev.preventDefault();
        const v = prompt("jp-rush-data の読み取り用の鍵（github_pat_…）を貼ってください。消すときは空のまま OK", "");
        if (v === null) return;
        $("judgeTok", v.trim()), $("judge", {});
        jg.textContent = v.trim() ? "読んでいます…" : jgSay();
        v.trim() && judgeFetch(true).then(() => { jg.textContent = jgSay(), judgePaint(); });
      };
      body.append(sub("自動同期"), sy, sub("バックアップ"), ex, im, rs, note, sub("分析用データ"), csvAnchor, ai, jg, sub("重さの計測"), pf);
      sy.style.borderTop = "0", sy.style.paddingTop = "0", sy.style.marginTop = "0";
      box.append(ar, fold, body, file), setF();
      // 4.10.309：［カート履歴］（真ん中に一覧を開く）。自動再カートの上
      const hb = mk("カート履歴"); hb.onclick = (ev) => { ev.preventDefault(), openHist(); };
      btnClass || (hb.style.flexBasis = "100%", box.prepend(hb));
      if (!btnClass) { const sv = histSaved(); sv && sv.ov && setTimeout(() => document.querySelector(".jprush-hist") || histPanel(), 300); }   // 4.10.335：窓から飛んだら、戻った時に窓を開き直す
      // 4.10.314：スマホにも［今すぐ再カート］（カートの全部。真ん中の表の［再カート］を全部押すのと同じ）。自動再カートの下
      if (!btnClass && !/カートに商品は入っておりません|商品が入っていません/.test(document.body.textContent)) {
        const nb = mk("今すぐ再カート");
        nb.style.flexBasis = "100%";
        nb.onclick = (ev) => {
          ev.preventDefault();
          if (nb.dataset.busy) return;
          const tg = [...document.querySelectorAll(".jprush-readd > *")];
          if (!tg.length) { nb.textContent = "見つかりません"; return; }
          nb.dataset.busy = "1", nb.textContent = "送信中…", bulkReadd(tg);
        };
        ar.after(nb);
      }
      // 4.10.324：［カートをすべて削除］（押し間違えないよう、3秒以内に2回押した時だけ）。自動再カート・今すぐ再カートの下
      if (!/カートに商品は入っておりません|商品が入っていません/.test(document.body.textContent)) {
        const db = mk("カート全削除");
        let armT = 0;
        db.style.flexBasis = "100%", db.style.color = "#c8102e", db.style.borderColor = "#f0b4bd";
        btnClass && (db.style.cssText += "font-size:12px;padding:8px 2px;margin:0;white-space:nowrap;");
        db.onclick = (ev) => {
          ev.preventDefault();
          if (db.disabled) return;
          if (!armT) { db.textContent = "もう一度で全削除", db.style.background = "#fdecef", armT = setTimeout(() => { armT = 0, db.textContent = "カート全削除", db.style.background = ""; }, 3000); return; }
          clearTimeout(armT), armT = 0, db.disabled = true, cartDelAll((m) => { db.textContent = m; });
        };
        box.insertBefore(db, fold);
      }   // 4.10.311：タブレットは左の欄が履歴なのでボタンは出さない
      setTimeout(() => { try { cartExportBtns(csvAnchor); const cx = document.querySelector(".jprush-cartexp"); cx && (cx.style.flexBasis = "100%"); } catch (e) {} }, 0);
      // 4.10.339：［今すぐ同期］は「データ管理」を開かなくても押せるように外にも出す（自動同期を使っている時だけ）
      if (syTok()) {
        const sq = mk("今すぐ同期");
        sq.style.flexBasis = "100%";
        sq.onclick = (ev) => {
          ev.preventDefault();
          if (sq.disabled) return;
          sq.disabled = true, sq.textContent = "同期中…";
          syncNow("manual", () => {}).then(() => { sq.textContent = "同期しました ✓", syShow(); }).catch(() => { sq.textContent = "同期できませんでした", syShow(); }).finally(() => setTimeout(() => { sq.disabled = false, sq.textContent = "今すぐ同期"; }, 3000));
        };
        box.insertBefore(sq, fold);
      }
      if (!btnClass) box.style.padding = "8px 10px";
      // 4.10.306：右の欄は幅が狭いので、ボタンの文字を少し小さく・折り返さない（自動再カートだけ2行）
      else for (const b of box.querySelectorAll("button")) if (b !== wlHead) b.style.cssText += "font-size:13px;padding:8px 2px;margin:0;white-space:" + (b === arB ? "pre" : "nowrap") + ";";
      parent ? parent.appendChild(box) : (() => { const h = cartHead(); h && h.parentNode ? h.parentNode.insertBefore(box, h.nextSibling) : document.body.prepend(box); })();
    }
    // 4.10.185：始める前に、別の保存場所から lastlive（と、検索ページなら今の検索の記録）を読む。無ければ Tampermonkey 側から移す
    function preload(keys) {
      if (!window.indexedDB) return Promise.resolve();
      return Promise.all(keys.map((k) => idbGet(k).then((v) => {
        const rec = isRecKey(String(k).slice(Ct.length));
        const sold = isSoldMonth(String(k).slice(Ct.length));
        if (v != null) { rec && v._zf && RECZF.set(k, v._zf); RECMEM.set(k, rec ? unzipRec(v) : v); sold && SOLDBASE.set(k, structuredClone(v)); return; }
        const g = GM_getValue(k, null);
        if (g == null) return;
        rec && g._zf && RECZF.set(k, g._zf);
        RECMEM.set(k, rec ? unzipRec(g) : g), RECDIRTY.set(k, RECMEM.get(k)), recTimer || (recTimer = setTimeout(recFlush, 400));
      }).catch(() => {})));
    }
    function oo() {
      let months = [];
      try { months = (GM_getValue(Ct + "sold.months", []) || []).filter(isSoldMonth).map((m) => Ct + m); } catch (e) {}
      SOLDKEYS = months;
      // カート画面では完売記録を先に読まない（ボタンを押した時に読む）
      const t0 = performance.now(), keys = [Ct + "lastlive"].concat(cartPage() ? [] : months, Nt() ? [Ct + I(D(location.href))] : []);
      window.addEventListener("pagehide", recFlush), document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && recFlush());
      preload(keys).then(() => { SOLDREADY = !!window.indexedDB && !cartPage(), PIO.read += performance.now() - t0, keys.forEach((k) => EC.delete(k)), ooRun(); });
    }
    function ooRun() {
      if (cartPage()) {
        const cr = readCart();
        cr.empty || showCartNote(cr);
        // 4.10.217：押し間違え防止（隠す・透明な板・お知らせを閉じる）は全部やめた
        // 4.10.198：左右に欄を出せる時はカートツール（ボタンは右の欄へ）。出せない時は今までのボタン
        let ok = false;
        try { ok = cartTools(cr); } catch (e) { console.warn("[JP RUSH] カートツールの表示に失敗", e); }
        try { cartReaddBtns(cr); } catch (e) { console.warn("[JP RUSH] カートの「カートへ」を出せませんでした", e); }
        try { rdqDoubleCheck(); } catch (e) {}
        try { scrollGuard(); } catch (e) {}
        ok && (() => { try { centerTimers(cr); } catch (e) { console.warn("[JP RUSH] 表の残り時間を出せませんでした", e); } })();
        ok || (() => { try { expiredOverlay(); } catch (e) { console.warn("[JP RUSH] 期限切れの表示に失敗", e); } })();
        ok || (() => { try { phoneTimers(cr); } catch (e) { console.warn("[JP RUSH] スマホの残り時間を出せませんでした", e); } })();
        // 4.10.241：スマホ（幅600px未満）では「完売記録を表示」「データを書き出す」を出さない。それより広くて左右の欄が出せない時は今まで通り
        // 4.10.290：引き継ぎのボタン（右の欄が無い時は「ショッピングカート」の見出しのすぐ下）
        ok || (() => { try { handoffBox(null); } catch (e) { console.warn("[JP RUSH] 引き継ぎのボタンを出せませんでした", e); } })();
        autoRecartLoop();
        try { syncMaybe(); } catch (e) {}   // 4.10.321：カートの画面でも（10分おき）同期。カート履歴を送るため
        ok || window.innerWidth < 600 || cartCenter || cartSoldBtn();   // 4.10.242：見出しが中央寄せ（スマホ版）の時も出さない
        return;
      }
      if (Qt.test(location.pathname)) {
        // 4.10.297：商品ページの「カートに入れる」を押した時刻を覚えておく（カートのタイマーを、カートの画面を開いた時刻ではなく入れた時刻から数えるため）
        const markAdd = (fm) => {
          try {
            if (!fm || !/\/sale\/cart\/add/.test(fm.action || "")) return;
            const sr = fm.querySelector("[name=SRCODE]"), code = sr && String(sr.value || "").trim();
            if (!/^\d{6,10}$/.test(code)) return;
            const t = w(), c = E("cart", { codes: {} }) || { codes: {} }, rd = E("cartReadd", {}) || {};
            c.codes = c.codes || {}, c.codes[code] = { name: N(document.title.split(/[|｜]/)[0]).replace(/の詳細$/, ""), firstSeen: t }, $("cart", c);
            rd[code] = t, $("cartReadd", rd);
          } catch (e) {}
        };
        document.addEventListener("submit", (ev) => markAdd(ev.target), true);
        // 送信の形でなく、ボタンを押した時に動くページでも拾う
        document.addEventListener("click", (ev) => { const b = ev.target instanceof Element && ev.target.closest("input,button,a"); b && /カート/.test(b.value || b.textContent || b.getAttribute("alt") || "") && markAdd(b.closest("form")); }, true);
        yt(M(location.href)), ye(M(location.href)), pe(), Cn(vn());
        return;
      }
      if (!Nt()) return;
      try { phoneAdapt(); } catch (e) { derr("phoneAdapt", e); }
      const go = () => {
        // 4.10.186：先に左右の欄の枠を出して、一度画面を描かせてから判定する（待っている間も欄が見える）
        try { f.banner || (Fn(), Le()); } catch (e) {}
        // 4.10.189：先に出す枠でも「取得／新・完」の箱とページ数の行の場所を取っておく（判定が済んで中身が入っても「次へ」が動かないように）
        try {
          f.nextbox && !f.nextbox.innerHTML && (f.nextbox.innerHTML = `<div class="nb-row"><span>取得</span><b class="ok" style="visibility:hidden">${T(w())}</b></div><div class="nb-foot"><button type="button" class="nbk" tabindex="-1">新 －</button><button type="button" class="nbk" tabindex="-1">完 －</button></div>`);
          f.pgnum && !f.pgnum.textContent && (f.pgnum.textContent = pgLabel());
          f.list && (f.list.textContent = "新着詳細\n－");
        } catch (e) {}
        requestAnimationFrame(() => setTimeout(go2, 0));
      };
      const go2 = () => {
        dstep("pe", pe), dstep("cn", cn), dstep("In", In), dstep("at", at), (() => { try { syncMaybe(); } catch (e) {} })(), Ut && Mn(), _n(), setInterval(Dn, 1e3), document.addEventListener("visibilitychange", Vis), window.addEventListener("pageshow", (t) => {
          t.persisted && at();
        }), window.addEventListener("pageshow", syncCart), document.addEventListener("visibilitychange", syncCart);
        setTimeout(perfMark, 0);   // 印付きの行が無いページでも時間を出す（先に出した方だけ）
        setTimeout(runLogSave, 3e3);   // 4.10.188：検索ログ
        setTimeout(evFlush, 6e3);   // 4.10.182：7日より古い印の履歴を別の保存場所へ
        setTimeout(archiveOld, 5e3);   // 4.10.179：表示が済んでから、使っていない検索の記録を別の場所へ移す
      };
      // 4.10.179：この検索の記録が別の場所に移してあれば、先に戻してから動く（その1回だけ待つ）
      go();
    }
    // 4.10.179：別の保存場所（IndexedDB）。Tampermonkey の毎回の読み込みに入らない。使っていない検索の記録を置く
    const IDB_NAME = "jpRushArchive", IDB_STORE = "kv";
    function idbOpen() {
      return new Promise((res, rej) => {
        const r = indexedDB.open(IDB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(IDB_STORE);
        r.onsuccess = () => res(r.result), r.onerror = () => rej(r.error);
      });
    }
    function idbDo(mode, fn) {
      return idbOpen().then((db) => new Promise((res, rej) => {
        const tx = db.transaction(IDB_STORE, mode), st = tx.objectStore(IDB_STORE), rq = fn(st);
        let out;
        rq && (rq.onsuccess = () => { out = rq.result; });
        tx.oncomplete = () => { db.close(), res(out); };
        tx.onerror = tx.onabort = () => { db.close(), rej(tx.error); };
      }));
    }
    const idbGet = (k) => idbDo("readonly", (s) => s.get(k)), idbPut = (k, v) => (syMark("i:" + k), idbDo("readwrite", (s) => s.put(v, k))), idbDel = (k) => idbDo("readwrite", (s) => s.delete(k)), idbCount = () => idbDo("readonly", (s) => s.count());
    // 最後に開いてから1日以上たった検索の記録を、1回に5件まで移す（書き込みが済んでから Tampermonkey 側を消す）
    function archiveOld() {
      if (typeof GM_listValues !== "function" || !window.indexedDB) return;
      const cur = Ct + I(D(location.href)), now = w(), lim = 0;   // 4.10.182：検索の記録は全部、別の保存場所へ（Tampermonkey 側に残さない）
      const ks = GM_listValues().filter((k) => String(k).startsWith(Ct + "s.") && k !== cur);
      let n = 0;
      const next = () => {
        while (ks.length && n < 5) {
          const k = ks.shift(), v = GM_getValue(k, null);
          if (!v || now - (v.lastAt || 0) < lim) continue;
          n++;
          return idbPut(k, v).then(() => { GM_deleteValue(k), EC.delete(k); }).catch(() => {}).then(next);
        }
      };
      next();
    }
    // 4.10.323：新しい版のお知らせ。ページを開いた時（5分に1回まで）GitHub の版の番号を見て、新しければ上に小さく［入れる］を出す
    const UPD_URL = "https://raw.githubusercontent.com/seiji1126/jp-rush/main/jp-rush.user.js";
    const verNum = (v) => String(v || "").split(".").map((x) => parseInt(x, 10) || 0);
    const verNewer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
    function updShow(ver) {
      if (!verNewer(ver, Jt) || document.querySelector(".jprush-upd")) return;
      const d = document.createElement("div"), t = document.createElement("span"), go = document.createElement("button"), no = document.createElement("button");
      d.className = "jprush-upd", d.style.cssText = "position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 16px);box-sizing:border-box;padding:6px 8px 6px 12px;background:#fff;border:1px solid #9fb3d9;box-shadow:0 4px 16px rgba(0,0,0,.18);font:600 13px/1.4 system-ui,-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif;color:#1f2d3d;";
      t.textContent = `JP RUSH 新しい版 ${ver}`;
      const bs = "flex:none;height:30px;padding:0 12px;border-radius:0;font:700 13px/1 system-ui,sans-serif;cursor:pointer;";
      go.type = no.type = "button", go.textContent = "入れる", no.textContent = "あとで";
      go.style.cssText = bs + "border:1px solid #003792;background:#003792;color:#fff;", no.style.cssText = bs + "border:1px solid #cdd6e4;background:#fff;color:#4a5a6e;";
      go.onclick = () => { window.open(UPD_URL, "_blank"), d.remove(); };
      no.onclick = () => { const u = E("upd", {}) || {}; u.snooze = w() + 36e5, u.snoozeVer = ver, $("upd", u), d.remove(); };
      d.append(t, go, no), document.body.append(d);
    }
    function updCheck() {
      if (cartPage()) return;   // 4.10.448：カート画面では裏で版を確かめない（裏の通信を減らす）
      try {
        const u = E("upd", {}) || {}, t = w();
        const show = (v) => { const z = E("upd", {}) || {}; if (z.snoozeVer === v && z.snooze > w()) return; updShow(v); };
        if (u.ver) show(u.ver);
        if (u.at && t - u.at < 5 * 6e4) return;
        GM_xmlhttpRequest({ method: "GET", url: UPD_URL + "?t=" + t, headers: { Range: "bytes=0-600" }, timeout: 15e3,
          onload: (r) => { const m = /@version\s+([\d.]+)/.exec(r.responseText || ""); if (!m) return; const z = E("upd", {}) || {}; z.at = w(), z.ver = m[1], $("upd", z), show(m[1]); } });
      } catch (e) {}
    }
    setTimeout(updCheck, 2500);
    oo();
  })();
})();
