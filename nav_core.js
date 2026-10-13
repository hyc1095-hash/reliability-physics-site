/* 全站共用：主題切換按鈕 + 左右鍵翻頁。
   沒有 .pager（例如 hub／index／materials 頁）時，方向鍵判斷會直接落空、不做事，安全地相容於所有頁面。 */
(function(){
  var b=document.getElementById('themeBtn');
  if(b) b.addEventListener('click',function(){
    var dk=document.documentElement.getAttribute('data-theme')==='dark';
    document.documentElement.setAttribute('data-theme',dk?'light':'dark');
    if(window.__rebuild) window.__rebuild();
  });
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
    var p=document.querySelector('.pager a.prev'), n=document.querySelector('.pager a.next');
    if(e.key==='ArrowLeft'&&p) location.href=p.getAttribute('href');
    if(e.key==='ArrowRight'&&n) location.href=n.getAttribute('href');
  });
})();
