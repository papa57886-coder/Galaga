from django.db import models

class Puntuacion(models.Model):
    nombre = models.CharField(max_length=50)
    score = models.IntegerField()
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} - {self.score}"