/* HILEN - Ventas: diseño aprobado. Solo mejora la vista; usa los filtros y cálculos originales. */
(function(){
'use strict';
const shapes={
 chart:'<path d="M5 20v-7m7 7V8m7 12V4"/><path d="M3 21h18"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h5"/>',
 money:'<path d="M12 2v20"/><path d="M17 7a5 5 0 0 0-5-3c-6 0-7 8 0 8s7 8 0 8a6 6 0 0 1-5-3"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h2M3 12h2M3 18h2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
 box:'<path d="m12 2 10 5-10 5L2 7l10-5ZM2 7v10l10 5 10-5V7M12 12v10"/>',
 tag:'<path d="m20 13-8 8-9-9 8-8h7l2 2v7z"/><circle cx="15" cy="9" r="1"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 pencil:'<path d="M12 20h9M4 17.8l.7-3.5L15.9 3a2.1 2.1 0 0 1 3 3L7.7 17.1 4 17.8Z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
 layers:'<path d="m12 2 10 6-10 6L2 8l10-6ZM2 13l10 6 10-6"/>'
};
const ico=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[n]||shapes.box)+'</svg>';
const qs=(root,sel)=>root.querySelector(sel);
function addMark(el,name,cls='hsv26-mark'){
 if(!el||el.querySelector('.'+cls))return;
 const mark=document.createElement('span');mark.className=cls;mark.innerHTML=ico(name);el.prepend(mark);
}
function setup(){
 const root=document.getElementById('day');if(!root||root.dataset.hsv26)return;
 const top=qs(root,'.hilen-sales-overview-card'),bottom=qs(root,'.sales-summary-card');
 if(!top||!bottom)return;
 root.dataset.hsv26='1';root.classList.add('hsv26');
 addMark(qs(root,'.sales-filter-copy'),'chart','hsv26-header-icon');
 addMark(qs(root,'.hilen-sales-list-heading>div:first-child'),'list','hsv26-header-icon');
 const tabIcons=['calendar','calendar','receipt'];
 qs(root,'#salesPeriodTabs')?.querySelectorAll('button').forEach((btn,i)=>{btn.insertAdjacentHTML('afterbegin',ico(tabIcons[i]))});
 qs(root,'.hilen-sales-type-filter')?.querySelectorAll('button').forEach((btn,i)=>{btn.insertAdjacentHTML('afterbegin',ico(['layers','card','receipt'][i]))});
 for(const [sel,name] of [['#salesDayWrap .label','calendar'],['#salesMonthWrap .label','calendar'],['#salesYearWrap .label','calendar']]){
  addMark(qs(root,sel),name,'hsv26-inline-icon');
 }
 const search=qs(root,'.sales-client-search');
 if(search){
  search.querySelector('label')?.classList.add('hsv26-visually-hidden');
  const input=qs(search,'input');
  if(input){input.placeholder='Nombre, teléfono o factura (ej. H-000123)';const box=document.createElement('div');box.className='hsv26-search-box';input.parentNode.insertBefore(box,input);box.append(input);box.insertAdjacentHTML('afterbegin',ico('search'));}
 }
 const tableArea=document.getElementById('dayTable');
 const overview=document.getElementById('hilenSalesOverview');
 const decorateKpis=()=>{
  const cards=overview?.querySelectorAll('.hilen-period-stat');if(!cards?.length)return;
  cards.forEach((card,i)=>{
   card.classList.add('hsv26-kpi');
   const original=qs(card,'.sales-kpi-icon');
   if(original){original.innerHTML=ico(['money','card','receipt'][i]);}
  });
 };
 function decorateTable(){
  // Ocultar solo los avisos técnicos de histórico y superposición. Los importes siguen sumando.
  tableArea?.querySelectorAll(':scope > .notice.blue').forEach(note=>{
   const text=note.textContent||'';
   if(text.includes('Ventas históricas incluidas en el total')||text.includes('Se usan los movimientos detallados para no sumar dos veces'))note.remove();
  });
  const table=tableArea?.querySelector('table');if(!table)return;
  const headers=table.querySelectorAll('thead th');
  const names=['Hora','Cliente','Productos','Pago','Total','Acciones'];
  headers.forEach((th,i)=>{
   if(th.dataset.hsv26)return;th.dataset.hsv26='1';
   const base=th.textContent.trim();
   th.innerHTML=ico(['clock','user','box','card','tag','receipt'][i])+'<span>'+names[i]+'</span>';
   th.title=base;
  });
  table.querySelectorAll('tbody tr').forEach(tr=>{
   if(tr.dataset.hsv26)return;tr.dataset.hsv26='1';
   const time=tr.cells[0];
   const invoiceNumber=time?.querySelectorAll('.small.muted')[1]?.textContent.trim()||'';
   if(time){
    const timeText=time.querySelector('.small.muted');
    const dateText=time.querySelector('b');
    if(timeText&&dateText){
      const date=dateText.textContent;
      const hour=timeText.textContent;
      time.innerHTML='<div class="hsv26-time">'+ico('clock')+'<strong></strong></div><small class="hsv26-date"></small>';
      time.querySelector('strong').textContent=hour||date;
      time.querySelector('small').textContent=date;
    }
   }
   const customer=tr.cells[1];if(customer)customer.insertAdjacentHTML('afterbegin','<span class="hsv26-customer-icon">'+ico('user')+'</span>');
   const products=tr.cells[2];if(products)products.insertAdjacentHTML('afterbegin','<span class="hsv26-product-icon">'+ico('box')+'</span>');
   const payment=tr.cells[3];if(payment){
    const badge=payment.querySelector('.badge');
    if(badge){
     const isCredit=badge.classList.contains('credit');
     const method=payment.querySelector('.small.muted')?.textContent.trim()||'Efectivo';
     const label=isCredit?('Crédito'+(invoiceNumber?' · '+invoiceNumber:'')):('Pagada · '+method);
     const name=isCredit?'card':/nequi/i.test(method)?'phone':'check';
     const pill=document.createElement('span');pill.className='hsv26-payment-pill '+(isCredit?'credit':/nequi/i.test(method)?'bank':'cash');
     pill.innerHTML=ico(name)+'<span></span>';
     pill.querySelector('span').textContent=label;
     badge.replaceWith(pill);
     payment.querySelectorAll('.small.muted').forEach(x=>x.remove());
    }
   }
   const actions=tr.cells[5];
   if(actions)actions.querySelectorAll('button').forEach((b,i)=>{
    if(b.dataset.hsv26)return;b.dataset.hsv26='1';
    const label=b.textContent.trim();
    b.innerHTML=ico(['eye','pencil','trash'][i]||'eye');
    b.setAttribute('aria-label',label+' venta');b.title=label+' venta';
   });
  });
 }
 if(typeof window.renderSalesView==='function'){
  const original=window.renderSalesView;
  if(!original.__hsv26){
   function wrapped(){const value=original.apply(this,arguments);decorateKpis();decorateTable();return value;}
   wrapped.__hsv26=true;window.renderSalesView=wrapped;
  }
 }
 decorateKpis();decorateTable();
 // El título principal se reutiliza; no se crean duplicados.
 const pageTitle=document.getElementById('pageTitle'),pageMark=document.querySelector('.page-heading-copy .hdaily-page-mark');
 if(pageTitle&&pageMark){
  const sync=()=>{
   const isSales=pageTitle.textContent.trim()==='Ventas';
   document.body.classList.toggle('hilen-sales-heading-open',isSales);
   if(isSales){pageMark.innerHTML=ico('chart');pageMark.dataset.hsv26='1';}
  };
  new MutationObserver(sync).observe(pageTitle,{childList:true,subtree:true,characterData:true});sync();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

/* HILEN: scoped Firebase diagnosis modal reference; presentation only. */
(()=>{
const svg=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const info=svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>');
const check=svg('<path d="m5 12 5 5L19 7"/>');
const network=svg('<circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="m10 8-4 8m8-8 4 8M8 19h8"/>');
const scale=svg('<path d="M12 3v18M7 21h10M3 7h18M6 7l-4 9h8L6 7zm12 0-4 9h8l-4-9zM2 16c1 3 7 3 8 0m4 0c1 3 7 3 8 0"/>');
const css=`
#modal:has(.hcfg-diagnosis-reference) .modal-card{width:min(96vw,1440px)!important;max-width:1440px!important;background:#fbf8f3!important;border-radius:clamp(20px,2.5vw,38px)!important;padding:0!important;box-shadow:0 18px 55px #0006!important;max-height:92vh;overflow:auto}
#modal:has(.hcfg-diagnosis-reference){backdrop-filter:blur(5px)}
#modal .hcfg-diagnosis-reference{padding:clamp(20px,2.2vw,34px);color:#101c46;text-align:left}
#modal .hcfg-diagnosis-reference .hcfg-popup-title{display:flex;align-items:center;gap:clamp(12px,1.7vw,26px);padding-bottom:20px;margin-bottom:24px;border-bottom:1px solid #e6d2af}
#modal .hcfg-diagnosis-reference .hcfg-popup-title>span{display:grid;place-items:center;flex:none;width:clamp(52px,5.5vw,82px);height:clamp(48px,4.7vw,70px);padding:0;background:linear-gradient(135deg,#fff4df,#f3e2c2);border:1px solid #efddbd;border-radius:15px;color:#93600a}
#modal .hcfg-diagnosis-reference .hcfg-popup-title>span svg{width:65%;height:65%}
#modal .hcfg-diagnosis-reference .hcfg-popup-title h2{flex:1;border-left:2px solid #ad760f;padding:5px 0 5px clamp(12px,1.8vw,27px);font-size:clamp(20px,2.55vw,38px)!important;line-height:1.2;font-weight:800;letter-spacing:-.035em;color:#101c46!important;margin:0}
#modal .hcfg-diagnosis-reference .hcfg-popup-title button{flex:none;display:grid;place-items:center;width:clamp(40px,4.7vw,67px);height:clamp(40px,4.7vw,67px);padding:0!important;border-radius:50%!important;background:#faf0df!important;border:1px solid #ead8b8!important;color:#93600a!important;font-size:clamp(28px,3vw,44px)!important;box-shadow:none!important}
#modal .hcfg-diagnosis-reference .hcfg-popup-body{font-size:clamp(15px,1.65vw,24px);line-height:1.45}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-banner{display:flex;align-items:center;gap:clamp(16px,1.8vw,28px);padding:clamp(16px,1.7vw,26px);border:1px solid #ead3a3;border-radius:20px;background:#fcf1da;color:#765019}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-banner[data-state=ok]{background:#e7f7e4;border-color:#c6eac3;color:#103b18}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-banner[data-state=error]{background:#fce9e7;border-color:#edc4c0;color:#912e29}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-symbol{display:grid;place-items:center;flex:none;width:clamp(42px,3.7vw,56px);height:clamp(42px,3.7vw,56px);border-radius:50%;background:#c38924;color:white}
#modal .hcfg-diagnosis-reference [data-state=ok] .hcfg-diagnosis-symbol{background:#2ca83d}
#modal .hcfg-diagnosis-reference [data-state=error] .hcfg-diagnosis-symbol{background:#b53d35}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-symbol svg{width:70%;height:70%;stroke-width:2.6}
#modal .hcfg-diagnosis-reference #hcfgDiagnosisResult{flex:1;min-width:0;padding-left:clamp(12px,1.5vw,24px);border-left:2px solid currentColor;margin:0!important;color:inherit!important;overflow-wrap:anywhere}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-note{display:flex;align-items:center;gap:12px;color:#354968;margin:16px 0 0!important}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-note svg{width:30px;height:30px;flex:none;color:#7588a8}
#modal .hcfg-diagnosis-reference .action-group{display:flex;justify-content:flex-start;gap:clamp(12px,1.6vw,24px);flex-wrap:wrap;margin:clamp(22px,2.7vw,40px) 0 5px!important}
#modal .hcfg-diagnosis-reference .action-group button{display:inline-flex;align-items:center;justify-content:center;gap:14px;min-height:clamp(52px,5.2vw,76px);padding:12px clamp(18px,2.6vw,40px)!important;border-radius:17px!important;font-size:clamp(16px,1.8vw,27px)!important;font-weight:800!important;white-space:normal}
#modal .hcfg-diagnosis-reference .action-group button svg{width:clamp(24px,2.5vw,36px);height:clamp(24px,2.5vw,36px);flex:none}
#modal .hcfg-diagnosis-reference .action-group .primary{background:linear-gradient(#edb126,#996000)!important;color:white!important;border:1px solid #e5b344!important;box-shadow:0 4px 9px #9c690b28}
#modal .hcfg-diagnosis-reference .action-group .secondary{background:linear-gradient(#fffdfa,#f8f0e2)!important;color:#101c46!important;border:1.5px solid #bd8a2c!important}
#modal .hcfg-diagnosis-reference .action-group button[onclick="closeModal()"]{display:none!important}
@media(max-width:600px){#modal .hcfg-diagnosis-reference .action-group button{width:100%}#modal .hcfg-diagnosis-reference .hcfg-popup-title{gap:10px}#modal .hcfg-diagnosis-reference .hcfg-diagnosis-banner{gap:10px}}
`;
function init(){
if(document.getElementById('hcfg-diagnosis-reference-style'))return;
const style=document.createElement('style');style.id='hcfg-diagnosis-reference-style';style.textContent=css;document.head.append(style);
const root=document.getElementById('modalContent');if(!root)return;
function render(){
const result=root.querySelector('#hcfgDiagnosisResult'),popup=result?.closest('.hcfg-popup');if(!popup)return;
if(!popup.classList.contains('hcfg-diagnosis-reference')){
popup.classList.add('hcfg-diagnosis-reference');
const heading=popup.querySelector('.hcfg-popup-title>span');if(heading)heading.innerHTML=info;
const banner=document.createElement('div');banner.className='hcfg-diagnosis-banner';const symbol=document.createElement('span');symbol.className='hcfg-diagnosis-symbol';symbol.setAttribute('aria-hidden','true');banner.append(symbol);result.before(banner);banner.append(result);
const note=popup.querySelector('.hcfg-popup-body>p');if(note){note.classList.add('hcfg-diagnosis-note');note.insertAdjacentHTML('afterbegin',info);}
const buttons=popup.querySelectorAll('.action-group button');buttons.forEach(b=>{if(b.textContent.includes('Diagnosticar conexión'))b.insertAdjacentHTML('afterbegin',network);else if(b.textContent.includes('Revisar diferencias'))b.insertAdjacentHTML('afterbegin',scale);});
}
const banner=result.parentElement,symbol=banner.querySelector('.hcfg-diagnosis-symbol');const original=document.getElementById('hilenFirebaseDiagnosis');const kind=(result.dataset.kind||((original?.textContent===result.textContent)?original.className:'' )).toLowerCase();const msg=result.textContent.trim();const state=/\b(error|bad|danger|fail)\b/.test(kind)?'error':/\b(ok|good|success)\b/.test(kind)?'ok':'pending';
if(banner.dataset.state!==state){banner.dataset.state=state;symbol.innerHTML=state==='ok'?check:info;}
if(state==='ok'&&!result.querySelector('strong')){const match=msg.match(/^(Lectura de Realtime Database: correcta\.)([\s\S]*)$/i);if(match){const strong=document.createElement('strong');strong.textContent=match[1];result.replaceChildren(strong,document.createTextNode(match[2]));}}
}
new MutationObserver(render).observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-kind']});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
