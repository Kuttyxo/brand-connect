# 🚀 BrandConnect

> **Plataforma SaaS de Influencer Marketing con Analytics en Tiempo Real.**
> Conectando marcas con micro-influencers de alto impacto a través de contratos seguros y métricas transparentes.

![Status](https://img.shields.io/badge/Status-En_Producción-green)
![Stack](https://img.shields.io/badge/Stack-Next.js_14_|_Supabase_|_Python-blue)

## 🌟 Características Principales

### 🎨 Para Creadores (Influencers)
- **Dashboard en Vivo:** Gráficos de crecimiento de audiencia actualizados en tiempo real.
- **Billetera Digital:** Gestión de ingresos con estados (En Custodia / Disponible) y solicitud de retiros.
- **Portafolio Multimedia:** Integración visual de trabajos previos.
- **Chat de Negociación:** Comunicación directa con marcas para cerrar acuerdos.

### 🏢 Para Marcas
- **Gestión de Campañas:** Creación de ofertas, presupuesto y requisitos.
- **Analytics de Campaña:** Gráficos de ROI (Vistas/Engagement) específicos por campaña.
- **Contratación One-Click:** Flujo simplificado para aceptar propuestas y generar contratos (`agreements`).
- **Validación de Entregas:** Aprobación de contenido antes de liberar el pago.

### 🛡️ Administración & Seguridad
- **Panel de Super Admin:** Resolución de disputas (Juez Digital) y Tesorería (Aprobación de pagos).
- **Pagos en Escrow:** El dinero se retiene hasta que el trabajo se completa satisfactoriamente.
- **Worker Inteligente (Python):** Bot autónomo que simula tráfico, métricas sociales y actualiza estadísticas periódicamente.

---

## 🛠️ Stack Tecnológico

### Frontend (App Web)
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Gráficos:** Recharts (Data Visualization)
- **Iconos:** Lucide React
- **Despliegue:** Vercel

### Backend (BaaS)
- **Base de Datos:** PostgreSQL (vía Supabase)
- **Auth:** Supabase Auth (Email/Password, Magic Link)
- **Realtime:** Supabase Realtime (Websockets para Chat y Gráficos)
- **Storage:** Supabase Storage (Avatares y Evidencia)

### Data Worker (Bot)
- **Lenguaje:** Python 3
- **Librerías:** `supabase`, `faker`, `schedule`
- **Función:** Generación de métricas simuladas y actualizaciones de estado en segundo plano.
- **Hosting:** Render / Railway

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu máquina:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/brand-connect.git](https://github.com/tu-usuario/brand-connect.git)
cd brand-connect
```

### 2. Configurar el Frontend
```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env.local
# (Rellena NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY)

# Correr servidor de desarrollo
npm run dev
```
Visita http://localhost:3000


### 3. Configurar el Worker (Python)

Para ver los gráficos en tiempo real:
```bash
# Ir a la carpeta del backend (si aplica) o raíz
pip install supabase schedule faker

# Ejecutar el worker
python backend/worker.py
```

## 💳 Flujo de Pago (Escrow)
- **Acuerdo:**La Marca contrata -> Se genera un Agreement (Estado: pending).

- **Custodia:** El dinero pasa a estado held en la billetera del Influencer.

- **Entrega:** Influencer sube evidencia -> Marca revisa.

- **Liberación:** Marca aprueba -> El dinero pasa a released (Disponible para retiro).

- **Retiro:** Influencer solicita Payout -> Admin aprueba transferencia.


## 👤 Autor
Desarrollado con ❤️ por Cristóbal Rodríguez (Kuttyxo).