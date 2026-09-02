from flask import Flask, render_template, redirect, url_for, request, flash, abort, session, jsonify 
from werkzeug.security import check_password_hash, generate_password_hash
from flask_wtf import FlaskForm
from werkzeug.utils import secure_filename
from flask_wtf.file import FileAllowed, FileRequired
from wtforms.validators import DataRequired
from wtforms import StringField, SubmitField, SearchField, validators, PasswordField
from wtforms.fields import FileField
import sqlite3
import os
import shutil

app = Flask(__name__)

links = {
            'Home':'index.html',
            'About':'MainWeb/about.html',
            'Contact':'MainWeb/contact.html',
            'Games':'MainWeb/games.html',
            'Music':'MainWeb/music.html',
            'Products':'MainWeb/products.html'
        }

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'static/uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
app.secret_key = os.getenv('key', None)

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
app.run(debug=True, port=5000, host='10.30.1.18')
