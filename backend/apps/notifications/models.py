from django.db import models
from django.conf import settings


class Notification(models.Model):
    """
    Sistema de notificaciones para proveedores y clientes
    """
    NOTIFICATION_TYPES = [
        ('new_match', 'Nueva Solicitud de Trabajo'),
        ('match_accepted', 'Solicitud Aceptada'),
        ('match_rejected', 'Solicitud Rechazada'),
        ('order_created', 'Orden Creada'),
        ('order_updated', 'Orden Actualizada'),
        ('order_completed', 'Orden Completada'),
        ('new_message', 'Nuevo Mensaje'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.CharField(max_length=500, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    # Referencias opcionales
    match_id = models.IntegerField(blank=True, null=True)
    order_id = models.IntegerField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.title}"

    def mark_as_read(self):
        """Marcar notificación como leída"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
