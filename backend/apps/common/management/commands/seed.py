"""
Management command to populate the database with test data.

Usage:
    python manage.py seed          # Seed everything
    python manage.py seed --flush  # Wipe DB first, then seed
"""

from datetime import time, timedelta
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
        self._create_working_hours(providers)
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
        from apps.appointments.models import Appointment, WorkingHours
        from apps.notifications.models import Notification
        from apps.reviews.models import Review
        from apps.orders.models import Order
        from apps.jobs.models import Match, JobRequest
        from apps.listings.models import Listing
        from apps.users.models import ProviderProfile, User
        from apps.taxonomy.models import Service, ServiceCategory

        Appointment.objects.all().delete()
        WorkingHours.objects.all().delete()
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
            {"name": "Hogar", "slug": "hogar", "description": "Servicios para el hogar: limpieza, reparaciones, mantención", "icon": "home", "order": 1},
            {"name": "Tecnología", "slug": "tecnologia", "description": "Soporte técnico, redes, instalaciones", "icon": "monitor", "order": 2},
            {"name": "Belleza y Bienestar", "slug": "belleza-bienestar", "description": "Peluquería, masajes, estética a domicilio", "icon": "sparkles", "order": 3},
            {"name": "Educación", "slug": "educacion", "description": "Clases particulares, tutorías, idiomas", "icon": "book-open", "order": 4},
            {"name": "Eventos", "slug": "eventos", "description": "Catering, DJ, fotografía, decoración", "icon": "party-popper", "order": 5},
        ]

        cats = {}
        for d in data:
            cat, _ = ServiceCategory.objects.update_or_create(slug=d["slug"], defaults=d)
            cats[d["slug"]] = cat
            self.stdout.write(f"  Categoría: {cat.name}")
        return cats

    def _create_services(self, categories):
        from apps.taxonomy.models import Service

        data = [
            ("Limpieza General", "limpieza-general", "hogar", "Limpieza completa de casas y departamentos", 1),
            ("Gasfitería", "gasfiteria", "hogar", "Reparación de cañerías, grifos, WC", 2),
            ("Electricidad", "electricidad", "hogar", "Instalaciones y reparaciones eléctricas", 3),
            ("Pintura", "pintura", "hogar", "Pintura interior y exterior", 4),
            ("Jardinería", "jardineria", "hogar", "Mantención de jardines y áreas verdes", 5),
            ("Cerrajería", "cerrajeria", "hogar", "Apertura, cambio de chapas y copias de llaves", 6),
            ("Soporte PC / Mac", "soporte-pc", "tecnologia", "Reparación y mantención de computadores", 1),
            ("Redes y WiFi", "redes-wifi", "tecnologia", "Instalación y configuración de redes", 2),
            ("Instalación TV / Audio", "instalacion-tv", "tecnologia", "Montaje de TV, soundbar, home theater", 3),
            ("Peluquería a Domicilio", "peluqueria", "belleza-bienestar", "Corte, color, peinados en tu casa", 1),
            ("Masajes", "masajes", "belleza-bienestar", "Masajes relajantes y terapéuticos", 2),
            ("Manicure / Pedicure", "manicure-pedicure", "belleza-bienestar", "Servicio de uñas a domicilio", 3),
            ("Clases de Matemáticas", "clases-matematicas", "educacion", "Reforzamiento y preparación de pruebas", 1),
            ("Clases de Inglés", "clases-ingles", "educacion", "Inglés conversacional y preparación TOEFL/IELTS", 2),
            ("Clases de Música", "clases-musica", "educacion", "Guitarra, piano, canto", 3),
            ("Fotografía", "fotografia", "eventos", "Cobertura fotográfica de eventos", 1),
            ("DJ / Música en Vivo", "dj-musica", "eventos", "Animación musical para fiestas", 2),
            ("Catering", "catering", "eventos", "Servicio de comida para eventos", 3),
        ]

        services = {}
        for name, slug, cat_slug, desc, order in data:
            svc, _ = Service.objects.update_or_create(
                slug=slug, category=categories[cat_slug],
                defaults={"name": name, "description": desc, "order": order},
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
            {"email": "cliente@stabix.cl", "username": "cliente1", "first_name": "María", "last_name": "González", "phone": "+56 9 1234 5678"},
            {"email": "pedro@mail.com", "username": "pedro", "first_name": "Pedro", "last_name": "Soto", "phone": "+56 9 8765 4321"},
            {"email": "camila@mail.com", "username": "camila", "first_name": "Camila", "last_name": "Rojas", "phone": "+56 9 5555 1234"},
        ]

        customers = []
        for d in customers_data:
            user, created = User.objects.get_or_create(
                email=d["email"],
                defaults={**d, "is_provider": False},
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

        # Providers spread across Greater Santiago
        # Format: (email, username, first, last, phone, lng, lat, comuna, radius, band, bio, rating, reviews, orders, resp_min, [cat_slugs], availability)
        providers_data = [
            # --- HOGAR ---
            ("carlos@stabix.cl", "carlos_gasf", "Carlos", "Muñoz", "+56 9 9999 0001",
             -70.6500, -33.4372, "Providencia", 15.0, "standard",
             "Maestro gasfíter y electricista con más de 10 años de experiencia. Trabajo limpio y garantizado.",
             4.8, 47, 156, 12, ["hogar"],
             {0: [(9, 13), (14, 18)], 1: [(9, 13), (14, 18)], 2: [(9, 13), (14, 18)], 3: [(9, 13), (14, 18)], 4: [(9, 13), (14, 17)], 5: [(10, 14)]}),

            ("roberto@stabix.cl", "roberto_clean", "Roberto", "Díaz", "+56 9 9999 0005",
             -70.6340, -33.4569, "Ñuñoa", 18.0, "budget",
             "Servicio de aseo y limpieza profunda. Trabajo con productos ecológicos. Precios accesibles.",
             4.3, 15, 42, 25, ["hogar"],
             {0: [(8, 12), (13, 17)], 1: [(8, 12), (13, 17)], 2: [(8, 12), (13, 17)], 3: [(8, 12), (13, 17)], 4: [(8, 12), (13, 17)], 5: [(9, 13)]}),

            ("jorge@stabix.cl", "jorge_pint", "Jorge", "Valenzuela", "+56 9 9999 0010",
             -70.7583, -33.5069, "Maipú", 25.0, "budget",
             "Pintor profesional. Interior y exterior. Presupuesto sin costo. 15 años de experiencia.",
             4.5, 28, 89, 20, ["hogar"],
             {0: [(8, 13), (14, 18)], 1: [(8, 13), (14, 18)], 2: [(8, 13), (14, 18)], 3: [(8, 13), (14, 18)], 4: [(8, 13), (14, 17)], 5: [(9, 14)]}),

            ("patricia@stabix.cl", "patricia_jardin", "Patricia", "Morales", "+56 9 9999 0011",
             -70.5975, -33.5219, "La Florida", 20.0, "standard",
             "Jardinera paisajista. Diseño, mantención y recuperación de jardines. Trabajo con plantas nativas.",
             4.7, 33, 72, 18, ["hogar"],
             {0: [(8, 13)], 1: [(8, 13)], 2: [(8, 13)], 3: [(8, 13)], 4: [(8, 13)], 5: [(8, 12)]}),

            ("miguel@stabix.cl", "miguel_elec", "Miguel", "Sepúlveda", "+56 9 9999 0012",
             -70.6700, -33.4100, "Recoleta", 15.0, "standard",
             "Electricista certificado SEC. Instalaciones residenciales y comerciales. Urgencias 24/7.",
             4.6, 41, 130, 10, ["hogar"],
             {0: [(8, 13), (14, 19)], 1: [(8, 13), (14, 19)], 2: [(8, 13), (14, 19)], 3: [(8, 13), (14, 19)], 4: [(8, 13), (14, 19)], 5: [(9, 14)]}),

            ("raul@stabix.cl", "raul_cerr", "Raúl", "Figueroa", "+56 9 9999 0013",
             -70.6484, -33.4372, "Santiago Centro", 20.0, "standard",
             "Cerrajero de urgencia. Apertura de puertas, cambio de chapas, copias de llaves. Llegada en 30 min.",
             4.4, 19, 67, 8, ["hogar"],
             {0: [(8, 20)], 1: [(8, 20)], 2: [(8, 20)], 3: [(8, 20)], 4: [(8, 20)], 5: [(9, 18)], 6: [(10, 16)]}),

            ("sandra@stabix.cl", "sandra_limp", "Sandra", "Fuentes", "+56 9 9999 0014",
             -70.6800, -33.4700, "Estación Central", 22.0, "budget",
             "Limpieza de hogares y oficinas. Servicios de aseo post-construcción. Confiable y puntual.",
             4.2, 12, 35, 30, ["hogar"],
             {0: [(8, 13), (14, 17)], 1: [(8, 13), (14, 17)], 2: [(8, 13), (14, 17)], 3: [(8, 13), (14, 17)], 4: [(8, 13), (14, 17)]}),

            ("hector@stabix.cl", "hector_gasf", "Héctor", "Araya", "+56 9 9999 0015",
             -70.5789, -33.3858, "Vitacura", 12.0, "premium",
             "Gasfíter premium zona oriente. Especialista en termos, calderas y calefacción central.",
             4.9, 55, 190, 15, ["hogar"],
             {0: [(9, 13), (14, 18)], 1: [(9, 13), (14, 18)], 2: [(9, 13), (14, 18)], 3: [(9, 13), (14, 18)], 4: [(9, 13), (14, 17)]}),

            # --- TECNOLOGÍA ---
            ("felipe@stabix.cl", "felipe_tech", "Felipe", "Contreras", "+56 9 9999 0003",
             -70.6693, -33.4489, "Santiago Centro", 20.0, "standard",
             "Ingeniero en informática. Resuelvo cualquier problema con tu computador, red WiFi o smart TV.",
             4.6, 34, 98, 15, ["tecnologia"],
             {0: [(9, 13), (14, 20)], 1: [(9, 13), (14, 20)], 2: [(9, 13), (14, 20)], 3: [(9, 13), (14, 20)], 4: [(9, 13), (14, 18)], 5: [(10, 15)]}),

            ("valentina@stabix.cl", "vale_tech", "Valentina", "Paredes", "+56 9 9999 0016",
             -70.6011, -33.4574, "Ñuñoa", 15.0, "standard",
             "Soporte técnico Apple y PC. Recuperación de datos, configuración de redes. Servicio express.",
             4.7, 26, 78, 12, ["tecnologia"],
             {0: [(10, 14), (15, 19)], 1: [(10, 14), (15, 19)], 2: [(10, 14), (15, 19)], 3: [(10, 14), (15, 19)], 4: [(10, 14), (15, 19)], 5: [(10, 15)]}),

            ("nicolas@stabix.cl", "nico_redes", "Nicolás", "Bravo", "+56 9 9999 0017",
             -70.5500, -33.4200, "Las Condes", 18.0, "premium",
             "Especialista en redes empresariales y domésticas. Mesh WiFi, cableado estructurado, CCTV.",
             4.8, 38, 112, 10, ["tecnologia"],
             {0: [(8, 13), (14, 18)], 1: [(8, 13), (14, 18)], 2: [(8, 13), (14, 18)], 3: [(8, 13), (14, 18)], 4: [(8, 13), (14, 17)]}),

            # --- BELLEZA Y BIENESTAR ---
            ("andrea@stabix.cl", "andrea_beauty", "Andrea", "Vargas", "+56 9 9999 0002",
             -70.6045, -33.4178, "Las Condes", 12.0, "premium",
             "Estilista certificada. Especialista en colorimetría y cortes modernos. Equipo profesional completo.",
             4.9, 82, 230, 8, ["belleza-bienestar"],
             {0: [(10, 13), (15, 19)], 1: [(10, 13), (15, 19)], 3: [(10, 13), (15, 19)], 4: [(10, 13), (15, 19)], 5: [(9, 14)]}),

            ("catalina@stabix.cl", "cata_nails", "Catalina", "Riquelme", "+56 9 9999 0018",
             -70.6167, -33.4319, "Providencia", 10.0, "standard",
             "Manicurista profesional. Esmaltado semipermanente, diseño de uñas, nail art. Higiene garantizada.",
             4.6, 45, 150, 10, ["belleza-bienestar"],
             {0: [(9, 13), (14, 18)], 1: [(9, 13), (14, 18)], 2: [(9, 13), (14, 18)], 3: [(9, 13), (14, 18)], 4: [(9, 13), (14, 18)], 5: [(10, 15)]}),

            ("marcela@stabix.cl", "marce_masaje", "Marcela", "Soto", "+56 9 9999 0019",
             -70.5900, -33.4400, "La Reina", 15.0, "premium",
             "Masajista terapéutica certificada. Masajes descontracturantes, relajantes y deportivos. Camilla propia.",
             4.8, 60, 185, 12, ["belleza-bienestar"],
             {0: [(9, 13), (15, 20)], 1: [(9, 13), (15, 20)], 2: [(9, 13), (15, 20)], 3: [(9, 13), (15, 20)], 4: [(9, 13), (15, 19)], 5: [(10, 14)]}),

            ("daniela@stabix.cl", "dani_beauty", "Daniela", "Herrera", "+56 9 9999 0020",
             -70.7200, -33.4500, "Pudahuel", 25.0, "budget",
             "Peluquera y maquilladora para eventos. Peinados de novia, quinceañeras. Precios accesibles.",
             4.4, 22, 65, 20, ["belleza-bienestar"],
             {0: [(9, 14), (15, 19)], 1: [(9, 14), (15, 19)], 2: [(9, 14), (15, 19)], 3: [(9, 14), (15, 19)], 4: [(9, 14), (15, 19)], 5: [(9, 15)], 6: [(10, 14)]}),

            # --- EDUCACIÓN ---
            ("lucia@stabix.cl", "lucia_edu", "Lucía", "Fernández", "+56 9 9999 0004",
             -70.5762, -33.4035, "Vitacura", 10.0, "premium",
             "Profesora de inglés con certificación Cambridge CELTA. 8 años enseñando. Clases personalizadas.",
             5.0, 21, 64, 20, ["educacion"],
             {0: [(8, 12), (16, 20)], 1: [(8, 12), (16, 20)], 2: [(8, 12), (16, 20)], 3: [(8, 12), (16, 20)], 4: [(8, 12)]}),

            ("ignacio@stabix.cl", "nacho_mate", "Ignacio", "Cifuentes", "+56 9 9999 0021",
             -70.6300, -33.4500, "Ñuñoa", 15.0, "standard",
             "Ingeniero civil. Clases de matemáticas y física para enseñanza media y PSU/PAES. Resultados garantizados.",
             4.7, 30, 95, 15, ["educacion"],
             {0: [(15, 20)], 1: [(15, 20)], 2: [(15, 20)], 3: [(15, 20)], 4: [(15, 20)], 5: [(10, 14)]}),

            ("francisca@stabix.cl", "fran_musica", "Francisca", "Lagos", "+56 9 9999 0022",
             -70.6100, -33.4250, "Providencia", 12.0, "standard",
             "Músico profesional. Clases de guitarra, piano y canto. Todos los niveles. Método progresivo y divertido.",
             4.8, 18, 52, 18, ["educacion"],
             {0: [(10, 13), (16, 20)], 1: [(10, 13), (16, 20)], 2: [(10, 13), (16, 20)], 3: [(10, 13), (16, 20)], 4: [(10, 13)], 5: [(10, 14)]}),

            # --- EVENTOS ---
            ("matias@stabix.cl", "mati_foto", "Matías", "Olivares", "+56 9 9999 0023",
             -70.6500, -33.4200, "Independencia", 30.0, "premium",
             "Fotógrafo profesional. Bodas, eventos corporativos, retratos. Equipo profesional Canon R5.",
             4.9, 42, 120, 8, ["eventos"],
             {0: [(9, 13), (15, 20)], 1: [(9, 13), (15, 20)], 2: [(9, 13), (15, 20)], 3: [(9, 13), (15, 20)], 4: [(9, 13), (15, 20)], 5: [(8, 20)], 6: [(8, 20)]}),

            ("sebastian@stabix.cl", "seba_dj", "Sebastián", "Pizarro", "+56 9 9999 0024",
             -70.6600, -33.4600, "San Miguel", 25.0, "standard",
             "DJ profesional con 8 años de experiencia. Matrimonios, cumpleaños, eventos corporativos. Equipo propio.",
             4.5, 35, 88, 15, ["eventos"],
             {3: [(18, 23)], 4: [(18, 23)], 5: [(15, 23)], 6: [(15, 23)]}),
        ]

        providers = []
        for (email, username, first, last, phone,
             lng, lat, comuna, radius, band,
             bio, rating, reviews, orders, resp_min,
             cat_slugs, availability) in providers_data:

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": first,
                    "last_name": last,
                    "phone": phone,
                    "is_provider": True,
                },
            )
            if created:
                user.set_password(PASSWORD)
                user.save()

            profile, _ = ProviderProfile.objects.update_or_create(
                user=user,
                defaults={
                    "location": Point(lng, lat, srid=4326),
                    "radius_km": radius,
                    "price_band": band,
                    "bio": bio,
                    "is_verified": True,
                    "is_active": True,
                    "average_rating": rating,
                    "total_reviews": reviews,
                    "total_completed_orders": orders,
                    "average_response_time_minutes": float(resp_min),
                },
            )

            for slug in cat_slugs:
                if slug in categories:
                    profile.categories.add(categories[slug])

            # Store availability for later WorkingHours creation
            profile._availability = availability
            providers.append(profile)
            self.stdout.write(f"  Proveedor: {first} {last} ({email}) — {comuna}")

        return providers

    # ------------------------------------------------------------------
    # Working Hours
    # ------------------------------------------------------------------
    def _create_working_hours(self, providers):
        from apps.appointments.models import WorkingHours

        count = 0
        for provider in providers:
            availability = getattr(provider, "_availability", {})
            for weekday, slots in availability.items():
                for start_h, end_h in slots:
                    WorkingHours.objects.get_or_create(
                        provider=provider,
                        weekday=weekday,
                        start_time=time(start_h, 0),
                        end_time=time(end_h, 0),
                        defaults={"is_active": True},
                    )
                    count += 1
        self.stdout.write(f"  {count} bloques de horario creados")

    # ------------------------------------------------------------------
    # Listings
    # ------------------------------------------------------------------
    def _create_listings(self, providers, services):
        from apps.listings.models import Listing

        # (provider_email, service_slug, title, description, price, unit, duration_min)
        listings_data = [
            # Carlos - Gasfitería
            ("carlos@stabix.cl", "gasfiteria", "Reparación de Cañerías", "Detección y reparación de filtraciones, cambio de llaves, instalación de artefactos.", Decimal("25000"), "por visita", 90),
            ("carlos@stabix.cl", "electricidad", "Instalación Eléctrica", "Enchufes, luminarias, tableros. Certificación SEC.", Decimal("20000"), "por hora", 60),
            ("carlos@stabix.cl", "gasfiteria", "Destape de Cañerías", "Destape profesional con equipo especializado. Garantía 30 días.", Decimal("35000"), "por servicio", 60),
            # Roberto - Limpieza
            ("roberto@stabix.cl", "limpieza-general", "Limpieza Profunda Depto", "Limpieza completa: cocina, baños, pisos, ventanas. Productos incluidos.", Decimal("40000"), "por servicio", 240),
            ("roberto@stabix.cl", "limpieza-general", "Limpieza Regular Semanal", "Mantención semanal. Precio por visita de 4 horas.", Decimal("25000"), "por visita", 240),
            # Jorge - Pintura
            ("jorge@stabix.cl", "pintura", "Pintura Interior", "Pintura de habitaciones, living, cocina. Incluye preparación de muros.", Decimal("35000"), "por habitación", 180),
            ("jorge@stabix.cl", "pintura", "Pintura Exterior", "Fachadas, rejas, portones. Pintura antihongos.", Decimal("45000"), "por m²", 240),
            # Patricia - Jardinería
            ("patricia@stabix.cl", "jardineria", "Mantención de Jardín", "Poda, riego, fertilización, control de plagas.", Decimal("18000"), "por visita", 120),
            ("patricia@stabix.cl", "jardineria", "Diseño de Jardín", "Diseño paisajístico completo con plantas nativas.", Decimal("50000"), "por proyecto", 180),
            # Miguel - Electricidad
            ("miguel@stabix.cl", "electricidad", "Urgencia Eléctrica", "Cortes de luz, cortocircuitos, reparaciones urgentes. Disponible 24/7.", Decimal("30000"), "por visita", 60),
            ("miguel@stabix.cl", "electricidad", "Instalación Luminarias", "LED, dimmers, focos empotrables. Residencial y comercial.", Decimal("15000"), "por punto", 45),
            # Raúl - Cerrajería
            ("raul@stabix.cl", "cerrajeria", "Apertura de Puerta", "Apertura sin daño. Llegada en 30 minutos. Disponible fines de semana.", Decimal("20000"), "por servicio", 30),
            ("raul@stabix.cl", "cerrajeria", "Cambio de Chapa", "Instalación de chapas de seguridad. Marcas Yale, Tesa, Phillips.", Decimal("35000"), "por servicio", 60),
            # Sandra - Limpieza
            ("sandra@stabix.cl", "limpieza-general", "Aseo Post-Construcción", "Limpieza profunda después de remodelaciones. Retiro de escombros.", Decimal("55000"), "por servicio", 300),
            ("sandra@stabix.cl", "limpieza-general", "Limpieza de Oficina", "Aseo de oficinas y espacios comerciales. Servicio diario o semanal.", Decimal("30000"), "por visita", 180),
            # Héctor - Gasfitería premium
            ("hector@stabix.cl", "gasfiteria", "Instalación Termo/Caldera", "Instalación y mantención de termos, calderas y calefacción central.", Decimal("45000"), "por servicio", 120),
            ("hector@stabix.cl", "gasfiteria", "Reparación Premium", "Servicio gasfitería zona oriente. Trabajo garantizado.", Decimal("35000"), "por visita", 90),
            # Felipe - Tecnología
            ("felipe@stabix.cl", "soporte-pc", "Reparación Computador", "Diagnóstico, limpieza, cambio disco/RAM, reinstalación sistema.", Decimal("15000"), "por hora", 60),
            ("felipe@stabix.cl", "redes-wifi", "Instalación Red WiFi", "Router, extensores, mesh. Cobertura total garantizada.", Decimal("25000"), "por servicio", 90),
            ("felipe@stabix.cl", "instalacion-tv", "Instalación Smart TV", "Montaje en muro, configuración apps, conexión audio.", Decimal("20000"), "por servicio", 60),
            # Valentina - Tecnología
            ("valentina@stabix.cl", "soporte-pc", "Soporte Apple Mac", "Reparación y configuración Mac. Time Machine, iCloud, transferencia.", Decimal("20000"), "por hora", 60),
            ("valentina@stabix.cl", "soporte-pc", "Recuperación de Datos", "Recuperación de archivos de discos dañados o formateados.", Decimal("35000"), "por servicio", 120),
            # Nicolás - Redes
            ("nicolas@stabix.cl", "redes-wifi", "Red Mesh Empresarial", "Diseño e instalación de redes mesh para empresas y casas grandes.", Decimal("60000"), "por servicio", 180),
            ("nicolas@stabix.cl", "redes-wifi", "Cableado Estructurado", "Cableado cat6, puntos de red, rack. Certificación.", Decimal("45000"), "por punto", 120),
            # Andrea - Belleza
            ("andrea@stabix.cl", "peluqueria", "Corte y Peinado a Domicilio", "Corte personalizado. Incluye lavado y secado.", Decimal("18000"), "por sesión", 60),
            ("andrea@stabix.cl", "peluqueria", "Colorimetría Profesional", "Tintura, mechas, balayage. Productos Wella/Schwarzkopf.", Decimal("45000"), "por sesión", 150),
            ("andrea@stabix.cl", "masajes", "Masaje Relajante 60 min", "Masaje descontracturante con aceites esenciales.", Decimal("30000"), "por sesión", 60),
            # Catalina - Manicure
            ("catalina@stabix.cl", "manicure-pedicure", "Manicure Semipermanente", "Esmaltado semipermanente con diseño. Duración 2-3 semanas.", Decimal("15000"), "por sesión", 60),
            ("catalina@stabix.cl", "manicure-pedicure", "Manicure + Pedicure", "Servicio completo manos y pies. Semipermanente incluido.", Decimal("22000"), "por sesión", 90),
            # Marcela - Masajes
            ("marcela@stabix.cl", "masajes", "Masaje Descontracturante", "Masaje terapéutico enfocado en zonas de tensión. 60 min.", Decimal("30000"), "por sesión", 60),
            ("marcela@stabix.cl", "masajes", "Masaje Deportivo", "Recuperación muscular post-entrenamiento. Ideal para runners.", Decimal("35000"), "por sesión", 75),
            # Daniela - Belleza
            ("daniela@stabix.cl", "peluqueria", "Peinado para Eventos", "Peinados de novia, quinceañeras, galas. Incluye prueba.", Decimal("25000"), "por sesión", 90),
            ("daniela@stabix.cl", "peluqueria", "Corte y Brushing", "Corte moderno con brushing profesional.", Decimal("12000"), "por sesión", 45),
            # Lucía - Inglés
            ("lucia@stabix.cl", "clases-ingles", "Inglés Conversacional", "Clase enfocada en speaking y listening. Niveles A1-C1.", Decimal("20000"), "por hora", 60),
            ("lucia@stabix.cl", "clases-ingles", "Preparación TOEFL/IELTS", "Programa intensivo con simulacros. Material incluido.", Decimal("28000"), "por hora", 90),
            # Ignacio - Matemáticas
            ("ignacio@stabix.cl", "clases-matematicas", "Reforzamiento Escolar", "Matemáticas y física enseñanza media. Preparación de pruebas.", Decimal("18000"), "por hora", 60),
            ("ignacio@stabix.cl", "clases-matematicas", "Preparación PAES", "Programa intensivo PSU/PAES matemáticas. Ensayos semanales.", Decimal("22000"), "por hora", 90),
            # Francisca - Música
            ("francisca@stabix.cl", "clases-musica", "Clase de Guitarra", "Acústica y eléctrica. Todos los niveles. Repertorio a elección.", Decimal("15000"), "por hora", 60),
            ("francisca@stabix.cl", "clases-musica", "Clase de Piano", "Piano y teclado. Lectura musical, técnica e interpretación.", Decimal("18000"), "por hora", 60),
            # Matías - Fotografía
            ("matias@stabix.cl", "fotografia", "Cobertura Matrimonio", "8 horas de cobertura. 300+ fotos editadas. Entrega digital.", Decimal("250000"), "por evento", 480),
            ("matias@stabix.cl", "fotografia", "Sesión de Retratos", "Sesión de 1 hora. 20 fotos editadas. Interior o exterior.", Decimal("45000"), "por sesión", 60),
            # Sebastián - DJ
            ("sebastian@stabix.cl", "dj-musica", "DJ para Matrimonio", "6 horas de música. Equipo completo: parlantes, luces, micrófono.", Decimal("200000"), "por evento", 360),
            ("sebastian@stabix.cl", "dj-musica", "DJ para Cumpleaños", "4 horas de música. Karaoke incluido.", Decimal("120000"), "por evento", 240),
        ]

        # Build provider lookup
        from apps.users.models import ProviderProfile
        provider_map = {}
        for p in providers:
            provider_map[p.user.email] = p

        all_listings = []
        for email, svc_slug, title, desc, price, unit, duration in listings_data:
            provider = provider_map.get(email)
            if not provider:
                continue
            listing, _ = Listing.objects.update_or_create(
                provider=provider,
                title=title,
                defaults={
                    "service": services[svc_slug],
                    "description": desc,
                    "base_price": price,
                    "price_unit": unit,
                    "estimated_duration_minutes": duration,
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

        # Build provider lookup by email
        provider_map = {p.user.email: p for p in providers}
        p_carlos = provider_map["carlos@stabix.cl"]
        p_roberto = provider_map["roberto@stabix.cl"]
        p_andrea = provider_map["andrea@stabix.cl"]
        p_felipe = provider_map["felipe@stabix.cl"]

        requests_data = [
            {
                "user": customers[0], "service": services["gasfiteria"],
                "location": Point(-70.6400, -33.4300, srid=4326),
                "details": "Tengo una filtración en el baño. El agua sale por debajo del WC.",
                "budget_estimate": Decimal("30000"), "status": "matched",
                "preferred_date": now + timedelta(days=2),
                "match_provider": p_carlos, "match_status": "accepted",
                "match_score": 0.95, "match_quote": Decimal("35000"), "match_eta": 45,
            },
            {
                "user": customers[1], "service": services["clases-ingles"],
                "location": Point(-70.5900, -33.4100, srid=4326),
                "details": "Quiero preparar el IELTS para postular a un máster en UK. Nivel B1.",
                "budget_estimate": Decimal("25000"), "status": "open",
                "preferred_date": now + timedelta(days=5),
            },
            {
                "user": customers[2], "service": services["peluqueria"],
                "location": Point(-70.6100, -33.4200, srid=4326),
                "details": "Quiero un balayage rubio ceniza. Pelo castaño oscuro, largo.",
                "budget_estimate": Decimal("50000"), "status": "open",
                "preferred_date": now + timedelta(days=3),
                "match_provider": p_andrea, "match_status": "pending", "match_score": 0.88,
            },
            {
                "user": customers[0], "service": services["limpieza-general"],
                "location": Point(-70.6400, -33.4300, srid=4326),
                "details": "Limpieza profunda de depto 3 habitaciones, 2 baños.",
                "budget_estimate": Decimal("45000"), "status": "ordered",
                "preferred_date": now - timedelta(days=5),
                "match_provider": p_roberto, "match_status": "accepted",
                "match_score": 0.92, "match_quote": Decimal("40000"), "match_eta": 60,
            },
            {
                "user": None,
                "guest_name": "Alejandro Pérez", "guest_email": "alejandro@gmail.com",
                "guest_phone": "+56 9 7777 1234",
                "service": services["soporte-pc"],
                "location": Point(-70.6500, -33.4400, srid=4326),
                "details": "Mi notebook Lenovo no enciende. Necesito recuperar archivos urgentes.",
                "status": "open", "preferred_date": now + timedelta(days=1),
                "preferred_time_slot": "Mañana (9:00 - 13:00)",
                "target_provider": p_felipe,
                "match_provider": p_felipe, "match_status": "pending", "match_score": 1.0,
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

        orders = []
        ordered_matches = [m for m in matches if m.status == "accepted"]
        for match in ordered_matches:
            jr = match.job_request
            if jr.status == "ordered":
                order, _ = Order.objects.get_or_create(
                    job_request=jr,
                    match=match,
                    defaults={
                        "status": "completed",
                        "amount": match.price_quote or Decimal("40000"),
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

        for order in orders:
            Review.objects.get_or_create(
                order=order,
                defaults={
                    "rating": 5,
                    "comment": "Excelente servicio. Muy puntual y profesional. 100% recomendado.",
                },
            )
        self.stdout.write(f"  {len(orders)} reseñas creadas")

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
        self.stdout.write(self.style.WARNING("  Password: test1234"))
        self.stdout.write("")
        self.stdout.write(f"  {len(customers)} clientes, {len(providers)} proveedores")
        self.stdout.write("")
        self.stdout.write("  PROVEEDORES:")
        for p in providers:
            u = p.user
            self.stdout.write(
                f"    {u.first_name} {u.last_name:12} → {u.email:30}"
                f"  [{p.price_band:8}] ★{p.average_rating}"
            )
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
