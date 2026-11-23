/**
 * HILEN - sincronización AUTOMÁTICA unidireccional con un calendario PRIVADO compartido.
 * Instalar en Google Apps Script con la cuenta del negocio. No desplegar como web app.
 *
 * PROPIEDADES DEL SCRIPT (configurar únicamente desde script.google.com):
 * HILEN_FIREBASE_SERVICE_ACCOUNT_JSON   JSON privado de una cuenta de servicio con acceso de lectura
 * HILEN_FIREBASE_DATABASE_URL         URL RTDB del proyecto HILEN
 * HILEN_FIREBASE_USER_ID              UID Firebase de la cuenta del negocio
 * HILEN_CALENDAR_ID                   Opcional: ID de otro calendario (el de HILEN ya está integrado)
 *
 * Zona horaria del proyecto Apps Script: America/Bogota
 * NO subir claves privadas a GitHub, nunca incluirlas en URLs o respuestas.
 * Lee únicamente users/<UID>/calendarFeed con la cuenta de servicio. No modifica datos del negocio.
 * Opcional: publica un informe de estado en /calendarSyncStatus/<UID> mediante una cuenta Firebase Auth independiente.
 * Si no existe todavía, guarda un encargo desde HILEN para publicar el resumen.
 */
var HILEN_PREFIX = 'HILEN_CAL_EVENT_';
var HILEN_TZ = 'America/Bogota';
// Identificador del calendario compartido suministrado por la administradora.
// No es un secreto. No incluir aquí credenciales ni direcciones iCal privadas.
var HILEN_DEFAULT_CALENDAR_ID = 'e0896d89d5063bcc5b62a50d42f976838e3accbb80db82d2e982133124117f68@group.calendar.google.com';

function hilen_configuracion() {
  var p = PropertiesService.getScriptProperties();
  var json = p.getProperty('HILEN_FIREBASE_SERVICE_ACCOUNT_JSON');
  var databaseURL = p.getProperty('HILEN_FIREBASE_DATABASE_URL');
  var uid = p.getProperty('HILEN_FIREBASE_USER_ID');
  var calendarId = p.getProperty('HILEN_CALENDAR_ID') || HILEN_DEFAULT_CALENDAR_ID;
  if (!json || !databaseURL || !uid || !calendarId) {
    throw Error('Configuración incompleta: revisa la cuenta de servicio, la URL de Firebase y el UID privado de la cuenta.');
  }
  var credential;
  try { credential = JSON.parse(json); }
  catch (e) { throw Error('La credencial de Firebase no es JSON válido.'); }
  if (credential.type !== 'service_account' || !credential.client_email || !credential.private_key) {
    throw Error('Credencial de cuenta de servicio inválida.');
  }
  if (!/^https:\/\/[-a-z0-9.]+\.firebasedatabase\.app$|^https:\/\/[-a-z0-9.]+\.firebaseio\.com$/.test(databaseURL.replace(/\/+$/, ''))) {
    throw Error('La URL de Firebase debe ser la dirección HTTPS de Realtime Database.');
  }
  if (!/^[A-Za-z0-9:_-]{5,160}$/.test(uid)) throw Error('UID de Firebase inválido.');
  return {credential: credential, url: databaseURL.replace(/\/+$/, ''), uid: uid, calendarId: calendarId};
}

function hilen_base64url(input) {
  return Utilities.base64EncodeWebSafe(input).replace(/=+$/, '');
}

function hilen_tokenFirebase(credential) {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('HILEN_FIREBASE_OAUTH_TOKEN');
  if (cached) return cached;
  var issuedAt = Math.floor(Date.now() / 1000);
  var header = hilen_base64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  var claims = hilen_base64url(JSON.stringify({
    iss:credential.client_email,
    scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud:credential.token_uri || 'https://oauth2.googleapis.com/token',
    iat:issuedAt,
    exp:issuedAt+3600
  }));
  var assertionUnsigned = header + '.' + claims;
  var signature = Utilities.computeRsaSha256Signature(assertionUnsigned,credential.private_key);
  var assertion = assertionUnsigned + '.' + hilen_base64url(signature);
  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{
    method:'post',
    payload:{grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:assertion},
    muteHttpExceptions:true
  });
  if (response.getResponseCode() !== 200) {
    throw Error('Firebase rechazó la autorización de lectura. Revisa los permisos de la cuenta de servicio.');
  }
  var result = JSON.parse(response.getContentText());
  if (!result.access_token) throw Error('La autenticación de Firebase no devolvió un token.');
  cache.put('HILEN_FIREBASE_OAUTH_TOKEN',result.access_token,3300);
  return result.access_token;
}

