/* HILEN: sugerencias de articulos basadas en compras existentes.
   No modifica ventas ni sincronizacion; solo ayuda a completar el nombre. */
(function(){
'use strict';
const common=['Argolla','Argollas','Aretes','Cadena','Pulsera','Anillo','Topo','Topos de seguridad','Juego de accesorios','Reloj','Correa','Bolso','Billetera','Cosmetiquera','Gancho para cabello','Collar'];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
let active=null,list=null,selection=0,results=[];
function getSuggestions(query){
 const q=normalize(query);
 if(!q)return [];
 const map=new Map();
 common.forEach(name=>map.set(normalize(name),{name,count:0,last:''}));
 if(typeof db!=='undefined'&&Array.isArray(db.sales)){
  db.sales.forEach(s=>{(s.items||[]).forEach(item=>{
   const name=String(item.name||'').trim(),key=normalize(name);
   if(!key)return;
   const old=map.get(key)||{name,count:0,last:''};
   old.count+=1;
   if(String(s.date||'')>=old.last){old.last=String(s.date||'');old.name=name;}
   map.set(key,old);
  })});
 }
 return [...map.values()].filter(x=>normalize(x.name).includes(q))
  .sort((a,b)=>{
   const x=normalize(a.name),y=normalize(b.name);
   return Number(!x.startsWith(q))-Number(!y.startsWith(q))||b.count-a.count||String(b.last).localeCompare(String(a.last))||x.localeCompare(y,'es');
  }).slice(0,7);
}
function ensure(){
 if(list)return list;
 list=document.createElement('div');list.id='hilenProductSuggestions';list.className='hilen-product-suggestions';list.hidden=true;
 list.setAttribute('role','listbox');list.setAttribute('aria-label','Sugerencias de artículos');
 document.body.appendChild(list);
 return list;
}
function position(){
 if(!active||!list||list.hidden)return;
 const rect=active.getBoundingClientRect(),height=window.innerHeight,width=window.innerWidth;
 const popupWidth=Math.max(220,Math.min(390,width-20,rect.width+110));
 list.style.width=popupWidth+'px';
 list.style.left=Math.max(10,Math.min(rect.left,width-popupWidth-10))+'px';
 const spaceBottom=height-rect.bottom;
 if(spaceBottom>210||spaceBottom>rect.top){list.style.top=Math.min(height-10,rect.bottom+5)+'px';list.style.bottom='auto';list.style.maxHeight=Math.max(90,Math.min(290,spaceBottom-14))+'px';}
 else {list.style.bottom=Math.max(8,height-rect.top+5)+'px';list.style.top='auto';list.style.maxHeight=Math.max(90,Math.min(290,rect.top-14))+'px';}
}
function close(){if(list)list.hidden=true;if(active)active.setAttribute('aria-expanded','false');active=null;results=[]}
function choose(index){
 const input=active,entry=results[index];
 if(!input||!entry)return;
 input.value=entry.name;
 input.dispatchEvent(new Event('input',{bubbles:true}));
 close();input.focus();
}
function render(input){
 const q=input.value.trim();
 if(!q){close();return}
 active=input;results=getSuggestions(q);
 ensure();
 if(!results.length){close();return}
 selection=0;
 list.innerHTML=results.map((item,i)=>'<button type="button" role="option" data-index="'+i+'" aria-selected="'+(i===selection)+'"><span class="hilen-product-suggest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m20 13-8 8-9-9 8-8h7l2 2z"/><circle cx="15" cy="9" r="1.2"/></svg></span><span class="hilen-product-suggest-name">'+escapeHTML(item.name)+'<small>'+(item.count?'Usado en '+item.count+' venta'+(item.count===1?'':'s'):'Artículo sugerido')+'</small></span></button>').join('');
 list.hidden=false;input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls','hilenProductSuggestions');position();
}
function escapeHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
document.addEventListener('input',ev=>{if(ev.target.matches('#newSale .product-row .pname'))render(ev.target)});
document.addEventListener('focusin',ev=>{if(ev.target.matches('#newSale .product-row .pname')&&ev.target.value.trim())render(ev.target);else if(active&&!ev.target.closest('#hilenProductSuggestions'))close()});
document.addEventListener('keydown',ev=>{
 if(!active||!list||list.hidden||ev.target!==active)return;
 if(ev.key==='Escape'){ev.preventDefault();close();return}
 if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){
  ev.preventDefault();selection=(selection+(ev.key==='ArrowDown'?1:-1)+results.length)%results.length;
  [...list.children].forEach((b,i)=>b.setAttribute('aria-selected',String(i===selection)));
  list.children[selection]?.scrollIntoView({block:'nearest'});return;
 }
 if(ev.key==='Enter'&&results.length){ev.preventDefault();choose(selection)}
});
document.addEventListener('pointerdown',ev=>{
 const b=ev.target.closest('#hilenProductSuggestions [data-index]');
 if(b){ev.preventDefault();choose(Number(b.dataset.index));return}
 if(active&&!ev.target.closest('#newSale .product-row .pname'))close();
});
window.addEventListener('resize',position);
document.addEventListener('scroll',position,true);
})();