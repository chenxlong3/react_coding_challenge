import React, { Component } from 'react';
import * as d3 from 'd3';
import './App.css'

const monthArr = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/* legend function */
function draw_legend(selector_id, color_scale) {
  const legendHeight = 200, legendWidth = 80;
  const margin = { top: 10, right: 60, bottom: 10, left: 2 };

  let canvas = d3.select(selector_id)
    .style("height", legendHeight + "px")
    .style("position", "relative")
    .append("xhtml:canvas")
    .attr("xmlns", "http://www.w3.org/1999/xhtml")
    .attr("height", legendHeight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendHeight - margin.top - margin.bottom) + "px")
    .style("width", (legendWidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top", "-200px")
    .style("left", (margin.left) + "px")
    .node();

  let ctx = canvas.getContext("2d");
  let lgdscale = d3.scaleLinear()
    .range([1, legendHeight - margin.top - margin.bottom])
    .domain(color_scale.domain());
  let img = ctx.createImageData(1, legendHeight);
  d3.range(legendHeight).forEach(function (i) {
    let c = d3.rgb(color_scale(lgdscale.invert(i)));
    img.data[4 * i] = c.r;
    img.data[4 * i + 1] = c.g;
    img.data[4 * i + 2] = c.b;
    img.data[4 * i + 3] = 255;
  });
  ctx.putImageData(img, 0, 0);

  let lgdaxis = d3.axisRight()
    .scale(lgdscale)
    .tickSize(5)
    .ticks(8);

  let svg_lgd = d3.select(selector_id)
    .append("svg")
    .attr("height", (legendHeight) + "px")
    .attr("width", (legendWidth) + "px")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "-200px");

  svg_lgd.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${legendWidth - margin.left - margin.right + 3}, 0)`)
    .call(lgdaxis)
    .append("text")
    .text("Celsius")
    .attr("transform", "rotate(-90)")
    .attr("dy", "1em");
}

/* everyday data for each month */
function monthData(oriData) {
  let mp = {};
  oriData.forEach(d => {
    let tmpObj = {
      day: d['date'].substring(8, 10),
      max_temp: d['max_temperature'],
      min_temp: d['min_temperature']
    };
    tmpObj.max_temp = d['max_temperature'];
    tmpObj.min_temp = d['min_temperature'];
    if (mp[d['date'].substring(0, 7)] === undefined) {
      mp[d['date'].substring(0, 7)] = [];
      mp[d['date'].substring(0, 7)].push(tmpObj);
    }
    else mp[d['date'].substring(0, 7)].push(tmpObj);
  });
  return mp;
}
/* data for rect drawing */
function reCon(rawData) {
  let d_Arr = [];
  rawData.forEach(d => {
    d['max_temperature'] = +(d['max_temperature']);
    d['min_temperature'] = +(d['min_temperature']);
    let tmpObj = {
      year: d['date'].substring(0, 4),
      month: monthArr[Number(d['date'].substring(5, 7))],
      max_temp: d['max_temperature'],
      min_temp: d['min_temperature']
    };
    if (tmpObj.year < "2008") return;
    if (d_Arr.length === 0) d_Arr.push(tmpObj);
    else if (tmpObj.year !== d_Arr[d_Arr.length - 1].year || tmpObj.month !== d_Arr[d_Arr.length - 1].month) {
      d_Arr.push(tmpObj);
    }
    else {
      if (d_Arr[d_Arr.length - 1].max_temp < tmpObj.max_temp) d_Arr[d_Arr.length - 1].max_temp = tmpObj.max_temp;
      if (d_Arr[d_Arr.length - 1].min_temp > tmpObj.min_temp) d_Arr[d_Arr.length - 1].min_temp = tmpObj.min_temp;
    }
  })
  return d_Arr;
};

async function draw() {
  const width = 1280,
    height = 650,
    marginTop = 30,
    marginBottom = 30,
    marginLeft = 100,
    marginRight = 30,
    cellSize = 40;

  /* loading Data */
  const rawData = await d3.csv('./data/temperature_daily.csv').then(data => {
    data = data.filter(d => d['date'].substring(0, 4) >= '2008');
    return data;
  });

  /* processing data */
  let allData = reCon(rawData);
  let monthMap = monthData(rawData);
  /* select */
  let form1 = d3.select(".App").append("div").attr("id", "select_bg")
    .style("height", "50px")
    .style("text-indent", "2em")
    .style("display", "flex")
    .style("align-items", "center")
    .append("text")
    .text("Mode: ")
    .append("select")
    .attr("name", "mode")
    .attr("id", "select_list")
    .style("width", "100px")
    .style("height", "30px")
    .style("font-size", "24px");
  /* svg */
  let svg = d3.select('.App')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background-color', '#FFF');


  let modes = [{ mode: "maxT" }, { mode: "minT" }];
  let options = form1.selectAll("option").data(modes).enter().append("option").attr("id", (d, i) => "option" + i);
  options.text(d => d.mode).attr("value", (d, i) => i);
  d3.select("#option0").attr("selected", "selected");
  let Tooltip = d3.select(".App")
    .append("div")
    .style("position", "absolute")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px");

  /* axes */
  const xScale = d3.scaleBand()
    .domain(rawData.map(d => d['date'].substring(0, 4)))
    .padding(0.4)
    .range([marginLeft, width - marginRight])
  const xAxis = d3.axisTop()
    .scale(xScale);
  svg.append('g')
    .attr('transform', `translate(0, ${marginTop})`)
    .call(xAxis);
  const yScale = d3.scaleBand()
    .padding(0.3)
    .domain(rawData.map(d => monthArr[Number(d['date'].substring(5, 7))]))
    .range([marginTop, height - marginBottom]);
  const yAxis = d3.axisLeft()
    .scale(yScale);
  svg.append('g')
    .attr('transform', `translate(${marginLeft})`)
    .call(yAxis);


  /* color */
  function findMin(data) {
    let min = Infinity;
    data.forEach(d => {
      if (d.min_temp < min) min = d.min_temp;
    })
    return min;
  }
  const max = d3.quantile(allData, 1, d => Math.abs(d.max_temp));
  const min = findMin(allData);
  let clr = d3.scaleSequential(d3.interpolateRdYlBu).domain([max, min]);
  d3.select(".App").append("div").attr("id", "legend")
    .style("display", "inline-block")
    .attr("x", "0px")
    .attr("y", "-200px");
  draw_legend("#legend", clr);


  const rects = svg.selectAll("rect")
    .data(allData)
    .enter()
    .append("rect")
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month))
    .attr('stroke', "white")
    .attr('width', cellSize * 1.5)
    .attr('height', cellSize)
    .attr('fill', d => {
      return clr(d.max_temp);
    });
  // let clicked = false;
  /* mouseevent */
  rects.on("click", function (event, d) {
    const curr_rect = d3.select(this);
    // clicked = !clicked;
    if (curr_rect.attr("stroke") === "white") {
      curr_rect.attr("stroke", "skyblue")
        .attr("fill", d => clr(d.min_temp));
    }
    else {
      curr_rect.attr("stroke", "white")
        .attr("fill", d => clr(d.max_temp));
    }
  })
    .on("mouseover", function (event, d) {
      let curr_rect = d3.select(this);
      let str = "date: " + d.year + "-";
      if (monthArr.indexOf(d.month) < 10) str += "0";
      str += monthArr.indexOf(d.month) + " max: " + d.max_temp + " min: " + d.min_temp;
      Tooltip.style("opacity", 1);
      curr_rect.append("title").text(str)
        .attr("color", "skyblue");
    })
    .on("mousemove", function (event, d) {
      let str = "date: " + d.year + "-";
      if (monthArr.indexOf(d.month) < 10) str += "0";
      str += monthArr.indexOf(d.month) + " max: " + d.max_temp + " min: " + d.min_temp;
      Tooltip.html(str)
        .style("left", event.x + 40 + "px")
        .style("top", event.y - 40 + "px");
    })
    .on("mouseleave", function (event, d) {
      Tooltip.style("opacity", 0);
    })

  /* select onchange function */
  function coloring() {
    let val = document.getElementById("select_list").selectedIndex;
    console.log(val);
    if (val === 0) rects.attr('stroke', "white").attr('fill', d => clr(d.max_temp));
    else rects.attr("stroke", "skyblue").attr('fill', d => clr(d.min_temp))
  }
  document.getElementById("select_list").onchange = coloring;
  console.log(monthMap["2008-01"]);
  const xScale2 = d3.scaleBand()
    .domain(monthMap["2008-01"].map(d => {
      return d.day;
    })).range([1, cellSize * 1.5 + 1]); /* [0, cellSize*1.3] 线会出格子 */
  const yScale2 = d3.scaleLinear()
    .domain([50, 0]).range([0, cellSize]);
  rects.each(function (d) {
    /* lines generating */
    let curr_rect = d3.select(this);
    let x2 = curr_rect.attr("x");
    let y2 = curr_rect.attr("y");
    let str = d.year + "-";
    if (monthArr.indexOf(d.month) < 10) str += "0";
    str += monthArr.indexOf(d.month);

    const line1 = d3.line()
      .x(d => xScale2(d.day))
      .y(d => yScale2(d.max_temp));
    const line2 = d3.line()
      .x(d => xScale2(d.day))
      .y(d => yScale2(d.min_temp));

    /* Lines drawing & translating */
    svg.append("path")
      .style("fill", "none")
      .style("stroke", "steelblue")
      .style("stroke-width", 1)
      .attr("d", line1(monthMap[str]))
      .attr("transform", `translate(${x2}, ${y2})`);
    svg.append("path")
      .style("fill", "none")
      .style("stroke", "skyblue")
      .style("stroke-width", 1)
      .attr("d", line2(monthMap[str]))
      .attr("transform", `translate(${x2}, ${y2})`);
  });
}

class App extends Component {
  componentDidMount() {
    draw();
  }

  render() {
    return (
      <div className="App">

      </div>
    );
  }
}

export default App;
