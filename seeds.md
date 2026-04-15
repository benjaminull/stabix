# Stabix - Datos de Prueba (Seeds)

## Ejecución

```bash
# Seed completo (agrega datos sin borrar existentes)
python manage.py seed

# Flush + seed (borra todo excepto superusers y re-crea)
python manage.py seed --flush
```

---

## Credenciales

**Password para todos los usuarios:** `test1234`

---

## Clientes

| Email | Nombre | Teléfono | Notas |
|-------|--------|----------|-------|
| `cliente@stabix.cl` | María González | +56 9 1234 5678 | Cliente principal de prueba. Tiene solicitudes activas y completadas. |
| `pedro@mail.com` | Pedro Soto | +56 9 8765 4321 | Tiene una solicitud abierta de clases de inglés. |
| `camila@mail.com` | Camila Rojas | +56 9 5555 1234 | Tiene solicitud pendiente de peluquería. |

---

## Proveedores

| Email | Nombre | Categoría | Banda | Rating | Ubicación |
|-------|--------|-----------|-------|--------|-----------|
| `proveedor@stabix.cl` | Carlos Muñoz | Hogar | $$ Estándar | ★ 4.8 (47) | Providencia |
| `andrea@stabix.cl` | Andrea Vargas | Belleza y Bienestar | $$$ Premium | ★ 4.9 (82) | Las Condes |
| `felipe@stabix.cl` | Felipe Contreras | Tecnología | $$ Estándar | ★ 4.6 (34) | Santiago Centro |
| `lucia@stabix.cl` | Lucía Fernández | Educación | $$$ Premium | ★ 5.0 (21) | Vitacura |
| `roberto@stabix.cl` | Roberto Díaz | Hogar | $ Económico | ★ 4.3 (15) | Ñuñoa |

---

## Listings (Servicios publicados)

### Carlos Muñoz (Hogar)
- Reparación de Cañerías - $25.000/visita
- Instalación Eléctrica Residencial - $20.000/hora
- Destape de Cañerías - $35.000/servicio

### Andrea Vargas (Belleza)
- Corte y Peinado a Domicilio - $18.000/sesión
- Colorimetría Profesional - $45.000/sesión
- Manicure + Pedicure Completo - $22.000/sesión
- Masaje Relajante 60 min - $30.000/sesión

### Felipe Contreras (Tecnología)
- Reparación de Computador - $15.000/hora
- Instalación Red WiFi - $25.000/servicio
- Instalación Smart TV - $20.000/servicio

### Lucía Fernández (Educación)
- Clase de Inglés Conversacional - $20.000/hora
- Preparación TOEFL / IELTS - $28.000/hora

### Roberto Díaz (Limpieza)
- Limpieza Profunda Departamento - $40.000/servicio
- Limpieza Regular Semanal - $25.000/visita
- Mantención de Jardín - $18.000/visita

---

## Taxonomía

### Categorías y Servicios

| Categoría | Servicios |
|-----------|-----------|
| **Hogar** | Limpieza General, Gasfitería, Electricidad, Pintura, Jardinería |
| **Tecnología** | Soporte PC/Mac, Redes y WiFi, Instalación TV/Audio |
| **Belleza y Bienestar** | Peluquería a Domicilio, Masajes, Manicure/Pedicure |
| **Educación** | Clases de Matemáticas, Clases de Inglés, Clases de Música |
| **Eventos** | Fotografía, DJ/Música en Vivo, Catering |

---

## Flujos de prueba precargados

### 1. Solicitud completada (con orden y reseña)
- **Cliente:** María González → pidió limpieza profunda
- **Proveedor:** Roberto Díaz → aceptó, completó el trabajo
- **Orden:** Completada, $40.000
- **Reseña:** ★★★★★ "Roberto dejó el departamento impecable..."

### 2. Solicitud con match aceptado (sin orden aún)
- **Cliente:** María González → filtración en el baño
- **Proveedor:** Carlos Muñoz → aceptó, cotización $35.000, ETA 45 min

### 3. Solicitud con match pendiente
- **Cliente:** Camila Rojas → quiere balayage
- **Proveedor:** Andrea Vargas → match pendiente (le llega notificación)

### 4. Solicitud abierta (sin match)
- **Cliente:** Pedro Soto → busca clases de IELTS

### 5. Reserva de invitado (guest booking)
- **Guest:** Alejandro Pérez (alejandro@gmail.com, sin cuenta)
- **Proveedor:** Felipe Contreras → notebook no enciende
- **Match:** Pendiente (notificación enviada a Felipe)

---

## Verificación rápida

Después de ejecutar `python manage.py seed`, puedes probar:

```
# Como cliente
Login: cliente@stabix.cl / test1234
→ Dashboard muestra solicitudes y órdenes
→ Puede crear nueva solicitud

# Como proveedor
Login: proveedor@stabix.cl / test1234
→ Panel proveedor muestra matches pendientes
→ Tiene listings publicados
→ Puede aceptar/rechazar solicitudes

# Como proveedor con notificaciones
Login: andrea@stabix.cl / test1234
→ Tiene notificación de match pendiente de Camila
→ Tiene 4 listings activos

Login: felipe@stabix.cl / test1234
→ Tiene notificación de reserva guest de Alejandro

# Sin login (flujo guest)
→ Buscar proveedores → Ver perfil de cualquier proveedor
→ Ver servicios disponibles → Click "Reservar"
→ Llenar formulario como invitado → Confirmación
```

---

## Coordenadas de referencia (Santiago, Chile)

| Zona | Lat | Lng |
|------|-----|-----|
| Santiago Centro | -33.4489 | -70.6693 |
| Providencia | -33.4372 | -70.6500 |
| Las Condes | -33.4178 | -70.6045 |
| Vitacura | -33.4035 | -70.5762 |
| Ñuñoa | -33.4569 | -70.6340 |

Para buscar proveedores cercanos, usa estos parámetros:
```
GET /api/v1/public/providers/?lat=-33.44&lng=-70.65&radius_km=20
```
