# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0003_add_estimated_duration_to_listing'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listing',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
