from PIL import Image
import os

def optimize_logo():
    # Optimizar logo.png
    logo_path = os.path.join('static', 'img', 'logo.png')
    img = Image.open(logo_path)
    
    # Redimensionar a 500x502 manteniendo la transparencia
    new_size = (500, 502)
    img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Guardar con optimización
    img_resized.save(logo_path, 'PNG', optimize=True, quality=85)
    print(f"Logo optimizado: {logo_path}")

def optimize_favicon():
    # Optimizar favicon.ico
    favicon_path = os.path.join('static', 'img', 'favicon.ico')
    img = Image.open(favicon_path)
    
    # Crear versiones de diferentes tamaños
    sizes = [(16, 16), (32, 32)]
    favicon_images = []
    
    for size in sizes:
        favicon_images.append(img.resize(size, Image.Resampling.LANCZOS))
    
    # Guardar todas las versiones en el mismo archivo .ico
    favicon_images[0].save(
        favicon_path,
        format='ICO',
        sizes=sizes,
        quality=85
    )
    print(f"Favicon optimizado: {favicon_path}")

if __name__ == '__main__':
    optimize_logo()
    optimize_favicon()
    print("Optimización completada")
