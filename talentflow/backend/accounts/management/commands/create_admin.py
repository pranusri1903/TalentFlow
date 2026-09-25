from django.core.management.base import BaseCommand

from accounts.models import Profile
from accounts.services import create_supabase_user, generate_temp_password


class Command(BaseCommand):
    help = 'Creates the first TalentFlow admin account (bootstrap). Prints the temporary password.'

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument('--full-name', default='')

    def handle(self, email, full_name, **options):
        if Profile.objects.filter(email=email).exists():
            self.stderr.write(f'A profile for {email} already exists.')
            return

        temp_password = generate_temp_password()
        supabase_uid = create_supabase_user(email, temp_password, full_name)
        Profile.objects.create(
            supabase_uid=supabase_uid,
            email=email,
            full_name=full_name,
            role=Profile.ADMIN,
            must_change_password=True,
        )
        self.stdout.write(self.style.SUCCESS(f'Admin created: {email}'))
        self.stdout.write(f'Temporary password: {temp_password}')
