(function(){"use strict";

const NS="http://www.w3.org/2000/svg", $=id=>document.getElementById(id);
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const KB=8.617333e-5;
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function txt(x,y,s,o){o=o||{};const fs=o.fs||11;
  const e=el('text',{x,y,'font-size':fs,fill:o.fill||css('--muted'),'text-anchor':o.ta||'start',
    'dominant-baseline':o.db||'auto','font-weight':o.fw||400,'font-variant-numeric':'tabular-nums'});
  if(o.rot)e.setAttribute('transform','rotate('+o.rot+' '+x+' '+y+')');
  const sg=String(s).split('~');
  if(sg.length===1){e.textContent=s;return e;}
  let sh=false;
  sg.forEach(function(g,i){if(g==='')return;const sub=i%2===1;
    const t2=el('tspan',sub?{'font-size':(fs*.74).toFixed(1),dy:fs*.22}:(sh?{dy:-(fs*.22)}:{}));
    sh=sub;t2.textContent=g;e.appendChild(t2);});
  return e;}
function ticks(a,b,n){const raw=(b-a)/n,mg=Math.pow(10,Math.floor(Math.log10(Math.abs(raw)||1))),r=raw/mg;
  const st=(r<1.5?1:r<3?2:r<7?5:10)*mg,o=[];for(let v=Math.ceil(a/st)*st;v<=b+st*1e-9;v+=st)o.push(+v.toFixed(10));return o;}
function decTicks(lo,hi){const o=[];for(let e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++){
  const v=Math.pow(10,e);if(v>=lo*.999&&v<=hi*1.001)o.push(v);}return o;}
function axes(svg,M,iw,ih){
  svg.appendChild(el('line',{x1:M.l,x2:M.l+iw,y1:M.t+ih,y2:M.t+ih,stroke:css('--axis'),'stroke-width':1}));
  svg.appendChild(el('line',{x1:M.l,x2:M.l,y1:M.t,y2:M.t+ih,stroke:css('--axis'),'stroke-width':1}));}
function fmtEng(v,u,d){if(!isFinite(v))return'—';if(v===0)return'0 '+u;
  const s=v<0?'-':'';v=Math.abs(v);d=d||2;
  for(const[m,sy] of [[1e12,'T'],[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']])
    if(v>=m*0.999){const x=v/m;return s+(x<10?x.toFixed(d):x<100?x.toFixed(Math.max(d-1,0)):x.toFixed(0))+' '+sy+u;}
  return s+v.toExponential(2)+' '+u;}
const SUPD={'0':'\u2070','1':'\u00b9','2':'\u00b2','3':'\u00b3','4':'\u2074','5':'\u2075',
  '6':'\u2076','7':'\u2077','8':'\u2078','9':'\u2079','-':'\u207b','+':''};
function supN(n){return String(n).split('').map(c=>SUPD[c]||c).join('');}
function pw10(e){return '10'+supN(e);}
function expU(v){if(!isFinite(v))return'\u2014';const a=v.toExponential(2).split('e');
  return a[0]+'\u00d710'+supN(a[1].replace('+',''));}
function expH(v){if(!isFinite(v))return'—';const a=v.toExponential(2).split('e');
  return a[0]+'&times;10<sup>'+a[1].replace('+','').replace('-','&minus;')+'</sup>';}
const sci=v=>!isFinite(v)?'—':v===0?'0':v.toExponential(2).replace('e','×10^').replace('^+','^');
function fmtYears(s){
  if(!isFinite(s))return'—';
  const y=s/(3600*24*365.25);
  const yr=window.L?window.L('年','yr'):'年';
  if(y>=1e6) return expU(y)+' '+yr;
  if(y>=1) return (y<100?y.toFixed(1):Math.round(y).toLocaleString('en-US'))+' '+yr;
  const d=s/86400; if(d>=1) return d.toFixed(1)+' '+(window.L?window.L('天','d'):'天');
  const h=s/3600; if(h>=1) return h.toFixed(1)+' '+(window.L?window.L('小時','h'):'小時');
  return fmtEng(s,'s',1);}

/* ================= TDDB 模型 ================= */
const A0=1.0;              /* nm 缺陷（陷阱）尺寸 = 滲流格點邊長。見階段 3：文獻萃取值 0.4–3 nm */
const MGEN=1.0;            /* 陷阱生成冪次 m。本教材階段 2 的模擬假設缺陷密度隨時間線性增加，即 m = 1 */
const TDDB={
  tox:3.0,      /* nm */
  Vg:3.0,       /* V 應力電壓 */
  Tc:125,       /* degC */
  Aarea:1e-4,   /* cm^2 測試電容面積 */
  Achip:0.5,    /* cm^2 產品閘極總面積 */
  Fspec:1e-4,   /* 目標累積失效率 */
  Vuse:1.2,     /* V 使用電壓 */
  Tuse:105,     /* degC 使用溫度 */
  model:'E',    /* E | invE | power */
  gamma:3.5,    /* cm/MV  E-model 場加速因子 */
  Gpar:350,     /* MV/cm  1/E model */
  npow:42,      /* 冪次律指數 */
  Ea:0.75,      /* eV 正活化能 */
  t0:1e-6       /* s 前置因子（校正用） */
};
/* Weibull 斜率（cell-based 模型，Suñé, IEEE EDL 22, 296, 2001）：
   β = m · t_ox / a0 —— m 是陷阱生成冪次，a0 是陷阱尺寸。
   t_ox < a0 時單一缺陷即可貫穿，滲流幾何失去意義，β 退化到 m（Stathis, JAP 86, 5757, 1999）。
   省略參數時沿用本教材階段 2 的設定（a0 = 1 nm、m = 1），行為與舊版相同。 */
function beta_raw(tox, a0, m){
  a0 = (a0===undefined? A0 : a0);
  m  = (m ===undefined? MGEN: m);
  return m * Math.max(1, tox/a0);
}
const beta_of = (tox, a0, m) => Math.max(1.05, beta_raw(tox, a0, m));
/* 一條貫穿路徑需要的缺陷數 */
const nPath = (tox, a0) => Math.max(1, tox/(a0===undefined?A0:a0));
const Eox = (V,tox) => V/(tox*1e-7)/1e6;                 /* MV/cm */
function t63(p, V, Tc){                                   /* 63.2% 的特徵壽命 (s) */
  const E=Eox(V,p.tox), T=Tc+273.15;
  let f;
  if(p.model==='E')        f = Math.exp(-p.gamma*E);
  else if(p.model==='invE')f = Math.exp(p.Gpar/Math.max(E,0.05));
  else                     f = Math.pow(Math.max(V,0.05),-p.npow);
  const arr = Math.exp(p.Ea/(KB*T));
  return p.t0*f*arr;
}
/* 面積縮放：t63(A2) = t63(A1) * (A1/A2)^(1/beta) */
const areaScale=(t,A1,A2,b)=>t*Math.pow(A1/A2,1/b);
/* 由 63% 外推到任意失效率 */
const tAtF=(t63v,F,b)=>t63v*Math.pow(-Math.log(1-F),1/b);

/* 曝露給同頁後續 <script>（頁面專屬程式碼）以裸名稱直接使用 */
Object.assign(window,{NS,$,css,KB,el,txt,ticks,decTicks,axes,fmtEng,SUPD,supN,pw10,expU,expH,sci,fmtYears,
  A0,MGEN,TDDB,beta_of,beta_raw,nPath,Eox,t63,areaScale,tAtF});
})();