function hilen_estadoFirebase(cfg) {
  cfg = cfg || hilen_configuracion();
  var token = hilen_tokenFirebase(cfg.credential);
  var url = cfg.url+'/users/'+encodeURIComponent(cfg.uid)+'/calendarFeed.json';
  var response = UrlFetchApp.fetch(url,{
    method:'get',
    headers:{Authorization:'Bearer '+token},
    muteHttpExceptions:true
  });
  if (response.getResponseCode() !== 200) {
    throw Error('No fue posible leer los recordatorios en Firebase (HTTP '+response.getResponseCode()+'). No se modificó el calendario.');
  }
  var state = JSON.parse(response.getContentText());
  if (!state || typeof state !== 'object' || Array.isArray(state) || state.ready!==true || state.schema!==1 ||
      !Array.isArray(state.encargos) || !Array.isArray(state.obligations)) {
    throw Error('El resumen privado del calendario todavía no se ha publicado correctamente desde HILEN. No se modificaron eventos.');
  }
  return state;
}

function hilen_lista(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (raw && typeof raw === 'object') return Object.keys(raw).map(function(k){return raw[k]}).filter(Boolean);
  return [];
}
function hilen_fecha(item,kind){
  var date = String(kind==='encargo'?item.reminderDate:item.dueDate || '').trim();
  var time = String(item.reminderTime || '09:00');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) time='09:00';
  var dt = new Date(date+'T'+time+':00-05:00');
  if (isNaN(dt.getTime()) || Utilities.formatDate(dt,HILEN_TZ,'yyyy-MM-dd')!==date) return null;
  return dt;
}
function hilen_evento(item,kind){
  if (!item || !item.id) return null;
  var status=String(item.status||'').toLowerCase();
  if (kind==='encargo' && ['completed','cancelled'].indexOf(status)>=0) return null;
  if (kind==='obligacion' && ['paid','completed','cancelled'].indexOf(status)>=0) return null;
  var start=hilen_fecha(item,kind);
  if (!start) return null;
  var end=new Date(start.getTime()+30*60000);
  var title=kind==='encargo'?'HILEN · Encargo: '+String(item.request||'Seguimiento'):
    'HILEN · '+String(item.title||'Obligación');
  var description=kind==='encargo' ?
    'Encargo HILEN\nCliente: '+String(item.clientName||'')+
    '\nProducto: '+String(item.request||'')+
    '\nProveedor: '+String(item.supplier||'')+
    '\nNotas: '+String(item.notes||''):
    'Obligación HILEN\nTipo: '+String(item.type||'')+
    '\nReferencia: '+String(item.party||'')+
    '\nNotas: '+String(item.notes||'');
  var days=kind==='encargo'?[0]:(Array.isArray(item.alertDays)?item.alertDays:[7,3,1,0]);
  var alerts=[...new Set(days.map(Number).filter(function(n){
    return Number.isInteger(n)&&n>=0&&n<=28;
  }))].map(function(n){return n===0?5:n*1440}).sort(function(a,b){return b-a});
  if (!alerts.length) alerts=[5];
  var fingerprint=Utilities.base64EncodeWebSafe(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify({start:start.toISOString(),title:title,description:description,alerts:alerts})
  )).replace(/=+$/, '');
  return {key:HILEN_PREFIX+kind.toUpperCase()+'_'+String(item.id).replace(/[^A-Za-z0-9_-]/g,'_'),
    title:title,description:description,start:start,end:end,alerts:alerts,fingerprint:fingerprint};
}
function hilen_persistir(calendar,entry,props,previous){
  var event=previous&&previous.eventId?calendar.getEventById(previous.eventId):null;
  if (event && previous.fingerprint===entry.fingerprint) return;
  if (!event) {
    event=calendar.createEvent(entry.title,entry.start,entry.end,{description:entry.description});
  } else {
    event.setTitle(entry.title).setDescription(entry.description).setTime(entry.start,entry.end);
  }
  event.removeAllReminders();
  entry.alerts.forEach(function(minutes){event.addPopupReminder(minutes)});
  props.setProperty(entry.key,JSON.stringify({eventId:event.getId(),fingerprint:entry.fingerprint}));
}

/** Estado operativo privado. La cuenta técnica de Firebase Auth puede escribir
 * únicamente /calendarSyncStatus/<UID autorizado> mediante las reglas.
 * HILEN_CALENDAR_STATUS_AUTH_JSON: {"email":"...","password":"..."}
 * No se solicita ningún permiso IAM adicional a la cuenta de servicio lectora.
 */
