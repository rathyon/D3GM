var game_titles, scores, regions, linechart_data;
var selectedRegion, tempRegion;

var scat_movies_enabled = true;
var scat_games_enabled = true;

var scat_games_color_inner = "#3fbcff";
var scat_games_color_outer = "#325e82";

var scat_movies_color_inner = "#32CD32";
var scat_movies_color_outer = "#008000";

var background_color = "#111111";

var year_filters = [1996, 2016];
var score_filters = new Array();

d3.csv("region_sales_obj.csv").then(function (data){
    regions = data;
    gen_treemap();
});

d3.csv("average.csv").then(function (data) {
    gen_timeline();
    game_titles = data;

    gen_scatterplot();

});

d3.csv("scores_by_year.csv").then(function (data){
    scores = data;
    gen_heatmap();
});

d3.csv("linechart.csv").then(function (data){
  linechart_data = data;
  gen_linechart();
  init_radarchart();
});





// utility function
function clamp(value, min, max){
  return Math.min(Math.max(value, min), max);
};

function gen_heatmap(){
    var margin = {top: 40, right: 50, bottom: 40, left:40};
    var w = 400 - margin.right - margin.left;
    var h = 420 - margin.top - margin.bottom;
    var gridSize = 30;
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
            .attr("id", function(d){
              return String(d.y) + "." + String(d.x);
            })
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
            })
            .on("click", function(d){
              // add / remove filter ...
              var score = this.getAttribute("id"); //format #.#
              if(!score_filters.includes(score)){
                score_filters.push(score);
              }
              else{
                score_filters.splice(score_filters.indexOf(score), 1);
              }
              console.log(score_filters);
              // redraw stuff ...

            });
          }
        drawHeatmap(years[currentYearIndex]);
}

function gen_scatterplot() {
  var margin = {top: 30, right: 50, bottom: 40, left:70};
  var width = 620 - margin.left - margin.right;
  var height = 390 - margin.top - margin.bottom;
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
    
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  var xScale = d3.scaleLinear()
    .domain([0,game_titles[game_titles.length-1].Average])
    .range([0, width]);

  var yScale = d3.scaleLinear()
    .domain([d3.max(game_titles, function(d){return d.Sales}),0])
    .range([0,height]);
    
  var xAxis = d3.axisBottom()
    .scale(xScale)
    .ticks(game_titles.length/4);

  var yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(game_titles.length/5);

  var zoom = d3.zoom()
    .scaleExtent([0, 2.5])
    .extent([[0, 0], [500, 300]])
    .on("zoom", zoomed);

  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .call(zoom);

  // adding axes is also simpler now, just translate x-axis to (0,height) and it's alread defined to be a bottom axis. 
  var gX = svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .attr('class', 'xAxis');

  gX.call(xAxis)
    .append("text")
    .classed("label", true)
    .attr("x", width / 2)
    .attr("y", margin.bottom - 5)
    .style("font", "14px Helvetica")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Length of Title");

  // y-axis is translated to (0,0)
  var gY = svg.append('g')
    .attr('transform', 'translate(0,0)')
    .attr('class', 'yAxis');

  gY.call(yAxis)
    .append("text")
    .classed("label", true)
    .attr("transform", "rotate(-90)")
    .attr("x", -height/2)
    .attr("y", -75)
    .attr("dy", "1.5em")
    .style("font", "14px Helvetica")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Sales (millions of dollars)");   

  var points_g = svg.append("g")
    .attr("clip-path", "url(#clip)")
    .classed("points_g", true);

  var bubble = points_g.selectAll('.bubble')
    .data(game_titles)
    .enter().append('circle')
    .attr('class', 'bubble')
    .attr('cx', function(d){return xScale(d.Average);})
    .attr('cy', function(d){ return yScale(d.Sales); })
    .attr('r', radius)
    .attr("title", function(d) {return d.Sales;})
    .style('fill', function(d){
      return d.Type==="Games" ? scat_games_color_inner : scat_movies_color_inner;
    })
    .style('stroke', function(d){
      return d.Type==="Games" ? scat_games_color_outer : scat_movies_color_outer; 
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
      return "translate(0," + i * 26 + ")";
    });

  legend.append("circle")
    .attr("cx", width - 20)
    .attr('r', radius+3)
    .style("fill", function(d){
      return d==="Games" ? "#3fbcff" : "#32CD32";
    })
    .on("click", function(d) {
      // if Games label was clicked
      if(d === "Games"){
        scat_games_enabled = !scat_games_enabled;
        var new_color = scat_games_enabled ? scat_games_color_inner : "#333333";

        this.setAttribute("style", "fill: " + new_color);

        var bubbles = points_g.selectAll('.bubble')
          .style("visibility", function(d){
            if(d.Type === "Games"){
              return scat_games_enabled ? "visible" : "hidden";
            }
            else{
              return scat_movies_enabled ? "visible" : "hidden";
            }
          });
      }
      else {
        scat_movies_enabled = !scat_movies_enabled;
        var new_color = scat_movies_enabled ? scat_movies_color_inner : "#333333";

        this.setAttribute("style", "fill: " + new_color);

        var bubbles = points_g.selectAll('.bubble')
          .style("visibility", function(d){
            if(d.Type === "Games"){
              return scat_games_enabled ? "visible" : "hidden";
            }
            else{
              return scat_movies_enabled ? "visible" : "hidden";
            }
          });
      }
    });

  legend.append("text")
    .attr("x", width -5)
    .attr("dy", ".40em")
    .style("font", "12px Helvetica")
    .style("font-weight", "bold")
    .text(function(d) {
        return d;
    });

  function zoomed() {
          
      var new_xScale = d3.event.transform.rescaleX(xScale);
      var new_yScale = d3.event.transform.rescaleY(yScale);
          
      gX.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
      gY.call(yAxis.scale(d3.event.transform.rescaleY(yScale)));

      bubble.data(game_titles)
              .attr('cx', function(d) {return new_xScale(d.Average)})
              .attr('cy', function(d) {return new_yScale(d.Sales)});
  }
}

