/* HILEN · Zoom independiente de Registrar venta.
   Únicamente modifica la escala visual de su formulario; no altera datos, cálculos, guardados ni el zoom general. */
(()=>{
 "use strict";
 const KEY="HILEN_NEW_SALE_ZOOM_V1",MIN=80,MAX=140,STEP=10;
 let zoom=100;
 try{const stored=Number(localStorage.getItem(KEY));if(Number.isFinite(stored)&&stored>=MIN&&stored<=MAX)zoom=stored}catch(_){}
 function apply(){
  const section=document.getElementById('newSale');
  if(!section)return;
  section.style.setProperty('--hilen-new-sale-zoom',String(zoom/100));
  const value=document.getElementById('hilenNewSaleZoomValue');
  if(value)value.textContent=zoom+'%';
  const less=document.getElementById('hilenNewSaleZoomOut'),more=document.getElementById('hilenNewSaleZoomIn');
  if(less)less.disabled=zoom<=MIN;
  if(more)more.disabled=zoom>=MAX;
  try{localStorage.setItem(KEY,String(zoom))}catch(_){}
 }
 function set(next){zoom=Math.min(MAX,Math.max(MIN,next));apply()}
 function setup(){
  const section=document.getElementById('newSale');
  if(!section)return;
  if(section.querySelector('#hilenNewSaleZoomToolbar')){apply();return}
  const toolbar=document.createElement('div');
  toolbar.id='hilenNewSaleZoomToolbar';
  toolbar.className='hilen-sale-zoom-toolbar';
  toolbar.setAttribute('role','group');
  toolbar.setAttribute('aria-label','Ajustar tamaño del formulario Registrar venta');
  toolbar.innerHTML='<div class="hilen-sale-zoom-heading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.5"/><path d="m16.5 16.5 5 5M7.5 10.8h6.6"/></svg><span>Zoom del formulario</span></div><div class="hilen-sale-zoom-actions"><button id="hilenNewSaleZoomOut" type="button" title="Reducir tamaño" aria-label="Reducir tamaño">−</button><output id="hilenNewSaleZoomValue" aria-live="polite">100%</output><button id="hilenNewSaleZoomIn" type="button" title="Aumentar tamaño" aria-label="Aumentar tamaño">+</button><button class="hilen-sale-zoom-reset" id="hilenNewSaleZoomReset" type="button" title="Volver al tamaño normal">Restablecer</button></div>';
  section.insertBefore(toolbar,section.firstElementChild);
  toolbar.querySelector('#hilenNewSaleZoomOut').addEventListener('click',()=>set(zoom-STEP));
  toolbar.querySelector('#hilenNewSaleZoomIn').addEventListener('click',()=>set(zoom+STEP));
  toolbar.querySelector('#hilenNewSaleZoomReset').addEventListener('click',()=>set(100));
  apply();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
