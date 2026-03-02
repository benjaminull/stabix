"""
Local development settings
"""

import os

from .base import *  # noqa

DEBUG = os.getenv("DEBUG", "1") == "1"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# CORS settings for local development
CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8000",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# Additional debug tools for local development
if DEBUG:
    INSTALLED_APPS += [  # noqa
        "django.contrib.postgres",
    ]

# Disable some security features for local development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
