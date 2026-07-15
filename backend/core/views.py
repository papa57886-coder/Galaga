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

def obtener_top_puntuaciones(request):
    if request.method == 'GET':
        try:
            
            top_10 = Puntuacion.objects.order_by('-score')[:10]
            data = [
                {
                    'id': p.id,
                    'nombre': p.nombre,
                    'score': p.score,
                    'fecha': p.fecha.strftime('%Y-%m-%d %H:%M') if p.fecha else None
                }
                for p in top_10
            ]
            return JsonResponse(data, safe=False, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Método no permitido'}, status=405)