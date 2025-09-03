from flask import session, request, redirect, url_for, jsonify
from functools import wraps
from datetime import datetime, timedelta
import time

# Credenciales hardcoded temporalmente para depuración
USERS = {
    'vayavalla': {
        'password': 'palayenti2512',
        'rol': 'admin'
    },
    'registros': {
        'password': '221885',
        'rol': 'registro'
    }
}

# Constantes de seguridad
BLOCK_TIME = 300  # 5 minutos de bloqueo
ATTEMPT_LIMIT = 3  # Número máximo de intentos permitidos

# Diccionario para almacenar los intentos de inicio de sesión
login_attempts = {}

def check_login_attempts(ip):
    """Verifica si un IP puede intentar iniciar sesión"""
    if ip in login_attempts:
        attempts, last_attempt = login_attempts[ip]
        # Si han pasado más de 5 minutos, reiniciar intentos
        if datetime.now() - last_attempt > timedelta(seconds=BLOCK_TIME):
            login_attempts[ip] = (0, datetime.now())
            return True
        # Si excedió el límite de intentos
        if attempts >= ATTEMPT_LIMIT:
            return False
    return True

def record_failed_attempt(ip):
    """Registra un intento fallido de inicio de sesión"""
    if ip in login_attempts:
        attempts, _ = login_attempts[ip]
        login_attempts[ip] = (attempts + 1, datetime.now())
    else:
        login_attempts[ip] = (1, datetime.now())

def verify_credentials(username, password):
    """Verifica las credenciales de usuario"""
    print(f"Verificando usuario: {username}")
    
    # Verificar si el usuario existe
    if username in USERS:
        print(f"Usuario {username} encontrado")
        # Verificar contraseña
        if USERS[username]['password'] == password:
            print(f"Contraseña correcta para {username}")
            return {
                'id': 1,  # ID temporal
                'username': username,
                'rol': USERS[username]['rol']
            }
        else:
            print(f"Contraseña incorrecta para {username}")
    else:
        print(f"Usuario {username} no encontrado")
    
    return None

def login_required(f):
    """Decorador para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verificar si el usuario está logueado
        if not session.get('logged_in'):
            return redirect(url_for('login'))
        
        # Verificar si la IP cambió
        if session.get('ip') != request.remote_addr:
            session.clear()
            return redirect(url_for('login'))
        
        # Verificar tiempo de inactividad (30 minutos)
        if time.time() - session.get('last_activity', 0) > 1800:
            session.clear()
            return redirect(url_for('login'))
        
        # Actualizar tiempo de última actividad
        session['last_activity'] = time.time()
        return f(*args, **kwargs)
    return decorated_function
