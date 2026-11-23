# HILEN — Calendario privado sincronizado automáticamente

Este es el procedimiento para **activar** el sincronizador ya incluido en `scripts/google-calendar-auto-sync.gs`. El código por sí solo **no queda activado ni conectado**.

## Lo que hará cuando esté activado

- Los encargos con fecha de recordatorio y las obligaciones pendientes guardadas en Firebase se copiarán al calendario del negocio.
- El sincronizador volverá a consultar Firebase aproximadamente cada cinco minutos, incluso si HILEN está cerrada.
- Los cambios de fecha y descripción actualizarán los eventos correspondientes. Si un encargo se completa/cancela, una obligación se marca pagada o se elimina un registro de Firebase, el evento gestionado por el sincronizador se retirará.
- Las notificaciones del calendario compartido llegarán al Android si la cuenta personal tiene acceso al calendario y sus notificaciones están habilitadas.
- No sincroniza cambios hechos manualmente **desde Google Calendar hacia HILEN**. Evita modificar esos eventos directamente en Google Calendar.
- Las alertas pueden depender de los ajustes del calendario receptor y de las reglas de Google Calendar. No se garantiza aviso inmediato.

## Cuenta e identificador del calendario ya confirmados

- Correo del negocio y del Android: **hilenb456@gmail.com**.
- Calendario secundario creado: **HILEN · Encargos y obligaciones**.
- ID del calendario: `e0896d89d5063bcc5b62a50d42f976838e3accbb80db82d2e982133124117f68@group.calendar.google.com`.
- El ID ya está incorporado como valor predeterminado en el script; **no hace falta volverlo a copiar**.
- Como el Android usa la **misma cuenta Google**, no hace falta compartirlo con otro correo. Solo habilita la visibilidad y notificaciones de ese calendario en Android.
- Los permisos de Firebase siguen pendientes. **No hay sincronización automática activa todavía**.

## 1. Crear el calendario privado (ya realizado)

1. En una computadora abre [Google Calendar](https://calendar.google.com/) e inicia sesión con **la cuenta de Google del negocio**.
2. Abre **Configuración → Agregar calendario → Crear un calendario**.
3. Escribe el nombre **HILEN · Encargos y obligaciones** y selecciona zona horaria **Bogotá (GMT-5)**.
4. Si el Android utiliza **hilenb456@gmail.com**, no necesitas compartir el calendario con otra cuenta. **No lo publiques** ni actives acceso público.
5. En el calendario nuevo, busca **Integrar calendario → ID del calendario**. Guarda ese identificador para la configuración privada.

## 2. Ver el calendario en Android

1. Abre Google Calendar con **la cuenta personal** a la que compartiste el calendario, acepta la invitación recibida.
2. En el teléfono, abre Google Calendar → Configuración → busca **HILEN · Encargos y obligaciones**. Comprueba que aparezca y activa sus notificaciones.
3. Comprueba los permisos de notificaciones de Google Calendar desde los Ajustes del teléfono.
4. Crea un evento de prueba manualmente en el calendario nuevo desde una computadora para comprobar que aparece en el teléfono. Esta comprobación es independiente del sincronizador.

## 3. Preparar la lectura segura de Firebase

**Importante:** no compartir contraseñas, cuentas de servicio, claves JSON, tokens, ni credenciales por chat, GitHub, capturas de pantalla ni correo. Una cuenta de servicio para leer la base de datos debe crearse y almacenarse de manera privada por una persona con permisos de administrador en Firebase/Google Cloud. Conceder el mínimo de permisos necesarios.

El script usa la **Firebase Realtime Database existente** y necesita:
- URL de la base de datos del proyecto de HILEN;
- UID de Firebase de **la cuenta que guarda los encargos y obligaciones** (no es la dirección de Gmail del calendario);
- credencial privada de cuenta de servicio con permiso de lectura en la base de datos;
- ID del **calendario secundario privado** del negocio.

La lectura es de `users/<UID>/state/data`. No se hacen escrituras a Firebase. Debido a cómo HILEN almacena actualmente todos los datos en un mismo estado, esa credencial debe protegerse especialmente: la lectura de ese nodo puede incluir información de ventas y clientes además de recordatorios.

## 4. Crear el sincronizador en Apps Script

1. Inicia sesión con **el mismo correo del calendario del negocio** en [script.google.com](https://script.google.com/).
2. Crea un proyecto `HILEN · Sincronizador de calendario`. Ajusta la zona horaria del proyecto a **America/Bogota**.
3. Copia el contenido de [google-calendar-auto-sync.gs](./google-calendar-auto-sync.gs) a un archivo `.gs` del proyecto.
4. En **Configuración del proyecto → Propiedades del script**, crea las tres propiedades de Firebase **sin colocar sus valores en el código fuente**:

| Nombre de propiedad | Valor (privado) |
| --- | --- |
| `HILEN_FIREBASE_SERVICE_ACCOUNT_JSON` | JSON de la cuenta de servicio con permisos seguros |
| `HILEN_FIREBASE_DATABASE_URL` | URL HTTPS de Realtime Database |
| `HILEN_FIREBASE_USER_ID` | UID real de Firebase de la cuenta de HILEN |
| `HILEN_CALENDAR_ID` | **Opcional**: solo para utilizar un calendario diferente; el ID de HILEN ya está incorporado |

5. Como primer paso **sin configurar Firebase**, ejecuta **`hilen_comprobarCalendario`**. Google te pedirá autorizar la lectura de tu calendario. Debe devolver su nombre y zona horaria sin crear eventos. Después de añadir las propiedades privadas de Firebase, ejecuta **`hilen_diagnostico`** y comprueba lectura de datos y número de registros.
6. Cuando los datos sean correctos y desees iniciar la creación de eventos, ejecuta **`hilen_instalarSincronizador`** una vez. Esto instala un activador de aproximadamente cada cinco minutos y ejecuta la primera sincronización.
7. Consulta **Ejecuciones** en Apps Script para ver errores o confirmar sincronizaciones. Para revisar el estado vuelve a ejecutar `hilen_diagnostico`.

### Precauciones

- No instales varios sincronizadores del mismo negocio ni crees eventos de prueba en el calendario principal. Usa el calendario secundario dedicado a HILEN.
- Si pierdes el acceso a Firebase o el script presenta error, los eventos no se actualizarán hasta resolverlo.
- Las cuotas de Apps Script y de la API de Google limitan la frecuencia/volumen. El uso normal de un negocio pequeño puede encajar en las cuotas gratuitas, pero no está garantizado.
- No confundas **los avisos del navegador mientras HILEN está abierta** con **las notificaciones del calendario de Android**.
- La conexión OAuth antigua de Google Calendar en la interfaz de HILEN es independiente de este método. Una vez verificada la nueva sincronización, conviene desactivar el envío automático antiguo para evitar duplicados.

## 5. Prueba de extremo a extremo

1. En la tablet, crea **un encargo de prueba** con fecha y hora próximas.
2. Confirma que Firebase muestra **guardado**.
3. Verifica que Apps Script ejecutó el sincronizador y que el evento aparece en el calendario privado del negocio.
4. Verifica que el evento aparece en Google Calendar de tu Android y que tiene las alertas configuradas.
5. Modifica la fecha del encargo en HILEN, confirma que el mismo evento se actualiza (no se crea uno duplicado).
6. Márcalo como completado y verifica que se retire del calendario.
7. Repite la prueba con una obligación. **No depender de este sistema para pagos críticos hasta superar estas pruebas.**
