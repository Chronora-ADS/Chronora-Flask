# app.py
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from datetime import timedelta

# Cria as extensões PRIMEIRO
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Configurações
    app.config['SECRET_KEY'] = 'segredo-muito-fortissimo'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chronora.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'segredo-jwt-muito-fortissimo'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

    # Inicializa extensões
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Importa e registra blueprints DENTRO da função
    from routes import auth_bp, service_bp, user_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(service_bp)
    app.register_blueprint(user_bp)

    # Rotas básicas
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

    @app.route('/service_details/<int:service_id>')
    def service_details_page(service_id):
        return render_template('ServiceDetails.html')
    
    @app.route('/test')
    def test():
        return "✅ Flask funcionando!"

    return app

# Cria a aplicação
app = create_app()

if __name__ == '__main__':
    print("🚀 Iniciando Chronora Flask...")
    app.run(debug=True, port=5000)