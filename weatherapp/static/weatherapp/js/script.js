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
    const weatherSummaryImg = document.querySelector('.weather-summary-img');
    const tempTxt = document.querySelector('.temp-txt');
    const conditionTxt = document.querySelector('.condition-txt');
    const humidityValueTxt = document.querySelector('.humidity-value-txt');
    const windValueTxt = document.querySelector('.wind-value-txt');
    const sunriseValueTxt = document.querySelector('.sunrise-value-txt');
    const sunsetValueTxt = document.querySelector('.sunset-value-txt');
    const pressureValueTxt = document.querySelector('.pressure-value-txt');

    // Create spinner (same as your original code)
    const spinner = document.createElement('div');
    spinner.style.display = 'none';
    spinner.innerHTML = `<div style="width:20px; height:20px; border:2px solid white; border-top:2px solid transparent; border-radius:50%; animation: spin 1s linear infinite; margin-left: 10px;"></div>`;
    document.querySelector('.input-container').appendChild(spinner);

    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    `;
    document.head.appendChild(style);


    console.log("App loaded!");
    
    // Function to update UI with weather data
    function updateWeatherUI(data) {
        weatherInfoSection.style.display = '';
        searchCityMessage.style.display = 'none';
        notFoundMessage.style.display = 'none';

        countryTxt.textContent = data.city.name;
        currentDateTxt.textContent = new Date(data.list[0].dt * 1000).toLocaleDateString('en-GB',
            { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }); // Ensure UTC matches API
        weatherSummaryImg.src = `https://openweathermap.org/img/wn/${data.list[0].weather[0].icon}@2x.png`;
        weatherSummaryImg.alt = data.list[0].weather[0].description;
        tempTxt.textContent = `${Math.round(data.list[0].temp.day)}° / ${Math.round(data.list[0].temp.min)}° C`;
        conditionTxt.textContent = data.list[0].weather[0].main;
        humidityValueTxt.textContent = `${data.list[0].humidity}%`;
        windValueTxt.textContent = `${data.list[0].speed} m/s`;
        sunriseValueTxt.textContent = new Date(data.list[0].sunrise * 1000).toLocaleTimeString('en-GB',
            { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });
        sunsetValueTxt.textContent = new Date(data.list[0].sunset * 1000).toLocaleTimeString('en-GB',
            { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });
        pressureValueTxt.textContent = data.list[0].pressure;

        // Update forecast items
        const forecastContainer = document.querySelector('.forecast-items-container');
        forecastContainer.innerHTML = ''; // Clear previous forecast

        // data.list[0] is today, so forecast starts from data.list[1] for the next days
        // The original HTML had 9 forecast items. The API returns 10 days (today + 9 forecast days).
        for (let i = 1; i < data.list.length && i <= 9; i++) { // Loop for up to 9 forecast days
            const forecast = data.list[i];
            const forecastItemDiv = document.createElement('div');
            forecastItemDiv.classList.add('forecast-item');

            const date = new Date(forecast.dt * 1000).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' });
            const iconUrl = `https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`;
            const condition = forecast.weather[0].main;
            const temp = `${Math.round(forecast.temp.day)}° / ${Math.round(forecast.temp.min)}°C`;

            forecastItemDiv.innerHTML = `
                <h3 class="regular-txt">${date}</h3>
                <img src="${iconUrl}" alt="${condition}" class="forecast-item-img">
                <h3 class="regular-txt">${condition}</h3>
                <h5>${temp}</h5>
            `;
            forecastContainer.appendChild(forecastItemDiv);
        }
    }

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

    // Initial state: show search city message
    weatherInfoSection.style.display = 'none';
    notFoundMessage.style.display = 'none';
    searchCityMessage.style.display = '';
});