var linechart = {
  data: 0,

  margin: {top: 50, right: 50, bottom: 50, left: 50},

  // initialize with trash values!
  width: 0,
  height: 0,

  // initialize with huge values
  xMin: 10000.0,
  xMax: -10000.0,
  yMin: 10000.0,
  yMax: -10000.0,

  // initialize with trash values!
  xScale: 0,
  yScale: 0,
  maxXValue: 0,
  line: 0,
  svg: 0
};


// TODO REMOVE THIS AFTER TREEMAP INTERACTION IS COMPLETE
selectedRegion = "Global";

function gen_linechart(){
  linechart.width = 600 - linechart.margin.left - linechart.margin.right;
  linechart.height = 400 - linechart.margin.top - linechart.margin.bottom;

  linechart.data = linechart_data.filter(function(d){
      return (d.Year >= year_filters[0] && d.Year <= year_filters[1])
    })  
    .sort(function(a,b){
      return a.Score_diff - b.Score_diff;
    });

  linechart.data.forEach(function(d){
    linechart.xMin = linechart.xMin > parseFloat(d.Score_diff) ? d.Score_diff : linechart.xMin;
    linechart.xMax = linechart.xMax < parseFloat(d.Score_diff) ? d.Score_diff : linechart.xMax;

    linechart.yMin = linechart.yMin > parseFloat(d.Global) ? d.Global : linechart.yMin;
    linechart.yMax = linechart.yMax < parseFloat(d.Global) ? d.Global : linechart.yMax;
  });

  linechart.maxXValue = linechart.xMin > linechart.xMax ? linechart.xMin : linechart.xMax;
  linechart.xMin = -linechart.maxXValue;
  linechart.xMax = linechart.maxXValue;

  linechart.xScale = d3.scaleLinear()
    .domain([linechart.xMin, linechart.xMax]) // input
    .range([0, linechart.width]); // output

  linechart.yScale = d3.scaleLinear()
    .domain([linechart.yMin, linechart.yMax]) // input 
    .range([linechart.height, 0]); // output

  linechart.line = d3.line()
  .x(function(d) { return linechart.xScale(d.Score_diff); }) // set the x values for the line generator
  .y(function(d) {
    var value;
    if(selectedRegion == "NA")
      value = d.NA;
    else if(selectedRegion == "EU")
      value = d.EU;
    else if(selectedRegion == "JP")
      value = d.JP;
    else if(selectedRegion == "OT")
      value = d.OT;
    else
      value = d.Global;
    return linechart.yScale(value); 
  }) // set the y values for the line generator 
  .curve(d3.curveMonotoneX) // apply smoothing to the line 

  linechart.svg = d3.select("#linechart").append("svg")
    .attr("width", linechart.width + linechart.margin.left + linechart.margin.right)
    .attr("height", linechart.height + linechart.margin.top + linechart.margin.bottom)
  .append("g")
    .attr("transform", "translate(" + linechart.margin.left + "," + linechart.margin.top + ")");

  linechart.svg.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + linechart.height + ")")
    .call(d3.axisBottom(linechart.xScale));

  linechart.svg.append("g")
    .attr("class", "yAxis")
    .attr("transform", "translate(" + linechart.width / 2 + ", 0)")
    .call(d3.axisLeft(linechart.yScale));

  linechart.svg.append("path")
    .datum(linechart.data)
    .attr("id", "valueline")
    .attr("class", "line")
    .attr("d", linechart.line)
    .attr("fill", "none")
    .attr("stroke", scat_games_color_inner)
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");
}

