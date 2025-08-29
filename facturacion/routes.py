from flask import Blueprint, render_template, request, jsonify, current_app, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle

facturacion_bp = Blueprint('facturacion', __name__)
db = SQLAlchemy()

class Factura(db.Model):
    __tablename__ = 'facturas'
    
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    cliente = db.Column(db.String(200), nullable=False)
    documento = db.Column(db.String(20), nullable=False)  # RUC o DNI
    descripcion = db.Column(db.Text, nullable=False)
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    pdf_path = db.Column(db.String(255))

@facturacion_bp.route('/facturacion')
def index():
    return render_template('facturacion/index.html')

@facturacion_bp.route('/facturacion/emitir', methods=['GET', 'POST'])
def emitir_factura():
    if request.method == 'GET':
        return render_template('facturacion/emitir.html')
    
    # Procesar el formulario POST
    data = request.form
    total = float(data['cantidad']) * float(data['precio_unitario'])
    
    # Crear la factura en la base de datos
    factura = Factura(
        cliente=data['cliente'],
        documento=data['documento'],
        descripcion=data['descripcion'],
        cantidad=int(data['cantidad']),
        precio_unitario=float(data['precio_unitario']),
        total=total
    )
    db.session.add(factura)
    db.session.flush()  # Para obtener el ID
    
    # Generar PDF
    pdf_filename = f"factura_{factura.id}.pdf"
    pdf_path = os.path.join(current_app.root_path, 'facturacion', 'pdfs', pdf_filename)
    generar_pdf(factura, pdf_path)
    
    factura.pdf_path = pdf_filename
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Factura generada correctamente',
        'factura_id': factura.id
    })

def generar_pdf(factura, pdf_path):
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter
    
    # Encabezado
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, height - 50, "VAYA VALLA")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, "Factura Electrónica")
    c.drawString(450, height - 50, f"N° {factura.id:08d}")
    
    # Información del cliente
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "DATOS DEL CLIENTE")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 140, f"Cliente: {factura.cliente}")
    c.drawString(50, height - 160, f"RUC/DNI: {factura.documento}")
    c.drawString(50, height - 180, f"Fecha: {factura.fecha.strftime('%d/%m/%Y')}")
    
    # Detalles de la factura
    data = [
        ["Descripción", "Cantidad", "Precio Unit.", "Total"],
        [factura.descripcion, str(factura.cantidad), 
         f"S/ {float(factura.precio_unitario):.2f}", 
         f"S/ {float(factura.total):.2f}"]
    ]
    
    table = Table(data, colWidths=[250, 70, 100, 100])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    table.wrapOn(c, width, height)
    table.drawOn(c, 50, height - 300)
    
    # Total
    c.setFont("Helvetica-Bold", 12)
    c.drawString(400, height - 350, f"Total: S/ {float(factura.total):.2f}")
    
    c.save()

@facturacion_bp.route('/facturacion/pdfs/<path:filename>')
def get_pdf(filename):
    return send_from_directory(
        os.path.join(current_app.root_path, 'facturacion', 'pdfs'),
        filename
    )
