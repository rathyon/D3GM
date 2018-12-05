var game_titles, scores, regions, linechart_data;
var selectedRegion;

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
             selectedRegion = d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\n").toUpperCase();
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

function gen_linechart(){
  var margin = {top: 50, right: 50, bottom: 50, left: 50},
  width = 400 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

  // initialize with huge value
  var data_count = 0;
  var xMin = 10000.0;
  var xMax = -10000.0;
  var yMin = 10000.0;
  var yMax = -10000.0;

  // USING GLOBAL VALUES FOR NOW!!!

  linechart_data.forEach(function(d){
    if(d.Year >= 1996 && d.Year <= 1997){
      data_count += 1;

      xMin = xMin > parseFloat(d.Score_diff) ? d.Score_diff : xMin;
      xMax = xMax < parseFloat(d.Score_diff) ? d.Score_diff : xMax;

      yMin = yMin > parseFloat(d.Global) ? d.Global : yMin;
      yMax = yMax < parseFloat(d.Global) ? d.Global : yMax;

    }
  });

  console.log(xMin);
  console.log(xMax);
  console.log(yMin);
  console.log(yMin);
  console.log(data_count);

/**/

  var xScale = d3.scaleLinear()
    .domain([xMin, xMax]) // input
    .range([0, width]); // output

  var yScale = d3.scaleLinear()
    .domain([yMin, yMax]) // input 
    .range([height, 0]); // output 

  // 7. d3's line generator
  var line = d3.line()
    .x(function(d) { return xScale(d.Score_diff); }) // set the x values for the line generator
    .y(function(d) { return yScale(d.Global); }) // set the y values for the line generator 
    .curve(d3.curveMonotoneX) // apply smoothing to the line

  var svg = d3.select("#linechart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

    // 4. Call the y axis in a group tag
  svg.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

/** /
  // 9. Append the path, bind the data, and call the line generator 
  svg.append("path")
    .datum(linechart_data) // 10. Binds data to the line 
    .attr("class", "line") // Assign a class for styling 
    .attr("d", line); // 11. Calls the line generator

/**/

    // 12. Appends a circle for each datapoint 
  svg.selectAll(".dot")
      .data(linechart_data.filter(function(d){
        return (d.Year >= 1996 && d.Year <= 1997)
      }))
    .enter().append("circle") // Uses the enter().append() method
      .attr("class", "dot") // Assign a class for styling
      .attr("cx", function(d) { return xScale(d.Score_diff) })
      .attr("cy", function(d) { return yScale(d.Global) })
      .attr("r", 5)
        .on("mouseover", function() { 
      });

  /**/
}