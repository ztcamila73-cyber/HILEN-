/* HILEN · Ficha emergente del cliente · referencia visual noviembre 2026.
   Solo lectura: reutiliza db, clientBalance, facturas y abonos existentes. */
(function(){
'use strict';
const moneySafe=n=>money(Number(n)||0);
const fmtDate=d=>d?hilenInvoiceDate(d):'—';
const icon=(name)=>({
 bag:'<path d="M5 8h14l1.5 12h-17L5 8Zm4 1V6a3 3 0 0 1 6 0v3"/>',
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 2 16 2 16 0V6M4 11v5c0 2 16 2 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h5"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 18h3"/>',
 layers:'<path d="m12 2 10 6-10 6L2 8l10-6Zm-10 11 10 6 10-6M2 18l10 5 10-5"/>',
 eye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 document:'<path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h7"/>',
 arrows:'<path d="M4 7h16m-5-5 5 5-5 5M20 17H4m5-5-5 5 5 5"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>'
})[name]||'';
const svg=(name)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icon(name)+'</svg>';
const safeID=v=>encodeURIComponent(String(v));
const card=(type,title,value,sub='')=>'<div class="hcf-kpi '+type+'"><span class="hcf-kpi-icon">'+svg(type==='gold'?'bag':type==='green'?'coins':type==='purple'?'card':'calendar')+'</span><div><span>'+title+'</span><strong>'+value+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</div></div>';
const localDate=d=>fmtDate(d);
const getClient=()=>db.clients.find(x=>String(x.id)===String(activeCustomerId));
const state={query:''};
function open(cid){
  const c=db.clients.find(x=>String(x.id)===String(cid));
  if(!c)return;
  activeCustomerId=c.id;state.query='';
  const start=customerFirstDate(cid),end=today(),year=new Date().getFullYear(),snapshot=clientYearSnapshot(cid,year),life=clientLifecycle(c);
  const sex=c.gender==='male'?'Hombre':c.gender==='female'?'Mujer':(c.gender||'');
  const recurrent=life==='returning';
  const meta='<span class="hcf-pill '+(recurrent?'success':'')+'">'+esc(clientLifecycleLabel(c))+'</span>'+
    '<span class="hcf-pill lilac">'+snapshot.count+' compra'+(snapshot.count===1?'':'s')+' en '+year+'</span>'+
    '<span class="hcf-pill">Registrado: '+esc(c.registeredDate||String(c.createdAt||'').slice(0,10)||'—')+'</span>';
  $('modalContent').innerHTML='<div id="customerPrintArea" class="hcf-root">'+
   '<div class="hcf-heading"><h2>Ficha del cliente</h2><button class="hcf-close" type="button" aria-label="Cerrar ficha" onclick="closeModal()">×</button></div>'+
   '<div class="hcf-profile"><span class="hcf-avatar">'+svg('bag')+'</span><div class="hcf-identity"><h2>'+esc(c.name)+'</h2><p>'+esc(c.phone||'Sin teléfono')+(sex?' · '+esc(sex):'')+'</p><div class="hcf-pills">'+meta+'</div></div><div class="hcf-balance"><span>'+svg('layers')+'</span><div>Estado de la cuenta<strong id="customerHeaderBalance">—</strong></div></div></div>'+
   (c.notes?'<div class="hcf-note"><b>Notas:</b> '+esc(c.notes)+'</div>':'')+
   '<div id="hcfMetrics" class="hcf-metrics"></div>'+
   '<div class="hcf-controls"><label class="hcf-period"><span>Período</span><input id="customerStart" type="date" class="input" value="'+esc(start)+'" aria-label="Fecha inicial"/><span>–</span><input id="customerEnd" type="date" class="input" value="'+esc(end)+'" aria-label="Fecha final"/></label><button class="hcf-btn hcf-refresh" onclick="renderCustomerStatement()">↻ Actualizar período</button><div class="hcf-actions"><button class="hcf-btn" onclick="hilenOpenInvoiceList()">'+svg('document')+' Ver facturas</button><button class="hcf-btn" onclick="hilenStartClientPayment()">＋ Registrar abono</button><button class="hcf-btn" onclick="hilenOpenClientAccount()">'+svg('layers')+' Estado de cuenta</button></div></div>'+
   '<section class="hcf-panel"><div class="hcf-panel-head"><div class="hcf-panel-title"><span>'+svg('arrows')+'</span><div><h3>Movimientos del período</h3><p>Registro de compras, abonos y ajustes del cliente.</p></div></div><label class="hcf-search">'+svg('search')+'<input id="hcfSearch" type="search" placeholder="Buscar por factura o detalle..." aria-label="Buscar movimientos" oninput="hilenFilterCustomerMovements(this.value)"/></label></div><div id="customerStatementBody"></div></section>'+
   '<div id="hcfFooter" class="hcf-footer"></div></div>';
  $('modal').classList.remove('hidden');
  $('modal').classList.add('hcf-modal');
  render();
}
function movements(cid,end){
  const out=[];
  (db.sales||[]).filter(s=>String(s.clientId)===String(cid)&&s.date<=end).forEach(s=>out.push({
    date:s.date,time:s.time||'',createdAt:s.createdAt||'',kind:s.type==='credit'?'sale':'paidSale',id:s.id,amount:s.type==='credit'?hilenPrincipal(s):hilenSaleNetTotal(s),
    reference:s.type==='credit'?hilenInvoiceCode(s):'',detail:(s.items||[]).map(i=>(i.name||'Artículo')+' × '+(Number(i.qty)||1)).join(', ')||'Compra a crédito'
  }));
  (db.payments||[]).filter(p=>String(p.clientId)===String(cid)&&p.date<=end).forEach(p=>out.push({
    date:p.date,time:p.time||'',createdAt:p.createdAt||'',kind:'pay',id:p.id,amount:Number(p.amount)||0,
    reference:'',detail:p.destination==='bank'?'Recibido en Nequi':'Recibido en efectivo'
  }));
  const c=db.clients.find(x=>String(x.id)===String(cid));
  const adjustment=Number(c?.balanceAdjustment)||0;
  if(adjustment){
    const d=c.balanceAdjustmentDate||String(c.balanceAdjustedAt||'').slice(0,10)||customerFirstDate(cid);
    if(d<=end)out.push({date:d,time:'',createdAt:c.balanceAdjustedAt||'',kind:'adjust',id:'adjustment',amount:adjustment,reference:'',detail:c.balanceAdjustmentNote||'Ajuste manual de saldo'});
  }
  out.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.time).localeCompare(String(b.time))||String(a.createdAt).localeCompare(String(b.createdAt))||String(a.id).localeCompare(String(b.id)));
  let running=0;
  return out.map(m=>{running+=m.kind==='sale'?m.amount:m.kind==='pay'?-m.amount:m.kind==='paidSale'?0:m.amount;return {...m,running:Math.max(0,running)}});
}
function filter(q){
 state.query=String(q||'').trim().toLocaleLowerCase('es');
 const body=document.getElementById('hcfMovements');
 if(!body)return;
 body.querySelectorAll('tr[data-match]').forEach(tr=>{tr.hidden=!!state.query&&!tr.dataset.match.includes(state.query)});
 const shown=[...body.querySelectorAll('tr[data-match]')].some(tr=>!tr.hidden);
 const empty=document.getElementById('hcfEmptySearch');if(empty)empty.hidden=shown||!state.query;
}
function render(){
 const c=getClient();if(!c)return;
 const start=$('customerStart')?.value||customerFirstDate(c.id),end=$('customerEnd')?.value||today();
 if(start>end)return showToast('Rango de fechas inválido','La fecha inicial no puede ser posterior a la final.','error');
 const sales=(db.sales||[]).filter(s=>String(s.clientId)===String(c.id)&&s.date>=start&&s.date<=end);
 const credit=sales.filter(s=>s.type==='credit'),total=sales.reduce((n,s)=>n+hilenSaleNetTotal(s),0);
 const creditTotal=credit.reduce((n,s)=>n+hilenPrincipal(s),0);
 const payments=(db.payments||[]).filter(p=>String(p.clientId)===String(c.id)&&p.date>=start&&p.date<=end);
 const periodPaid=payments.reduce((n,p)=>n+(Number(p.amount)||0),0);
 const balance=clientBalance(c.id,end),last=(db.sales||[]).filter(s=>String(s.clientId)===String(c.id)&&s.date<=end).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
 const safeBalance=Math.max(0,Number(balance.balance)||0);
 $('customerHeaderBalance').textContent=moneySafe(safeBalance);
 $('hcfMetrics').innerHTML=card('gold','Total comprado',moneySafe(total))+card('green','Total abonado',moneySafe(periodPaid))+card('purple','Total a crédito',moneySafe(creditTotal))+card('blue','Última compra',last?localDate(last.date):'Sin compras');
 const ledger=movements(c.id,end).filter(m=>m.date>=start);
 const rows=ledger.map(m=>{
 const sale=m.kind==='sale',payment=m.kind==='pay',paidSale=m.kind==='paidSale';
 const action=payment?'hilenStatementPaymentDetail':sale?'hilenStatementSaleDetail':paidSale?'openCustomerPurchaseDetail':'';
 const actionBtn=action?'<button class="hcf-eye" type="button" title="Ver detalle" aria-label="Ver movimiento" onclick="'+action+'(decodeURIComponent(\''+safeID(m.id)+'\'))">'+svg('eye')+'</button>':'<span class="hcf-muted">—</span>';
 const movement=payment?'Abono recibido':sale?'Compra a crédito':paidSale?'Compra pagada':'Ajuste de saldo';
 const description=payment?'Reduce la deuda':sale?'Aumenta la deuda':paidSale?'No genera deuda':'Corrección manual';
 const rowContent=(m.reference?'Factura '+m.reference+' ':'')+m.detail+' '+movement;
 return '<tr class="'+(payment?'hcf-payment':sale?'hcf-sale':'hcf-adjust')+'" data-match="'+esc((rowContent+' '+m.date).toLocaleLowerCase('es'))+'">'+
   '<td><b>'+esc(localDate(m.date))+'</b><small>'+esc(m.time)+'</small></td>'+
   '<td><div class="hcf-move"><span class="hcf-move-icon">'+svg(payment?'coins':sale||paidSale?'bag':'arrows')+'</span><div><b>'+movement+'</b><small>'+description+'</small></div></div></td>'+
   '<td><span class="hcf-detail">'+(sale?svg('document')+'<b>Factura '+esc(m.reference)+'</b>':'')+'<small>'+esc(m.detail)+'</small></span></td>'+
   '<td class="hcf-number">'+(m.kind==='adjust'&&m.amount<0?'−':'')+moneySafe(Math.abs(m.amount))+'</td>'+
   '<td class="hcf-number"><b>'+moneySafe(m.running)+'</b></td>'+
   '<td>'+actionBtn+'</td></tr>';
 }).join('');
 $('customerStatementBody').innerHTML='<div class="hcf-table-wrap"><table class="hcf-table"><thead><tr><th>Fecha</th><th>Movimiento</th><th>Detalle</th><th>Valor del movimiento</th><th>Saldo restante</th><th>Acción</th></tr></thead><tbody id="hcfMovements">'+(rows||'<tr><td colspan="6" class="hcf-no-data">Sin movimientos de crédito o abonos en este período.</td></tr>')+'</tbody></table><div id="hcfEmptySearch" class="hcf-no-data" hidden>No hay movimientos que coincidan con la búsqueda.</div></div>';
 $('hcfFooter').innerHTML='<div class="hcf-footer-title">'+svg('layers')+'<strong>Resumen del período</strong></div><div><span>Compras a crédito</span><strong>'+moneySafe(creditTotal)+'</strong></div><div><span>Abonos acumulados</span><strong>'+moneySafe(periodPaid)+'</strong></div><div class="hcf-pending"><span>Saldo pendiente</span><strong>'+moneySafe(safeBalance)+'</strong></div>';
 filter(state.query);
 if(typeof hilenAttachTableZooms==='function')requestAnimationFrame(()=>hilenAttachTableZooms());
}
const hostModal=$('modal');if(hostModal){new MutationObserver(()=>{if(!hostModal.querySelector('#customerPrintArea.hcf-root'))hostModal.classList.remove('hcf-modal')}).observe($('modalContent'),{childList:true});}
window.openCustomer=open;
window.renderCustomerStatement=render;
window.hilenFilterCustomerMovements=filter;
})();

