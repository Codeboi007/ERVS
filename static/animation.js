function createVisualization(selector, nodes, path, vehicleType, edges) {
    const svg = d3.select(selector);
    
    // Vehicle color mapping
    const vehicleColors = {
        ambulance: '#E74C3C',
        firetruck: '#F1C40F',
        police: '#3498DB'
    };

    // Precompute path edges for filtering
    const pathEdges = new Set();
    for (let i = 0; i < path.length - 1; i++) {
        const src = path[i];
        const dest = path[i + 1];
        pathEdges.add(`${src}-${dest}`);
        pathEdges.add(`${dest}-${src}`); // Handle undirected edges
    }

    // Clear existing SVG content
    svg.selectAll('*').remove();

    // Create node groups
    const nodeGroups = svg.selectAll('.node-group')
        .data(Object.entries(nodes))
        .enter()
        .append('g')
        .attr('class', 'node-group')
        .attr('transform', d => `translate(${d[1].x}, ${d[1].y})`);

    // Nodes styling: highlight path nodes
    nodeGroups.append('circle')
        .attr('class', d => `node ${d[1].type}`)
        .attr('r', 10)
        .style('opacity', (d) => path.includes(d[0]) ? 1 : 0.3);

    nodeGroups.append('text')
        .text(d => d[0])
        .attr('y', 25)
        .attr('class', 'node-label')
        .style('opacity', (d) => path.includes(d[0]) ? 1 : 0.3);

    // Separate path and non-path edges
    const nonPathEdges = edges.filter(e => !pathEdges.has(`${e.src}-${e.dest}`));
    const pathEdgesData = edges.filter(e => pathEdges.has(`${e.src}-${e.dest}`));

    // Draw non-path edges first (lower opacity and thinner lines)
    svg.selectAll('.edge')
        .data(nonPathEdges)
        .enter()
        .append('line')
        .attr('class', 'edge')
        .attr('x1', d => nodes[d.src].x)
        .attr('y1', d => nodes[d.src].y)
        .attr('x2', d => nodes[d.dest].x)
        .attr('y2', d => nodes[d.dest].y)
        .style('stroke', '#999')
        .style('stroke-opacity', 0.3)
        .attr('stroke-width', 1);

    // Draw path edges last (bold and colored)
    svg.selectAll('.path-edge')
        .data(pathEdgesData)
        .enter()
        .append('line')
        .attr('class', 'path-edge')
        .attr('x1', d => nodes[d.src].x)
        .attr('y1', d => nodes[d.src].y)
        .attr('x2', d => nodes[d.dest].x)
        .attr('y2', d => nodes[d.dest].y)
        .style('stroke', vehicleColors[vehicleType])
        .style('stroke-opacity', 1)
        .attr('stroke-width', 2);

    // Draw non-path edge labels (dimmed)
    svg.selectAll('.edge-label')
        .data(nonPathEdges)
        .enter()
        .append('text')
        .attr('class', 'edge-label')
        .text(d => d.weight)
        .attr('x', d => (nodes[d.src].x + nodes[d.dest].x) / 2)
        .attr('y', d => (nodes[d.src].y + nodes[d.dest].y) / 2)
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .style('fill', '#666')
        .style('opacity', 0.3);

    // Draw path edge labels (bold and colored)
    svg.selectAll('.path-edge-label')
        .data(pathEdgesData)
        .enter()
        .append('text')
        .attr('class', 'path-edge-label')
        .text(d => d.weight)
        .attr('x', d => (nodes[d.src].x + nodes[d.dest].x) / 2)
        .attr('y', d => (nodes[d.src].y + nodes[d.dest].y) / 2)
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .style('fill', vehicleColors[vehicleType])
        .style('opacity', 1);

    // Vehicle animation logic
    if (path.length > 1) {
        let currentSegment = 0;
        let progress = 0;
        const totalSegments = path.length - 1;
        const vehicle = svg.append('circle')
            .attr('class', 'vehicle')
            .attr('r', 8)
            .attr('fill', vehicleColors[vehicleType])
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        function animate() {
            const currentEdge = path.slice(currentSegment, currentSegment + 2);
            if (!currentEdge[1]) return;

            const srcNode = nodes[currentEdge[0]];
            const destNode = nodes[currentEdge[1]];

            const dx = destNode.x - srcNode.x;
            const dy = destNode.y - srcNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const step = (progress / 100) * distance;

            // Calculate current position
            const x = srcNode.x + (dx / distance) * step;
            const y = srcNode.y + (dy / distance) * step;

            vehicle.attr('cx', x).attr('cy', y);

            progress += 1; // Adjust speed by changing this value
            
            if (progress > 100) {
                currentSegment++;
                progress = 0;
            }

            if (currentSegment >= totalSegments) {
                currentSegment = 0;
                progress = 0;
            }

            requestAnimationFrame(animate);
        }

        animate();
    } else {
        svg.append('text')
            .text('No path found')
            .attr('x', 50) // Adjust position based on SVG size
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .attr('class', 'error-text');
    }
}