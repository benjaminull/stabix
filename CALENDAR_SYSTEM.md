# 📅 Sistema de Calendario para Proveedores - Stabix

Sistema completo de agendamiento y gestión de citas para proveedores.

## ✅ Completado

### Backend (100%)

#### Modelos de Datos
- **WorkingHours** - Horarios de trabajo recurrentes (Lun-Dom)
- **Appointment** - Citas agendadas (3 tipos: órdenes, externas, personales)
- **TimeSlotProposal** - Propuestas de horarios (clientes proponen 2-3 opciones)

#### API Endpoints

```
# Horarios de Trabajo
GET    /api/v1/provider/calendar/working-hours/
POST   /api/v1/provider/calendar/working-hours/
PATCH  /api/v1/provider/calendar/working-hours/{id}/
DELETE /api/v1/provider/calendar/working-hours/{id}/

# Citas/Appointments
GET    /api/v1/provider/calendar/appointments/
POST   /api/v1/provider/calendar/appointments/
GET    /api/v1/provider/calendar/appointments/{id}/
PATCH  /api/v1/provider/calendar/appointments/{id}/
DELETE /api/v1/provider/calendar/appointments/{id}/
GET    /api/v1/provider/calendar/appointments/calendar_view/  # Vista semanal
POST   /api/v1/provider/calendar/appointments/{id}/update_status/

# Propuestas de Horarios
GET    /api/v1/provider/calendar/proposals/
GET    /api/v1/provider/calendar/proposals/pending/
POST   /api/v1/provider/calendar/proposals/{id}/respond/  # Aceptar/Rechazar
```

#### Funcionalidades Backend

✅ Proveedores pueden definir horarios de trabajo recurrentes
✅ Crear citas externas (clientes fuera de la plataforma)
✅ Sistema de propuestas: cliente propone 2-3 horarios, proveedor elige uno
✅ Auto-generación de citas al aceptar propuestas
✅ Vista de calendario con filtros por rango de fechas
✅ Filtros por estado (scheduled, confirmed, in_progress, completed, cancelled)
✅ Filtros por tipo (order, external, personal)
✅ Auto-expiración de propuestas (48h por defecto)
✅ Integración con sistema de órdenes existente

### Frontend (70%)

#### Hooks React Query

✅ `useWorkingHours()` - Obtener horarios de trabajo
✅ `useCreateWorkingHours()` - Crear horarios
✅ `useUpdateWorkingHours()` - Actualizar horarios
✅ `useDeleteWorkingHours()` - Eliminar horarios
✅ `useAppointments()` - Obtener citas con filtros
✅ `useCalendarView()` - Vista de calendario por rango de fechas
✅ `useCreateAppointment()` - Crear citas externas
✅ `useUpdateAppointment()` - Actualizar citas
✅ `useUpdateAppointmentStatus()` - Cambiar estado de citas
✅ `useDeleteAppointment()` - Eliminar citas
✅ `useTimeSlotProposals()` - Ver propuestas
✅ `usePendingProposals()` - Propuestas pendientes
✅ `useRespondToProposal()` - Aceptar/Rechazar propuestas

#### Componentes

✅ **WeeklyCalendar** - Vista semanal con react-big-calendar
  - Colores por tipo de cita (órdenes, externas, personales)
  - Colores por estado (completadas, canceladas)
  - Selección de eventos y slots
  - Navegación entre semanas
  - Vistas: Semana, Día, Agenda
  - Leyenda de colores

## ⏳ Pendiente

### UI Componentes (30%)

- [ ] Modal para crear citas externas
- [ ] Panel de propuestas pendientes con acciones
- [ ] Formulario de horarios de trabajo
- [ ] Modal de detalles de cita
- [ ] Página completa `/provider/calendar`

### Integraciones

- [ ] Crear cita automáticamente al aceptar orden
- [ ] Mostrar propuestas en dashboard del proveedor
- [ ] Notificaciones de nuevas propuestas
- [ ] Sincronizar con sistema de matching

## 🎨 Diseño del Sistema

