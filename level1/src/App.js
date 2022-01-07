import React, { Component } from 'react';
import * as d3 from 'd3';
import './App.css'

/* 月份对应字符串 */
const monthArr = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* 用于画图例 */
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
    .style("top", -200 + "px")
    .style("left", 0 + "px")
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
    .attr("transform", `translate(${(legendWidth - margin.left - margin.right)}, 0)`)
    .call(lgdaxis)
    .append("text")
    .text("Celsius")
    .attr("transform", "rotate(-90)")
    .attr("dy", "1em");
}
/* 对原始数据进行处理的函数，将温度格式变为数字，最终得到年、月、最高温度、最低温度的Object数组*/
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

/* 根据数据绘图 */
async function draw() {
  /* 画布相关常数 */
  const width = 1280,
    height = 600,
    marginTop = 50,
    marginBottom = 30,
    marginLeft = 100,
    marginRight = 30,
    cellSize = 30;
  /* 导入数据 */
  const rawData = await d3.csv('./data/temperature_daily.csv');
  /*  */
  let allData = reCon(rawData);
  // rawData.forEach(d => {
  //   d['max_temperature'] = +(d['max_temperature']);
  //   d['min_temperature'] = +(d['min_temperature']);
  //   tmpObj = {
  //     year: d['date'].substring(0, 4),
  //     month: monthArr[Number(d['date'].substring(5, 7))],
  //     max_temp: d['max_temperature'],
  //     min_temp: d['min_temperature']
  //   };
  //   if (allData.length == 0) allData.push(tmpObj);
  // })
  /* for (let i = 0; i < rawData.length; i++) {
    rawData[i]['max_temperature'] = +(rawData[i]['max_temperature']);
    rawData[i]['min_temperature'] = +(rawData[i]['min_temperature']);
    tmpObj.year = rawData[i]['date'].substring(0, 4);
    tmpObj.month = monthArr[Number(rawData[i]['date'].substring(5, 7))];
    tmpObj.max_temp = rawData[i]['max_temperature'];
    tmpObj.min_temp = rawData[i]['min_temperature'];
    if (allData.length === 0) allData.push(tmpObj);
    else if (tmpObj.year !== allData[allData.length - 1].year || tmpObj.month !== allData[allData.length - 1].month) {
      allData.push(tmpObj);
    }
    else {
      if (allData[allData.length - 1].max_temp < tmpObj.max_temp) allData[allData.length - 1].max_temp = tmpObj.max_temp;
      if (allData[allData.length - 1].min_temp > tmpObj.min_temp) allData[allData.length - 1].min_temp = tmpObj.min_temp;
    }
  } */
  /* select */
  let form1 = d3.select(".App").append("div").attr("id", "select_bg")
    .style("text-indent", "2em")
    .style("height", "50px")
    .style("display", "flex")
    .style("align-items", "center")
    .append("text")
    .text("Mode: ")
    .append("select").attr("name", "mode").attr("id", "select_list")
    .style("width", "100px")
    .style("height", "30px")
    .style("font-size", "24px");
  let modes = [{ mode: "maxT" }, { mode: "minT" }];
  let options = form1.selectAll("option").data(modes).enter().append("option").attr("id", (d, i) => "option" + i);
  options.text(d => d.mode).attr("value", (d, i) => i);
  d3.select("#option0").attr("selected", "selected");
  /* 创建画布 */
  let svg = d3.select('.App')
    .append('svg')
    .attr("width", width)
    .attr("height", height)
    .style('background-color', '#FFF');

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

  /* X Y轴坐标映射 */
  const xScale = d3.scaleBand()
    .domain(rawData.map(d => d['date'].substring(0, 4)))
    .range([marginLeft, width - marginRight])
    .padding(0.4);
  const xAxis = d3.axisTop()
    .scale(xScale);
  svg.append('g')
    .attr('transform', `translate(0, ${marginTop})`)
    .call(xAxis);

  const yScale = d3.scaleBand()
    .domain(rawData.map(d => monthArr[Number(d['date'].substring(5, 7))]))
    .range([marginTop, height - marginBottom])
    .padding(0.3);
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
  d3.select(".App").append("div")
    .style("width", 20)
    .style("height", 200).attr("id", "legend")
    .style("display", "inline-block")
    .attr("x", "0px")
    .attr("y", "0px");
  draw_legend("#legend", clr);

  /* draw_rects */
  const rects = svg.selectAll("rect")
    .data(allData)
    .enter()
    .append("rect")
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month))
    .attr('stroke', 'white')
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fill', d => clr(d.max_temp));
  /* select onchange function */
  function coloring() {
    let val = document.getElementById("select_list").selectedIndex;
    console.log(val);
    if (val === 0) rects.attr('stroke', "white").attr('fill', d => clr(d.max_temp));
    else rects.attr("stroke", "skyblue").attr('fill', d => clr(d.min_temp))
  }
  /* why 
  d3.select("#select_list").attr("onchange", coloring)
  */
  document.getElementById("select_list").onchange = coloring;
  // let clicked = false;
  /* mouse events */
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
      /* tooltip的尝试
      svg.append("text")
        .attr("id", "tooltip")
        .attr("x", x)
        .attr("y", y)
        .attr("font-size", "11px")
        .attr("background-color", "white")
        .attr("fill", "black")
        .text(str); */
      Tooltip
        .style("opacity", 1);
      curr_rect.append("title")
        .text(str)
        .style("color", "skyblue")
        .style("font-size", "40px");
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


}

class App extends Component {
  componentDidMount() {
    draw();

    /*  不会对Promise数据类型进行处理
    let allDates;
     let years;
     let y = [];
     const rawData = d3.csv("./data/temperature_daily.csv").then(data => {
       data.forEach(d => {
         d['max_temperature'] = + (d['max_temperature']);
         d['min_temperature'] = +(d['min_temperature']);
         y.push(d['date'].substring(0, 4));
       });
       console.log(data);
     });
     console.log(y)
     years = Array.from(new Set(y));
     console.log(years);
     console.log(allDates);
     let svg = d3.select('.App')
       .append('svg')
       .attr('width', width)
       .attr('height', height * years.length)
 
     const year = svg.selectAll("g")
       .data(years)
       .join("g")
       .attr("transform", (d, i) => `translate(40.5, ${height * i + cellSize * 1.5})`);
      const year = svg.selectAll('g')
       .data(years)
       .join("g") */
  }

  render() {
    return (
      <div className="App">
      </div>
    );
  }
}

export default App;
