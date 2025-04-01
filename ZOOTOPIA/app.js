// DOM Elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const currentWeatherDiv = document.getElementById('current-weather');
const forecastDiv = document.getElementById('forecast');
const favoritesListDiv = document.getElementById('favorites-list');
const themeToggleBtn = document.getElementById('theme-toggle');
const unitToggleInput = document.getElementById('unit-toggle');

// Global variables
let currentCity = '';
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let isMetric = true; // true for Celsius, false for Fahrenheit

// OpenWeatherMap API key - replace with your own
const API_KEY = '8f2a049ebe3590e4c4182fb461de9a01'; // This is a public key for demo purposes

// Event Listeners
searchForm.addEventListener('submit', handleSearch);
themeToggleBtn.addEventListener('click', toggleTheme);
unitToggleInput.addEventListener('change', handleUnitChange);
document.addEventListener('DOMContentLoaded', initialize);

// Initialize the app
function initialize() {
    renderFavorites();
    // Check local storage for theme preference
    if (localStorage.getItem('darkTheme') === 'true') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Check local storage for unit preference
    if (localStorage.getItem('isMetric') === 'false') {
        isMetric = false;
        unitToggleInput.checked = true;
    }

    // Load last searched city if available
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        currentCity = lastCity;
        getWeatherData(currentCity);
    }
}

// Handle search form submission
function handleSearch(e) {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        currentCity = city;
        localStorage.setItem('lastCity', city);
        getWeatherData(city);
        cityInput.value = '';
    }
}

// Toggle between light and dark theme
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkTheme', isDark);

    if (isDark) {
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Handle unit change
function handleUnitChange() {
    isMetric = !unitToggleInput.checked;
    localStorage.setItem('isMetric', isMetric);

    // Update displayed weather if we have a city
    if (currentCity) {
        getWeatherData(currentCity);
    }
}

// Fetch weather data from API
async function getWeatherData(city) {
    try {
        // Get current weather
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${isMetric ? 'metric' : 'imperial'}&appid=${API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);

        if (!currentResponse.ok) {
            throw new Error('City not found');
        }

        const currentData = await currentResponse.json();

        // Get 5-day forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${isMetric ? 'metric' : 'imperial'}&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);

    } catch (error) {
        displayError(error.message);
    }
}

// Display current weather
function displayCurrentWeather(data) {
    const { name, main, weather, wind, sys } = data;
    const temp = Math.round(main.temp);
    const weatherIcon = weather[0].icon;
    const weatherDescription = weather[0].description;
    const tempUnit = isMetric ? '°C' : '°F';
    const speedUnit = isMetric ? 'm/s' : 'mph';

    const isFavorite = favorites.some(fav => fav.toLowerCase() === name.toLowerCase());
    const favoriteIcon = isFavorite ?
        '<i class="fas fa-star" style="color: gold;"></i>' :
        '<i class="far fa-star"></i>';

    currentWeatherDiv.innerHTML = `
        <div class="city-header">
            <h2>${name}, ${sys.country}</h2>
            <button class="favorite-btn" onclick="toggleFavorite('${name}')">${favoriteIcon}</button>
        </div>
        <div class="weather-details">
            <img src="https://openweathermap.org/img/wn/${weatherIcon}@2x.png" alt="${weatherDescription}" class="weather-icon">
            <div class="temp-container">
                <h3>${temp}${tempUnit}</h3>
                <p>${weatherDescription}</p>
            </div>
            <div class="additional-info">
                <p>Feels like: ${Math.round(main.feels_like)}${tempUnit}</p>
                <p>Humidity: ${main.humidity}%</p>
                <p>Wind: ${wind.speed} ${speedUnit}</p>
            </div>
        </div>
    `;
}

// Display 5-day forecast
function displayForecast(data) {
    // Group forecast data by day
    const dailyData = {};

    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();

        if (!dailyData[date]) {
            dailyData[date] = item;
        }
    });

    // Convert to array and take only 5 days
    const forecastArray = Object.values(dailyData).slice(0, 5);

    // Map each forecast item to HTML
    const forecastHTML = forecastArray.map(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const temp = Math.round(item.main.temp);
        const weatherIcon = item.weather[0].icon;
        const weatherDescription = item.weather[0].description;
        const tempUnit = isMetric ? '°C' : '°F';

        return `
            <div class="forecast-item">
                <h3>${date}</h3>
                <img src="https://openweathermap.org/img/wn/${weatherIcon}.png" alt="${weatherDescription}">
                <p>${temp}${tempUnit}</p>
                <p>${weatherDescription}</p>
            </div>
        `;
    }).join('');

    forecastDiv.innerHTML = forecastHTML;
}

// Toggle favorite status
function toggleFavorite(city) {
    const cityIndex = favorites.findIndex(fav => fav.toLowerCase() === city.toLowerCase());

    if (cityIndex === -1) {
        // Add to favorites
        favorites.push(city);
    } else {
        // Remove from favorites
        favorites.splice(cityIndex, 1);
    }

    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Update UI
    renderFavorites();

    // Refresh current weather to update star icon
    if (currentCity) {
        getWeatherData(currentCity);
    }
}

// Render favorites list
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesListDiv.innerHTML = '<p>No favorite cities yet</p>';
        return;
    }

    const favoritesHTML = favorites.map(city => `
        <div class="favorite-item" onclick="loadFavorite('${city}')">
            <span>${city}</span>
            <button class="remove-favorite" onclick="removeFavorite(event, '${city}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    favoritesListDiv.innerHTML = favoritesHTML;
}

// Load a favorite city
function loadFavorite(city) {
    currentCity = city;
    localStorage.setItem('lastCity', city);
    getWeatherData(city);
}

// Remove a favorite city
function removeFavorite(event, city) {
    // Prevent the click from bubbling up to the parent
    event.stopPropagation();

    const cityIndex = favorites.findIndex(fav => fav.toLowerCase() === city.toLowerCase());
    if (cityIndex !== -1) {
        favorites.splice(cityIndex, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();

        // Refresh current weather to update star icon if the current city is the one being removed
        if (currentCity.toLowerCase() === city.toLowerCase()) {
            getWeatherData(currentCity);
        }
    }
}

// Display error message
function displayError(message) {
    currentWeatherDiv.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p>Please try another city.</p>
        </div>
    `;
    forecastDiv.innerHTML = '';
}