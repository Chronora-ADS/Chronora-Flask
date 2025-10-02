from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = 'segredo-muito-fortissimo-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-muito-mesmo' 

# --- Routes ---

@app.route('/')
@app.route('/main') 
def main_page():
    
    return render_template('Main.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('senha') # Note: 'senha' from HTML
        # Example validation (replace with real logic)
        if email and password:
             flash('Login successful!', 'success')
             return redirect(url_for('main_page'))
        else:
            flash('Invalid credentials', 'error')
    return render_template('Login.html')

@app.route('/account_creation', methods=['GET', 'POST'])
def account_creation():
    if request.method == 'POST':
        # Add logic here to handle account creation form submission
        # Validate data, hash password, save to database, etc.
        nome = request.form.get('nome')
        email = request.form.get('email')
        celular = request.form.get('celular')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        # Example validation (replace with real logic)
        if senha == confirmar_senha: # Replace with actual checks
             flash('Account created successfully!', 'success')
             return redirect(url_for('login'))
        else:
            flash('Passwords do not match', 'error')
    return render_template('AccountCreation.html')

@app.route('/service_creation', methods=['GET', 'POST'])
def service_creation():
    if request.method == 'POST':
        # Add logic here to handle service creation form submission
        # Validate data, save to database, handle image upload, etc.
        titulo = request.form.get('titulo')
        descricao = request.form.get('descricao')
        tempo_chronos = request.form.get('tempoChronos') # Note: 'tempoChronos' from HTML
        # Example validation (replace with real logic)
        if titulo and descricao and tempo_chronos: # Replace with actual checks
             flash('Service created successfully!', 'success')
             return redirect(url_for('main_page'))
        else:
            flash('Please fill in all required fields', 'error')
    return render_template('ServiceCreation.html')

@app.route('/forgot_password')
def forgot_password():
    # Add logic here for forgot password page
    return render_template('ForgotPassword.html') # Assuming you have this template

# --- Run the application ---
if __name__ == '__main__':
    app.run(debug=True) # Set debug=False for production