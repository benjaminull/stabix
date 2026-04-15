from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /api/notifications/
    Lista todas las notificaciones del usuario actual
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)

        # Filtro opcional por estado de lectura
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')

        return queryset


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """
    PATCH /api/notifications/{id}/read/
    Marca una notificación como leída
    """
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.mark_as_read()
    serializer = NotificationSerializer(notification)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """
    POST /api/notifications/mark-all-read/
    Marca todas las notificaciones como leídas
    """
    from django.utils import timezone

    updated_count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).update(
        is_read=True,
        read_at=timezone.now()
    )

    return Response({
        'message': f'{updated_count} notificaciones marcadas como leídas',
        'count': updated_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """
    GET /api/notifications/unread-count/
    Obtiene el número de notificaciones no leídas
    """
    count = Notification.objects.filter(
        user=request.user,
        is_read=False
    ).count()

    return Response({'unread_count': count})
