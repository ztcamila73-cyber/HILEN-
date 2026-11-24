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


/* HILEN: protection explanation reference dialog (no data mutations). */
(()=>{
const svg=(p)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const shield=svg('<path d="M12 2 3 6v6c0 5 4 9 9 11 5-2 9-6 9-11V6z"/><path d="m7.5 12 3 3 6-6"/>');
const cloud=svg('<path d="M6 20h12a5 5 0 0 0 1-10 7 7 0 0 0-14-1 5.5 5.5 0 0 0 1 11zM12 10v7m-3-3 3 3 3-3"/>');
const sheets='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00b83e" d="M5 1h10l6 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z"/><path fill="#79dca0" d="M15 1v6h6z"/><path fill="none" stroke="white" stroke-width="1.3" d="M7 11h10v7H7zM7 14.5h10M12 11v7"/></svg>';
const drive='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00a942" d="M8 2h8L7 18H0z"/><path fill="#ffba00" d="M16 2l8 16h-8L8 2z"/><path fill="#1683fc" d="M0 18h24l-4 5H4z"/><path fill="#167b36" d="M8 2h8l-4 7z"/><path fill="#ea4335" d="M16 18h8l-4 5z"/></svg>';
const css=`
#settings .hilen-protect-open{width:100%;display:flex!important;align-items:center;gap:9px;justify-content:flex-start;padding:10px 14px!important;border:1px solid #e6cc9f!important;border-radius:12px!important;background:linear-gradient(#fffdf8,#faf0e0)!important;color:#80550c!important;font-weight:750!important;text-align:left}
#settings .hilen-protect-open svg{width:20px;height:20px;flex:none}#settings .hilen-protect-open span:last-child{margin-left:auto;font-size:20px}
#modal:has(.hilen-protect-reference) .modal-card{width:min(96vw,1440px)!important;max-width:1440px!important;border-radius:30px!important;background:#fffdfa!important;padding:0!important;box-shadow:0 18px 50px #0004!important;max-height:92vh;overflow:auto}
#modal:has(.hilen-protect-reference){backdrop-filter:blur(5px)}
#modal .hilen-protect-reference{color:#10143b;text-align:left;overflow:hidden;border:1px solid #e9ded0;border-radius:inherit;background:#fffdfb}
#modal .hilen-protect-head{display:flex;align-items:center;gap:clamp(12px,1.6vw,24px);padding:clamp(18px,2vw,30px);background:linear-gradient(#fffdfa,#f9efe1);border-bottom:1px solid #eadbcc}
#modal .hilen-protect-head-icon{display:grid;place-items:center;flex:none;width:clamp(50px,5vw,68px);height:clamp(50px,5vw,68px);border-radius:17px;background:linear-gradient(#f5a600,#b96b00);color:white}
#modal .hilen-protect-head-icon svg{width:65%;height:65%}
#modal .hilen-protect-head h2{font-size:clamp(23px,2.6vw,38px)!important;line-height:1.15;font-weight:850;color:#10143b!important;margin:0;flex:none}
#modal .hilen-protect-head p{border-left:3px solid #d68a0b;padding-left:clamp(16px,2.3vw,34px);font-size:clamp(15px,1.65vw,24px);line-height:1.4;margin:0;flex:1}
#modal .hilen-protect-close{flex:none;width:40px;height:40px;border-radius:50%!important;padding:0!important;display:grid;place-items:center;background:#fff9ed!important;color:#94600c!important;border:1px solid #e8d6b7!important;font-size:28px!important;line-height:1}
#modal .hilen-protect-rows{display:grid;gap:12px;padding:clamp(16px,1.8vw,26px)}
#modal .hilen-protect-row{display:grid;grid-template-columns:clamp(90px,14vw,185px) minmax(0,1fr);align-items:center;gap:clamp(12px,1.8vw,26px);padding:clamp(10px,1.2vw,18px);border:1px solid #e8e2dc;border-radius:24px;background:linear-gradient(120deg,#fffdf9,#f7f7fa);box-shadow:0 1px 2px #00000008}
#modal .hilen-protect-row-icon{min-height:clamp(74px,8vw,110px);display:flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(#fcfaf7,#f9f1e6);border-radius:19px;color:#cc8104}
#modal .hilen-protect-row-icon svg{width:clamp(42px,5.3vw,77px);height:clamp(42px,5.3vw,77px)}
#modal .hilen-protect-row-icon.dual svg{width:clamp(28px,4.5vw,64px);height:clamp(28px,4.5vw,64px)}
#modal .hilen-protect-copy{border-left:3px solid #db930c;padding-left:clamp(14px,1.8vw,26px);min-width:0}
#modal .hilen-protect-copy h3{font-size:clamp(18px,2vw,29px)!important;font-weight:850;color:#10143b!important;margin:0 0 5px;line-height:1.2}
#modal .hilen-protect-copy p{font-size:clamp(14px,1.6vw,23px);line-height:1.45;margin:0;overflow-wrap:anywhere;color:#10143b}
@media(max-width:760px){#modal .hilen-protect-head{flex-wrap:wrap;gap:12px}#modal .hilen-protect-head h2{flex:1}#modal .hilen-protect-head p{order:4;flex-basis:100%;padding-left:12px}#modal .hilen-protect-row{grid-template-columns:75px minmax(0,1fr);gap:10px;border-radius:16px}#modal .hilen-protect-row-icon.dual{gap:4px}#modal .hilen-protect-copy{padding-left:12px}}
`;
function open(){
const root=document.getElementById('modalContent'),modal=document.getElementById('modal');if(!root||!modal)return;
const row=(icon,title,copy,dual=false)=>'<article class="hilen-protect-row"><div class="hilen-protect-row-icon'+(dual?' dual':'')+'">'+icon+'</div><div class="hilen-protect-copy"><h3>'+title+'</h3><p>'+copy+'</p></div></article>';
root.innerHTML='<div class="hilen-protect-reference" role="dialog" aria-modal="true" aria-labelledby="hilenProtectTitle"><header class="hilen-protect-head"><span class="hilen-protect-head-icon">'+shield+'</span><h2 id="hilenProtectTitle">¿Para qué sirve?</h2><p>HILEN protege tus datos y los mantiene actualizados mediante Firebase y copias adicionales en Google.</p><button type="button" class="hilen-protect-close" aria-label="Cerrar">×</button></header><div class="hilen-protect-rows">'+row(sheets+drive,'Sincronización de Google Sheets y Google Drive','Intentan actualizarse después de los cambios y al menos una vez al día, mientras HILEN está abierto, conectado a Internet y con autorización de Google vigente.',true)+row(cloud,'Copias de seguridad','Google Drive conserva un archivo de recuperación del día, actualizado con los cambios, y otro llamado <strong>HILEN_ultimo_respaldo.json</strong> dentro de <strong>HILEN - Respaldos</strong>, cuando se logra sincronizar.')+row(shield,'Importante','Si cierras HILEN o caduca la autorización, el navegador no puede garantizar el envío diario por sí solo.')+'</div></div>';
const close=root.querySelector('.hilen-protect-close');close.addEventListener('click',()=>{if(typeof closeModal==='function')closeModal();else modal.classList.add('hidden');document.querySelector('.hilen-protect-open')?.focus();});modal.classList.remove('hidden');close.focus();
}
function init(){
const settings=document.getElementById('settings');if(!settings)return;
if(!document.getElementById('hilen-protect-reference-style')){const s=document.createElement('style');s.id='hilen-protect-reference-style';s.textContent=css;document.head.append(s);}
function enhance(){for(const summary of settings.querySelectorAll('details > summary')){if(summary.textContent.trim()!=='Cómo se protegen tus datos')continue;const details=summary.parentElement;const btn=document.createElement('button');btn.type='button';btn.className='hilen-protect-open';btn.setAttribute('aria-haspopup','dialog');btn.innerHTML=shield+'<span>Cómo se protegen tus datos</span><span aria-hidden="true">›</span>';btn.addEventListener('click',open);details.replaceWith(btn);}}
enhance();new MutationObserver(enhance).observe(settings,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* HILEN settings: compact reference dialogs and horizontal protection actions. */
(()=>{
const icon=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';
const shield=icon('<path d="M12 3 4 6v6c0 4 3 7 8 10 5-3 8-6 8-10V6z"/><path d="m8 12 3 3 5-6"/>');
const power=icon('<path d="M12 2v10M6 5a9 9 0 1 0 12 0"/>');
const refresh=icon('<path d="M20 4v6h-6M4 20v-6h6M5 9a8 8 0 0 1 15-2M4 17a8 8 0 0 0 15-2"/>');
const cloud=icon('<path d="M6 20h12a4 4 0 0 0 1-8 7 7 0 0 0-13-2 5 5 0 0 0 0 10zM12 18v-7m-3 3 3-3 3 3"/>');
const folder=icon('<path d="M3 6h7l2 3h9v12H3zM12 11v7m-3-3 3 3 3-3"/>');
const scale=icon('<path d="M12 3v18M7 21h10M3 7h18M6 7l-4 9h8L6 7zm12 0-4 9h8l-4-9z"/>');
const info=icon('<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>');
const css=`
#modal:has(.hcfg-diagnosis-reference,.hilen-protect-reference,.hilen-guide-reference) .modal-card{width:min(94vw,1080px)!important;max-width:1080px!important}
#modal:has(.hcfg-diagnosis-reference,.hilen-protect-reference,.hilen-guide-reference) button[data-hilen-extra-close]{display:none!important}
#modal .hcfg-diagnosis-reference{padding:24px!important}
#modal .hcfg-diagnosis-reference .hcfg-popup-title h2{font-size:clamp(20px,2vw,28px)!important}
#modal .hcfg-diagnosis-reference .hcfg-popup-body{font-size:clamp(14px,1.3vw,17px)!important}
#modal .hcfg-diagnosis-reference .hcfg-popup-title>span{width:54px;height:50px}
#modal .hcfg-diagnosis-reference .hcfg-popup-title button{width:44px;height:44px;font-size:28px!important}
#modal .hcfg-diagnosis-reference .action-group{gap:14px!important;margin-top:22px!important}
#modal .hcfg-diagnosis-reference .action-group button{font-size:17px!important;min-height:48px;padding:10px 20px!important}
#modal .hcfg-diagnosis-reference .action-group button svg{width:24px;height:24px}
#modal .hcfg-diagnosis-reference .hcfg-diagnosis-banner{padding:16px;gap:16px}
#modal .hilen-protect-head{padding:18px;gap:14px}
#modal .hilen-protect-head h2{font-size:clamp(20px,2vw,28px)!important}
#modal .hilen-protect-head p,#modal .hilen-protect-copy p{font-size:clamp(14px,1.25vw,17px)!important}
#modal .hilen-protect-copy h3{font-size:clamp(17px,1.6vw,21px)!important}
#modal .hilen-protect-head-icon{width:48px;height:48px}
#modal .hilen-protect-rows{padding:16px;gap:10px}
#modal .hilen-protect-row{grid-template-columns:clamp(75px,11vw,130px) minmax(0,1fr);padding:10px;gap:14px;border-radius:18px}
#modal .hilen-protect-row-icon{min-height:76px}
#modal .hilen-protect-row-icon svg{width:48px;height:48px}
#modal .hilen-protect-row-icon.dual svg{width:38px;height:38px}
#settings .hilen-protection-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 4px}
#settings .hilen-protection-links .hcfg-popup-link{display:flex!important;justify-content:flex-start!important;align-items:center!important;gap:9px!important;min-height:46px!important;padding:9px 12px!important;border:1px solid #e5cfa9!important;border-radius:12px!important;background:#fffaf1!important;color:#79500e!important;font-size:13px!important;line-height:1.3}
#settings .hilen-protection-links .hcfg-popup-link:nth-child(2){background:linear-gradient(#eeb83f,#a86e08)!important;color:white!important;border-color:#c78c22!important}
#settings .hilen-protection-links .hcfg-popup-link:nth-child(3){background:#f8f8fa!important;color:#17254b!important;border-color:#d9dce4!important}
#settings .hilen-protection-links svg{width:20px;height:20px;flex:none}
#settings .hilen-protection-links .hcfg-popup-link span:last-child{margin-left:0!important}
#modal .hilen-guide-reference{background:#fffdfa;color:#111831;border:1px solid #e5cda2;border-radius:22px;overflow:hidden;text-align:left}
#modal .hilen-guide-head{display:flex;align-items:center;gap:12px;padding:15px 18px;background:linear-gradient(#fffdfa,#f7e8d0);border-bottom:1px solid #eddcc0}
#modal .hilen-guide-head h2{margin:0;flex:1;font-size:clamp(19px,2vw,26px)!important;color:#111831!important}
#modal .hilen-guide-power{display:grid;place-items:center;width:45px;height:45px;border-radius:12px;color:white;background:linear-gradient(#f6b72a,#9c6100);flex:none}
#modal .hilen-guide-power svg{width:30px;height:30px}
#modal .hilen-guide-label{border:1px solid #e5c07b;border-radius:999px;padding:8px 12px;color:#79500e;font-weight:700;font-size:13px}
#modal .hilen-guide-close{width:36px;height:36px;border-radius:50%!important;background:#fff8ed!important;color:#8e5b0a!important;border:1px solid #e7d3b1!important;padding:0!important;font-size:24px!important}
#modal .hilen-guide-grid{display:grid;grid-template-columns:1fr 1.15fr 1.7fr;padding:18px;gap:14px}
#modal .hilen-guide-item{display:flex;align-items:flex-start;gap:10px;padding-right:12px;border-right:1px solid #e5d2b3}
#modal .hilen-guide-item:last-child{border:0;padding-right:0}
#modal .hilen-guide-item>span{width:48px;height:48px;flex:none;display:grid;place-items:center;border-radius:13px;background:#fcf2e2;color:#ad760b}
#modal .hilen-guide-item svg{width:30px;height:30px}
#modal .hilen-guide-item p{margin:0;font-size:14px;line-height:1.5}
@media(max-width:800px){#settings .hilen-protection-links{grid-template-columns:1fr}#modal .hilen-guide-grid{grid-template-columns:1fr}#modal .hilen-guide-item{border-right:0;border-bottom:1px solid #e5d2b3;padding:0 0 12px}#modal .hilen-guide-label{display:none}}
`;
function init(){
const root=document.getElementById('modalContent'),modal=document.getElementById('modal'),settings=document.getElementById('settings');if(!root||!modal||!settings)return;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
function links(){
const buttons=['protection','diagnosis','guide'].map(t=>settings.querySelector('button[onclick="hcfgOpenDetails(\''+t+'\')"]'));
if(buttons.some(b=>!b)||buttons[0].parentElement.classList.contains('hilen-protection-links'))return;
const group=document.createElement('div');group.className='hilen-protection-links';buttons[0].before(group);
buttons.forEach((b,i)=>{const label=b.textContent.replace(/[ⓘ›]/g,'').trim();b.innerHTML=[shield,scale,power][i]+'<span>'+label+'</span>';group.append(b);});
}
function guide(){
const popup=root.querySelector('.hcfg-popup');if(!popup||popup.querySelector('.hcfg-popup-title h2')?.textContent.trim()!=='Antes de cerrar HILEN')return;
const item=(i,t)=>'<div class="hilen-guide-item"><span>'+i+'</span><p>'+t+'</p></div>';
root.innerHTML='<div class="hilen-guide-reference" role="dialog" aria-modal="true" aria-labelledby="hilenGuideTitle"><header class="hilen-guide-head"><span class="hilen-guide-power">'+power+'</span><h2 id="hilenGuideTitle">Antes de cerrar HILEN</h2><span class="hilen-guide-label">✓ Comprobación de guardado</span><button class="hilen-guide-close" type="button" aria-label="Cerrar" onclick="closeModal()">×</button></header><div class="hilen-guide-grid">'+item(cloud,'Verifica el estado de <strong>Firebase</strong> (Pendiente o Sin sincronizar) antes de cerrar.')+item(refresh,'<strong>Guarda y respalda tu información</strong> y confirma las copias en Firebase, Google Sheets y Google Drive.')+item(folder,'Si hay un <strong>conflicto, error de conexión o copia pendiente, no borres</strong> información ni restaures respaldos anteriores. Usa «Diagnosticar conexión» y descarga una copia JSON si es necesario.')+'</div></div>';
}
function clean(){
guide();const custom=root.querySelector('.hcfg-diagnosis-reference,.hilen-protect-reference,.hilen-guide-reference');if(!custom)return;
for(const b of modal.querySelectorAll('button')){if(root.contains(b))continue;const label=(b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||'')+' '+(b.getAttribute('onclick')||'');if(/cerrar|closeModal/i.test(label)||/^(×|✕|✖|✗|x)$/i.test(b.textContent.trim())||/modal[-_]?close|close[-_]?modal/i.test(b.className)){b.setAttribute('data-hilen-extra-close','');}}
}
links();new MutationObserver(links).observe(settings,{childList:true,subtree:true});new MutationObserver(clean).observe(root,{childList:true,subtree:true});clean();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