/* El zoom de la tabla Clientes lo administra exclusivamente hilenInstallAllTableZoom()
   desde index.html. Se retiró el segundo control local para evitar duplicados. */

/* Símbolos vectoriales en las cabeceras del panel Clientes. Solo apariencia. */
(function(){
'use strict';
const icons={
 layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 female:'<circle cx="12" cy="8" r="5.5"/><path d="M12 13.5V22M8 18h8"/>',
 male:'<circle cx="10" cy="14" r="5.5"/><path d="m14 10 7-7M15.5 3H21v5.5"/>'
};
const svg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'+icons[name]+'</svg>';
function decorate(){
 const root=document.getElementById('customers');if(!root)return;
 [['.hilen-client-collections .hilen-annual-heading','layers'],['.customer-registry-card .registry-head','users']].forEach(([selector,name])=>{
   const el=root.querySelector(selector);
   if(!el||el.querySelector('.hc-section-symbol'))return;
   const icon=document.createElement('span');
   icon.className='hc-section-symbol';icon.setAttribute('aria-hidden','true');icon.innerHTML=svg(name);
   el.insertBefore(icon,el.firstChild);
 });
 const gender=root.querySelectorAll('.client-kpis-pro>.client-kpi:nth-child(5) .kpi-round,.client-kpis-pro>.client-kpi:nth-child(6) .kpi-round');
 gender.forEach((el,i)=>{
  if(el.classList.contains('hc-gender-icon'))return;
  el.classList.add('hc-gender-icon');el.innerHTML=svg(i===0?'female':'male');
 });
}
function start(){
 const root=document.getElementById('customers');if(!root)return;
 decorate();
 const observer=new MutationObserver(decorate);
 observer.observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
