import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ActivityHeatmapProps {
  data?: any[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const hours = Array.from({length: 24}, (_, i) => i);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Generate mock data representing call volume
    const heatmapData = data || hours.flatMap(hour => 
      days.map((day, dayIndex) => ({
        hour,
        dayIndex,
        day,
        value: Math.floor(Math.random() * (hour >= 9 && hour <= 17 && dayIndex !== 0 && dayIndex !== 6 ? 100 : 20))
      }))
    );

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const mainGroup = svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(hours.map(String))
      .padding(0.05);

    const y = d3.scaleBand()
      .range([height, 0])
      .domain(days.reverse())
      .padding(0.05);

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateBlues)
      .domain([0, 100]);

    mainGroup.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}h`))
      .select(".domain").remove();

    mainGroup.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .select(".domain").remove();

    const tooltip = d3.select("body").append("div")
      .attr("class", "d3-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#1e293b")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "9999");

    mainGroup.selectAll("rect")
      .data(heatmapData)
      .enter()
      .append("rect")
      .attr("x", (d: any) => x(String(d.hour))!)
      .attr("y", (d: any) => y(d.day)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", (d: any) => colorScale(d.value))
      .attr("rx", 4)
      .attr("ry", 4)
      .on("mouseover", function(event, d: any) {
        d3.select(this).style("stroke", "#0f172a").style("stroke-width", 2);
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`<strong>${d.day} ${d.hour}:00</strong><br/>Calls: ${d.value}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(event, d: any) {
        d3.select(this).style("stroke", "none");
        tooltip.transition().duration(500).style("opacity", 0);
      });

    return () => {
      d3.select("body").selectAll(".d3-tooltip").remove();
    }
  }, [data]);

  return (
    <div className="w-full overflow-hidden">
      <svg ref={svgRef}></svg>
    </div>
  );
};
