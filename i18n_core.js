/* 全站共用：中／英切換。偏好存在 localStorage，跨頁保留。
   有 [lang=en] 內容的頁面會整段切換；沒有的頁面顯示未翻譯提示，不會出現殘缺內容。
   window.L(zh,en) 給頁面自己畫的 SVG／動態文字用：依目前語言回傳對應字串，
   語言切換時會呼叫 window.__rebuild()（如果頁面有定義）讓這些動態文字重新渲染。 */
window.L = function(zh, en){
  return document.documentElement.getAttribute('data-lang') === 'en' ? en : zh;
};
(function(){
  var KEY='site-lang';
  var btn=document.getElementById('langBtn');
  function apply(lang){
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang==='en'?'en':'zh-Hant');
    if(btn) btn.setAttribute('aria-pressed', String(lang==='en'));
    var hasEn = !!document.querySelector('[lang="en"]');
    var notice = document.getElementById('i18nMissing');
    if(lang==='en' && !hasEn && notice){ notice.style.display='block'; }
    if(window.__rebuild) window.__rebuild();
  }
  var saved = localStorage.getItem(KEY) || 'zh-Hant';
  apply(saved);
  if(btn){
    btn.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-lang')==='en' ? 'zh-Hant' : 'en';
      localStorage.setItem(KEY, cur);
      apply(cur);
    });
  }
})();
