from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import RequiredDocs, Trips  # Add Trips import
import json
import pytesseract
from PIL import Image
import PyPDF2
import io
import re
from datetime import datetime
import tempfile
import os


@api_view(['GET'])
def getChecklist(request, id):
    '''
    Request includes a destination_country field.

    Look up the supabase table called required_docs for the row with destination_country == request.destination_country
    return all elements with value True and the value of the others column.
    '''
    
    # Get destination_country from query parameters
    destination_country = request.GET.get('destination_country')
    
    if not destination_country:
        return Response(
            {'error': 'destination_country parameter is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Query the required_docs table for the specified country
        required_doc = RequiredDocs.objects.get(destination_country=destination_country.upper())
        
        # Get all boolean fields that are True
        required_documents = []
        
        # Define the document fields to check
        document_fields = [
            'passport', 'passport_photo', 'visa_application_form', 'bank_statement',
            'employment_letter', 'travel_itinerary', 'hotel_booking', 'travel_insurance',
            'invitation_letter', 'criminal_background_check', 'medical_certificate'
        ]
        
        # Check each field and add to required_documents if True
        for field in document_fields:
            if getattr(required_doc, field):
                # Convert field name to readable format
                readable_name = field.replace('_', ' ').title()
                required_documents.append({
                    'field': field,
                    'name': readable_name,
                    'required': True
                })
        
        # Parse others field if it exists
        others_data = []
        if required_doc.others:
            try:
                others_data = json.loads(required_doc.others)
                if not isinstance(others_data, list):
                    others_data = [others_data]
            except json.JSONDecodeError:
                # If others is not valid JSON, treat as plain text
                others_data = [{'name': required_doc.others, 'required': True}]
        
        response_data = {
            'application_id': id,
            'destination_country': destination_country.upper(),
            'required_documents': required_documents,
            'others': others_data,
            'total_requirements': len(required_documents) + len(others_data)
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except RequiredDocs.DoesNotExist:
        return Response(
            {'error': f'No requirements found for country: {destination_country}'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def exportUserData(request, id):
    '''
    Request contains a file that is either PDF, JPG, or PNG.

    We want to use OCR to extract text from the file and autofill in the form details as required.
    We then want to save this extracted form data to the database called trips.
    '''
    
    try:
        # Check if file is provided
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided. Please upload a PDF, JPG, or PNG file.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if uploaded_file.content_type not in allowed_types:
            return Response(
                {'error': f'Invalid file type: {uploaded_file.content_type}. Only PDF, JPG, and PNG files are allowed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract text using OCR
        extracted_text = ""
        
        if uploaded_file.content_type == 'application/pdf':
            # Handle PDF files
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text.strip():  # If text extraction worked
                        extracted_text += page_text + "\n"
                    else:  # If no text, try OCR on PDF (requires pdf2image)  
                        # For now, we'll just use the extracted text
                        pass
            except Exception as e:
                return Response(
                    {'error': f'Error processing PDF file: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            # Handle image files (JPG, PNG)
            try:
                image = Image.open(uploaded_file)
                extracted_text = pytesseract.image_to_string(image)
            except Exception as e:
                return Response(
                    {'error': f'Error processing image file: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        if not extracted_text.strip():
            return Response(
                {'error': 'No text could be extracted from the file. Please ensure the file contains readable text.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse extracted text to extract relevant information
        parsed_data = parse_document_text(extracted_text)
        
        # Create trip record in database
        trip_data = {
            'user_id': id,
            'nationality': parsed_data.get('nationality', ''),
            'destination': parsed_data.get('destination', ''),
            'purpose': parsed_data.get('purpose', ''),
            'departure_date': parsed_data.get('departure_date'),
            'arrival_date': parsed_data.get('arrival_date')
        }
        
        # Remove empty fields to avoid database errors
        trip_data = {k: v for k, v in trip_data.items() if v}
        
        # Save to database
        trip = Trips.objects.create(**trip_data)
        
        return Response({
            'success': True,
            'message': 'Document processed successfully and trip data saved.',
            'extracted_data': parsed_data,
            'trip_id': trip.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': f'An unexpected error occurred: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def parse_document_text(text):
    """
    Parse extracted text to identify relevant trip information
    """
    parsed_data = {}
    text_upper = text.upper()
    
    # Common country names and nationality patterns
    countries = [
        'UNITED STATES', 'CANADA', 'UNITED KINGDOM', 'FRANCE', 'GERMANY', 
        'ITALY', 'SPAIN', 'JAPAN', 'CHINA', 'INDIA', 'AUSTRALIA', 'BRAZIL',
        'MEXICO', 'RUSSIA', 'SOUTH AFRICA', 'NIGERIA', 'EGYPT', 'THAILAND',
        'SINGAPORE', 'MALAYSIA', 'PHILIPPINES', 'INDONESIA', 'VIETNAM'
    ]
    
    # Extract nationality (from passport)
    nationality_patterns = [
        r'NATIONALITY[:\s]+([A-Z\s]+)',
        r'COUNTRY[:\s]+([A-Z\s]+)',
        r'ISSUED BY[:\s]+([A-Z\s]+)'
    ]
    
    for pattern in nationality_patterns:
        match = re.search(pattern, text_upper)
        if match:
            nationality = match.group(1).strip()
            for country in countries:
                if country in nationality:
                    parsed_data['nationality'] = country
                    break
            if 'nationality' in parsed_data:
                break
    
    # Extract destination (look for common destination indicators)
    destination_patterns = [
        r'DESTINATION[:\s]+([A-Z\s]+)',
        r'VISITING[:\s]+([A-Z\s]+)',
        r'TRAVEL TO[:\s]+([A-Z\s]+)'
    ]
    
    for pattern in destination_patterns:
        match = re.search(pattern, text_upper)
        if match:
            destination = match.group(1).strip()
            for country in countries:
                if country in destination:
                    parsed_data['destination'] = country
                    break
    
    # Extract purpose (common travel purposes)
    purposes = ['TOURISM', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'FAMILY', 'TRANSIT']
    purpose_patterns = [
        r'PURPOSE[:\s]+([A-Z\s]+)',
        r'REASON[:\s]+([A-Z\s]+)',
        r'TYPE OF VISIT[:\s]+([A-Z\s]+)'
    ]
    
    for pattern in purpose_patterns:
        match = re.search(pattern, text_upper)
        if match:
            purpose_text = match.group(1).strip()
            for purpose in purposes:
                if purpose in purpose_text:
                    parsed_data['purpose'] = purpose
                    break
    
    # Extract dates (multiple formats)
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',  # MM/DD/YYYY or DD/MM/YYYY
        r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',  # YYYY/MM/DD
        r'(\d{1,2}\s+[A-Z]{3}\s+\d{4})',   # DD MMM YYYY
    ]
    
    dates_found = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        dates_found.extend(matches)
    
    # Try to parse and assign dates
    parsed_dates = []
    for date_str in dates_found[:2]:  # Take first two dates found
        try:
            # Try different date formats
            for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%d %b %Y', '%d %B %Y']:
                try:
                    parsed_date = datetime.strptime(date_str, fmt).date()
                    parsed_dates.append(parsed_date)
                    break
                except ValueError:
                    continue
        except:
            continue
    
    # Assign dates (assuming first is departure, second is arrival)
    if len(parsed_dates) >= 1:
        parsed_data['departure_date'] = parsed_dates[0]
    if len(parsed_dates) >= 2:
        parsed_data['arrival_date'] = parsed_dates[1]
    
    return parsed_data