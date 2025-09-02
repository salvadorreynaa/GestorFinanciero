from flask import session, request, redirect, url_for, jsonify
from functools import wraps
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import time

# Constantes de seguridad
BLOCK_TIME = 300  # 5 minutos de bloqueo
ATTEMPT_LIMIT = 3  # Número máximo de intentos permitidos

# Diccionario para almacenar los intentos de inicio de sesión
login_attempts = {}

# Credenciales y seguridad
VALID_USERNAME = "vayavalla"
VALID_PASSWORD = generate_password_hash("palayenti2512")

# Decorador para proteger rutas
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        
        if session.get('ip') != request.remote_addr:
            session.clear()
            return redirect(url_for('login'))
        
        if time.time() - session.get('last_activity', 0) > 1800:  # 30 minutos
            session.clear()
            return redirect(url_for('login'))
        
        session['last_activity'] = time.time()
        return f(*args, **kwargs)
    return decorated_function

# Decorador para proteger rutas API
def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({"error": "No autorizado"}), 401
        return f(*args, **kwargs)
    return decorated_function

def check_login_attempts(ip):
    if ip in login_attempts:
        attempts, last_attempt = login_attempts[ip]
        if datetime.now() - last_attempt > timedelta(seconds=BLOCK_TIME):
            login_attempts[ip] = (0, datetime.now())
            return True
        if attempts >= ATTEMPT_LIMIT:
            time_left = BLOCK_TIME - (datetime.now() - last_attempt).seconds
            if time_left > 0:
                return False
            login_attempts[ip] = (0, datetime.now())
    return True

def record_failed_attempt(ip):
    if ip in login_attempts:
        attempts, _ = login_attempts[ip]
        login_attempts[ip] = (attempts + 1, datetime.now())
    else:
        login_attempts[ip] = (1, datetime.now())
