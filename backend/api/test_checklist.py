#!/usr/bin/env python3
"""
Simple test script for the getChecklist API endpoint.
This script creates sample data and tests the API functionality.
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import RequiredDocs
import json

def create_sample_data():
    """Create sample data for testing."""
    
    # Sample data for United States (US)
    us_data = RequiredDocs.objects.get_or_create(
        destination_country='US',
        defaults={
            'passport': True,
            'passport_photo': True,
            'visa_application_form': True,
            'bank_statement': True,
            'employment_letter': True,
            'travel_itinerary': True,
            'hotel_booking': False,
            'travel_insurance': False,
            'invitation_letter': False,
            'financial_proof': True,
            'criminal_background_check': False,
            'medical_certificate': False,
            'others': json.dumps([
                {'name': 'DS-160 Form', 'required': True},
                {'name': 'Interview Appointment', 'required': True}
            ])
        }
    )
    
    # Sample data for United Kingdom (GB)
    uk_data = RequiredDocs.objects.get_or_create(
        destination_country='GB',
        defaults={
            'passport': True,
            'passport_photo': True,
            'visa_application_form': True,
            'bank_statement': True,
            'employment_letter': True,
            'travel_itinerary': False,
            'hotel_booking': True,
            'travel_insurance': True,
            'invitation_letter': False,
            'financial_proof': True,
            'criminal_background_check': False,
            'medical_certificate': False,
            'others': json.dumps([
                {'name': 'Tuberculosis Test', 'required': True},
                {'name': 'Biometric Information', 'required': True}
            ])
        }
    )
    
    print("Sample data created successfully!")
    print(f"US data: {us_data}")
    print(f"UK data: {uk_data}")

def test_api_endpoint():
    """Test the API endpoint with sample requests."""
    from django.test import Client
    from django.urls import reverse
    
    client = Client()
    
    # Test 1: Valid request for US
    print("\n=== Testing US requirements ===")
    response = client.get('/api/application/123/checklist?destination_country=US')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"Error: {response.content}")
    
    # Test 2: Valid request for GB
    print("\n=== Testing UK requirements ===")
    response = client.get('/api/application/456/checklist?destination_country=GB')
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"Error: {response.content}")
    
    # Test 3: Missing destination_country parameter
    print("\n=== Testing missing parameter ===")
    response = client.get('/api/application/789/checklist')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 4: Invalid country code
    print("\n=== Testing invalid country ===")
    response = client.get('/api/application/999/checklist?destination_country=XX')
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == '__main__':
    print("Creating sample data...")
    create_sample_data()
    
    print("\nTesting API endpoint...")
    test_api_endpoint()
    
    print("\nTest completed!")