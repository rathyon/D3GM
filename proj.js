var game_titles, scores;

d3.csv("average.csv").then(function (data) {
    game_titles = data;

    gen_scatterplot();
});

d3.csv("scores_by_year.csv").then(function (data){
    scores = data;
    gen_heatmap();
})


function gen_heatmap(){
    var margin = {top: 30, right: 50, bottom: 40, left:40};
    var w = 750 - margin.right - margin.left;
    var h = 300 - margin.top - margin.bottom;
    var gridSize = 15;
    var labels = d3.range(10)

    var svg = d3.select("#heatmap")
  	            .append("svg")
  	            .attr("width", w + margin.top + margin.bottom)
  	            .attr("height", h + margin.left + margin.right)
  	            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var div = d3.select("body").append("div")	
                .attr("class", "tooltip")				
                .style("opacity", 0);

    /*var colours = d3.scaleLinear()
  	                .domain(d3.range(1, 11, 1))
                    .range(["#87cefa", "#86c6ef", "#85bde4", "#83b7d9", "#82afce", "#80a6c2", "#7e9fb8", "#7995aa", "#758b9e", "#708090"]);*/

    var color = d3.scaleOrdinal()
                    .domain(d3.range(9))
                    .range(d3.schemeBlues[9].map(function(c){
                        c = d3.rgb(c);
                        c.opacity = 0.8;
                        return c;
                    }));
                      
    var tensLabels = svg.selectAll(".tensLabel")
                       .data(labels)
                       .enter()
                       .append("text")
                       .text(function(d) { return d; })
                       .attr("x", 0)
                       .attr("y", function(d, i) { return i * gridSize; })
                       .style("text-anchor", "end")
                       .attr("transform", "translate(-6," + gridSize / 1.5 + ")");

    var decimalLabels = svg.selectAll(".decimalLabel")
                       .data(labels)
                       .enter()
                       .append("text")
                       .text(function(d) { return d; })
                       .attr("x", function(d, i) { return i * gridSize; })
                       .attr("y", 0)
                       .style("text-anchor", "middle")
                       .attr("transform", "translate(" + gridSize / 2 + ", -6)");

    scores.forEach(function(d) {
            d.year = +d.year;
            d.x = +d.x;
            d.y = +d.y;
            d.val = +d.val;
    });
    
        // group data by location
        var nest = d3.nest()
          .key(function(d) { return d.year; })
          .entries(scores);
    
        // array of locations in the data
        var years = nest.map(function(d) { return d.key; });
        var currentYearIndex = 15;
    
        // function to create the initial heatmap
        var drawHeatmap = function(year) {
    
          // filter the data to return object of location of interest
          var selectYear = nest.find(function(d) {
            return d.key == year;
          });
    
          var heatmap = svg.selectAll(".score")
            .data(selectYear.values)
            .enter()
            .append("rect")
            .attr("x", function(d) { return (d.x) * gridSize; })
            .attr("y", function(d) { return (d.y) * gridSize; })
            .attr("width", gridSize)
            .attr("height", gridSize)
            .style("stroke", "white")
            .style("stroke-opacity", 0.6)
            .style("fill", function(d) { return color(d.val); })
            .on("mouseover", function(d) {		
                div.transition()		
                    .duration(200)		
                    .style("opacity", .9);		
                div	.html(d.val.toFixed(0))	
                    .style("left", (d3.event.pageX) + "px")		
                    .style("top", (d3.event.pageY) + "px");	
                })					
            .on("mouseout", function(d) {		
                div.transition()		
                    .duration(500)		
                    .style("opacity", 0);	
            });
          }
        drawHeatmap(years[currentYearIndex]);

}

function gen_scatterplot() {
    var margin = {top: 30, right: 50, bottom: 40, left:40};
	var width = 700 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    var radius = 4;
    
    game_titles.forEach(function(d) {
        d.Sales = +d.Sales;
    });

    var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

	var svg = d3.select('#sale-title')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
	    .append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xScale = d3.scaleLinear()
        .domain([0,game_titles[game_titles.length-1].Average])
		.range([0, width]);

	var yScale = d3.scaleLinear()
        .domain([d3.max(game_titles, function(d){return d.Sales}),0])
        .range([0,height]);
        

    var xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(game_titles.length/2);;

	var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(game_titles.length/2);;

    // adding axes is also simpler now, just translate x-axis to (0,height) and it's alread defined to be a bottom axis. 
	svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .attr('class', 'x axis')
        .call(xAxis);

    // y-axis is translated to (0,0)
    svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y axis')
        .call(yAxis);

    var bubble = svg.selectAll('.bubble')
        .data(game_titles)
        .enter().append('circle')
        .attr('class', 'bubble')
        .attr('cx', function(d){return xScale(d.Average);})
        .attr('cy', function(d){ return yScale(d.Sales); })
        .attr('r', radius)
        .attr("title", function(d) {return d.Sales;})
        .on("mouseover", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html(d.Sales.toFixed(2))	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY) + "px");	
            })					
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });
    
}