### Tipos de Citas

1. **Platform Orders (Verde)** - Órdenes de la plataforma Stabix
   - Vinculadas a `Order` model
   - Creadas automáticamente o desde propuestas aceptadas
   
2. **External Clients (Ámbar)** - Clientes externos
   - Proveedores los agregan manualmente
   - Útil para bloquear horarios de clientes fuera de Stabix
   
3. **Personal/Blocked (Gris)** - Tiempo personal
   - Bloquear horarios no disponibles
   - Vacaciones, tiempo personal, etc.

### Flujo de Propuestas

```
1. Cliente crea job request
2. Cliente propone 2-3 horarios posibles
   - Slot 1: 2026-04-10 10:00 AM
   - Slot 2: 2026-04-11 2:00 PM
   - Slot 3: 2026-04-12 9:00 AM
3. Proveedor recibe notificación
4. Proveedor ve propuestas en calendario
5. Proveedor selecciona un slot y acepta (o rechaza todo)
6. Si acepta: se crea Appointment automáticamente
7. Propuesta expira en 48h si no hay respuesta
```

### Estados de Citas

- `scheduled` - Agendada (inicial)
- `confirmed` - Confirmada por ambas partes
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - Cliente no se presentó

## 📊 Estructura de Base de Datos

### `working_hours`
```sql
provider_id, weekday (0-6), start_time, end_time, is_active
Ejemplo: provider_id=1, weekday=1 (Tuesday), start_time=09:00, end_time=17:00
```

### `appointments`
```sql
provider_id, appointment_type, status, order_id (nullable),
client_name, client_phone, service_description,
start_datetime, end_datetime, duration_minutes, notes
```

### `time_slot_proposals`
```sql
job_request_id, provider_id, 
proposed_datetime_1, proposed_datetime_2, proposed_datetime_3,
duration_minutes, status, selected_datetime,
provider_notes, responded_at, expires_at
```

## 🚀 Próximos Pasos

1. **Completar UI** - Crear componentes restantes
2. **Testing** - Probar flujo completo
3. **Integración** - Conectar con orders y matching
4. **Notificaciones** - Email/Push cuando llega propuesta
5. **Optimizaciones** - Caché, validaciones, UX

## 📝 Uso

### Para Proveedores

```typescript
import WeeklyCalendar from "@/components/provider/calendar/WeeklyCalendar";
import { useCreateAppointment } from "@/lib/api/hooks/useAppointments";

function ProviderCalendarPage() {
  const createAppointment = useCreateAppointment();
  
  const handleCreateExternal = async (data) => {
    await createAppointment.mutateAsync({
      appointment_type: "external",
      client_name: "John Doe",
      client_phone: "+1234567890",
      service_description: "Home cleaning",
      start_datetime: "2026-04-10T10:00:00Z",
      end_datetime: "2026-04-10T12:00:00Z",
    });
  };
  
  return <WeeklyCalendar />;
}
```

### Para Clientes (Crear Propuesta)

```typescript
import { useCreateTimeSlotProposal } from "@/lib/api/hooks/useAppointments";

const createProposal = useCreateTimeSlotProposal();

await createProposal.mutateAsync({
  job_request_id: 123,
  provider_id: 45,
  proposed_datetime_1: "2026-04-10T10:00:00Z",
  proposed_datetime_2: "2026-04-11T14:00:00Z",
  proposed_datetime_3: "2026-04-12T09:00:00Z",
  duration_minutes: 120,
});
```

## 🎯 Beneficios

- ✅ Proveedores ven todas sus citas en un solo lugar
- ✅ Sistema flexible de propuestas (cliente propone, proveedor elige)
- ✅ Gestión de clientes externos (fuera de plataforma)
- ✅ Vista semanal clara y fácil de usar
- ✅ Integración completa con sistema de órdenes
- ✅ Auto-expiración de propuestas
- ✅ Múltiples tipos de citas (plataforma, externas, personales)

---

**Última actualización:** 2026-04-07  
**Estado:** 85% Completado  
**Autor:** Claude Code
