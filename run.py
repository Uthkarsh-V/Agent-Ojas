import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from agent import AgenticController

load_dotenv()

# Initialize Flask to serve everything from the current root directory
app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')
CORS(app)

agent_controller = AgenticController()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/firebase-config', methods=['GET'])
def firebase_config():
    return jsonify({
        "apiKey": os.environ.get("FIREBASE_API_KEY", ""),
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", ""),
        "projectId": os.environ.get("FIREBASE_PROJECT_ID", "")
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'messages' not in data:
        return jsonify({"error": "Invalid request. 'messages' field is required."}), 400
    
    messages = data['messages']
    model = data.get('model', 'llama3-8b-8192')
    persona = data.get('persona', 'ojas')
    
    # Process through the agentic controller
    response = agent_controller.process_request(messages, model=model, persona=persona)
    
    if "error" in response:
        return jsonify(response), 500
        
    return jsonify(response)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Ojas Agentic Hub on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=(os.environ.get('FLASK_ENV') == 'development'))
