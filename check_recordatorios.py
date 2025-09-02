import os
import psycopg2
from datetime import datetime, timedelta
from pywebpush import webpush, WebPushException
import json
import time

def get_db_connection():
    DATABASE_URL = os.environ.get('DATABASE_URL')
    return psycopg2.connect(DATABASE_URL)

def enviar_notificacion(subscription_info, mensaje):
    try:
        webpush(
            subscription_info=subscription_info,
            data=mensaje,
            vapid_private_key=os.environ.get('VAPID_PRIVATE_KEY'),
            vapid_claims={
                "sub": "mailto:info@vayavalla.com"
            }
        )
        return True
    except WebPushException as e:
        print(f"Error al enviar notificación: {e}")
        return False

def check_recordatorios():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Obtener recordatorios pendientes para hoy
    cur.execute("""
        SELECT r.id, r.movimiento_id, r.descripcion, m.empresa_id, m.monto, m.tipo
        FROM recordatorios r
        JOIN movimientos m ON r.movimiento_id = m.id
        WHERE DATE(r.fecha_recordatorio) = CURRENT_DATE
        AND r.estado = 'pendiente';
    """)
    
    recordatorios = cur.fetchall()
    
    for recordatorio in recordatorios:
        recordatorio_id, movimiento_id, descripcion, empresa_id, monto, tipo = recordatorio
        
        mensaje = {
            "title": f"Recordatorio de {'cobro' if tipo == 'ingreso' else 'pago'}",
            "body": descripcion,
            "data": {
                "movimientoId": movimiento_id,
                "url": "/movimientos"
            }
        }
        
        # Aquí normalmente buscarías las suscripciones de los usuarios en la base de datos
        # y enviarías la notificación a cada uno
        
        # Marcar como enviado
        cur.execute("""
            UPDATE recordatorios 
            SET estado = 'enviado' 
            WHERE id = %s;
        """, (recordatorio_id,))
    
    conn.commit()
    cur.close()
    conn.close()

if __name__ == '__main__':
    while True:
        check_recordatorios()
        # Esperar 1 hora antes de la siguiente verificación
        time.sleep(3600)
