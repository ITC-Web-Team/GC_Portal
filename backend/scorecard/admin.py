from django.contrib import admin
from .models import GCEvent,Hostel,Score
from .forms import gcAdminForm
# Register your models here.


@admin.register(GCEvent)
class GCEventAdmin(admin.ModelAdmin):
    form = gcAdminForm
    list_display = ('name', 'genre', 'club', 'prep')


admin.site.register(Hostel)
admin.site.register(Score)
