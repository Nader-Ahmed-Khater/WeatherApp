# weatherapp/views.py

from django.shortcuts import render
from django.http import JsonResponse
import requests
import os
import datetime # Import for handling dates and times
import pytz # Import for timezone handling

OPENWEATHERMAP_API_KEY = os.environ.get('OPENWEATHERMAP_API_KEY', 'e8ba44fd53b38c1ab0423f2635591f3c')


def index(request):
    """
    Renders the main weather page.
    """
    return render(request, 'weatherapp/index.html')


def get_weather_data(request):
    """
    API view to fetch weather data from OpenWeatherMap for current weather and forecast.
    """
    city_name = request.GET.get('city')
    if not city_name:
        return JsonResponse({'error': 'City name not provided'}, status=400)

    # --- Fetch Current Weather Data for accurate current conditions and timezone ---
    current_weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={city_name}&appid={OPENWEATHERMAP_API_KEY}&units=metric"

    # --- Fetch Daily Forecast Data for the 9-day forecast ---
    daily_forecast_url = f"https://api.openweathermap.org/data/2.5/forecast/daily?q={city_name}&cnt=10&appid={OPENWEATHERMAP_API_KEY}&units=metric"

    try:
        # Fetch current weather data
        current_response = requests.get(current_weather_url)
        current_response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        current_data = current_response.json()

        # OpenWeatherMap current weather API returns 'cod' as an integer (e.g., 200, 404)
        if current_data.get("cod") != 200:
            return JsonResponse({'error': current_data.get("message", "City not found or API error for current weather")}, status=current_data.get("cod", 404))

        # Calculate local time based on the timezone offset provided by the current weather API
        timezone_offset_seconds = current_data.get('timezone', 0) # Offset in seconds from UTC
        # Create a timezone object using the offset
        city_timezone = datetime.timezone(datetime.timedelta(seconds=timezone_offset_seconds))

        # Get the current time in UTC from the 'dt' (Unix timestamp) provided by OpenWeatherMap
        current_utc_dt = datetime.datetime.fromtimestamp(current_data['dt'], tz=datetime.timezone.utc)
        # Convert UTC time to the city's local time
        city_local_time = current_utc_dt.astimezone(city_timezone)

        # Format the local time for display
        formatted_local_time = city_local_time.strftime('%I:%M %p') # e.g., "03:30 PM"


        # Fetch daily forecast data
        forecast_response = requests.get(daily_forecast_url)
        forecast_response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        forecast_data = forecast_response.json()

        # OpenWeatherMap daily forecast API returns 'cod' as a string "200"
        if forecast_data.get("cod") != "200":
            return JsonResponse({'error': forecast_data.get("message", "City not found or API error for forecast")}, status=forecast_data.get("cod", 404))

        # Combine all relevant data into a single JSON response
        combined_data = {
            'current': current_data,
            'forecast': forecast_data,
            'local_time': formatted_local_time,
            'timezone_offset_seconds': timezone_offset_seconds # Send offset for JS sunrise/sunset conversion
        }
        return JsonResponse(combined_data)

    except requests.exceptions.RequestException as e:
        # Catch network-related errors (e.g., DNS failure, refused connection)
        return JsonResponse({'error': f'Network error or invalid API call: {str(e)}'}, status=500)
    except Exception as e:
        # Catch any other unexpected errors
        return JsonResponse({'error': f'An unexpected server error occurred: {str(e)}'}, status=500)


def get_city_suggestions(request):
    # This view remains unchanged as it's separate from weather data fetching.
    query = request.GET.get('query')
    if not query:
        return JsonResponse({'error': 'Query not provided'}, status=400)

    geo_api_url = f"https://api.openweathermap.org/geo/1.0/direct?q={query}&limit=10&appid={OPENWEATHERMAP_API_KEY}"

    try:
        response = requests.get(geo_api_url)
        response.raise_for_status()
        raw_cities = response.json()

        filtered_cities = []
        seen_cities = set()

        for city in raw_cities:
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