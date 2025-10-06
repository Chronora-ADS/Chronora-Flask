# app.py
from flask import Flask, render_template # Importa Flask e função para renderizar templates
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta

app = Flask(__name__) # Cria a instância do aplicativo Flask

# --- Configurações ---
app.config['SECRET_KEY'] = 'segredo-muito-fortissimo-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-mesmo'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///chronora.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'segredo-muito-fortissimo-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-mesmo'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# --- Inicialização de extensões ---
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# --- Importar modelos e rotas após a inicialização ---
# Isso evita problemas de importação circular
from models import User, Service, Category, Document
from routes import auth_bp, service_bp, user_bp

# --- Registrar Blueprints ---
app.register_blueprint(auth_bp) # Registra as rotas de auth
app.register_blueprint(service_bp) # Registra as rotas de service
app.register_blueprint(user_bp) # Registra as rotas de user

# --- Rotas para servir páginas HTML ---
@app.route('/') # Rota raiz
def main_page():
    return render_template('Main.html') # Renderiza Main.html do diretório templates/

@app.route('/login')
def login_page():
    return render_template('Login.html')

@app.route('/register') # ou /account_creation
def register_page():
    return render_template('AccountCreation.html')

@app.route('/service_creation')
def service_creation_page():
    return render_template('ServiceCreation.html')

if __name__ == '__main__':
    app.run(debug=True)