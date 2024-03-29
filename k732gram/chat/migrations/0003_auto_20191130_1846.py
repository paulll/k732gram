# Generated by Django 2.2.7 on 2019-11-30 18:46

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_auto_20191130_1842'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='img',
            field=models.ImageField(blank=True, null=True, upload_to=''),
        ),
        migrations.AlterField(
            model_name='message',
            name='read',
            field=models.ManyToManyField(blank=True, null=True, related_name='chat_message_readby', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='message',
            name='text',
            field=models.TextField(blank=True, null=True),
        ),
    ]
