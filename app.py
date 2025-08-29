import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from functools import wraps
import psycopg2
from werkzeug.security import check_password_hash, generate_password_hash

from datetime import datetime, timedelta
import time

app = Flask(__name__)
app.secret_key = 'vayavalla2512'  # Clave secreta para las sesiones

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
app.config['PERMANENT_SESSION_LIFETIME'] = 7200  # Sesión expira después de 2 horas de inactividad

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

@app.route('/facturacion/login', methods=['GET', 'POST'])
@login_required
def facturacion_login():
    if request.method == 'POST':
        pin = request.form.get('pin')
        if pin == '251281':
            session['facturacion_access'] = True
            return redirect(url_for('index', section='facturacion'))
        else:
            flash('PIN incorrecto')
            return render_template('facturacion_login.html')
    return render_template('facturacion_login.html')

@app.route('/')
@login_required
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/finanzas')
@login_required
def finanzas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM movimientos ORDER BY fecha DESC;')
    movimientos = cur.fetchall()
    cur.close()
    conn.close()
    return render_template('index.html', movimientos=movimientos)

# Endpoint para estadísticas
@app.route('/estadisticas')
@login_required
def estadisticas():
    return render_template('estadisticas.html')

# Endpoint para contactos
@app.route('/contactos')
@login_required
def contactos():
    return render_template('contactos.html')

# Endpoint para movimientos
@app.route('/movimientos')
@login_required
def movimientos():
    return render_template('movimientos.html')

# Endpoint para obtener tipos de movimiento
@app.route('/api/tipos_movimiento/<tipo>', methods=['GET'])
@api_login_required
def get_tipos_movimiento(tipo):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT nombre FROM tipos_movimiento WHERE tipo = %s ORDER BY nombre;', (tipo,))
    tipos = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(tipos)

