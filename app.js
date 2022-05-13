const express = require('express')
const app = express()
const mongoose = require('mongoose');
const HtmlTableToJson = require('html-table-to-json');
const schedule = require('node-schedule');
const geojson = require('./countries-110m.json')


// Connect to db
const db = mongoose.connect(process.env.DB, {useNewUrlParser: true,useUnifiedTopology: true})
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Daily update data
const updateData = schedule.scheduleJob('0 0 * * *', function(fireDate){
  fetch('https://en.wikipedia.org/w/api.php?action=parse&page=Legality_of_cannabis&section=1&prop=text&format=json')
  .then(data => data.json())
  .then(json => {
    let formatString = json.parse.text['*'].replace(/\&\#(91)\;\d+\&\#(93)\;/gm, '').replace(/<div.*(Main article).*<\/div>/gm, '')
    let jsonData = HtmlTableToJson.parse(formatString)
    jsonData._results[0].forEach(el => {
      let dataJson = {              
        country: el['Country/Territory'],
        recreational: el['Recreational'],
        medical: el['Medical'],
        notes: el['Notes']
      }
      Drugs.findOne({ country: el['Country/Territory'] })
      .then(country => {
        // Country not exist
        if(!country){
          console.log('Country not exist')
          let drug = new Drugs({...dataJson})
          drug.save(error => {error ? console.log(error) : null})
        }
        // Country exist
        else{
          Drugs.updateOne({country: el['Country/Territory'] }, {...dataJson})
          .catch(error => console.log(error));
        }
      })
    })
    console.log('The data has been updated at '+ fireDate);
  })
  .catch(error => console.log(error))
  });

// data schema
const drugSchema = mongoose.Schema({
  country: {
    type: String,
    required: true,
  },
  recreational: {
    type: String,
    required: true,
  },
  medical: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  },
});
const Drugs = mongoose.model('Drugs', drugSchema);




app.use('/leaflet', express.static(__dirname + '/node_modules/leaflet/dist/'));
app.use(express.static(__dirname + '/static'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.get('/test', (req, res) => {
  fetch('https://en.wikipedia.org/w/api.php?action=parse&page=Legality_of_cannabis&section=1&prop=text&format=json')
  .then(data => data.json())
  .then(json => {
    let formatString = json.parse.text['*'].replace(/\&\#(91)\;\d+\&\#(93)\;/gm, '')
    const jsonData = HtmlTableToJson.parse(formatString)
    res.status(200).json(jsonData)
  })
})





app.get('/api', (req, res) => {
  Drugs.find()
  .then(data => res.status(200).json(data))
  .catch(error => console.log(error));
})
app.get('/geojson', (req, res) => {
  res.status(200).json(geojson)
})


app.listen(3000)