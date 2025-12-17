import os
import time
import random
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURACIÓN ---
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
webhook_url: str = os.environ.get("DISCORD_WEBHOOK_URL")

supabase: Client = create_client(url, key)

print("🤖 BrandConnect Worker RECARGADO (Versión Debug)...")

# --- FUNCIONES ---

def send_discord_alert(title, description, color, fields):
    if not webhook_url: return
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
        requests.post(webhook_url, json=data)
    except Exception as e:
        print(f"❌ Error enviando alerta: {e}")

def mock_instagram_api(handle):
    print(f"   🔎 Consultando Instagram para: {handle}...")
    time.sleep(1) 
    if "fake" in handle.lower(): return None
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2)
    }

def process_unverified_users():
    # Buscamos usuarios NO verificados
    response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
    users = response.data

    if not users:
        return

    print(f"🚀 Encontrados {len(users)} usuarios sin verificar.")

    for user in users:
        # --- DATOS CRUDOS ---
        user_id = user.get('id')
        role = user.get('role')
        email = user.get('email')
        full_name = user.get('full_name')
        
        print(f"👉 Analizando ID: {user_id} | ROL: '{role}'")

        # --- LÓGICA DE MARCA ---
        if role == 'brand':
            print(f"   🏢 ¡ES UNA MARCA! Nombre: {full_name}")
            
            # 1. Verificar en DB
            update_response = supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
            
            # 2. Avisar a Discord (Morado)
            send_discord_alert(
                "🏢 Nueva Marca Registrada",
                "Una nueva empresa se ha unido.",
                8388863, 
                [
                    {"name": "Empresa", "value": full_name or "Sin nombre", "inline": True},
                    {"name": "Email", "value": email, "inline": True}
                ]
            )
            print("   ✅ Marca verificada y notificada.")
            continue # <--- IMPORTANTE: Pasa al siguiente usuario

        # --- LÓGICA DE INFLUENCER ---
        handle = user.get('social_handle')
        if not handle:
            print(f"   ❌ Error: El usuario es '{role}' pero no tiene Instagram. Saltando.")
            continue

        # Si llegamos aquí, es influencer y tiene handle
        social_data = mock_instagram_api(handle)
        if social_data:
            supabase.table('profiles').update({
                "is_verified": True,
                "followers_count": social_data['followers'],
                "engagement_rate": social_data['engagement']
            }).eq('id', user_id).execute()
            
            send_discord_alert(
                "🚀 Nuevo Influencer",
                f"Perfil analizado: {handle}",
                16753920,
                [
                    {"name": "Usuario", "value": handle, "inline": True},
                    {"name": "Seguidores", "value": str(social_data['followers']), "inline": True}
                ]
            )
            print(f"   ✅ Influencer {handle} procesado.")

# --- EJECUCIÓN ---
if __name__ == "__main__":
    while True:
        try:
            process_unverified_users()
        except Exception as e:
            print(f"❌ Error crítico: {e}")
        
        print("⏳ Esperando 10s...")
        time.sleep(10)