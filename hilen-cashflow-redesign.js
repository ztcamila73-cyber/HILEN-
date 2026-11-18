/* HILEN - Flujo de caja, diseño aprobado. Presentación únicamente. */
(()=>{
'use strict';
const paths={
 wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M16 12h6v5h-6a2 2 0 0 1 0-5Z"/>',
 bank:'<path d="m3 9 9-5 9 5M4 9h16M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18"/>',
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 3 16 3 16 0V6M4 11v5c0 3 16 3 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
 plus:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
 chart:'<path d="M5 20v-7m7 7V8m7 12V3"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h4"/>',
 arrows:'<path d="M4 8h16l-4-4m4 4-4 4M20 16H4l4-4m-4 4 4 4"/>',
 dollar:'<path d="M12 2v20M17 7a5 5 0 0 0-5-3c-6 0-7 8 0 8s7 8 0 8a6 6 0 0 1-5-3"/>',
 note:'<path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/>',
 save:'<path d="M4 3h14l3 3v15H4zM8 3v7h9V3M8 21v-8h9v8"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h2M3 12h2M3 18h2"/>',
 up:'<path d="M12 20V4m-7 7 7-7 7 7"/>',
 down:'<path d="M12 4v16m-7-7 7 7 7-7"/>',
 equal:'<path d="M4 9h16M4 15h16"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 layers:'<path d="m12 2 10 6-10 6L2 8l10-6ZM2 13l10 6 10-6"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
 pencil:'<path d="M12 20h9M4 17.8l.7-3.5L15.9 3a2.1 2.1 0 0 1 3 3L7.7 17.1 4 17.8Z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
const ico=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.note)+'</svg>';
function markLabel(label,name){
 if(!label||label.querySelector('.hcf26-label-icon'))return;
 label.insertAdjacentHTML('afterbegin','<span class="hcf26-label-icon">'+ico(name)+'</span>');
}
function init(){
 const root=document.getElementById('cashflow');if(!root||root.classList.contains('hcf26'))return;
 const balance=root.querySelector('.cash-grid-reference'),form=root.querySelector('.cash-register-card'),history=root.querySelector('.cash-movements-card');
 if(!balance||!form||!history)return;
 root.classList.add('hcf26');
 const balances=balance.querySelectorAll('.cash-balance-reference');
 balances.forEach((card,i)=>{
  card.classList.add('hcf26-balance','hcf26-balance-'+i);
  const icon=card.querySelector('.icon-box');if(icon)icon.innerHTML=ico(['wallet','bank','coins'][i]);
 });
 // Reordenar controles conservando exactamente los mismos inputs y listeners.
 const labels=Array.from(form.children).filter(el=>el.matches('label.label'));
 const controls=['cfType','cfDate','cfAccountWrap','cfTransferWrap','cfAmount','cfNote'];
 const map={'cfType':'arrows','cfDate':'calendar','cfAccountWrap':'card','cfTransferWrap':'arrows','cfAmount':'dollar','cfNote':'note'};
 const fields=document.createElement('div');fields.className='hcf26-form-grid';
 const head=form.querySelector('.pro-card-head');
 head?.insertAdjacentHTML('afterbegin','<span class="hcf26-section-icon">'+ico('plus')+'</span>');
 head?.querySelector('.pro-icon')?.remove();
 // Reubicar etiquetas directas con sus inputs; Cuenta/Transferir ya son envoltorios.
 function attach(label,element,cls){
  if(!element)return;
  const group=document.createElement('div');group.className='hcf26-field '+cls;
  if(label){markLabel(label,map[cls.replace('hcf26-','')]||'note');group.append(label)}
  group.append(element);fields.append(group);
 }
 attach(labels[0],document.getElementById('cfType'),'hcf26-cfType');
 // El selector global DD/MM/AAAA ya envuelve a cfDate. Mover todo el
 // componente (campo editable + calendario + fecha nativa oculta), no solo
 // input#cfDate: de lo contrario queda una segunda fecha visible abajo.
 const cashDate=document.getElementById('cfDate');
 const friendlyDate=cashDate?.closest('.hilen-friendly-date');
 attach(labels[1],friendlyDate||cashDate,'hcf26-cfDate');
 const account=document.getElementById('cfAccountWrap');if(account){markLabel(account.querySelector('label'),'card');account.classList.add('hcf26-field','hcf26-cfAccountWrap');fields.append(account)}
 const transfer=document.getElementById('cfTransferWrap');if(transfer){markLabel(transfer.querySelector('label'),'arrows');transfer.classList.add('hcf26-field','hcf26-cfTransferWrap');fields.append(transfer)}
 attach(labels[2],document.getElementById('cfAmount'),'hcf26-cfAmount');
 attach(labels[3],document.getElementById('cfNote'),'hcf26-cfNote');
 if(head)head.insertAdjacentElement('afterend',fields);else form.prepend(fields);
 const save=document.getElementById('cfSaveBtn'),state=document.getElementById('cfSaveState');
 if(save){save.innerHTML=ico('save')+'<span>Guardar movimiento</span>';save.classList.add('hcf26-save')}
 if(save)fields.append(save);
 if(state){state.classList.add('hcf26-state');state.insertAdjacentHTML('afterbegin',ico('info'));fields.append(state)}
 const historyHead=history.querySelector('.cash-movements-head .pro-card-head');
 historyHead?.insertAdjacentHTML('afterbegin','<span class="hcf26-section-icon">'+ico('chart')+'</span>');
 historyHead?.querySelector('.pro-icon')?.remove();
 root.querySelectorAll('#cashflowPeriodTabs button').forEach(button=>button.insertAdjacentHTML('afterbegin',ico('calendar')));
 [['cashflowDayWrap','calendar'],['cashflowMonthWrap','calendar'],['cashflowYearWrap','calendar']].forEach(([id,icon])=>markLabel(document.getElementById(id)?.querySelector('label'),icon));
 const filterButtons=history.querySelectorAll('[data-cash-filter]');
 filterButtons.forEach((button,i)=>button.insertAdjacentHTML('afterbegin',ico(['layers','up','down'][i])));
 const searchInput=document.getElementById('cashflowTextSearch');
 if(searchInput){const wrap=document.createElement('div');wrap.className='hcf26-search-field';searchInput.parentNode.insertBefore(wrap,searchInput);wrap.append(searchInput);wrap.insertAdjacentHTML('afterbegin',ico('search'))}
 function decorate(){
  const summary=document.getElementById('cashflowSummary');
  summary?.querySelectorAll('.cash-summary-card').forEach((card,i)=>{
   if(card.dataset.hcf26)return;card.dataset.hcf26='1';
   card.classList.add('hcf26-summary','hcf26-summary-'+i);
   const inner=card.querySelector('.cash-summary-icon');
   if(inner)inner.innerHTML=ico(['list','up','down','equal'][i]);
  });
  const table=document.querySelector('#cashflowTable table');if(!table)return;
  table.querySelectorAll('thead th').forEach((th,i)=>{
   if(th.dataset.hcf26)return;th.dataset.hcf26='1';
   const title=th.textContent;
   th.innerHTML=ico(['calendar','layers','note','arrows','dollar','layers','gear'][i])+'<span></span>';
   th.querySelector('span').textContent=title;
  });
  table.querySelectorAll('tbody tr').forEach(tr=>{
   if(tr.dataset.hcf26)return;tr.dataset.hcf26='1';
   const badge=tr.cells[1]?.querySelector('.badge');
   if(badge)badge.insertAdjacentHTML('afterbegin',ico(badge.classList.contains('income')?'up':badge.classList.contains('expense')?'down':'arrows'));
   const actions=tr.cells[6]?.querySelectorAll('button');
   actions?.forEach((btn,i)=>{const label=btn.textContent.trim();btn.innerHTML=ico(i===0?'pencil':'trash');btn.title=label;btn.setAttribute('aria-label',label)});
  });
 }
 const original=window.renderCashflow;
 if(typeof original==='function'&&!original.__hcf26){
  function wrapped(){const val=original.apply(this,arguments);decorate();return val}
  wrapped.__hcf26=true;window.renderCashflow=wrapped;
 }
 decorate();
 const pageTitle=document.getElementById('pageTitle'),pageMark=document.querySelector('.page-heading-copy .hdaily-page-mark');
 if(pageTitle&&pageMark){
  const sync=()=>{
   const active=pageTitle.textContent.trim()==='Flujo de caja';
   document.body.classList.toggle('hcf26-heading',active);
   if(active)pageMark.innerHTML=ico('coins');
  };
  new MutationObserver(sync).observe(pageTitle,{childList:true,characterData:true,subtree:true});sync();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();