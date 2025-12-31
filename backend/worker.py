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
    print("❌ ERROR: Falta configuración en .env")
    exit()

supabase: Client = create_client(URL, KEY)
print("🤖 BrandConnect Worker V6 (Full Analytics) INICIADO 🚀")

# --- FUNCIONES AUXILIARES ---
def send_discord_alert(title, description, color):
    if not WEBHOOK_URL: return
    try:
        requests.post(WEBHOOK_URL, json={
            "embeds": [{"title": title, "description": description, "color": color}]
        })
    except: pass

def mock_instagram_api(handle):
    return { "followers": random.randint(1000, 50000), "engagement": round(random.uniform(1.5, 8.5), 2) }

# --- TAREA 1: VERIFICACIÓN (Misma lógica anterior) ---
def process_unverified_users():
    try:
        users = supabase.table('profiles').select("*").eq('is_verified', False).execute().data
        if not users: return
        
        for user in users:
            uid, role, name = user['id'], user['role'], user.get('full_name', 'Usuario')
            
            if role == 'brand':
                supabase.table('profiles').update({'is_verified': True}).eq('id', uid).execute()
                print(f"   🏢 Marca verificada: {name}")
                
            elif role == 'influencer':
                handle = user.get('instagram_handle') or (f"@{name.replace(' ', '')}" if " " not in name else None)
                if handle:
                    data = mock_instagram_api(handle)
                    supabase.table('profiles').update({
                        "is_verified": True, "instagram_handle": handle,
                        "followers_count": data['followers'], "engagement_rate": data['engagement']
                    }).eq('id', uid).execute()
                    # Snapshot inicial
                    supabase.table('stats_snapshots').insert({"user_id": uid, "followers_count": data['followers'], "engagement_rate": data['engagement']}).execute()
                    print(f"   🚀 Influencer verificado: {handle}")

    except Exception as e: print(f"❌ Error Verificación: {e}")

# --- TAREA 2: CRECIMIENTO INFLUENCERS (Seguidores) ---
def record_influencer_stats():
    try:
        users = supabase.table('profiles').select('*').eq('role', 'influencer').eq('is_verified', True).execute().data
        if not users: return

        print("📈 Actualizando Influencers...")
        for user in users:
            new_total = (user.get('followers_count') or 0) + random.randint(10, 150)
            supabase.table('stats_snapshots').insert({"user_id": user['id'], "followers_count": new_total}).execute()
            supabase.table('profiles').update({"followers_count": new_total}).eq('id', user['id']).execute()
            
    except Exception as e: print(f"❌ Error Stats Influencer: {e}")

# --- TAREA 3: RENDIMIENTO DE CAMPAÑAS (MARCAS) ---
def record_brand_campaign_stats():
    try:
        # 1. Obtener todas las marcas
        brands = supabase.table('profiles').select('id, full_name').eq('role', 'brand').execute().data
        if not brands: return

        print("📊 Calculando ROI de Marcas...")
        
        for brand in brands:
            brand_id = brand['id']
            
            # 2. Buscar campañas de esta marca
            campaigns = supabase.table('campaigns').select('id').eq('brand_id', brand_id).execute().data
            if not campaigns: continue
            
            campaign_ids = [c['id'] for c in campaigns]
            
            # 3. Contar contratos COMPLETADOS o ACEPTADOS (Donde ya hay trabajo)
            # En la vida real, sumaríamos los views de los videos subidos en 'portfolio_items' o 'deliverables'
            completed_jobs = supabase.table('applications').select('*', count='exact').in_('campaign_id', campaign_ids).eq('status', 'completed').execute().count
            
            if completed_jobs > 0:
                # SIMULACIÓN: Cada trabajo completado genera ~1500 vistas nuevas por ciclo
                # Esto se acumula. En producción leeríamos views reales de la API.
                
                # Obtenemos el último registro para sumar
                last_stat = supabase.table('brand_campaign_stats').select('total_views, total_likes').eq('brand_id', brand_id).order('recorded_at', desc=True).limit(1).execute().data
                
                prev_views = last_stat[0]['total_views'] if last_stat else 0
                prev_likes = last_stat[0]['total_likes'] if last_stat else 0
                
                # Generamos tráfico nuevo basado en cuantos influencers trabajan
                new_views_traffic = completed_jobs * random.randint(500, 2000)
                new_likes_traffic = int(new_views_traffic * 0.10) # 10% likes
                
                total_views = prev_views + new_views_traffic
                total_likes = prev_likes + new_likes_traffic
                
                # Guardar Snapshot de la Marca
                supabase.table('brand_campaign_stats').insert({
                    "brand_id": brand_id,
                    "total_views": total_views,
                    "total_likes": total_likes,
                    "active_campaigns_count": len(campaigns)
                }).execute()
                
                print(f"   💰 {brand['full_name']}: {total_views} Vistas Totales (+{new_views_traffic})")

    except Exception as e: print(f"❌ Error Stats Marca: {e}")

# --- TAREA 4: ESTADÍSTICAS POR CAMPAÑA (NUEVO) 📈 ---
def record_campaign_specific_stats():
    try:
        # 1. Buscamos campañas que tengan actividad (status 'open' o con aplicaciones completadas)
        campaigns = supabase.table('campaigns').select('id, title').execute().data
        
        if not campaigns: return
        print("📊 Actualizando métricas de campañas individuales...")

        for camp in campaigns:
            camp_id = camp['id']
            
            # 2. Contamos cuántos influencers han completado trabajo en ESTA campaña
            completed_apps = supabase.table('applications').select('*', count='exact').eq('campaign_id', camp_id).eq('status', 'completed').execute().count
            
            # Si hay gente trabajando, generamos números
            if completed_apps > 0:
                # Obtener el último valor para sumar incrementalmente
                last_stat = supabase.table('campaign_stats_snapshots').select('total_views').eq('campaign_id', camp_id).order('recorded_at', desc=True).limit(1).execute().data
                current_views = last_stat[0]['total_views'] if last_stat else 0
                
                # Simulación: Entre 100 y 500 vistas nuevas por influencer activo en la campaña
                new_views = current_views + (completed_apps * random.randint(100, 500))
                new_likes = int(new_views * 0.08) # 8% likes

                supabase.table('campaign_stats_snapshots').insert({
                    "campaign_id": camp_id,
                    "total_views": new_views,
                    "total_likes": new_likes
                }).execute()
                
                print(f"   🔥 Campaña '{camp['title'][:15]}...': {new_views} Vistas")
            else:
                # Si nadie ha completado trabajo, insertamos 0 o mantenemos plano para que el gráfico no esté vacío
                supabase.table('campaign_stats_snapshots').insert({
                    "campaign_id": camp_id,
                    "total_views": 0,
                    "total_likes": 0
                }).execute()

    except Exception as e: print(f"❌ Error Campaign Stats: {e}")

# --- SCHEDULER ---
schedule.every(10).seconds.do(process_unverified_users)
schedule.every(30).seconds.do(record_influencer_stats)
schedule.every(30).seconds.do(record_brand_campaign_stats) 
schedule.every(15).seconds.do(record_campaign_specific_stats)

if __name__ == "__main__":
    print("⏱️  Worker V6 corriendo...")
    while True:
        schedule.run_pending()
        time.sleep(1)