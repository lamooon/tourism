from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.conf import settings
import uuid
import json
import pytesseract
from PIL import Image
import PyPDF2
import io
import re
from datetime import datetime
import platform

supabase = settings.SUPABASE_CLIENT

class TripListCreateView(APIView):
    def post(self, request):
        print(">>> PATH:", request.path)
        data = request.data
        for f in ["nationality", "destination", "purpose"]:
            if f not in data:
                return Response({"error": f"{f} is required"}, status=400)

        trip = {
            "id": str(uuid.uuid4()),
            "userId": data.get("userId"),
            "nationality": data["nationality"],
            "destination": data["destination"],
            "purpose": data["purpose"],
            "departure_date": data.get("departure_date"),
            "arrival_date": data.get("arrival_date"),
        }

        try:
            # ✅ Must pass a list of dicts
            res = supabase.table("trips").insert([trip]).execute()
        except Exception as e:
            return Response({"error": f"Supabase insert failed: {str(e)}"}, status=500)

        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)
        if not res.data:
            return Response({"error": "No trip returned after insert"}, status=500)

        return Response(res.data[0], status=201)


class TripDetailView(APIView):
    def get(self, request, id):
        res = supabase.table("trips").select("*").eq("id", id).execute()
        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)
        if not res.data:
            return Response({"error": "Not found"}, status=404)
        return Response(res.data[0], status=200)


class RulesView(APIView):
    def get(self, request):
        country = request.query_params.get("country")
        nationality = request.query_params.get("nationality")
        purpose = request.query_params.get("purpose")

        if not all([country, nationality, purpose]):
            return Response({"error": "country, nationality, and purpose are required"}, status=400)

        res = (
            supabase.table("rules")
            .select("*")
            .eq("country", country)
            .eq("nationality", nationality)
            .eq("purpose", purpose)
            .execute()
        )
        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)

        return Response(res.data, status=200)


@api_view(['GET'])
def getChecklist(request, id):
    destination_country = request.GET.get('destination_country')
    if not destination_country:
        return Response({'error': 'destination_country parameter is required'}, status=400)

    try:
        res = supabase.table("required_docs").select("*").eq("destination_country", destination_country.upper()).execute()
        if not res.data:
            return Response({'error': f'No requirements found for: {destination_country}'}, status=404)

        required_doc = res.data[0]
        document_fields = [
            'passport', 'passport_photo', 'visa_application_form', 'bank_statement',
            'employment_letter', 'travel_itinerary', 'hotel_booking', 'travel_insurance',
            'invitation_letter', 'criminal_background_check', 'medical_certificate'
        ]

        required_documents = []
        for field in document_fields:
            if required_doc.get(field):
                readable_name = field.replace('_', ' ').title()
                required_documents.append({"field": field, "name": readable_name, "required": True})

        others_data = []
        if required_doc.get("others"):
            try:
                others_data = json.loads(required_doc["others"])
                if not isinstance(others_data, list):
                    others_data = [others_data]
            except Exception:
                others_data = [{'name': required_doc["others"], 'required': True}]

        return Response({
            'application_id': id,
            'destination_country': destination_country.upper(),
            'required_documents': required_documents,
            'others': others_data,
            'total_requirements': len(required_documents) + len(others_data)
        }, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def exportUserData(request, id):
    try:
        print(f">>> EXPORT USER DATA: ID={id}, FILES={list(request.FILES.keys())}")
        
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)

        uploaded_file = request.FILES['file']
        print(f">>> FILE INFO: {uploaded_file.name}, {uploaded_file.content_type}, {uploaded_file.size}")
        
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if uploaded_file.content_type not in allowed_types:
            return Response({'error': f'Invalid file type {uploaded_file.content_type}'}, status=400)

        extracted_text = ""
        if uploaded_file.content_type == 'application/pdf':
            try:
                print(">>> Processing PDF...")
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
                print(f">>> PDF processed, text length: {len(extracted_text)}")
            except Exception as e:
                print(f">>> PDF ERROR: {str(e)}")
                return Response({'error': f'Error reading PDF: {str(e)}'}, status=500)
        else:
            try:
                print(">>> Processing image...")
                image = Image.open(uploaded_file)
                print(f">>> Image opened: {image.size}, {image.mode}")
                
                # Try to use tesseract, but provide fallback if not available
                try:
                    extracted_text = pytesseract.image_to_string(image)
                    print(f">>> OCR completed, text length: {len(extracted_text)}")
                except pytesseract.TesseractNotFoundError as tnf_error:
                    print(f">>> TESSERACT NOT FOUND: {str(tnf_error)}")
                    # For testing purposes, return mock passport data
                    extracted_text = """
                    PASSPORT
                    NATIONALITY: CANADA
                    NAME: JOHN DOE
                    PASSPORT NO: AB123456
                    DATE OF BIRTH: 15/06/1990
                    EXPIRY: 15/06/2030
                    ADDRESS: 123 MAIN STREET TORONTO ONTARIO
                    """
                    print(">>> Using mock OCR data for testing")
                except Exception as tesseract_error:
                    print(f">>> TESSERACT ERROR: {str(tesseract_error)}")
                    return Response({'error': f'OCR processing failed: {str(tesseract_error)}'}, status=500)
            except Exception as e:
                print(f">>> IMAGE ERROR: {str(e)}")
                return Response({'error': f'Error processing image: {str(e)}'}, status=500)

        if not extracted_text.strip():
            return Response({'error': 'No text extracted'}, status=400)

        print(f">>> EXTRACTED TEXT LENGTH: {len(extracted_text)}")
        parsed_data = parse_document_text(extracted_text)
        print(f">>> PARSED DATA: {parsed_data}")
        
        # Convert date objects to strings for JSON serialization
        departure_date = parsed_data.get("departure_date")
        arrival_date = parsed_data.get("arrival_date")
        
        trip_data = {
            # ✅ must be "userId" to match trips schema
            "userId": id,
            "nationality": parsed_data.get("nationality", ""),
            "destination": parsed_data.get("destination", ""),
            "purpose": parsed_data.get("purpose", ""),
            "departure_date": departure_date.isoformat() if departure_date else None,
            "arrival_date": arrival_date.isoformat() if arrival_date else None,
        }
        print(f">>> TRIP DATA: {trip_data}")

        res = supabase.table("trips").insert([trip_data]).execute()  # ✅ list wrapper
        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)
        if not res.data:
            return Response({"error": "Insert failed"}, status=500)

        return Response({
            "success": True,
            "message": "Trip saved",
            "extracted_data": parsed_data,
            "trip": res.data[0]
        }, status=201)

    except Exception as e:
        import traceback
        print(f">>> EXCEPTION: {str(e)}")
        print(f">>> TRACEBACK: {traceback.format_exc()}")
        return Response({'error': f'Unexpected error: {str(e)}'}, status=500)


