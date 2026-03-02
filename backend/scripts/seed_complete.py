#!/usr/bin/env python
"""
Complete seed script to populate database with comprehensive test data
Usage: python scripts/seed_complete.py
Or: docker compose exec api python scripts/seed_complete.py
"""

import os
import sys
import random
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

import django

# Setup Django
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stabix_backend.settings.local")
django.setup()

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.utils import timezone

from apps.listings.models import Listing
from apps.taxonomy.models import Service, ServiceCategory
from apps.users.models import ProviderProfile
from apps.jobs.models import JobRequest, Match
from apps.orders.models import Order
from apps.reviews.models import Review
from apps.chat.models import Message

User = get_user_model()


# Coordenadas de ciudades principales de USA
CITIES = [
    {"name": "Los Angeles, CA", "coords": (-118.2437, 34.0522)},
    {"name": "San Francisco, CA", "coords": (-122.4194, 37.7749)},
    {"name": "New York, NY", "coords": (-74.0060, 40.7128)},
    {"name": "Chicago, IL", "coords": (-87.6298, 41.8781)},
    {"name": "Houston, TX", "coords": (-95.3698, 29.7604)},
    {"name": "Miami, FL", "coords": (-80.1918, 25.7617)},
    {"name": "Seattle, WA", "coords": (-122.3321, 47.6062)},
    {"name": "Austin, TX", "coords": (-97.7431, 30.2672)},
    {"name": "Denver, CO", "coords": (-104.9903, 39.7392)},
    {"name": "Boston, MA", "coords": (-71.0589, 42.3601)},
]

# Nombres para generar usuarios
FIRST_NAMES = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
    "James", "Mary", "William", "Jennifer", "Richard", "Patricia", "Thomas",
    "Linda", "Charles", "Barbara", "Daniel", "Elizabeth", "Matthew", "Susan",
    "Anthony", "Jessica", "Mark", "Karen", "Donald", "Nancy", "Steven", "Betty"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
    "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
]

# Reviews de ejemplo
REVIEW_COMMENTS = [
    "Excellent service! Very professional and punctual.",
    "Great experience, highly recommend!",
    "Quick and efficient. Will use again.",
    "Professional work, fair pricing.",
    "Outstanding service from start to finish.",
    "Very knowledgeable and helpful.",
    "Exceeded my expectations!",
    "Good service but a bit pricey.",
    "Satisfactory work, got the job done.",
    "Amazing! Best service I've had in years.",
    "Very responsive and thorough.",
    "Quality work at a reasonable price.",
    "Couldn't be happier with the results!",
    "Professional and courteous.",
    "Would definitely hire again!"
]

# Job descriptions
JOB_DESCRIPTIONS = {
    "plumbing": [
        "Need to fix a leaking faucet in the kitchen",
        "Toilet not flushing properly, need repair",
        "Want to install a new dishwasher",
        "Water heater needs replacement",
        "Clogged drain in bathroom sink"
    ],
    "electrical": [
        "Install new ceiling fan in living room",
        "Replace outdated electrical panel",
        "Need new outlets installed in garage",
        "Flickering lights need investigation",
        "Install outdoor lighting in backyard"
    ],
    "cleaning": [
        "Deep cleaning for 3-bedroom house",
        "Post-construction cleanup needed",
        "Regular weekly cleaning service",
        "Move-out cleaning for apartment",
        "Carpet cleaning for entire house"
    ],
    "consulting": [
        "Need help with business strategy planning",
        "Marketing consultation for new product launch",
        "Financial planning for small business",
        "HR consulting for team expansion",
        "Technology consulting for digital transformation"
    ],
    "accounting": [
        "Tax preparation for small business",
        "Bookkeeping services needed monthly",
        "Financial audit preparation",
        "Payroll setup and management",
        "Quarterly financial statements"
    ],
    "fitness-training": [
        "Personal training for weight loss",
        "Marathon training program",
        "Strength training for beginners",
        "Yoga and flexibility coaching",
        "Nutrition and workout planning"
    ]
}


def random_phone():
    """Generate a random US phone number"""
    return f"+1{random.randint(200, 999)}{random.randint(200, 999)}{random.randint(1000, 9999)}"


def random_location_near(base_coords, max_distance_km=20):
    """Generate a random location near base coordinates"""
    # Rough conversion: 1 degree ≈ 111 km
    lat_offset = random.uniform(-max_distance_km/111, max_distance_km/111)
    lon_offset = random.uniform(-max_distance_km/111, max_distance_km/111)
    return Point(base_coords[0] + lon_offset, base_coords[1] + lat_offset, srid=4326)


