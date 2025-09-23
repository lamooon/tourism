from django.db import models

# Create your models here.

class RequiredDocs(models.Model):
    """
    Model representing required documents for visa applications by destination country.
    Maps to the 'required_docs' table in Supabase.
    """
    destination_country = models.CharField(max_length=2, unique=True, help_text="Country code (ISO 3166-1 alpha-2)")
    
    # Document requirements - boolean fields for each document type
    passport = models.BooleanField(default=False)   #done
    passport_photo = models.BooleanField(default=False)   #done
    visa_application_form = models.BooleanField(default=False)   #done
    bank_statement = models.BooleanField(default=False)   #done
    employment_letter = models.BooleanField(default=False)   #done
    travel_itinerary = models.BooleanField(default=False)   #done
    hotel_booking = models.BooleanField(default=False)  #done
    travel_insurance = models.BooleanField(default=False)   #done
    invitation_letter = models.BooleanField(default=False)  #done
    criminal_background_check = models.BooleanField(default=False)
    medical_certificate = models.BooleanField(default=False)
    
    # Additional requirements stored as JSON text
    others = models.TextField(blank=True, null=True, help_text="Additional requirements in JSON format")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'required_docs'
        verbose_name = 'Required Document'
        verbose_name_plural = 'Required Documents'
    
    def __str__(self):
        return f"Required docs for {self.destination_country}"

class Trips(models.Model):
    nationality = models.CharField(max_length=100, blank=True)
    destination = models.CharField(max_length=100, blank=True)
    purpose = models.CharField(max_length=100, blank=True)
    departure_date = models.DateField(null=True, blank=True)
    arrival_date = models.DateField(null=True, blank=True)
    user_id = models.IntegerField()  # Foreign key relation with users table
    
    class Meta:
        db_table = 'trips'  # Match your Supabase table name