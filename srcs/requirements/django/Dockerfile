# my_django_app/Dockerfile
FROM python:3.9

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install dependencies
COPY ./tools/requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app/transcendence
RUN python manage.py makemigrations
RUN python manage.py migrate

WORKDIR /app

# Expose port 8000 for the Gunicorn server
EXPOSE 8000

# Run Gunicorn
CMD ["uvicorn", "transcendence.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
