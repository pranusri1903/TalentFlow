from dateutil.relativedelta import relativedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Profile
from employees.models import Employee


class Command(BaseCommand):
    help = (
        'Reactivates accounts that were deactivated 6+ months ago, resetting them back to '
        'candidate so they can apply for jobs again. Intended to run on a daily schedule.'
    )

    def handle(self, **options):
        cutoff = timezone.now() - relativedelta(months=6)
        expired = Profile.objects.filter(is_active=False, deactivated_at__lte=cutoff)

        count = 0
        for profile in expired:
            Employee.objects.filter(profile=profile).delete()
            profile.role = Profile.CANDIDATE
            profile.is_active = True
            profile.deactivated_at = None
            profile.must_change_password = False
            profile.save()
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Reactivated {count} account(s) back to candidate.'))
