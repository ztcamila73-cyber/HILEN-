/* HILEN · Abonos: presentación de la referencia aprobada. No modifica pagos ni Firebase. */
(()=>{
'use strict';
const shapes={
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 3 16 3 16 0V6M4 11v5c0 3 16 3 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
 chart:'<path d="M5 20V13m7 7V7m7 13V3"/>',
 wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M16 12h6v5h-6a2.5 2.5 0 0 1 0-5Z"/>',
 group:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 8a3 3 0 0 1 0 6m2.5 7a5 5 0 0 0-3-5"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 add:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h2M3 12h2M3 18h2"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
 search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
 user:'<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h5"/>',
 tag:'<path d="m20 13-8 8-9-9 8-8h7l2 2v7z"/><circle cx="15" cy="9" r="1"/>',
 save:'<path d="M4 3h14l3 3v15H4zM8 3v7h9V3M8 21v-8h9v8"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 pencil:'<path d="M12 20h9M4 17.8l.7-3.5L15.9 3a2.1 2.1 0 0 1 3 3L7.7 17.1 4 17.8Z"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 warning:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
 trend:'<path d="m3 18 7-7 4 4 7-8M16 7h5v5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
const svg=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.card)+'</svg>';
function prependLabel(label,name){
 if(!label||label.querySelector('.hp26-field-icon'))return;
 const span=document.createElement('span');span.className='hp26-field-icon';span.innerHTML=svg(name);label.prepend(span);
}
function setup(){
 const root=document.getElementById('payments');
 if(!root||root.classList.contains('hp26'))return;
 const portfolio=root.querySelector('.hilen-payment-portfolio'),layout=root.querySelector('.payments-layout-pro');
 const register=root.querySelector('.payment-register-card'),history=root.querySelector('.payment-history-card');
 if(!portfolio||!layout||!register||!history)return;
 root.classList.add('hp26');
 // Icono de monedas del encabezado principal, tal como la referencia.
 const pageTitle=document.getElementById('pageTitle');
 const pageMark=document.querySelector('.page-heading-copy .hdaily-page-mark');
 if(pageTitle&&pageMark){
  const paymentsIcon=svg('coins');
  const updatePaymentsHeading=()=>{
   const isPayments=pageTitle.textContent.trim()==='Abonos';
   document.body.classList.toggle('hilen-payments-heading-open',isPayments);
   if(isPayments){
    pageMark.innerHTML=paymentsIcon;
    pageMark.dataset.hp26Heading='1';
   }else if(pageMark.dataset.hp26Heading==='1'){
    pageMark.dataset.hp26Heading='0';
    const section=pageTitle.textContent.trim();
    if(!['Registrar venta','Registro mensual','Movimientos del día'].includes(section)){
     pageMark.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 20v-5 M11 20V9 M17 20V4"/></svg>';
    }
   }
  };
  new MutationObserver(updatePaymentsHeading).observe(pageTitle,{childList:true,characterData:true,subtree:true});
  updatePaymentsHeading();
 }
 // Mover las tarjetas originales, conservando sus campos, eventos y filtros.
 layout.classList.add('hp26-layout');
 const layoutParent=layout.parentNode;
 layoutParent.insertBefore(register,layout);
 layoutParent.insertBefore(history,layout);
 layout.remove();
 for(const [container,name] of [[portfolio,'chart'],[register,'add'],[history,'list']]){
  const head=container.querySelector('.hilen-payment-portfolio-head,.pro-card-head');
  if(!head)continue;
  head.classList.add('hp26-section-heading');
  const mark=document.createElement('span');mark.className='hp26-section-icon';mark.innerHTML=svg(name);head.prepend(mark);
  if(container!==portfolio){const previous=head.querySelector('.pro-icon');if(previous)previous.remove();}
 }
 const tiles=portfolio.querySelectorAll('.hilen-payment-portfolio-tile');
 const kinds=['wallet','coins','group','receipt'];
 tiles.forEach((tile,i)=>{
  tile.classList.add('hp26-tile','hp26-tile-'+i);
  const heading=tile.querySelector('.hilen-payment-portfolio-heading');
  const old=heading?.querySelector('svg');if(old)old.remove();
  const mark=document.createElement('span');mark.className='hp26-tile-mark';mark.innerHTML=svg(kinds[i]);tile.prepend(mark);
  const text=document.createElement('div');text.className='hp26-tile-body';
  Array.from(tile.children).filter(child=>child!==mark).forEach(el=>text.append(el));tile.append(text);
 });
 // Mantener el formulario original y colocar sus seis controles en dos filas.
 const form=register.querySelector('.payment-form-fields');
 if(form){form.classList.add('hp26-form');}
 const fieldLabels=form?.querySelectorAll('label');
 [ 'search','calendar','coins','card'].forEach((name,i)=>prependLabel(fieldLabels?.[i],name));
 prependLabel(register.querySelector('.hilen-allocation-control>label'),'tag');
 const save=register.querySelector('.save-payment-btn');
 if(save){save.innerHTML=svg('save')+'<span>Guardar abono</span>';}
 const row=register.querySelector('.hilen-allocation-control');
 if(row)row.classList.add('hp26-allocation');
 const filters=history.querySelector('.payment-filter-fields');
 filters?.classList.add('hp26-filters');
 history.querySelectorAll('#paymentPeriodTabs button').forEach(btn=>{
  const original=btn.textContent.trim();
  btn.innerHTML=svg('calendar')+'<span>'+original+'</span>';
 });
 prependLabel(history.querySelector('#paymentYearWrap>label'),'calendar');
 prependLabel(history.querySelector('#paymentMonthWrap>label'),'calendar');
 prependLabel(history.querySelector('#paymentDayWrap>label'),'calendar');
 prependLabel(history.querySelector('.payment-filter-fields>div:last-child>label'),'search');
 // Los mismos movimientos, saldos y acciones, con una presentación más clara.
 const table=document.getElementById('paymentsTable');
 if(table){
  const decorate=()=>{
   const th=table.querySelectorAll('thead th'),icons=['calendar','user','coins','card','trend','tag'];
   th.forEach((cell,i)=>{if(cell.dataset.hp26)return;cell.dataset.hp26='1';cell.innerHTML=svg(icons[i]||'card')+'<span>'+cell.textContent+'</span>'});
   table.querySelectorAll('tbody tr').forEach(tr=>{
    if(tr.dataset.hp26)return;tr.dataset.hp26='1';
    const method=tr.cells[3]?.querySelector('.badge');
    if(method)method.insertAdjacentHTML('afterbegin',svg(method.classList.contains('bank')?'card':'wallet'));
    const status=tr.cells[4]?.querySelector('.badge');
    if(status)status.insertAdjacentHTML('afterbegin',svg(status.classList.contains('debt')?'warning':'info'));
    const actions=tr.querySelectorAll('.action-mini');
    ['eye','pencil','trash'].forEach((name,i)=>{
     const btn=actions[i];if(!btn)return;const original=btn.textContent.trim();
     btn.innerHTML=svg(name);btn.setAttribute('aria-label',original+' abono');btn.title=original+' abono';
    });
   });
  };
  let busy=false;
  new MutationObserver(()=>{if(busy)return;busy=true;decorate();busy=false}).observe(table,{childList:true,subtree:true});
  decorate();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();