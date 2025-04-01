from flask import Flask, render_template, request
import heapq

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('vehicle_select.html')

class Graph:
    def __init__(self):
        self.edges = {}          # For quick lookups
        self.edges_list = []     # Stores edges in input order
        self.nodes = {}

    def add_edge(self, src, dest, weight):
        # Add to edges dictionary (for quick access)
        if src not in self.edges:
            self.edges[src] = {}
        self.edges[src][dest] = weight
        if dest not in self.edges:
            self.edges[dest] = {}
        self.edges[dest][src] = weight

        # Add to edges_list in input order (store both directions)
        self.edges_list.append({'src': src, 'dest': dest, 'weight': weight})
        self.edges_list.append({'src': dest, 'dest': src, 'weight': weight})

def dijkstra(graph, start, end=None):
    if start not in graph.nodes:
        return (float('inf'), [])

    distances = {node: float('inf') for node in graph.nodes}
    predecessors = {node: None for node in graph.nodes}
    distances[start] = 0

    priority_queue = [(0, start)]
    
    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)
        
        if current_node == end:
            break
            
        if current_distance > distances[current_node]:
            continue
            
        for neighbor, weight in graph.edges.get(current_node, {}).items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                predecessors[neighbor] = current_node
                heapq.heappush(priority_queue, (distance, neighbor))
    
    if end:
        path = []
        current = end
        while current is not None:
            path.append(current)
            current = predecessors[current]
        path.reverse()
        return (distances[end], path)
    return (distances, predecessors)

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        vehicle_type = request.form['vehicle_type']
        start_node = request.form['start']
        raw_nodes = request.form['nodes'].split('\n')
        raw_edges = request.form['edges'].split('\n')

        graph = Graph()
        
        # Process nodes with hyphenated types
        for line in raw_nodes:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            node_id = parts[0]
            x = float(parts[1])
            y = float(parts[2])
            node_type = 'regular'
            if len(parts) > 3:
                node_type = parts[3].lower().replace(' ', '-')  # Fix: Hyphenate types
            graph.nodes[node_id] = {
                'x': x,
                'y': y,
                'type': node_type  # Now stored as 'fire-station' etc.
            }

        # Process edges
        for line in raw_edges:
            line = line.strip()
            if not line:
                continue
            src, dest, weight = line.split()
            graph.add_edge(src, dest, int(weight))

        # Map vehicle types to hyphenated destination types
        destination_type = {
            'ambulance': 'hospital',
            'firetruck': 'fire-station',  # Fix: Hyphenated type
            'police': 'police-station'    # Fix: Hyphenated type
        }[vehicle_type]

        # Find all destinations of required type
        destinations = [
            node_id for node_id, data in graph.nodes.items() 
            if data['type'] == destination_type
        ]

        # Find shortest path to nearest destination
        shortest_distance = float('inf')
        best_path = []
        for dest in destinations:
            distance, path = dijkstra(graph, start_node, dest)
            if distance < shortest_distance:
                shortest_distance = distance
                best_path = path

        if not best_path:
            return "No path found to any destination", 400

        # Prepare data for visualization
        nodes_with_edges = {
            node_id: {
                'x': data['x'] * 100 + 50,  # Scale coordinates for visualization
                'y': data['y'] * 100 + 50,
                'type': data['type'],
                'edges': graph.edges.get(node_id, {})
            }
            for node_id, data in graph.nodes.items()
        }
        edges_data = graph.edges_list  # Pass the edges list to the template
        return render_template('result.html',
                               nodes=nodes_with_edges,
                               path=best_path,
                               edges=edges_data,
                               vehicle_type=vehicle_type,
                               destination_type=destination_type)

    except Exception as e:
        return f"Error: {str(e)}", 400

if __name__ == '__main__':
    app.run(debug=True)