let cannabisURL = 'http://localhost:3000/api'
let countriesURL = 'http://localhost:3000/geojson'

let cannabisData
let countriesGeojson

let canvas = d3.select('#canvas')
let width = document.querySelector('#canvas').clientWidth
let height = document.querySelector('#canvas').clientHeight
let tooltip = d3.select('#tooltip')



let drawMap = () => {
    canvas.selectAll('path')
        .data(countriesGeojson)
        .enter()
        .append('path')
        .attr('d', d3.geoPath().projection(projection))
        .attr('class', 'country')
        .attr('fill', (el) => {
            let cannabisEl = cannabisData.find((item) =>{
                return item['country'] === el.properties.name
            })
            if(cannabisEl == undefined){
                console.log('No data for : '+ el.properties.name)
                return 'black'
            }else{
                if(cannabisEl['country'] == 'United States') return 'orange'
                else if(cannabisEl['recreational'].toLowerCase().includes('illegal')) return 'tomato'
                else if(cannabisEl['recreational'].toLowerCase().includes('legal')) return 'lightgreen'
                else return 'orange'
            }
        })
        .attr('data-country', el => el.properties.name)
        .attr('data-recreational', (el) => {
            let cannabisEl = cannabisData.find((item) =>{
                return item['country'] === el.properties.name
            })
            if(cannabisEl !== undefined) return cannabisEl['recreational']
        })
        .attr('data-medical', (el) => {
            let cannabisEl = cannabisData.find((item) =>{
                return item['country'] === el.properties.name
            })
            if(cannabisEl !== undefined) return cannabisEl['medical']
        })
        .attr('data-notes', (el) => {
            let cannabisEl = cannabisData.find((item) =>{
                return item['country'] === el.properties.name
            })
            if(cannabisEl !== undefined) return cannabisEl['notes']
        })
        .on('mouseover', (el) => {
            tooltip.transition().style('visibility', 'visible')
            let cannabisEl = cannabisData.find((item) =>{
                return item['country'] === el.target.dataset.country
            })
            tooltip.text((cannabisEl !== undefined ? cannabisEl['country'] : (el.target.dataset.country || 'Unknown') ) + ' - ' + (cannabisEl !== undefined ? cannabisEl['recreational'] : 'Unknown'))
        })
        .on('mousemove', (el) => {
            tooltip.style('transform', `translate(${el.clientX - (width/2)}px, ${(el.clientY + 20) - (height/2)}px)`)
        })
        .on('mouseout', () => {
            tooltip.transition().style('visibility', 'hidden')
        })
}







// Scale and center
const projection = d3.geoMercator()
    .translate([width / 2, height / 2])
    .scale((width - 1) / 2 / Math.PI);

// Fetch & Format data
d3.json(countriesURL).then((data, error) => {
    error ? console.log(error) : countriesGeojson = topojson.feature(data, data.objects.countries).features
    d3.json(cannabisURL).then((data, error) => {
        error ? console.log(error) : cannabisData = data
        drawMap()
    })
})

// Zoom
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', zoomed);

function zoomed(event) {
    canvas.selectAll('path') // To prevent stroke width from scaling
        .attr('transform', event.transform);
}

canvas.call(zoom)