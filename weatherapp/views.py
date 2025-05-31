# weatherapp/views.py

from django.shortcuts import render
from django.http import JsonResponse
import requests
import os

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

    weather_api_url = f"https://api.openweathermap.org/data/2.5/forecast/daily?q={city_name}&cnt=10&appid={OPENWEATHERMAP_API_KEY}&units=metric"

    try:
        response = requests.get(weather_api_url)
        response.raise_for_status()
        data = response.json()

        if data.get("cod") != "200":
            return JsonResponse({'error': data.get("message", "City not found or API error")}, status=404)

        return JsonResponse(data)

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)


def get_city_suggestions(request):
    """
    API view to fetch city suggestions for autocomplete.
    Filters to prioritize distinct major cities.
    """
    query = request.GET.get('query')
    if not query:
        return JsonResponse({'error': 'Query not provided'}, status=400)

    geo_api_url = f"https://api.openweathermap.org/geo/1.0/direct?q={query}&limit=10&appid={OPENWEATHERMAP_API_KEY}" # Increased limit to 10 to get more candidates

    try:
        response = requests.get(geo_api_url)
        response.raise_for_status()
        raw_cities = response.json()

        # Filtering logic
        # We want to prioritize unique cities and avoid very specific small places if possible.
        # Since the OWM Geocoding Direct API doesn't provide a 'type' (e.g., city, town, village),
        # we'll use heuristics:
        # 1. Store unique city names to avoid duplicates (e.g., 'London, UK' vs 'London, ON, CA')
        # 2. Prioritize results with a 'state' as they often represent larger administrative areas.
        
        filtered_cities = []
        seen_cities = set() # To store formatted city strings to avoid duplicates

        for city in raw_cities:
            # Create a consistent identifier for each city
            city_identifier = f"{city.get('name', '')}-{city.get('state', '')}-{city.get('country', '')}".lower()

            if city_identifier not in seen_cities:
                # Basic check: only include if it has a name and country
                if city.get('name') and city.get('country'):
                    # We can add more complex logic here if needed.
                    # For example, filtering based on 'state' presence might implicitly filter smaller places.
                    # For now, let's ensure uniqueness and basic validity.
                    filtered_cities.append({
                        'name': city['name'],
                        'state': city.get('state', ''), # 'state' might not always be present
                        'country': city['country'],
                        'lat': city['lat'],
                        'lon': city['lon'],
                    })
                    seen_cities.add(city_identifier)

        # You might want to limit the final number of suggestions returned
        # For instance, if limit was 5 initially, slice to 5
        final_suggestions = filtered_cities[:5] # Take only the top 5 distinct results

        return JsonResponse(final_suggestions, safe=False)

    except requests.exceptions.RequestException as e:
        return JsonResponse({'error': str(e)}, status=500)
    except Exception as e:
        return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)