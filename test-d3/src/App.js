import React, { Component } from "react";
import * as d3 from "d3";
import "./App.css";

function draw() {
    const width = 1080, height = 700, eyeSpacing = 150, shiftY = -120, r = 40;
    const eyebrowWidth = 100, eyebrowHeight = 15, eyebrowYOffset = -70;
    const svg = d3.select(".App").append("svg").attr("width", width).attr("height", height);
    const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);
    const circle = g.append("circle")
        .attr("r", height / 2)
        .attr("fill", "yellow")
        .attr("stroke", "black");
    const leftEye = g.append("circle")
        .attr("r", r)
        .attr("cx", -eyeSpacing)
        .attr("cy", shiftY)
        .attr("fill", "black");
    const rightEye = g.append("circle")
        .attr("r", r)
        .attr("cx", eyeSpacing)
        .attr("cy", shiftY)
        .attr("fill", "black");

    const leftEyebrow = g.append("rect")
        .attr("x", -eyeSpacing - eyebrowWidth / 2)
        .attr("y", -200)
        .attr("width", eyebrowWidth)
        .attr("height", eyebrowHeight)
        .transition().duration(500)
        .attr("y", -200 - 30)
        .transition().duration(500)
        .attr("y", -200);
    const rightEyebrow = g.append("rect")
        .attr("x", eyeSpacing - eyebrowWidth / 2)
        .attr("y", -200)
        .attr("width", eyebrowWidth)
        .attr("height", eyebrowHeight)
        .transition().duration(500)
        .attr("y", -200 - 30)
        .transition().duration(500)
        .attr("y", -200);
    const mouth = g.append("path")
        .attr("d", d3.arc()({
            innerRadius: 180,
            outerRadius: 200,
            startAngle: Math.PI / 2,
            endAngle: Math.PI * 3 / 2
        }))
        .attr("")
}

class App extends Component {
    componentDidMount() {
        draw();
    }

    render() {
        return (
            <div className="App">

            </div >
        );
    }

}
export default App;