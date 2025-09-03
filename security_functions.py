from flask import session, request, redirect, url_for, jsonify
from functools import wraps
# security_functions.py
import os
import hashlib
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash

def get_db_connection():
    try:
        DATABASE_URL = os.environ.get('DATABASE_URL')
        if not DATABASE_URL:
            print("DATABASE_URL no está configurada, usando configuración local")
            return psycopg2.connect(
                host="localhost",
                database="finanzas",
                user="postgres",
                password="postgres"
            )
        print("Intentando conectar usando DATABASE_URL")
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        print("Error en get_db_connection:", str(e))
        return None
from datetime import datetime, timedelta
import time

# Constantes de seguridad
BLOCK_TIME = 300  # 5 minutos de bloqueo
ATTEMPT_LIMIT = 3  # Número máximo de intentos permitidos

# Diccionario para almacenar los intentos de inicio de sesión
login_attempts = {}

# Función para verificar credenciales
def verify_credentials(username, password):
    conn = None
    cur = None
    try:
        # Intentar obtener la conexión
        conn = get_db_connection()
        if not conn:
            print("No se pudo establecer conexión con la base de datos")
            return None

        # Intentar ejecutar la consulta
        cur = conn.cursor()
        cur.execute("SELECT id, password_hash, rol FROM usuarios WHERE username = %s", (username,))
        user = cur.fetchone()

        # Verificar contraseña
        if user and check_password_hash(user[1], password):
            return {
                'id': user[0],
                'username': username,
                'rol': user[2]
            }
        return None

    except Exception as e:
        print("Error en verify_credentials:", str(e))
        return None

    finally:
        try:
            if cur:
                cur.close()
            if conn:
                conn.close()
        except Exception as e:
            print("Error cerrando recursos:", str(e))
        print("Error verificando credenciales:", e)
        return None

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