var HILEN_STATUS_API_KEY = "AIzaSyBMKv1F6Y4Nz2s0NdddgnswadqCx7UEC7c";
function hilen_statusToken_() {
  var raw=PropertiesService.getScriptProperties().getProperty('HILEN_CALENDAR_STATUS_AUTH_JSON');
  if(!raw)return '';
  var cfg;
  try{cfg=JSON.parse(raw)}catch(e){throw Error('Credencial de estado inválida.')}
  if(!cfg.email||!cfg.password)throw Error('Faltan los datos de la cuenta técnica de estado.');
  var cache=CacheService.getScriptCache(),cacheKey='HILEN_STATUS_ID_TOKEN';
  var cached=cache.get(cacheKey);
  if(cached)return cached;
  var r=UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(HILEN_STATUS_API_KEY),{
    method:'post',contentType:'application/json',
    payload:JSON.stringify({email:cfg.email,password:cfg.password,returnSecureToken:true}),
    muteHttpExceptions:true
  });
  if(r.getResponseCode()!==200)throw Error('No se autorizó la cuenta técnica de estado.');
  var body=JSON.parse(r.getContentText());
  if(!body.idToken)throw Error('No se obtuvo un token de estado.');
  cache.put(cacheKey,body.idToken,2700);
  return body.idToken;
}
function hilen_publicarEstado_(report) {
  // Es opcional: nunca interrumpir el calendario por un fallo de telemetría.
  try{
    var p=PropertiesService.getScriptProperties();
    if(!p.getProperty('HILEN_CALENDAR_STATUS_AUTH_JSON'))return false;
    var cfg=hilen_configuracion(),token=hilen_statusToken_();
    if(!token)return false;
    var endpoint=cfg.url+'/calendarSyncStatus/'+encodeURIComponent(cfg.uid)+'.json?auth='+encodeURIComponent(token);
    var r=UrlFetchApp.fetch(endpoint,{method:'put',contentType:'application/json',payload:JSON.stringify(report),muteHttpExceptions:true});
    if(r.getResponseCode()===401||r.getResponseCode()===403)CacheService.getScriptCache().remove('HILEN_STATUS_ID_TOKEN');
    if(r.getResponseCode()!==200){console.warn('HILEN: calendario procesado; informe de estado no publicado (HTTP '+r.getResponseCode()+').');return false}
    console.log('HILEN: informe de estado publicado.');
    return true;
  }catch(e){console.warn('HILEN: no se pudo publicar el informe de estado. Revisa la cuenta técnica, sus permisos y las propiedades privadas.');return false}
}
function hilen_estadoEjecucion_(state,stage,counts,revision){
  var p=PropertiesService.getScriptProperties(),previous={};
  try{previous=JSON.parse(p.getProperty('HILEN_LAST_STATUS_REPORT')||'{}')}catch(e){}
  var installed=null;
  try{installed=ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hilen_sincronizar'})}catch(e){}
  var now=new Date().toISOString();
  var report={
    schema:1,state:state,lastAttemptAt:now,
    lastSuccessAt:state==='ok'?now:(previous.lastSuccessAt||p.getProperty('HILEN_LAST_SUCCESS')||''),
    sourceRevision:state==='ok'?Number(revision)||0:Number(previous.sourceRevision)||0,
    synchronizedEncargos:state==='ok'?counts.encargos:(Number.isInteger(previous.synchronizedEncargos)?previous.synchronizedEncargos:-1),
    synchronizedObligations:state==='ok'?counts.obligaciones:(Number.isInteger(previous.synchronizedObligations)?previous.synchronizedObligations:-1),
    triggerInstalled:installed===true,
    triggerKnown:installed!==null,frequencyMinutes:5,
    errorCode:state==='ok'?'':stage
  };
  p.setProperty('HILEN_LAST_STATUS_REPORT',JSON.stringify(report));
  hilen_publicarEstado_(report);
}
/** Publica únicamente el último resultado guardado, sin tocar eventos. */
function hilen_comprobarPanelEstado(){
  var p=PropertiesService.getScriptProperties(),raw=p.getProperty('HILEN_LAST_STATUS_REPORT');
  if(!raw){console.log('Aún no hay un informe nuevo. Ejecuta hilen_sincronizar una sola vez.');return}
  console.log(hilen_publicarEstado_(JSON.parse(raw))?'Panel de estado: publicación confirmada.':'Panel de estado: publicación pendiente. Revisa la autorización técnica.');
}

function hilen_sincronizar() {
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  var stage='configuration';
  try{
    var cfg=hilen_configuracion();
    stage='calendar_access';
    var calendar=CalendarApp.getCalendarById(cfg.calendarId);
    if (!calendar) throw Error('No se encontró el calendario privado compartido de HILEN.');
    stage='firebase_read';
    var state=hilen_estadoFirebase(cfg),encargos=hilen_lista(state.encargos),obligaciones=hilen_lista(state.obligations);
    if (encargos.length+obligaciones.length>300) {
      throw Error('Hay más de 300 registros: revisar paginación antes de sincronizar para evitar exceder cuotas.');
    }
    stage='calendar_update';
    var props=PropertiesService.getScriptProperties(), saved=props.getProperties(),desired={},counts={encargos:0,obligaciones:0};
    var records=encargos.map(function(item){return {kind:'encargo',item:item}})
      .concat(obligaciones.map(function(item){return {kind:'obligacion',item:item}}));
    records.forEach(function(r){
      var entry=hilen_evento(r.item,r.kind);
      if (!entry) return;
      desired[entry.key]=true;
      var previous=null;
      if (saved[entry.key]){try{previous=JSON.parse(saved[entry.key])}catch(e){}}
      hilen_persistir(calendar,entry,props,previous);
      counts[r.kind==='encargo'?'encargos':'obligaciones']++;
    });
    // Si una obligación se marcó pagada, un encargo se completó o se eliminó el
    // registro en HILEN, retirar solo el evento que este script administra.
    Object.keys(saved).filter(function(k){return k.indexOf(HILEN_PREFIX)===0&&!desired[k]})
      .forEach(function(k){
        var meta=null;
        try{meta=JSON.parse(saved[k])}catch(e){}
        if(meta&&meta.eventId){
          var oldEvent=calendar.getEventById(meta.eventId);
          if(oldEvent)oldEvent.deleteEvent();
        }
        props.deleteProperty(k);
      });
    props.setProperty('HILEN_LAST_SUCCESS',new Date().toISOString());
    console.log('HILEN: sincronización completada. Activos: '+Object.keys(desired).length);
    try{hilen_estadoEjecucion_('ok','',counts,state.sourceRevision)}catch(e){console.warn('HILEN: no se guardó el informe de estado. Los eventos se procesaron.');}
  } catch(e){
    try{hilen_estadoEjecucion_('error',stage,{},0)}catch(reportError){console.warn('HILEN: no se pudo publicar el error del calendario.');}
    throw e;
  } finally {
    lock.releaseLock();
  }
}
function hilen_instalarSincronizador() {
  var cfg=hilen_configuracion();
  if (!CalendarApp.getCalendarById(cfg.calendarId)) throw Error('Calendario no accesible para esta cuenta.');
  hilen_estadoFirebase(cfg); // comprobar lectura ANTES de instalar
  var handlers=ScriptApp.getProjectTriggers().filter(function(t){
    return t.getHandlerFunction()==='hilen_sincronizar';
  });
  handlers.forEach(function(t){ScriptApp.deleteTrigger(t)});
  ScriptApp.newTrigger('hilen_sincronizar').timeBased().everyMinutes(5).create();
  hilen_sincronizar();
}
function hilen_diagnostico() {
  var cfg=hilen_configuracion(),state=hilen_estadoFirebase(cfg);
  var report={
    calendarFound:!!CalendarApp.getCalendarById(cfg.calendarId),
    encargos:hilen_lista(state.encargos).length,
    obligaciones:hilen_lista(state.obligations).length,
    lastSuccessful:PropertiesService.getScriptProperties().getProperty('HILEN_LAST_SUCCESS')||'Sin sincronizar',
    triggerInstalled:ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='hilen_sincronizar'})
  };
  console.log(JSON.stringify(report));
  return report;
}

/** Primera prueba, sin Firebase ni credenciales privadas.
 * Ejecutar manualmente desde la cuenta Google hilenb456@gmail.com en Apps Script.
 * No escribe ni elimina eventos.
 */
function hilen_comprobarCalendario() {
  var p = PropertiesService.getScriptProperties();
  var calendarId = p.getProperty('HILEN_CALENDAR_ID') || HILEN_DEFAULT_CALENDAR_ID;
  var calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) throw Error('Este calendario no es accesible. Abre Apps Script con la cuenta Google dueña del calendario HILEN.');
  var result = {calendario:calendar.getName(),zonaHoraria:calendar.getTimeZone(),acceso:'confirmado'};
  console.log(JSON.stringify(result));
  return result;
}
