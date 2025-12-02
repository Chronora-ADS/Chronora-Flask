# routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import base64
import re

# Importar db e modelos de models.py (NÃO de app.py)
from models import db, User, Service, Category, Document

# --- Blueprints ---
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
service_bp = Blueprint('service', __name__, url_prefix='/service')
user_bp = Blueprint('user', __name__, url_prefix='/user')

# --- Rotas de Autenticação ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone_number_str = data.get('phoneNumber', '')
    password = data.get('password', '')
    confirm_password = data.get('confirmPassword', '')
    document_base64 = data.get('document', '')

    # --- Validações ---
    if not name or not email or not phone_number_str or not password or not confirm_password:
        return jsonify({"error": "Todos os campos são obrigatórios."}), 400
    if password != confirm_password:
        return jsonify({"error": "As senhas não coincidem."}), 400
    if len(password) < 6:
        return jsonify({"error": "A senha deve ter pelo menos 6 caracteres."}), 400
    if not document_base64:
        return jsonify({"error": "Documento com foto é obrigatório."}), 400

    phone_number = int(re.sub(r'\D', '', str(phone_number_str)))
    if len(str(phone_number)) < 10:
        return jsonify({"error": "Número de telefone inválido."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email já está em uso."}), 409
    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({"error": "Número de celular já registrado."}), 409

    # --- Processamento ---
    try:
        document_bytes = base64.b64decode(document_base64.split(',')[1] if ',' in document_base64 else document_base64)
        document = Document(name="foto.png", type="image/png", data=document_bytes)
        user = User(name=name, email=email, phone_number=phone_number)
        user.set_password(password)
        user.document = document
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict(include_document=False)), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro no registro: {e}")
        return jsonify({"error": "Erro interno ao processar o cadastro."}), 500

# CORREÇÃO: Mudar de '/' para '/login'
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Preencha todos os campos."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciais inválidas."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "access_token": access_token,
        "user_id": user.id
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({"message": "Logout realizado com sucesso."}), 200

# --- Rotas de Serviço ---
@service_bp.route('/post/<int:user_id>', methods=['POST'])
@jwt_required()
def create_service(user_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != user_id:
        return jsonify({"error": "Acesso negado."}), 403

    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    time_chronos = data.get('timeChronos')
    category_entities_data = data.get('categoryEntities', [])
    service_image_base64 = data.get('serviceImage', '')

    if not title or not description or time_chronos is None or not service_image_base64:
        return jsonify({"error": "Título, descrição, tempo em Chronos e imagem são obrigatórios."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    try:
        image_bytes = base64.b64decode(service_image_base64.split(',')[1] if ',' in service_image_base64 else service_image_base64)

        categories = []
        for cat_data in category_entities_data:
            cat_name = cat_data.get('name', '').strip()
            if cat_name:
                category = Category.query.filter(db.func.lower(Category.name) == db.func.lower(cat_name)).first()
                if not category:
                    category = Category(name=cat_name)
                    db.session.add(category)
                    db.session.flush()
                categories.append(category)

        service = Service(
            title=title,
            description=description,
            time_chronos=time_chronos,
            service_image=image_bytes,
            user_entity=user
        )
        
        service.categories = categories

        db.session.add(service)
        db.session.commit()
        
        return jsonify(service.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro na criação do serviço: {e}")
        return jsonify({"error": f"Erro interno ao criar o serviço: {str(e)}"}), 500

@service_bp.route('/get/<int:service_id>', methods=['GET'])
def get_service_by_id(service_id):
    service = Service.query.get(service_id)
    if service:
        return jsonify(service.to_dict()), 200
    else:
        return jsonify({"error": "Serviço não encontrado."}), 404

@service_bp.route('/get/all', methods=['GET'])
@jwt_required()
def get_all_services():
    services = Service.query.all()
    services_data = [service.to_dict() for service in services]
    return jsonify(services_data), 200

# --- Rotas de Usuário ---
@user_bp.route('/get/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    user = User.query.get(user_id)
    if user:
        return jsonify(user.to_dict(include_document=False)), 200
    else:
        return jsonify({"error": "Usuário não encontrado."}), 404

@user_bp.route('/get/document/<int:user_id>', methods=['GET'])
def get_user_document(user_id):
    user = User.query.get(user_id)
    if user and user.document:
        return user.document.data, 200, {'Content-Type': user.document.type, 'Content-Disposition': f'inline; filename="{user.document.name}"'}
    return jsonify({"error": "Documento não encontrado."}), 404