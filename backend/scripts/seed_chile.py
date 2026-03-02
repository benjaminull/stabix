#!/usr/bin/env python
"""
Script de seed para Chile - Datos de prueba con ubicaciones en Santiago
Uso: python manage.py shell < scripts/seed_chile.py
O: docker compose exec api python scripts/seed_chile.py
"""

import os
import sys
from decimal import Decimal
from pathlib import Path

import django

# Setup Django
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stabix_backend.settings.local")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from rest_framework_simplejwt.tokens import RefreshToken

from apps.listings.models import Listing
from apps.taxonomy.models import Service, ServiceCategory
from apps.users.models import ProviderProfile

User = get_user_model()


def seed_data():
    print("🌱 Iniciando proceso de seed para Chile...")

    # Limpiar datos existentes
    print("Limpiando datos existentes...")
    Listing.objects.all().delete()
    ProviderProfile.objects.all().delete()
    User.objects.filter(email__contains="@stabix.cl").delete()

    # Crear categorías de servicio en español
    print("\n📁 Creando categorías de servicios...")
    categories_data = [
        {
            "name": "Servicios del Hogar",
            "slug": "servicios-hogar",
            "description": "Mantenimiento y reparaciones para el hogar",
            "icon": "home",
        },
        {
            "name": "Servicios Profesionales",
            "slug": "servicios-profesionales",
            "description": "Servicios profesionales y consultoría",
            "icon": "briefcase",
        },
        {
            "name": "Servicios Personales",
            "slug": "servicios-personales",
            "description": "Cuidado personal y bienestar",
            "icon": "user",
        },
        {
            "name": "Construcción y Remodelación",
            "slug": "construccion",
            "description": "Construcción, remodelación y obras",
            "icon": "hammer",
        },
        {
            "name": "Tecnología",
            "slug": "tecnologia",
            "description": "Servicios de tecnología y computación",
            "icon": "laptop",
        },
    ]

    categories = {}
    for cat_data in categories_data:
        category, created = ServiceCategory.objects.get_or_create(
            slug=cat_data["slug"], defaults=cat_data
        )
        categories[cat_data["slug"]] = category
        status = "✓ Creado" if created else "○ Existe"
        print(f"  {status}: {category.name}")

    # Crear servicios en español
    print("\n🛠️  Creando servicios...")
    services_data = [
        {"category": "servicios-hogar", "name": "Gasfitería", "slug": "gasfiteria"},
        {"category": "servicios-hogar", "name": "Electricidad", "slug": "electricidad"},
        {"category": "servicios-hogar", "name": "Limpieza", "slug": "limpieza"},
        {"category": "servicios-hogar", "name": "Cerrajería", "slug": "cerrajeria"},
        {"category": "construccion", "name": "Carpintería", "slug": "carpinteria"},
        {"category": "construccion", "name": "Pintura", "slug": "pintura"},
        {"category": "construccion", "name": "Albañilería", "slug": "albanileria"},
        {"category": "servicios-hogar", "name": "Jardinería", "slug": "jardineria"},
        {"category": "servicios-profesionales", "name": "Consultoría", "slug": "consultoria"},
        {"category": "servicios-profesionales", "name": "Contabilidad", "slug": "contabilidad"},
        {"category": "servicios-personales", "name": "Entrenamiento Personal", "slug": "entrenamiento"},
        {"category": "tecnologia", "name": "Reparación de Computadores", "slug": "reparacion-computadores"},
        {"category": "tecnologia", "name": "Instalación de TV y Audio", "slug": "instalacion-tv"},
    ]

    services = {}
    for svc_data in services_data:
        category = categories[svc_data["category"]]
        service, created = Service.objects.get_or_create(
            slug=svc_data["slug"],
            category=category,
            defaults={"name": svc_data["name"], "description": f"Servicios de {svc_data['name'].lower()}"},
        )
        services[svc_data["slug"]] = service
        status = "✓ Creado" if created else "○ Existe"
        print(f"  {status}: {service.name}")

    # Crear usuario demo
    print("\n👤 Creando usuario demo...")
    demo_user, created = User.objects.get_or_create(
        email="demo@stabix.cl",
        defaults={
            "username": "demo_cl",
            "first_name": "Demo",
            "last_name": "Usuario",
        },
    )
    if created:
        demo_user.set_password("demo123")
        demo_user.save()
        print("  ✓ Creado: demo@stabix.cl (contraseña: demo123)")
    else:
        print("  ○ Existe: demo@stabix.cl")

    # Crear proveedores en diferentes comunas de Santiago
    print("\n🔧 Creando proveedores en Santiago...")
    providers_data = [
        {
            "email": "juan.perez@stabix.cl",
            "username": "juan_gasfiter",
            "first_name": "Juan",
            "last_name": "Pérez",
            "location": Point(-70.6167, -33.4319, srid=4326),  # Providencia
            "categories": ["servicios-hogar"],
            "price_band": "standard",
            "bio": "Gasfiter profesional con más de 15 años de experiencia. Atiendo todo tipo de emergencias.",
        },
        {
            "email": "maria.gonzalez@stabix.cl",
            "username": "maria_limpieza",
            "first_name": "María",
            "last_name": "González",
            "location": Point(-70.5775, -33.4092, srid=4326),  # Las Condes
            "categories": ["servicios-hogar"],
            "price_band": "premium",
            "bio": "Servicio de limpieza profesional para hogares y oficinas. Productos ecológicos.",
        },
        {
            "email": "carlos.rojas@stabix.cl",
            "username": "carlos_electricista",
            "first_name": "Carlos",
            "last_name": "Rojas",
            "location": Point(-70.6484, -33.4372, srid=4326),  # Santiago Centro
            "categories": ["servicios-hogar"],
            "price_band": "standard",
            "bio": "Electricista certificado SEC. Instalaciones, mantenciones y reparaciones eléctricas.",
        },
        {
            "email": "patricia.silva@stabix.cl",
            "username": "patricia_pintora",
            "first_name": "Patricia",
            "last_name": "Silva",
            "location": Point(-70.6011, -33.4574, srid=4326),  # Ñuñoa
            "categories": ["construccion"],
            "price_band": "budget",
            "bio": "Pintora profesional. Pintura de casas, departamentos y locales comerciales.",
        },
        {
            "email": "roberto.munoz@stabix.cl",
            "username": "roberto_carpintero",
            "first_name": "Roberto",
            "last_name": "Muñoz",
            "location": Point(-70.5789, -33.3858, srid=4326),  # Vitacura
            "categories": ["construccion"],
            "price_band": "premium",
            "bio": "Carpintero ebanista con 20 años de experiencia. Muebles a medida y reparaciones.",
        },
        {
            "email": "andrea.lopez@stabix.cl",
            "username": "andrea_jardinera",
            "first_name": "Andrea",
            "last_name": "López",
            "location": Point(-70.5975, -33.5219, srid=4326),  # La Florida
            "categories": ["servicios-hogar"],
            "price_band": "standard",
            "bio": "Paisajista y jardinera. Mantención de jardines, podas y diseño de espacios verdes.",
        },
        {
            "email": "luis.torres@stabix.cl",
            "username": "luis_albanil",
            "first_name": "Luis",
            "last_name": "Torres",
            "location": Point(-70.7583, -33.5069, srid=4326),  # Maipú
            "categories": ["construccion"],
            "price_band": "budget",
            "bio": "Maestro albañil. Construcción, ampliaciones y remodelaciones.",
        },
        {
            "email": "claudia.ramirez@stabix.cl",
            "username": "claudia_contadora",
            "first_name": "Claudia",
            "last_name": "Ramírez",
            "location": Point(-70.6167, -33.4319, srid=4326),  # Providencia
            "categories": ["servicios-profesionales"],
            "price_band": "premium",
            "bio": "Contadora auditora. Asesoría contable y tributaria para empresas y particulares.",
        },
        {
            "email": "diego.vargas@stabix.cl",
            "username": "diego_tech",
            "first_name": "Diego",
            "last_name": "Vargas",
            "location": Point(-70.6011, -33.4574, srid=4326),  # Ñuñoa
            "categories": ["tecnologia"],
            "price_band": "standard",
            "bio": "Técnico en computación. Reparación y mantención de equipos, instalación de redes.",
        },
        {
            "email": "fernanda.castro@stabix.cl",
            "username": "fernanda_trainer",
            "first_name": "Fernanda",
            "last_name": "Castro",
            "location": Point(-70.5775, -33.4092, srid=4326),  # Las Condes
            "categories": ["servicios-personales"],
            "price_band": "premium",
            "bio": "Entrenadora personal certificada. Planes personalizados de fitness y nutrición.",
        },
        {
            "email": "sergio.herrera@stabix.cl",
            "username": "sergio_cerrajero",
            "first_name": "Sergio",
            "last_name": "Herrera",
            "location": Point(-70.6484, -33.4372, srid=4326),  # Santiago Centro
            "categories": ["servicios-hogar"],
            "price_band": "standard",
            "bio": "Cerrajero 24/7. Apertura de puertas, cambio de chapas, copias de llaves.",
        },
    ]

    provider_profiles = []
    for provider_data in providers_data:
        user, created = User.objects.get_or_create(
            email=provider_data["email"],
            defaults={
                "username": provider_data["username"],
                "first_name": provider_data["first_name"],
                "last_name": provider_data["last_name"],
                "is_provider": True,
            },
        )
        if created:
            user.set_password("proveedor123")
            user.save()

        # Crear o actualizar perfil del proveedor
        profile, prof_created = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                "location": provider_data["location"],
                "radius_km": 15.0,  # Radio más pequeño para Santiago
                "price_band": provider_data["price_band"],
                "bio": provider_data["bio"],
                "is_active": True,
                "is_verified": True,
                "average_rating": round(4.0 + (hash(user.email) % 11) / 10, 1),  # 4.0-5.0
                "total_reviews": 5 + (hash(user.email) % 20),  # 5-25 reviews
                "total_completed_orders": 10 + (hash(user.email) % 50),  # 10-60 orders
            },
        )

        # Agregar categorías
        for cat_slug in provider_data["categories"]:
            profile.categories.add(categories[cat_slug])

        provider_profiles.append(profile)
        status = "✓ Creado" if created else "○ Existe"
        print(f"  {status}: {user.email} - {user.first_name} {user.last_name} (contraseña: proveedor123)")

    # Crear listados de servicios
    print("\n📝 Creando listados de servicios...")
    listings_data = [
        {
            "provider": provider_profiles[0],
            "service": services["gasfiteria"],
            "title": "Gasfitería y Reparaciones de Cañerías",
            "description": "Atención rápida de emergencias, reparación de cañerías, instalación de artefactos sanitarios.",
            "base_price": Decimal("25000"),
            "price_unit": "por hora",
        },
        {
            "provider": provider_profiles[1],
            "service": services["limpieza"],
            "title": "Limpieza Profunda de Hogares",
            "description": "Servicio de limpieza completa para hogares y departamentos. Productos ecológicos incluidos.",
            "base_price": Decimal("35000"),
            "price_unit": "por sesión",
        },
        {
            "provider": provider_profiles[2],
            "service": services["electricidad"],
            "title": "Instalaciones y Reparaciones Eléctricas",
            "description": "Electricista certificado SEC. Todo tipo de instalaciones y reparaciones eléctricas.",
            "base_price": Decimal("28000"),
            "price_unit": "por hora",
        },
        {
            "provider": provider_profiles[3],
            "service": services["pintura"],
            "title": "Pintura de Casas y Departamentos",
            "description": "Pintamos tu hogar con materiales de primera calidad. Presupuesto sin compromiso.",
            "base_price": Decimal("180000"),
            "price_unit": "por habitación",
        },
        {
            "provider": provider_profiles[4],
            "service": services["carpinteria"],
            "title": "Carpintería y Muebles a Medida",
            "description": "Fabricación de muebles a medida, closets, cocinas y reparaciones en madera.",
            "base_price": Decimal("45000"),
            "price_unit": "por hora",
        },
        {
            "provider": provider_profiles[5],
            "service": services["jardineria"],
            "title": "Mantención y Diseño de Jardines",
            "description": "Poda, mantención, diseño paisajístico y cuidado de áreas verdes.",
            "base_price": Decimal("30000"),
            "price_unit": "por visita",
        },
        {
            "provider": provider_profiles[6],
            "service": services["albanileria"],
            "title": "Construcción y Remodelaciones",
            "description": "Albañilería en general, ampliaciones, remodelaciones y construcción de radier.",
            "base_price": Decimal("250000"),
            "price_unit": "por día",
        },
        {
            "provider": provider_profiles[7],
            "service": services["contabilidad"],
            "title": "Asesoría Contable y Tributaria",
            "description": "Servicios contables completos, declaraciones de impuestos, asesoría financiera.",
            "base_price": Decimal("80000"),
            "price_unit": "por mes",
        },
        {
            "provider": provider_profiles[8],
            "service": services["reparacion-computadores"],
            "title": "Reparación de Computadores a Domicilio",
            "description": "Diagnóstico y reparación de computadores, limpieza de virus, instalación de software.",
            "base_price": Decimal("20000"),
            "price_unit": "por visita",
        },
        {
            "provider": provider_profiles[9],
            "service": services["entrenamiento"],
            "title": "Entrenamiento Personal y Nutrición",
            "description": "Planes personalizados de entrenamiento y nutrición. Entrena desde casa o en el gym.",
            "base_price": Decimal("25000"),
            "price_unit": "por sesión",
        },
        {
            "provider": provider_profiles[10],
            "service": services["cerrajeria"],
            "title": "Cerrajería 24 Horas",
            "description": "Apertura de puertas, instalación y cambio de cerraduras, copias de llaves.",
            "base_price": Decimal("18000"),
            "price_unit": "por servicio",
        },
    ]

    for listing_data in listings_data:
        listing, created = Listing.objects.get_or_create(
            provider=listing_data["provider"],
            service=listing_data["service"],
            defaults={
                "title": listing_data["title"],
                "description": listing_data["description"],
                "base_price": listing_data["base_price"],
                "price_unit": listing_data["price_unit"],
                "is_active": True,
            },
        )
        status = "✓ Creado" if created else "○ Existe"
        print(f"  {status}: {listing.title}")

    # Generar token JWT para usuario demo
    print("\n🔑 Tokens JWT para testing:")
    print("\n--- Usuario Demo ---")
    refresh = RefreshToken.for_user(demo_user)
    print(f"Email: demo@stabix.cl")
    print(f"Contraseña: demo123")
    print(f"Access Token: {refresh.access_token}")

    print("\n✅ Seed completado!")
    print(f"\n📊 Resumen:")
    print(f"  - Categorías: {ServiceCategory.objects.count()}")
    print(f"  - Servicios: {Service.objects.count()}")
    print(f"  - Usuarios: {User.objects.count()}")
    print(f"  - Proveedores: {ProviderProfile.objects.count()}")
    print(f"  - Listados: {Listing.objects.count()}")

    print("\n🚀 Ahora puedes:")
    print("  - Acceder al API en http://localhost:8000/api/")
    print("  - Ver documentación en http://localhost:8000/api/docs/")
    print("  - Iniciar sesión con demo@stabix.cl / demo123")
    print("  - Ver el mapa en http://localhost:3000/search")


if __name__ == "__main__":
    seed_data()
