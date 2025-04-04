function createVisualization(selector, nodes, path, vehicleType, edges) {
    const svg = d3.select(selector);


    // Vehicle color mapping
    const vehicleColors = {
        ambulance: '#DC143C',
        firetruck: '#aa4203',
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

    // Draw edges in both directions while preserving input order
    edges.forEach(edge => {
        // Forward direction
        svg.append('line')
            .attr('class', 'edge')
            .attr('x1', nodes[edge.src].x)
            .attr('y1', nodes[edge.src].y)
            .attr('x2', nodes[edge.dest].x)
            .attr('y2', nodes[edge.dest].y)
            .style('stroke', '#999')
            .style('stroke-opacity', 0.3)
            .attr('stroke-width', 1);

        // Reverse direction (for undirected edges)
        svg.append('line')
            .attr('class', 'edge')
            .attr('x1', nodes[edge.dest].x)
            .attr('y1', nodes[edge.dest].y)
            .attr('x2', nodes[edge.src].x)
            .attr('y2', nodes[edge.src].y)
            .style('stroke', '#999')
            .style('stroke-opacity', 0.3)
            .attr('stroke-width', 1);
    });

    // Draw path edges last (on top)
    edges.forEach(edge => {
        if (pathEdges.has(`${edge.src}-${edge.dest}`)) {
            // Forward direction
            svg.append('line')
                .attr('class', 'path-edge')
                .attr('x1', nodes[edge.src].x)
                .attr('y1', nodes[edge.src].y)
                .attr('x2', nodes[edge.dest].x)
                .attr('y2', nodes[edge.dest].y)
                .style('stroke', vehicleColors[vehicleType])
                .style('stroke-width', 2);

            // Reverse direction (if needed)
            if (pathEdges.has(`${edge.dest}-${edge.src}`)) {
                svg.append('line')
                    .attr('class', 'path-edge')
                    .attr('x1', nodes[edge.dest].x)
                    .attr('y1', nodes[edge.dest].y)
                    .attr('x2', nodes[edge.src].x)
                    .attr('y2', nodes[edge.src].y)
                    .style('stroke', vehicleColors[vehicleType])
                    .style('stroke-width', 2);
            }
        }
    });

    // Draw edge labels
    edges.forEach(edge => {
        // Forward label
        svg.append('text')
            .attr('class', 'edge-label')
            .text(edge.weight)
            .attr('x', (nodes[edge.src].x + nodes[edge.dest].x) / 2)
            .attr('y', (nodes[edge.src].y + nodes[edge.dest].y) / 2)
            .attr('dy', 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .style('fill', '#666')
            .style('opacity', 0.3);

        // Reverse label (for undirected edges)
        svg.append('text')
            .attr('class', 'edge-label')
            .text(edge.weight)
            .attr('x', (nodes[edge.dest].x + nodes[edge.src].x) / 2)
            .attr('y', (nodes[edge.dest].y + nodes[edge.src].y) / 2)
            .attr('dy', 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .style('fill', '#666')
            .style('opacity', 0.3);
    });

    // Draw path edge labels (bold and colored)
    edges.forEach(edge => {
        if (pathEdges.has(`${edge.src}-${edge.dest}`)) {
            // Forward label
            svg.append('text')
                .attr('class', 'path-edge-label')
                .text(edge.weight)
                .attr('x', (nodes[edge.src].x + nodes[edge.dest].x) / 2)
                .attr('y', (nodes[edge.src].y + nodes[edge.dest].y) / 2)
                .attr('dy', 5)
                .attr('text-anchor', 'middle')
                .attr('font-size', '12px')
                .style('fill', vehicleColors[vehicleType])
                .style('opacity', 1);

            // Reverse label (if needed)
            if (pathEdges.has(`${edge.dest}-${edge.src}`)) {
                svg.append('text')
                    .attr('class', 'path-edge-label')
                    .text(edge.weight)
                    .attr('x', (nodes[edge.dest].x + nodes[edge.src].x) / 2)
                    .attr('y', (nodes[edge.dest].y + nodes[edge.src].y) / 2)
                    .attr('dy', 5)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '12px')
                    .style('fill', vehicleColors[vehicleType])
                    .style('opacity', 1);
            }
        }
    });

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

            progress += 2; // Adjust speed by changing this value
            
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