// code for using circles instead of a line
/** /
    // 12. Appends a circle for each datapoint 
  svg.selectAll(".dot")
      .data(linechart_data.filter(function(d){
        return (d.Year >= year_filters[0] && d.Year <= year_filters[1])
      }))
    .enter().append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d) { return xScale(d.Score_diff) })
      .attr("cy", function(d) { return yScale(d.Global) })
      .attr("fill", scat_games_color_inner)
      .attr("stroke", scat_games_color_outer)
      .attr("r", 2)
        .on("mouseover", function() { 
      });
  /**/

function update_linechart() {
  //console.log("Update linechart called");
  // reset values
  linechart.xMin = 10000.0;
  linechart.xMax = -10000.0;
  linechart.yMin = 10000.0;
  linechart.yMax = -10000.0;

  linechart.data = linechart_data.filter(function(d){
    return (d.Year >= year_filters[0] && d.Year <= year_filters[1])
  })  
  .sort(function(a,b){
    return a.Score_diff - b.Score_diff;
  });

  linechart.data.forEach(function(d){
    linechart.xMin = linechart.xMin > parseFloat(d.Score_diff) ? d.Score_diff : linechart.xMin;
    linechart.xMax = linechart.xMax < parseFloat(d.Score_diff) ? d.Score_diff : linechart.xMax;

    linechart.yMin = linechart.yMin > parseFloat(d.Global) ? d.Global : linechart.yMin;
    linechart.yMax = linechart.yMax < parseFloat(d.Global) ? d.Global : linechart.yMax;
  });

  linechart.maxXValue = linechart.xMin > linechart.xMax ? linechart.xMin : linechart.xMax;
  linechart.xMin = -linechart.maxXValue;
  linechart.xMax = linechart.maxXValue;

  linechart.xScale = d3.scaleLinear()
    .domain([linechart.xMin, linechart.xMax])
    .range([0, linechart.width]);

  linechart.yScale = d3.scaleLinear()
    .domain([linechart.yMin, linechart.yMax])
    .range([linechart.height, 0]);

  linechart.line = d3.line()
    .x(function(d) { return linechart.xScale(d.Score_diff); }) // set the x values for the line generator
     .y(function(d) {
      var value;
      if(selectedRegion == "NA")
        value = d.NA;
      else if(selectedRegion == "EU")
        value = d.EU;
      else if(selectedRegion == "JP")
        value = d.JP;
      else if(selectedRegion == "OT")
        value = d.OT;
      else
        value = d.Global;
      return linechart.yScale(value); 
    }) // set the y values for the line generator 
    //.curve(d3.curveMonotoneX) // apply smoothing to the line 

  linechart.svg.select("#valueline").remove();

  linechart.svg.append("path")
    .datum(linechart.data)
    .transition().duration(750)
    .attr("id", "valueline")
    .attr("class", "line")
    .attr("d", linechart.line)
    .attr("fill", "none")
    .attr("stroke", scat_games_color_inner)
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  linechart.svg.select(".xAxis")
    .call(d3.axisBottom(linechart.xScale));

  linechart.svg.select(".yAxis")
    .call(d3.axisLeft(linechart.yScale));
}

