import os
import time
import random
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURACIÓN ---
load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 
WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")

if not URL or not KEY:
    print("❌ ERROR FATAL: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env")
    exit()

try:
    supabase: Client = create_client(URL, KEY)
    print("🤖 BrandConnect Worker V4 (FIXED) INICIADO 🚀")
except Exception as e:
    print(f"❌ Error conectando a Supabase: {e}")
    exit()

# --- FUNCIONES ---

def send_discord_alert(title, description, color, fields):
    if not WEBHOOK_URL: return
    data = {
        "embeds": [{
            "title": title,
            "description": description,
            "color": color, 
            "fields": fields,
            "footer": {"text": "BrandConnect Bot 🤖"}
        }]
    }
    try:
        response = requests.post(WEBHOOK_URL, json=data)
        # ESTO ES NUEVO: Si Discord dice que no (Error 400), lanzamos error para verlo en consola
        response.raise_for_status() 
    except Exception as e:
        print(f"❌ Error enviando alerta a Discord (Posible error de formato): {e}")

def mock_instagram_api(handle):
    print(f"   🔎 Analizando: {handle}...")
    time.sleep(1) 
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2)
    }

def process_unverified_users():
    try:
        response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
        users = response.data
    except Exception as e:
        print(f"❌ Error DB: {e}")
        return

    if not users: return 

    print(f"🚀 Encontrados {len(users)} pendientes.")

    for user in users:
        user_id = user.get('id')
        role = user.get('role')
        full_name = user.get('full_name') or "Usuario"
        
        # FIX: Si no hay columna email, ponemos un texto por defecto para que Discord no falle
        email = user.get('email')
        if not email:
            email = "No visible (Auth)"

        print(f"👉 Procesando: {full_name} ({role})")

        # --- CASO 1: MARCA ---
        if role == 'brand':
            try:
                # 1. Verificar en DB
                supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
                print(f"   ✅ Marca Verificada en DB.")
                
                # 2. Enviar a Discord (Ahora con email seguro)
                send_discord_alert(
                    "🏢 Nueva Marca", 
                    f"**{full_name}** ha sido verificada.", 
                    8388863, # Morado
                    [{"name": "Estado", "value": "Verificado ✅", "inline": True}]
                )
                print("   📨 Alerta enviada.")
            except Exception as e:
                print(f"   ❌ Error Marca: {e}")

        # --- CASO 2: INFLUENCER ---
        elif role == 'influencer':
            handle = user.get('instagram_handle') or user.get('tiktok_handle')
            
            if not handle:
                candidate = full_name.strip()
                if " " not in candidate:
                    handle = candidate
                    if not handle.startswith('@'): handle = f"@{handle}"
                    print(f"   🔧 Auto-corrección: Handle '{handle}'")
                    supabase.table('profiles').update({'instagram_handle': handle}).eq('id', user_id).execute()
                else:
                    print("   ⚠️ Nombre con espacios, saltando.")
                    continue

            social_data = mock_instagram_api(handle)
            if social_data:
                try:
                    supabase.table('profiles').update({
                        "is_verified": True,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).eq('id', user_id).execute()
                    
                    print(f"   ✅ {handle} verificado.")
                    
                    send_discord_alert(
                        "🚀 Influencer Verificado", 
                        f"Perfil: **{handle}**", 
                        16753920, 
                        [{"name": "Seguidores", "value": str(social_data['followers']), "inline": True}]
                    )
                except Exception as e:
                    print(f"   ❌ Error update: {e}")

if __name__ == "__main__":
    while True:
        process_unverified_users()
        time.sleep(10)