'use strict';

const express = require('express');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

require('dotenv').config();

app.use(cors());

app.get('/location', (req, res) => {
  searchToLatLong(req.query.data)
    .then(location => res.send(location))
    .catch(error => handleError(error, res));
});

app.get('/weather', getWeather);

app.get('/yelp', getYelp);

app.get('/movies', getMovies);

function Location(res, query) {
  this.latitude = res.body.results[0].geometry.location.lat;
  this.longitude = res.body.results[0].geometry.location.lng;
  this.formatted_query = res.body.results[0].formatted_address;
  this.search_query = query;
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString();
}

function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}

function Movies(data) {
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w370_and_h556_bestv2/${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.released_on;
} 

function searchToLatLong(query) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${
    process.env.GEOCODE_API_KEY}`;

  return superagent
    .get(url)
    .then(res => {
      return new Location(res, query);
    })
    .catch(error => handleError(error));
}

function getWeather(req, res) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;

  return superagent
    .get(url)
    .then(result => {
      const weatherInfo = result.body.daily.data.map(day => {
        return new Weather(day);
      });
      // console.log(Weather);
      res.send(weatherInfo);
    })
    .catch(error => handleError(error));
}

function getYelp(req, res) {
  const url = `https://api.yelp.com/v3/businesses/search?location=${req.query.data.search_query}`

  return superagent
    .get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then( result => {
      const foodInfo = result.body.businesses.map(food => {
        return new Yelp(food)
      });
      res.send(foodInfo);
    })
    .catch(error => handleError(error));
}

function getMovies(req, res) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIEDB_API_KEY}&query=${req.query.data.search_query}`;

  return superagent
    .get(url)
    .then(result => {
      const movieInfo = result.body.results.map(movie => {
        return new Movies(movie);
      })
      res.send(movieInfo);
    })
    .catch(error => handleError(error));
}

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('sorry, something broke');
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