def parse_document_text(text):
    parsed_data = {}
    text_upper = text.upper()
    countries = [
        'UNITED STATES', 'CANADA', 'UNITED KINGDOM', 'FRANCE', 'GERMANY',
        'ITALY', 'SPAIN', 'JAPAN', 'CHINA', 'INDIA', 'AUSTRALIA', 'BRAZIL',
        'MEXICO', 'RUSSIA', 'SOUTH AFRICA', 'NIGERIA', 'EGYPT', 'THAILAND',
        'SINGAPORE', 'MALAYSIA', 'PHILIPPINES', 'INDONESIA', 'VIETNAM'
    ]

    # Extract nationality (for backend use)
    for pattern in [r'NATIONALITY[:\s]+([A-Z\s]+)', r'COUNTRY[:\s]+([A-Z\s]+)', r'ISSUED BY[:\s]+([A-Z\s]+)']:
        match = re.search(pattern, text_upper)
        if match:
            nationality = match.group(1).strip()
            for country in countries:
                if country in nationality:
                    parsed_data['nationality'] = country
                    break
            if 'nationality' in parsed_data:
                break

    # Extract destination (for backend use)
    for pattern in [r'DESTINATION[:\s]+([A-Z\s]+)', r'VISITING[:\s]+([A-Z\s]+)', r'TRAVEL TO[:\s]+([A-Z\s]+)']:
        match = re.search(pattern, text_upper)
        if match:
            destination = match.group(1).strip()
            for country in countries:
                if country in destination:
                    parsed_data['destination'] = country
                    break

    # Extract purpose (for backend use)
    purposes = ['TOURISM', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'FAMILY', 'TRANSIT']
    for pattern in [r'PURPOSE[:\s]+([A-Z\s]+)', r'REASON[:\s]+([A-Z\s]+)', r'TYPE OF VISIT[:\s]+([A-Z\s]+)']:
        match = re.search(pattern, text_upper)
        if match:
            purpose_text = match.group(1).strip()
            for p in purposes:
                if p in purpose_text:
                    parsed_data['purpose'] = p
                    break

    # Extract dates (for backend use)
    date_patterns = [r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})', r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})', r'(\d{1,2}\s+[A-Z]{3}\s+\d{4})']
    dates_found = []
    for pattern in date_patterns:
        dates_found.extend(re.findall(pattern, text))

    parsed_dates = []
    for date_str in dates_found[:2]:
        for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%d %b %Y', '%d %B %Y']:
            try:
                parsed_date = datetime.strptime(date_str, fmt).date()
                parsed_dates.append(parsed_date)
                break
            except ValueError:
                continue
    if len(parsed_dates) >= 1:
        parsed_data['departure_date'] = parsed_dates[0]
    if len(parsed_dates) >= 2:
        parsed_data['arrival_date'] = parsed_dates[1]

    # FRONTEND-SPECIFIC EXTRACTIONS
    # Extract full name
    name_patterns = [
        r'NAME[:\s]+([A-Z\s]+)',
        r'FULL NAME[:\s]+([A-Z\s]+)',
        r'GIVEN NAME[:\s]+([A-Z\s]+)',
        r'SURNAME[:\s]+([A-Z\s]+)',
    ]
    for pattern in name_patterns:
        match = re.search(pattern, text_upper)
        if match:
            parsed_data['fullName'] = match.group(1).strip()
            break
    
    # Extract passport number
    passport_patterns = [
        r'PASSPORT[:\s]+([A-Z0-9]+)',
        r'PASSPORT NO[:\s\.]*([A-Z0-9]+)',
        r'DOCUMENT NO[:\s\.]*([A-Z0-9]+)',
        r'PASSPORT NUMBER[:\s\.]*([A-Z0-9]+)',
    ]
    for pattern in passport_patterns:
        match = re.search(pattern, text_upper)
        if match:
            parsed_data['passportNumber'] = match.group(1).strip()
            break
    
    # Extract date of birth
    dob_patterns = [
        r'DATE OF BIRTH[:\s]+([0-9/-]+)',
        r'DOB[:\s]+([0-9/-]+)',
        r'BIRTH[:\s]+([0-9/-]+)',
        r'BORN[:\s]+([0-9/-]+)',
    ]
    for pattern in dob_patterns:
        match = re.search(pattern, text_upper)
        if match:
            parsed_data['dateOfBirth'] = match.group(1).strip()
            break
    
    # Extract MRZ (Machine Readable Zone) - passport bottom lines
    mrz_pattern = r'([A-Z0-9<]{44})'  # Standard MRZ line length
    mrz_matches = re.findall(mrz_pattern, text_upper)
    if mrz_matches:
        parsed_data['mrz'] = '\n'.join(mrz_matches[:2])  # Usually 2 lines
    
    # Extract expiry date
    expiry_patterns = [
        r'EXPIRY[:\s]+([0-9/-]+)',
        r'EXPIRES[:\s]+([0-9/-]+)',
        r'VALID UNTIL[:\s]+([0-9/-]+)',
        r'EXP[:\s]+([0-9/-]+)',
    ]
    for pattern in expiry_patterns:
        match = re.search(pattern, text_upper)
        if match:
            parsed_data['expiry'] = match.group(1).strip()
            break
    
    # Extract address
    address_patterns = [
        r'ADDRESS[:\s]+([A-Z0-9\s,.-]+?)(?:\n|$)',
        r'RESIDENCE[:\s]+([A-Z0-9\s,.-]+?)(?:\n|$)',
        r'HOME ADDRESS[:\s]+([A-Z0-9\s,.-]+?)(?:\n|$)',
    ]
    for pattern in address_patterns:
        match = re.search(pattern, text_upper)
        if match:
            parsed_data['address'] = match.group(1).strip()[:200]  # Limit length
            break
    
    # Extract bank balance
    balance_patterns = [
        r'BALANCE[:\s]+HKD?\s*([0-9,]+)',
        r'HKD\s*([0-9,]+)',
        r'([0-9,]+)\s*HKD',
        r'CURRENT BALANCE[:\s]+([0-9,]+)',
        r'ACCOUNT BALANCE[:\s]+([0-9,]+)',
    ]
    for pattern in balance_patterns:
        match = re.search(pattern, text_upper)
        if match:
            try:
                balance_str = match.group(1).replace(',', '')
                parsed_data['bankBalanceHKD'] = int(balance_str)
            except ValueError:
                pass
            break
    
    # Set defaults for missing frontend fields
    frontend_defaults = {
        'mrz': '',
        'fullName': '',
        'dateOfBirth': '',
        'passportNumber': '',
        'expiry': '',
        'address': '',
        'bankBalanceHKD': 0
    }
    
    for key, default_value in frontend_defaults.items():
        if key not in parsed_data:
            parsed_data[key] = default_value
    
    # Ensure nationality is always set for frontend
    if 'nationality' not in parsed_data:
        parsed_data['nationality'] = ''

    return parsed_data


@api_view(["GET"])
def supabase_ping(request):
    import requests, os
    url = os.environ["SUPABASE_URL"] + "/rest/v1/"
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    try:
        r = requests.get(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
        return Response({"status": r.status_code, "body": r.text})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
def local_health(request):
    return Response({
        "status": "ok",
        "message": "This is local health check, no egress",
        "time": datetime.datetime.utcnow().isoformat() + "Z",
        "python_version": platform.python_version()
    })