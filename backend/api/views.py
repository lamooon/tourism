from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import uuid

supabase = settings.SUPABASE_CLIENT


class TripListCreateView(APIView):
    def post(self, request):
        data = request.data
        required = ["nationality", "destination", "purpose"]
        for f in required:
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

        res = supabase.table("trips").insert(trip).execute()

        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)

        if not hasattr(res, "data") or not res.data:
            return Response(
                {"error": "No trip returned after insert"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(res.data[0], status=status.HTTP_201_CREATED)


class TripDetailView(APIView):
    """
    GET /trips/<id>/ → fetch single trip
    """

    def get(self, request, id):
        res = supabase.table("trips").select("*").eq("id", id).execute()

        if hasattr(res, "error") and res.error:
            return Response({"error": str(res.error)}, status=500)

        if not res.data:
            return Response({"error": "Not found"}, status=404)

        return Response(res.data[0], status=200)


class RulesView(APIView):
    """
    GET /rules?country=JP&nationality=HKG&purpose=tourist
    """

    def get(self, request):
        country = request.query_params.get("country")
        nationality = request.query_params.get("nationality")
        purpose = request.query_params.get("purpose")

        if not all([country, nationality, purpose]):
            return Response(
                {"error": "country, nationality, and purpose are required"},
                status=400,
            )

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