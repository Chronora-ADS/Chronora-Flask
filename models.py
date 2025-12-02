# models.py
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import base64

# Criar db separadamente, sem importar de app
db = SQLAlchemy()

# Modelo para Documento (um documento associado a um usuário)
class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False) # Nome do arquivo
    type = db.Column(db.String(100), nullable=False) # Tipo MIME (ex: image/png)
    data = db.Column(db.LargeBinary, nullable=False) # Dados binários do arquivo
    # Chave estrangeira para o usuário proprietário do documento
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relacionamento com User (muitos Documentos pertencem a um User)
    user = db.relationship('User', back_populates='document')

    def to_dict(self):
        """Converte o objeto Document para um dicionário."""
        # Atenção: não serializar 'data' para JSON em endpoints públicos por motivos de segurança e desempenho
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type
        }

# Modelo para Categoria (uma categoria que pode ser associada a um serviço)
class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False) # Nome único da categoria

    # Relacionamento muitos-para-muitos com Service via tabela associativa
    # services = db.relationship('Service', secondary='service_categories', back_populates='categories')

# Tabela associativa para relacionamento Service-Category
service_categories = db.Table('service_categories',
    db.Column('service_id', db.Integer, db.ForeignKey('services.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True)
)

# Modelo para Usuário
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone_number = db.Column(db.BigInteger, unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    roles = db.Column(db.JSON, default=['user']) # Armazena como JSON

    # Relacionamento com Documento (um usuário tem um documento)
    # A chave estrangeira está em Document, não aqui em User.
    # Usamos 'foreign_keys' para especificar qual FK usar no relacionamento unidirecional ou bidirecional
    # 'uselist=False' indica que é um relacionamento um-para-um (um usuário tem um documento)
    document = db.relationship('Document', back_populates='user', uselist=False, foreign_keys='Document.user_id')

    # Relacionamento com Serviços criados (um usuário pode criar muitos serviços)
    services = db.relationship('Service', back_populates='user_entity')

    def set_password(self, password):
        """Criptografa e armazena a senha."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se a senha fornecida corresponde ao hash armazenado."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_document=False):
        """Converte o objeto User para um dicionário."""
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone_number': self.phone_number,
            'roles': self.roles
        }
        # Inclui documento apenas se necessário (ex: rota específica de perfil)
        if include_document and self.document:
            user_dict['document'] = self.document.to_dict()
        return user_dict

# No modelo Service, descomente e ajuste o relacionamento:
class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    time_chronos = db.Column(db.Integer, nullable=False)
    service_image = db.Column(db.LargeBinary, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_entity = db.relationship('User', back_populates='services')

    # Relacionamento com Categorias (AGORA ATIVADO)
    categories = db.relationship('Category', secondary=service_categories, backref='services')

    def to_dict(self):
        image_base64 = base64.b64encode(self.service_image).decode('utf-8') if self.service_image else None
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'timeChronos': self.time_chronos,
            'serviceImage': image_base64,
            'userEntity': {
                'id': self.user_entity.id,
                'name': self.user_entity.name,
                'email': self.user_entity.email
            },
            # Inclui categorias no retorno
            'categoryEntities': [{'id': cat.id, 'name': cat.name} for cat in self.categories]
        }