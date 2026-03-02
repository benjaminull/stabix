#!/usr/bin/env python
"""
Minimal seed script to populate database with test data
Usage: python manage.py shell < scripts/seed_minimal.py
Or: make seed
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
    print("🌱 Starting seed process...")

    # Clear existing data (optional, comment out if you want to keep existing data)
    print("Clearing existing data...")
    # User.objects.all().delete()
    # ServiceCategory.objects.all().delete()

    # Create service categories
    print("\n📁 Creating service categories...")
    categories_data = [
        {
            "name": "Home Services",
            "slug": "home-services",
            "description": "Home maintenance and repair services",
            "icon": "home",
        },
        {
            "name": "Professional Services",
            "slug": "professional-services",
            "description": "Professional and consulting services",
            "icon": "briefcase",
        },
        {
            "name": "Personal Services",
            "slug": "personal-services",
            "description": "Personal care and wellness services",
            "icon": "user",
        },
    ]

    categories = {}
    for cat_data in categories_data:
        category, created = ServiceCategory.objects.get_or_create(
            slug=cat_data["slug"], defaults=cat_data
        )
        categories[cat_data["slug"]] = category
        status = "✓ Created" if created else "○ Exists"
        print(f"  {status}: {category.name}")

    # Create services
    print("\n🛠️  Creating services...")
    services_data = [
        {"category": "home-services", "name": "Plumbing", "slug": "plumbing"},
        {"category": "home-services", "name": "Electrical", "slug": "electrical"},
        {"category": "home-services", "name": "Cleaning", "slug": "cleaning"},
        {"category": "professional-services", "name": "Consulting", "slug": "consulting"},
        {"category": "professional-services", "name": "Accounting", "slug": "accounting"},
        {"category": "personal-services", "name": "Fitness Training", "slug": "fitness-training"},
    ]

    services = {}
    for svc_data in services_data:
        category = categories[svc_data["category"]]
        service, created = Service.objects.get_or_create(
            slug=svc_data["slug"],
            category=category,
            defaults={"name": svc_data["name"], "description": f"{svc_data['name']} services"},
        )
        services[svc_data["slug"]] = service
        status = "✓ Created" if created else "○ Exists"
        print(f"  {status}: {service.name}")

    # Create demo user
    print("\n👤 Creating demo users...")
    demo_user, created = User.objects.get_or_create(
        email="demo@stabix.com",
        defaults={
            "username": "demo",
            "first_name": "Demo",
            "last_name": "User",
        },
    )
    if created:
        demo_user.set_password("demo123")
        demo_user.save()
        print("  ✓ Created: demo@stabix.com (password: demo123)")
    else:
        print("  ○ Exists: demo@stabix.com")

    # Create provider users
    print("\n🔧 Creating provider users...")
    providers_data = [
        {
            "email": "provider1@stabix.com",
            "username": "provider1",
            "first_name": "John",
            "last_name": "Smith",
            "location": Point(-118.2437, 34.0522, srid=4326),  # Los Angeles
            "categories": ["home-services"],
            "price_band": "standard",
            "bio": "Experienced home services provider with 10+ years",
        },
        {
            "email": "provider2@stabix.com",
            "username": "provider2",
            "first_name": "Jane",
            "last_name": "Doe",
            "location": Point(-122.4194, 37.7749, srid=4326),  # San Francisco
            "categories": ["professional-services"],
            "price_band": "premium",
            "bio": "Professional consultant specializing in business strategy",
        },
        {
            "email": "provider3@stabix.com",
            "username": "provider3",
            "first_name": "Mike",
            "last_name": "Johnson",
            "location": Point(-73.9352, 40.7306, srid=4326),  # Brooklyn
            "categories": ["personal-services"],
            "price_band": "budget",
            "bio": "Certified personal trainer helping people achieve their fitness goals",
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
            user.set_password("provider123")
            user.save()

        # Create or update provider profile
        profile, prof_created = ProviderProfile.objects.get_or_create(
            user=user,
            defaults={
                "location": provider_data["location"],
                "radius_km": 25.0,
                "price_band": provider_data["price_band"],
                "bio": provider_data["bio"],
                "is_active": True,
                "is_verified": True,
                "average_rating": 4.5,
                "total_reviews": 15,
            },
        )

        # Add categories
        for cat_slug in provider_data["categories"]:
            profile.categories.add(categories[cat_slug])

        provider_profiles.append(profile)
        status = "✓ Created" if created else "○ Exists"
        print(f"  {status}: {user.email} (password: provider123)")

    # Create listings
    print("\n📝 Creating listings...")
    listings_data = [
        {
            "provider": provider_profiles[0],
            "service": services["plumbing"],
            "title": "Expert Plumbing Services",
            "description": "Fast and reliable plumbing repairs and installations",
            "base_price": Decimal("85.00"),
            "price_unit": "per hour",
        },
        {
            "provider": provider_profiles[0],
            "service": services["electrical"],
            "title": "Licensed Electrician",
            "description": "All types of electrical work, licensed and insured",
            "base_price": Decimal("95.00"),
            "price_unit": "per hour",
        },
        {
            "provider": provider_profiles[1],
            "service": services["consulting"],
            "title": "Business Strategy Consulting",
            "description": "Help your business grow with expert consulting",
            "base_price": Decimal("150.00"),
            "price_unit": "per hour",
        },
        {
            "provider": provider_profiles[2],
            "service": services["fitness-training"],
            "title": "Personal Training Sessions",
            "description": "Get fit with customized training programs",
            "base_price": Decimal("60.00"),
            "price_unit": "per session",
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
        status = "✓ Created" if created else "○ Exists"
        print(f"  {status}: {listing.title}")

    # Generate JWT token for demo user
    print("\n🔑 JWT Tokens for testing:")
    print("\n--- Demo User ---")
    refresh = RefreshToken.for_user(demo_user)
    print(f"Email: demo@stabix.com")
    print(f"Password: demo123")
    print(f"Access Token: {refresh.access_token}")
    print(f"Refresh Token: {refresh}")

    print("\n--- Provider 1 ---")
    provider1_refresh = RefreshToken.for_user(provider_profiles[0].user)
    print(f"Email: provider1@stabix.com")
    print(f"Password: provider123")
    print(f"Access Token: {provider1_refresh.access_token}")

    print("\n✅ Seed complete!")
    print(f"\n📊 Summary:")
    print(f"  - Categories: {ServiceCategory.objects.count()}")
    print(f"  - Services: {Service.objects.count()}")
    print(f"  - Users: {User.objects.count()}")
    print(f"  - Providers: {ProviderProfile.objects.count()}")
    print(f"  - Listings: {Listing.objects.count()}")

    print("\n🚀 You can now:")
    print("  - Access API at http://localhost:8000/api/")
    print("  - View API docs at http://localhost:8000/api/docs/")
    print("  - Login with demo@stabix.com / demo123")


if __name__ == "__main__":
    seed_data()
