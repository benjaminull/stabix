"""
Production settings
"""

import os

from .base import *  # noqa

DEBUG = False

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

# CORS settings
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
CORS_ALLOW_CREDENTIALS = True

# Security settings
# SSL redirect solo si tienes HTTPS configurado
SECURE_SSL_REDIRECT = os.getenv("ENABLE_SSL", "False") == "True"
SESSION_COOKIE_SECURE = os.getenv("ENABLE_SSL", "False") == "True"
CSRF_COOKIE_SECURE = os.getenv("ENABLE_SSL", "False") == "True"
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
# HSTS solo con SSL
if os.getenv("ENABLE_SSL", "False") == "True":
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = "DENY"

# Email backend for production
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "noreply@stabix.com")

# Logging for production
LOGGING["handlers"]["file"] = {  # noqa
    "level": "ERROR",
    "class": "logging.handlers.RotatingFileHandler",
    "filename": BASE_DIR / "logs" / "django.log",  # noqa
    "maxBytes": 1024 * 1024 * 10,  # 10MB
    "backupCount": 5,
    "formatter": "verbose",
}

LOGGING["root"]["handlers"].append("file")  # noqa
