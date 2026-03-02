"""
Custom permissions for users app
"""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.user == request.user


class IsProvider(permissions.BasePermission):
    """
    Permission to only allow providers.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_provider
