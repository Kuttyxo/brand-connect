# 1. IMAGEN BASE: Usamos Python 3.10 versión "slim" (Linux ligero, ideal para producción)
FROM python:3.10-slim

# 2. VARIABLES DE ENTORNO PARA PYTHON
# Evita que Python guarde archivos caché (.pyc) y asegura que los logs salgan rápido
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 3. DIRECTORIO DE TRABAJO
# Creamos una carpeta /app dentro del contenedor y nos metemos ahí
WORKDIR /app

# 4. DEPENDENCIAS (Capa de Caché)
# Copiamos solo el requirements.txt primero. 
# Docker es inteligente: si este archivo no cambia, no vuelve a instalar todo.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. CÓDIGO FUENTE
# Ahora copiamos el resto de tus archivos (worker.py)
COPY . .

# 6. COMANDO DE ARRANQUE
# Qué hace el contenedor cuando le das "Start"
CMD ["python", "worker.py"]