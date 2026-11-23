/**
 * HILEN - sincronización AUTOMÁTICA unidireccional con un calendario PRIVADO compartido.
 * Instalar en Google Apps Script con la cuenta del negocio. No desplegar como web app.
 *
 * PROPIEDADES DEL SCRIPT (configurar únicamente desde script.google.com):
 * HILEN_FIREBASE_SERVICE_ACCOUNT_JSON   JSON privado de una cuenta de servicio con acceso de lectura
 * HILEN_FIREBASE_DATABASE_URL         URL RTDB del proyecto HILEN
 * HILEN_FIREBASE_USER_ID              UID Firebase de la cuenta del negocio
 * HILEN_CALENDAR_ID                   ID del calendario privado "HILEN"
 *
 * Zona horaria del proyecto Apps Script: America/Bogota
 * NO subir claves privadas a GitHub, nunca incluirlas en URLs o respuestas.
 * No modifica ninguna venta, cliente, abono, egreso ni registro de Firebase.
 */
var HILEN_PREFIX = 'HILEN_CAL_EVENT_';
var HILEN_TZ = 'America/Bogota';

function hilen_configuracion() {
  var p = PropertiesService.getScriptProperties();
  var json = p.getProperty('HILEN_FIREBASE_SERVICE_ACCOUNT_JSON');
  var databaseURL = p.getProperty('HILEN_FIREBASE_DATABASE_URL');
  var uid = p.getProperty('HILEN_FIREBASE_USER_ID');
  var calendarId = p.getProperty('HILEN_CALENDAR_ID');
  if (!json || !databaseURL || !uid || !calendarId) {
    throw Error('Configuración incompleta: revisa las cuatro propiedades privadas del script.');
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
  var url = cfg.url+'/users/'+encodeURIComponent(cfg.uid)+'/state/data.json';
  var response = UrlFetchApp.fetch(url,{
    method:'get',
    headers:{Authorization:'Bearer '+token},
    muteHttpExceptions:true
  });
  if (response.getResponseCode() !== 200) {
    throw Error('No fue posible leer los recordatorios en Firebase (HTTP '+response.getResponseCode()+'). No se modificó el calendario.');
  }
  var state = JSON.parse(response.getContentText());
  if (!state || typeof state !== 'object' || Array.isArray(state) ||
      !('encargos' in state) || !('obligations' in state)) {
    throw Error('Los datos no tienen la estructura esperada; sincronización detenida para evitar borrar eventos.');
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
function hilen_sincronizar() {
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try{
    var cfg=hilen_configuracion();
    var calendar=CalendarApp.getCalendarById(cfg.calendarId);
    if (!calendar) throw Error('No se encontró el calendario privado compartido de HILEN.');
    var state=hilen_estadoFirebase(cfg),encargos=hilen_lista(state.encargos),obligaciones=hilen_lista(state.obligations);
    if (encargos.length+obligaciones.length>300) {
      throw Error('Hay más de 300 registros: revisar paginación antes de sincronizar para evitar exceder cuotas.');
    }
    var props=PropertiesService.getScriptProperties(), saved=props.getProperties(),desired={};
    var records=encargos.map(function(item){return {kind:'encargo',item:item}})
      .concat(obligaciones.map(function(item){return {kind:'obligacion',item:item}}));
    records.forEach(function(r){
      var entry=hilen_evento(r.item,r.kind);
      if (!entry) return;
      desired[entry.key]=true;
      var previous=null;
      if (saved[entry.key]){try{previous=JSON.parse(saved[entry.key])}catch(e){}}
      hilen_persistir(calendar,entry,props,previous);
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
