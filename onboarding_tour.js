/* 首頁專用：新手導覽（spotlight tour）。
   只在 index.html 載入。自給自足：樣式與邏輯都在這支檔案裡，不動 core.css。
   第一次造訪自動開始一次（localStorage 記住），之後可從導覽列「導覽」按鈕隨時重看。
   雙語：沿用全站 [lang] 顯示規則來挑目前語言正在顯示的目標元素；文字透過 window.L() 跟著切換。
   深色／淺色沿用 core.css 的 CSS variables，不需要另外處理主題。 */
(function(){
  var SEEN_KEY = 'rp-tour-seen';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var STEPS = [
    { key:'welcome', target:null,
      zh:{t:'歡迎來到半導體可靠度物理教材', b:'花不到一分鐘認識這個網站怎麼逛。之後隨時可以從右上角「導覽」按鈕再看一次，不會只有這一次機會。'},
      en:{t:'Welcome to Semiconductor Reliability Physics', b:'Under a minute to see how this site is laid out. Replay it anytime from the "Tour" button in the top right — this isn’t a one-shot thing.'} },
    { key:'brand', target:'.nav .brand',
      zh:{t:'首頁入口', b:'左上角這個 Logo，不管逛到哪一頁，點一下就回到首頁。'},
      en:{t:'Your way back home', b:'Wherever you end up, click this logo top-left to return to the home page.'} },
    { key:'steps', target:'.nav .steps',
      zh:{t:'上方導覽列', b:'四個機制（HCI／TDDB／NBTI／EM）、機制耦合、材料表、工具，都可以直接點過去，不用每次先回首頁再選。'},
      en:{t:'The top navigation bar', b:'Jump straight to any mechanism (HCI／TDDB／NBTI／EM), the coupling module, the materials table, or the tools — no need to come back here first.'} },
    { key:'hero', target:'[data-tour="hero"]',
      zh:{t:'每個機制都走同一套節奏', b:'直覺 → 機制 → 模型 → 公式 → 規格 → 防治，部分機制還多一站：可調模型工作台。熟悉一個機制的節奏，其他就都好上手。'},
      en:{t:'Every mechanism follows the same rhythm', b:'Intuition → mechanism → model → formula → spec → mitigation, with a tunable playground as an extra stop for some. Learn the rhythm once, reuse it everywhere.'} },
    { key:'hub-mech', target:'[data-tour="hub-mech"]',
      zh:{t:'先選一個機制開始', b:'不確定選哪個，就從 HCI 或 TDDB 開始 —— 這兩個最常被搞混，先分清楚，其他機制就有參照座標可以比。'},
      en:{t:'Pick a mechanism to start', b:'Not sure where to start? Try HCI or TDDB — they’re the two most commonly confused, and once they’re clear the rest have something to compare against.'} },
    { key:'hub-ref', target:'[data-tour="hub-ref"]',
      zh:{t:'這一區不是課程，是查資料用的', b:'材料與結構參考表是全站數字的唯一出處；工具頁是幫你架 HCI 應力量測、算負載電阻的。上課時可以先跳過，需要查數字或架測試時再回來。'},
      en:{t:'Reference, not coursework', b:'The materials table is the single source of truth for every number on this site; the tools page helps size a load resistor for an actual HCI stress setup. Skip these while learning — come back when you need a number.'} },
    { key:'cmp-hint', target:'[data-tour="cmp-hint"]',
      zh:{t:'四機制對照表', b:'把 HCI／TDDB／NBTI／EM 放在同一組面向上並排比較，觀念混在一起的時候，來這裡對一下最快。最左欄固定不動，左右滑動看其他欄。'},
      en:{t:'The four-mechanism comparison', b:'HCI, TDDB, NBTI and EM lined up side by side on the same aspects — the fastest way to un-confuse them. The left column stays pinned while you scroll sideways.'} },
    { key:'rungs', target:'[data-tour="rungs"]',
      zh:{t:'依照你的角色挑路徑', b:'初學者：照順序走。已經懂物理：直接跳規格與防治。要做實驗：先玩可調模型。要說服別人：用上面的對照表。'},
      en:{t:'Pick a path for your role', b:'New to this: go in order. Already know the physics: jump to specs and mitigation. Planning an experiment: play with the tunable model first. Need to convince someone: use the comparison table.'} },
    { key:'toggles', target:'#themeBtn', unionWith:'#langBtn',
      zh:{t:'深色模式與中英文', b:'這裡可以切換深色／淺色（也會跟著系統設定走）、中文／英文。選好之後會記住，下次來不用再選一次。'},
      en:{t:'Theme and language', b:'Switch dark/light (it also follows your system setting) and Chinese/English right here. Your choice is remembered on your next visit.'} },
    { key:'done', target:null,
      zh:{t:'就這樣，開始探索吧', b:'忘記怎麼逛也沒關係，右上角「導覽」隨時點開再看一次。'},
      en:{t:'That’s it — go explore', b:'Forgot how this works? Click "Tour" in the top right anytime to see it again.'} }
  ];

  var css = ''
    +'.tour-blocker{position:fixed;z-index:400;background:transparent;cursor:default}'
    +'.tour-hole{position:fixed;z-index:401;pointer-events:none;border-radius:14px;'
    +'box-shadow:0 0 0 3px var(--e),0 0 26px 5px color-mix(in srgb,var(--e) 40%,transparent),0 0 0 9999px rgba(0,0,0,.6);'
    +(reduceMotion?'':'transition:left .35s ease,top .35s ease,width .35s ease,height .35s ease,opacity .2s ease;')
    +'opacity:1}'
    +'.tour-hole.center{box-shadow:0 0 0 9999px rgba(0,0,0,.6);opacity:1}'
    +'.tour-card{position:fixed;z-index:402;width:min(380px,calc(100vw - 32px));background:var(--surface);'
    +'color:var(--ink);border:1px solid var(--border);border-radius:14px;padding:20px 22px 16px;'
    +'box-shadow:0 18px 44px rgba(0,0,0,.32);font-family:system-ui,-apple-system,"Segoe UI","Noto Sans TC","Microsoft JhengHei",sans-serif;'
    +'max-height:calc(100vh - 32px);overflow:auto}'
    +'.tour-card .tour-close{position:absolute;top:10px;right:10px;width:26px;height:26px;border-radius:7px;'
    +'border:1px solid var(--border);background:var(--surface);color:var(--ink2);cursor:pointer;font-size:14px;'
    +'display:inline-flex;align-items:center;justify-content:center;line-height:1}'
    +'.tour-card .tour-close:hover{border-color:var(--axis);color:var(--ink)}'
    +'.tour-card .tour-dots{display:flex;gap:5px;margin:0 0 12px}'
    +'.tour-card .tour-dots i{width:6px;height:6px;border-radius:50%;background:var(--grid);display:block;flex:none}'
    +'.tour-card .tour-dots i.on{background:var(--e);width:16px;border-radius:3px}'
    +'.tour-card h3{margin:0 0 8px;font-size:18.5px;letter-spacing:-.01em;line-height:1.35;padding-right:22px}'
    +'.tour-card p{margin:0 0 16px;font-size:15px;line-height:1.65;color:var(--ink2)}'
    +'.tour-card .tour-actions{display:flex;align-items:center;justify-content:space-between;gap:10px}'
    +'.tour-card .tour-skip{background:none;border:none;color:var(--muted);font-size:13.5px;cursor:pointer;padding:6px 2px}'
    +'.tour-card .tour-skip:hover{color:var(--ink2);text-decoration:underline}'
    +'.tour-card .tour-nav{display:flex;gap:8px}'
    +'.tour-card .tour-nav button{font:inherit;font-size:14px;font-weight:650;border-radius:8px;padding:7px 14px;cursor:pointer}'
    +'.tour-card .tour-prev{background:var(--surface);border:1px solid var(--border);color:var(--ink2)}'
    +'.tour-card .tour-prev:hover{border-color:var(--axis);color:var(--ink)}'
    +'.tour-card .tour-prev[disabled]{opacity:.4;cursor:default;pointer-events:none}'
    +'.tour-card .tour-next{background:var(--e);border:1px solid var(--e);color:#fff}'
    +'.tour-card .tour-next:hover{opacity:.9}'
    +'#tourBtn{font-weight:600}';
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var blockers, hole, card, titleEl, bodyEl, dotsEl, prevBtn, nextBtn, skipBtn, closeBtn;
  var idx = 0, open = false, raf = null;

  function build(){
    /* Four strips framing the hole, not one full-screen div: this leaves the spotlit
       target itself clickable (needed for the toggles step, where the tour explicitly
       tells the visitor to click the theme/language buttons while they're highlighted). */
    blockers = ['top','right','bottom','left'].map(function(){
      var d = document.createElement('div');
      d.className = 'tour-blocker';
      return d;
    });

    hole = document.createElement('div');
    hole.className = 'tour-hole';

    card = document.createElement('div');
    card.className = 'tour-card';
    card.setAttribute('role','dialog');
    card.setAttribute('aria-live','polite');

    closeBtn = document.createElement('button');
    closeBtn.className = 'tour-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label','close');
    closeBtn.addEventListener('click', finish);

    dotsEl = document.createElement('div');
    dotsEl.className = 'tour-dots';
    STEPS.forEach(function(){ var i=document.createElement('i'); dotsEl.appendChild(i); });

    titleEl = document.createElement('h3');
    bodyEl = document.createElement('p');

    var actions = document.createElement('div');
    actions.className = 'tour-actions';

    skipBtn = document.createElement('button');
    skipBtn.className = 'tour-skip';
    skipBtn.type = 'button';
    skipBtn.addEventListener('click', finish);

    var navWrap = document.createElement('div');
    navWrap.className = 'tour-nav';
    prevBtn = document.createElement('button');
    prevBtn.className = 'tour-prev';
    prevBtn.type = 'button';
    prevBtn.addEventListener('click', function(){ go(idx-1); });
    nextBtn = document.createElement('button');
    nextBtn.className = 'tour-next';
    nextBtn.type = 'button';
    nextBtn.addEventListener('click', function(){
      if(idx >= STEPS.length-1){ finish(); } else { go(idx+1); }
    });
    navWrap.appendChild(prevBtn); navWrap.appendChild(nextBtn);
    actions.appendChild(skipBtn); actions.appendChild(navWrap);

    card.appendChild(closeBtn);
    card.appendChild(dotsEl);
    card.appendChild(titleEl);
    card.appendChild(bodyEl);
    card.appendChild(actions);

    blockers.forEach(function(d){ document.body.appendChild(d); });
    document.body.appendChild(hole);
    document.body.appendChild(card);
  }

  function pick(sel){
    var list = document.querySelectorAll(sel);
    for(var i=0;i<list.length;i++){
      var r = list[i].getBoundingClientRect();
      if(r.width>0 && r.height>0) return list[i];
    }
    return list.length ? list[0] : null;
  }

  function union(a,b){
    var left = Math.min(a.left,b.left), top = Math.min(a.top,b.top);
    var right = Math.max(a.right,b.right), bottom = Math.max(a.bottom,b.bottom);
    return {left:left, top:top, right:right, bottom:bottom, width:right-left, height:bottom-top};
  }

  function currentRect(step){
    if(!step.target) return null;
    var el = pick(step.target);
    if(!el) return null;
    var r = el.getBoundingClientRect();
    if(step.unionWith){
      var el2 = pick(step.unionWith);
      if(el2) r = union(r, el2.getBoundingClientRect());
    }
    return r;
  }

  function scrollTargetIntoView(step){
    if(!step.target) return;
    var el = pick(step.target);
    if(!el) return;
    if(el.closest('.nav')) return; /* sticky nav is always visible, never scroll for it */
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    if(r.top >= 90 && r.bottom <= vh-20) return;
    el.scrollIntoView({behavior: reduceMotion?'auto':'smooth', block:'center'});
  }

  function setRect(el, x, y, w, h){
    el.style.left = x+'px'; el.style.top = y+'px';
    el.style.width = Math.max(0,w)+'px'; el.style.height = Math.max(0,h)+'px';
  }

  function layout(){
    var vw = window.innerWidth, vh = window.innerHeight;
    var step = STEPS[idx];
    var r = currentRect(step);
    var pad = 8;

    if(!r){
      hole.classList.add('center');
      hole.style.left = '0px'; hole.style.top='0px';
      hole.style.width = vw+'px'; hole.style.height = vh+'px';
      hole.style.borderRadius = '0px';
      setRect(blockers[0], 0, 0, vw, vh); /* no real target here: block the whole page like before */
      setRect(blockers[1], 0, 0, 0, 0);
      setRect(blockers[2], 0, 0, 0, 0);
      setRect(blockers[3], 0, 0, 0, 0);
    } else {
      hole.classList.remove('center');
      var hx = Math.max(0,r.left-pad), hy = Math.max(0,r.top-pad);
      var hw = r.width+pad*2, hh = r.height+pad*2;
      hole.style.left = hx+'px';
      hole.style.top = hy+'px';
      hole.style.width = hw+'px';
      hole.style.height = hh+'px';
      hole.style.borderRadius = '14px';
      /* frame the hole with 4 strips so the spotlit target itself stays clickable */
      setRect(blockers[0], 0, 0, vw, hy);
      setRect(blockers[2], 0, hy+hh, vw, Math.max(0, vh-(hy+hh)));
      setRect(blockers[3], 0, hy, hx, hh);
      setRect(blockers[1], hx+hw, hy, Math.max(0, vw-(hx+hw)), hh);
    }

    var margin=16, gap=14;
    var cw = card.offsetWidth, ch = card.offsetHeight;
    var top, left;
    if(!r){
      top = (vh-ch)/2;
      left = (vw-cw)/2;
    } else {
      var spaceBelow = vh - r.bottom, spaceAbove = r.top;
      if(spaceBelow >= ch+gap+margin || spaceBelow >= spaceAbove){
        top = r.bottom + gap;
      } else {
        top = r.top - gap - ch;
      }
      left = r.left + r.width/2 - cw/2;
    }
    left = Math.max(margin, Math.min(left, vw-cw-margin));
    top = Math.max(margin, Math.min(top, vh-ch-margin));
    card.style.left = left+'px';
    card.style.top = top+'px';
  }

  function render(){
    var step = STEPS[idx];
    var txt = (document.documentElement.getAttribute('data-lang')==='en') ? step.en : step.zh;
    titleEl.textContent = txt.t;
    bodyEl.textContent = txt.b;
    var isEn = document.documentElement.getAttribute('data-lang')==='en';
    prevBtn.textContent = isEn ? '‹ Back' : '‹ 上一步';
    nextBtn.textContent = (idx>=STEPS.length-1) ? (isEn?'Done ✓':'完成 ✓') : (isEn?'Next ›':'下一步 ›');
    skipBtn.textContent = isEn ? 'Skip tour' : '略過導覽';
    prevBtn.disabled = idx===0;
    var dots = dotsEl.children;
    for(var i=0;i<dots.length;i++){ dots[i].className = (i===idx) ? 'on' : ''; }
    layout();
  }

  function go(i){
    idx = Math.max(0, Math.min(STEPS.length-1, i));
    scrollTargetIntoView(STEPS[idx]);
    render();
    settleDuringScroll();
    setTimeout(function(){ if(open) layout(); }, 650);
  }

  function settleDuringScroll(){
    if(raf) cancelAnimationFrame(raf);
    var start = performance.now();
    var dur = reduceMotion ? 0 : 550;
    function step(now){
      layout();
      if(now-start < dur){ raf = requestAnimationFrame(step); }
    }
    raf = requestAnimationFrame(step);
  }

  function onResize(){ if(open) layout(); }
  function onScroll(){ if(open) layout(); }
  function onKey(e){
    if(!open) return;
    if(e.key==='Escape') finish();
    else if(e.key==='ArrowRight') nextBtn.click();
    else if(e.key==='ArrowLeft' && !prevBtn.disabled) prevBtn.click();
  }

  function start(){
    if(!blockers) build();
    open = true;
    idx = 0;
    blockers.forEach(function(d){ d.style.display='block'; });
    hole.style.display='block'; card.style.display='block';
    render();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, {passive:true});
    document.addEventListener('keydown', onKey);
  }

  function finish(){
    open = false;
    if(raf) cancelAnimationFrame(raf);
    if(blockers){ blockers.forEach(function(d){ d.style.display='none'; }); hole.style.display='none'; card.style.display='none'; }
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKey);
    try{ localStorage.setItem(SEEN_KEY, '1'); }catch(e){}
  }

  var tourBtn = document.getElementById('tourBtn');
  if(tourBtn) tourBtn.addEventListener('click', start);

  ['langBtn','themeBtn'].forEach(function(id){
    var b = document.getElementById(id);
    if(b) b.addEventListener('click', function(){ if(open) setTimeout(render, 0); });
  });

  window.addEventListener('load', function(){
    var seen = false;
    try{ seen = localStorage.getItem(SEEN_KEY) === '1'; }catch(e){}
    if(!seen) setTimeout(start, 500);
  });
})();
