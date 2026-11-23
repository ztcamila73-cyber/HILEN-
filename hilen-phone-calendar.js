/* HILEN · Exportar encargos y obligaciones al calendario del celular (Android).
   No utiliza OAuth ni permisos de Google API, no promete sincronización bidireccional.
   Google Calendar abre un borrador; ICS incluye VALARM y recurrencia, sujeto al importador. */
(function(){
'use strict';
const tz='America/Bogota';
const icon='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18M12 13v6M9 16h6"/></svg>';
function find(kind,id){
 const collection=kind==='encargo'?db.encargos:db.obligations;
 return (collection||[]).find(x=>String(x.id)===String(id));
}
function validDate(s){return /^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(new Date(String(s)+'T12:00:00').getTime())}
function details(kind,item){
 const date=kind==='encargo'?item.reminderDate:item.dueDate;
 if(!validDate(date))throw new Error('Primero registra una fecha válida.');
 const time=/^([01]\d|2[0-3]):[0-5]\d$/.test(item.reminderTime||'')?item.reminderTime:'09:00';
 const [y,m,d]=date.split('-').map(Number);
 const [hh,mm]=time.split(':').map(Number);
 const start=new Date(y,m-1,d,hh,mm),end=new Date(start.getTime()+30*60000);
 const title=kind==='encargo'?'HILEN · Encargo: '+(item.request||'Seguimiento'):'HILEN · '+(item.title||'Obligación');
 const description=kind==='encargo'
 ?'Cliente: '+(item.clientName||'')+'\nProveedor: '+(item.supplier||'')+'\n'+(item.notes||'')
 :'Tipo: '+(item.type==='service'?'Servicio o mantenimiento':'Proveedor')+'\n'+(item.party||'')+'\n'+(item.notes||'');
 const alertDays=kind==='encargo'?[0]:Array.isArray(item.alertDays)?item.alertDays:[7,3,1,0];
 return {start,end,title,description,alertDays,repeat:item.repeat||'none',kind,id:item.id};
}
function pad(n){return String(n).padStart(2,'0')}
function dt(d){return d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'T'+pad(d.getHours())+pad(d.getMinutes())+'00'}
function openGoogle(kind,id){
 try{
  const item=find(kind,id);if(!item)throw Error('No se encontró el registro.');
  const e=details(kind,item);
  const url='https://calendar.google.com/calendar/render?action=TEMPLATE'+
   '&text='+encodeURIComponent(e.title)+'&dates='+dt(e.start)+'/'+dt(e.end)+
   '&ctz='+encodeURIComponent(tz)+'&details='+encodeURIComponent(e.description+'\n\nComprueba las notificaciones y pulsa Guardar. Creado desde HILEN.');
  window.open(url,'_blank','noopener,noreferrer');
  showToast('Completa el evento en tu calendario','Confirma Guardar y verifica las alertas del teléfono. La conexión de Google Calendar API no es necesaria.','info');
 }catch(err){showToast('No se pudo abrir el calendario',String(err.message||err),'warning')}
}
function escapeICS(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function recur(v){return {weekly:'FREQ=WEEKLY',monthly:'FREQ=MONTHLY',quarterly:'FREQ=MONTHLY;INTERVAL=3',yearly:'FREQ=YEARLY'}[v]||''}
function downloadICS(kind,id){
 try{
  const item=find(kind,id);if(!item)throw Error('No se encontró el registro.');
  const e=details(kind,item),alerts=[...new Set(e.alertDays.map(Number))].filter(n=>Number.isInteger(n)&&n>=0&&n<=28);
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HILEN//Agenda//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
   'UID:hilen-'+String(kind)+'-'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'')+'@hilen.local',
   'DTSTAMP:'+stamp,'DTSTART;TZID='+tz+':'+dt(e.start),'DTEND;TZID='+tz+':'+dt(e.end),
   'SUMMARY:'+escapeICS(e.title),'DESCRIPTION:'+escapeICS(e.description)];
  if(recur(e.repeat))lines.push('RRULE:'+recur(e.repeat));
  for(const n of (alerts.length?alerts:[0]))lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+escapeICS(e.title),'TRIGGER:-PT'+(n*1440)+'M','END:VALARM');
  lines.push('END:VEVENT','END:VCALENDAR');
  const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='HILEN_'+kind+'_'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'')+'.ics';
  document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Evento preparado','Abre el archivo .ics en una aplicación compatible y comprueba que sus alertas estén activadas.','info');
 }catch(err){showToast('No se pudo preparar el evento',String(err.message||err),'warning')}
}
function buttons(kind,id){
 const safe=encodeURIComponent(String(id));
 return '<div class="hilen-phone-calendar-actions">'+
 '<button type="button" class="hilen-phone-calendar-btn" onclick="hilenPhoneCalendarOpen(\''+kind+'\',decodeURIComponent(\''+safe+'\'))">'+icon+' Agregar al calendario</button>'+
 '<button type="button" class="hilen-phone-calendar-file" onclick="hilenPhoneCalendarDownload(\''+kind+'\',decodeURIComponent(\''+safe+'\'))" title="Descargar evento .ics">Descargar .ics</button></div>';
}
function augmentEncargos(){
 const table=document.getElementById('encargosTable');if(!table)return;
 table.querySelectorAll('tbody tr').forEach(tr=>{
  const btn=tr.querySelector('.action-mini.view[onclick*="viewEncargo"]');
  if(!btn||tr.querySelector('.hilen-phone-calendar-actions'))return;
  const id=btn.getAttribute('onclick').match(/viewEncargo\('([^']+)'\)/)?.[1];
  const item=id?find('encargo',id):null;
  if(!item?.reminderDate)return;
  const actions=tr.querySelector('.action-group')||btn.parentElement;
  actions.insertAdjacentHTML('afterend',buttons('encargo',id));
 });
}
function augmentAgenda(){
 const root=document.getElementById('hilenObligationList');if(!root)return;
 root.querySelectorAll('.ha2-event-ops[data-oid]').forEach(ops=>{
  if(ops.querySelector('.hilen-phone-calendar-actions'))return;
  const id=ops.dataset.oid,item=find('obligation',id);
  if(!item?.dueDate)return;
  ops.insertAdjacentHTML('beforeend',buttons('obligation',id));
 });
}
function augmentModal(){
 const content=document.getElementById('modalContent');
 if(!content?.querySelector('.encargo-modal'))return;
 const old=content.querySelector('.hilen-phone-calendar-actions');if(old)return;
 const editButton=content.querySelector('.encargo-modal-actions button[onclick*="openEncargoForm"]');
 const match=editButton?.getAttribute('onclick')?.match(/openEncargoForm\('([^']+)'\)/);
 if(match&&find('encargo',match[1])?.reminderDate)content.querySelector('.encargo-modal-actions')?.insertAdjacentHTML('beforebegin',buttons('encargo',match[1]));
}
function augment(){
 augmentEncargos();augmentAgenda();augmentModal();
}
function start(){
 augment();
 // La aplicación reconstruye las tablas al filtrar; sólo escuchar tablas relevantes.
 for(const id of ['encargosTable','hilenObligationList','modalContent']){
  const el=document.getElementById(id);
  if(el)new MutationObserver(augment).observe(el,{childList:true,subtree:true});
 }
}
window.hilenPhoneCalendarOpen=openGoogle;
window.hilenPhoneCalendarDownload=downloadICS;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();