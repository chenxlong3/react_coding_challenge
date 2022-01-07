import * as d3 from 'd3';
import { Component } from 'react'
import './App.css';

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
    .style("display", "flex")
    .style("align-items", "center")
    .style("position", "absolute")
    .style("left", "0px")
    .style("top", "-210px");

  svg_lgd.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${legendWidth - margin.left - margin.right + 3}, 10)`)
    .call(lgdaxis)
    .append("text")
    .text("Celsius")
    .attr("transform", "rotate(-90)")
    .attr("dy", "0");
}

function draw() {
  let maindiv = d3.select(".App")
    .attr("width", 2048)
    .attr("height", 720);
  let mainsvg = maindiv.append("svg")
    .attr("width", 1400)
    .attr("height", 720)
  let width = 700, height = 700;
  let svg = mainsvg.append("g")
    .attr("width", width)
    .attr("height", height);
  let svg2 = mainsvg.append("g")
    .attr("class", "adjacency")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${width}, 0)`);
  let margin = { top: 120, bottom: 60, left: 60, right: 60 };

  /* data loading and drawing */
  d3.json("./data/HKUST_coauthor_graph.json").then(data => {
    data['nodes'] = data['nodes'].filter(d => d.dept === "CSE")
    data['nodes'].sort((a, b) => a.id - b.id);
    let idToIndex = new Map();
    for (let i = 0; i < data['nodes'].length; i++) {
      data['nodes'][i].val = 0;
      idToIndex.set(data['nodes'][i].id, i);
    }
    data['edges'] = data['edges'].filter(d => {
      if (idToIndex.has(d.source) && idToIndex.has(d.target)) {
        d.source = idToIndex.get(d.source);
        d.target = idToIndex.get(d.target);
        data['nodes'][d.source].val++;
        data['nodes'][d.target].val++;
        return true;
      }
      return false;
    });
    // console.log(data);
    /* let Tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px"); */
    /* matrix */
    let cellSize = 12;
    let edgeHash = {};
    data['edges'].forEach(edge => {
      /* indirected line */
      let id = edge.source + "-" + edge.target;
      edgeHash[id] = edge;
      id = edge.target + "-" + edge.source;
      edgeHash[id] = edge;
      // console.log(id);
    });
    let matrix = [];
    data['nodes'].forEach((source, i) => {
      data['nodes'].forEach((target, j) => {
        let grid = {
          id: idToIndex.get(source.id) + "-" + idToIndex.get(target.id),
          x: i,
          y: j,
          weight: 0.1
        };
        if (edgeHash[grid.id]) grid.weight = 1;
        matrix.push(grid);
      })
    })
    // let clr2 = d3.scale
    let clr = d3.scaleQuantile().domain([0, 90])
      .range(d3.schemeRdYlBu[9].reverse());

    let grids = svg2.append("g")
      .attr("transform", `translate(${margin.right * 2}, ${margin.top})`)
      .attr("id", "adjG")
      .selectAll("rect")
      .data(matrix)
      .enter()
      .append("rect")
      .attr("class", "grid")
      .attr("width", cellSize * 0.8)
      .attr("height", cellSize * 0.8)
      .attr("class", d => "row" + d.y + " col" + d.x)
      .attr("x", d => d.x * cellSize)
      .attr("y", d => d.y * cellSize)
      .attr("fill", d => {
        if (edgeHash[d.id]) {
          return clr(edgeHash[d.id].publications.length);
        }
        else return "black";
      })
      .style("opacity", d => d.weight);

    svg2.append("g")
      .attr("transform", `translate(${margin.left * 2}, ${margin.top})`)
      .selectAll("text")
      .data(data['nodes'])
      .enter()
      .append("text")
      .attr("y", (d, i) => i * cellSize + cellSize * 1.4 / 2)
      .text(d => d.fullname)
      .attr("class", "xaxis")
      .style("font-size", "8px")
      .style("font-family", "Times New Roman")
      .style("text-anchor", "start");
    d3.selectAll(".xaxis")
      .attr("transform", "rotate(-90)");

    svg2.append("g")
      .attr("transform", `translate(${margin.left * 2 - 5}, ${margin.top})`)
      .selectAll("text")
      .data(data['nodes'])
      .enter()
      .append("text")
      .attr("y", (d, i) => i * cellSize + cellSize * 1.4 / 2)
      .text(d => d.fullname)
      .attr("class", "xaxis")
      .style("font-size", "8px")
      .style("font-family", "Times New Roman")
      .style("text-anchor", "end");
    d3.select("body").append("div").attr("id", "legend")
      .style("display", "inline-block")
      .style("position", "absolute")
      .style("top", "-200px")
      .style("left", "1450px");
    draw_legend("#legend", clr);

    /* node-link */
    let forceSimulation = d3.forceSimulation()
      .force("link", d3.forceLink())
      .force("charge", d3.forceManyBody().strength(-120).distanceMin(20).distanceMax(100))
      .force("center", d3.forceCenter());
    forceSimulation.nodes(data['nodes']).on("tick", ticked);
    forceSimulation.force("link").links(data['edges'])
      .distance(40);
    forceSimulation.force("center")
      .x(width / 2)
      .y(height / 2);
    let links = svg.append("g")
      .selectAll("line")
      .data(data['edges'])
      .enter()
      .append("line")
      .attr("id", d => {
        let str = "mk" + idToIndex.get(d.source.id) + "-" + idToIndex.get(d.target.id); /* 第一个字符要是字母 */
        return str;
      })
      .attr("stroke", "pink")
      .attr("opacity", 0.4)
      .attr("stroke-width", 3);
    let gnodes = svg.selectAll(".circle")
      .data(data['nodes'])
      .enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${d.x}, ${d.y})`)
      .call(d3.drag()
        .on("start", function (event, d) {
          if (!event.active) forceSimulation.alphaTarget(0.5).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function (event, d) {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", function (event, d) {
          if (!event.active) forceSimulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));
    gnodes.append("title").text(d => d.fullname);
    gnodes.append("circle")
      .attr("r", d => 5 + d.val * 0.8)
      .attr("fill", "skyblue")
      .attr("opacity", 0.9)
      .attr("id", d => {
        return "node" + d.id;
      })
      .on("mouseover", function (event, d) {
        let rowClass = ".row" + idToIndex.get(d.id);
        let colClass = ".col" + idToIndex.get(d.id);
        d3.selectAll(rowClass + ", " + colClass)
          .attr("fill", "yellow");
      })
      .on("mouseout", function (event, d) {
        let rowClass = ".row" + idToIndex.get(d.id);
        let colClass = ".col" + idToIndex.get(d.id);
        d3.selectAll(rowClass + ", " + colClass)
          .attr("fill", data => {
            if (edgeHash[data.id]) {
              return clr(edgeHash[data.id].publications.length);
            }
            else return "black";
          })
      })
    grids.on("mouseover", function (event, d) {
      let curr_rect = d3.select(this);
      /* if (edgeHash[d.id]) {
        Tooltip.text("publications: " + edgeHash[d.id].publications.length)
          .style("left", event.x + "px")
          .style("top", event.y + "px")
          .style("opacity", 1);
      } */

      curr_rect.append("title").text(d => {

        if (edgeHash[d.id]) return "publications: " + edgeHash[d.id].publications.length;
      })
      if (edgeHash[d.id]) {
        let tmpid = "#mk" + idToIndex.get(edgeHash[d.id].source.id) + "-" + idToIndex.get(edgeHash[d.id].target.id);
        let tmpnode1 = "#node" + edgeHash[d.id].source.id;
        let tmpnode2 = "#node" + edgeHash[d.id].target.id;
        d3.select(tmpid).attr("stroke", "red");
        d3.select(tmpnode1).attr("fill", "steelblue");
        d3.select(tmpnode2).attr("fill", "steelblue");
      }
    })
      .on("mouseout", function (event, d) {
        /* Tooltip
          .style("opacity", 0); */
        if (edgeHash[d.id]) {
          let tmpid = "#mk" + idToIndex.get(edgeHash[d.id].source.id) + "-" + idToIndex.get(edgeHash[d.id].target.id);
          let tmpnode1 = "#node" + edgeHash[d.id].source.id;
          let tmpnode2 = "#node" + edgeHash[d.id].target.id;
          d3.select(tmpid).attr("stroke", "pink");
          d3.select(tmpnode1).attr("fill", "skyblue");
          d3.select(tmpnode2).attr("fill", "skyblue");
        }
      })
    /* .on("click", function (event, d) {
      let curr = d3.select(this);
      curr.attr("fill", "pink");
    }); */
    function ticked() {
      links
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)

      gnodes.attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

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