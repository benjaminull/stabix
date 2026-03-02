"""
Chat/messaging models
"""

from django.db import models

from apps.common.models import TimestampedModel


class Message(TimestampedModel):
    """
    Chat message between customer and provider for an order
    """

    SENDER_TYPE_CHOICES = [
        ("customer", "Customer"),
        ("provider", "Provider"),
    ]

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="sent_messages")
    sender_type = models.CharField(max_length=20, choices=SENDER_TYPE_CHOICES)
    text = models.TextField()
    is_read = models.BooleanField(default=False)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["order", "created_at"]),
            models.Index(fields=["sender", "created_at"]),
            models.Index(fields=["order", "is_read"]),
        ]

    def __str__(self):
        return f"Message from {self.sender.email} on Order #{self.order.id}"
