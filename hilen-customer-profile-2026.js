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


/* Icono contextual para el encabezado superior: Clientes y Estados de cuenta. */
(function(){
 'use strict';
 const symbols={
  customers:'<path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 2 18.5V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M22 20v-1.5a4.5 4.5 0 0 0-3.5-4.4M16.5 4.2a3.5 3.5 0 0 1 0 6.6"/>',
  statements:'<path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h7M9 20h5"/>',
  encargos:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M3 11h18M8 7V4h8v3M10 14h4"/>',
  reports:'<path d="M4 21v-8M10 21V9M16 21V4M22 21V12"/>',
  history:'<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 8h6M9 12h6M9 16h6"/>'
 };
 const el=()=>document.querySelector('.top .hdaily-page-mark svg');
 const defaults={markup:null};
 function update(){
  const svg=el();if(!svg)return;
  const section=document.querySelector('#statements.active')?'statements':document.querySelector('#customers.active')?'customers':document.querySelector('#encargos.active')?'encargos':document.querySelector('#reports.active')?'reports':document.querySelector('#history.active')?'history':null;
  if(defaults.markup===null)defaults.markup=svg.innerHTML;
  const wanted=section?symbols[section]:defaults.markup;
  if(svg.innerHTML!==wanted){svg.innerHTML=wanted;svg.setAttribute('viewBox','0 0 24 24');}
 }
 function install(){
  update();
  const targets=['customers','statements','encargos','reports','history'].map(id=>document.getElementById(id)).filter(Boolean);
  for(const t of targets)new MutationObserver(update).observe(t,{attributes:true,attributeFilter:['class']});
  document.querySelectorAll('[onclick^="section("]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(update)));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();


/* HILEN · Encargos visuales y Reportes inteligentes · 23/11/2026
   Sólo lectura: calcula hallazgos usando el snapshot anual existente. */
(function(){
 'use strict';
 const glyphs={
  bag:'<path d="M4 8h16l-1 12H5L4 8Zm4 0V6a4 4 0 0 1 8 0v2M4 12h16"/>',
  list:'<circle cx="4" cy="5" r="1"/><path d="M9 5h12"/><circle cx="4" cy="12" r="1"/><path d="M9 12h12"/><circle cx="4" cy="19" r="1"/><path d="M9 19h12"/>',
  bars:'<path d="M4 21V13M10 21V8M16 21V3M22 21V11"/>',
  eye:'<path d="M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  edit:'<path d="m4 20 4-.8L20 7.2 16.8 4 4.8 16 4 20Z"/><path d="m14.5 6.3 3.2 3.2"/>',
  delete:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  trend:'<path d="m3 18 7-7 4 4 7-8M16 7h5v5"/>',
  alert:'<path d="M12 3 2 21h20L12 3ZM12 10v5M12 18h.01"/>'
 };
 const svg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+glyphs[name]+'</svg>';
 const moneyCO=n=>'$ '+Math.round(Number(n)||0).toLocaleString('es-CO');
 const integer=n=>Number(n)||0;
 const monthLabel=m=>m&&m.name?m.name:'mes';
 const ratio=(n,d)=>d>0?Math.round(n/d*100):0;
 function decorateOrders(){
  const root=document.getElementById('encargos');if(!root)return;
  const head=root.querySelector('.encargos-list-head > div:first-child');
  if(head&&!head.querySelector('.hc-orders-head-icon')){
   const box=document.createElement('span');box.className='hc-orders-head-icon';box.setAttribute('aria-hidden','true');box.innerHTML=svg('list');head.prepend(box);
  }
  const table=root.querySelector('#encargosTable');
  if(table){
   table.querySelectorAll('.action-mini.view,.action-mini.edit,.action-mini.danger').forEach(btn=>{
    if(btn.querySelector('svg'))return;
    const name=btn.classList.contains('view')?'eye':btn.classList.contains('edit')?'edit':'delete';
    btn.setAttribute('aria-label',btn.textContent.trim()+' encargo');
    btn.innerHTML=svg(name);
   });
  }
 }
 function decorateReports(){
  const root=document.getElementById('reports');if(!root)return;
  const head=root.querySelector('.hilen-annual-heading>div:first-child');
  if(head&&!head.querySelector('.hr-report-heading-icon')){
   const box=document.createElement('span');box.className='hr-report-heading-icon';box.setAttribute('aria-hidden','true');box.innerHTML=svg('bars');head.prepend(box);
  }
 }
 function intelligentCards(snapshot){
  const months=(snapshot.months||[]).filter(m=>/^\d{4}-\d{2}$/.test(String(m.month||'')));
  const year=Number(snapshot.year),currentYear=Number(new Date().getFullYear());
  const currentMonth=new Date().getMonth()+1;
  const elapsed=months.filter(m=>year<currentYear||year===currentYear&&Number(m.month.slice(-2))<=currentMonth);
  const t=snapshot.totals||{};
  const findings=[];
  const add=(level,title,body,action)=>findings.push({level,title,body,action});
  // Comparar sólo meses con movimientos registrados y consecutivos; no interpretar ceros como caídas.
  const valid=elapsed.filter(m=>integer(m.income)>0||integer(m.expense)>0||integer(m.salesTotal)>0||integer(m.abonos)>0);
  if(valid.length>=2){
   const newer=valid[valid.length-1],older=valid[valid.length-2];
   const consecutive=(Number(newer.month.slice(-2))-Number(older.month.slice(-2)))===1;
   if(consecutive&&integer(older.salesTotal)>0&&integer(newer.salesTotal)>0){
    const delta=(integer(newer.salesTotal)-integer(older.salesTotal))/integer(older.salesTotal);
    if(delta<=-.2)add('warning','Ventas en descenso',`Las ventas de ${monthLabel(newer)} fueron ${Math.round(-delta*100)} % menores que en ${monthLabel(older)} (${moneyCO(newer.salesTotal)} frente a ${moneyCO(older.salesTotal)}).`,'Revisa qué productos dejaron de venderse y prepara una campaña para recuperar clientes.');
    else if(delta>=.2)add('positive','Crecimiento de ventas',`En ${monthLabel(newer)} las ventas aumentaron ${Math.round(delta*100)} % respecto a ${monthLabel(older)}.`,'Identifica cuáles productos tuvieron mayor demanda para planear nuevas compras.');
   }
  }
  const bad=elapsed.filter(m=>integer(m.income)>0&&integer(m.expense)>integer(m.income));
  if(bad.length){const m=bad[bad.length-1];add('warning','Egresos superiores al ingreso de caja',`En ${monthLabel(m)} se registraron ${moneyCO(m.expense)} en egresos y ${moneyCO(m.income)} en ingresos de caja.`,'Revisa los egresos del mes y las obligaciones antes de comprometer más dinero.');}
  if(integer(t.debt)>0){
   const debtors=integer(snapshot.portfolio?.all?.debtors);
   add('attention','Cartera pendiente para seguimiento',`Al corte quedan ${moneyCO(t.debt)} por cobrar${debtors?' entre '+debtors+' cliente'+(debtors===1?'':'s'):''}.`,'Consulta Clientes con deuda y revisa los últimos abonos antes de ofrecer nuevos créditos.');
  }
  const knownSales=integer(t.paid)+integer(t.credit);
  if(knownSales>0&&ratio(integer(t.credit),knownSales)>=60)add('attention','Alta proporción de ventas a crédito',`${ratio(integer(t.credit),knownSales)} % del valor de ventas con forma de pago identificada corresponde a crédito.`,'Comprueba el ritmo de abonos antes de aumentar las ventas financiadas.');
  if(integer(t.repeatClients)>0&&integer(t.newClients)>0)add('positive','Clientes que regresan',`Se contabilizaron ${integer(t.repeatClients)} participaciones de clientes recurrentes y ${integer(t.newClients)} de nuevos compradores durante los meses del año.`,'Prepara ofertas para quienes compraron más de una vez. Los conteos son mensuales, no personas únicas del año.');
  if(integer(t.historicalUnclassified)>0)add('neutral','Datos históricos sin desglose',`Hay ${moneyCO(t.historicalUnclassified)} en ventas históricas sin tipo de pago detallado.`,'Las recomendaciones sobre contado y crédito se basan únicamente en movimientos con detalle.');
  if(!findings.length){
   if(!valid.length)add('neutral','Aún no hay movimientos suficientes','No se encontraron meses con movimientos detallados o totales registrados que permitan identificar tendencias.','Registra ventas, abonos y egresos para obtener observaciones útiles.');
   else add('neutral','Sin variaciones destacadas','No se detectaron cambios que superen los umbrales definidos con la información disponible.','Consulta los movimientos mensuales y continúa revisando la evolución de tu cartera.');
  }
  const order={warning:0,attention:1,positive:2,neutral:3};
  findings.sort((a,b)=>order[a.level]-order[b.level]);
  const item=f=>'<article class="hri-card hri-'+f.level+'"><span class="hri-card-mark" aria-hidden="true">'+svg(f.level==='warning'?'alert':'trend')+'</span><div><h4>'+f.title+'</h4><p>'+f.body+'</p><small><b>Acción sugerida:</b> '+f.action+'</small></div></article>';
  return '<section class="hri-panel" aria-labelledby="hriTitle"><div class="hri-head"><span class="hri-head-icon">'+svg('trend')+'</span><div><h3 id="hriTitle">Análisis inteligente de HILEN</h3><p>Patrones, alertas y oportunidades calculados a partir de los registros del año '+year+'.</p></div><span class="hri-count">'+findings.length+' hallazgo'+(findings.length===1?'':'s')+'</span></div><div class="hri-grid">'+findings.slice(0,6).map(item).join('')+'</div><p class="hri-method">Análisis automático orientativo, sin predicciones ni cifras inventadas. Los ingresos de caja, ventas a crédito y abonos son conceptos distintos. Los meses sin registros suficientes no se comparan como si fueran caídas.</p></section>';
 }
 function renderInsights(){
  const root=document.getElementById('reports'),area=document.getElementById('hilenAnnualReportView');
  if(!root||!area||!area.querySelector('.hilenviz-dashboard'))return;
  let panel=area.querySelector('.hri-panel');
  try{
   const snap=typeof hilenvizRenderedSnapshots!=='undefined'?hilenvizRenderedSnapshots.reports:null;
   if(!snap||!snap.months)return;
   const holder=document.createElement('div');holder.innerHTML=intelligentCards(snap);
   if(panel)panel.replaceWith(holder.firstElementChild);
   else area.appendChild(holder.firstElementChild);
  }catch(error){console.warn('HILEN: no se pudo calcular el análisis de reportes',error);}
 }
 function start(){
  decorateOrders();decorateReports();renderInsights();
  const orders=document.getElementById('encargosTable');
  if(orders)new MutationObserver(decorateOrders).observe(orders,{childList:true});
  const report=document.getElementById('hilenAnnualReportView');
  if(report)new MutationObserver(()=>{if(!report.querySelector('.hri-panel'))renderInsights()}).observe(report,{childList:true});
  document.querySelectorAll('[onclick^="section("]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(()=>{decorateOrders();decorateReports();renderInsights()})));
  const year=document.getElementById('hilenReportYear');
  if(year)year.addEventListener('change',()=>requestAnimationFrame(renderInsights));
  // La app puede cambiar el año desde controles ubicados dentro de las gráficas.
  if(report)report.addEventListener('change',()=>requestAnimationFrame(renderInsights));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();


/* HILEN · Encargos: panel destacado de alertas, cabecera y tabla.
   Se traslada el botón existente para conservar la función original. */
(function(){
 'use strict';
 const paths={
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  user:'<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  box:'<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>',
  shop:'<path d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6"/>',
  layers:'<path d="m3 7 9 5 9-5-9-5-9 5Zm0 5 9 5 9-5M3 17l9 5 9-5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l.8 3 2.3 1.3 3-.9 2 3.5-2.2 2.2v2.7l2.2 2.2-2 3.5-3-.9-2.3 1.3L14 22h-4l-.8-3-2.3-1.3-3 .9-2-3.5 2.2-2.2v-2.7L2 8.9l2-3.5 3 .9L9.2 5z"/>'
 };
 const svg=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+paths[k]+'</svg>';
 const status=()=>!('Notification' in window)?'unsupported':Notification.permission;
 function refresh(){
  const panel=document.getElementById('hilenEncargosAlertPanel');
  const button=document.getElementById('hilenEncargosAlertButton');
  if(!panel||!button)return;
  const permission=status();
  panel.dataset.permission=permission;
  const title=panel.querySelector('.he-alert-title'),desc=panel.querySelector('.he-alert-description');
  if(permission==='granted'){
   title.textContent='Notificaciones del navegador activadas';
   desc.textContent='HILEN puede avisarte mientras la aplicación esté abierta. Los recordatorios de Google Calendar se administran por separado.';
   button.textContent='Alertas activadas';button.disabled=true;
  }else{
   button.disabled=false;button.textContent=permission==='denied'?'Revisar permisos':'Activar alertas';
   title.textContent=permission==='denied'?'Avisos del navegador bloqueados':'Activa las notificaciones de tus encargos';
   desc.textContent=permission==='denied'?'Habilita las notificaciones en los permisos del navegador para este sitio.':'Recibe avisos de seguimiento cuando HILEN esté abierto y recuerda contactar a tus clientes.';
  }
 }
 function mount(){
  const root=document.getElementById('encargos'),head=root?.querySelector('.encargos-head');
  if(!head)return;
  let panel=root.querySelector('#hilenEncargosAlertPanel');
  if(!panel){
   panel=document.createElement('section');
   panel.id='hilenEncargosAlertPanel';panel.className='he-alert-panel';panel.setAttribute('aria-label','Activar notificaciones de encargos');
   panel.innerHTML='<div class="he-alert-symbol">'+svg('bell')+'</div><div class="he-alert-copy"><strong class="he-alert-title"></strong><p class="he-alert-description"></p></div><div class="he-alert-button-wrap"></div>';
   head.insertAdjacentElement('afterend',panel);
  }
  const button=root.querySelector('.encargos-head-actions button[onclick*="requestReminderPermission"]');
  if(button){
   button.classList.add('he-alert-button');button.id='hilenEncargosAlertButton';
   panel.querySelector('.he-alert-button-wrap').appendChild(button);
   button.addEventListener('click',()=>{setTimeout(refresh,150);setTimeout(refresh,1100)});
  }
  const table=root.querySelector('#encargosTable');
  if(table){
   const names=['user','box','shop','layers','bell','calendar','settings'];
   table.querySelectorAll('thead th').forEach((th,i)=>{
    if(!names[i]||th.querySelector('.he-column-icon'))return;
    const wrap=document.createElement('span');wrap.className='he-column-icon';wrap.innerHTML=svg(names[i]);th.prepend(wrap);
   });
   const label=root.querySelector('[data-hilen-zoom-toolbar="encargos"] .hilen-global-zoom-title');
   if(label){
    const count=table.querySelectorAll('tbody tr').length;
    label.textContent='Tabla de encargos · '+count+' registro'+(count===1?'':'s');
   }
  }
  refresh();
 }
 function start(){
  mount();
  const table=document.getElementById('encargosTable');
  if(table)new MutationObserver(mount).observe(table,{childList:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  document.querySelectorAll('[onclick^="section("]').forEach(btn=>btn.addEventListener('click',()=>requestAnimationFrame(mount)));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
