import sqlite3
import os
from datetime import datetime

def fix_empty_companies():
    # Asegurarse que estamos en el directorio correcto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'database.db')
    
    # Conectar a la base de datos
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Verificar si 'Sin Empresa' existe, si no, crearla
        cursor.execute("SELECT nombre FROM empresas WHERE nombre = 'Sin Empresa'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO empresas (nombre, fecha_creacion) VALUES (?, ?)", 
                         ('Sin Empresa', datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
            print("✅ Empresa 'Sin Empresa' creada correctamente")
        
        # 2. Actualizar todos los movimientos que tienen empresa vacía
        cursor.execute("""
            UPDATE movimientos 
            SET empresa = 'Sin Empresa' 
            WHERE empresa IS NULL OR empresa = ''
        """)
        
        # Obtener el número de filas actualizadas
        rows_affected = cursor.rowcount
        
        # Confirmar los cambios
        conn.commit()
        
        print(f"✅ Se actualizaron {rows_affected} movimientos con empresa vacía")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    fix_empty_companies()
