from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

@csrf_exempt
def register(request):
    if request.method == 'POST':
        # Extraire les données du formulaire
        username = request.POST.get('username')
        password = request.POST.get('password')
        email = request.POST.get('email')

        # Valider les données
        if not username or not password or not email:
            return JsonResponse({'error': 'Tous les champs sont requis'}, status=400)

        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Le nom d\'utilisateur existe déjà'}, status=400)

        # Créer un nouvel utilisateur
        user = User.objects.create(
            username=username,
            password=make_password(password),
            email=email
        )

        return JsonResponse({'message': 'Inscription réussie'})
    else:
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
