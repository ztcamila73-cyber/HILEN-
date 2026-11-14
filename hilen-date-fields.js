/* HILEN · Selector compartido de fechas (DD/MM/AAAA + calendario).
   Mantiene el valor original AAAA-MM-DD utilizado por Firebase y el sistema. */
(()=>{
'use strict';
const excluded=new Set(['saleDate','hilenDailyDate']);
const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let active=null,cursor=new Date(),popup=null,scheduled=false;
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-')};
const readable=iso=>/^\d{4}-\d{2}-\d{2}$/.test(iso||'')?iso.slice(8)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):'';
function parse(value){
 const raw=String(value||'').trim();
 const m=raw.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
 if(!m)return '';
 const day=+m[1],month=+m[2],year=+m[3];
 if(year<1900||year>2100||month<1||month>12||day<1||day>31)return '';
 const date=new Date(year,month-1,day);
 if(date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day)return '';
 return [year,pad(month),pad(day)].join('-');
}
const errorText='Escribe una fecha válida en formato DD/MM/AAAA.';
function sync(wrapper){
 const source=wrapper.querySelector('input[type="date"]'),text=wrapper.querySelector('.hilen-friendly-date-text');
 if(!source||!text||document.activeElement===text)return;
 const value=readable(source.value);
 if(text.value!==value)text.value=value;
 text.classList.remove('hilen-friendly-date-invalid');
 text.removeAttribute('aria-invalid');
}
function setDate(wrapper,iso){
 const source=wrapper.querySelector('input[type="date"]'),text=wrapper.querySelector('.hilen-friendly-date-text');
 if(!source||!text)return;
 if(source.min&&iso&&iso<source.min||source.max&&iso&&iso>source.max){markInvalid(wrapper,'La fecha está fuera del período permitido.');return}
 const changed=source.value!==iso;
 source.value=iso;
 text.value=readable(iso);
 text.classList.remove('hilen-friendly-date-invalid');text.removeAttribute('aria-invalid');
 if(changed){
  source.dispatchEvent(new Event('input',{bubbles:true}));
  source.dispatchEvent(new Event('change',{bubbles:true}));
 }
}
function markInvalid(wrapper,message=errorText){
 const text=wrapper.querySelector('.hilen-friendly-date-text');
 if(!text)return;
 text.classList.add('hilen-friendly-date-invalid');
 text.setAttribute('aria-invalid','true');text.title=message;
}
function commit(wrapper){
 const text=wrapper.querySelector('.hilen-friendly-date-text');
 if(!text)return true;
 const raw=text.value.trim();
 if(!raw){setDate(wrapper,'');return true}
 const iso=parse(raw);
 if(!iso){markInvalid(wrapper);return false}
 setDate(wrapper,iso);return true;
}
function enhance(source){
 if(!(source instanceof HTMLInputElement)||source.type!=='date'||excluded.has(source.id)||source.dataset.hilenDateReady||source.closest('.hilen-friendly-date'))return;
 if(source.classList.contains('hilen-hidden-date')||source.classList.contains('hdaily-ref-native-date'))return;
 source.dataset.hilenDateReady='1';
 const wrapper=document.createElement('span');wrapper.className='hilen-friendly-date';
 source.parentNode.insertBefore(wrapper,source);wrapper.appendChild(source);
 source.classList.add('hilen-friendly-date-source');
 source.tabIndex=-1;source.setAttribute('aria-hidden','true');
 const text=document.createElement('input');
 text.type='text';text.className='input hilen-friendly-date-text';text.inputMode='numeric';text.placeholder='DD/MM/AAAA';
 text.autocomplete='off';text.maxLength=10;text.value=readable(source.value);
 const label=source.id?document.querySelector('label[for="'+CSS.escape(source.id)+'"]'):null;
 text.setAttribute('aria-label',(label?.textContent?.trim()||source.getAttribute('aria-label')||'Fecha')+' (día/mes/año)');
 const button=document.createElement('button');button.type='button';button.className='hilen-friendly-date-open';button.title='Abrir calendario';button.setAttribute('aria-label','Abrir calendario de fecha');
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>';
 wrapper.append(text,button);
 text.addEventListener('focus',()=>sync(wrapper));
 text.addEventListener('input',()=>{
  text.classList.remove('hilen-friendly-date-invalid');text.removeAttribute('aria-invalid');
  const digits=text.value.replace(/\D/g,'');
  if(/^\d{8}$/.test(digits)&&!text.value.includes('/'))text.value=digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
  const iso=parse(text.value);if(iso)setDate(wrapper,iso);
 });
 text.addEventListener('blur',()=>commit(wrapper));
 text.addEventListener('keydown',ev=>{
  if(ev.key==='Enter'){ev.preventDefault();if(commit(wrapper))text.blur()}
  if(ev.key==='ArrowDown'&&ev.altKey){ev.preventDefault();open(wrapper)}
 });
 button.addEventListener('click',()=>{if(active===wrapper){close();return}open(wrapper)});
 source.addEventListener('change',()=>sync(wrapper));
}
function init(){
 document.querySelectorAll('input[type="date"]').forEach(enhance);
 document.querySelectorAll('.hilen-friendly-date').forEach(sync);
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;init();if(active&&!active.isConnected)close()});
}
function getPopup(){
 if(popup)return popup;
 popup=document.createElement('div');popup.id='hilenGlobalDatePicker';popup.className='hilen-global-date-picker';
 popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Elegir fecha');
 popup.innerHTML='<div class="hilen-global-date-bar"><button type="button" data-action="prev" aria-label="Mes anterior">‹</button><select data-role="month" aria-label="Mes"></select><select data-role="year" aria-label="Año"></select><button type="button" data-action="next" aria-label="Mes siguiente">›</button></div><div class="hilen-global-date-days-head"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="hilen-global-date-days"></div><div class="hilen-global-date-actions"><button type="button" data-action="today">Hoy</button><button type="button" data-action="clear">Borrar</button><button type="button" data-action="close">Cerrar</button></div>';
 document.body.append(popup);
 popup.addEventListener('click',ev=>{
  const button=ev.target.closest('button');if(!button||!active)return;
  if(button.dataset.iso){const wrapper=active;close();setDate(wrapper,button.dataset.iso);return}
  switch(button.dataset.action){
   case 'prev':cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);render();break;
   case 'next':cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);render();break;
   case 'today':{const wrapper=active;close();setDate(wrapper,today());break}
   case 'clear':{const wrapper=active;close();setDate(wrapper,'');break}
   case 'close':close();break;
  }
 });
 popup.addEventListener('change',ev=>{
  if(!ev.target.matches('select'))return;
  cursor=new Date(+popup.querySelector('[data-role="year"]').value,+popup.querySelector('[data-role="month"]').value,1);render();
 });
 return popup;
}
function position(){
 if(!active||!popup)return;
 const rect=active.getBoundingClientRect();
 popup.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-popup.offsetWidth-8))+'px';
 const below=window.innerHeight-rect.bottom;
 const top=below>=popup.offsetHeight+12?rect.bottom+8:Math.max(8,rect.top-popup.offsetHeight-8);
 popup.style.top=top+'px';
}
function render(){
 if(!active)return;
 const panel=getPopup(),year=cursor.getFullYear(),month=cursor.getMonth();
 panel.querySelector('[data-role="month"]').innerHTML=months.map((m,i)=>'<option value="'+i+'">'+m+'</option>').join('');
 panel.querySelector('[data-role="year"]').innerHTML=Array.from({length:201},(_,i)=>'<option value="'+(1900+i)+'">'+(1900+i)+'</option>').join('');
 panel.querySelector('[data-role="month"]').value=month;panel.querySelector('[data-role="year"]').value=year;
 const selected=active.querySelector('input[type="date"]')?.value||'';
 const offset=(new Date(year,month,1).getDay()+6)%7,last=new Date(year,month+1,0).getDate();
 let html='<span></span>'.repeat(offset);
 for(let day=1;day<=last;day++){
  const iso=[year,pad(month+1),pad(day)].join('-');
  const disabled=(active.querySelector('input[type="date"]')?.min&&iso<active.querySelector('input[type="date"]').min)||(active.querySelector('input[type="date"]')?.max&&iso>active.querySelector('input[type="date"]').max);
  html+='<button type="button" data-iso="'+iso+'" class="'+(selected===iso?'selected ':'')+(today()===iso?'today':'')+'"'+(disabled?' disabled':'')+'>'+day+'</button>';
 }
 panel.querySelector('.hilen-global-date-days').innerHTML=html;
 panel.classList.add('is-open');position();
}
function open(wrapper){
 if(!commit(wrapper))return;
 active=wrapper;
 const source=wrapper.querySelector('input[type="date"]');
 const date=parse(readable(source?.value))||today();
 cursor=new Date(+date.slice(0,4),+date.slice(5,7)-1,1);render();
}
function close(){if(popup)popup.classList.remove('is-open');active=null}
document.addEventListener('pointerdown',ev=>{if(active&&!popup?.contains(ev.target)&&!active.contains(ev.target))close()});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&active)close()});
window.addEventListener('resize',()=>{if(active)position()});
document.addEventListener('scroll',()=>{if(active)position()},true);
document.addEventListener('click',ev=>{if(ev.target.closest('.nav button, .hilen-view button, .section button'))setTimeout(schedule,0)},true);
const observer=new MutationObserver(records=>{
 if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule();
});
function start(){init();observer.observe(document.body,{childList:true,subtree:true});setTimeout(schedule,300);setTimeout(schedule,1300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.hilenRefreshDateControls=schedule;
})();