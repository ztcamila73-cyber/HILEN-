/* HILEN · Publicación mínima de datos del calendario, separada de ventas y clientes.
   Sólo se ejecuta después de que Firebase confirma el estado principal.
   Un fallo de este módulo NO debe impedir guardar los registros del negocio.
*/
(function(){
 'use strict';
 function clean(value,max=180){return String(value==null?'':value).trim().slice(0,max)}
 function isoDay(value){return /^\d{4}-\d{2}-\d{2}$/.test(value||'')?value:''}
 function compact(snapshot,revision){
  const encargos=Array.isArray(snapshot?.encargos)?snapshot.encargos:[];
  const obligaciones=Array.isArray(snapshot?.obligations)?snapshot.obligations:[];
  const asEncargo=e=>({
   id:clean(e?.id,120),status:clean(e?.status,30),clientName:clean(e?.clientName,90),
   request:clean(e?.request,200),reminderDate:isoDay(e?.reminderDate),
   reminderTime:clean(e?.reminderTime,5)
  });
  const asObligation=o=>({
   id:clean(o?.id,120),status:clean(o?.status,30),title:clean(o?.title,140),
   dueDate:isoDay(o?.dueDate),reminderTime:clean(o?.reminderTime,5),
   alertDays:Array.isArray(o?.alertDays)?o.alertDays.filter(n=>Number.isInteger(n)&&n>=0&&n<=28).slice(0,8):[7,3,1,0],
   type:clean(o?.type,30)
  });
  const activeEncargos=encargos.filter(e=>e?.id&&isoDay(e?.reminderDate)&&!['completed','cancelled'].includes(e?.status)).map(asEncargo);
  const activeObligations=obligaciones.filter(o=>o?.id&&isoDay(o?.dueDate)&&!['paid','completed','cancelled'].includes(o?.status)).map(asObligation);
  if(activeEncargos.length+activeObligations.length>300)throw Error('Demasiados recordatorios para la sincronización actual (máximo 300).');
  return {ready:true,schema:1,sourceRevision:Number(revision)||0,updatedAt:new Date().toISOString(),encargos:activeEncargos,obligations:activeObligations};
 }
 window.hilenPublishCalendarFeed=async function(uid,snapshot,revision){
  if(!uid||!snapshot||!window.cloudDb||!window.currentUser) {
   // Las variables cloudDb y currentUser existen como bindings léxicos globales.
   // No comprobarlas vía window: pueden no estar expuestas allí.
  }
  if(typeof cloudDb==='undefined'||!cloudDb||typeof currentUser==='undefined'||currentUser?.id!==uid||typeof localMode==='undefined'||localMode)return false;
  const payload=compact(snapshot,revision);
  const ref=cloudDb.ref('users/'+uid+'/calendarFeed');
  const result=await ref.transaction(prev=>{
   const old=Number(prev?.sourceRevision)||0;
   if(old>payload.sourceRevision)return;
   if(old===payload.sourceRevision&&prev?.ready===true&&
     JSON.stringify(prev.encargos)===JSON.stringify(payload.encargos)&&
     JSON.stringify(prev.obligations)===JSON.stringify(payload.obligations))return;
   return payload;
  },undefined,false);
  return !!result?.committed;
 };
})();