"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os, sys
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

try:
    application = get_wsgi_application()
    print("✅ WSGI Loaded successfully", file=sys.stderr)
except Exception as e:
    print(f"❌ WSGI failed: {e}", file=sys.stderr)
    raise