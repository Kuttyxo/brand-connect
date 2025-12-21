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
    print("🤖 BrandConnect Worker V3 (AGRESIVO) INICIADO 🚀")
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
        requests.post(WEBHOOK_URL, json=data)
    except Exception as e:
        print(f"❌ Error enviando alerta a Discord: {e}")

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
        email = user.get('email')
        
        print(f"👉 Procesando: {full_name} ({role})")

        # --- CASO 1: MARCA ---
        if role == 'brand':
            try:
                supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
                print(f"   ✅ Marca Verificada.")
                send_discord_alert("🏢 Nueva Marca", f"**{full_name}** verificada.", 8388863, [{"name": "Email", "value": email, "inline": True}])
            except Exception as e:
                print(f"   ❌ Error Marca: {e}")

        # --- CASO 2: INFLUENCER ---
        elif role == 'influencer':
            handle = user.get('instagram_handle') or user.get('tiktok_handle')
            
            # LÓGICA AGRESIVA: Si no hay handle, usamos el nombre
            if not handle:
                # Quitamos espacios en blanco por si acaso
                candidate = full_name.strip()
                
                # Si el nombre NO tiene espacios (ej: "k_.andree"), asumimos que es el handle
                if " " not in candidate:
                    handle = candidate
                    # Si le falta la arroba, se la ponemos
                    if not handle.startswith('@'):
                        handle = f"@{handle}"
                    
                    # Guardamos el cambio en la DB para arreglar el perfil
                    print(f"   🔧 Auto-corrección: Nombre '{full_name}' convertido a handle '{handle}'")
                    supabase.table('profiles').update({'instagram_handle': handle}).eq('id', user_id).execute()
                else:
                    print("   ⚠️ El nombre tiene espacios y no parece un usuario. Saltando.")
                    continue

            # Analizar y Verificar
            social_data = mock_instagram_api(handle)
            if social_data:
                try:
                    supabase.table('profiles').update({
                        "is_verified": True,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).eq('id', user_id).execute()
                    
                    print(f"   ✅ {handle} verificado ({social_data['followers']} seguidores).")
                    
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