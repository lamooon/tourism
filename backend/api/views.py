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
from rest_framework.response import Response
import platform, datetime

supabase = settings.SUPABASE_CLIENT

class TripListCreateView(APIView):
    def post(self, request):
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
            res = supabase.table("trips").insert(trip).execute()
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
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=400)

        uploaded_file = request.FILES['file']
        allowed_types = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if uploaded_file.content_type not in allowed_types:
            return Response({'error': f'Invalid file type {uploaded_file.content_type}'}, status=400)

        extracted_text = ""
        if uploaded_file.content_type == 'application/pdf':
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(uploaded_file.read()))
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
            except Exception as e:
                return Response({'error': f'Error reading PDF: {str(e)}'}, status=500)
        else:
            try:
                image = Image.open(uploaded_file)
                extracted_text = pytesseract.image_to_string(image)
            except Exception as e:
                return Response({'error': f'Error processing image: {str(e)}'}, status=500)

        if not extracted_text.strip():
            return Response({'error': 'No text extracted'}, status=400)

        parsed_data = parse_document_text(extracted_text)
        trip_data = {
            "user_id": id,
            "nationality": parsed_data.get("nationality", ""),
            "destination": parsed_data.get("destination", ""),
            "purpose": parsed_data.get("purpose", ""),
            "departure_date": parsed_data.get("departure_date"),
            "arrival_date": parsed_data.get("arrival_date"),
        }
        res = supabase.table("trips").insert(trip_data).execute()
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

    for pattern in [r'DESTINATION[:\s]+([A-Z\s]+)', r'VISITING[:\s]+([A-Z\s]+)', r'TRAVEL TO[:\s]+([A-Z\s]+)']:
        match = re.search(pattern, text_upper)
        if match:
            destination = match.group(1).strip()
            for country in countries:
                if country in destination:
                    parsed_data['destination'] = country
                    break

    purposes = ['TOURISM', 'BUSINESS', 'EDUCATION', 'MEDICAL', 'FAMILY', 'TRANSIT']
    for pattern in [r'PURPOSE[:\s]+([A-Z\s]+)', r'REASON[:\s]+([A-Z\s]+)', r'TYPE OF VISIT[:\s]+([A-Z\s]+)']:
        match = re.search(pattern, text_upper)
        if match:
            purpose_text = match.group(1).strip()
            for p in purposes:
                if p in purpose_text:
                    parsed_data['purpose'] = p
                    break

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