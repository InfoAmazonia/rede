var _ = require('underscore');
var moment = require('moment');
var validator = require('validator');
var messaging = require('../../lib/helpers/messaging');
var mongoose = require('mongoose');
var Measurement = mongoose.model('Measurement')
var Sensor = mongoose.model('Sensor')

exports.list = function(req, res) {
  var page = req.query['page'];
  var perPage = req.query['perPage'];

  /* Validate query parameters */
  if (page) {
    if (!validator.isInt(page))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      page = parseInt(page) - 1;
  } else page = 0;

  if (perPage){
    if (!validator.isInt(perPage))
      return res.status(400).json(messaging.error('invalid_pagination'));
    else
      perPage = parseInt(perPage);
  } else perPage = 20;

  /* Mongoose Options */
  var options = {
    perPage: perPage,
    page: page
  };

  options.criteria = {
    sensor: req.sensor._id,
    parameter: req.parameter._id
  }

  // properties to return
  options.select = '_id value collectedAt';

  Measurement.list(options, function (err, measurements) {
    if (err)
      return res.status(500).json(messaging.error('internal_error'));

    /* Send response */
    Measurement.count(options.criteria).exec(function (err, count) {
      res.status(200).json({
        count: count,
        perPage: perPage,
        page: page + 1,
        sensor: req.sensor,
        parameter: req.parameter,
        measurements: measurements
      });
    });
  });
}

exports.saveBatch = function(req, res) {
  var body = req.body;

  var data = req.body.data;
  if (!data) return res.status(400).json({messages: ['missing data parameter']});

  Sensor.findOne(body.sensor_id, function(err, sensor){
    if (err) return res.sendStatus(500);
    sensor.saveMeasurementBatch(body.data, function(err, measurements){
      if (err) return res.sendStatus(500);
      else res.status(200).json({measurements: measurements});
    });
  });
}