"""
Custom exceptions for the Stabix backend.
"""

from rest_framework.exceptions import APIException


class InvalidStateTransition(APIException):
    status_code = 400
    default_detail = "Invalid state transition."
    default_code = "invalid_state_transition"


class ResourceNotAvailable(APIException):
    status_code = 409
    default_detail = "Resource is not available."
    default_code = "resource_not_available"
