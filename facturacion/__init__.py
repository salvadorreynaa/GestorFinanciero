from flask import Blueprint

facturacion_bp = Blueprint('facturacion', __name__)

from . import routes
