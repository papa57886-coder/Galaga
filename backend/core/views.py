import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Puntuacion

@csrf_exempt #disable for now 
def guardar_puntuacion(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            Puntuacion.objects.create(
                nombre=data.get('nombre', 'Anónimo'),
                score=data.get('score', 0)
            )
            return JsonResponse({'mensaje': 'Puntuación guardada exitosamente'}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método no permitido'}, status=405)