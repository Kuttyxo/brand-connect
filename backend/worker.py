import os
import time
import random
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURACIÓN ---
load_dotenv()

URL = os.environ.get("SUPABASE_URL")
# IMPORTANTE: Aquí debe leer la llave maestra, no la anon
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 
WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")

# Validación de seguridad antes de arrancar
if not URL or not KEY:
    print("❌ ERROR FATAL: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env")
    print("ℹ️  El worker necesita la llave 'service_role' para poder editar usuarios.")
    exit()

try:
    supabase: Client = create_client(URL, KEY)
    print("🤖 BrandConnect Worker INICIADO (Modo Admin) 🚀")
except Exception as e:
    print(f"❌ Error conectando a Supabase: {e}")
    exit()

# --- FUNCIONES ---

def send_discord_alert(title, description, color, fields):
    if not WEBHOOK_URL: 
        print("⚠️ No hay Webhook de Discord configurado.")
        return
        
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
    print(f"   🔎 Consultando Instagram para: {handle}...")
    time.sleep(1) # Simula tiempo de red
    # Si el usuario pone "fake" en su instagram, simulamos que no existe
    if "fake" in str(handle).lower(): return None
    
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2)
    }

def process_unverified_users():
    # 1. Buscamos usuarios NO verificados
    try:
        response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
        users = response.data
    except Exception as e:
        print(f"❌ Error leyendo base de datos: {e}")
        return

    if not users:
        return # No hay nadie nuevo, silencio...

    print(f"🚀 Encontrados {len(users)} usuarios sin verificar.")

    for user in users:
        # --- DATOS CRUDOS ---
        user_id = user.get('id')
        role = user.get('role')
        email = user.get('email')
        full_name = user.get('full_name')
        
        print(f"👉 Procesando: {full_name} ({role})")

        # --- LÓGICA DE MARCA ---
        if role == 'brand':
            print(f"   🏢 Verificando Marca...")
            
            # INTENTO DE ACTUALIZACIÓN
            try:
                # Actualizamos PRIMERO para evitar bucles si falla Discord
                data = supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
                
                # Si llegamos aquí, se guardó en la DB. Ahora avisamos.
                send_discord_alert(
                    "🏢 Nueva Marca Registrada",
                    "Una nueva empresa se ha unido y ha sido verificada.",
                    8388863, # Morado
                    [
                        {"name": "Empresa", "value": full_name or "Sin nombre", "inline": True},
                        {"name": "Email", "value": email, "inline": True}
                    ]
                )
                print("   ✅ Marca verificada exitosamente.")

            except Exception as e:
                print(f"   ❌ ERROR CRÍTICO: No se pudo verificar la marca. Revisa permisos RLS. Error: {e}")

        # --- LÓGICA DE INFLUENCER ---
        elif role == 'influencer':
            handle = user.get('social_handle')
            if not handle:
                print(f"   ⚠️ Influencer sin Instagram. Saltando.")
                continue

            # Analizamos perfil
            social_data = mock_instagram_api(handle)
            
            if social_data:
                try:
                    # Actualizamos en DB
                    supabase.table('profiles').update({
                        "is_verified": True,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).eq('id', user_id).execute()
                    
                    send_discord_alert(
                        "🚀 Nuevo Influencer",
                        f"Perfil analizado: {handle}",
                        16753920, # Naranja
                        [
                            {"name": "Usuario", "value": handle, "inline": True},
                            {"name": "Seguidores", "value": str(social_data['followers']), "inline": True}
                        ]
                    )
                    print(f"   ✅ Influencer {handle} verificado.")
                except Exception as e:
                    print(f"   ❌ ERROR CRÍTICO actualizando Influencer: {e}")

# --- EJECUCIÓN ---
if __name__ == "__main__":
    while True:
        process_unverified_users()
        print("⏳ Esperando 10s...")
        time.sleep(10)