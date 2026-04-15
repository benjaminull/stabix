from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'action_url',
            'is_read',
            'read_at',
            'created_at',
            'match_id',
            'order_id',
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
