
let nodes = [], links = [];

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    nodes = data.nodes;
    links = data.links;
    startSimulation();
  });

const svg = d3.select("svg").call(
  d3.zoom().scaleExtent([0.1, 4]).on("zoom", ({ transform }) => {
    svgGroup.attr("transform", transform);
  })
);
const width = window.innerWidth;
const height = window.innerHeight;

const color = d3.scaleOrdinal()
  .domain(["Camarilla", "Anarch", "Sabbat", "Indépendant"])
  .range(["royalblue", "darkorange", "crimson", "forestgreen"]);

const svgGroup = svg.append("g");

function startSimulation() {
  const factionFilter = document.getElementById("factionFilter");
  const coterieFilter = document.getElementById("coterieFilter");

  const coteries = Array.from(new Set(nodes.map(n => n.coterie).filter(Boolean))).sort();
  coteries.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    coterieFilter.appendChild(opt);
  });

  factionFilter.addEventListener("change", applyFilters);
  coterieFilter.addEventListener("change", applyFilters);

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(200))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(40));

  const link = svgGroup.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .attr("stroke-width", 1.5);

  const node = svgGroup.append("g")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node");

  node.append("circle")
    .attr("r", d => d.major ? 20 : 12)
    .attr("fill", d => color(d.group))
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      const tooltip = document.getElementById('tooltip');
      tooltip.innerHTML = `<strong>${d.id}</strong><br/>Faction : ${d.group}<br/>Clan : ${d.clan || 'Inconnu'}<br/>Coterie : ${d.coterie || 'Aucune'}`;
      tooltip.style.left = (event.pageX + 10) + 'px';
      tooltip.style.top = (event.pageY + 10) + 'px';
      tooltip.style.display = 'block';
    })
    .on("mouseout", () => {
      document.getElementById('tooltip').style.display = 'none';
    });

  node.append("text")
    .text(d => d.id)
    .attr("dy", 4);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function applyFilters() {
    const f = factionFilter.value;
    const c = coterieFilter.value;
    node.style("display", d =>
      (!f || d.group === f) && (!c || d.coterie === c) ? null : "none"
    );
    link.style("display", d =>
      (!f || (d.source.group === f && d.target.group === f)) &&
      (!c || (d.source.coterie === c && d.target.coterie === c)) ? null : "none"
    );
  }
}
