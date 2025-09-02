from pywebpush import webpush, WebPushException
import json

def generate_keys():
    from pywebpush import generate_vapid_keys
    vapid_keys = generate_vapid_keys()
    
    # Guardar las claves en un archivo
    with open('vapid_keys.json', 'w') as f:
        json.dump({
            'public_key': vapid_keys.get('public_key'),
            'private_key': vapid_keys.get('private_key')
        }, f, indent=2)
    
    print("¡Claves generadas con éxito!")
    print("\nClave pública:")
    print(vapid_keys.get('public_key'))
    print("\nClave privada:")
    print(vapid_keys.get('private_key'))
    print("\nLas claves se han guardado en 'vapid_keys.json'")

if __name__ == "__main__":
    generate_keys()
