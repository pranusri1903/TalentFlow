import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Profile


class SupabaseAuthentication(BaseAuthentication):
    """Verifies a Supabase-issued JWT and syncs it to a local Profile."""

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated',
            )
        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(f'Invalid token: {exc}')

        supabase_uid = payload['sub']
        email = payload.get('email', '')
        full_name = (payload.get('user_metadata') or {}).get('full_name', '')

        profile, created = Profile.objects.get_or_create(
            supabase_uid=supabase_uid,
            defaults={'email': email, 'full_name': full_name},
        )
        if not created and profile.email != email:
            profile.email = email
            profile.save(update_fields=['email'])

        if not profile.is_active:
            raise AuthenticationFailed('Account is deactivated.')

        return (profile, token)
