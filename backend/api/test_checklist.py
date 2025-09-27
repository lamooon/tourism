#!/usr/bin/env python3
"""
Simple test script for the getChecklist API endpoint.
This script creates sample data and tests the API functionality.
"""
import os
import sys
import django
import json
from django.conf import settings
from supabase import create_client

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

supabase = settings.SUPABASE_CLIENT

def create_sample_data():
    """Insert sample data via Supabase."""
    us_data = supabase.table("required_docs").upsert({
        "destination_country": "US",
        "passport": True,
        "passport_photo": True,
        "visa_application_form": True,
        "bank_statement": True,
        "employment_letter": True,
        "travel_itinerary": True,
        "others": json.dumps([
            {'name': 'DS-160 Form', 'required': True},
            {'name': 'Interview Appointment', 'required': True}
        ])
    }).execute()

    uk_data = supabase.table("required_docs").upsert({
        "destination_country": "GB",
        "passport": True,
        "passport_photo": True,
        "visa_application_form": True,
        "bank_statement": True,
        "employment_letter": True,
        "hotel_booking": True,
        "travel_insurance": True,
        "others": json.dumps([
            {'name': 'Tuberculosis Test', 'required': True},
            {'name': 'Biometric Information', 'required': True}
        ])
    }).execute()

    print("Sample data inserted via Supabase!")
    print(us_data.data)
    print(uk_data.data)


def test_api_endpoint():
    from django.test import Client
    client = Client()

    print("\n=== Testing US requirements ===")
    response = client.get('/api/application/123/checklist?destination_country=US')
    print(response.status_code, response.json())

    print("\n=== Testing UK requirements ===")
    response = client.get('/api/application/456/checklist?destination_country=GB')
    print(response.status_code, response.json())

    print("\n=== Missing parameter ===")
    response = client.get('/api/application/789/checklist')
    print(response.status_code, response.json())

    print("\n=== Invalid country ===")
    response = client.get('/api/application/999/checklist?destination_country=XX')
    print(response.status_code, response.json())


if __name__ == '__main__':
    print("Creating sample data...")
    create_sample_data()
    print("Running API tests...")
    test_api_endpoint()