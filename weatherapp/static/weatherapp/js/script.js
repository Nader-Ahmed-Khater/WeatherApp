document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const searchBtn = document.querySelector('.search-btn');
    const cityInput = document.querySelector('.city-input');
    const weatherInfoSection = document.querySelector('.weather-info');
    const searchCityMessage = document.querySelector('.search-city.section-message');
    const notFoundMessage = document.querySelector('.not-found.section-message');

    // Weather display elements
    const countryTxt = document.querySelector('.country-txt');
    const currentDateTxt = document.querySelector('.current-date-txt');
    // --- NEW: Select the local time element ---
    const localTimeTxt = document.querySelector('.local-time-txt');
    // --- END NEW ---
    const weatherSummaryImg = document.querySelector('.weather-summary-img');
    const tempTxt = document.querySelector('.temp-txt');
    const conditionTxt = document.querySelector('.condition-txt');
    const humidityValueTxt = document.querySelector('.humidity-value-txt');
    const windValueTxt = document.querySelector('.wind-value-txt');
    const sunriseValueTxt = document.querySelector('.sunrise-value-txt');
    const sunsetValueTxt = document.querySelector('.sunset-value-txt');
    const pressureValueTxt = document.querySelector('.pressure-value-txt');

    // ... (spinner and autocompleteTimer declarations remain)
    let autocompleteTimer;

    // Function to update UI with weather data
    const updateWeatherUI = (data) => {
        // --- NEW: Access current and forecast data from the combined response ---
        const currentWeatherData = data.current;
        const forecastData = data.forecast;
        const localTime = data.local_time;
        // const timezoneOffsetSeconds = data.timezone_offset_seconds; // If you need offset in JS
        // --- END NEW ---

        // Update main weather info
        countryTxt.textContent = `${currentWeatherData.name}, ${currentWeatherData.sys.country}`;

        // Get current date (still good to get this locally or from API 'dt' timestamp for consistency)
        const currentDate = new Date(); // Or new Date(currentWeatherData.dt * 1000); for API's timestamp
        currentDateTxt.textContent = currentDate.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

        // --- NEW: Update local time ---
        localTimeTxt.textContent = localTime;
        // --- END NEW ---

        weatherSummaryImg.src = `https://openweathermap.org/img/wn/${currentWeatherData.weather[0].icon}@2x.png`;
        weatherSummaryImg.alt = currentWeatherData.weather[0].description;
        // --- NEW: Use currentWeatherData for temp, not forecastData[0] ---
        tempTxt.textContent = `${Math.round(currentWeatherData.main.temp)}°C`;
        conditionTxt.textContent = currentWeatherData.weather[0].description;
        // --- END NEW ---
        humidityValueTxt.textContent = `${currentWeatherData.main.humidity}%`;
        windValueTxt.textContent = `${currentWeatherData.wind.speed}m/s`;
        pressureValueTxt.textContent = `${currentWeatherData.main.pressure}hPa`;

        // Sunrise and Sunset (convert from UTC to city's local time)
        // OpenWeatherMap provides sunrise/sunset in UTC Unix timestamps.
        // We'll use the timezone offset passed from Django to display them correctly.
        const sunriseUTC = new Date(currentWeatherData.sys.sunrise * 1000);
        const sunsetUTC = new Date(currentWeatherData.sys.sunset * 1000);

        // Function to format time based on timezone offset
        // This is a more robust way to display times with a specific offset in JS
        const formatTimeWithOffset = (dateUTC, offsetSeconds) => {
            const localDate = new Date(dateUTC.getTime() + offsetSeconds * 1000);
            return localDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true // For AM/PM format
            });
        };

        sunrizeValueTxt.textContent = formatTimeWithOffset(sunriseUTC, data.timezone_offset_seconds);
        sunsetValueTxt.textContent = formatTimeWithOffset(sunsetUTC, data.timezone_offset_seconds);


        // Update 9-day forecast
        const forecastContainer = document.querySelector('.forecast-items-container');
        forecastContainer.innerHTML = ''; // Clear previous forecast items

        // Start from day 1 for the forecast (index 0 is current day in forecast list)
        // Loop from the second day (index 1) of the forecast for the 9-day display
        for (let i = 1; i < forecastData.list.length; i++) {
            const daily = forecastData.list[i];
            const date = new Date(daily.dt * 1000); // Convert Unix timestamp to Date object

            const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
            const icon = daily.weather[0].icon;
            const condition = daily.weather[0].description;
            const tempDay = Math.round(daily.temp.day);
            const tempMin = Math.round(daily.temp.min);

            const forecastItemHTML = `
                <div class="forecast-item">
                    <h3 class="regular-txt">${dayName}</h3>
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${condition}">
                    <h3 class="regular-txt">${condition}</h3>
                    <h5>${tempDay}° / ${tempMin}° C</h5>
                </div>
            `;
            forecastContainer.insertAdjacentHTML('beforeend', forecastItemHTML);
        }

        // Show weather info and hide messages
        weatherInfoSection.style.display = '';
        searchCityMessage.style.display = 'none';
        notFoundMessage.style.display = 'none';
        spinner.style.display = 'none';
    };

    // Weather search function
    async function searchWeather(cityNameInput) {
        const cityName = cityNameInput || cityInput.value.trim();
        if (!cityName) return;

        // Hide autocomplete box immediately on search
        autoCompleteBox.style.display = 'none'; 
        // Show spinner, hide messages
        spinner.style.display = 'inline-block';
        searchBtn.disabled = true;
        weatherInfoSection.style.display = 'none';
        searchCityMessage.style.display = 'none';
        notFoundMessage.style.display = 'none';

        try {
            // Note: Adjust the URL based on your Django project's URL configuration
            // If your app is at '/weather/', the API endpoint will be '/weather/api/weather/'
            // If your app is at root '/', it will be '/api/weather/'
            // const response = await fetch(`/weather/api/weather/?city=${encodeURIComponent(cityName)}`);
            const response = await fetch(`/api/weather/?city=${encodeURIComponent(cityName)}`); // If app at root

            if (response.ok) {
                const data = await response.json();
                if (data.error) { // Handle errors returned in JSON by our Django view
                    console.error("API Error:", data.error);
                    weatherInfoSection.style.display = 'none';
                    searchCityMessage.style.display = 'none';
                    notFoundMessage.style.display = '';
                } else {
                    updateWeatherUI(data);
                }
            } else {
                console.error("Fetch Error:", response.statusText);
                weatherInfoSection.style.display = 'none';
                searchCityMessage.style.display = 'none';
                notFoundMessage.style.display = '';
            }
        } catch (error) {
            console.error('Network or other error:', error);
            weatherInfoSection.style.display = 'none';
            searchCityMessage.style.display = 'none';
            notFoundMessage.style.display = '';
        } finally {
            spinner.style.display = 'none';
            searchBtn.disabled = false;
        }
    }

    // Click event
    searchBtn.addEventListener('click', () => searchWeather());

    // Press Enter event
    cityInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            searchWeather();
        }
    });

    // AUTOCOMPLETE FEATURE
    const autoCompleteBox = document.createElement('ul');
    // Styling for autoCompleteBox (same as your original code)
    autoCompleteBox.style.position = 'absolute';
    autoCompleteBox.style.top = '50px'; // Adjust as needed based on input height
    autoCompleteBox.style.width = '100%';
    autoCompleteBox.style.backgroundColor = 'rgba(0,0,0,0.7)';
    autoCompleteBox.style.borderRadius = '0 0 10px 10px';
    autoCompleteBox.style.listStyle = 'none';
    autoCompleteBox.style.padding = '0';
    autoCompleteBox.style.margin = '0';
    autoCompleteBox.style.maxHeight = '150px';
    autoCompleteBox.style.overflowY = 'auto';
    autoCompleteBox.style.zIndex = '1000';
    autoCompleteBox.style.display = 'none';
    document.querySelector('.input-container').appendChild(autoCompleteBox);

    cityInput.addEventListener('input', async () => {
        const query = cityInput.value.trim();
        autoCompleteBox.innerHTML = '';

        if (query.length < 2) { // Min characters to trigger autocomplete
            autoCompleteBox.style.display = 'none';
            return;
        }

        // Show spinner for autocomplete (optional, can reuse main spinner or create a smaller one)
        // For simplicity, we'll skip a dedicated autocomplete spinner here.

        try {
            // Adjust URL based on your Django project's URL configuration
            // const response = await fetch(`/weather/api/cities/?query=${encodeURIComponent(query)}`);
            const response = await fetch(`/api/cities/?query=${encodeURIComponent(query)}`); // If app at root

            if (response.ok) {
                const cities = await response.json();
                if (cities.error) {
                    console.error("Autocomplete API Error:", cities.error);
                    autoCompleteBox.style.display = 'none';
                    return;
                }

                cities.forEach(city => {
                    const li = document.createElement('li');
                    li.textContent = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
                    li.style.padding = '10px';
                    li.style.cursor = 'pointer';
                    li.style.color = 'white'; // Ensure text is visible on dark background

                    li.addEventListener('mouseenter', () => {
                        li.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    });
                    li.addEventListener('mouseleave', () => {
                        li.style.backgroundColor = 'transparent';
                    });

                    li.addEventListener('click', () => {
                        cityInput.value = city.name; // Use the main city name for the weather search
                        autoCompleteBox.style.display = 'none';
                        searchWeather(city.name); // Search immediately
                    });
                    autoCompleteBox.appendChild(li);
                });

                autoCompleteBox.style.display = cities.length > 0 ? 'block' : 'none';
            } else {
                console.error("Autocomplete Fetch Error:", response.statusText);
                autoCompleteBox.style.display = 'none';
            }
        } catch (error) {
            console.error('Autocomplete Network or other error:', error);
            autoCompleteBox.style.display = 'none';
        }
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', function(event) {
        if (!cityInput.contains(event.target) && !autoCompleteBox.contains(event.target)) {
            autoCompleteBox.style.display = 'none';
        }
    });
// Modify searchWeather function to handle the new combined response structure
    const searchWeather = async (cityName) => {
        spinner.style.display = 'block';
        weatherInfoSection.style.display = 'none';
        searchCityMessage.style.display = 'none';
        notFoundMessage.style.display = 'none';
        autoCompleteBox.style.display = 'none'; // Hide autocomplete box immediately

        try {
            const response = await fetch(`/api/weather/?city=${encodeURIComponent(cityName)}`);
            const data = await response.json();

            if (data.error) {
                notFoundMessage.style.display = '';
                searchCityMessage.style.display = 'none';
                weatherInfoSection.style.display = 'none';
                spinner.style.display = 'none';
                console.error("API Error:", data.error);
                return;
            }

            updateWeatherUI(data); // Pass the combined data to update UI

        } catch (error) {
            console.error('Network or other error:', error);
            notFoundMessage.style.display = ''; // Show not found message on network error
            searchCityMessage.style.display = 'none';
            weatherInfoSection.style.display = 'none';
            spinner.style.display = 'none';
        }
    };
    // Initial state: show search city message
    weatherInfoSection.style.display = 'none';
    notFoundMessage.style.display = 'none';
    searchCityMessage.style.display = '';
});