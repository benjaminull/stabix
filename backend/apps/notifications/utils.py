"""
Utilidades para crear notificaciones de manera fácil
"""
from .models import Notification


def create_notification(user, notification_type, title, message, action_url=None, match_id=None, order_id=None):
    """
    Crea una nueva notificación para un usuario

    Args:
        user: Usuario que recibirá la notificación
        notification_type: Tipo de notificación (ver Notification.NOTIFICATION_TYPES)
        title: Título de la notificación
        message: Mensaje de la notificación
        action_url: URL opcional para la acción
        match_id: ID del match relacionado (opcional)
        order_id: ID de la orden relacionada (opcional)

    Returns:
        Notification: La notificación creada
    """
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        match_id=match_id,
        order_id=order_id,
    )


def notify_new_match(provider, match):
    """Notifica al proveedor sobre un nuevo match"""
    return create_notification(
        user=provider.user,
        notification_type='new_match',
        title='Nueva solicitud de trabajo',
        message=f'Tienes una nueva solicitud para {match.job_request.service.name}',
        action_url=f'/provider/matches/{match.id}',
        match_id=match.id,
    )


def notify_match_accepted(customer, match):
    """Notifica al cliente que su solicitud fue aceptada"""
    return create_notification(
        user=customer,
        notification_type='match_accepted',
        title='Solicitud aceptada',
        message=f'{match.provider.user.get_full_name() or "Un proveedor"} aceptó tu solicitud',
        action_url=f'/jobs/{match.job_request.id}',
        match_id=match.id,
    )


def notify_match_rejected(customer, match):
    """Notifica al cliente que su solicitud fue rechazada"""
    return create_notification(
        user=customer,
        notification_type='match_rejected',
        title='Solicitud rechazada',
        message=f'Tu solicitud para {match.job_request.service.name} no está disponible',
        action_url=f'/jobs/{match.job_request.id}',
        match_id=match.id,
    )


def notify_order_created(provider, order):
    """Notifica al proveedor sobre una nueva orden"""
    return create_notification(
        user=provider.user,
        notification_type='order_created',
        title='Nueva orden creada',
        message=f'Se creó una nueva orden por ${order.amount}',
        action_url=f'/provider/orders/{order.id}',
        order_id=order.id,
    )


def notify_order_updated(user, order, status_message):
    """Notifica sobre actualización de orden"""
    return create_notification(
        user=user,
        notification_type='order_updated',
        title='Orden actualizada',
        message=status_message,
        action_url=f'/orders/{order.id}',
        order_id=order.id,
    )


def notify_order_completed(customer, order):
    """Notifica al cliente que la orden fue completada"""
    return create_notification(
        user=customer,
        notification_type='order_completed',
        title='Orden completada',
        message='Tu orden ha sido completada. Por favor, deja una reseña',
        action_url=f'/orders/{order.id}',
        order_id=order.id,
    )


def notify_new_message(recipient, order):
    """Notifica sobre un nuevo mensaje"""
    return create_notification(
        user=recipient,
        notification_type='new_message',
        title='Nuevo mensaje',
        message='Tienes un nuevo mensaje en tu orden',
        action_url=f'/orders/{order.id}/chat',
        order_id=order.id,
    )
