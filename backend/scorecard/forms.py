from django import forms
from .models import GCEvent
from django.forms import DateTimeInput

# The frontend and leaderboard APIs look GCs up by these exact values
GENRE_CHOICES = [
    ('genre1', 'Software'),
    ('genre2', 'Hardware'),
    ('genre3', 'Pure Sciences'),
    ('genre4', 'Non Core'),
]


class gcAdminForm(forms.ModelForm):
    genre = forms.ChoiceField(choices=GENRE_CHOICES)

    class Meta:
        model = GCEvent
        fields = '__all__'


class gcForm(forms.ModelForm):
    genre = forms.ChoiceField(choices=GENRE_CHOICES)

    class Meta:
        model = GCEvent
        fields = '__all__'
        widgets = {
            'start_timeline': DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
            'end_timeline': DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
        }
