# weatherapp/views.py

from django.shortcuts import render
from django.http import JsonResponse
import requests
import os
import datetime 
import pytz 

OPENWEATHERMAP_API_KEY = os.environ.get('OPENWEATHERMAP_API_KEY', 'e8ba44fd53b38c1ab0423f2635591f3c')

def index(request):
    return render(request, 'weatherapp/index.html')

def get_weather_data(request):
    city_name = request.GET.get('city')
    if not city_name:
        return JsonResponse({'error': 'City name not provided'}, status=400)

    # --- NEW: Fetch Current Weather Data for timezone and accurate current conditions ---
    current_weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name}&appid={OPENWEATHERMAP_API_KEY}&units=metric"
    # --- END NEW ---

    # Existing: Fetch Daily Forecast Data
    daily_forecast_url = f"https://api.openweathermap.org/data/2.5/forecast/daily?q={city_name}&cnt=10&appid={OPENWEATHERMAP_API_KEY}&units=metric"

    try:
        # --- NEW: Fetch current weather data first ---
        current_response = requests.get(current_weather_url)
        current_response.raise_for_status()
        current_data = current_response.json()

        if current_data.get("cod") != 200: # OpenWeatherMap returns integer for success here
            return JsonResponse({'error': current_data.get("message", "City not found or API error for current weather")}, status=current_data.get("cod", 404))

        timezone_offset_seconds = current_data.get('timezone', 0) # Offset in seconds from UTC
        city_timezone = datetime.timezone(datetime.timedelta(seconds=timezone_offset_seconds))
        # Get current UTC time from the current weather data, then apply offset
        # OpenWeatherMap 'dt' is in UTC Unix timestamp
        current_utc_dt = datetime.datetime.fromtimestamp(current_data['dt'], tz=datetime.timezone.utc)
        city_local_time = current_utc_dt.astimezone(city_timezone)

        # You can format this here or send components to JS
        formatted_local_time = city_local_time.strftime('%I:%M %p') # e.g., 03:30 PM
        # --- END NEW ---


        # Existing: Fetch daily forecast data
        forecast_response = requests.get(daily_forecast_url)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        if forecast_data.get("cod") != "200": # OpenWeatherMap returns string for success here
            return JsonResponse({'error': forecast_data.get("message", "City not found or API error for forecast")}, status=404)

        # Combine relevant data into a single response
        # --- NEW: Add current_data and formatted_local_time to the response ---
        combined_data = {
            'current': current_data,
            'forecast': forecast_data,
            'local_time': formatted_local_time,
            'timezone_offset_seconds': timezone_offset_seconds # Also send offset for more complex JS handling if needed
        }
        return JsonResponse(combined_data)
        # --- END NEW ---

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)


def get_city_suggestions(request):
    # ... (your existing get_city_suggestions view remains unchanged)
    # No changes needed here as it's separate from weather data fetching
    query = request.GET.get('query')
    if not query:
        return JsonResponse({'error': 'Query parameter is missing'}, status=400)

    suggestions_api_url = f"http://api.openweathermap.org/geo/1.0/direct?q={query}&limit=10&appid={OPENWEATHERMAP_API_KEY}"

    try:
        response = requests.get(suggestions_api_url)
        response.raise_for_status()
        cities = response.json()

        filtered_cities = []
        seen_cities = set() # To ensure unique city suggestions

        for city in cities:
            # Create a unique identifier (name-state-country) to handle duplicate city names
            city_identifier = f"{city.get('name', '')}-{city.get('state', '')}-{city.get('country', '')}".lower()

            if city_identifier not in seen_cities:
                if city.get('name') and city.get('country'):
                    filtered_cities.append({
                        'name': city['name'],
                        'state': city.get('state', ''),
                        'country': city['country'],
                        'lat': city['lat'],
                        'lon': city['lon'],
                    })
                    seen_cities.add(city_identifier)

        final_suggestions = filtered_cities[:5]
        return JsonResponse(final_suggestions, safe=False)

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)