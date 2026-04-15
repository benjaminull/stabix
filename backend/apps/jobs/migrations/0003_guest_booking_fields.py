# Generated manually for guest booking support

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0002_initial'),
        ('users', '0001_initial'),
        ('listings', '0001_initial'),
    ]

    operations = [
        # Make user nullable
        migrations.AlterField(
            model_name='jobrequest',
            name='user',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='job_requests',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Guest contact fields
        migrations.AddField(
            model_name='jobrequest',
            name='guest_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='jobrequest',
            name='guest_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='jobrequest',
            name='guest_phone',
            field=models.CharField(blank=True, max_length=20),
        ),
        # Direct booking fields
        migrations.AddField(
            model_name='jobrequest',
            name='target_provider',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='direct_requests',
                to='users.providerprofile',
            ),
        ),
        migrations.AddField(
            model_name='jobrequest',
            name='target_listing',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='listings.listing',
            ),
        ),
        migrations.AddField(
            model_name='jobrequest',
            name='preferred_time_slot',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
