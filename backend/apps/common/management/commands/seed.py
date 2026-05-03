"""
Management command to seed the database with initial data.

Usage:
    python manage.py seed          # Seed categories, services, and superuser
    python manage.py seed --flush  # Wipe DB first, then seed
"""

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed the database with categories, services, and the admin superuser"

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
        self._create_superuser()
        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))

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
    # Superuser
    # ------------------------------------------------------------------
    def _create_superuser(self):
        from apps.users.models import User

        email = "jose@stabix.cl"
        if User.objects.filter(email=email).exists():
            self.stdout.write(f"  Superuser {email} ya existe, saltando")
            return

        user = User.objects.create_superuser(
            email=email,
            username="jose",
            password="stabix2024",
            first_name="Jose",
            last_name="Admin",
        )
        self.stdout.write(self.style.SUCCESS(f"  Superuser creado: {email} / stabix2024"))