@app.route('/agregar', methods=['POST'])
def agregar():
    descripcion = request.form['descripcion']
    monto = request.form['monto']
    fecha = request.form.get('fecha')
    mes = request.form.get('mes')
    año = request.form.get('año')
    tipo = request.form.get('tipo')
    empresa = request.form.get('empresa')
    tipoMovimiento = request.form.get('tiposmovimientos')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Insertar empresa si no existe
    if empresa:
        cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (empresa,))
        empresa_id = cur.fetchone()
        if not empresa_id:
            cur.execute('SELECT id FROM empresas WHERE nombre=%s;', (empresa,))
            empresa_id = cur.fetchone()
        empresa_id = empresa_id[0] if empresa_id else None
    else:
        empresa_id = None
    
    # Insertar tipo de movimiento si no existe
    if tipoMovimiento:
        cur.execute('INSERT INTO tipos_movimiento (nombre, tipo) VALUES (%s, %s) ON CONFLICT (nombre, tipo) DO NOTHING RETURNING id;', (tipoMovimiento, tipo))
        tipo_id = cur.fetchone()
        if not tipo_id:
            cur.execute('SELECT id FROM tipos_movimiento WHERE nombre=%s AND tipo=%s;', (tipoMovimiento, tipo))
            tipo_id = cur.fetchone()
        tipo_id = tipo_id[0] if tipo_id else None
    else:
        tipo_id = None
    
    # Insertar movimiento con todos los campos
    cur.execute('''
        INSERT INTO movimientos 
        (descripcion, monto, fecha, mes, año, tipo, tipoMovimiento, empresa_id, tipo_id, estado)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (descripcion, monto, fecha, mes, año, tipo, tipoMovimiento, empresa_id, tipo_id, 'Pendiente'))
    
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for('index'))

# --- API endpoint para estadísticas ---
@app.route('/api/estadisticas', methods=['GET'])
@api_login_required
def api_estadisticas():
    try:
        mes = request.args.get('mes')
        año = request.args.get('año')
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Base query with all necessary fields
        query = '''
            SELECT tipo, monto, estado, mes, año 
            FROM movimientos 
            WHERE 1=1
        '''
        params = []
        
        # Add filters if provided
        if mes and mes != 'Todos':
            query += ' AND LOWER(mes) = LOWER(%s)'
            params.append(mes)
        
        if año and año != 'Todos':
            # Convertir año a entero para comparación numérica
            try:
                año_int = int(año)
                # Buscar tanto por año exacto como por registros sin año (que se consideran del año actual)
                query += ' AND (CAST(año AS INTEGER) = %s OR (año IS NULL AND %s = 2025))'
                params.append(año_int)
                params.append(año_int)
            except ValueError:
                # Si no se puede convertir a entero, usar comparación de string
                query += ' AND (año = %s OR (año IS NULL AND %s = 2025))'
                params.append(año)
                params.append(año)
            
        cur.execute(query, params)
        rows = cur.fetchall()
        
        print(f'Estadísticas - Filtros: mes={mes}, año={año}')
        print(f'Estadísticas - Query: {query}')
        print(f'Estadísticas - Params: {params}')
        print(f'Estadísticas - Filas encontradas: {len(rows)}')
        print(f'Estadísticas - Datos encontrados: {rows[:5]}')  # Mostrar las primeras 5 filas
        
        # Debug: Mostrar algunos registros de la base de datos para verificar tipos
        cur.execute('SELECT DISTINCT año, mes FROM movimientos ORDER BY año DESC, mes LIMIT 10')
        sample_data = cur.fetchall()
        print(f'Estadísticas - Muestra de datos en BD: {sample_data}')
        
        ingresos = egresos = cobrado = porCobrar = porPagar = 0
        
        for tipo, monto, estado, mes, año in rows:
            if monto is not None:
                monto = float(monto)
                if tipo == 'ingreso':
                    ingresos += monto
                    if estado == 'Cobrado':
                        cobrado += monto
                    elif estado == 'Pendiente':
                        porCobrar += monto
                elif tipo == 'egreso':
                    egresos += monto
                    if estado == 'Pendiente':
                        porPagar += monto
        disponible = ingresos - egresos
        cur.close()
        conn.close()
        return jsonify({
            'ingresos': ingresos,
            'egresos': egresos,
            'disponible': disponible,
            'cobrado': cobrado,
            'porCobrar': porCobrar,
            'porPagar': porPagar
        })
    except Exception as e:
        print('Error en /api/estadisticas:', e)
        return jsonify({
            'ingresos': 0,
            'egresos': 0,
            'disponible': 0,
            'cobrado': 0,
            'porCobrar': 0,
            'porPagar': 0
        }), 200

# --- API endpoint para actualizar años faltantes ---
@app.route('/api/fix-años', methods=['GET'])
def api_fix_años():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Obtener todos los movimientos que no tienen año
        cur.execute('SELECT id, fecha, mes FROM movimientos WHERE año IS NULL')
        movimientos_sin_año = cur.fetchall()
        
        actualizados = 0
        for id, fecha, mes in movimientos_sin_año:
            if fecha:
                # Extraer año de la fecha
                año = fecha.year
                cur.execute('UPDATE movimientos SET año = %s WHERE id = %s', (año, id))
                actualizados += 1
            elif mes:
                # Si no hay fecha pero hay mes, usar año actual
                año = 2025  # Año por defecto
                cur.execute('UPDATE movimientos SET año = %s WHERE id = %s', (año, id))
                actualizados += 1
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'mensaje': f'Se actualizaron {actualizados} registros con el año correspondiente',
            'registros_actualizados': actualizados
        })
    except Exception as e:
        print('Error al actualizar años:', e)
        return jsonify({'error': str(e)}), 500

# --- API endpoint para debug de estadísticas ---
@app.route('/api/debug-estadisticas', methods=['GET'])
def api_debug_estadisticas():
    try:
        mes = request.args.get('mes')
        año = request.args.get('año')
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Query para ver todos los movimientos
        query = '''
            SELECT id, tipo, monto, estado, mes, año, descripcion
            FROM movimientos 
            WHERE 1=1
        '''
        params = []
        
        if mes and mes != 'Todos':
            query += ' AND LOWER(mes) = LOWER(%s)'
            params.append(mes)
        
        if año and año != 'Todos':
            # Convertir año a entero para comparación numérica
            try:
                año_int = int(año)
                # Buscar tanto por año exacto como por registros sin año (que se consideran del año actual)
                query += ' AND (CAST(año AS INTEGER) = %s OR (año IS NULL AND %s = 2025))'
                params.append(año_int)
                params.append(año_int)
            except ValueError:
                # Si no se puede convertir a entero, usar comparación de string
                query += ' AND (año = %s OR (año IS NULL AND %s = 2025))'
                params.append(año)
                params.append(año)
            
        query += ' ORDER BY fecha DESC'
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        # Debug adicional: verificar tipos de datos en la BD
        cur.execute('SELECT DISTINCT año, mes FROM movimientos ORDER BY año DESC, mes LIMIT 10')
        sample_data = cur.fetchall()
        
        debug_data = []
        for row in rows:
            debug_data.append({
                'id': row[0],
                'tipo': row[1],
                'monto': float(row[2]) if row[2] else 0,
                'estado': row[3],
                'mes': row[4],
                'año': row[5],
                'descripcion': row[6]
            })
        
        cur.close()
        conn.close()
        
        return jsonify({
            'filtros': {'mes': mes, 'año': año},
            'query': query,
            'params': params,
            'total_movimientos': len(debug_data),
            'movimientos': debug_data,
            'muestra_bd': sample_data,
            'tipos_datos': {
                'año_ejemplo': str(sample_data[0][0]) if sample_data else 'N/A',
                'tipo_año': type(sample_data[0][0]).__name__ if sample_data else 'N/A'
            }
        })
    except Exception as e:
        print('Error en debug estadísticas:', e)
        return jsonify({'error': str(e)}), 500

# --- API endpoints para movimientos ---
@app.route('/api/movimientos', methods=['GET'])
@api_login_required
def api_movimientos():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT m.id, m.fecha, 
            COALESCE(m.mes, to_char(m.fecha, 'TMMonth')) as mes,
            COALESCE(m.año, to_char(m.fecha, 'YYYY')) as año,
            m.estado, e.nombre as empresa, m.tipo, m.tipoMovimiento, m.descripcion, m.monto
            FROM movimientos m
            LEFT JOIN empresas e ON m.empresa_id = e.id
            ORDER BY m.fecha DESC;
        ''')
        movimientos = []
        for row in cur.fetchall():
            id, fecha, mes, año, estado, empresa, tipo, tipoMovimiento, descripcion, monto = row
            movimientos.append({
                'id': id,
                'fecha': fecha.isoformat() if hasattr(fecha, 'isoformat') else (fecha or ''),
                'mes': mes or '',
                'año': año or '',
                'estado': estado or 'Pendiente',
                'empresa': empresa or '',
                'tipo': tipo or '',
                'tipoMovimiento': tipoMovimiento or '',
                'descripcion': descripcion or '',
                'monto': float(monto) if monto is not None else 0.0
            })
        cur.close()
        conn.close()
        return jsonify(movimientos)
    except Exception as e:
        print('Error en /api/movimientos:', e)
        return jsonify([]), 200

