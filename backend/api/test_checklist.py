#!/usr/bin/env python3
"""
Simple test script for the getChecklist API endpoint.
This script creates sample data and tests the API functionality.
Now updated to safely handle non-JSON responses.
"""

import os
import sys
import django
from django.conf import settings
import json

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

supabase = settings.SUPABASE_CLIENT


def create_sample_data():
    """Insert sample data into Supabase required_docs table."""
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

    print("✅ Sample data inserted via Supabase!")
    print("US data:", us_data.data)
    print("UK data:", uk_data.data)


def print_response(label, response):
    """Helper to safely print API responses."""
    print(f"\n=== {label} ===")
    print("Status Code:", response.status_code)
    ctype = response.headers.get("Content-Type", "")
    if "application/json" in ctype:
        try:
            print("Response:", json.dumps(response.json(), indent=2))
        except Exception as e:
            print("⚠️ Error parsing JSON:", str(e))
            print("Raw content:", response.content.decode())
    else:
        print("⚠️ Non-JSON response (Content-Type:", ctype, ")")
        print("Raw content:", response.content.decode())


def test_api_endpoint():
    """Test the API endpoint with sample requests."""
    from django.test import Client
    client = Client()

    # Test 1: Valid request for US
    resp = client.get('/api/application/123/checklist?destination_country=US')
    print_response("Testing US requirements", resp)

    # Test 2: Valid request for GB
    resp = client.get('/api/application/456/checklist?destination_country=GB')
    print_response("Testing UK requirements", resp)

    # Test 3: Missing parameter
    resp = client.get('/api/application/789/checklist')
    print_response("Testing missing parameter", resp)

    # Test 4: Invalid country
    resp = client.get('/api/application/999/checklist?destination_country=XX')
    print_response("Testing invalid country", resp)


if __name__ == '__main__':
    print("Creating sample data...")
    create_sample_data()

    print("\nTesting API endpoint...")
    test_api_endpoint()

    print("\n✅ Test completed!")