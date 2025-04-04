from flask import Flask, render_template, request
import heapq

app = Flask(__name__)

class Graph:
    def __init__(self):
        self.edges = {}          
        self.edges_list = []     
        self.nodes = {}

    def add_edge(self, src, dest, weight):
        
        if src not in self.edges:
            self.edges[src] = {}
        self.edges[src][dest] = weight
        if dest not in self.edges:
            self.edges[dest] = {}
        self.edges[dest][src] = weight

        self.edges_list.append({'src': src, 'dest': dest, 'weight': weight})



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

@app.route('/')
def index():
    return render_template('vehicle_select.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        vehicle_type = request.form['vehicle_type']
        start_node = request.form['start']
        raw_nodes = request.form['nodes'].split('\n')
        raw_edges = request.form['edges'].split('\n')

        graph = Graph()
        
        for line in raw_nodes:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 3:
                return "Error: Invalid node format (ID X Y [TYPE])", 400
            node_id = parts[0]
            x = float(parts[1])
            y = float(parts[2])
            node_type = 'regular'
            if len(parts) > 3:
                node_type = parts[3].lower().replace(' ', '-')
            graph.nodes[node_id] = {
                'x': x,
                'y': y,
                'type': node_type
            }

        
        if start_node not in graph.nodes:
            return f"Error: Start node '{start_node}' not found", 400

        
        for line in raw_edges:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 3:
                return "Error: Invalid edge format (SRC DEST WEIGHT)", 400
            src, dest, weight = parts[0], parts[1], parts[2]
            
            
            if src not in graph.nodes:
                return f"Error: Node '{src}' in edge '{src}-{dest}' not found", 400
            if dest not in graph.nodes:
                return f"Error: Node '{dest}' in edge '{src}-{dest}' not found", 400

            graph.add_edge(src, dest, int(weight))

        
        destination_type = {
            'ambulance': 'hospital',
            'firetruck': 'fire-station',
            'police': 'police-station'
        }[vehicle_type]

        
        destinations = [
            node_id for node_id, data in graph.nodes.items() 
            if data['type'] == destination_type
        ]

        
        shortest_distance = float('inf')
        best_path = []
        for dest in destinations:
            distance, path = dijkstra(graph, start_node, dest)
            if distance < shortest_distance:
                shortest_distance = distance
                best_path = path

        if not best_path:
            return "No path found to any destination", 400

        
        nodes_with_edges = {
            node_id: {
                'x': data['x'] * 100 + 50,
                'y': data['y'] * 100 + 50,
                'type': data['type'],
            }
            for node_id, data in graph.nodes.items()
        }

        return render_template('result.html',
                               nodes=nodes_with_edges,
                               path=best_path,
                               vehicle_type=vehicle_type,
                               destination_type=destination_type,
                               edges=graph.edges_list)

    except KeyError as e:
        return f"Error: {str(e)}. Check vehicle type or destination types", 400
    except Exception as e:
        return f"Error: {str(e)}", 400

if __name__ == '__main__':
    app.run(debug=True)