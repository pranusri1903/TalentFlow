import re

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/recruitment/', include('recruitment.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/projects/', include('projectmgmt.urls')),
]

# Served by Django itself even outside DEBUG — this app has no separate reverse proxy/CDN
# in front of it, so without this, uploaded resumes have no route at all in production.
# (django.conf.urls.static.static() won't do here — it's hardcoded to no-op unless DEBUG=True.)
urlpatterns += [
    re_path(r'^%s(?P<path>.*)$' % re.escape(settings.MEDIA_URL.lstrip('/')), serve, {'document_root': settings.MEDIA_ROOT}),
]
