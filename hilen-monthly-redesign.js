/* HILEN · refuerzo visual para Registro mensual. No interviene en saveMonthlyEntry. */
(()=>{
 'use strict';
 const icon=(name)=>{
  const shapes={
   calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
   coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 2 16 2 16 0V6M4 11v5c0 2 16 2 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
   receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
   graph:'<path d="M5 20V13m7 7V7m7 13V3"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.calendar)+'</svg>';
 };
 function init(){
  const root=document.getElementById('monthlyRecords');
  if(!root||root.classList.contains('hmr26'))return;
  const card=root.querySelector('.hm-monthly-card'),heading=card?.querySelector('.hm-monthly-heading'),tabs=card?.querySelector('.hm-tabs');
  if(!card||!heading||!tabs)return;
  root.classList.add('hmr26');
  // Conservar el título principal de la página; eliminar el duplicado dentro de la tarjeta.
  const monthHeaderIcon=heading.querySelector('.pro-icon svg')?.outerHTML||icon('calendar');
  heading.remove();
  const pageTitle=document.getElementById('pageTitle');
  const pageMark=document.querySelector('.page-heading-copy .hdaily-page-mark');
  if(pageTitle&&pageMark){
   const previousMark=pageMark.innerHTML;
   const updateTitle=()=>{
    const monthly=pageTitle.textContent.trim()==='Registro mensual';
    document.body.classList.toggle('hilen-monthly-heading-open',monthly);
    if(monthly){pageMark.innerHTML=monthHeaderIcon;}
    else if(pageMark.dataset.hmrMonthlyMark==='1'&&pageTitle.textContent.trim()!=='Registrar venta'){pageMark.innerHTML=previousMark;}
    pageMark.dataset.hmrMonthlyMark=monthly?'1':'0';
   };
   new MutationObserver(updateTitle).observe(pageTitle,{childList:true,subtree:true,characterData:true});
   updateTitle();
  }
  const content=document.createElement('div');content.className='hmr26-form-content';
  const secondary=card.querySelector('.pro-card-head.compact');
  card.insertBefore(content,secondary);
  let node=secondary;while(node){const next=node.nextSibling;content.append(node);node=next}
  const monthlyIcon=document.getElementById('monthlyCategoryIcon');
  if(monthlyIcon)monthlyIcon.innerHTML=icon('receipt');
  const mainLabels=card.querySelectorAll('.hm-fields>div>label');
  mainLabels.forEach((label,index)=>{
   const span=document.createElement('span');span.className='hmr26-label-icon';span.innerHTML=icon(index===0?'calendar':'coins');label.prepend(span);
  });
  const tabsIcons=[icon('graph'),icon('coins'),icon('receipt')];
  tabs.querySelectorAll('button').forEach((btn,i)=>{const old=btn.querySelector('svg');if(old)old.outerHTML=tabsIcons[i]});
  const observeIcon=()=>{
   const kind=root.getAttribute('data-monthly-kind');
   if(monthlyIcon)monthlyIcon.innerHTML=icon(kind==='sales'?'receipt':kind==='payments'?'coins':'receipt');
  };
  new MutationObserver(observeIcon).observe(root,{attributes:true,attributeFilter:['data-monthly-kind']});
  observeIcon();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();