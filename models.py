# models.py
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import base64

# Usa a mesma instância do db que será criada no app.py
db = SQLAlchemy()

# Tabela associativa para relacionamento Service-Category
service_categories = db.Table('service_categories',
    db.Column('service_id', db.Integer, db.ForeignKey('services.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('categories.id'), primary_key=True)
)

# Modelo para Documento
class Document(db.Model):
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    user = db.relationship('User', back_populates='document')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type
        }

# Modelo para Categoria
class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)

# Modelo para Usuário
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone_number = db.Column(db.BigInteger, unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    roles = db.Column(db.JSON, default=['user'])

    document = db.relationship('Document', back_populates='user', uselist=False, foreign_keys='Document.user_id')
    services = db.relationship('Service', back_populates='user_entity')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_document=False):
        user_dict = {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone_number': self.phone_number,
            'roles': self.roles
        }
        if include_document and self.document:
            user_dict['document'] = self.document.to_dict()
        return user_dict

# Modelo para Serviço
class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    time_chronos = db.Column(db.Integer, nullable=False)
    service_image = db.Column(db.LargeBinary, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    user_entity = db.relationship('User', back_populates='services')
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
            'categoryEntities': [{'id': cat.id, 'name': cat.name} for cat in self.categories]
        }