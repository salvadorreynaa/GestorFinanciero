import os
from flask import Flask, render_template, request, redirect, url_for, jsonify, request
import psycopg2

app = Flask(__name__)

# Conexión a PostgreSQL usando variable de entorno DATABASE_URL
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

@app.route('/')
def index():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM movimientos ORDER BY fecha DESC;')
    movimientos = cur.fetchall()
    cur.close()
    conn.close()
    return render_template('index.html', movimientos=movimientos)

# Endpoint para estadísticas
@app.route('/estadisticas')
def estadisticas():
    return render_template('estadisticas.html')

# Endpoint para contactos
@app.route('/contactos')
def contactos():
    return render_template('contactos.html')

# Endpoint para movimientos
@app.route('/movimientos')
def movimientos():
    return render_template('movimientos.html')

@app.route('/agregar', methods=['POST'])
def agregar():
    descripcion = request.form['descripcion']
    monto = request.form['monto']
    # Aquí deberías obtener empresa y tipo de movimiento del formulario
    empresa = request.form.get('empresa')
    tipo = request.form.get('tiposmovimientos')
    conn = get_db_connection()
    cur = conn.cursor()
    # Insertar empresa si no existe
    cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (empresa,))
    empresa_id = cur.fetchone()
    if not empresa_id:
        cur.execute('SELECT id FROM empresas WHERE nombre=%s;', (empresa,))
        empresa_id = cur.fetchone()
    empresa_id = empresa_id[0] if empresa_id else None
    # Insertar tipo de movimiento si no existe
    cur.execute('INSERT INTO tipos_movimiento (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (tipo,))
    tipo_id = cur.fetchone()
    if not tipo_id:
        cur.execute('SELECT id FROM tipos_movimiento WHERE nombre=%s;', (tipo,))
        tipo_id = cur.fetchone()
    tipo_id = tipo_id[0] if tipo_id else None
    # Insertar movimiento
    cur.execute('INSERT INTO movimientos (descripcion, monto, empresa_id, tipo_id) VALUES (%s, %s, %s, %s);', (descripcion, monto, empresa_id, tipo_id))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for('index'))

# --- API endpoint para estadísticas ---
@app.route('/api/estadisticas', methods=['GET'])
def api_estadisticas():
    try:
        mes = request.args.get('mes')
        año = request.args.get('año')
        conn = get_db_connection()
        cur = conn.cursor()
        query = '''
            SELECT m.tipo_id, t.nombre, m.monto, m.fecha
            FROM movimientos m
            LEFT JOIN tipos_movimiento t ON m.tipo_id = t.id
        '''
        cur.execute(query)
        rows = cur.fetchall()
        ingresos = egresos = cobrado = porCobrar = porPagar = 0
        for tipo_id, tipo_nombre, monto, fecha in rows:
            # Filtrar por mes y año si se pasan como parámetros
            if mes and año and fecha:
                if fecha.strftime('%B') != mes or str(fecha.year) != año:
                    continue
            if tipo_nombre == 'ingreso':
                ingresos += float(monto) if monto is not None else 0.0
                cobrado += float(monto) if monto is not None else 0.0
            elif tipo_nombre == 'egreso':
                egresos += float(monto) if monto is not None else 0.0
                porPagar += float(monto) if monto is not None else 0.0
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

# --- API endpoints para movimientos ---
@app.route('/api/movimientos', methods=['GET'])
def api_movimientos():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            SELECT m.id, m.fecha, e.nombre as empresa, t.nombre as tipo, m.descripcion, m.monto, t.nombre as tiposmovimientos
            FROM movimientos m
            LEFT JOIN empresas e ON m.empresa_id = e.id
            LEFT JOIN tipos_movimiento t ON m.tipo_id = t.id
            ORDER BY m.fecha DESC;
        ''')
        movimientos = []
        for row in cur.fetchall():
            # Manejo de nulos y tipos
            id, fecha, empresa, tipo, descripcion, monto, tiposmovimientos = row
            movimientos.append({
                'id': id,
                'fecha': fecha.isoformat() if fecha else '',
                'empresa': empresa or '',
                'tipo': tipo or '',
                'descripcion': descripcion or '',
                'monto': float(monto) if monto is not None else 0.0,
                'tiposmovimientos': tiposmovimientos or ''
            })
        cur.close()
        conn.close()
        return jsonify(movimientos)
    except Exception as e:
        print('Error en /api/movimientos:', e)
        return jsonify([]), 200

@app.route('/api/movimientos/<int:id>', methods=['DELETE'])
def api_movimientos_delete(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM movimientos WHERE id=%s;', (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

@app.route('/api/movimientos', methods=['POST'])
def api_movimientos_post():
    try:
        data = request.get_json()
        tipo = data.get('tipo')
        tipo_movimiento = data.get('tipoMovimiento')
        descripcion = data.get('descripcion')
        fecha = data.get('fecha')
        mes = data.get('mes')
        año = data.get('año')
        monto = data.get('monto')
        empresa = data.get('empresa')
        estado = data.get('estado', 'Pendiente')
        conn = get_db_connection()
        cur = conn.cursor()
        # Insertar empresa si no existe
        cur.execute('INSERT INTO empresas (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (empresa,))
        empresa_id = cur.fetchone()
        if not empresa_id:
            cur.execute('SELECT id FROM empresas WHERE nombre=%s;', (empresa,))
            empresa_id = cur.fetchone()
        empresa_id = empresa_id[0] if empresa_id else None
        # Insertar tipo de movimiento si no existe
        cur.execute('INSERT INTO tipos_movimiento (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING RETURNING id;', (tipo_movimiento,))
        tipo_id = cur.fetchone()
        if not tipo_id:
            cur.execute('SELECT id FROM tipos_movimiento WHERE nombre=%s;', (tipo_movimiento,))
            tipo_id = cur.fetchone()
        tipo_id = tipo_id[0] if tipo_id else None
        # Insertar movimiento
        cur.execute('''
            INSERT INTO movimientos (tipo, tipoMovimiento, descripcion, fecha, mes, año, monto, empresa_id, estado, tipo_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (tipo, tipo_movimiento, descripcion, fecha, mes, año, monto, empresa_id, estado, tipo_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'status': 'ok'})
    except Exception as e:
        print('Error en /api/movimientos POST:', e)
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'error': str(e)}), 500

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
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT nombre FROM tipos_movimiento ORDER BY nombre ASC;')
    tipos = [{'nombre': row[0]} for row in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(tipos)

@app.route('/api/tipos_movimiento', methods=['POST'])
def api_tipos_movimiento_post():
    data = request.get_json()
    nombre = data.get('nombre')
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('INSERT INTO tipos_movimiento (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING;', (nombre,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

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
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM tipos_movimiento WHERE nombre=%s;', (nombre,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})

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
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('UPDATE tipos_movimiento SET nombre=%s WHERE nombre=%s;', (nuevo_nombre, nombre))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'status': 'ok'})
