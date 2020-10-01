var express = require('express');
var router = express.Router();
const axios = require('axios');
const jsdom = require('jsdom');
const moment = require('moment');

const { JSDOM } = jsdom;

const createCellObj = function(row) {
  return {
    numCode: row.cells[0].innerHTML,
    charCode: row.cells[1].innerHTML,
    nominal: row.cells[2].innerHTML,
    name: row.cells[3].innerHTML,
    value: row.cells[4].innerHTML,
  }
};

const sortVolute = function(item) {
  return item.charCode === 'USD' || item.charCode === 'EUR';
}

const getCoursesArray = function(data) {
  const dom = new JSDOM(data);
  const rowsArray = Array.from(dom.window.document.getElementsByTagName("table"));
  let result = [];
  rowsArray.forEach((row) => {
    const cells = Array.from(row.querySelectorAll('tr'))
        .map(item => createCellObj(item));

    result = cells;
  });

  result.shift()
  const response = result.filter(sortVolute);
  return response;
}


/* GET users listing. */
router.get('/', function(req, res, next) {

  const dateArray = [];

  for (let i = 0; i < 30; i++) {
    date = moment().subtract(i, 'days').format('DD.MM.YYYY');
    dateArray.push(date)
  }

  const axiosGetArray = dateArray.map( date => {
    return axios.get(`https://www.cbr.ru/currency_base/daily/?UniDbQuery.Posted=True&UniDbQuery.To=${date}`)
  });


  axios.all(axiosGetArray).then(axios.spread((...responces) => {
    const resultArray = [];

    responces.forEach((responce) => {
      resultArray.push({
          date: responce.request.path.slice(-10),
          usd: getCoursesArray(responce.data)[0],
          eur: getCoursesArray(responce.data)[1],
        });
    });

    console.log(resultArray);
    res.send(resultArray);
  })).catch(error => {
    console.log(error);
  });

});

module.exports = router;
