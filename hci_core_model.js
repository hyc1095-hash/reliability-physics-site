(function(){"use strict";

const NS="http://www.w3.org/2000/svg", $=id=>document.getElementById(id);
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ================= 常數 ================= */
const K=8.617333e-5;        // eV/K
const EPS_RATIO=3.0;        // eps_Si/eps_ox
const EOX=3.45e-13;         // F/cm
const EP=0.063;             // eV, Si 光學聲子能量
const LAM0=10.4e-7;         // cm, T->0 的游離平均自由程
const AI=7.03e5;            // 1/cm, Chynoweth 前置因子（電子）
const VSAT=1.0e7;           // cm/s
const MU0=420;              // cm^2/Vs @300K（反轉層低場遷移率）
const THETA0=1.5e-7;        // V^-1 cm，垂直場遷移率衰減 theta = THETA0/tox
const CG=2.0e-2;            // 閘極注入前置因子（幾何/重導向）
const AIT=1.0;              // 界面態前置因子（任意單位）
const ESI=1.04e-12;         // F/cm 矽介電常數
const VBI=0.75;             // V 內建電位（估）
const MU_LDD=250;           // cm^2/Vs n- 延伸區遷移率

/* ================= 參數 ================= */
const P={
  L:1.0,        // um
  tox:20,       // nm
  xj:200,       // nm
  W:10,         // um
  Vt0:0.7,      // V @300K
  VG:2.5, VD:5.0,
  Tc:25,        // degC
  phi_i:1.3,    // eV 撞擊游離門檻
  phi_it:3.7,   // eV 界面態生成門檻 (Si-H)
  phi_b:3.1,    // eV Si/SiO2 位障
  Nsub:1e17,    // cm^-3 通道 / 井區摻雜
  ldd:false, Nldd:1e18, Lext:60,   // LDD n- 延伸：摻雜、長度(nm)
  halo:false, Nhalo:5e17           // pocket / halo p 型局部摻雜
};
const SPEC=[
  {k:'L',   lab:'通道長度 L (µm)',        min:0.03,max:2,step:.001,log:true,fmt:v=>v<0.1?(v*1000).toFixed(0)+' nm':v.toFixed(3)+' µm'},
  {k:'tox', lab:'氧化層厚度 t<sub>ox</sub> (nm)',min:1.5,max:60,step:.1,log:true,fmt:v=>v.toFixed(1)+' nm'},
  {k:'xj',  lab:'接面深度 x<sub>j</sub> (nm)',   min:15,max:600,step:1,log:true,fmt:v=>v.toFixed(0)+' nm'},
  {k:'VG',  lab:'閘極電壓 V<sub>G</sub> (V)',min:0,max:10,step:.05,fmt:v=>v.toFixed(2)+' V'},
  {k:'VD',  lab:'汲極電壓 V<sub>D</sub> (V)',min:0.1,max:12,step:.05,fmt:v=>v.toFixed(2)+' V'},
  {k:'Tc',  lab:'溫度 T (°C)',            min:-40,max:200,step:1,fmt:v=>v.toFixed(0)+' °C  ('+(v+273.15).toFixed(0)+' K)'},
  {k:'Vt0', lab:'V<sub>t</sub> @300K (V)',min:0.2,max:2.5,step:.01,fmt:v=>v.toFixed(2)+' V'},
  {k:'W',   lab:'通道寬度 W (µm)',        min:0.5,max:200,step:.5,log:true,fmt:v=>v.toFixed(1)+' µm'},
  {k:'phi_i', lab:'φ<sub>i</sub> 游離門檻 (eV)',   min:0.9,max:2.0,step:.01,fmt:v=>v.toFixed(2)+' eV'},
  {k:'phi_it',lab:'φ<sub>it</sub> 界面態門檻 (eV)',min:2.5,max:5.0,step:.01,fmt:v=>v.toFixed(2)+' eV'},
  {k:'phi_b', lab:'φ<sub>b</sub> Si/SiO₂ 位障 (eV)',min:2.0,max:4.0,step:.01,fmt:v=>v.toFixed(2)+' eV'}
];

/* ================= 物理模型 ================= */
function model(p){
  const T=p.Tc+273.15;
  const lam=LAM0*Math.tanh(EP/(2*K*T));          // 平均自由程 λ(T)
  const Bi =p.phi_i /lam, Bit=p.phi_it/lam, Bg=p.phi_b/lam;   // V/cm
  const m  =p.phi_it/p.phi_i;

  const tox=p.tox*1e-7, xj=p.xj*1e-7, L=p.L*1e-4, W=p.W*1e-4, Lext=p.Lext*1e-7;
  const l0=Math.sqrt(EPS_RATIO*tox*xj);           // 基本特徵長度 (cm)
  const Cox=EOX/tox;

  const dVtHalo = p.halo ? 0.15*Math.log10(Math.max(p.Nhalo/p.Nsub,1)) : 0;
  const Vt=p.Vt0-1.5e-3*(T-300)+dVtHalo;
  const n=1.35, phit=K*T;
  const a=2*n*phit, x=(p.VG-Vt)/a;
  const Vgt=Math.max(x>30?a*x:a*Math.log1p(Math.exp(x)),1e-9);

  const theta=THETA0/tox;                         // 垂直場遷移率衰減
  const mu=MU0*Math.pow(T/300,-1.5)/(1+theta*Vgt);
  const Esat=2*VSAT/mu;
  const EsatL=Esat*L;
  const Vdsat=Vgt*EsatL/(Vgt+EsatL);

  const q=5, vd=Math.max(p.VD,1e-9);
  const Vde=vd*Vdsat/Math.pow(Math.pow(vd,q)+Math.pow(Vdsat,q),1/q);
  const ID0=Math.max((W*mu*Cox/L)*(Vgt*Vde-Vde*Vde/2)/(1+Vde/EsatL),1e-18);
  /* LDD 的代價：n- 延伸區串聯電阻 */
  const xext=Math.min(xj*0.4,4e-6);
  const Rext = p.ldd ? (1/(1.602e-19*p.Nldd*MU_LDD))*Lext/Math.max(W*xext,1e-14) : 0;
  const Rtot = 2*Rext;
  const ID = Rtot>0 ? ID0/(1+ID0*Rtot/Math.max(Vde,0.05)) : ID0;

  const dV0=p.VD-Vdsat;
  /* ---- LDD：n- 延伸區的空乏寬度把高場區拉長，降低峰值電場 ---- */
  const Wldd = p.ldd ? Math.min(Math.sqrt(2*ESI*Math.max(dV0,0.1)/(1.602e-19*p.Nldd)), Lext) : 0;
  /* ---- halo / pocket：局部提高 p 型摻雜，空乏縮短 → 特徵長度變小、場變強 ---- */
  const Wp = function(N,V){return Math.sqrt(2*ESI*Math.max(V,0.1)/(1.602e-19*N));};
  const dHalo = p.halo ? Math.min(0.25*(Wp(p.Nsub,dV0+VBI)-Wp(p.Nhalo,dV0+VBI)), 0.55*l0) : 0;
  const l = Math.max(l0 + Wldd - Math.max(dHalo,0), 0.25*l0);   // 有效特徵長度

  const dV=dV0;                                   // pinch-off 區的壓降
  const pinch=dV>0;
  const dLraw=pinch?l*Math.asinh(dV/(l*Esat)):0;  // pseudo-2D 解出的 pinch-off 區長度
  const dL=Math.min(dLraw,0.95*L);               // 高場區不可能長過通道本身
  const dLclip=dLraw>0.95*L;
  const Em=pinch?Math.sqrt(Esat*Esat+(dV/l)*(dV/l)):Esat*Math.min(vd/Math.max(Vdsat,1e-9),1);

  // 沿 pinch-off 區積分游離係數
  const N=240; let sub=0; const prof=[];
  for(let i=0;i<=N;i++){
    const y=dL*i/N, E=pinch?Esat*Math.cosh(y/l):Em;
    const al=AI*Math.exp(-Bi/Math.max(E,1));
    prof.push({y,E,al});
    if(i>0) sub+=(al+prof[i-1].al)/2*(dL/N);
  }
  const isubRatio=pinch?sub:0;
  const Isub=ID*isubRatio;

  // 閘極注入：需要有利的氧化層電場（VG > VD 附近才把電子拉進閘極）
  const Eox=(p.VG-p.VD)/tox;
  const fox=1/(1+Math.exp(-(p.VG-p.VD+0.5)/0.35));
  const igRatio=pinch?CG*fox*Math.exp(-Bg/Em):0;
  const IG=ID*igRatio;

  // 界面態生成率（任意單位；與 ID(Isub/ID)^m 等價）
  const rate=pinch?AIT*(ID/W)*Math.exp(-Bit/Em):0;

  return {T,lam,Bi,Bit,Bg,m,l,l0,Wldd,dHalo,Rext,Rtot,ID0,tox,xj,L,W,Cox,mu,theta,Esat,EsatL,Vt,Vgt,Vdsat,ID,dV,pinch,dL,Em,
          prof,isubRatio,Isub,igRatio,IG,rate,Eox,dLraw,dLclip,dLoverL:L>0?dLraw/L:0};
}
function rateAt(p,ov){ return model(Object.assign({},p,ov)).rate; }
/* 在固定 VD 下掃 VG，找出 Isub 與 IG 的峰值位置 */
function peaksAtVD(VD,N){
  N=N||160; let bi={v:-1,VG:0}, bg={v:-1,VG:0};
  const VGmax=Math.max(VD*1.35,2);
  for(let j=1;j<=N;j++){
    const VG=VGmax*j/N, mm=model(Object.assign({},P,{VG,VD}));
    if(mm.Isub>bi.v) bi={v:mm.Isub,VG};
    if(mm.IG>bg.v)   bg={v:mm.IG,VG};
  }
  return {vgI:bi.VG,iI:bi.v,vgG:bg.VG,iG:bg.v,VGmax};
}

/* 數值活化能 Ea（eV），rate ∝ exp(-Ea/kT) */
function activationEnergy(p){
  const T=p.Tc+273.15, dT=12;
  const r1=rateAt(p,{Tc:p.Tc-dT}), r2=rateAt(p,{Tc:p.Tc+dT});
  if(!(r1>0&&r2>0)) return NaN;
  const T1=T-dT,T2=T+dT;
  return -K*(Math.log(r2)-Math.log(r1))/(1/T2-1/T1);
}

/* ================= 工具 ================= */
function fmtEng(v,u,d){
  if(!isFinite(v))return'—'; if(v===0)return'0 '+u;
  const s=v<0?'-':''; v=Math.abs(v); d=d||2;
  for(const[mm,sy] of [[1e12,'T'],[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p'],[1e-15,'f'],[1e-18,'a']])
    if(v>=mm*0.999){const x=v/mm;return s+(x<10?x.toFixed(d):x<100?x.toFixed(Math.max(d-1,0)):x.toFixed(0))+' '+sy+u;}
  return s+v.toExponential(2)+' '+u;
}
const SUPD={'0':'\u2070','1':'\u00b9','2':'\u00b2','3':'\u00b3','4':'\u2074','5':'\u2075',
  '6':'\u2076','7':'\u2077','8':'\u2078','9':'\u2079','-':'\u207b','+':''};
function supN(n){return String(n).split('').map(function(c){return SUPD[c]||c;}).join('');}
const sci=function(v){if(!isFinite(v))return'\u2014';if(v===0)return'0';
  var a=v.toExponential(2).split('e');return a[0]+'\u00d710'+supN(a[1].replace('+',''));};
function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function txt(x,y,s,o){o=o||{};const fs=o.fs||11;
  const e=el('text',{x,y,'font-size':fs,fill:o.fill||css('--muted'),'text-anchor':o.ta||'start',
    'dominant-baseline':o.db||'auto','font-weight':o.fw||400,'font-variant-numeric':'tabular-nums'});
  if(o.rot)e.setAttribute('transform','rotate('+o.rot+' '+x+' '+y+')');
  const segs=String(s).split('~');
  if(segs.length===1){e.textContent=s;return e;}
  let sh=false;
  segs.forEach((seg,i)=>{if(seg==='')return;const sub=i%2===1;
    const t2=el('tspan',sub?{'font-size':(fs*.74).toFixed(1),dy:fs*.22}:(sh?{dy:-(fs*.22)}:{}));
    sh=sub;t2.textContent=seg;e.appendChild(t2);});
  return e;
}
function ticks(a,b,n){const raw=(b-a)/n,mg=Math.pow(10,Math.floor(Math.log10(Math.abs(raw)||1))),r=raw/mg;
  const st=(r<1.5?1:r<3?2:r<7?5:10)*mg,o=[];for(let v=Math.ceil(a/st)*st;v<=b+st*1e-9;v+=st)o.push(+v.toFixed(10));return o;}
function decTicks(lo,hi){const o=[];for(let e=Math.floor(Math.log10(lo));e<=Math.ceil(Math.log10(hi));e++){
  const v=Math.pow(10,e);if(v>=lo*.999&&v<=hi*1.001)o.push(v);}return o;}
const decLab=v=>{const e=Math.round(Math.log10(v));return (e>=-2&&e<=3)?String(+v.toPrecision(3)):'1e'+e;};
function axes(svg,M,iw,ih){
  svg.appendChild(el('line',{x1:M.l,x2:M.l+iw,y1:M.t+ih,y2:M.t+ih,stroke:css('--axis'),'stroke-width':1}));
  svg.appendChild(el('line',{x1:M.l,x2:M.l,y1:M.t,y2:M.t+ih,stroke:css('--axis'),'stroke-width':1}));
}

/* 曝露給同頁後續 <script>（頁面專屬程式碼）以裸名稱直接使用 */
Object.assign(window,{NS,$,css,K,EPS_RATIO,EOX,EP,LAM0,AI,VSAT,MU0,THETA0,CG,AIT,ESI,VBI,MU_LDD,
  P,SPEC,model,rateAt,peaksAtVD,activationEnergy,fmtEng,SUPD,supN,sci,el,txt,ticks,decTicks,decLab,axes});
})();
