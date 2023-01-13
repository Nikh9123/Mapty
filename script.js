'use strict';

// prettier-ignore

class Workout {
  //fields
  id = (Date.now() + '').slice(-10);
  date = new Date();
  clicks = 0 ;

  constructor(coords, distance, duration) {
    //class properties
    this.coords = coords; //[longitude , latitude]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  _setDiscription(){
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.discription = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
  click(){
    this.clicks++ ;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = 'running';
    this.calcPace();
    this._setDiscription();
  }

  calcPace() {
    //define  in min/km
    this.pace = this.duration / this.distance;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.type = 'cycling';
    this.calcSpeed();
    this._setDiscription();
  }

  calcSpeed() {
    //define in km/hr
    this.speed = this.distance / (this.duration / 60);
  }
}
// const run = new Running([39,-12] , 5.2,24 , 178)
// const cycle = new Cycling([39,-12] , 25,95 , 523)
// console.log(run , cycle);

//⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
//APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');

//taking inputs 
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  //private properties
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {

    //get user's poition 
    this._getPosition();

    //Get data from local storage 
    this._getLocalStorage();

    //attach event handlers 
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    //=> using third party geoloctaion library (leaflet) to get user loaction
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //this function handle any error
          alert('could not get your loaction 😢');
        }
      );
    }
  }

  _loadMap(position) {
    //success load map handler function
    //taking positions out from the object of navigator.geolocation
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    
    //calling here to load pins or loaction for previous stored workouts
    //map loads before the getLocalStorage 
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);

    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //empty inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    //checking valid inputs
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault(); //preventing the deafault

    //Get the data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if workout is running , create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //check if data  is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if workout is cycling , create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //check if data  is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    //hide form and clear input fields
    this._hideForm();

    // set loclal storage to all workouts 
    this._setLocalStorage();


  }

  _renderWorkoutMarker(workout) {
    // console.log(lat, lng);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `     ${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.discription}
      `
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
 <li class="workout workout--${workout.type}" data-id="${workout.id}">
 <h2 class="workout__title">${workout.discription}</h2>
 <div class="workout__details">
   <span class="workout__icon">${
     workout.type === 'running' ? '🏃‍♂️' : '🚴'
   }</span>
   <span class="workout__value">${workout.distance}</span>
   <span class="workout__unit">km</span>
 </div>
 <div class="workout__details">
   <span class="workout__icon">⏱</span>
   <span class="workout__value">${workout.duration}</span>
   <span class="workout__unit">min</span>
 </div>
 `;

    if (workout.type === 'running')
      html += `
  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">👣</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
  `;

    if (workout.type === 'cycling')
      html += `
    <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">&#x1F3CB</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    //using the public interface 
    // workout.click() ;
  }

  _setLocalStorage(){
    localStorage.setItem('workouts' , JSON.stringify(this.#workouts));
  }

  _getLocalStorage(){
    const data = JSON.parse(localStorage.getItem('workouts'));

    if(!data) return ;

    this.#workouts = data ;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    })
  }

  reset(){
    localStorage.removeItem('workouts');
    location.reload();
  }


}

const app = new App();
// JSON.stringify() convert object to string
// JSON.parse() convert to array like object
