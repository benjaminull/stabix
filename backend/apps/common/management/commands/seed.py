"""
Management command to populate the database with test data.

Usage:
    python manage.py seed          # Seed everything
    python manage.py seed --flush  # Wipe DB first, then seed
"""

from datetime import timedelta
from decimal import Decimal

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed the database with test users, providers, listings, and sample data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing data before seeding",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write(self.style.WARNING("Flushing existing data..."))
            self._flush()

        self.stdout.write(self.style.HTTP_INFO("Seeding database..."))
        categories = self._create_categories()
        services = self._create_services(categories)
        customers = self._create_customers()
        providers = self._create_providers(categories)
        listings = self._create_listings(providers, services)
        job_requests, matches = self._create_job_requests_and_matches(
            customers, providers, services
        )
        orders = self._create_orders(job_requests, matches)
        self._create_reviews(orders)
        self._create_notifications(providers, matches)
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self._print_summary(customers, providers)

    # ------------------------------------------------------------------
    # Flush
    # ------------------------------------------------------------------
    def _flush(self):
        from apps.notifications.models import Notification
        from apps.reviews.models import Review
        from apps.orders.models import Order
        from apps.jobs.models import Match, JobRequest
        from apps.listings.models import Listing
        from apps.users.models import ProviderProfile, User
        from apps.taxonomy.models import Service, ServiceCategory

        Notification.objects.all().delete()
        Review.objects.all().delete()
        Order.objects.all().delete()
        Match.objects.all().delete()
        JobRequest.objects.all().delete()
        Listing.objects.all().delete()
        ProviderProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()

    # ------------------------------------------------------------------
    # Taxonomy
    # ------------------------------------------------------------------
    def _create_categories(self):
        from apps.taxonomy.models import ServiceCategory

        data = [
            {
                "name": "Hogar",
                "slug": "hogar",
                "description": "Servicios para el hogar: limpieza, reparaciones, mantención",
                "icon": "home",
                "order": 1,
            },
            {
                "name": "Tecnología",
                "slug": "tecnologia",
                "description": "Soporte técnico, redes, instalaciones",
                "icon": "monitor",
                "order": 2,
            },
            {
                "name": "Belleza y Bienestar",
                "slug": "belleza-bienestar",
                "description": "Peluquería, masajes, estética a domicilio",
                "icon": "sparkles",
                "order": 3,
            },
            {
                "name": "Educación",
                "slug": "educacion",
                "description": "Clases particulares, tutorías, idiomas",
                "icon": "book-open",
                "order": 4,
            },
            {
                "name": "Eventos",
                "slug": "eventos",
                "description": "Catering, DJ, fotografía, decoración",
                "icon": "party-popper",
                "order": 5,
            },
        ]

        cats = {}
        for d in data:
            cat, _ = ServiceCategory.objects.update_or_create(
                slug=d["slug"], defaults=d
            )
            cats[d["slug"]] = cat
            self.stdout.write(f"  Categoría: {cat.name}")
        return cats

    def _create_services(self, categories):
        from apps.taxonomy.models import Service

        data = [
            # Hogar
            ("Limpieza General", "limpieza-general", "hogar", "Limpieza completa de casas y departamentos", 1),
            ("Gasfitería", "gasfiteria", "hogar", "Reparación de cañerías, grifos, WC", 2),
            ("Electricidad", "electricidad", "hogar", "Instalaciones y reparaciones eléctricas", 3),
            ("Pintura", "pintura", "hogar", "Pintura interior y exterior", 4),
            ("Jardinería", "jardineria", "hogar", "Mantención de jardines y áreas verdes", 5),
            # Tecnología
            ("Soporte PC / Mac", "soporte-pc", "tecnologia", "Reparación y mantención de computadores", 1),
            ("Redes y WiFi", "redes-wifi", "tecnologia", "Instalación y configuración de redes", 2),
            ("Instalación TV / Audio", "instalacion-tv", "tecnologia", "Montaje de TV, soundbar, home theater", 3),
            # Belleza
            ("Peluquería a Domicilio", "peluqueria", "belleza-bienestar", "Corte, color, peinados en tu casa", 1),
            ("Masajes", "masajes", "belleza-bienestar", "Masajes relajantes y terapéuticos", 2),
            ("Manicure / Pedicure", "manicure-pedicure", "belleza-bienestar", "Servicio de uñas a domicilio", 3),
            # Educación
            ("Clases de Matemáticas", "clases-matematicas", "educacion", "Reforzamiento y preparación de pruebas", 1),
            ("Clases de Inglés", "clases-ingles", "educacion", "Inglés conversacional y preparación TOEFL/IELTS", 2),
            ("Clases de Música", "clases-musica", "educacion", "Guitarra, piano, canto", 3),
            # Eventos
            ("Fotografía", "fotografia", "eventos", "Cobertura fotográfica de eventos", 1),
            ("DJ / Música en Vivo", "dj-musica", "eventos", "Animación musical para fiestas", 2),
            ("Catering", "catering", "eventos", "Servicio de comida para eventos", 3),
        ]

        services = {}
        for name, slug, cat_slug, desc, order in data:
            svc, _ = Service.objects.update_or_create(
                slug=slug,
                category=categories[cat_slug],
                defaults={
                    "name": name,
                    "description": desc,
                    "order": order,
                },
            )
            services[slug] = svc
        self.stdout.write(f"  {len(services)} servicios creados")
        return services

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    def _create_customers(self):
        from apps.users.models import User

        PASSWORD = "test1234"

        customers_data = [
            {
                "email": "cliente@stabix.cl",
                "username": "cliente1",
                "first_name": "María",
                "last_name": "González",
                "phone": "+56 9 1234 5678",
            },
            {
                "email": "pedro@mail.com",
                "username": "pedro",
                "first_name": "Pedro",
                "last_name": "Soto",
                "phone": "+56 9 8765 4321",
            },
            {
                "email": "camila@mail.com",
                "username": "camila",
                "first_name": "Camila",
                "last_name": "Rojas",
                "phone": "+56 9 5555 1234",
            },
        ]

        customers = []
        for d in customers_data:
            user, created = User.objects.get_or_create(
                email=d["email"],
                defaults={
                    "username": d["username"],
                    "first_name": d["first_name"],
                    "last_name": d["last_name"],
                    "phone": d["phone"],
                    "is_provider": False,
                },
            )
            if created:
                user.set_password(PASSWORD)
                user.save()
            customers.append(user)
            self.stdout.write(f"  Cliente: {user.email}")
        return customers

    def _create_providers(self, categories):
        from apps.users.models import User, ProviderProfile

        PASSWORD = "test1234"

        # Santiago coordinates reference: -33.4489, -70.6693
        providers_data = [
            {
                "email": "proveedor@stabix.cl",
                "username": "proveedor1",
                "first_name": "Carlos",
                "last_name": "Muñoz",
                "phone": "+56 9 9999 0001",
                "profile": {
                    "location": Point(-70.6500, -33.4372, srid=4326),  # Providencia
                    "radius_km": 15.0,
                    "price_band": "standard",
                    "bio": "Maestro gasfíter y electricista con más de 10 años de experiencia. Trabajo limpio y garantizado. Atiendo toda la zona oriente de Santiago.",
                    "is_verified": True,
                    "average_rating": 4.8,
                    "total_reviews": 47,
                    "total_completed_orders": 156,
                    "average_response_time_minutes": 12.0,
                    "categories": ["hogar"],
                    "availability": {
                        "monday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 18:00"]},
                        "tuesday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 18:00"]},
                        "wednesday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 18:00"]},
                        "thursday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 18:00"]},
                        "friday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 17:00"]},
                        "saturday": {"available": True, "slots": ["10:00 - 14:00"]},
                        "sunday": {"available": False},
                    },
                },
            },
            {
                "email": "andrea@stabix.cl",
                "username": "andrea_beauty",
                "first_name": "Andrea",
                "last_name": "Vargas",
                "phone": "+56 9 9999 0002",
                "profile": {
                    "location": Point(-70.6045, -33.4178, srid=4326),  # Las Condes
                    "radius_km": 12.0,
                    "price_band": "premium",
                    "bio": "Estilista profesional certificada. Especialista en colorimetría y cortes modernos. Llevo todo mi equipo a tu domicilio para que te sientas como en un salón de primera.",
                    "is_verified": True,
                    "average_rating": 4.9,
                    "total_reviews": 82,
                    "total_completed_orders": 230,
                    "average_response_time_minutes": 8.0,
                    "categories": ["belleza-bienestar"],
                    "availability": {
                        "monday": {"available": True, "slots": ["10:00 - 13:00", "15:00 - 19:00"]},
                        "tuesday": {"available": True, "slots": ["10:00 - 13:00", "15:00 - 19:00"]},
                        "wednesday": {"available": False},
                        "thursday": {"available": True, "slots": ["10:00 - 13:00", "15:00 - 19:00"]},
                        "friday": {"available": True, "slots": ["10:00 - 13:00", "15:00 - 19:00"]},
                        "saturday": {"available": True, "slots": ["09:00 - 14:00"]},
                        "sunday": {"available": False},
                    },
                },
            },
            {
                "email": "felipe@stabix.cl",
                "username": "felipe_tech",
                "first_name": "Felipe",
                "last_name": "Contreras",
                "phone": "+56 9 9999 0003",
                "profile": {
                    "location": Point(-70.6693, -33.4489, srid=4326),  # Santiago Centro
                    "radius_km": 20.0,
                    "price_band": "standard",
                    "bio": "Ingeniero en informática. Resuelvo cualquier problema con tu computador, red WiFi o smart TV. Diagnóstico gratuito. Respuesta rápida por WhatsApp.",
                    "is_verified": True,
                    "average_rating": 4.6,
                    "total_reviews": 34,
                    "total_completed_orders": 98,
                    "average_response_time_minutes": 15.0,
                    "categories": ["tecnologia"],
                    "availability": {
                        "monday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 20:00"]},
                        "tuesday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 20:00"]},
                        "wednesday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 20:00"]},
                        "thursday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 20:00"]},
                        "friday": {"available": True, "slots": ["09:00 - 13:00", "14:00 - 18:00"]},
                        "saturday": {"available": True, "slots": ["10:00 - 15:00"]},
                        "sunday": {"available": False},
                    },
                },
            },
            {
                "email": "lucia@stabix.cl",
                "username": "lucia_edu",
                "first_name": "Lucía",
                "last_name": "Fernández",
                "phone": "+56 9 9999 0004",
                "profile": {
                    "location": Point(-70.5762, -33.4035, srid=4326),  # Vitacura
                    "radius_km": 10.0,
                    "price_band": "premium",
                    "bio": "Profesora de inglés con certificación Cambridge CELTA. 8 años enseñando a niños y adultos. Clases dinámicas y personalizadas.",
                    "is_verified": True,
                    "average_rating": 5.0,
                    "total_reviews": 21,
                    "total_completed_orders": 64,
                    "average_response_time_minutes": 20.0,
                    "categories": ["educacion"],
                    "availability": {
                        "monday": {"available": True, "slots": ["08:00 - 12:00", "16:00 - 20:00"]},
                        "tuesday": {"available": True, "slots": ["08:00 - 12:00", "16:00 - 20:00"]},
                        "wednesday": {"available": True, "slots": ["08:00 - 12:00", "16:00 - 20:00"]},
                        "thursday": {"available": True, "slots": ["08:00 - 12:00", "16:00 - 20:00"]},
                        "friday": {"available": True, "slots": ["08:00 - 12:00"]},
                        "saturday": {"available": False},
                        "sunday": {"available": False},
                    },
                },
            },
            {
                "email": "roberto@stabix.cl",
                "username": "roberto_clean",
                "first_name": "Roberto",
                "last_name": "Díaz",
                "phone": "+56 9 9999 0005",
                "profile": {
                    "location": Point(-70.6340, -33.4569, srid=4326),  # Ñuñoa
                    "radius_km": 18.0,
                    "price_band": "budget",
                    "bio": "Servicio de aseo y limpieza profunda. Trabajo con productos ecológicos. Disponibilidad inmediata. Precios accesibles para todos.",
                    "is_verified": True,
                    "average_rating": 4.3,
                    "total_reviews": 15,
                    "total_completed_orders": 42,
                    "average_response_time_minutes": 25.0,
                    "categories": ["hogar"],
                    "availability": {
                        "monday": {"available": True, "slots": ["08:00 - 12:00", "13:00 - 17:00"]},
                        "tuesday": {"available": True, "slots": ["08:00 - 12:00", "13:00 - 17:00"]},
                        "wednesday": {"available": True, "slots": ["08:00 - 12:00", "13:00 - 17:00"]},
                        "thursday": {"available": True, "slots": ["08:00 - 12:00", "13:00 - 17:00"]},
                        "friday": {"available": True, "slots": ["08:00 - 12:00", "13:00 - 17:00"]},
                        "saturday": {"available": True, "slots": ["09:00 - 13:00"]},
                        "sunday": {"available": False},
                    },
                },
            },
        ]

        providers = []
        for d in providers_data:
            profile_data = d.pop("profile")
            cat_slugs = profile_data.pop("categories")

            user, created = User.objects.get_or_create(
                email=d["email"],
                defaults={
                    "username": d["username"],
                    "first_name": d["first_name"],
                    "last_name": d["last_name"],
                    "phone": d["phone"],
                    "is_provider": True,
                },
            )
            if created:
                user.set_password(PASSWORD)
                user.save()

            profile, _ = ProviderProfile.objects.update_or_create(
                user=user,
                defaults=profile_data,
            )

            for slug in cat_slugs:
                if slug in categories:
                    profile.categories.add(categories[slug])

            providers.append(profile)
            self.stdout.write(f"  Proveedor: {user.first_name} {user.last_name} ({user.email})")
        return providers

    # ------------------------------------------------------------------
    # Listings
    # ------------------------------------------------------------------
    def _create_listings(self, providers, services):
        from apps.listings.models import Listing

        # provider index -> [(service_slug, title, description, price, unit)]
        listings_map = {
            0: [  # Carlos - Hogar
                ("gasfiteria", "Reparación de Cañerías", "Detección y reparación de filtraciones, cambio de llaves, instalación de artefactos sanitarios.", Decimal("25000.00"), "por visita"),
                ("electricidad", "Instalación Eléctrica Residencial", "Instalación de enchufes, luminarias, tableros eléctricos. Certificación SEC.", Decimal("20000.00"), "por hora"),
                ("gasfiteria", "Destape de Cañerías", "Destape profesional con equipo especializado. Garantía 30 días.", Decimal("35000.00"), "por servicio"),
            ],
            1: [  # Andrea - Belleza
                ("peluqueria", "Corte y Peinado a Domicilio", "Corte personalizado según tu tipo de rostro. Incluye lavado y secado.", Decimal("18000.00"), "por sesión"),
                ("peluqueria", "Colorimetría Profesional", "Tintura, mechas, balayage. Uso productos de primera línea (Wella, Schwarzkopf).", Decimal("45000.00"), "por sesión"),
                ("manicure-pedicure", "Manicure + Pedicure Completo", "Servicio completo con esmaltado semipermanente. Duración ~2 horas.", Decimal("22000.00"), "por sesión"),
                ("masajes", "Masaje Relajante 60 min", "Masaje descontracturante con aceites esenciales. Llevo camilla.", Decimal("30000.00"), "por sesión"),
            ],
            2: [  # Felipe - Tecnología
                ("soporte-pc", "Reparación de Computador", "Diagnóstico, limpieza, cambio de disco/RAM, reinstalación de sistema.", Decimal("15000.00"), "por hora"),
                ("redes-wifi", "Instalación Red WiFi", "Configuración de router, extensores, mesh. Cobertura total garantizada.", Decimal("25000.00"), "por servicio"),
                ("instalacion-tv", "Instalación Smart TV", "Montaje en muro, configuración de apps, conexión a audio.", Decimal("20000.00"), "por servicio"),
            ],
            3: [  # Lucía - Educación
                ("clases-ingles", "Clase de Inglés Conversacional", "Clase personalizada enfocada en speaking y listening. Niveles A1-C1.", Decimal("20000.00"), "por hora"),
                ("clases-ingles", "Preparación TOEFL / IELTS", "Programa intensivo con simulacros de examen y material incluido.", Decimal("28000.00"), "por hora"),
            ],
            4: [  # Roberto - Limpieza
                ("limpieza-general", "Limpieza Profunda Departamento", "Limpieza completa: cocina, baños, pisos, ventanas. Productos incluidos.", Decimal("40000.00"), "por servicio"),
                ("limpieza-general", "Limpieza Regular Semanal", "Mantención semanal de tu hogar. Precio por visita de 4 horas.", Decimal("25000.00"), "por visita"),
                ("jardineria", "Mantención de Jardín", "Poda, riego, fertilización, control de plagas.", Decimal("18000.00"), "por visita"),
            ],
        }

        all_listings = []
        for idx, provider in enumerate(providers):
            for svc_slug, title, desc, price, unit in listings_map.get(idx, []):
                listing, _ = Listing.objects.update_or_create(
                    provider=provider,
                    title=title,
                    defaults={
                        "service": services[svc_slug],
                        "description": desc,
                        "base_price": price,
                        "price_unit": unit,
                        "is_active": True,
                    },
                )
                all_listings.append(listing)
        self.stdout.write(f"  {len(all_listings)} listings creados")
        return all_listings

    # ------------------------------------------------------------------
    # Job Requests & Matches
    # ------------------------------------------------------------------
    def _create_job_requests_and_matches(self, customers, providers, services):
        from apps.jobs.models import JobRequest, Match

        now = timezone.now()

        requests_data = [
            # María pide gasfitería → matched con Carlos
            {
                "user": customers[0],
                "service": services["gasfiteria"],
                "location": Point(-70.6400, -33.4300, srid=4326),
                "details": "Tengo una filtración en el baño principal. El agua sale por debajo del WC cuando se tira la cadena. Necesito que vengan lo antes posible.",
                "budget_estimate": Decimal("30000.00"),
                "status": "matched",
                "preferred_date": now + timedelta(days=2),
                "match_provider": providers[0],
                "match_status": "accepted",
                "match_score": 0.95,
                "match_quote": Decimal("35000.00"),
                "match_eta": 45,
            },
            # Pedro pide clases de inglés → open
            {
                "user": customers[1],
                "service": services["clases-ingles"],
                "location": Point(-70.5900, -33.4100, srid=4326),
                "details": "Quiero preparar el IELTS para postular a un máster en UK. Tengo nivel intermedio (B1 aprox). Disponibilidad tardes de semana.",
                "budget_estimate": Decimal("25000.00"),
                "status": "open",
                "preferred_date": now + timedelta(days=5),
            },
            # Camila pide peluquería → matched con Andrea, pending
            {
                "user": customers[2],
                "service": services["peluqueria"],
                "location": Point(-70.6100, -33.4200, srid=4326),
                "details": "Quiero un balayage rubio ceniza. Tengo el pelo castaño oscuro, largo hasta la cintura. ¿Es posible hacerlo en una sola sesión?",
                "budget_estimate": Decimal("50000.00"),
                "status": "open",
                "preferred_date": now + timedelta(days=3),
                "match_provider": providers[1],
                "match_status": "pending",
                "match_score": 0.88,
            },
            # María pide limpieza → ordered con Roberto
            {
                "user": customers[0],
                "service": services["limpieza-general"],
                "location": Point(-70.6400, -33.4300, srid=4326),
                "details": "Limpieza profunda de departamento de 3 habitaciones, 2 baños. Incluye limpieza de horno y refrigerador.",
                "budget_estimate": Decimal("45000.00"),
                "status": "ordered",
                "preferred_date": now - timedelta(days=5),
                "match_provider": providers[4],
                "match_status": "accepted",
                "match_score": 0.92,
                "match_quote": Decimal("40000.00"),
                "match_eta": 60,
            },
            # Reserva de guest (sin usuario)
            {
                "user": None,
                "guest_name": "Alejandro Pérez",
                "guest_email": "alejandro@gmail.com",
                "guest_phone": "+56 9 7777 1234",
                "service": services["soporte-pc"],
                "location": Point(-70.6500, -33.4400, srid=4326),
                "details": "Mi notebook Lenovo no enciende. Estaba funcionando bien ayer y hoy solo parpadea la luz de encendido. Necesito recuperar archivos urgentes del disco.",
                "status": "open",
                "preferred_date": now + timedelta(days=1),
                "preferred_time_slot": "Mañana (9:00 - 13:00)",
                "target_provider": providers[2],
                "match_provider": providers[2],
                "match_status": "pending",
                "match_score": 1.0,
            },
        ]

        job_requests = []
        matches = []

        for d in requests_data:
            match_data = {}
            for key in list(d.keys()):
                if key.startswith("match_"):
                    match_data[key.replace("match_", "")] = d.pop(key)

            jr, _ = JobRequest.objects.get_or_create(
                user=d.get("user"),
                service=d["service"],
                details=d["details"],
                defaults={
                    "location": d["location"],
                    "budget_estimate": d.get("budget_estimate"),
                    "status": d["status"],
                    "preferred_date": d.get("preferred_date"),
                    "guest_name": d.get("guest_name", ""),
                    "guest_email": d.get("guest_email", ""),
                    "guest_phone": d.get("guest_phone", ""),
                    "target_provider": d.get("target_provider"),
                    "preferred_time_slot": d.get("preferred_time_slot", ""),
                },
            )
            job_requests.append(jr)

            if match_data.get("provider"):
                match, _ = Match.objects.get_or_create(
                    job_request=jr,
                    provider=match_data["provider"],
                    defaults={
                        "score": match_data.get("score", 0.5),
                        "status": match_data.get("status", "pending"),
                        "price_quote": match_data.get("quote"),
                        "eta_minutes": match_data.get("eta"),
                    },
                )
                matches.append(match)

        self.stdout.write(f"  {len(job_requests)} solicitudes y {len(matches)} matches creados")
        return job_requests, matches

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------
    def _create_orders(self, job_requests, matches):
        from apps.orders.models import Order

        now = timezone.now()
        orders = []

        # Crear orden para la solicitud "ordered" (index 3 → match con Roberto)
        ordered_matches = [m for m in matches if m.status == "accepted"]
        for match in ordered_matches:
            jr = match.job_request
            if jr.status == "ordered":
                order, _ = Order.objects.get_or_create(
                    job_request=jr,
                    match=match,
                    defaults={
                        "status": "completed",
                        "amount": match.price_quote or Decimal("40000.00"),
                        "scheduled_at": jr.preferred_date,
                        "started_at": jr.preferred_date,
                        "completed_at": jr.preferred_date + timedelta(hours=4),
                    },
                )
                orders.append(order)

        self.stdout.write(f"  {len(orders)} órdenes creadas")
        return orders

    # ------------------------------------------------------------------
    # Reviews
    # ------------------------------------------------------------------
    def _create_reviews(self, orders):
        from apps.reviews.models import Review

        reviews_data = [
            {
                "rating": 5,
                "comment": "Roberto dejó el departamento impecable. Muy puntual y profesional. Los productos ecológicos que usa huelen increíble. 100% recomendado.",
            },
        ]

        count = 0
        for order, data in zip(orders, reviews_data):
            _, created = Review.objects.get_or_create(
                order=order,
                defaults=data,
            )
            if created:
                count += 1
        self.stdout.write(f"  {count} reseñas creadas")

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------
    def _create_notifications(self, providers, matches):
        from apps.notifications.utils import notify_new_match

        count = 0
        for match in matches:
            if match.status == "pending":
                notify_new_match(match.provider, match)
                count += 1
        self.stdout.write(f"  {count} notificaciones creadas")

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    def _print_summary(self, customers, providers):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  DATOS DE PRUEBA CREADOS"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("  Password para todos los usuarios: test1234"))
        self.stdout.write("")
        self.stdout.write("  CLIENTES:")
        for c in customers:
            self.stdout.write(f"    {c.first_name} {c.last_name} → {c.email}")
        self.stdout.write("")
        self.stdout.write("  PROVEEDORES:")
        for p in providers:
            u = p.user
            self.stdout.write(
                f"    {u.first_name} {u.last_name} → {u.email}"
                f"  [{p.price_band}] ★{p.average_rating}"
            )
        self.stdout.write("")
        self.stdout.write("  GUEST BOOKING:")
        self.stdout.write("    Alejandro Pérez → alejandro@gmail.com (sin cuenta)")
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
