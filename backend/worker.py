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
    print("🤖 BrandConnect Worker V2 INICIADO 🚀")
    if not WEBHOOK_URL:
        print("⚠️ ADVERTENCIA: No hay DISCORD_WEBHOOK_URL. No llegarán notificaciones.")
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
    print(f"   🔎 Consultando métricas simuladas para: {handle}...")
    time.sleep(1) 
    if "fake" in str(handle).lower(): return None
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2)
    }

def process_unverified_users():
    try:
        # Traemos SOLO los no verificados
        response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
        users = response.data
    except Exception as e:
        print(f"❌ Error leyendo base de datos: {e}")
        return

    if not users: return 

    print(f"🚀 Encontrados {len(users)} usuarios pendientes.")

    for user in users:
        user_id = user.get('id')
        role = user.get('role')
        email = user.get('email') or "No email"
        full_name = user.get('full_name') or "Usuario"
        
        print(f"👉 Procesando: {full_name} ({role})")

        # --- CASO 1: MARCA ---
        if role == 'brand':
            try:
                # Verificamos la marca
                supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
                
                print(f"   ✅ Marca '{full_name}' marcada como verificada en DB.")
                
                send_discord_alert(
                    "🏢 Nueva Marca Registrada",
                    f"La empresa **{full_name}** se ha unido a la plataforma.",
                    8388863, # Morado
                    [{"name": "Email", "value": email, "inline": True}]
                )
                print("   📨 Notificación enviada a Discord.")

            except Exception as e:
                print(f"   ❌ Error procesando marca: {e}")

        # --- CASO 2: INFLUENCER ---
        elif role == 'influencer':
            # INTELIGENCIA: Buscar handle en columnas O en el nombre
            handle = user.get('instagram_handle') or user.get('tiktok_handle')
            
            # Si no hay handle en las columnas, miramos si el nombre empieza con @
            if not handle and full_name.startswith('@'):
                print(f"   💡 Detectado handle en el nombre: {full_name}")
                handle = full_name
                # Guardamos este descubrimiento en la columna correcta para el futuro
                supabase.table('profiles').update({'instagram_handle': handle}).eq('id', user_id).execute()

            if not handle:
                print(f"   ⚠️ No se encontró handle (ni en columnas ni nombre con @). Saltando.")
                continue

            # Simulamos análisis
            social_data = mock_instagram_api(handle)
            
            if social_data:
                try:
                    # Guardamos métricas y verificamos
                    supabase.table('profiles').update({
                        "is_verified": True,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).eq('id', user_id).execute()
                    
                    send_discord_alert(
                        "🚀 Nuevo Influencer Verificado",
                        f"Perfil analizado: **{handle}**",
                        16753920, # Naranja
                        [
                            {"name": "Usuario", "value": full_name, "inline": True},
                            {"name": "Seguidores", "value": f"{social_data['followers']:,}", "inline": True},
                            {"name": "Engagement", "value": f"{social_data['engagement']}%", "inline": True}
                        ]
                    )
                    print(f"   ✅ Influencer {handle} verificado y notificado.")
                except Exception as e:
                    print(f"   ❌ Error actualizando Influencer: {e}")

# --- EJECUCIÓN ---
if __name__ == "__main__":
    while True:
        process_unverified_users()
        # print("⏳ Esperando 10s...") # Comentado para no spamear la consola, descomentar si quieres
        time.sleep(10)