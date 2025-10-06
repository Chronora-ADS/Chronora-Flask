# routes.py
from flask import Blueprint, request, jsonify, render_template_string
from app import db
from models import User, Service, Category, Document
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import base64
import re

# --- Blueprints ---
# Usamos Blueprints para organizar as rotas em grupos lógicos
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
        return jsonify(user.to_dict(include_document=False)), 201 # Retorna dados do usuário criado

    except Exception as e:
        db.session.rollback()
        print(f"Erro no registro: {e}")
        return jsonify({"error": "Erro interno ao processar o cadastro."}), 500

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
    # Implementação de blacklist de token aqui, se necessário
    return jsonify({"message": "Logout realizado com sucesso."}), 200

# --- Rotas de Serviço ---
@service_bp.route('/post/<int:user_id>', methods=['POST'])
@jwt_required()
def create_service(user_id):
    print(f"=== INICIANDO CRIAÇÃO DE SERVIÇO ===")
    print(f"User ID da URL: {user_id}")
    print(f"User ID do Token: {get_jwt_identity()}")
    
    data = request.get_json()
    print(f"Dados recebidos: {list(data.keys()) if data else 'Nenhum'}")
    print(f"Título: {data.get('title') if data else 'Nenhum'}")
    print(f"TimeChronos: {data.get('timeChronos') if data else 'Nenhum'}")
    print(f"ServiceImage length: {len(data.get('serviceImage', '')) if data else 0}")
    current_user_id = int(get_jwt_identity())
    print(f"Type of current_user_id: {type(current_user_id)}")
    print(f"Type of user_id from URL: {type(user_id)}")
    if current_user_id != user_id:
        return jsonify({"error": "Acesso negado."}), 403

    data = request.get_json()
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    time_chronos = data.get('timeChronos')
    # category_entities_data = data.get('categoryEntities', []) # Recebe como lista de dicionários
    service_image_base64 = data.get('serviceImage', '')

    if not title or not description or time_chronos is None or not service_image_base64:
        return jsonify({"error": "Título, descrição, tempo em Chronos e imagem são obrigatórios."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    try:
        image_bytes = base64.b64decode(service_image_base64.split(',')[1] if ',' in service_image_base64 else service_image_base64)

        # --- Processamento de Categorias (exemplo básico) ---
        # Cria objetos Category a partir dos dados recebidos
        # Pode ser melhorado para buscar categorias existentes ou criar novas
        # categories = []
        # for cat_data in category_entities_data:
        #      # Assumindo que cat_data é {'name': '...'}
        #      cat_name = cat_data.get('name', '').strip()
        #      if cat_name:
        #          # Busca uma categoria existente com esse nome
        #          category = Category.query.filter_by(name=cat_name).first()
        #          if not category:
        #              # Se não existir, cria uma nova
        #              category = Category(name=cat_name)
        #              db.session.add(category) # Adiciona ao session, mas não faz commit ainda
        #          categories.append(category)

        service = Service(
            title=title,
            description=description,
            time_chronos=time_chronos,
            service_image=image_bytes,
            user_entity=user
            # Atribui as categorias processadas
            # categories = categories # Descomente se o modelo Service tiver o relacionamento categories definido
        )

        db.session.add(service)
        # Se adicionou novas categorias acima, elas também serão salvas aqui
        db.session.commit()
        return jsonify(service.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        print(f"Erro na criação do serviço: {e}")
        # O erro 422 pode ser lançado aqui se a validação do SQLAlchemy falhar
        # Por exemplo, se time_chronos não for um inteiro válido, ou se o relacionamento user_entity for inválido
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
    current_user_id = get_jwt_identity()
    print(f"Current user ID (raw): {current_user_id}")
    print(f"Type of user ID: {type(current_user_id)}")
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