@app.route('/api/movimientos/<int:id>/estado', methods=['PATCH'])
@api_login_required
def api_movimiento_estado(id):
    data = request.get_json()
    nuevo_estado = data.get('estado')
    if not nuevo_estado:
        return jsonify({'status': 'error', 'error': 'Falta estado'}), 400
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('UPDATE movimientos SET estado=%s WHERE id=%s;', (nuevo_estado, id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        print('Error al cambiar estado:', e)
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/movimientos/<int:id>', methods=['DELETE'])
def api_movimientos_delete(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM movimientos WHERE id=%s;', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

# --- API endpoints para empresas ---
@app.route('/api/empresas/<nombre>', methods=['DELETE'])
def api_empresa_delete(nombre):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Primero verificar si la empresa tiene movimientos
        cur.execute('SELECT COUNT(*) FROM movimientos WHERE empresa_id IN (SELECT id FROM empresas WHERE nombre = %s);', (nombre,))
        count = cur.fetchone()[0]
        
        if count > 0:
            cur.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'No se puede eliminar la empresa porque tiene movimientos asociados'
            }), 400
        
        # Si no tiene movimientos, proceder a eliminar
        cur.execute('DELETE FROM empresas WHERE nombre = %s RETURNING id;', (nombre,))
        deleted = cur.fetchone()
        
        if not deleted:
            cur.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Empresa no encontrada'
            }), 404
            
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'status': 'ok', 'message': 'Empresa eliminada correctamente'})
        
    except Exception as e:
        print('Error al eliminar empresa:', str(e))
        if conn:
            conn.rollback()
            if 'cur' in locals() and cur:
                cur.close()
            conn.close()
        return jsonify({
            'status': 'error',
            'error': 'Error al eliminar la empresa: ' + str(e)
        }), 500

