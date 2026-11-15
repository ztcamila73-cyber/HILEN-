/* HILEN · Movimiento del día, diseño aprobado.
   Capa visual solamente. Reutiliza cálculos, registros, filtros y acciones existentes. */
(function(){
'use strict';
const svg={
 bag:'<path d="M5 9h14l1 11H4L5 9Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
 coins:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v5c0 3 16 3 16 0V6M4 11v5c0 3 16 3 16 0v-5M4 16v3c0 3 16 3 16 0v-3"/>',
 receipt:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 12h6M9 16h4"/>',
 money:'<rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M7 9h.01M17 17h.01"/>',
 card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 15h4"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h2M3 12h2M3 18h2"/>'
};
const icon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+svg[name]+'</svg>';
function mount(){
 const root=document.getElementById('dailyActivity');
 if(!root||root.classList.contains('hd2026-ready'))return;
 const take=id=>document.getElementById(id);
 const parts={
  totals:take('hilenDailyTotals'), zoom:root.querySelector('.hdaily-zoom-bar'),
  filters:root.querySelector('.hdaily-ref-filter-line'), count:take('hilenDailyEventCount'),
  events:take('hilenDailyEvents'), chart:take('hilenDailySalesChart'), summary:take('hilenDailySideSummary'),
  historical:take('hilenDailyHistoricalNotice'), note:root.querySelector('.hdaily-ref-explainer')
 };
 if(Object.values(parts).some(v=>!v))return;
 root.classList.add('hd2026-ready');
 root.innerHTML='<div class="hd2026-hidden" id="hd2026Original"></div>'+
 '<div class="hd2026-kpis" id="hd2026Kpis"></div>'+
 '<section class="hd2026-sales"><div class="hd2026-sales-title">'+icon('bag')+'<h2>Detalle de ventas del día</h2></div><div class="hd2026-sales-content"><div class="hd2026-split" id="hd2026Split"></div><div class="hd2026-chart" id="hd2026Chart"></div></div></section>'+
 '<section class="hd2026-cash"><span class="hd2026-cash-icon">'+icon('coins')+'</span><strong>Dinero recibido <span id="hd2026TodayWord">hoy</span> <button type="button" class="hd2026-help" title="Incluye ventas de contado, pagos iniciales, abonos e ingresos adicionales; no incluye crédito sin cobrar." aria-label="Explicación del dinero recibido">?</button></strong><b id="hd2026Received">$ 0</b><span class="hd2026-cash-label">Contado + pagos iniciales + abonos + otros ingresos</span></section>'+
 '<section class="hd2026-ledger"><div class="hd2026-ledger-head"><div class="hd2026-ledger-title"><span class="hd2026-list-icon">'+icon('list')+'</span><div><h2>Detalle de movimientos del día</h2><p>Lista cronológica de todas las ventas, abonos y egresos del día.</p></div></div><div id="hd2026ZoomSlot"></div></div><div id="hd2026FiltersSlot"></div><div id="hd2026CountSlot"></div><div id="hd2026EventsSlot"></div></section><div id="hd2026HistoricalSlot"></div><div id="hd2026NoteSlot"></div>';
 root.querySelector('#hd2026Original').append(parts.totals,parts.summary);
 root.querySelector('#hd2026ZoomSlot').append(parts.zoom);
 root.querySelector('#hd2026FiltersSlot').append(parts.filters);
 root.querySelector('#hd2026CountSlot').append(parts.count);
 root.querySelector('#hd2026EventsSlot').append(parts.events);
 root.querySelector('#hd2026Chart').append(parts.chart);
 root.querySelector('#hd2026HistoricalSlot').append(parts.historical);
 root.querySelector('#hd2026NoteSlot').append(parts.note);
}
function metric(tone,title,amount,count,iconName,filter){
 return '<button type="button" class="hd2026-kpi hd2026-'+tone+'" onclick="hilenDailyFilter(\''+filter+'\')"><span class="hd2026-kpi-icon">'+icon(iconName)+'</span><span class="hd2026-kpi-rule"></span><span class="hd2026-kpi-copy"><strong>'+title+'</strong><b>'+money(amount)+'</b><small>'+count+'</small></span><span class="hd2026-kpi-glint"></span></button>';
}
function refresh(){
 const root=document.getElementById('dailyActivity');
 if(!root?.classList.contains('hd2026-ready'))return;
 const day=hilenDailySelectedDate(),data=hilenDailyDataset(day);
 const expenseCount=data.manual.filter(m=>m.type==='expense').length;
 root.querySelector('#hd2026Kpis').innerHTML=
 metric('gold','Total de ventas',data.totalSold,data.sales.length+' '+(data.sales.length===1?'venta':'ventas'),'bag','sale')+
 metric('green','Total de abonos',data.abonos,data.payments.length+' '+(data.payments.length===1?'abono':'abonos'),'coins','payment')+
 metric('red','Total de egresos',data.expenses,expenseCount+' '+(expenseCount===1?'egreso':'egresos'),'receipt','expense');
 root.querySelector('#hd2026Split').innerHTML=
 '<button type="button" class="hd2026-split-item hd2026-paid" onclick="hilenDailyFilter(\'sale_paid\')"><span class="hd2026-split-icon">'+icon('money')+'</span><span><strong>Contado</strong><b>'+money(data.paidAmount)+'</b><small>'+data.paid.length+' '+(data.paid.length===1?'venta':'ventas')+'</small></span></button>'+
 '<button type="button" class="hd2026-split-item hd2026-credit" onclick="hilenDailyFilter(\'sale_credit\')"><span class="hd2026-split-icon">'+icon('card')+'</span><span><strong>Crédito</strong><b>'+money(data.creditAmount)+'</b><small>'+data.credit.length+' '+(data.credit.length===1?'venta':'ventas')+'</small></span></button>';
 root.querySelector('#hd2026Received').textContent=money(data.received);
 root.querySelector('#hd2026TodayWord').textContent=day===today()?'hoy':'del día';
 const percentage=root.querySelector('#hilenDailySalesChart .hdaily-ref-legend');
 if(percentage){
  const total=data.sales.length;
  percentage.querySelectorAll('div').forEach((el,i)=>{
   const n=i===0?data.paid.length:data.credit.length;
   const pct=total?Math.round(n/total*100):0;
   const b=el.querySelector('b'),small=el.querySelector('small');
   if(b)b.textContent=pct+' %';
   if(small)small.textContent=n+' '+(n===1?'venta':'ventas');
  });
 }
 // Conservar el diseño de tabla y sus botones originales; solo cambiar la
 // descripción visible de las ventas, sin alterar el registro subyacente.
 const heads=root.querySelectorAll('#hilenDailyEvents .hdaily-ref-table th');
 if(heads.length===7){
  const titles=['Hora','Tipo','Descripción','Cliente / Detalle','Valor','Método','Acciones'];
  const paths=[
   '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
   '<path d="M5 6h14m-4-4 4 4-4 4M19 18H5m4-4-4 4 4 4"/>',
   '<path d="M6 2h9l4 4v16H6zM15 2v5h4M9 12h7M9 16h6"/>',
   '<circle cx="12" cy="7" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2H5z"/>',
   svg.coins,
   svg.card,
   '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>'
  ];
  heads.forEach((th,i)=>{
   th.innerHTML='<span class="hd2026-th-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[i]+'</svg></span><span>'+titles[i]+'</span>';
  });
 }
}
function boot(){
 mount();
 if(typeof window.hilenRenderDailyActivity!=='function')return;
 const previous=window.hilenRenderDailyActivity;
 if(previous.__hd2026)return;
 function wrapped(){const result=previous.apply(this,arguments);refresh();return result}
 wrapped.__hd2026=true;
 window.hilenRenderDailyActivity=wrapped;
 if(document.getElementById('hilenDailyDate')?.value)wrapped();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();