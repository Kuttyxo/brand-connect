import os
import time
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# 1. Cargar variables de entorno (Seguridad)
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# 2. Conectar a Supabase
supabase: Client = create_client(url, key)

print("🤖 BrandConnect Worker iniciado...")

def mock_instagram_api(handle):
    """
    Simula una llamada a la API de Instagram.
    En el futuro, aquí irá la llamada real a la Graph API.
    """
    print(f"   🔎 Consultando API de Instagram para: {handle}...")
    time.sleep(2) # Simular latencia de red
    
    # Simulación: Si el usuario tiene "fake" en el nombre, no existe.
    if "fake" in handle.lower():
        return None
        
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2),
        "verified": True
    }

def process_unverified_users():
    """
    Busca usuarios en la DB que no estén verificados y los procesa.
    """
    # 1. Buscar en la base de datos (Query)
    response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
    users = response.data

    if not users:
        print("💤 No hay usuarios nuevos para verificar.")
        return

    print(f"🚀 Encontrados {len(users)} usuarios sin verificar.")

    for user in users:
        handle = user.get('social_handle')
        user_id = user.get('id')

        if not handle:
            print(f"   ⚠️ Usuario {user_id} no tiene red social. Saltando.")
            continue

        # 2. Llamar a la "API"
        social_data = mock_instagram_api(handle)

        # 3. Actualizar base de datos
        if social_data:
            print(f"   ✅ Usuario {handle} verificado! ({social_data['followers']} seguidores)")
            
            data_to_update = {
                "is_verified": True,
                "followers_count": social_data['followers'],
                "engagement_rate": social_data['engagement']
            }
            
            supabase.table('profiles').update(data_to_update).eq('id', user_id).execute()
        else:
            print(f"   ❌ No se encontró cuenta para {handle}")

# --- Ejecución ---
if __name__ == "__main__":
    # Por ahora corre una vez. En la fase Docker lo haremos un loop infinito.
    process_unverified_users()