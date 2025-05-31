from django.urls import path
from . import views

app_name = 'weatherapp' # Namespace for URLs

urlpatterns = [
    path('', views.index, name='index'),
    path('api/weather/', views.get_weather_data, name='get_weather_data'),
    path('api/cities/', views.get_city_suggestions, name='get_city_suggestions'),
]