function gen_timeline() {
  var margin = {left: 30, right: 30},
    width = 1910,
    height = 100,
    range = [1996, 2016],
    step = 1; // change the step and if null, it'll switch back to a normal slider


  var svg = d3.select('#timeline')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  var slider = svg.append("g")
    .classed('slider', true)
    .attr('transform', 'translate(' + margin.left +', '+ (height/2) + ')');

    /**/

  // using clamp here to avoid slider exceeding the range limits
  var xScale = d3.scaleLinear()
      .domain(range)
      .range([0, width - margin.left - margin.right])
      .clamp(true);

  // array useful for step sliders
  var rangeValues = d3.range(range[0], range[1], step || 1).concat(range[1]);

  var xAxis = d3.axisBottom(xScale).tickValues(rangeValues).tickFormat(function (d) {
      return d;
  });

  xScale.clamp(true);

  // this is the main bar with a stroke (applied through CSS)
  var track = slider.append('line').attr('class', 'track')
    .attr('x1', xScale.range()[0])
    .attr('x2', xScale.range()[1]);

  // this is a bar (steelblue) that's inside the main "track" to make it look like a rect with a border
  var trackInset = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-inset');

 var ticks = slider.append('g').attr('class', 'ticks').attr('transform', 'translate(0, 4)')
      .call(xAxis);

  // drag handles
  var minHandle = slider.append('circle').classed('handle', true)
      .attr('r', 12)
      .attr("id", "minHandle");

  var maxHandle = slider.append('circle').classed('handle', true)
      .attr('r', 8)
      .attr("id", "maxHandle");

  // optional initial transition
  /** /
  slider.transition().duration(750)
      .tween("drag", function () {
          var i = d3.interpolate(1985, 2005);
          return function (t) {
              dragged(xScale(i(t)));
          }
      });
  /**/

  //min starts at first year
  minHandle.attr('cx', xScale(1996));

  //max starts at latest year
  maxHandle.attr('cx', xScale(2016));

    // drag behavior initialization
  var drag = d3.drag()
    .on('start.interrupt', function () {
        slider.interrupt();
    })
    .on('start', function () {
        selectHandle(d3.event.x);
    })
    .on('drag', function () {
        dragging(d3.event.x);
        update_linechart();
    });

  // this is the bar on top of above tracks with stroke = transparent and on which the drag behaviour is actually called
  // try removing above 2 tracks and play around with the CSS for this track overlay, you'll see the difference
  var trackOverlay = d3.select(slider.node().appendChild(track.node().cloneNode())).attr('class', 'track-overlay')
    .call(drag);

  var handleInUse;

  function selectHandle(value) {
    var minPos = minHandle.attr('cx');
    var maxPos = maxHandle.attr('cx');

    var x = xScale.invert(value), index = null, midPoint, cx, xVal;
    if(step) {
        // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
        for (var i = 0; i < rangeValues.length - 1; i++) {
            if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
                index = i;
                break;
            }
        }
        midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
        if (x < midPoint) {
            cx = xScale(rangeValues[index]);
            xVal = rangeValues[index];
        } else {
            cx = xScale(rangeValues[index + 1]);
            xVal = rangeValues[index + 1];
        }
    } else {
        // if step is null or 0, return the drag value as is
        cx = xScale(x);
        xVal = x.toFixed(3);
    }

    handleInUse = Math.abs(minPos - cx) < Math.abs(maxPos - cx) ? minHandle : maxHandle;
  }

  function dragging(value) {
    var x = xScale.invert(value), index = null, midPoint, cx, xVal;
    if(step) {
        // if step has a value, compute the midpoint based on range values and reposition the slider based on the mouse position
        for (var i = 0; i < rangeValues.length - 1; i++) {
            if (x >= rangeValues[i] && x <= rangeValues[i + 1]) {
                index = i;
                break;
            }
        }
        midPoint = (rangeValues[index] + rangeValues[index + 1]) / 2;
        if (x < midPoint) {
            cx = xScale(rangeValues[index]);
            xVal = rangeValues[index];
        } else {
            cx = xScale(rangeValues[index + 1]);
            xVal = rangeValues[index + 1];
        }
    } else {
        // if step is null or 0, return the drag value as is
        cx = xScale(x);
        xVal = x.toFixed(0);
    }
    // use xVal as drag value, e.g YEAR
    if(handleInUse == minHandle){
      cx = clamp(cx, xScale(1996), maxHandle.attr('cx'));
      xVal = clamp(xVal, 1996, year_filters[1]);
      year_filters[0] = xVal;
    }
    else {
      cx = clamp(cx, minHandle.attr('cx'), xScale(2016));
      xVal = clamp(xVal, year_filters[0], 2016);
      year_filters[1] = xVal;
    }

    handleInUse.attr('cx', cx);
  }
}

