import secrets

import requests
from django.conf import settings
from django.core.mail import send_mail


def generate_temp_password():
    return secrets.token_urlsafe(9)


def create_supabase_user(email, password, full_name=''):
    """Creates a confirmed Supabase auth user via the admin API. Returns the Supabase user id."""
    resp = requests.post(
        f"{settings.SUPABASE_URL}/auth/v1/admin/users",
        headers={
            'apikey': settings.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': f'Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}',
        },
        json={
            'email': email,
            'password': password,
            'email_confirm': True,
            'user_metadata': {'full_name': full_name},
        },
        timeout=10,
    )
    resp.raise_for_status()
    return resp.json()['id']


def send_temp_password_email(email, full_name, temp_password, role):
    send_mail(
        subject='Your TalentFlow account has been created',
        message=(
            f"Hi {full_name or email},\n\n"
            f"An account has been created for you on TalentFlow as {role}.\n\n"
            f"Login email: {email}\n"
            f"Temporary password: {temp_password}\n\n"
            f"Sign in at {settings.FRONTEND_URL}/login and you'll be asked to set a new "
            f"password on first login.\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
    )
