/* HILEN: diseño de Registrar venta aprobado, sin alterar validaciones, guardado ni Firebase. */
(()=>{
'use strict';
const $=s=>document.querySelector(s);
const icon=(name)=>{
 const paths={
 search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
 bag:'<path d="M5 9h14l1 11H4L5 9Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 2 16 2 16 0V6M4 11v5c0 2 16 2 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
 tag:'<path d="m20 13-8 8-9-9 8-8h7l2 2v7z"/><circle cx="15" cy="9" r="1"/>',
 stack:'<path d="m12 2 10 6-10 6L2 8l10-6Zm-10 11 10 6 10-6"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 phone:'<path d="M6 3h4l2 5-2.5 2.5a15 15 0 0 0 4 4L16 12l5 2v4c0 2-2 3-4 3C10 20 4 14 3 7c0-2 1-4 3-4z"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h5"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 9h6M9 13h6"/>',
 box:'<path d="m12 2 10 5-10 5L2 7l10-5ZM2 7v10l10 5 10-5V7M12 12v10"/>',
 calc:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h2m4 0h2M8 18h2m4 0h2"/>',
 save:'<path d="M4 3h14l3 3v15H4zM8 3v7h9V3M8 21v-8h9v8"/>',
 people:'<circle cx="8" cy="8" r="3"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M18 7v8M14 11h8"/>',
 check:'<circle cx="12" cy="12" r="10"/><path d="m7 12 3.5 3.5L17 9"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',
 plusCalendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M12 13v6m-3-3h6"/>'
 };
 return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.tag)+'</svg>';
};
const headIcons={'.sale-data-card':'calendar','.sale-client-card':'user','.sale-details-card':'tag','.sale-products-card':'box'};
function fieldIcon(el,name){
 if(!el||el.dataset.hilen2026Icon)return;
 el.dataset.hilen2026Icon='1';
 const span=document.createElement('span');span.className='hs2026-label-icon';span.innerHTML=icon(name);
 el.prepend(span);
}
function setup(){
 const section=$('#newSale');if(!section||section.dataset.hs2026)return;
 section.dataset.hs2026='1';section.classList.add('hs2026');
 for(const [selector,name] of Object.entries(headIcons)){
  const head=section.querySelector(selector+' .pro-card-head .pro-icon');
  if(head){head.innerHTML=icon(name);head.classList.add('hs2026-card-icon')}
 }
 fieldIcon(section.querySelector('label[for="saleDateTyped"]'),'calendar');
 fieldIcon(section.querySelector('label[for="saleTime"]'),'clock');
 const clientLabels=section.querySelectorAll('.sale-client-card .sale-client-grid .label');
 fieldIcon(clientLabels[0],'user');fieldIcon(clientLabels[1],'phone');fieldIcon(clientLabels[2],'people');
 const detailLabels=section.querySelectorAll('.sale-details-card .form-grid>.label, .sale-details-card .form-grid>div>.label');
 fieldIcon(detailLabels[0],'card');fieldIcon(detailLabels[1],'coins');
 fieldIcon(section.querySelector('label[for="hilenInitialPaid"]'),'coins');
 fieldIcon(section.querySelector('label[for="hilenInitialDestination"]'),'card');
 fieldIcon(section.querySelector('.hilen-whole-sale-discount label'),'tag');
 const totalLabel=section.querySelector('.sale-total-value>span');
 fieldIcon(totalLabel,'coins');
 const hints=section.querySelectorAll('.hilen-sale-hint');
 hints.forEach(h=>{if(h.querySelector('.hs2026-hint-icon'))return;const el=document.createElement('span');el.className='hs2026-hint-icon';el.innerHTML=icon('info');h.prepend(el)});
 const syncHint=section.querySelector('#saleClientSyncHint');
 if(syncHint&&!syncHint.querySelector('.hs2026-check')){const el=document.createElement('span');el.className='hs2026-check';el.innerHTML=icon('check');syncHint.prepend(el)}
 const notice=section.querySelector('.sale-info-banner .notice-dot');
 if(notice)notice.innerHTML=icon('info');
 const totalInfo=section.querySelector('.sale-total-info .pro-icon');if(totalInfo){totalInfo.innerHTML=icon('calc');totalInfo.classList.add('hs2026-total-icon')}
 const save=section.querySelector('.save-sale-btn');if(save){save.innerHTML=icon('save')+'<span>Guardar venta</span>'}
 const add=section.querySelector('.add-product-btn');if(add){add.innerHTML='<span class="hs2026-plus">＋</span> Agregar producto'}
 const products=section.querySelector('.sale-products-card'),title=products?.querySelector('.pro-card-head');

 const cols=products?.querySelectorAll('.product-headings>span');
 const icons=['box','stack','tag','receipt','coins'];
 cols?.forEach((c,i)=>{if(i<5)c.innerHTML=icon(icons[i])+'<span>'+c.textContent+'</span>'});
 section.querySelector('.sale-data-card .hilen-date-control>button')?.classList.add('hs2026-calendar-button');
 const heads=section.querySelectorAll('.sale-card .pro-card-head');
 heads.forEach(h=>h.classList.add('hs2026-head'));
 const headerMark=document.querySelector('.page-heading-copy .hdaily-page-mark');
 const pageTitle=document.getElementById('pageTitle');
 if(headerMark&&pageTitle){
  const original=headerMark.innerHTML;
  const calendarPlus='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M12 13v6M9 16h6"/></svg>';
  const updateHeader=()=>{
   const sale=pageTitle.textContent.trim()==='Registrar venta';
   document.body.classList.toggle('hilen-sale-heading-open',sale);
   if(headerMark.dataset.hsSaleIconState===(sale?'sale':'other'))return;
   headerMark.innerHTML=sale?calendarPlus:original;
   headerMark.dataset.hsSaleIconState=sale?'sale':'other';
   headerMark.classList.toggle('hs2026-main-title-icon',sale);
  };
  new MutationObserver(updateHeader).observe(pageTitle,{childList:true,characterData:true,subtree:true});
  updateHeader();
 }
 const list=products?.querySelector('#products');
 if(list){
  const enhance=()=>{
   list.querySelectorAll('.product-row').forEach(row=>{
    if(row.dataset.hs2026Row)return;
    row.dataset.hs2026Row='1';const name=row.querySelector('.pname'),qty=row.querySelector('.pqty'),del=row.querySelector('button.secondary');
    if(name){name.placeholder='Escribe o busca un producto...';name.setAttribute('aria-label','Nombre del producto');const wrap=document.createElement('div');wrap.className='hs2026-product-search-wrap';name.parentNode.insertBefore(wrap,name);wrap.appendChild(name);const glyph=document.createElement('span');glyph.className='hs2026-product-search-icon';glyph.innerHTML=icon('search');wrap.appendChild(glyph)}
    if(qty){
     const holder=document.createElement('div');holder.className='hs2026-qty';
     qty.parentNode.insertBefore(holder,qty);holder.appendChild(qty);
     qty.setAttribute('aria-label','Cantidad de unidades');
     const minus=document.createElement('button'),plus=document.createElement('button');
     minus.type=plus.type='button';minus.textContent='−';plus.textContent='+';
     minus.setAttribute('aria-label','Restar una unidad');plus.setAttribute('aria-label','Agregar una unidad');
     minus.addEventListener('click',()=>{qty.value=String(Math.max(1,(Number(qty.value)||1)-1));qty.dispatchEvent(new Event('input',{bubbles:true}))});
     plus.addEventListener('click',()=>{qty.value=String(Math.max(1,(Number(qty.value)||0)+1));qty.dispatchEvent(new Event('input',{bubbles:true}))});
     holder.prepend(minus);holder.append(plus);
    }
    if(del){del.setAttribute('aria-label','Eliminar artículo de esta venta');del.title='Eliminar artículo'}
   });
  };
  enhance();
  new MutationObserver(enhance).observe(list,{childList:true});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();