function gen_treemap(){
  var margin = {top: 20, right: 20, bottom: 20, left: 20}
  var width = 300 - margin.right;
  var height = 400 - margin.top - margin.bottom;

  var x = d3.scaleLinear()
  .domain([0, height])
  .range([0, d3.max(regions, function(d){return d.value})]);

  var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, d3.max(regions, function(d){return d.value})]);

  var div = d3.select("body").append("div") 
    .attr("class", "tooltip")
    .style("left", 0)
    .style("top", 0)        
    .style("opacity", 0);

  var stratify = d3.stratify()
      .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

  var treemap = d3.treemap()
      .tile(d3.treemapSlice)
      .size([width, height]);

  // TODO: select year
  var root = stratify(regions.slice(120,125))
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  treemap(root);

      
  var svg = d3.select("#treemap").append("div")
      .style("position", "relative")
      .style("width", (width + margin.left + margin.right) + "px")
      .style("height", (height + margin.top + margin.bottom) + "px")
      .style("left", margin.left + "px")
      .style("top", margin.top + "px");
      
      
  draw(root);  

  function draw(root){
      var node = svg.selectAll(".node")
          .data(root.leaves())
          .enter().append("div")
          .attr("class", "node")
          .style("left", function(d) { return d.x0 + "px"; })
          .style("top", function(d) { return d.y0 + "px"; })
          .style("width", function(d) { return x(d.x1 - d.x0) * 4 + "px"; })
          .style("height", function(d) { return y(d.y1 - d.y0) * 2 + "px";})
          .style("background", function(d) { while (d.depth > 1) d = d.parent; return color(d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\n")); })
          .on("mouseover", function(d) {    
            div.transition()    
               .duration(200)   
               .style("opacity", .9);   
            div.html(d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\n").toUpperCase() + ": " + d.value) 
               .style("left", (d3.event.pageX) + "px")    
               .style("top", (d3.event.pageY) + "px");  
          })          
          .on("mouseout", function(d) {   
             div.transition()   
                .duration(500)    
                .style("opacity", 0); 
          })
          .on("click", function(d){
             tempRegion = d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\n").toUpperCase();
             if(tempRegion != selectedRegion){
               selectedRegion = tempRegion;
             } else{
               selectedRegion = "Global";
             }
             update_linechart();
          });

      return node;
  }
      
  function color(id){
      // jp, na, eu ,ot
      var arr = ["#FFFFFF", "#B22234", "#003399", "#228B22"];
      var reg = ['jp', 'na', 'eu', 'ot'];
      return arr[reg.indexOf(id)];
  }
}

function init(){
	
}

function init_radarchart(){
	var w = 200;
	var h = 200;
/*
	d3.csv("games.csv", function (data){
		games = data;
		return 0;
		//gen_heatmap();
	});
*/

	//Legend titles
	var LegendOptions = ['Games'];
	var LegendOptions2 = ['Movies'];

	//Data
	var movies_radar = [
			  [
				{axis:"Drama",value:20},
				{axis:"Romance",value:35},
				{axis:"War",value:8},
				{axis:"Science Fiction",value:15},
				{axis:"Thriller",value:18},
				{axis:"Music",value:5},
				{axis:"Action",value:42},
				{axis:"History",value:9},
				{axis:"Comedy",value:56},
				{axis:"Adventure",value:48},
				{axis:"Fantasy",value:34},
				{axis:"Animation",value:28},
				{axis:"Family",value:22},
				{axis:"Mystery",value:23},
				{axis:"Western",value:12},
				{axis:"Crime",value:13},
				{axis:"Horror",value:25},
				{axis:"TV Movie",value:18},
				{axis:"Foreign",value:4},
				{axis:"Documentary",value:4}
			  ]
			];
			
	var games_radar = [
			  [
				{axis:"Action",value:25},
				{axis:"Adventure",value:30},
				{axis:"Fighting",value:18},
				{axis:"Misc",value:16},
				{axis:"Platform",value:15},
				{axis:"Puzzle",value:5},
				{axis:"Racing",value:22},
				{axis:"Role-Playing",value:24},
				{axis:"Shooter",value:42},
				{axis:"Simulation",value:30},
				{axis:"Sports",value:34},
				{axis:"Strategy",value:28}
			  ]
			];

	var cfg2 = {
		 color: "green"
		};
	//Call function to draw the Radar chart
	//Will expect that data is in %'s
	gen_radarchart("#radarchart1", movies_radar);
	gen_radarchart("#radarchart2", games_radar, cfg2);

	////////////////////////////////////////////
	/////////// Initiate legend ////////////////
	////////////////////////////////////////////

	var svg = d3.select('#radarchart1')
		.selectAll('svg')
		.append('svg')
		.attr("width", w+100)
		.attr("height", h)

	//Create the title for the legend
	var text = svg.append("text")
		.attr("class", "title")
		.attr('transform', 'translate(20,0)') 
		.attr("x", w - 100)
		.attr("y", 10)
		.attr("font-size", "12px")
		.attr("fill", "#404040")
		.text("Number of Games sold(M)");
			
	//Initiate Legend	
	var legend = svg.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 200)
		.attr('transform', 'translate(90,20)') 
		;
		//Create colour squares
		legend.selectAll('rect')
		  .data(LegendOptions)
		  .enter()
		  .append("rect")
		  .attr("x", w - 65)
		  .attr("y", function(d, i){ return i * 20;})
		  .attr("width", 10)
		  .attr("height", 10)
		  .style("fill", "blue")//function(d, i){ return colorscale(3);})
		  ;
		//Create text next to squares
		legend.selectAll('text')
		  .data(LegendOptions)
		  .enter()
		  .append("text")
		  .attr("x", w - 52)
		  .attr("y", function(d, i){ return i * 20 + 9;})
		  .attr("font-size", "11px")
		  .attr("fill", "#737373")
		  .text(function(d) { return d; })
		  ;	
		  
	var svg2 = d3.select('#radarchart2')
		.selectAll('svg')
		.append('svg')
		.attr("width", w+100)
		.attr("height", h)

	//Create the title for the legend
	var text = svg2.append("text")
		.attr("class", "title")
		.attr('transform', 'translate(20,0)') 
		.attr("x", w - 100)
		.attr("y", 10)
		.attr("font-size", "12px")
		.attr("fill", "#404040")
		.text("Number of Movies sold(M)");
			
	//Initiate Legend	
	var legend = svg2.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 200)
		.attr('transform', 'translate(90,20)') 
		;
		//Create colour squares
		legend.selectAll('rect')
		  .data(LegendOptions2)
		  .enter()
		  .append("rect")
		  .attr("x", w - 65)
		  .attr("y", function(d, i){ return i * 20;})
		  .attr("width", 10)
		  .attr("height", 10)
		  .style("fill", "green")//function(d, i){ return colorscale(3);})
		  ;
		//Create text next to squares
		legend.selectAll('text')
		  .data(LegendOptions2)
		  .enter()
		  .append("text")
		  .attr("x", w - 52)
		  .attr("y", function(d, i){ return i * 20 + 9;})
		  .attr("font-size", "11px")
		  .attr("fill", "#737373")
		  .text(function(d) { return d; })
		  ;	
}

function gen_radarchart(id, d, options){
  var cfg = {
	 radius: 5,
	 w: 200,
	 h: 200,
	 factor: 1,
	 factorLegend: .85,
	 levels: 3,
	 maxValue: 0,
	 radians: 2 * Math.PI,
	 opacityArea: 0.5,
	 ToRight: 5,
	 TranslateX: 90,
	 TranslateY: 80,
	 ExtraWidthX: 200,
	 ExtraWidthY: 200,
	 color: "blue"
	};
	
	if('undefined' !== typeof options){
	  for(var i in options){
		if('undefined' !== typeof options[i]){
		  cfg[i] = options[i];
		}
	  }
	}
	cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function(i){return d3.max(i.map(function(o){return o.value;}))}));
	var allAxis = (d[0].map(function(i, j){return i.axis}));
	var total = allAxis.length;
	var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
	var Format = d3.format('.2s');
	d3.select(id).select("svg").remove();
	
	var g = d3.select(id)
			.append("svg")
			.attr("width", cfg.w+cfg.ExtraWidthX)
			.attr("height", cfg.h+cfg.ExtraWidthY)
			.append("g")
			.attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
			;

	var tooltip;
	
	//Circular segments
	for(var j=0; j<cfg.levels-1; j++){
	  var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
	  g.selectAll(".levels")
	   .data(allAxis)
	   .enter()
	   .append("svg:line")
	   .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
	   .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
	   .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
	   .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
	   .attr("class", "line")
	   .style("stroke", "grey")
	   .style("stroke-opacity", "0.75")
	   .style("stroke-width", "0.3px")
	   .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
	}

	//Text indicating at what level(M) each line is
	for(var j=0; j<cfg.levels; j++){
	  var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
	  g.selectAll(".levels")
	   .data([1]) //dummy data
	   .enter()
	   .append("svg:text")
	   .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
	   .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
	   .attr("class", "legend")
	   .style("font", "Helvetica, sans-serif")
	   .style("font-size", "10px")
	   .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
	   .attr("fill", "#737373")
	   .text(Format((j+1)*cfg.maxValue/cfg.levels));
	}
	
	series = 0;

	var axis = g.selectAll(".axis")
			.data(allAxis)
			.enter()
			.append("g")
			.attr("class", "axis");

	axis.append("line")
		.attr("x1", cfg.w/2)
		.attr("y1", cfg.h/2)
		.attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
		.attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
		.attr("class", "line")
		.style("stroke", "grey")
		.style("stroke-width", "1px");

	axis.append("text")
		.attr("class", "legend")
		.text(function(d){return d})
		.style("font", "Helvetica, sans-serif")
		.style("font-size", "11px")
		.attr("text-anchor", "middle")
		.attr("dy", "1.5em")
		.attr("transform", function(d, i){return "translate(0, -10)"})
		.attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
		.attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);});

 
	d.forEach(function(y, x){
	  dataValues = [];
	  g.selectAll(".nodes")
		.data(y, function(j, i){
		  dataValues.push([
			cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
			cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
		  ]);
		});
	  dataValues.push(dataValues[0]);
	  g.selectAll(".area")
					 .data([dataValues])
					 .enter()
					 .append("polygon")
					 .attr("class", "radar-chart-serie"+series)
					 .style("stroke-width", "2px")
					 .style("stroke", cfg.color)
					 .attr("points",function(d) {
						 var str="";
						 for(var pti=0;pti<d.length;pti++){
							 str=str+d[pti][0]+","+d[pti][1]+" ";
						 }
						 return str;
					  })
					 .style("fill", cfg.color)
					 .style("fill-opacity", cfg.opacityArea)
					 .on('mouseover', function (d){
										z = "polygon."+d3.select(this).attr("class");
										g.selectAll("polygon")
										 .transition(200)
										 .style("fill-opacity", 0.1); 
										g.selectAll(z)
										 .transition(200)
										 .style("fill-opacity", .7);
									  })
					 .on('mouseout', function(){
										g.selectAll("polygon")
										 .transition(200)
										 .style("fill-opacity", cfg.opacityArea);
					 });
	  series++;
	});
	series=0;

	d.forEach(function(y, x){
	  g.selectAll(".nodes")
		.data(y).enter()
		.append("svg:circle")
		.attr("class", "radar-chart-serie"+series)
		.attr('r', cfg.radius)
		.attr("alt", function(j){return Math.max(j.value, 0)})
		.attr("cx", function(j, i){
		  dataValues.push([
			cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)), 
			cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
		]);
		return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
		})
		.attr("cy", function(j, i){
		  return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
		})
		.attr("data-id", function(j){return j.axis})
		.style("fill", cfg.color).style("fill-opacity", .9)
		.on('mouseover', function (d){
					newX =  parseFloat(d3.select(this).attr('cx')) - 10;
					newY =  parseFloat(d3.select(this).attr('cy')) - 5;
					
					tooltip
						.attr('x', newX)
						.attr('y', newY)
						.text(Format(d.value))
						.transition(200)
						.style('opacity', 1);
						
					z = "polygon."+d3.select(this).attr("class");
					g.selectAll("polygon")
						.transition(200)
						.style("fill-opacity", 0.1); 
					g.selectAll(z)
						.transition(200)
						.style("fill-opacity", .7);
				  })
		.on('mouseout', function(){
					tooltip
						.transition(200)
						.style('opacity', 0);
					g.selectAll("polygon")
						.transition(200)
						.style("fill-opacity", cfg.opacityArea);
				  })
		.append("svg:title")
		.text(function(j){return Math.max(j.value, 0)});

	  series++;
	});
	//Tooltip
	tooltip = g.append('text')
			   .style('opacity', 0)
			   .style('font-family', 'sans-serif')
			   .style('font-size', '13px');
  
}
