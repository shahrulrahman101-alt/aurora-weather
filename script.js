const $ = (id) => document.getElementById(id);
let isFahrenheit = false;
let latestWeather = null;
let latestForecast = null;

const weatherCodes = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Dense drizzle","🌧️"],
  61:["Slight rain","🌧️"],63:["Moderate rain","🌧️"],65:["Heavy rain","🌧️"],71:["Slight snow","🌨️"],73:["Snow","❄️"],75:["Heavy snow","❄️"],
  80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],95:["Thunderstorm","⛈️"],96:["Thunderstorm with hail","⛈️"],99:["Thunderstorm with hail","⛈️"]
};
const describe = code => weatherCodes[code] || ["Variable conditions","🌤️"];
const temp = c => isFahrenheit ? Math.round(c * 9 / 5 + 32) : Math.round(c);
const unit = () => isFahrenheit ? "°F" : "°C";
const dayName = date => new Date(date + "T12:00:00").toLocaleDateString("en-US",{weekday:"short"});
const showMessage = text => { $("message").textContent=text; $("message").classList.add("show"); setTimeout(()=>$("message").classList.remove("show"),3000); };

async function searchCity(name) {
  if (!name.trim()) return;
  $("weatherPanel").classList.add("loading");
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error("Could not search for that city.");
    const geo = await geoResponse.json();
    if (!geo.results?.length) throw new Error("City not found. Try another spelling.");
    const place = geo.results[0];
    await loadWeather(place);
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    $("weatherPanel").classList.remove("loading");
  }
}

async function loadWeather(place) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&hourly=visibility&forecast_days=5&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data is unavailable right now.");
  const data = await response.json();
  latestWeather = {place,data};
  renderWeather();
}

function renderWeather() {
  if (!latestWeather) return;
  const {place,data}=latestWeather, c=data.current, d=data.daily;
  const [label,icon]=describe(c.weather_code);
  $("cityName").textContent = `${place.name}${place.admin1 ? ", "+place.admin1 : ""}`;
  $("currentDate").textContent = new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  $("temperature").textContent = temp(c.temperature_2m);
  $("degree").textContent = unit();
  $("condition").textContent = label;
  $("feelsLike").textContent = temp(c.apparent_temperature)+unit();
  $("highLow").textContent = `H: ${temp(d.temperature_2m_max[0])}${unit()}  L: ${temp(d.temperature_2m_min[0])}${unit()}`;
  $("humidity").textContent = c.relative_humidity_2m+"%";
  $("wind").textContent = Math.round(c.wind_speed_10m)+" km/h";
  $("uv").textContent = d.uv_index_max[0].toFixed(1);
  const vis = data.hourly?.visibility?.[0];
  $("visibility").textContent = vis == null ? "-- km" : (vis/1000).toFixed(1)+" km";
  $("weatherArt").innerHTML = `<div class="sun"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div>`;
  if (c.weather_code >= 45 && c.weather_code !== 0) $("weatherArt").style.filter="drop-shadow(0 15px 24px #0003) saturate(.8)";
  else $("weatherArt").style.filter="";
  $("forecast").innerHTML = d.time.map((date,i)=>{
    const [desc,emoji]=describe(d.weather_code[i]);
    return `<article class="forecast-card" style="animation-delay:${i*80}ms">
      <div class="forecast-day">${i===0?"Today":dayName(date)}</div>
      <div class="forecast-icon">${emoji}</div>
      <div class="forecast-desc">${desc}</div>
      <div class="forecast-temps"><span>${temp(d.temperature_2m_max[i])}°</span><span>${temp(d.temperature_2m_min[i])}°</span></div>
    </article>`;
  }).join("");
}

$("searchForm").addEventListener("submit", e=>{e.preventDefault();searchCity($("cityInput").value);});
$("unitToggle").addEventListener("click",()=>{isFahrenheit=!isFahrenheit;$("unitToggle").innerHTML=isFahrenheit?"°C <span>/</span> <strong>°F</strong>":"<strong>°C</strong> <span>/</span> °F";renderWeather();});

// Start with Dhaka; users can search for any city.
searchCity("Dhaka");