def seed_data():
    print("🌱 Starting COMPLETE seed process...")
    print("=" * 60)

    # Clear existing data
    print("\n🗑️  Clearing existing data...")
    Review.objects.all().delete()
    Message.objects.all().delete()
    Order.objects.all().delete()
    Match.objects.all().delete()
    JobRequest.objects.all().delete()
    Listing.objects.all().delete()
    ProviderProfile.objects.all().delete()
    User.objects.all().delete()
    Service.objects.all().delete()
    ServiceCategory.objects.all().delete()
    print("  ✓ Data cleared")

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
        {
            "name": "Technology",
            "slug": "technology",
            "description": "IT and technology services",
            "icon": "laptop",
        },
        {
            "name": "Education",
            "slug": "education",
            "description": "Tutoring and educational services",
            "icon": "book",
        },
    ]

    categories = {}
    for cat_data in categories_data:
        category = ServiceCategory.objects.create(**cat_data)
        categories[cat_data["slug"]] = category
        print(f"  ✓ Created: {category.name}")

    # Create services
    print("\n🛠️  Creating services...")
    services_data = [
        {"category": "home-services", "name": "Plumbing", "slug": "plumbing"},
        {"category": "home-services", "name": "Electrical", "slug": "electrical"},
        {"category": "home-services", "name": "Cleaning", "slug": "cleaning"},
        {"category": "home-services", "name": "Painting", "slug": "painting"},
        {"category": "home-services", "name": "Carpentry", "slug": "carpentry"},
        {"category": "home-services", "name": "Landscaping", "slug": "landscaping"},
        {"category": "professional-services", "name": "Consulting", "slug": "consulting"},
        {"category": "professional-services", "name": "Accounting", "slug": "accounting"},
        {"category": "professional-services", "name": "Legal Services", "slug": "legal"},
        {"category": "professional-services", "name": "Real Estate", "slug": "real-estate"},
        {"category": "personal-services", "name": "Fitness Training", "slug": "fitness-training"},
        {"category": "personal-services", "name": "Massage Therapy", "slug": "massage"},
        {"category": "personal-services", "name": "Hair Styling", "slug": "hair-styling"},
        {"category": "technology", "name": "Computer Repair", "slug": "computer-repair"},
        {"category": "technology", "name": "Web Development", "slug": "web-development"},
        {"category": "education", "name": "Math Tutoring", "slug": "math-tutoring"},
        {"category": "education", "name": "Language Lessons", "slug": "language-lessons"},
    ]

    services = {}
    for svc_data in services_data:
        category = categories[svc_data["category"]]
        service = Service.objects.create(
            slug=svc_data["slug"],
            category=category,
            name=svc_data["name"],
            description=f"Professional {svc_data['name'].lower()} services"
        )
        services[svc_data["slug"]] = service
        print(f"  ✓ Created: {service.name}")

    # Create customer users
    print("\n👤 Creating customer users...")
    customers = []

    # Demo user
    demo_user = User.objects.create(
        email="demo@stabix.com",
        username="demo",
        first_name="Demo",
        last_name="User",
        phone=random_phone()
    )
    demo_user.set_password("demo123")
    demo_user.save()
    customers.append(demo_user)
    print(f"  ✓ Created: demo@stabix.com (password: demo123)")

    # Additional customers
    for i in range(1, 11):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        user = User.objects.create(
            email=f"customer{i}@stabix.com",
            username=f"customer{i}",
            first_name=first_name,
            last_name=last_name,
            phone=random_phone()
        )
        user.set_password("customer123")
        user.save()
        customers.append(user)
        print(f"  ✓ Created: {user.email} (password: customer123)")

    # Create provider users and profiles
    print("\n🔧 Creating provider users and profiles...")
    providers = []

    for i in range(1, 21):
        city = random.choice(CITIES)
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)

        user = User.objects.create(
            email=f"provider{i}@stabix.com",
            username=f"provider{i}",
            first_name=first_name,
            last_name=last_name,
            is_provider=True,
            phone=random_phone()
        )
        user.set_password("provider123")
        user.save()

        # Create provider profile
        profile = ProviderProfile.objects.create(
            user=user,
            location=Point(city["coords"][0], city["coords"][1], srid=4326),
            radius_km=random.choice([15.0, 25.0, 35.0, 50.0]),
            price_band=random.choice(["budget", "standard", "premium"]),
            bio=f"Experienced {random.choice(['professional', 'expert', 'specialist'])} serving {city['name']} area with {random.randint(5, 20)}+ years of experience.",
            is_active=True,
            is_verified=random.choice([True, True, True, False]),  # 75% verified
            average_rating=round(random.uniform(3.5, 5.0), 1),
            total_reviews=random.randint(5, 50)
        )

        # Add 1-3 random categories
        num_categories = random.randint(1, 3)
        random_categories = random.sample(list(categories.values()), num_categories)
        for cat in random_categories:
            profile.categories.add(cat)

        providers.append(profile)
        print(f"  ✓ Created: {user.email} ({city['name']})")

    # Create listings
    print("\n📝 Creating listings...")
    listings = []

    price_ranges = {
        "budget": (40, 70),
        "standard": (70, 120),
        "premium": (120, 200)
    }

    for provider in providers:
        # Each provider creates 1-4 listings
        num_listings = random.randint(1, 4)
        provider_services = list(services.values())
        random.shuffle(provider_services)

        for service in provider_services[:num_listings]:
            price_min, price_max = price_ranges[provider.price_band]
            base_price = Decimal(str(random.randint(price_min, price_max)))

            listing = Listing.objects.create(
                provider=provider,
                service=service,
                title=f"{service.name} - {provider.user.first_name} {provider.user.last_name}",
                description=f"Professional {service.name.lower()} service. {random.choice(['Licensed and insured.', 'Same-day service available.', 'Free estimates.', 'Satisfaction guaranteed.'])}",
                base_price=base_price,
                price_unit=random.choice(["per hour", "per project", "per session"]),
                is_active=random.choice([True, True, True, False])  # 75% active
            )
            listings.append(listing)

    print(f"  ✓ Created {len(listings)} listings")

    # Create job requests
    print("\n📋 Creating job requests...")
    job_requests = []

    for customer in customers[:8]:  # 8 customers create job requests
        num_jobs = random.randint(1, 3)
        for _ in range(num_jobs):
            service = random.choice(list(services.values()))
            city = random.choice(CITIES)
            location = random_location_near(city["coords"])

            # Get job description based on service slug
            descriptions = JOB_DESCRIPTIONS.get(service.slug, ["General service needed"])

            job = JobRequest.objects.create(
                user=customer,
                service=service,
                location=location,
                details=random.choice(descriptions),
                budget_estimate=Decimal(str(random.randint(100, 500))),
                status=random.choice(["open", "open", "matched", "ordered", "cancelled"]),
                preferred_date=timezone.now() + timedelta(days=random.randint(1, 14))
            )
            job_requests.append(job)

    print(f"  ✓ Created {len(job_requests)} job requests")

    # Create matches
    print("\n🔗 Creating matches...")
    matches = []

    for job in job_requests:
        if job.status in ["matched", "ordered"]:
            # Create 2-5 matches for this job
            num_matches = random.randint(2, 5)

            # Find providers that offer this service
            eligible_providers = [
                p for p in providers
                if Listing.objects.filter(provider=p, service=job.service, is_active=True).exists()
            ]

            if eligible_providers:
                selected_providers = random.sample(
                    eligible_providers,
                    min(num_matches, len(eligible_providers))
                )

                for i, provider in enumerate(selected_providers):
                    # First match is usually accepted if job is ordered/matched
                    if i == 0 and job.status == "ordered":
                        status = "accepted"
                    else:
                        status = random.choice(["pending", "pending", "accepted", "rejected"])

                    match = Match.objects.create(
                        job_request=job,
                        provider=provider,
                        score=round(random.uniform(0.6, 1.0), 2),
                        status=status,
                        eta_minutes=random.randint(30, 180),
                        price_quote=Decimal(str(random.randint(100, 600))),
                        provider_notes=random.choice([
                            "I can start immediately!",
                            "Available this week.",
                            "Happy to provide this service.",
                            "Experienced with this type of work.",
                            ""
                        ])
                    )
                    matches.append(match)

    print(f"  ✓ Created {len(matches)} matches")

    # Create orders
    print("\n📦 Creating orders...")
    orders = []

    accepted_matches = [m for m in matches if m.status == "accepted"]

    for match in accepted_matches[:15]:  # Create orders for first 15 accepted matches
        scheduled_at = timezone.now() + timedelta(days=random.randint(-10, 5))

        # Determine order status based on scheduled date
        if scheduled_at < timezone.now() - timedelta(days=3):
            status = "completed"
            started_at = scheduled_at
            completed_at = scheduled_at + timedelta(hours=random.randint(1, 8))
        elif scheduled_at < timezone.now():
            status = random.choice(["in_progress", "in_progress", "completed"])
            started_at = scheduled_at if status == "in_progress" else scheduled_at
            completed_at = started_at + timedelta(hours=random.randint(1, 8)) if status == "completed" else None
        else:
            status = "paid"
            started_at = None
            completed_at = None

        order = Order.objects.create(
            job_request=match.job_request,
            match=match,
            status=status,
            amount=match.price_quote or Decimal("150.00"),
            payment_ref=f"PAY-{random.randint(100000, 999999)}",
            scheduled_at=scheduled_at,
            started_at=started_at,
            completed_at=completed_at
        )
        orders.append(order)

        # Update job status
        match.job_request.status = "ordered"
        match.job_request.save()

    print(f"  ✓ Created {len(orders)} orders")

    # Create reviews
    print("\n⭐ Creating reviews...")
    reviews = []

    completed_orders = [o for o in orders if o.status == "completed"]

    for order in completed_orders:
        # 80% chance of having a review
        if random.random() < 0.8:
            rating = random.choices(
                [5, 4, 3, 2, 1],
                weights=[50, 30, 10, 5, 5]  # Most reviews are positive
            )[0]

            review = Review.objects.create(
                order=order,
                rating=rating,
                comment=random.choice(REVIEW_COMMENTS) if rating >= 3 else "Service was okay, could be better.",
                is_public=True
            )
            reviews.append(review)

    print(f"  ✓ Created {len(reviews)} reviews")

    # Create chat messages
    print("\n💬 Creating chat messages...")
    messages = []

    for order in orders[:10]:  # Add messages to first 10 orders
        num_messages = random.randint(3, 10)

        for i in range(num_messages):
            # Alternate between customer and provider
            is_customer = i % 2 == 0
            sender = order.customer if is_customer else order.provider.user
            sender_type = "customer" if is_customer else "provider"

            message_texts = [
                "Hello! Looking forward to working with you.",
                "What time works best for you?",
                "I can be there at 2 PM.",
                "Sounds good!",
                "Do you have all the necessary tools?",
                "Yes, I'll bring everything needed.",
                "Great, see you then!",
                "On my way.",
                "I'm here!",
                "Thank you for your service!"
            ]

            message = Message.objects.create(
                order=order,
                sender=sender,
                sender_type=sender_type,
                text=message_texts[i % len(message_texts)],
                created_at=timezone.now() - timedelta(hours=random.randint(1, 72))
            )
            messages.append(message)

    print(f"  ✓ Created {len(messages)} chat messages")

    # Print summary
    print("\n" + "=" * 60)
    print("✅ SEED COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"  - Categories: {ServiceCategory.objects.count()}")
    print(f"  - Services: {Service.objects.count()}")
    print(f"  - Customer Users: {User.objects.filter(is_provider=False).count()}")
    print(f"  - Provider Users: {User.objects.filter(is_provider=True).count()}")
    print(f"  - Provider Profiles: {ProviderProfile.objects.count()}")
    print(f"  - Listings: {Listing.objects.count()}")
    print(f"  - Job Requests: {JobRequest.objects.count()}")
    print(f"  - Matches: {Match.objects.count()}")
    print(f"  - Orders: {Order.objects.count()}")
    print(f"  - Reviews: {Review.objects.count()}")
    print(f"  - Chat Messages: {Message.objects.count()}")

    print(f"\n🔑 Test Credentials:")
    print(f"\n  Demo User:")
    print(f"    Email: demo@stabix.com")
    print(f"    Password: demo123")
    print(f"\n  Customers:")
    print(f"    Email: customer1@stabix.com to customer10@stabix.com")
    print(f"    Password: customer123")
    print(f"\n  Providers:")
    print(f"    Email: provider1@stabix.com to provider20@stabix.com")
    print(f"    Password: provider123")

    print(f"\n🚀 Access the application:")
    print(f"  - Frontend: http://localhost:3000")
    print(f"  - Backend API: http://localhost:8000/api/")
    print(f"  - API Docs: http://localhost:8000/api/docs/")
    print()


if __name__ == "__main__":
    seed_data()
