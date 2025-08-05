import json
import csv

# Cargar el archivo JSON
with open('datos.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Abrir archivo CSV para escribir
with open('datos.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)

    # Escribir los encabezados (usa las claves del primer movimiento)
    writer.writerow(data[0].keys())

    # Escribir las filas
    for movimiento in data:
        writer.writerow(movimiento.values())

print("Conversión completada ✅")