@app.route('/api/movimientos', methods=['POST'])
def api_movimientos_post():
    try:
        data = request.get_json()
        descripcion = data.get('descripcion')
        monto = data.get('monto')
        fecha = data.get('fecha')
        mes = data.get('mes')
        año = data.get('año')
        tipo = data.get('tipo')
        tipoMovimiento = data.get('tipoMovimiento')
        empresa = data.get('empresa')
        estado = data.get('estado', 'Pendiente')

        if not all([descripcion, monto, tipo, tipoMovimiento]):
            return jsonify({'error': 'Faltan campos requeridos'}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Insertar o obtener empresa
        if empresa:
            cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (empresa,))
            empresa_id = cur.fetchone()
            if not empresa_id:
                cur.execute('SELECT id FROM empresas WHERE nombre = %s;', (empresa,))
                empresa_id = cur.fetchone()
            empresa_id = empresa_id[0] if empresa_id else None
        else:
            empresa_id = None

        # Insertar o obtener tipo de movimiento
        cur.execute('SELECT id FROM tipos_movimiento WHERE nombre = %s;', (tipoMovimiento,))
        tipo_id = cur.fetchone()
        if not tipo_id:
            cur.execute('INSERT INTO tipos_movimiento (nombre, tipo) VALUES (%s, %s) RETURNING id;', 
                       (tipoMovimiento, tipo))
            tipo_id = cur.fetchone()
        tipo_id = tipo_id[0] if tipo_id else None

        # Insertar el movimiento
        cur.execute('''
            INSERT INTO movimientos 
            (descripcion, monto, fecha, mes, año, tipo, tipoMovimiento, empresa_id, tipo_id, estado)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
        ''', (descripcion, monto, fecha, mes, año, tipo, tipoMovimiento, empresa_id, tipo_id, estado))

        movimiento_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'id': movimiento_id,
            'status': 'ok',
            'message': 'Movimiento creado exitosamente'
        })
    except Exception as e:
        print('Error al crear movimiento:', e)
        if 'conn' in locals():
            conn.rollback()
            cur.close()
            conn.close()
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# --- API endpoints para contactos ---
@app.route('/api/contactos', methods=['GET'])
def api_contactos():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, nombre, empresa, celular, email, direccion, especialidad, descripcion FROM contactos ORDER BY nombre ASC;')
    contactos = [dict(zip(['id','nombre','empresa','celular','email','direccion','especialidad','descripcion'], row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(contactos)

@app.route('/api/contactos', methods=['POST'])
def api_contactos_post():
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO contactos (nombre, empresa, celular, email, direccion, especialidad, descripcion)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    ''', (data['nombre'], data['empresa'], data['celular'], data['email'], data['direccion'], data['especialidad'], data['descripcion']))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/contactos/<int:id>', methods=['GET'])
def api_contactos_get(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT id, nombre, empresa, celular, email, direccion, especialidad, descripcion FROM contactos WHERE id=%s;', (id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return jsonify(dict(zip(['id','nombre','empresa','celular','email','direccion','especialidad','descripcion'], row)))
    return jsonify({})

@app.route('/api/contactos/<int:id>', methods=['PUT'])
def api_contactos_put(id):
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        UPDATE contactos SET nombre=%s, empresa=%s, celular=%s, email=%s, direccion=%s, especialidad=%s, descripcion=%s WHERE id=%s
    ''', (data['nombre'], data['empresa'], data['celular'], data['email'], data['direccion'], data['especialidad'], data['descripcion'], id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/contactos/<int:id>', methods=['DELETE'])
def api_contactos_delete(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM contactos WHERE id=%s;', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

# --- API endpoints para empresas y tipos de movimiento ---
@app.route('/api/empresas', methods=['GET'])
def api_empresas():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT nombre FROM empresas ORDER BY nombre ASC;')
    empresas = [{'nombre': row[0]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(empresas)

@app.route('/api/empresas', methods=['POST'])
def api_empresas_post():
    data = request.get_json()
    nombre = data.get('nombre')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING;', (nombre,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/tipos_movimiento', methods=['GET'])
def api_tipos_movimiento():
    tipo = request.args.get('tipo')
    conn = get_db_connection()
    cur = conn.cursor()
    if tipo:
        cur.execute('SELECT nombre FROM tipos_movimiento WHERE tipo=%s ORDER BY nombre ASC;', (tipo,))
    else:
        cur.execute('SELECT nombre FROM tipos_movimiento ORDER BY nombre ASC;')
    tipos = [{'nombre': row[0]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(tipos)

@app.route('/api/tipos_movimiento', methods=['POST'])
def api_tipos_movimiento_post():
    data = request.get_json()
    nombre = data.get('nombre')
    tipo = data.get('tipo')
    
    if not nombre or not tipo:
        return jsonify({'error': 'Nombre y tipo son requeridos'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO tipos_movimiento (nombre, tipo) VALUES (%s, %s) ON CONFLICT (nombre, tipo) DO NOTHING;', (nombre, tipo))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/empresas/<nombre>', methods=['DELETE'])
def api_empresas_delete(nombre):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM empresas WHERE nombre=%s;', (nombre,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/tipos_movimiento/<nombre>', methods=['DELETE'])
def api_tipos_movimiento_delete(nombre):
    tipo = request.args.get('tipo')  # Obtenemos el tipo de los parámetros de la URL
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if tipo:
            # Si se proporciona el tipo, borramos la combinación específica
            cur.execute('DELETE FROM tipos_movimiento WHERE nombre=%s AND tipo=%s;', (nombre, tipo))
        else:
            # Si no se proporciona el tipo, borramos todas las ocurrencias del nombre
            cur.execute('DELETE FROM tipos_movimiento WHERE nombre=%s;', (nombre,))
        
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/empresas/<nombre>', methods=['PUT'])
def api_empresas_rename(nombre):
    data = request.get_json()
    nuevo_nombre = data.get('nombre')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE empresas SET nombre=%s WHERE nombre=%s;', (nuevo_nombre, nombre))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/tipos_movimiento/<nombre>', methods=['PUT'])
def api_tipos_movimiento_rename(nombre):
    data = request.get_json()
    nuevo_nombre = data.get('nombre')
    if not nuevo_nombre:
        return jsonify({'status': 'error', 'error': 'Nombre no proporcionado'}), 400
        
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # Primero actualizamos los movimientos que usan este tipo
        cur.execute('UPDATE movimientos SET tipoMovimiento = %s WHERE tipoMovimiento = %s;', 
                   (nuevo_nombre, nombre))
        
        # Luego actualizamos el tipo de movimiento
        cur.execute('UPDATE tipos_movimiento SET nombre = %s WHERE nombre = %s RETURNING id;', 
                   (nuevo_nombre, nombre))
        updated = cur.fetchone()
        
        if not updated:
            cur.close()
            conn.close()
            return jsonify({
                'status': 'error',
                'error': 'Tipo de movimiento no encontrado'
            }), 404
            
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok', 'message': 'Tipo de movimiento actualizado correctamente'})
        
    except Exception as e:
        if conn:
            conn.rollback()
            if 'cur' in locals() and cur:
                cur.close()
            conn.close()
        return jsonify({
            'status': 'error',
            'error': 'Error al actualizar el tipo de movimiento: ' + str(e)
        }), 500

@app.route('/api/movimientos/<int:id>', methods=['PATCH'])
def api_movimientos_patch(id):
    data = request.get_json()
    campos = []
    valores = []
    # Si se envía empresa, buscar el id
    empresa_id = None
    if 'empresa' in data:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (data['empresa'],))
        empresa_id = cur.fetchone()
        if not empresa_id:
            cur.execute('SELECT id FROM empresas WHERE nombre=%s;', (data['empresa'],))
            empresa_id = cur.fetchone()
        empresa_id = empresa_id[0] if empresa_id else None
        cur.close()
        conn.close()
        campos.append('empresa_id=%s')
        valores.append(empresa_id)
    for campo in ['tipo', 'tipoMovimiento', 'descripcion', 'fecha', 'mes', 'año', 'monto', 'mensual_auto']:
        if campo in data:
            campos.append(f"{campo}=%s")
            valores.append(data[campo])
    if not campos:
        return jsonify({'status': 'error', 'error': 'No hay campos para actualizar'}), 400
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        sql = f"UPDATE movimientos SET {', '.join(campos)} WHERE id=%s;"
        cur.execute(sql, (*valores, id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        print('Error al editar movimiento:', e)
        return jsonify({'status': 'error', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
