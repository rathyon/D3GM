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
    var margin = {top: 40, right: 50, bottom: 40, left:40};
    var w = 420 - margin.right - margin.left;
    var h = 440 - margin.top - margin.bottom;
    var gridSize = 32;
    var labels = d3.range(10)

    var svg = d3.select("#heatmap")
  	            .append("svg")
  	            .attr("width", w + margin.top + margin.bottom)
  	            .attr("height", h + margin.left + margin.right)
  	            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var div = d3.select("body").append("div")	
                .attr("class", "tip")
                .style("left", 0)
                .style("top", 0)				
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
                       .text(function(d) { return "." + d; })
                       .attr("x", function(d, i) { return i * gridSize; })
                       .attr("y", 0)
                       .style("text-anchor", "middle")
                       .attr("transform", "translate(" + gridSize / 2 + ", -6)");

    svg.append('g')
        .attr('transform', 'translate(0,' + h + ')')
        .attr('class', 'xAxis')
        .append("text")
        .classed("label", true)
        .attr("x", w/2 - 10)
        .attr("y", -margin.bottom + 15)
        .style("font", "14px Helvetica")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Decimal");

    svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'yAxis')
        .append("text")
        .classed("label", true)
        .attr("transform", "rotate(-90)")
        .attr("x", -h/2 + 20)
        .attr("y", -40)
        .attr("dy", "1.5em")
        .style("font", "14px Helvetica")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")
        .text("Unit");

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
    var margin = {top: 30, right: 50, bottom: 40, left:70};
	var width = 620 - margin.left - margin.right;
    var height = 490 - margin.top - margin.bottom;
    var radius = 4;
    
    game_titles.forEach(function(d) {
        d.Sales = +d.Sales;
    });

    var div = d3.select("body").append("div")	
      .attr("class", "tooltip")
      .style("left", 0)
      .style("top", 0)	
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
        .ticks(game_titles.length/4);;

	var yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(game_titles.length/5);;

    // adding axes is also simpler now, just translate x-axis to (0,height) and it's alread defined to be a bottom axis. 
	svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .attr('class', 'xAxis')
        .call(xAxis)
        .append("text")
        .classed("label", true)
        .attr("x", width / 2)
        .attr("y", margin.bottom - 5)
        .style("font", "14px Helvetica")
        .style("text-anchor", "middle")
        .text("Length of Title");

    // y-axis is translated to (0,0)
    svg.append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'yAxis')
        .call(yAxis)
        .append("text")
        .classed("label", true)
        .attr("transform", "rotate(-90)")
        .attr("x", -height/2)
        .attr("y", -75)
        .attr("dy", "1.5em")
        .style("font", "14px Helvetica")
        .style("text-anchor", "middle")
        .text("Sales (millions of dollars)");   
        

    var bubble = svg.selectAll('.bubble')
        .data(game_titles)
        .enter().append('circle')
        .attr('class', 'bubble')
        .attr('cx', function(d){return xScale(d.Average);})
        .attr('cy', function(d){ return yScale(d.Sales); })
        .attr('r', radius)
        .attr("title", function(d) {return d.Sales;})
        .style('fill', function(d){
            return d.Type==="Game" ? "#3fbcff" : "#32CD32";
        })
        .style('stroke', function(d){
            return d.Type==="Game" ? "#325e82" : "#008000";
        })
        .on("mouseover", function(d) {	
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div	.html("Sales: " + d.Sales.toFixed(2) + "<br>" + "Length: " + d.Average)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY) + "px");	
            })			
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });
    
    var legend = svg.selectAll(".legend")
        .data(["Games", "Movies"])
        .enter().append("g")
        .classed("legend", true)
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        });
    
    legend.append("circle")
        .attr("cx", width - 20)
        //.attr("width", 12)
        //.attr("height", 12)
        .attr('r', radius)
        .style("fill", function(d){
            return d==="Games" ? "#3fbcff" : "#32CD32";
        });

    legend.append("text")
        .attr("x", width -5)
        .attr("dy", ".40em")
        .style("font", "12px Helvetica")
        .text(function(d) {
            return d;
        });
}