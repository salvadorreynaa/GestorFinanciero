import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from functools import wraps
import psycopg2
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import time

app = Flask(__name__)
app.secret_key = 'vayavalla2512'  # Clave secreta para las sesiones

# Inicializar SQLAlchemy
from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# Configuración de SQLAlchemy
if os.environ.get('DATABASE_URL'):
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql://')
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:postgres@localhost/vayavalla'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Importar y registrar el blueprint de facturación
from facturacion import facturacion_bp
app.register_blueprint(facturacion_bp, url_prefix='/facturacion')

# Rutas para PWA
@app.route('/sw.js')
def service_worker():
    return app.send_file('sw.js', mimetype='application/javascript')

@app.route('/manifest.json')
def manifest():
    return app.send_file('static/manifest.json', mimetype='application/json')

# Configuraciones de seguridad para las sesiones
app.config['SESSION_COOKIE_SECURE'] = True  # Solo enviar cookie por HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevenir acceso por JavaScript
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # Protección contra CSRF
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)  # Sesión expira después de 2 horas de inactividad
app.config['SESSION_TYPE'] = 'filesystem'  # Usar sistema de archivos para las sesiones

# Sistema de seguridad contra intentos de inicio de sesión
login_attempts = {}
ATTEMPT_LIMIT = 3  # Número máximo de intentos
BLOCK_TIME = 900  # Tiempo de bloqueo en segundos (15 minutos)

def check_login_attempts(ip):
    if ip in login_attempts:
        attempts, last_attempt = login_attempts[ip]
        # Si han pasado más de 15 minutos, reiniciar intentos
        if datetime.now() - last_attempt > timedelta(seconds=BLOCK_TIME):
            login_attempts[ip] = (0, datetime.now())
            return True
        # Si excedió el límite de intentos
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

# Credenciales (en un entorno real, esto debería estar en una base de datos)
VALID_USERNAME = "vayavalla"
VALID_PASSWORD = generate_password_hash("palayenti2512")

# Decorador para proteger rutas
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('login'))
        
        # Verificar si la IP ha cambiado
        if session.get('ip') != request.remote_addr:
            session.clear()
            return redirect(url_for('login'))
        
        # Verificar inactividad
        if time.time() - session.get('last_activity', 0) > 1800:  # 30 minutos
            session.clear()
            return redirect(url_for('login'))
        
        # Actualizar tiempo de última actividad
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

# Conexión a PostgreSQL usando variable de entorno DATABASE_URL
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Verificar si la IP está bloqueada
        ip = request.remote_addr
        if not check_login_attempts(ip):
            time_left = BLOCK_TIME - (datetime.now() - login_attempts[ip][1]).seconds
            minutes = time_left // 60
            seconds = time_left % 60
            return render_template('login.html', 
                error=f'Demasiados intentos fallidos. Por favor espera {minutes} minutos y {seconds} segundos.')

        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == VALID_USERNAME and password == "palayenti2512":
            # Limpiar intentos fallidos
            if ip in login_attempts:
                del login_attempts[ip]
            # Crear una sesión no permanente (se elimina al cerrar el navegador)
            session.permanent = False
            session['logged_in'] = True
            session['last_activity'] = time.time()
            session['ip'] = ip  # Guardar IP para verificación adicional
            return redirect(url_for('dashboard'))
        
        # Registrar intento fallido
        record_failed_attempt(ip)
        remaining_attempts = ATTEMPT_LIMIT - login_attempts[ip][0]
        return render_template('login.html', 
            error=f'Usuario o contraseña incorrectos. Te quedan {remaining_attempts} intentos.')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()  # Limpiar toda la sesión
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Verificar que la sesión esté activa
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/finanzas')
@login_required
def finanzas():
    # Verificar que la sesión esté activa
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
