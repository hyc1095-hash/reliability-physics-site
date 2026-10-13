/* 全站共用：每個 input[type=range] 旁自動加一個可直接輸入數值的欄位，
   兩者互相同步；輸入後會對 range 觸發同一個 'input' 事件，
   所以每個工具原本的計算邏輯完全不用改。 */
(function(){
  function enhance(){
    document.querySelectorAll('input[type=range]').forEach(function(r){
      if(r.dataset.numEnhanced) return;
      r.dataset.numEnhanced='1';
      var num=document.createElement('input');
      num.type='number';
      num.className='numin';
      if(r.min!=='') num.min=r.min;
      if(r.max!=='') num.max=r.max;
      num.step=(r.step && r.step!=='')? r.step : 'any';
      num.value=r.value;
      num.inputMode='decimal';
      var lbl='數值';
      var lblEl=r.closest('.ctrl,.bigslider');
      if(lblEl){ var l=lblEl.querySelector('label'); if(l) lbl=l.textContent.trim(); }
      num.setAttribute('aria-label', lbl+'（直接輸入數值）');
      num.title='直接輸入數值，Enter 或失焦套用';
      r.insertAdjacentElement('afterend', num);

      function apply(){
        var v=parseFloat(num.value);
        if(isNaN(v)) { num.value=r.value; return; }
        var mn=r.min!==''?parseFloat(r.min):-Infinity;
        var mx=r.max!==''?parseFloat(r.max):Infinity;
        if(v<mn) v=mn; if(v>mx) v=mx;
        num.value=v;
        r.value=v;
        r.dispatchEvent(new Event('input',{bubbles:true}));
        num.classList.add('flash');
        setTimeout(function(){num.classList.remove('flash');},300);
      }
      num.addEventListener('change', apply);
      num.addEventListener('keydown', function(e){ if(e.key==='Enter'){ apply(); num.blur(); } });
      r.addEventListener('input', function(){ num.value=r.value; });
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', enhance); }
  else { enhance(); }
  // 有些工具是點擊按鈕才動態產生滑桿（例如結構切換），開一個 MutationObserver 持續補上
  var mo=new MutationObserver(function(){ enhance(); });
  mo.observe(document.body, {childList:true, subtree:true});
})();
