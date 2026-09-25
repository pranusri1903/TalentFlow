from functools import lru_cache

import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Profile


@lru_cache
def _jwk_client():
    return jwt.PyJWKClient(f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json")


class SupabaseAuthentication(BaseAuthentication):
    """Verifies a Supabase-issued JWT (via Supabase's public JWKS) and syncs it to a local Profile."""

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1]
        try:
            signing_key = _jwk_client().get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256', 'ES256'],
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
