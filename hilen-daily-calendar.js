/* HILEN · Calendario de Movimiento del día, formato DD/MM/AAAA.
   Vista de selección; conserva hilenDailyDate como fuente de fecha existente. */
(function(){
'use strict';
const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const days=['L','M','M','J','V','S','D'];
const pad=n=>String(n).padStart(2,'0');
let input,anchor,popup,cursor,open=false,oldFocused;
function readable(iso){return /^\d{4}-\d{2}-\d{2}$/.test(iso||'')?iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):''}
function parse(raw){
 const m=String(raw||'').trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
 if(!m)return '';
 const d=+m[1],mon=+m[2],y=+m[3];
 if(y<1900||y>2100||mon<1||mon>12)return '';
 const date=new Date(y,mon-1,d);
 if(date.getFullYear()!==y||date.getMonth()!==mon-1||date.getDate()!==d)return '';
 return y+'-'+pad(mon)+'-'+pad(d);
}
function native(){return document.getElementById('hilenDailyDate')}
function sync(){
 if(!input)return;
 const iso=native()?.value||'';
 if(document.activeElement!==input)input.value=readable(iso);
 input.classList.remove('hilen-daily-date-invalid');
 input.removeAttribute('aria-invalid');
 if(open)render();
}
function set(iso){
 if(!iso)return false;
 const source=native();if(!source)return false;
 source.value=iso;
 input.value=readable(iso);
 input.classList.remove('hilen-daily-date-invalid');
 input.removeAttribute('aria-invalid');
 if(typeof window.hilenRenderDailyActivity==='function')window.hilenRenderDailyActivity();
 else source.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function commit(){
 const iso=parse(input.value);
 if(!iso){
  input.classList.add('hilen-daily-date-invalid');input.setAttribute('aria-invalid','true');
  input.title='Escribe una fecha válida en formato DD/MM/AAAA';
  return false;
 }
 return set(iso);
}
function position(){
 if(!open||!popup||!anchor)return;
 const a=anchor.getBoundingClientRect(),w=popup.offsetWidth,h=popup.offsetHeight;
 let left=Math.max(8,Math.min(a.left,innerWidth-w-8));
 let top=a.bottom+8;
 if(top+h>innerHeight-8&&a.top>h+10)top=a.top-h-8;
 else top=Math.max(8,Math.min(top,innerHeight-h-8));
 popup.style.left=left+'px';popup.style.top=top+'px';
}
function render(){
 if(!popup)return;
 const y=cursor.getFullYear(),m=cursor.getMonth(),offset=(new Date(y,m,1).getDay()+6)%7,
 last=new Date(y,m+1,0).getDate(),selected=native()?.value||'',now=typeof today==='function'?today():'';
 const month=popup.querySelector('[data-role="month"]'),year=popup.querySelector('[data-role="year"]');
 month.innerHTML=names.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join('');
 year.innerHTML=Array.from({length:201},(_,i)=>'<option value="'+(1900+i)+'">'+(1900+i)+'</option>').join('');
 month.value=String(m);year.value=String(y);
 let html='<span class="hilen-day-blank"></span>'.repeat(offset);
 for(let d=1;d<=last;d++){
  const iso=y+'-'+pad(m+1)+'-'+pad(d);
  html+='<button type="button" data-iso="'+iso+'" class="'+(iso===selected?'selected ':'')+(iso===now?'today':'')+'" aria-label="'+d+' de '+names[m]+' de '+y+'" aria-pressed="'+(iso===selected)+'">'+d+'</button>';
 }
 popup.querySelector('.hilen-daily-calendar-days').innerHTML=html;
 position();
}
function show(){
 if(!popup) return;
 const value=parse(input.value)||native()?.value||(typeof today==='function'?today():'');
 const d=new Date((value||'2026-01-01')+'T12:00:00');
 cursor=new Date(d.getFullYear(),d.getMonth(),1);
 open=true;popup.hidden=false;
 anchor.querySelector('.hilen-daily-calendar-trigger').setAttribute('aria-expanded','true');
 oldFocused=document.activeElement;
 render();
}
function hide(restore=false){
 if(!popup)return;
 open=false;popup.hidden=true;
 anchor?.querySelector('.hilen-daily-calendar-trigger')?.setAttribute('aria-expanded','false');
 if(restore)oldFocused?.focus?.();
}
function move(months){cursor=new Date(cursor.getFullYear(),cursor.getMonth()+months,1);render()}
function setup(){
 const bar=document.getElementById('hilenDailyTopPicker'),label=bar?.querySelector('.hdaily-ref-date-display'),source=native();
 if(!bar||!label||!source||bar.dataset.hilenCalendarInstalled)return;
 bar.dataset.hilenCalendarInstalled='1';anchor=label;
 label.removeAttribute('title');
 label.innerHTML='<input id="hilenDailyDateTyped" class="hilen-daily-date-typed" type="text" inputmode="numeric" maxlength="10" autocomplete="off" aria-label="Fecha del movimiento del día, día mes año" placeholder="DD/MM/AAAA"><button type="button" class="hilen-daily-calendar-trigger" aria-label="Abrir calendario del movimiento del día" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg></button>';
 source.type='date';source.className='hilen-daily-date-source';source.tabIndex=-1;
 label.appendChild(source);
 input=document.getElementById('hilenDailyDateTyped');
 popup=document.createElement('div');popup.id='hilenDailyCalendarPopup';popup.className='hilen-daily-calendar-popup';popup.hidden=true;
 popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Seleccionar fecha del movimiento del día');
 popup.innerHTML='<div class="hilen-daily-calendar-header"><button type="button" data-action="prev" aria-label="Mes anterior">‹</button><select data-role="month" aria-label="Mes"></select><select data-role="year" aria-label="Año"></select><button type="button" data-action="next" aria-label="Mes siguiente">›</button></div><div class="hilen-daily-calendar-week">'+days.map(d=>'<span>'+d+'</span>').join('')+'</div><div class="hilen-daily-calendar-days"></div><div class="hilen-daily-calendar-footer"><button type="button" data-action="today">Hoy</button><button type="button" data-action="close">Cerrar</button></div>';
 document.body.appendChild(popup);
 input.value=readable(source.value||(typeof today==='function'?today():''));
 input.addEventListener('input',()=>{
  input.classList.remove('hilen-daily-date-invalid');input.removeAttribute('aria-invalid');
  const digits=input.value.replace(/\D/g,'');
  if(digits.length===8&&!input.value.includes('/'))input.value=digits.slice(0,2)+'/'+digits.slice(2,4)+'/'+digits.slice(4);
  const iso=parse(input.value);if(iso)set(iso);
 });
 input.addEventListener('blur',()=>{
  if(!input.value.trim()){sync();return}
  if(parse(input.value))commit();else {input.classList.add('hilen-daily-date-invalid');input.setAttribute('aria-invalid','true')}
 });
 input.addEventListener('keydown',ev=>{
  if(ev.key==='Enter'){ev.preventDefault();if(commit())hide();}
  if(ev.key==='ArrowDown'&&ev.altKey){ev.preventDefault();show()}
 });
 label.querySelector('.hilen-daily-calendar-trigger').addEventListener('click',()=>open?hide():show());
 popup.addEventListener('click',ev=>{
  const button=ev.target.closest('button');if(!button)return;
  if(button.dataset.iso){set(button.dataset.iso);hide();return}
  switch(button.dataset.action){
   case 'prev':move(-1);break;case 'next':move(1);break;
   case 'today':set(typeof today==='function'?today():new Date().toISOString().slice(0,10));hide();break;
   case 'close':hide();break;
  }
 });
 popup.addEventListener('change',ev=>{
  if(!ev.target.closest('select'))return;
  cursor=new Date(+popup.querySelector('[data-role="year"]').value,+popup.querySelector('[data-role="month"]').value,1);render();
 });
 document.addEventListener('pointerdown',ev=>{if(open&&!popup.contains(ev.target)&&!anchor.contains(ev.target))hide()});
 document.addEventListener('keydown',ev=>{if(open&&ev.key==='Escape'){ev.preventDefault();hide(true)}});
 window.addEventListener('resize',position);
 document.addEventListener('scroll',position,true);
 // The original date shifting buttons and refresh must also update the typed date.
 if(typeof window.hilenRenderDailyActivity==='function'){
  const prior=window.hilenRenderDailyActivity;
  if(!prior.__hilenDatePopup){
   function wrapped(){const result=prior.apply(this,arguments);sync();return result}
   wrapped.__hilenDatePopup=true;window.hilenRenderDailyActivity=wrapped;
  }
 }
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();