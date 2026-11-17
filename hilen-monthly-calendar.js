/* HILEN · selector visual mensual con calendario DD/MM/AAAA.
   Conserva monthlyEntryMonth (AAAA-MM), por lo que nunca crea totales diarios. */
(()=>{
'use strict';
const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const week=['L','M','M','J','V','S','D'];
const pad=n=>String(n).padStart(2,'0');
const validMonth=s=>/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(s||'');
let source,typed,trigger,panel,anchor,cursor=new Date(),opened=false,selectedDay=1,focusBefore;
function display(month,day=1){return validMonth(month)?pad(day)+'/'+month.slice(5,7)+'/'+month.slice(0,4):''}
function parse(v){
 const m=String(v||'').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
 if(!m)return null;
 const d=+m[1],month=+m[2],year=+m[3];
 const date=new Date(year,month-1,d);
 if(year<1900||year>2099||date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==d)return null;
 return {month:year+'-'+pad(month),day:d};
}
function sync(){
 if(!source||!typed)return;
 if(document.activeElement!==typed){
  const month=source.value;
  typed.value=display(month,selectedDay);
  typed.classList.remove('hm-calendar-invalid');typed.removeAttribute('aria-invalid');
 }
}
function set(month,day=1){
 if(!validMonth(month))return false;
 selectedDay=day;
 source.value=month;
 source.dispatchEvent(new Event('change',{bubbles:true}));
 typed.value=display(month,day);
 typed.classList.remove('hm-calendar-invalid');typed.removeAttribute('aria-invalid');
 return true;
}
function commit(){
 const raw=typed.value.trim();
 if(!raw){source.value='';source.dispatchEvent(new Event('change',{bubbles:true}));typed.classList.remove('hm-calendar-invalid');return true}
 const value=parse(raw);
 if(!value){typed.classList.add('hm-calendar-invalid');typed.setAttribute('aria-invalid','true');return false}
 return set(value.month,value.day);
}
function position(){
 if(!opened)return;
 const r=anchor.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;
 panel.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+'px';
 panel.style.top=(window.innerHeight-r.bottom>=h+12?r.bottom+7:Math.max(8,r.top-h-7))+'px';
}
function render(){
 const year=cursor.getFullYear(),month=cursor.getMonth(),first=(new Date(year,month,1).getDay()+6)%7,last=new Date(year,month+1,0).getDate();
 const monthSelect=panel.querySelector('[data-role="month"]'),yearSelect=panel.querySelector('[data-role="year"]');
 monthSelect.innerHTML=months.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');
 yearSelect.innerHTML=Array.from({length:200},(_,i)=>'<option value="'+(1900+i)+'">'+(1900+i)+'</option>').join('');
 monthSelect.value=String(month);yearSelect.value=String(year);
 const active=source.value,cur=year+'-'+pad(month+1);
 const now=new Date(),isThisMonth=now.getFullYear()===year&&now.getMonth()===month;
 let html='<span></span>'.repeat(first);
 for(let d=1;d<=last;d++){
  html+='<button type="button" data-day="'+d+'" class="'+(active===cur&&selectedDay===d?'selected ':'')+(isThisMonth&&d===now.getDate()?'today':'')+'" aria-pressed="'+(active===cur&&selectedDay===d)+'" aria-label="'+d+' de '+months[month]+' de '+year+'">'+d+'</button>';
 }
 panel.querySelector('.hm-calendar-days').innerHTML=html;
 position();
}
function open(){
 if(!commit()&&typed.value.trim())return;
 const value=source.value;
 const now=new Date();
 cursor=validMonth(value)?new Date(+value.slice(0,4),+value.slice(5,7)-1,1):new Date(now.getFullYear(),now.getMonth(),1);
 opened=true;panel.hidden=false;trigger.setAttribute('aria-expanded','true');focusBefore=document.activeElement;render();
}
function close(restore=false){opened=false;panel.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore)focusBefore?.focus?.()}
function init(){
 source=document.getElementById('monthlyEntryMonth');
 if(!source||source.dataset.hmCalendarReady)return;
 source.dataset.hmCalendarReady='1';
 anchor=document.createElement('div');anchor.className='hm-calendar-control';
 source.parentNode.insertBefore(anchor,source);anchor.appendChild(source);
 source.classList.add('hm-calendar-source');source.tabIndex=-1;source.setAttribute('aria-hidden','true');
 typed=document.createElement('input');typed.type='text';typed.id='hmCalendarDateText';typed.className='input hm-calendar-text';typed.inputMode='numeric';typed.autocomplete='off';typed.maxLength=10;typed.placeholder='DD/MM/AAAA';typed.setAttribute('aria-label','Fecha para seleccionar mes y año del registro mensual');
 trigger=document.createElement('button');trigger.type='button';trigger.className='hm-calendar-trigger';trigger.setAttribute('aria-label','Abrir calendario mensual');trigger.setAttribute('aria-expanded','false');
 trigger.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
 anchor.append(typed,trigger);
 const hint=document.createElement('small');hint.className='hm-calendar-hint';hint.textContent='Se guarda el total del mes seleccionado, no de un día individual.';anchor.insertAdjacentElement('afterend',hint);
 panel=document.createElement('div');panel.id='hmCalendarPopup';panel.className='hm-calendar-popup';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Seleccionar mes y año mediante calendario');
 panel.innerHTML='<div class="hm-calendar-bar"><button type="button" data-action="prev" aria-label="Mes anterior">‹</button><select data-role="month" aria-label="Mes"></select><select data-role="year" aria-label="Año"></select><button type="button" data-action="next" aria-label="Mes siguiente">›</button></div><div class="hm-calendar-week">'+week.map(d=>'<span>'+d+'</span>').join('')+'</div><div class="hm-calendar-days"></div><div class="hm-calendar-footer"><button type="button" data-action="today">Hoy</button><button type="button" data-action="close">Cerrar</button></div>';
 document.body.appendChild(panel);
 source.addEventListener('change',sync);
 typed.addEventListener('input',()=>{
  typed.classList.remove('hm-calendar-invalid');typed.removeAttribute('aria-invalid');
  const digits=typed.value.replace(/\D/g,'');
  if(digits.length===8&&!typed.value.includes('/'))typed.value=digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
  const value=parse(typed.value);if(value)set(value.month,value.day);
 });
 typed.addEventListener('blur',()=>{if(typed.value.trim())commit();else if(source.value){source.value='';source.dispatchEvent(new Event('change',{bubbles:true}))}});
 typed.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(commit())typed.blur()}if(e.altKey&&e.key==='ArrowDown'){e.preventDefault();open()}});
 trigger.addEventListener('click',()=>opened?close():open());
 panel.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.day){set(cursor.getFullYear()+'-'+pad(cursor.getMonth()+1),+button.dataset.day);close();return}
  switch(button.dataset.action){
   case 'prev':cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);render();break;
   case 'next':cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);render();break;
   case 'today':{const d=new Date();set(d.getFullYear()+'-'+pad(d.getMonth()+1),d.getDate());close();break}
   case 'close':close();break;
  }
 });
 panel.addEventListener('change',e=>{if(!e.target.matches('select'))return;cursor=new Date(+panel.querySelector('[data-role="year"]').value,+panel.querySelector('[data-role="month"]').value,1);render()});
 document.addEventListener('pointerdown',e=>{if(opened&&!panel.contains(e.target)&&!anchor.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(opened&&e.key==='Escape'){e.preventDefault();close(true)}});
 window.addEventListener('resize',position);document.addEventListener('scroll',position,true);
 // After saving, monthlyEntryMonth is cleared by the existing form.
 document.getElementById('monthlyEntrySaveBtn')?.addEventListener('click',()=>setTimeout(()=>{if(!source.value){selectedDay=1;sync()}},0));
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();