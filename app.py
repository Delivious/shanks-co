from flask import Flask, render_template, redirect, url_for, request, flash, abort, session, jsonify 
from itsdangerous import SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash
from flask_wtf import FlaskForm
from werkzeug.utils import secure_filename
from flask_wtf.file import FileAllowed, FileRequired
from wtforms.validators import DataRequired
from wtforms import StringField, SubmitField, SearchField, validators, PasswordField
from wtforms.fields import FileField
from flask_mail import Mail, Message
import sqlite3
import os
from dotenv import load_dotenv
import shutil

app = Flask(__name__)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'

links = {
            'Home':'index.html',
            'About':'MainWeb/about.html',
            'Contact':'MainWeb/contact.html',
            'Games':'MainWeb/games.html',
            'Music':'MainWeb/music.html',
            'Products':'MainWeb/products.html'
        }
load_dotenv('settings.env')
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = os.getenv('EMAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('EMAIL_PASS')
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
mail = Mail(app)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static/uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

app.secret_key = os.getenv('key', None)

def dbConnection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def generate_verification_token(email):
    serializer = URLSafeTimedSerializer(app.secret_key)
    return serializer.dumps(email, salt=app.secret_key)

def verify_email_token(token):
    serializer = URLSafeTimedSerializer(app.secret_key)
    try:
        email = serializer.loads(token, salt=app.secret_key, max_age=3600)
    except SignatureExpired:
        return None
    return email

def send_verification_email(email, verification_link):
    msg = Message('Email Verification', sender=app.config['MAIL_USERNAME'], recipients=[email])
    msg.body = f'Please click the following link to verify your email: {verification_link}'
    mail.send(msg)
with dbConnection() as db_connection:
    db_connection.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL, password TEXT NOT NULL)')
    db_connection.execute('CREATE TABLE IF NOT EXISTS servers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL)')
    db_connection.execute('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, server_id INTEGER NOT NULL, username TEXT NOT NULL, content TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (server_id) REFERENCES servers(id))')

@app.route('/')
def home():
    return render_template('index.html', links=links)

@app.route('/About')
def about():
    return render_template('MainWeb/about.html', links=links)

@app.route('/Contact')
def contact():
    return render_template('MainWeb/contact.html', links=links)

@app.route('/Games')
def games():
    return render_template('MainWeb/games.html', links=links)

@app.route('/Music')
def music():
    return render_template('MainWeb/music.html', links=links)

@app.route('/Products')
def products():
    return render_template('MainWeb/products.html', links=links)

@app.route('/login')
def login():
    return render_template('MainWeb/LoginPages/logIn.html', links=links)

@app.route('/signup')
def signup():
    return render_template('MainWeb/LoginPages/signUp.html', links=links)

@app.route('/Games/SilksongClicker')
def silksong_clicker():
    return render_template('MainWeb/games/silksongClicker/index.html', links=links)

@app.route('/Games/SpinningTriangle')
def spinning_triangle():
    return render_template('MainWeb/games/spinning-triangle/index.html', links=links)

@app.route('/signupForm', methods=['POST', 'GET'])
def signupForm():
    if request.method == 'POST':
        # Handle the signup form submission
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        # Here you would typically add code to create the user in your database
        stored_password = generate_password_hash(password)
        with dbConnection() as db_connection:
            if db_connection.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone():
                flash('Email already registered.', 'danger')
                return redirect(url_for('signup'))
            else:
                db_connection.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, stored_password))
        flash('Signup successful! Please check your email to verify your account.', 'success')

        # Send verification email
        token = generate_verification_token(email)
        verification_link = url_for('verify_email', token=token, _external=True)
        send_verification_email(email, verification_link)

        return redirect(url_for('login'))

    return render_template('MainWeb/LoginPages/signUp.html', links=links)

@app.route('/verify_email/<token>')
def verify_email(token):
    email = verify_email_token(token)
    if email:
        flash('Email verified successfully!', 'success')
    else:
        flash('Email verification link is invalid or has expired.', 'danger')
    return redirect(url_for('login'))

@app.route('/loginForm', methods=['POST', 'GET'])
def loginForm():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        with dbConnection() as db_connection:
            user = db_connection.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
            if user and check_password_hash(user['password'], password):
                flash('Login successful!', 'success')
                session['user_id'] = user['id']
                session['username'] = user['username']
                return redirect(url_for('home'))
            else:
                flash('Invalid email or password.', 'danger')

    return render_template('MainWeb/LoginPages/logIn.html', links=links)
@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))
@app.route('/Games/ChatApp', methods=['GET', 'POST'])
def chat_app():
    with dbConnection() as db_connection:
        servers = db_connection.execute('SELECT * FROM servers').fetchall()
        messages = db_connection.execute('SELECT * FROM messages ORDER BY timestamp DESC').fetchall()
    if 'user_id' not in session:
        flash('You need to be logged in to access the chat.', 'danger')
        return redirect(url_for('login'))
    if request.method == 'POST':
        content = request.form.get('message')
        if content:
            with dbConnection() as db_connection:
                db_connection.execute('INSERT INTO messages (server_id, username, content) VALUES (?, ?, ?)', (session['server_id'], session['username'], content))
            flash('Message sent!', 'success')
            return redirect(url_for('chat_app'))
    return render_template('MainWeb/games/chatApp/index.html', links=links, servers=servers, messages=messages)
@app.route('/Games/ChatApp/CreateServer', methods=['POST'])
def create_server():
    if 'user_id' not in session:
        flash('You need to be logged in to create a server.', 'danger')
        return redirect(url_for('login'))
    if request.method == 'POST':
        name = request.form.get('serverName')
        description = request.form.get('serverDescription')
        if name and description:
            with dbConnection() as db_connection:
                db_connection.execute('INSERT INTO servers (name, description) VALUES (?, ?)', (name, description))
            flash('Server created successfully!', 'success')
        else:
            flash('Please provide both a name and description for the server.', 'danger')
        return redirect(url_for('chat_app'))
    return render_template('MainWeb/games/chatApp/createServer.html', links=links)
#app.run(debug=True, port=5000, host='10.30.2.10')
#app.run(debug=True, port=5000, host='172.17.17.87')
#app.run(debug=True, port=5000, host='10.30.2.12')
app.run(debug=True, port=5000, host='172.20.10.7')