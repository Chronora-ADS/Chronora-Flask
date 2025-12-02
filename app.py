# app.py
from flask import Flask, jsonify, render_template
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from datetime import timedelta

app = Flask(__name__)

# --- Configurações ---
app.config['SECRET_KEY'] = 'segredo-muito-fortissimo'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///chronora.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'segredo-jwt-muito-fortissimo'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# --- Inicialização de extensões ---
from models import db  # Agora importamos db de models
db.init_app(app)  # Inicializar db com o app
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Configurar CORS mais específico
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5000", "http://127.0.0.1:5000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# NÃO importar blueprints aqui ainda - vamos importar depois

# --- Rotas para servir páginas HTML ---
@app.route('/')
def login_page():
    return render_template('Login.html')

@app.route('/home')
def main_page():
    return render_template('Main.html')

@app.route('/register')
def register_page():
    return render_template('AccountCreation.html')

@app.route('/service_creation')
def service_creation_page():
    return render_template('ServiceCreation.html')

# Rota de health check
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "message": "Flask app is running"})

# Importar e registrar blueprints APÓS a criação do app
with app.app_context():
    # Importar os modelos para garantir que estão registrados
    from models import User, Service, Category, Document
    
    # Agora importar os blueprints
    from routes import auth_bp, service_bp, user_bp
    
    # Registrar Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(service_bp)
    app.register_blueprint(user_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)