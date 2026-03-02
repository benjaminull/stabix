"""
Chat message serializers
"""

from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    """Message serializer"""

    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "order",
            "sender",
            "sender_email",
            "sender_type",
            "text",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "order", "sender", "sender_type", "created_at"]

    def create(self, validated_data):
        # Determine sender type based on order and sender
        order = validated_data["order"]
        sender = validated_data["sender"]

        if sender == order.customer:
            validated_data["sender_type"] = "customer"
        elif sender == order.provider.user:
            validated_data["sender_type"] = "provider"
        else:
            raise serializers.ValidationError("Sender must be either customer or provider")

        return super().create(validated_data)
