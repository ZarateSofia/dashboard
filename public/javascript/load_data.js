import {tiempoArr, precipitacionArr, uvArr, temperaturaArr} from './static_data.js';

let fechaActual = () => new Date().toISOString().slice(0,10);

let cargarPrecipitacion = () => {

  //Obtenga la función fechaActual
  let actual = fechaActual();
  //Defina un arreglo temporal vacío
  let datos = []
  //Itere en el arreglo tiempoArr para filtrar los valores de precipitacionArr que sean igual con la fecha actual
  for (let index = 0; index < tiempoArr.length; index++) {
      const tiempo = tiempoArr[index];
      const precipitacion = precipitacionArr[index]
  
      if(tiempo.includes(actual)) {
        datos.push(precipitacion)
      }
  }
  //Con los valores filtrados, obtenga los valores máximo, promedio y mínimo
  let max = Math.max(...datos)
  let min = Math.min(...datos)
  let sum = datos.reduce((a, b) => a + b, 0);
  let prom = (sum / datos.length) || 0;
  //Obtenga la referencia a los elementos HTML con id precipitacionMinValue, precipitacionPromValue y precipitacionMaxValue
  let precipitacionMinValue = document.getElementById("precipitacionMinValue")
  let precipitacionPromValue = document.getElementById("precipitacionPromValue")
  let precipitacionMaxValue = document.getElementById("precipitacionMaxValue")
  //Actualice los elementos HTML con los valores correspondientes
  precipitacionMinValue.textContent = `Min ${min} [mm]`
  precipitacionPromValue.textContent = `Prom ${ Math.round(prom * 100) / 100 } [mm]`
  precipitacionMaxValue.textContent = `Max ${max} [mm]`
}

let cargarFechaActual = () => {
  let coleccionHTML = document.getElementsByTagName("h6");
  let tituloH6 = coleccionHTML[0];
  tituloH6.textContent = fechaActual();
}

let cargarOpenMeteo = () => {
  let URL = 'https://api.open-meteo.com/v1/forecast?latitude=-2.1962&longitude=-79.8862&daily=temperature_2m_max,temperature_2m_min,sunshine_duration&timezone=auto'; 
  fetch( URL )
    .then(responseText => responseText.json())
    .then(responseJSON => {
      //GRAFICO 1
      let plotRef = document.getElementById('plot1');
      let labels = responseJSON.daily.time;
      let dataMax = responseJSON.daily.temperature_2m_max;
      let dataMin = responseJSON.daily.temperature_2m_min;
      let config = {
        type: 'bar',
        data: {
          labels: labels, 
          datasets: [
            {
              label: 'Temperature máxima',
              data: dataMax,
              borderColor: 'rgba(11, 49, 131, 1)', 
              backgroundColor: 'rgba(11, 49, 131, 0.5)', 
              borderWidth: 3 
            },
            {
              label: 'Temperature mínma',
              data: dataMin,
              borderColor: 'rgba(45, 108, 203, 1)', 
              backgroundColor: 'rgba(45, 108, 203, 0.5)',
              borderWidth: 3 
            }
          ]
        
        }
      };
      let chart1  = new Chart(plotRef, config);

      //GRAFICO2
      let plotRef2 = document.getElementById('plot2');
      let dataSun = responseJSON.daily.sunshine_duration;
      let config2 = {
        type: 'line', // Cambiado a 'bar' para gráfico de barras
        data: {
          labels: labels, 
          datasets: [
            {
              label: 'sunshine_duration',
              data: dataSun,
              borderColor: 'rgba(34, 88, 179, 1)', 
              backgroundColor: 'rgba(34, 88, 179, 0.5)', 
              borderWidth:3,
              fill:true,
              tension:0.5
            }
          ]
        }
      };
      let chart2  = new Chart(plotRef2, config2);

    })
    .catch(console.error);
};

let parseXML = (responseText) => {

  const parser = new DOMParser();
  const xml = parser.parseFromString(responseText, "application/xml");
  let forecastElement = document.querySelector("#forecastbody")
  forecastElement.innerHTML = ''

  // Procesamiento de los elementos con etiqueta `<time>` del objeto xml
  let timeArr = xml.querySelectorAll("time")

  timeArr.forEach(time => {
      
      let from = time.getAttribute("from").replace("T", " ")

      let humidity = time.querySelector("humidity").getAttribute("value")
      let windSpeed = time.querySelector("windSpeed").getAttribute("mps")
      let precipitation = time.querySelector("precipitation").getAttribute("probability")
      let pressure = time.querySelector("pressure").getAttribute("value")
      let cloud = time.querySelector("clouds").getAttribute("all")

      let template = `
          <tr>
              <td>${from}</td>
              <td>${humidity}</td>
              <td>${windSpeed}</td>
              <td>${precipitation}</td>
              <td>${pressure}</td>
              <td>${cloud}</td>
          </tr>
      `
      //Renderizando la plantilla en el elemento HTML
      forecastElement.innerHTML += template;
  })
}

//Callback
let selectListener = async(event) => {
  let selectedCity = event.target.value;
  let cityStorage = localStorage.getItem(selectedCity);
  if (cityStorage == null) { 

      try {
        let APIkey = '416e91d83d0c681b078d967583e86a63';
        let url = `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity}&mode=xml&appid=${APIkey}`;
        let response = await fetch(url);
        let responseText = await response.text();
        parseXML(responseText);
        localStorage.setItem(selectedCity, responseText);  

      } catch (error) {
        console.log(error);
      }

  } else {
      parseXML(cityStorage);
  }

}

let loadForecastByCity = () => {
  let selectElement = document.querySelector("select");
  selectElement.addEventListener("change", selectListener);
}

let loadExternalTable=(dataXML)=>{
  const parser = new DOMParser();
  const xml = parser.parseFromString(dataXML, "text/html");
  let elementoXML= xml.querySelector('#postcontent table');
  let elementoDOM=document.getElementById('monitoreo');
  elementoDOM.innerHTML = elementoXML.outerHTML;
}

let load = async() => {
  let monitoreo_inundaciones = localStorage.getItem('monitoreo_inundaciones');
  if (monitoreo_inundaciones == null) { 

      try {
        let proxy= 'https://cors-anywhere.herokuapp.com/';
        let URL='https://www.gestionderiesgos.gob.ec/monitoreo-de-inundaciones/';
        let endpoint=proxy+URL;
        const resultado = await fetch(endpoint);
        const dataXML = await resultado.text();
        console.log("tengo permiso");
        loadExternalTable(dataXML);
        localStorage.setItem('monitoreo_inundaciones', dataXML);

      } catch (error) {
        console.log(error);
      }

  } else {
      console.log("LOCAL STORAGE");
      loadExternalTable(monitoreo_inundaciones);
  }
}

(function(){
  cargarPrecipitacion();
  cargarFechaActual();
  cargarOpenMeteo();
  loadForecastByCity();
  load();
})();


