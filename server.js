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
  const url = `https://api.darksky.net/forecast/${
    process.env.WEATHER_API_KEY}/${req.query.data.latitude},${req.query.data.longitude}`;

  superagent
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

function handleError(err, res) {
  console.error(err);
  if (res) res.status(500).send('sorry, something broke');
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
