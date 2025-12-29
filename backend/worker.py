import os
import time
import random
import requests
import schedule
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
    print("🤖 BrandConnect Worker V5 (Stats + Verificator) INICIADO 🚀")
except Exception as e:
    print(f"❌ Error conectando a Supabase: {e}")
    exit()

# --- FUNCIONES AUXILIARES ---

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
    except Exception:
        pass

def mock_instagram_api(handle):
    # Simula la API de Instagram
    return {
        "followers": random.randint(1000, 50000),
        "engagement": round(random.uniform(1.5, 8.5), 2)
    }

# --- TAREA 1: VERIFICAR USUARIOS NUEVOS (Tu lógica original) ---
def process_unverified_users():
    try:
        response = supabase.table('profiles').select("*").eq('is_verified', False).execute()
        users = response.data
    except Exception as e:
        print(f"❌ Error DB (Verificación): {e}")
        return

    if not users: return 

    print(f"🔍 Verificando {len(users)} usuarios pendientes...")

    for user in users:
        user_id = user.get('id')
        role = user.get('role')
        full_name = user.get('full_name') or "Usuario"
        
        # --- CASO 1: MARCA ---
        if role == 'brand':
            try:
                supabase.table('profiles').update({'is_verified': True}).eq('id', user_id).execute()
                print(f"   🏢 Marca verificada: {full_name}")
                send_discord_alert("🏢 Nueva Marca", f"**{full_name}** verificada.", 8388863, [{"name": "Status", "value": "OK", "inline": True}])
            except Exception as e:
                print(f"   ❌ Error Marca: {e}")

        # --- CASO 2: INFLUENCER ---
        elif role == 'influencer':
            handle = user.get('instagram_handle') or user.get('tiktok_handle')
            
            # Auto-fix nombre si no hay handle
            if not handle and " " not in full_name:
                handle = f"@{full_name}"
                supabase.table('profiles').update({'instagram_handle': handle}).eq('id', user_id).execute()

            if handle:
                social_data = mock_instagram_api(handle)
                try:
                    # Actualizamos perfil
                    supabase.table('profiles').update({
                        "is_verified": True,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).eq('id', user_id).execute()
                    
                    # 🔥 IMPORTANTE: Creamos el PRIMER punto del gráfico
                    supabase.table('stats_snapshots').insert({
                        "user_id": user_id,
                        "followers_count": social_data['followers'],
                        "engagement_rate": social_data['engagement']
                    }).execute()

                    print(f"   🚀 Influencer verificado: {handle}")
                    send_discord_alert("🚀 Influencer Verificado", f"Perfil: **{handle}**", 16753920, [{"name": "Seguidores", "value": str(social_data['followers']), "inline": True}])
                except Exception as e:
                    print(f"   ❌ Error update: {e}")

# --- TAREA 2: REGISTRAR CRECIMIENTO DIARIO (La nueva lógica) ---
def record_daily_stats():
    print("📈 Iniciando registro de estadísticas diarias...")
    
    # 1. Traer solo influencers VERIFICADOS
    try:
        response = supabase.table('profiles').select('*').eq('role', 'influencer').eq('is_verified', True).execute()
        influencers = response.data
    except Exception as e:
        print(f"❌ Error DB (Stats): {e}")
        return

    if not influencers: return

    for user in influencers:
        # Simulación de crecimiento orgánico (entre 10 y 100 seguidores nuevos)
        current_followers = user.get('followers_count', 0) or 0
        organic_growth = random.randint(10, 100)
        new_total = current_followers + organic_growth
        
        # Variación leve de engagement
        current_engagement = user.get('engagement_rate', 0.0) or 0.0
        new_engagement = max(0, min(10, current_engagement + random.uniform(-0.2, 0.2)))

        try:
            # A) Guardar en el Historial (Snapshot)
            supabase.table('stats_snapshots').insert({
                "user_id": user['id'],
                "followers_count": new_total,
                "engagement_rate": round(new_engagement, 2)
            }).execute()

            # B) Actualizar el Perfil (Total actual)
            supabase.table('profiles').update({
                "followers_count": new_total,
                "engagement_rate": round(new_engagement, 2)
            }).eq('id', user['id']).execute()

            print(f"   ✅ {user.get('full_name')}: {current_followers} -> {new_total} (+{organic_growth})")
            
        except Exception as e:
            print(f"   ❌ Error guardando stats de {user.get('id')}: {e}")

# --- SCHEDULER (Gestor de Tiempos) ---

# 1. Verificación: Rápida (cada 10 segundos)
schedule.every(10).seconds.do(process_unverified_users)

# 2. Estadísticas: Lenta (Normalmente cada 24h)
# PARA DEMO: Lo pondremos cada 30 segundos para que veas el gráfico moverse en vivo
schedule.every(30).seconds.do(record_daily_stats) 

# --- LOOP PRINCIPAL ---
if __name__ == "__main__":
    print("⏱️  Worker corriendo. Presiona Ctrl+C para detener.")
    
    # Ejecutar una vez al inicio para poblar datos
    process_unverified_users()
    record_daily_stats() 

    while True:
        schedule.run_pending()
        time.sleep(1)