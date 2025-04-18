# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

# MongoDB Connection
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/checked_app')
client = MongoClient(mongo_uri)
db = client.get_database()
users_collection = db.users
checks_collection = db.checks

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if user already exists
    if users_collection.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists'}), 400
    
    # Create new user
    user = {
        'email': data['email'],
        'password': generate_password_hash(data['password']),
        'name': data.get('name', ''),
        'created_at': datetime.utcnow()
    }
    
    user_id = users_collection.insert_one(user).inserted_id
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = users_collection.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user['_id']))
    
    return jsonify({
        'token': access_token,
        'user_id': str(user['_id']),
        'name': user.get('name', '')
    }), 200

@app.route('/api/checks', methods=['GET'])
@jwt_required()
def get_checks():
    user_id = get_jwt_identity()
    
    checks = list(checks_collection.find({'user_id': user_id}))
    for check in checks:
        check['_id'] = str(check['_id'])
    
    return jsonify(checks), 200

@app.route('/api/checks', methods=['POST'])
@jwt_required()
def create_check():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    check = {
        'user_id': user_id,
        'name': data['name'],
        'description': data.get('description', ''),
        'periodicity': data['periodicity'],  # in minutes
        'last_checked': None,
        'created_at': datetime.utcnow(),
        'notification_enabled': data.get('notification_enabled', True)
    }
    
    check_id = checks_collection.insert_one(check).inserted_id
    
    return jsonify({
        'message': 'Check created successfully',
        'check_id': str(check_id)
    }), 201

@app.route('/api/checks/<check_id>', methods=['PUT'])
@jwt_required()
def update_check(check_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Make sure user owns this check
    check = checks_collection.find_one({'_id': ObjectId(check_id), 'user_id': user_id})
    if not check:
        return jsonify({'message': 'Check not found'}), 404
    
    # Update check
    updates = {}
    
    for field in ['name', 'description', 'periodicity', 'notification_enabled']:
        if field in data:
            updates[field] = data[field]
    
    if updates:
        checks_collection.update_one(
            {'_id': ObjectId(check_id)},
            {'$set': updates}
        )
    
    return jsonify({'message': 'Check updated successfully'}), 200

@app.route('/api/checks/<check_id>/record', methods=['POST'])
@jwt_required()
def record_check(check_id):
    user_id = get_jwt_identity()
    
    # Make sure user owns this check
    check = checks_collection.find_one({'_id': ObjectId(check_id), 'user_id': user_id})
    if not check:
        return jsonify({'message': 'Check not found'}), 404
    
    # Record the check time
    now = datetime.utcnow()
    checks_collection.update_one(
        {'_id': ObjectId(check_id)},
        {'$set': {'last_checked': now},
         '$push': {'history': now}}  # Optionally storing history
    )
    
    return jsonify({
        'message': 'Check recorded successfully',
        'checked_at': now
    }), 200

@app.route('/api/checks/<check_id>', methods=['GET'])
@jwt_required()
def get_check(check_id):
    user_id = get_jwt_identity()

    try:
        check = checks_collection.find_one({'_id': ObjectId(check_id), 'user_id': user_id})
    except:
        return jsonify({'message': 'Invalid check ID'}), 400

    if not check:
        return jsonify({'message': 'Check not found'}), 404

    check['_id'] = str(check['_id'])
    check['created_at'] = check['created_at'].isoformat()
    if check.get('last_checked'):
        check['last_checked'] = check['last_checked'].isoformat()
    if 'history' in check:
        check['history'] = [t.isoformat() for t in check['history']]

    return jsonify(check), 200



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
